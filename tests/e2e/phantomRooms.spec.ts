import { expect, test, type Page } from '@playwright/test';
import { start, waitForScene, watch } from './helpers/newUi';
import { fitProblems, onPage, pview, toPhantomMap } from './helpers/phantomUi';

// The Phantom UI, slice 7: pages for screens the mock-ups had none for (they wore the stand-in look before): the
// Research Tree, the Exchange Counter, the Rescue, the Siege map and the League counter-pick. Each is opened the way
// the New look's own test opens it, steered by keys and clicks, and checked for text that is cut off.

const fits = async (page: Page, key: string, id: string) => { await page.waitForTimeout(900); expect(await fitProblems(page, key, id), id).toEqual([]); };
/** No New-look page is left showing for the scene (the stand-in look). */
const noStandIn = (page: Page, key: string) => expect(page.locator(`#rx .stage[data-scene="${key}"].phfb:visible`)).toHaveCount(0);

test('Phantom UI: the Research Tree and the Exchange Counter are Phantom pages', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=phantom');
  await onPage(page, 'MainMenu', 'title');
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    pkr.session.profile.researchPoints = 140;
    pkr.session.profile.bankCredits = 600;
    pkr.session.profile.bankTier = 3;
    pkr.game.scene.getScene('MainMenu').scene.start('Hub');
  });
  await waitForScene(page, 'Hub');
  await onPage(page, 'Hub', 'dock');
  await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('Hub').enter('tree'));
  await onPage(page, 'Hub', 'tree');
  const tree = pview(page, 'Hub', 'tree');
  await noStandIn(page, 'Hub');
  // A row per branch; the lit node's card says what it costs, over the button.
  await expect(tree.locator('.ph-res-row')).toHaveCount(3);
  await expect(tree.locator('.ph-res-n.on')).toHaveCount(1);
  await expect(tree.locator('.ph-res-card .tl1')).toHaveText('Field Notes');
  await expect(tree.locator('.ph-res-card')).toContainText('Research Points');
  await expect(tree.locator('.ph-xchips')).toContainText('140 Research Points');
  await fits(page, 'Hub', 'tree');
  await page.screenshot({ path: 'test-results/phantom-tree.png' });
  // The keys move in a grid; the mouse lights a node too.
  await page.keyboard.press('ArrowDown');
  await expect(tree.locator('.ph-res-card .tl1')).toHaveText('Region Notes');
  await page.waitForTimeout(150);
  await page.keyboard.press('ArrowRight');
  await expect(tree.locator('.ph-res-card .tl1')).toHaveText('League Files');
  await expect(tree.locator('.ph-res-go .blade')).toHaveClass(/\boff\b/);
  await fits(page, 'Hub', 'tree');
  await tree.locator('.ph-res-n').first().hover();
  await expect(tree.locator('.ph-res-card .tl1')).toHaveText('Field Notes');
  // Enter researches the lit node: the points go down and the node is marked.
  const before = await page.evaluate(() => (window as any).__pkr.session.profile.researchPoints as number);
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.session.profile.researchPoints as number)).toBeLessThan(before);

  // The Exchange Counter: two offers, one blade per lot size, what the player holds as chips.
  await page.evaluate(() => { const hub = (window as any).__pkr.game.scene.getScene('Hub'); hub.closePicker?.(); hub.openExchange(); });
  await onPage(page, 'Hub', 'counter');
  const counter = pview(page, 'Hub', 'counter');
  await expect(counter.locator('.ph-it')).toHaveCount(2);
  await expect(counter.locator('.ph-xc-go .blade')).toHaveCount(2);
  await expect(counter.locator('.ph-xc-go .blade.on')).toHaveCount(1);
  await expect(counter.locator('.ph-xchips')).toContainText('600');
  await fits(page, 'Hub', 'counter');
  await page.screenshot({ path: 'test-results/phantom-counter.png' });
  await page.keyboard.press('ArrowRight');
  await expect(counter.locator('.ph-xc-go .blade').nth(1)).toHaveClass(/\bon\b/);
  await page.waitForTimeout(150);
  await page.keyboard.press('ArrowDown');
  await expect(counter.locator('.ph-it').nth(1)).toHaveClass(/\bon\b/);
  await fits(page, 'Hub', 'counter');
  // A click on a blade exchanges that many lots.
  const credits = await page.evaluate(() => (window as any).__pkr.session.profile.bankCredits as number);
  await counter.locator('.ph-it').first().click();
  await page.waitForTimeout(250);
  await pview(page, 'Hub', 'counter').locator('.ph-xc-go .blade').first().click();
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.session.profile.bankCredits as number)).toBeLessThan(credits);
  expect(errors).toEqual([]);
});

test('Phantom UI: the Siege map is a ledger of districts; keys and clicks move over them and a free gate lets you in', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=e4-siege');
  await toPhantomMap(page);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    const d = (id: string, name: string, place: string | null, status: string, heldBy: string, ifLost: string, gate = true) => ({ id, name, place, status, heldBy, ifLost, gate });
    const districts = [
      d('north-gate', 'North Gate', 'Route 5', 'held', 'Your rival', "The rival's battle is added to Phase 1 instead of removed"),
      d('east-gate', 'East Gate', 'Route 8', 'held', 'Officer Jenny', 'Reinforcements arrive one turn sooner in Phase 4'),
      d('south-gate', 'South Gate', 'Route 6', 'contested', '', 'Major Surge joins Phase 3 as a third duel'),
      d('west-gate', 'West Gate', 'Route 7', 'lost', '', 'Shinobi Koga poisons the Breather (heal 35% instead of 50%)'),
      d('center', 'The Center', null, 'contested', 'Oracle Sabrina', 'See Phase 1', false),
    ];
    run.expansion = { ...(run.expansion ?? {}), cut: { format: { id: 'siege', state: { region: 'kanto', districts, entered: null, pending: null, tries: 0 } } } };
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Siege');
  await onPage(page, 'Siege', 'siege');
  const siege = pview(page, 'Siege', 'siege');
  await noStandIn(page, 'Siege');
  await expect(siege.locator('.ph-sg-r')).toHaveCount(5);
  await expect(siege.locator('.ph-sg-lost')).toContainText('West Gate: Shinobi Koga poisons the Breather');
  // The cursor starts on a free gate.
  const go = siege.locator('.ph-sg-go .blade');
  await expect(go).toContainText('Enter by North Gate');
  await expect(siege.locator('.ph-sg-card')).toContainText('Your rival');
  await fits(page, 'Siege', 'siege');
  await page.screenshot({ path: 'test-results/phantom-siege.png' });
  // The page itself never scrolls, though its backdrop is far bigger than it: a "scroll into view" moves nothing.
  expect(await page.evaluate(() => {
    const sec = document.querySelector('#phx .phs[data-scene="Siege"] section') as HTMLElement;
    sec.querySelector('.ph-sg-go .blade')!.scrollIntoView({ block: 'end', inline: 'end' });
    sec.scrollTo(300, 200);
    return [sec.scrollLeft, sec.scrollTop, sec.scrollWidth > sec.clientWidth];
  })).toEqual([0, 0, true]);
  // Down the ledger: east, then south (a contested gate: one battle), then west, then the middle, which has no gate.
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(150);
  await page.keyboard.press('ArrowDown');
  await expect(go).toContainText('Enter by South Gate');
  await expect(siege.locator('.ph-sg-card')).toContainText('One battle');
  await fits(page, 'Siege', 'siege');
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(150);
  await page.keyboard.press('ArrowDown');
  await expect(go).toContainText('No gate here');
  await expect(go).toHaveClass(/\boff\b/);
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.expansion.cut.format.state.entered)).toBeNull();
  // A click moves the cursor; the button goes in. A held gate is free: no battle starts.
  await siege.locator('.ph-sg-r').nth(1).click();
  await expect(go).toContainText('Enter by East Gate');
  await go.click();
  await expect(go).toContainText('Begin Phase 1');
  await expect(siege.locator('.ph-say')).toContainText('You went in by the East Gate');
  await fits(page, 'Siege', 'siege');
  await go.click();
  await waitForScene(page, 'Map');
  const out = await page.evaluate(() => (window as any).__pkr.session.run.expansion);
  expect(out.siege.entered).toBe('kanto.east-gate');
  expect(errors).toEqual([]);
});

test('Phantom UI: the Rescue is a Phantom page: the slip, the holding clock, the plans with their odds words', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=rescue-screen&debug=1');
  await toPhantomMap(page);
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const run = session.run;
    const base = JSON.parse(JSON.stringify(run.party[0]));
    const held = [1, 2].map((i) => ({ ...JSON.parse(JSON.stringify(base)), uid: `held-${i}` }));
    run.expansion = {
      rival: { blue: { role: 'main', personality: 'champion-chaser', style: 'blitz', arc: 'prodigy-learns-humility', lead: 0, marks: [], feelings: { friendship: 3, respect: 3, trust: 3, rivalry: 3, resentment: 0, admiration: 2 }, pityLosses: 0 } },
      rescue: {
        holds: [{ id: 'h1-kanto', teamId: 'rocket', regionId: 'kanto', pokemon: held, impoundNode: -10, waitNodes: 9, lastQuietNode: 50, dueAt: 0, receipt: true, offers: 0, declines: 0, lastDeclineNode: null, lateDue: false, late: false, frozenAt: null, accepted: null, warrantAt: null, heldAtClimax: false }],
        active: null, returned: [], attitude: 0, balloonUsed: false, memory: [], flags: {}, log: [], lost: [],
      },
    };
    game.scene.getScene('Map').scene.restart();
  });
  await waitForScene(page, 'Rescue');
  await onPage(page, 'Rescue', 'rescue');
  const rescue = pview(page, 'Rescue', 'rescue');
  await noStandIn(page, 'Rescue');
  await expect(rescue.locator('.ph-rq-slip')).toContainText('IMPOUND RECEIPT', { ignoreCase: true });
  await expect(rescue.locator('.ph-rq-clock')).toContainText('Holding clock', { ignoreCase: true });
  // The rival speaks first; the plans wait until every line is read (a click or Enter turns the page).
  await expect(rescue.locator('.ph-say .lab')).toHaveText('Blue');
  await expect(rescue.locator('.ph-rq-o')).toHaveCount(0);
  await fits(page, 'Rescue', 'rescue');
  await page.screenshot({ path: 'test-results/phantom-rescue.png' });
  const read = async () => {
    for (let i = 0; i < 6 && (await rescue.locator('.ph-op-any').count()) > 0; i++) {
      await rescue.locator('.ph-op-any').click();
      await page.waitForTimeout(250);
    }
  };
  await read();
  // Five plans and "wait": each open plan with a roll shows a word, never a number.
  await expect(rescue.locator('.ph-rq-o')).toHaveCount(6);
  await expect(rescue.locator('.ph-rq-o').first()).toContainText('Quiet Extraction');
  await expect(rescue.locator('.ph-rq-o').first().locator('em')).toHaveText(/^(Risky|Even|Likely|Safe)$/);
  await expect(rescue.locator('.ph-rq-o').last()).toContainText('Wait for a better day');
  await fits(page, 'Rescue', 'rescue');
  await page.screenshot({ path: 'test-results/phantom-rescue-plans.png' });
  await page.keyboard.press('ArrowUp');
  await expect(rescue.locator('.ph-say')).toContainText('The offer will come back.');
  await expect(rescue.locator('.ph-rq-o').last()).toHaveClass(/\bon\b/);
  await page.waitForTimeout(150);
  await page.keyboard.press('ArrowDown');
  // Quiet Extraction: the plan's steps take the clock's place and the answers are the rows.
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await expect(rescue.locator('.ph-rq-clock')).toContainText('The plan', { ignoreCase: true });
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.session.run.expansion.rescue.active?.plan ?? null)).toBe('quiet');
  await read();
  await expect(rescue.locator('.ph-rq-o')).toHaveCount(3);
  await fits(page, 'Rescue', 'rescue');
  await page.screenshot({ path: 'test-results/phantom-rescue-step.png' });
  // Esc gives the plan up; "Wait for a better day" puts the rescue off and the map comes back.
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.session.run.expansion.rescue.active)).toBeNull();
  await expect(rescue.locator('.ph-rq-clock')).toContainText('Holding clock', { ignoreCase: true, timeout: 15_000 });
  await page.waitForTimeout(400);
  await read();
  await rescue.locator('.ph-rq-o').last().click();
  await waitForScene(page, 'Map');
  expect(errors).toEqual([]);
});

test('Phantom UI: the League counter-pick is a Phantom page: pick a boxed Pokémon, swap the answered one out, and the result stays until Enter', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=door1');
  await toPhantomMap(page);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    const base = run.party[0];
    const mk = (speciesId: string, level: number, i: number) => ({ ...structuredClone(base), uid: `t${i}-${speciesId}`, speciesId, level });
    run.party = [mk('charizard', 52, 0), mk('lucario', 51, 1), mk('gengar', 50, 2), mk('gyarados', 50, 3), mk('garchomp', 49, 4), mk('pikachu', 48, 5)];
    run.box = [mk('snorlax', 50, 6), mk('dragonite', 49, 7), mk('tyranitar', 48, 8)];
    run.expansion = { ...(run.expansion ?? {}), league: { registered: run.party.map((m: any) => m.uid), swapped: false } };
    const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
    run.phase = 'decision';
    run.pending = [{
      kind: 'leagueDoor', title: 'The League has read your team (6 registered). Swap one before the first battle?', outUid: run.party[0].uid, swapIns: run.box.map((m: any) => m.uid),
      options: [{ label: 'Keep my team', description: 'Go in with the Pokémon you registered.' }, ...run.box.map((m: any) => ({ label: `Swap in ${cap(m.speciesId)} (Lv ${m.level})`, description: `Replaces Charizard, the Pokémon the Elite Four will answer most. The League has not seen ${cap(m.speciesId)}.` }))],
    }];
    pkr.game.scene.getScene('Map').scene.start('Decision');
  });
  await waitForScene(page, 'Decision');
  await onPage(page, 'Decision', 'counterpick');
  const door = pview(page, 'Decision', 'counterpick');
  await noStandIn(page, 'Decision');
  await expect(door.locator('.ph-lc-t')).toHaveCount(6);
  await expect(door.locator('.ph-lc-t.answer')).toContainText('Charizard');
  await expect(door.locator('.ph-lc-t.answer small')).toHaveText('The League will answer this');
  await expect(door.locator('.ph-lc-b')).toHaveCount(3);
  await expect(door.locator('.ph-lc-go .blade')).toHaveText(['Swap Charizard out', 'Keep my team']);
  await expect(door.locator('.ph-say .lab')).toHaveText('Registrar');
  await fits(page, 'Decision', 'counterpick');
  await page.screenshot({ path: 'test-results/phantom-counter-pick.png' });
  // Pick Dragonite (the second boxed one), then the swap blade.
  await door.locator('.ph-lc-b').nth(1).hover();
  await expect(door.locator('.ph-lc-b').nth(1)).toHaveClass(/\bon\b/);
  await door.locator('.ph-lc-b').nth(1).click();
  await expect(door.locator('.ph-lc-b').nth(1).locator('em')).toHaveText('Pick');
  await fits(page, 'Decision', 'counterpick');
  await door.locator('.ph-lc-go .blade').first().click();
  // The result stays until an input.
  await expect(door.locator('.ph-lc-go')).toHaveCount(0);
  await expect(door.locator('.ph-say')).toContainText('Dragonite');
  await fits(page, 'Decision', 'counterpick');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.party.map((m: any) => m.speciesId))).toContain('dragonite');
  await page.keyboard.press('Enter');
  await expect(pview(page, 'Decision', 'counterpick')).toHaveCount(0);
  expect(errors).toEqual([]);
});
