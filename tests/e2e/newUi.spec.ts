import { expect, test, type Page } from '@playwright/test';
import { confirmToMenu, confirmUntil } from './battleInput';

// The New UI (Settings > UI style: New, the default for players): the mock-up screens are an HTML layer over the
// canvas, so this spec drives the game by clicking that layer. The older specs run with the Old UI (an automated
// browser gets Old unless the address asks for `?ui=new`), so both styles stay covered.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
const view = (page: Page, key: string) => page.locator(`#rx .stage[data-scene="${key}"]`);

async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

function watch(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

async function start(page: Page, query: string) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/?${query}`);
  await waitForScene(page, 'MainMenu');
}

/** Title to the stage map with the keyboard; each screen on the way that has a mock-up must show its New view. */
async function toMap(page: Page) {
  await expect(view(page, 'MainMenu')).toBeVisible();
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
    if (next !== 'Hub') await expect(view(page, next)).toBeVisible();
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
}

/** Stands the run on a first-column node with this side stop beside it. */
async function addSide(page: Page, side: Record<string, unknown>) {
  await page.evaluate((side) => {
    const run = (window as any).__pkr.session.run;
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push(side);
    run.stage.current = node.id;
    if (!run.stage.visited.includes(node.id)) run.stage.visited.push(node.id);
  }, side);
}

test('New UI: the mock-up screens show from the title to the map, and a click on a stop travels', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  // The map's stops are buttons in the layer: clicking a lit one starts the trip to its battle.
  const stop = view(page, 'Map').locator('.nd.go').first();
  await expect(stop).toBeVisible();
  await stop.click();
  await waitForScene(page, 'Battle', 30_000);
  expect(errors).toEqual([]);
});

test('New UI: an event is played with clicks (choice, outcome text, results) and returns to the map', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  await addSide(page, { id: 'nu-event', kind: 'event', used: false, eventId: 'pokemon-center' });
  await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('Map').scene.start('Event', { sideId: 'nu-event' }));
  await waitForScene(page, 'Event');
  const ev = view(page, 'Event');
  await expect(ev).toContainText('Pokémon Center');
  await ev.locator('[data-act="pick"]').first().click();
  // The outcome text stays until the player moves on; the results come after it.
  await expect(ev.locator('[data-act="next"]')).toBeVisible({ timeout: 10_000 });
  await expect(ev).not.toContainText('Outcome');
  await page.waitForTimeout(700);
  await ev.locator('[data-act="next"]').click();
  await expect(ev).toContainText('Outcome', { timeout: 10_000 });
  await page.waitForTimeout(1500);
  await ev.locator('[data-act="next"]').click();
  await waitForScene(page, 'Map');
  const used = await page.evaluate(() => (window as any).__pkr.session.run.stage.map.nodes.flatMap((n: any) => n.sides).find((s: any) => s.id === 'nu-event')?.used);
  expect(used).toBe(true);
  expect(errors).toEqual([]);
});

test('New UI: a long event script is read page by page; choices wait for the last page, rewards for the last outcome page', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  await page.evaluate(() => {
    const e = (window as any).__pkr.session.content.events.get('pokemon-center');
    e.intro = 'The doors slide open.\nRain drums on the roof.\n\nNurse Joy: "A trainer, at this hour?"\n\nShe points at the machine.';
    e.choices[0].success.text = 'Nurse Joy: "There. All healed."\n\nThe machine goes quiet.';
  });
  await addSide(page, { id: 'nu-pages', kind: 'event', used: false, eventId: 'pokemon-center' });
  await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('Map').scene.start('Event', { sideId: 'nu-pages' }));
  await waitForScene(page, 'Event');
  const ev = view(page, 'Event');
  // Page 1: both of its lines, no choices yet, nothing from later pages.
  await expect(ev).toContainText('The doors slide open.');
  await expect(ev).toContainText('Rain drums on the roof.');
  await expect(ev).toContainText('1/3');
  await expect(ev).not.toContainText('at this hour');
  await expect(ev.locator('[data-act="pick"]')).toHaveCount(0);
  // Enter on a page that is not the last one never picks a choice.
  await page.keyboard.press('Enter');
  await expect(ev).toContainText('A trainer, at this hour?');
  await expect(ev).toContainText('Nurse Joy');
  await expect(ev).not.toContainText('The doors slide open.');
  expect(await scene(page)).toBe('Event');
  await expect(ev.locator('[data-act="pick"]')).toHaveCount(0);
  // A click anywhere turns the page too; Esc goes back one.
  await ev.locator('[data-act="page"]').click({ position: { x: 400, y: 200 } });
  await expect(ev).toContainText('She points at the machine.');
  await expect(ev.locator('[data-act="pick"]')).not.toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(ev).toContainText('A trainer, at this hour?');
  await page.keyboard.press('Enter');
  await expect(ev).toContainText('3/3');
  await ev.locator('[data-act="pick"]').first().click();
  // Outcome page 1 of 2: no rewards yet.
  await expect(ev).toContainText('There. All healed.', { timeout: 10_000 });
  await expect(ev).not.toContainText('The machine goes quiet.');
  await page.waitForTimeout(700);
  await page.keyboard.press('Enter');
  await expect(ev).toContainText('The machine goes quiet.');
  await expect(ev).not.toContainText('Outcome');
  await page.keyboard.press('Enter');
  await expect(ev).toContainText('Outcome', { timeout: 10_000 });
  await page.waitForTimeout(1500);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Map');
  expect(errors).toEqual([]);
});

test('New UI: a tournament event shows its rounds, and B opens the bracket (group pages, close)', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  await addSide(page, { id: 'nu-tourney', kind: 'event', used: false, eventId: 'cs-kanto-saffron-t2' });
  await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('Map').scene.start('Event', { sideId: 'nu-tourney' }));
  await waitForScene(page, 'Event');
  const ev = view(page, 'Event');
  // The strip: five rounds, the Round of 16 is next.
  await expect(ev).toContainText('Round of 32');
  await expect(ev).toContainText('▶ Round of 16');
  await expect(ev).toContainText('Final');
  await page.keyboard.press('b');
  await expect(ev).toContainText('Saffron Fighting Tournament');
  await expect(ev).toContainText('16 still in');
  // Group A is the player's group; the finals are not decided yet, so that page shows no names.
  await expect(ev.locator('[data-act="bracketPage"]')).toHaveCount(5);
  await expect(ev).toContainText('★');
  await ev.locator('[data-act="bracketPage"]').nth(4).click();
  await expect(ev).toContainText('Champion');
  await expect(ev).not.toContainText('★');
  // Left wraps back through the groups; Esc closes without leaving the event or picking anything.
  await page.keyboard.press('ArrowRight');
  await expect(ev).toContainText('★');
  await page.keyboard.press('Escape');
  await expect(ev).not.toContainText('Saffron Fighting Tournament');
  await expect(ev).toContainText('▶ Round of 16');
  expect(await scene(page)).toBe('Event');
  // A click on the strip opens it as well.
  await ev.locator('[data-act="bracket"]').first().click();
  await expect(ev).toContainText('Saffron Fighting Tournament');
  await page.keyboard.press('b');
  await expect(ev).not.toContainText('Saffron Fighting Tournament');
  expect(errors).toEqual([]);
});

test('New UI: a pseudo-stage opens from its gate and draws as a stage map of rooms', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  await addSide(page, { id: 'nu-gate', kind: 'event', used: false, eventId: 'ps-safari-zone-gate' });
  await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('Map').scene.start('Event', { sideId: 'nu-gate' }));
  await waitForScene(page, 'Event');
  const ev = view(page, 'Event');
  await expect(ev).toContainText('Safari Zone');
  await expect(ev.locator('[data-act="pick"]').first()).toContainText('Enter Safari Zone');
  await ev.locator('[data-act="pick"]').first().click();
  await expect(ev.locator('[data-act="next"]')).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(700);
  await ev.locator('[data-act="next"]').click();
  // The outcome has a results step only when something changed; either way the next press leaves.
  await page.waitForTimeout(1500);
  if ((await scene(page)) === 'Event') await ev.locator('[data-act="next"]').click();
  await waitForScene(page, 'Map');
  const pseudo = await page.evaluate(() => { const s = (window as any).__pkr.session.run.stage; return { name: s.pseudo?.name ?? null, rooms: s.map.nodes.length }; });
  expect(pseudo.name).toBe('Safari Zone');
  const map = view(page, 'Map');
  await expect(map).toContainText('Safari Zone');
  await expect(map).toContainText('Inside Stage 1');
  // It is not a stage of its own: its line says so in place of a Gym Leader.
  await expect(map).toContainText('not a stage of its own');
  await expect(map.locator('.nd')).toHaveCount(pseudo.rooms);
  expect(errors).toEqual([]);
});

test('New UI: learning a move asks with the mock-up decision screen and its Yes/No box', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  const before = await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const run = session.run;
    const mon = run.party[0];
    const known = mon.moves.map((m: any) => m.id);
    const moveId = [...session.content.moves.keys()].find((id: string) => !known.includes(id) && session.content.moves.get(id).power);
    // Fill the move list so learning must replace one.
    const extra = [...session.content.moves.keys()].filter((id: string) => !known.includes(id) && id !== moveId);
    while (mon.moves.length < 4) { const id = extra.shift(); mon.moves.push({ id, pp: session.content.moves.get(id).pp }); }
    run.phase = 'decision';
    run.pending = [{ kind: 'learnMove', uid: mon.uid, moveId }];
    for (const s of game.scene.getScenes(true)) game.scene.stop(s.scene.key);
    game.scene.start('Decision');
    return { moveId, first: mon.moves[0].id };
  });
  await waitForScene(page, 'Decision');
  const dec = view(page, 'Decision').first();
  await expect(dec).toContainText('wants to learn');
  await dec.locator('[data-act="pick"]').first().click();
  // The confirm box is its own layer on top; "Yes" is its first button.
  const yes = page.locator('#rx [data-act="confirm"]').first();
  await expect(yes).toBeVisible();
  await yes.click();
  await expect(dec.locator('[data-act="done"]').first()).toBeVisible({ timeout: 10_000 });
  const moves = await page.evaluate(() => (window as any).__pkr.session.run.party[0].moves.map((m: any) => m.id));
  expect(moves).toContain(before.moveId);
  expect(moves).not.toContain(before.first);
  await page.waitForTimeout(500);
  await dec.locator('[data-act="done"]').first().click();
  await expect.poll(() => scene(page), { timeout: 15_000 }).not.toBe('Decision');
  expect(errors).toEqual([]);
});

test('New UI: the Hub is the dock (two tabs of six buttons); its Town page walks Hub Town and the menu leads back', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Hub');
  const dock = view(page, 'Hub').first();
  const buttons = dock.locator('[data-act="pick"]');
  const names = async () => (await buttons.allInnerTexts()).map((t) => t.trim());
  await expect(buttons).toHaveCount(6);
  expect(await names()).toEqual(['Settings', 'Trainers', 'New Run', 'Events', 'Unlocks', 'Town']);
  await expect(dock.locator('.tabs .on')).toHaveText('Town');
  // A click on the other tab swaps the six buttons; a second click on the first tab brings them back.
  await dock.locator('[data-act="tab"]').nth(1).click();
  await expect(dock.locator('.tabs .on')).toHaveText('Last run');
  expect(await names()).toEqual(['Hall of Fame', 'Team', 'Run History', 'Memories', 'Moments', 'Seeds']);
  await dock.locator('[data-act="tab"]').nth(0).click();
  await expect(dock.locator('.tabs .on')).toHaveText('Town');
  // A button with several rooms opens their page as a list on top; Esc closes it again.
  await buttons.nth(4).click();
  await expect(view(page, 'Hub')).toHaveCount(2);
  await expect(view(page, 'Hub').nth(1)).toContainText('Unlocks');
  await expect(view(page, 'Hub').nth(1)).toContainText('Bank');
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await expect(view(page, 'Hub')).toHaveCount(1);
  // Town > Hub Town: the dock goes away and the town is walked on the canvas.
  await buttons.nth(5).click();
  await expect(view(page, 'Hub').nth(1)).toContainText('Hub Town');
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await expect(view(page, 'Hub')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Hub').town)), { timeout: 20_000 }).toBe(true);
  await page.waitForTimeout(600);
  // Esc opens the menu; its first row is the way back to the dock.
  await page.keyboard.press('Escape');
  await expect(view(page, 'Hub').first()).toContainText('Hub dock');
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await expect(view(page, 'Hub').first().locator('[data-act="pick"]')).toHaveCount(6);
  await expect.poll(() => page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Hub').town))).toBe(false);
  // The dock remembers its button (Town); the keys walk back to New Run, which starts a run.
  await page.waitForTimeout(400);
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowLeft');
  await expect(view(page, 'Hub').first().locator('.btn.on')).toHaveText('New Run');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'TrainerSelect');
  expect(errors).toEqual([]);
});

test('New UI: Party opens as the mock-up page; Enter opens the Summary with its tabs and the action menu', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  // A second Pokémon, so the page has a row to move to and an order to change.
  await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    const twin = JSON.parse(JSON.stringify(run.party[0]));
    twin.uid = 'e2e-twin';
    twin.level = 9;
    run.party.push(twin);
  });
  await view(page, 'Map').first().locator('[data-act="pick"]', { hasText: 'Party' }).first().click();
  const top = () => view(page, 'Map').last();
  await expect(top().locator('.hd')).toContainText('Party');
  await expect(top().locator('[data-act="pick"]')).toHaveCount(2);
  // The second card opens its Summary; the seven tabs are there and a click turns the page.
  await page.waitForTimeout(250);
  await top().locator('[data-act="pick"]').nth(1).click();
  await expect(top().locator('.hd')).toContainText('Summary');
  await expect(top()).toContainText('Lv 9');
  await expect(top().locator('[data-act="tab"]')).toHaveCount(8);
  await top().locator('[data-act="tab"]', { hasText: 'Stats' }).click();
  await expect(top()).toContainText('EV');
  await top().locator('[data-act="tab"]', { hasText: 'Moves' }).click();
  await expect(top().locator('[data-act="cursor"]').first()).toBeVisible();
  // Enter opens the action menu; "Make lead" moves the second Pokémon to the front of the party.
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  const lead = top().locator('[data-act="menu"]', { hasText: 'Make lead' });
  await expect(lead).toBeVisible();
  await lead.click();
  expect(await page.evaluate(() => (window as any).__pkr.session.run.party[0].uid)).toBe('e2e-twin');
  // Esc goes back to the Party page, then to the map.
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await expect(top().locator('.hd')).toContainText('Party');
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await waitForScene(page, 'Map');
  await expect(view(page, 'Map').locator('.hd', { hasText: 'Party' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('New UI: the Bag shows its pockets, the item window and who the item helps; Use heals the chosen Pokémon', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  // A hurt lead and a healthy twin, with Potions to use: the strip must tell the two apart.
  await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    const twin = JSON.parse(JSON.stringify(run.party[0]));
    twin.uid = 'e2e-twin';
    run.party.push(twin);
    run.party[0].hp = 1;
    run.inventory = { potion: 2 };
  });
  await view(page, 'Map').first().locator('[data-act="pick"]', { hasText: 'Bag' }).first().click();
  const top = () => view(page, 'Map').last();
  await expect(top().locator('.hd')).toContainText('Bag');
  // Pockets: "All" and the Potion's own pocket.
  expect(await top().locator('[data-act="tab"]').count()).toBeGreaterThanOrEqual(2);
  await expect(top().locator('.btn.on[data-over]')).toContainText('Potion');
  await expect(top().locator('.btn.on[data-over]')).toContainText('×2');
  await expect(top()).toContainText('Restores 20 HP');
  await expect(top()).toContainText('Can use');
  await expect(top()).toContainText('No effect');
  // The second pocket still lists the Potion; the first tab goes back.
  await page.waitForTimeout(250);
  await top().locator('[data-act="tab"]').nth(1).click();
  await expect(top().locator('[data-act="tab"]').nth(1)).toHaveClass(/on/);
  await expect(top().locator('.btn.on[data-over]')).toContainText('Potion');
  await page.waitForTimeout(250);
  await top().locator('[data-act="tab"]').first().click();
  await expect(top().locator('[data-act="tab"]').first()).toHaveClass(/on/);
  // The window's button uses the item: pick the hurt lead, and it is healed for one Potion (how much depends on the run's heal bonus).
  await page.waitForTimeout(250);
  await top().locator('.win [data-act="pick"]', { hasText: 'Use' }).click();
  await expect(top().locator('.hd')).toContainText('Use the Potion');
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.session.run.party[0].hp)).toBeGreaterThanOrEqual(21);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.inventory.potion)).toBe(1);
  expect(errors).toEqual([]);
});

test('New UI: a lost run ends on the mock-up page; Witness the Rest, the report, the final team and the run card open from it', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  // End the run in defeat with a rival and a Friend on record, so there is something to witness.
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const run = session.run;
    const traits = { ambition: 50, pride: 50, empathy: 50, adaptability: 50, vindictiveness: 50, resilience: 50 };
    const rival = (id: string, classId: string, name: string) => ({
      id, classId, name, archetype: 'proud', style: 'rush', traits, rivalPotential: 20, state: 'recurring', arc: null, away: 0, cooldown: 0, progress: 0,
      encounters: 2, setbacks: 0, adaptations: [], seen: [], bonds: {}, offscreen: [], origin: { eventId: `e-${id}`, where: { region: 0, stage: 0, level: 1, node: null, battle: 0, turn: null }, path: 'spark' },
      memory: { lastBattle: { eventId: 'x', result: 'win', hpLeftShare: 0.5, turns: 5, team: ['rattata'] } },
    });
    const feelings = (friendship: number) => ({ friendship, respect: 5, trust: 3, rivalry: 8 - friendship, resentment: 1, admiration: 2 });
    run.story.rivals = [rival('u', 'youngster', 'Joey'), rival('v', 'lass', 'Mira')];
    run.expansion = run.expansion ?? {};
    run.expansion.rival = {
      u: { role: 'main', personality: 'proud', style: 'rush', arc: 'x', lead: 1, marks: [], feelings: feelings(2), pityLosses: 0 },
      v: { role: 'friend', personality: 'kind', style: 'rush', arc: 'x', lead: -1, marks: [], feelings: feelings(7), pityLosses: 0 },
    };
    run.party[0].hp = 0;
    run.log.battlesWon = 7;
    run.log.defeatedBy = { speciesId: run.party[0].speciesId, level: 9, trainer: 'Gym Leader Misty' };
    run.phase = 'over';
    session.finishRun();
    for (const s of game.scene.getScenes(true)) game.scene.stop(s.scene.key);
    game.scene.start('GameOver');
  });
  await waitForScene(page, 'GameOver');
  const end = view(page, 'GameOver');
  await expect(end).toContainText('RUN OVER');
  await expect(end).toContainText('Gym Leader Misty');
  await expect(end).toContainText('Battles won');
  await expect(end).toContainText('Payouts');
  await expect(end.locator('[data-act="pick"]')).toHaveCount(3);
  await expect(end.locator('.btn.on')).toContainText('Witness the rest');
  // The page ignores keys for a moment, so a press meant for the battle does not skip it.
  await page.waitForTimeout(600);
  // Witness the Rest: one card per rival, then the Champion and the last card, then back to this page.
  await page.keyboard.press('Enter');
  await expect(end.locator('.bars')).toHaveCount(2);
  await expect(end).toContainText('Joey');
  const seen: string[] = [];
  for (let i = 0; i < 8 && (await end.locator('.bars').count()) > 0; i++) {
    seen.push((await end.textContent()) ?? '');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
  }
  for (const who of ['Joey', 'Mira', 'The Champion', 'And the road goes on']) expect(seen.some((t) => t.includes(who))).toBe(true);
  await expect(end.locator('.bars')).toHaveCount(0);
  await expect(end).toContainText('RUN OVER');
  // Tab: the full report over the page, with the old screen's lines; Esc closes it.
  await page.keyboard.press('Tab');
  await expect(end).toContainText('Full report');
  await expect(end).toContainText('Seed code');
  await page.keyboard.press('Escape');
  await expect(end.locator('[data-act="page"]')).toHaveCount(0);
  // F: the final team as the Party page.
  await page.waitForTimeout(250);
  await page.keyboard.press('f');
  await expect(end.locator('.hd')).toContainText('Final team');
  await expect(end).toContainText('Your final team, as it stood at the end.');
  await page.keyboard.press('Escape');
  await expect(end.locator('.hd')).toHaveCount(0);
  // The run card, by click; clicking beside the card goes back.
  await page.waitForTimeout(250);
  await end.locator('[data-act="pick"]', { hasText: 'Run card' }).click();
  await expect(end.locator('.hd')).toContainText('Run card');
  await expect(end).toContainText('Result');
  await page.keyboard.press('Escape');
  await expect(end).toContainText('RUN OVER');
  // Back to Hub leaves the run end.
  await page.waitForTimeout(250);
  await end.locator('[data-act="pick"]', { hasText: 'Back to Hub' }).click();
  await waitForScene(page, 'Hub');
  expect(errors).toEqual([]);
});

/**
 * Through the opening lines to the battle's first choice. The game keeps a key press for a moment, so an Enter sent
 * during the last opening line can land on the commands and open Fight; this steps back, so every run starts there.
 */
async function toCommands(page: Page) {
  await confirmToMenu(page);
  await page.waitForTimeout(400);
  const tab = () => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').tabs.current as string | null);
  if ((await tab()) !== null) {
    await page.keyboard.press('Escape');
    await expect.poll(tab).toBeNull();
    await page.waitForTimeout(250);
  }
}

test('New UI: the battle shows the mock-up boxes, text box and menus over the live field; a move chosen by click plays the turn', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  const hud = view(page, 'Battle');
  await expect(hud).toBeVisible();
  // The HUD is see-through: the canvas keeps the arena and the Pokémon, and no longer draws its own boxes.
  await expect(hud).toHaveClass(/clear/);
  // Through the opening lines to the first choice.
  await toCommands(page);
  const fight = hud.locator('[data-act="pick"]', { hasText: 'Fight' });
  await expect(fight).toBeVisible();
  await expect(hud.locator('.win.glass')).toHaveCount(2);
  await expect(hud.locator('.txt')).toContainText('What will');
  await expect(hud.locator('[data-act="tab"]')).toHaveCount(5);
  const state = () => page.evaluate(() => {
    const s = (window as any).__pkr.game.scene.getScene('Battle');
    const run = (window as any).__pkr.session.run;
    return { turn: run.battle?.turn ?? -1, hidden: s.playerBox.container.cameraFilter !== 0 && s.message.cameraFilter !== 0, name: s.playerBox.name.text as string };
  });
  const before = await state();
  expect(before.hidden).toBe(true);
  await expect(hud.locator('.win.glass').last()).toContainText(before.name);
  // Fight opens the moves: type-coloured buttons with PP, and the text box describes the focused move.
  await fight.click();
  const move = hud.locator('.btn.mv');
  await expect(move.first()).toBeVisible();
  await expect(move.first()).toContainText('PP');
  await expect(hud.locator('.txt')).toContainText('Power');
  await expect(hud.locator('[data-act="tab"].on')).toContainText('Attack');
  // The keyboard moves the same cursor the buttons show.
  if ((await move.count()) > 1) {
    await page.keyboard.press('ArrowRight');
    await expect(hud.locator('.btn.on.mv')).toHaveAttribute('data-arg', '1');
    await page.keyboard.press('ArrowLeft');
    await expect(hud.locator('.btn.on.mv')).toHaveAttribute('data-arg', '0');
  }
  // A click on the first move plays the turn.
  await page.waitForTimeout(250);
  await move.first().click();
  await expect(move).toHaveCount(0);
  await confirmUntil(page, async () => (await state()).turn > before.turn || (await page.evaluate(() => (window as any).__pkr.session.run.phase)) !== 'battle', 30_000);
  const after = await state();
  const phase = await page.evaluate(() => (window as any).__pkr.session.run.phase);
  expect(phase !== 'battle' || after.turn > before.turn).toBe(true);
  expect(errors).toEqual([]);
});

test('New UI: the battle\'s Party and Item tabs open the mock-up windows over the field; the keyboard and clicks steer them', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  await toCommands(page);
  // Two kinds of medicine and the starting balls, and a hurt Pokémon so the Potion can be used.
  await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    run.inventory = { ...run.inventory, potion: 2, revive: 1 };
    run.party[0].hp = Math.max(1, run.party[0].hp - 5);
  });
  const stages = view(page, 'Battle');
  const tab = (name: string) => stages.locator('[data-act="tab"]', { hasText: name }).first();
  const win = stages.locator('.win', { has: page.locator('[data-act="pick"][data-over]') }).filter({ hasNot: page.locator('.btn') });
  const text = stages.locator('.txt');
  const picker = () => page.evaluate(() => {
    const s = (window as any).__pkr.game.scene.getScene('Battle');
    return s.picker ? { hidden: s.picker.root.cameraFilter !== 0, row: s.picker.current as number } : null;
  });

  // Party: one window under the foe's box, a row per Pokémon with its HP bar; the canvas list is left out of the picture.
  await tab('Party').click();
  await expect(win).toHaveCount(1);
  await expect(win).toContainText('Switch to…');
  const party = await page.evaluate(() => (window as any).__pkr.session.run.party.length as number);
  await expect(win.locator('[data-act="pick"]')).toHaveCount(party);
  await expect(win.locator('.hp')).toHaveCount(party);
  expect((await picker())?.hidden).toBe(true);
  await expect(stages.locator('[data-act="tab"].on').first()).toContainText('Party');
  // The text box says what the focused Pokémon brings.
  await expect(text).not.toHaveText('');
  // Esc goes back to the commands and the window leaves.
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await expect(win).toHaveCount(0);
  await expect(stages.locator('[data-act="pick"]', { hasText: 'Fight' })).toBeVisible();
  expect(await picker()).toBeNull();

  // Item: pockets as tabs, rows with counts, and the focused item's words in the text box.
  await tab('Item').click();
  await expect(win).toHaveCount(1);
  const pockets = win.locator('.tabs [data-act="tab"]');
  await expect(pockets).toHaveCount(2);
  await expect(pockets.first()).toHaveClass(/on/);
  await expect(pockets.first()).toHaveText('Medicine');
  await expect(win.locator('[data-act="pick"]')).toHaveCount(2);
  await expect(win).toContainText('Potion');
  await expect(win).toContainText('× 2');
  await expect(text).toContainText('HP');
  // Down moves the same cursor the window shows.
  await page.waitForTimeout(250);
  await page.keyboard.press('ArrowDown');
  await expect.poll(async () => (await picker())?.row).toBe(1);
  await expect(win).toContainText('Revive');
  // Right opens the next pocket; a click on a pocket does the same.
  await page.keyboard.press('ArrowRight');
  await expect(pockets.nth(1)).toHaveClass(/on/);
  await expect(win).toContainText('Ball');
  await pockets.first().click();
  await expect(pockets.first()).toHaveClass(/on/);
  // Choosing the Potion asks which Pokémon: the same window with the party, each row saying what the item would do.
  await win.locator('[data-act="pick"]', { hasText: 'Potion' }).click();
  await expect(win).toContainText('Use Potion on which Pokémon?');
  await expect(win.locator('.hp')).toHaveCount(party);
  // Picking the hurt Pokémon spends the Potion and the turn.
  const before = await page.evaluate(() => ({ n: (window as any).__pkr.session.run.inventory.potion as number, turn: (window as any).__pkr.session.run.battle.turn as number }));
  await win.locator('[data-act="pick"]').first().click();
  await expect(win).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.session.run.inventory.potion ?? 0)).toBe(before.n - 1);
  expect(errors).toEqual([]);
});

test('New UI: a Trainer battle opens on the mock-up versus card; a click moves on to the battle', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  const trainer = await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const node = session.run.stage.map.nodes.find((n: any) => n.column === 1);
    node.kind = 'trainer';
    session.chooseNode(node.id);
    game.scene.getScene('Map').scene.start('Battle');
    return session.run.battle.trainer.name as string;
  });
  await waitForScene(page, 'Battle');
  const stages = view(page, 'Battle');
  const card = stages.locator('.vsx');
  await expect(card).toBeVisible();
  // The card names the Trainer; the battle's own boxes are not out yet.
  await expect(stages.filter({ has: page.locator('.vsx') })).toContainText(trainer);
  await expect(stages.locator('.win.glass')).toHaveCount(0);
  await stages.locator('[data-act="next"]').click();
  await expect(card).toHaveCount(0);
  // The battle goes on to its first choice, with both boxes up.
  await toCommands(page);
  await expect(stages.locator('[data-act="pick"]', { hasText: 'Fight' })).toBeVisible();
  await expect(stages.locator('.win.glass')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('New UI: a Gym Leader enters on the mock-up cutscene card (a click skips it, once and for all); a wild Legendary is revealed on one (Esc skips)', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  const boss = await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const last = Math.max(...session.run.stage.map.nodes.map((n: any) => n.column));
    session.debugJumpToColumn(last);
    const node = session.run.stage.map.nodes.find((n: any) => n.column === last);
    session.chooseNode(node.id);
    game.scene.getScene('Map').scene.start('Battle');
    return { kind: node.kind as string, name: session.run.battle.trainer.name as string };
  });
  expect(boss.kind).toBe('gym');
  await waitForScene(page, 'Battle');
  const stages = view(page, 'Battle');
  const cut = stages.filter({ has: page.locator('.beat') });
  // The card: the plate, the name, the five-beat strip and the skip hint; neither the versus card nor the boxes yet.
  await expect(cut).toBeVisible();
  await expect(cut.locator('.plate')).toHaveText('Gym Leader');
  await expect(cut).toContainText(boss.name);
  await expect(cut.locator('.beat i')).toHaveCount(5);
  await expect(cut.locator('kbd')).toHaveText('Esc');
  await expect(stages.locator('.vsx')).toHaveCount(0);
  await expect(stages.locator('.win.glass')).toHaveCount(0);
  // The card is redrawn on every beat, so the click goes to the layer (which stays) rather than to one drawing of it.
  await cut.click();
  await expect(cut).toHaveCount(0);
  // Skipping is remembered for this boss, and the versus card follows.
  expect(await page.evaluate(() => (window as any).__pkr.session.settings.skippedIntros.length)).toBe(1);
  await expect(stages.locator('.vsx')).toBeVisible();
  await stages.locator('[data-act="next"]').click();
  await toCommands(page);
  await expect(stages.locator('.beat')).toHaveCount(0);

  // A wild Legendary: its own card, the Pokémon named on it; Esc skips and the battle goes on.
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const node = session.run.stage.map.nodes.find((n: any) => n.column === 1);
    node.kind = 'wild';
    session.chooseNode(node.id);
    const b = session.run.battle;
    b.enemyTeam = [b.enemyTeam[0]];
    b.enemyTeam[0].speciesId = 'rayquaza';
    game.scene.getScene('Map').scene.start('Battle');
  });
  await waitForScene(page, 'Battle');
  await expect(cut).toBeVisible();
  await expect(cut.locator('.plate')).toHaveText('Legendary Pokémon');
  await expect(cut).toContainText('Rayquaza');
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await expect(cut).toHaveCount(0);
  await toCommands(page);
  await expect(stages.locator('.win.glass')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('New UI: a win shows the Exp panel, the level-up window and the evolution picture from the mock-ups', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  await toCommands(page);
  // One hit wins, and the Exp banked is enough for several levels: a Caterpie evolves on the way.
  await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    run.battle.enemyTeam.forEach((m: any) => (m.hp = 1));
    const mon = run.party[0];
    mon.speciesId = 'caterpie';
    mon.moves[0] = { ...mon.moves[0], id: 'tackle', pp: 35 };
    mon.xp = 7000;
  });
  const stages = view(page, 'Battle');
  const count = (sel: string, text?: RegExp) => async () => (await (text ? stages.locator(sel, { hasText: text }) : stages.locator(sel)).count()) > 0;
  await stages.locator('[data-act="pick"]', { hasText: 'Fight' }).click();
  await expect(stages.locator('.btn.mv').first()).toBeVisible();
  await page.waitForTimeout(250);
  await stages.locator('.btn.mv').first().click();
  // The Exp panel names the Pokémon that earned it, as it was in the fight.
  await confirmUntil(page, count('.win', /\+\d+ Exp|Level up!/), 40_000);
  await expect(stages.locator('.win', { hasText: /\+\d+ Exp|Level up!/ }).first()).toContainText('Caterpie');
  // The level-up window: the step from the level it had, and six stats.
  await confirmUntil(page, count('.win', /Lv \d+ → \d+/), 40_000);
  const level = stages.locator('.win', { hasText: /Lv \d+ → \d+/ });
  await expect(level).toContainText('Caterpie');
  await expect(level).toContainText('Lv 5 →');
  for (const stat of ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed']) await expect(level).toContainText(stat);
  // The evolution takes the whole picture: no boxes, the words under it.
  await confirmUntil(page, count('.burst'), 60_000);
  await expect(stages.locator('.win.glass')).toHaveCount(0);
  await expect(stages.locator('.txt')).toContainText(/evolving|evolved/);
  // Then the run goes on, a new species in the party.
  await confirmUntil(page, async () => (await page.evaluate(() => (window as any).__pkr.activeScene())) !== 'Battle', 60_000);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.party[0].speciesId)).not.toBe('caterpie');
  expect(errors).toEqual([]);
});

test('New UI: resting the pointer on a move or a data box shows the mock-up tooltips; a click pins a Pokémon\'s card', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  const hud = view(page, 'Battle');
  await toCommands(page);
  const card = hud.locator('.win', { hasText: 'Seen in' });
  const mine = hud.locator('[data-tip="mine:0"]'), foe = hud.locator('[data-tip="foe:0"]');
  await expect(card).toHaveCount(0);
  // Your own Pokémon: its Ability and what it does, after the Tooltip delay.
  await mine.hover();
  await expect(card).toBeVisible();
  const names = await page.evaluate(() => [...(window as any).__pkr.session.content.abilities.values()].map((a: any) => a.name as string));
  const head = (await card.locator('b.acc').textContent()) ?? '';
  expect(names).toContain(head);
  // Off the box, the card leaves.
  await page.mouse.move(480, 200);
  await expect(card).toHaveCount(0);
  // The foe has shown no Ability yet: the card says so and gives nothing away.
  await foe.hover();
  await expect(card).toContainText('Ability not seen yet');
  await page.mouse.move(480, 200);
  await expect(card).toHaveCount(0);
  // A click pins the card: it stays with the pointer elsewhere, and a click on it lets it go.
  await mine.click();
  await page.mouse.move(200, 300);
  await page.waitForTimeout(400);
  await expect(card).toBeVisible();
  await expect(card).toContainText(head);
  await card.click();
  await page.mouse.move(200, 300);
  await expect(card).toHaveCount(0);
  // A move: its details as the tooltip window, which never takes the click meant for the button.
  await hud.locator('[data-act="pick"]', { hasText: 'Fight' }).click();
  const move = hud.locator('[data-tip="move:0"]');
  await expect(move).toBeVisible();
  const tip = hud.locator('.win', { hasText: 'Power / Accuracy' });
  await expect(tip).toHaveCount(0);
  await move.hover();
  await expect(tip).toBeVisible();
  await expect(tip).toContainText('Category');
  await expect(tip).toContainText('Priority');
  await page.mouse.move(200, 300);
  await expect(tip).toHaveCount(0);
  // Tooltip delay Off: resting shows nothing, a pin still works.
  await page.evaluate(() => { const S = (window as any).__pkr.session; S.saveSettings({ ...S.settings, tooltipDelay: 'off' }); });
  await move.hover();
  await page.waitForTimeout(1500);
  await expect(tip).toHaveCount(0);
  await mine.hover();
  await page.waitForTimeout(1500);
  await expect(card).toHaveCount(0);
  await mine.click();
  await expect(card).toBeVisible();
  // The turn's pictures take the field back from a pinned card.
  await move.click();
  await expect(card).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.session.run.battle?.turn ?? 99), { timeout: 30_000 }).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('New UI: the map shows a party Pokémon\'s info card on hover; Bonds is the mock-up board; a move chip in the Summary shows its tooltip', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  const map = view(page, 'Map').first();
  // The info card: the Pokémon's Ability and what it does, after the Tooltip delay; it leaves with the pointer.
  const card = map.locator('.win', { hasText: 'Seen in' });
  await expect(card).toHaveCount(0);
  await map.locator('[data-tip="mon:0"]').hover();
  await expect(card).toBeVisible();
  const names = await page.evaluate(() => [...(window as any).__pkr.session.content.abilities.values()].map((a: any) => a.name as string));
  expect(names).toContain((await card.locator('b.acc').textContent()) ?? '');
  await page.mouse.move(2, 2);
  await expect(card).toHaveCount(0);
  // Bonds: one row per Pokémon with its Trust bar; the other values are read out in the text box.
  await map.locator('[data-act="pick"]', { hasText: 'Bonds' }).first().click();
  const top = () => view(page, 'Map').last();
  await expect(top().locator('.hd')).toContainText('Bonds');
  const rows = top().locator('[data-act="pick"]');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(/Trust \d+/);
  await expect(rows.first().locator('.hp')).toHaveCount(1);
  await expect(top().locator('.txt')).toContainText(/Affection \d+ · Respect \d+/);
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await expect(view(page, 'Map')).toHaveCount(1);
  // The Summary's Overview: resting on a move chip shows the tooltip window; it leaves with the pointer.
  await page.waitForTimeout(250);
  await map.locator('[data-act="pick"]', { hasText: 'Party' }).first().click();
  await expect(top().locator('.hd')).toContainText('Party');
  await page.waitForTimeout(250);
  await top().locator('[data-act="pick"]').first().click();
  await expect(top().locator('.hd')).toContainText('Summary');
  const tip = top().locator('.win', { hasText: 'Power / Accuracy' });
  await expect(tip).toHaveCount(0);
  await top().locator('[data-tip="move:0"]').hover();
  await expect(tip).toBeVisible();
  await expect(tip).toContainText('Category');
  // (The top-left corner is clear of every chip at any window size.)
  await page.mouse.move(2, 2);
  await expect(tip).toHaveCount(0);
  // Tooltip delay Off: nothing shows.
  await page.evaluate(() => { const S = (window as any).__pkr.session; S.saveSettings({ ...S.settings, tooltipDelay: 'off' }); });
  await top().locator('[data-tip="move:0"]').hover();
  await page.waitForTimeout(1500);
  await expect(tip).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('New UI: notifications, an achievement toast and the interaction log show over the screen as in the mock-ups', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  const over = view(page, 'overlay');
  await expect(over).toBeHidden();
  // Three notices: the newest on top and bright; "Head: line" splits into its head.
  await page.evaluate(() => { const p = (window as any).__pkr; p.notify('Bond: Lucario trusts you more.'); p.notify('Saved the game'); p.notify('Egg: Your egg hatches in 2 stops.'); });
  const notices = over.locator('[data-act="notice"]');
  await expect(notices).toHaveCount(3);
  await expect(notices.first()).toContainText('Egg');
  await expect(notices.first().locator('b.acc')).toHaveText('Egg');
  await expect(notices.nth(1)).toContainText('Notice');
  await expect(notices.nth(1)).toContainText('Saved the game');
  // The title screen under it still takes its own clicks and keys.
  await expect(view(page, 'MainMenu')).toBeVisible();
  // A tap sends one away.
  await notices.nth(1).click();
  await expect(notices).toHaveCount(2);
  await expect(over).not.toContainText('Saved the game');
  // The log (L) lists what happened, newest first; a click or L closes it.
  await page.keyboard.press('l');
  const log = over.locator('[data-act="log"]');
  await expect(log).toBeVisible();
  await expect(log).toContainText('Interaction log');
  await expect(log).toContainText('Egg: Your egg hatches in 2 stops.');
  await expect(log).toContainText('just now');
  await log.click();
  await expect(log).toHaveCount(0);
  await page.keyboard.press('l');
  await expect(log).toBeVisible();
  await page.keyboard.press('l');
  await expect(log).toHaveCount(0);
  // Those clicks stayed on the layer: the title under it did not take them as a press on one of its own entries.
  expect(await scene(page)).toBe('MainMenu');
  // An achievement toast: its kicker and name; a tap opens what it was for and holds it, a second tap closes it.
  const first = await page.evaluate(() => { const p = (window as any).__pkr; const a = [...p.session.content.achievements.values()][0]; p.achievementToast(1); return { name: a.name as string, description: a.description as string }; });
  const toast = over.locator('[data-act="toast"]');
  await expect(toast).toHaveCount(1);
  await expect(toast).toContainText(/achievement/i);
  await expect(toast.locator('b.acc')).toHaveText(first.name);
  await expect(toast).not.toContainText(first.description);
  await toast.click();
  await expect(toast).toContainText(first.description);
  // Held open, it outlasts its own timer.
  await page.waitForTimeout(4500);
  await expect(toast).toHaveCount(1);
  await toast.click();
  await expect(toast).toHaveCount(0);
  // The notices have run out by themselves by now, and the layer is gone with them.
  await expect(notices).toHaveCount(0, { timeout: 8000 });
  await expect(over).toBeHidden();
  // The title is still the screen under it, and the keyboard still drives it.
  expect(await scene(page)).toBe('MainMenu');
  await page.keyboard.press('Enter');
  await expect.poll(() => scene(page), { timeout: 20_000 }).not.toBe('MainMenu');
  expect(errors).toEqual([]);
});

test('New UI on a phone: held upright, the layer turns with the game and fills the screen; the pad stays on top', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await expect(page.locator('body')).toHaveClass(/rot-portrait/);
  const boxes = () => page.evaluate(() => {
    const c = document.querySelector('canvas')!.getBoundingClientRect();
    const s = document.querySelector('#rx .stage[data-scene="MainMenu"]')!.getBoundingClientRect();
    const pad = document.getElementById('touch-pad')!;
    return { c: [c.left, c.top, c.width, c.height].map(Math.round), s: [s.left, s.top, s.width, s.height].map(Math.round), padZ: Number(getComputedStyle(pad).zIndex), rxZ: Number(getComputedStyle(document.getElementById('rx')!).zIndex), w: innerWidth, h: innerHeight };
  });
  // The layer follows the canvas (a 250 ms tick), turned a quarter turn like it.
  await expect.poll(async () => { const b = await boxes(); return b.c.every((v, i) => Math.abs(v - b.s[i]!) <= 2); }, { timeout: 5000 }).toBe(true);
  const b = await boxes();
  // The turned game stands tall and is centred across the screen, not cut off at an edge.
  expect(b.c[3]!).toBeGreaterThan(b.c[2]!);
  expect(b.c[0]!).toBeGreaterThanOrEqual(-1);
  expect(b.c[0]! + b.c[2]!).toBeLessThanOrEqual(b.w + 1);
  expect(Math.abs(b.c[0]! - (b.w - (b.c[0]! + b.c[2]!)))).toBeLessThanOrEqual(2);
  expect(b.padZ).toBeGreaterThan(b.rxZ);
  // A tap on a turned button still lands: New Run leads on.
  await view(page, 'MainMenu').locator('[data-act]', { hasText: 'New Run' }).first().tap();
  await expect.poll(() => scene(page), { timeout: 20_000 }).not.toBe('MainMenu');
  expect(errors).toEqual([]);
  await context.close();
});

test('New UI on a phone held sideways: the on-screen pad lies over the screens and its buttons still press', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await expect(page.locator('body')).toHaveClass(/touch-pad-side/);
  await expect(page.locator('body')).toHaveClass(/rx-on/);
  const ok = page.locator('#touch-pad .acts button').first();
  await expect(ok).toBeVisible();
  // The mock-up's round translucent buttons.
  expect(await ok.evaluate((el) => getComputedStyle(el).borderRadius)).toBe('50%');
  // The pad is above the layer: its confirm button answers the title screen.
  await ok.tap();
  await expect.poll(() => scene(page), { timeout: 20_000 }).not.toBe('MainMenu');
  expect(errors).toEqual([]);
  await context.close();
});

test('New UI: the map\'s Rival Report, Notebook, Dossier and Field Notes open as the mock-up pages; keys and clicks steer them', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  // A run that has met two rivals and some of Team Rocket, seen the Kanto track move and found a few notes.
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    run.regionOrder[run.regionIndex] = 'kanto';
    const cast = (id: string, status: string) => [id, { status, metAt: 3 }];
    const traits = { ambition: 50, pride: 50, empathy: 50, adaptability: 50, vindictiveness: 50, resilience: 50 };
    const rival = (id: string, classId: string, name: string) => ({
      id, classId, name, archetype: 'proud', style: 'rush', traits, rivalPotential: 20, state: 'recurring', arc: null, away: 0, cooldown: 0, progress: 0,
      encounters: 2, setbacks: 0, adaptations: [], seen: [], bonds: {}, offscreen: [], origin: { eventId: `e-${id}`, where: { region: 0, stage: 0, level: 1, node: null, battle: 0, turn: null }, path: 'spark' },
      memory: { lastBattle: { eventId: 'x', result: 'win', hpLeftShare: 0.5, turns: 5, team: ['rattata'] } },
    });
    const feelings = (friendship: number) => ({ friendship, respect: 5, trust: 3, rivalry: 8 - friendship, resentment: 1, admiration: 2 });
    run.story.rivals = [rival('u', 'youngster', 'Joey'), rival('v', 'lass', 'Mira')];
    run.expansion = {
      ...(run.expansion ?? {}),
      tracks: true,
      track: { kanto: { step: 2, peak: 3, applied: [], log: [] } },
      dossier: Object.fromEntries([cast('sc.rocket.matori', 'at large'), cast('sc.rocket.triad-surge', 'at large'), cast('sc.rocket.triad-koga', 'beaten'), cast('sc.rocket.madame-boss', 'at large'), cast('sc.aqua.amber', 'at large')]),
      grandArc: { roms: ['K'], late: [], stock: [1], left: [] },
      fieldNotes: { special: ['sv.rocket.roadblock', 'sv.rocket.ledger'], shadow: { 'ss.rocket.amberjack': 2 } },
      rival: {
        u: { role: 'main', personality: 'champion-chaser', style: 'rush', arc: 'x', lead: 1, marks: ['owes-you-one'], feelings: feelings(2), pityLosses: 0, presence: { '0': { meetings: 2, stepIn: true } } },
        v: { role: 'friend', personality: 'kind', style: 'rush', arc: 'x', lead: -1, marks: [], feelings: feelings(7), pityLosses: 0 },
      },
    };
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Map');
  const state = () => page.evaluate(() => { const m = (window as any).__pkr.game.scene.getScene('Map'); return { busy: m.busy as boolean, index: m.index as number, canvas: Boolean(m.report || m.fieldNotes) }; });
  await expect.poll(async () => (await state()).busy, { timeout: 15_000 }).toBe(false);
  const map = view(page, 'Map').first();
  const head = map.locator('.hd');
  const home = (await state()).index;
  const closed = async () => {
    await expect(head).not.toContainText(/Rival Report|Notebook|Dossier|Field Notes/);
    expect(await state()).toEqual({ busy: false, index: home, canvas: false });
  };

  // Rival Report (R): the rival's card, the Lead steps, feelings and meetings; a chip or an arrow changes rival.
  await page.keyboard.press('r');
  await expect(head).toContainText('Rival Report');
  await expect(map).toContainText('Joey is ahead by 1');
  await expect(map).toContainText('Champion Chaser');
  await expect(map).toContainText('Owes You One');
  await expect(map).toContainText('2 meetings, stepped in');
  await expect(map.locator('.hp.gold')).toHaveCount(4);
  await map.locator('[data-act="popPick"]', { hasText: 'Mira' }).click();
  await expect(map).toContainText('You lead by 1');
  await expect(map).toContainText('No marks yet');
  await page.keyboard.press('ArrowRight');
  await expect(map).toContainText('Joey is ahead by 1');
  expect((await state()).canvas).toBe(false);
  await page.keyboard.press('r');
  await closed();

  // Notebook track page (T): the step the region is on and what people say; Esc closes.
  await page.keyboard.press('t');
  await expect(head).toContainText('Notebook');
  await expect(map).toContainText('The Ledger Fills');
  await expect(map).toContainText('House Rules');
  await expect(map).toContainText('Civilians say');
  await page.keyboard.press('Escape');
  await closed();

  // Dossier (D): D is also "right", and that same press must not change folder. Arrows change folder and person.
  await page.keyboard.press('d');
  await expect(head).toContainText('Dossier');
  const tabs = map.locator('.tabs span');
  await expect(tabs).toHaveText(['Aqua', 'Rocket']);
  await expect(map.locator('.tabs span.on')).toHaveText('Aqua');
  await page.keyboard.press('ArrowRight');
  await expect(map.locator('.tabs span.on')).toHaveText('Rocket');
  await expect(map).toContainText('Overheard:');
  await expect(map).toContainText('Madame Boss');
  await expect(map).toContainText('Stop 4');
  await map.locator('[data-act="popPick"]', { hasText: 'Matori' }).click();
  await expect(map.locator('b', { hasText: 'Matori' }).last()).toBeVisible();
  await expect(map).toContainText('Executive');
  await tabs.first().click();
  await expect(map.locator('.tabs span.on')).toHaveText('Aqua');
  await page.keyboard.press('d');
  await closed();

  // Field Notes (F): four tabs; the Shadow tab shows hint pips; Enter closes.
  await page.keyboard.press('f');
  await expect(head).toContainText('Field Notes');
  await expect(map.locator('[data-act="popTab"]')).toHaveCount(4);
  await expect(map).toContainText('LEDGER');
  await page.keyboard.press('ArrowDown');
  await expect(map).toContainText('Snorlax');
  await map.locator('[data-act="popTab"]').nth(1).click();
  await expect(map).toContainText('Amberjack');
  await expect(map).toContainText('Hints');
  await page.keyboard.press('ArrowRight');
  await expect(map.locator('.txt')).toContainText(/ROM/);
  await page.keyboard.press('Enter');
  await closed();
  expect(errors).toEqual([]);
});

test('New UI: Galar\'s Champion Tournament bracket opens on the map as the mock-up tree; pages turn and a match can be watched', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const run = session.run;
    run.regionOrder = ['galar', ...run.regionOrder.filter((r: string) => r !== 'galar')];
    run.regionIndex = 0;
    session.debugJumpToLeague();
    const stage = session.run.stage;
    stage.visited = stage.map.nodes.map((n: any) => n.id).slice(0, 2);
    for (const s of game.scene.getScenes(true)) game.scene.stop(s.scene.key);
    game.scene.start('Map');
  });
  await waitForScene(page, 'Map');
  const busy = () => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy as boolean);
  await expect.poll(busy, { timeout: 15_000 }).toBe(false);
  const map = view(page, 'Map').first();
  await page.keyboard.press('b');
  await expect(map.locator('.hd')).toContainText('Champion Tournament');
  // Two rounds won: it opens on the finals page with the eight who are left, and nothing later is given away.
  const chips = map.locator('[data-act="bracketPage"]');
  await expect(chips).toHaveCount(5);
  await expect(map.locator('[data-act="bracketPage"]:not(.no)')).toHaveText('Finals');
  await expect(map.locator('.txt')).toContainText('8 of 32 still in. Next: Quarterfinal against');
  await expect(map).toContainText('★ You');
  await expect(map.locator('.win', { hasText: '?' })).toHaveCount(7);
  await chips.first().click();
  await expect(map.locator('[data-act="bracketPage"]:not(.no)')).toHaveText('Group A');
  await page.keyboard.press('ArrowRight');
  await expect(map.locator('[data-act="bracketPage"]:not(.no)')).toHaveText('Group B');
  // Watching a match plays on the canvas: the layer steps aside and comes back when it ends.
  const watching = () => page.evaluate(() => { const m = (window as any).__pkr.game.scene.getScene('Map'); return m.children.list.some((o: any) => o.name === 'match-watch'); });
  await page.keyboard.press('w');
  await expect.poll(watching).toBe(true);
  await expect(map).toBeHidden();
  await page.waitForTimeout(300);
  expect(await watching()).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(watching).toBe(false);
  await expect(map).toBeVisible();
  await expect(map.locator('.hd')).toContainText('Champion Tournament');
  await map.locator('[data-act="bracketWatch"]').click();
  await expect.poll(watching).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(watching).toBe(false);
  await page.keyboard.press('b');
  await expect(map.locator('.hd')).not.toContainText('Champion Tournament');
  expect(await busy()).toBe(false);
  expect(errors).toEqual([]);
});

test('UI style: Old shows no New layer; the address can ask for either', async ({ page }) => {
  const errors = watch(page);
  // An automated browser gets Old by default (the older specs rely on it).
  await start(page, 'seed=newui-e2e');
  await expect(page.locator('#rx .stage')).toHaveCount(0);
  await start(page, 'ui=old&seed=newui-e2e');
  await expect(page.locator('#rx .stage')).toHaveCount(0);
  await start(page, 'ui=new&seed=newui-e2e');
  await expect(view(page, 'MainMenu')).toBeVisible();
  // The saved setting still says New: that is what players get.
  expect(await page.evaluate(() => (window as any).__pkr.session.settings.uiStyle)).toBe('new');
  expect(errors).toEqual([]);
});

/** Starts a scene by name from whatever is on screen. */
async function open(page: Page, key: string, data?: Record<string, unknown>) {
  await page.evaluate(([k, d]) => {
    const g = (window as any).__pkr.game;
    for (const s of g.scene.getScenes(true)) if (s.scene.key !== k) g.scene.stop(s.scene.key);
    g.scene.start(k, d ?? undefined);
  }, [key, data] as const);
  await waitForScene(page, key);
}

test('New UI: the loading screen and the update splash are the mock-up page; so are the welcome log, the tutorial and the credits', async ({ browser, baseURL }) => {
  test.setTimeout(150_000);
  // A fresh browser profile with the offline worker off: the worker would answer for the files this test holds back.
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 }, ...(baseURL ? { baseURL } : {}) });
  const page = await context.newPage();
  const errors = watch(page);
  // The game's pictures and sounds are held back so the loading screen stays up; the fonts and the splash's own files pass.
  let release: () => void = () => undefined;
  const gate = new Promise<void>((r) => { release = r; });
  await page.route('**/assets/**', async (route) => {
    const url = route.request().url();
    if (/\/assets\/(images|audio)\//.test(url) && !/splash|amb-birds/.test(url)) await gate;
    await route.continue().catch(() => undefined);
  });
  await page.goto('/?ui=new&splash=1', { waitUntil: 'domcontentloaded' });
  const boot = view(page, 'Boot');
  // The update splash: the picture behind, the update's name over the loading bar, and a click anywhere moves on.
  await expect(boot).toContainText('is here', { timeout: 30_000 });
  await expect(boot.locator('.bg')).toHaveCount(1);
  await expect(boot.locator('.hp.gold i')).toHaveCount(1);
  await boot.locator('[data-act="next"]').click();
  // The loading screen under it: the title, a tip and the bar (nothing has loaded yet, so the bar is not full).
  await expect(boot).toContainText('Loading the region…', { timeout: 10_000 });
  await expect(boot).toContainText('Tip:');
  await expect(boot.locator('[data-act="next"]')).toHaveCount(0);
  const width = await boot.locator('.hp.gold i').evaluate((el) => parseFloat((el as HTMLElement).style.width));
  expect(width).toBeLessThan(100);
  release();
  // After the splash the title screen is skipped: straight into the hub.
  await waitForScene(page, 'Hub', 90_000);
  await page.unroute('**/assets/**');

  // The welcome log: a talk page with the player's picture, a tag, and the choices only once the text has been read.
  await open(page, 'Welcome', { returnTo: 'MainMenu' });
  const welcome = view(page, 'Welcome');
  const read = async (v: typeof welcome) => { for (let i = 0; i < 8 && (await v.locator('.rx-more').count()) > 0; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(250); } };
  await expect(welcome).toContainText('First launch');
  await read(welcome);
  await expect(welcome.locator('[data-act="pick"]')).toHaveText(['Next', 'Skip the update log']);
  expect(await welcome.innerHTML()).toContain('packs/mc/look_a/command.png');
  expect(await welcome.innerHTML()).not.toContain('₽');
  await welcome.locator('[data-act="pick"]').first().click();
  await expect(welcome).toContainText('Update log 1/');
  await read(welcome);
  await welcome.locator('[data-act="pick"]').nth(1).click();
  await expect(welcome).toContainText('Optional tutorial');
  await read(welcome);
  await welcome.locator('[data-act="pick"]').first().click();

  // The tutorial: all ten choices fit on the page; pointing at a lesson shows its professor; a lesson reads page by page.
  await waitForScene(page, 'Tutorial');
  const tutorial = view(page, 'Tutorial');
  const picks = tutorial.locator('[data-act="pick"]');
  await expect(picks).toHaveCount(10);
  await expect(tutorial).toContainText('Tutorial 0/9');
  const frame = (await tutorial.boundingBox())!;
  for (const k of [0, 9]) {
    const b = (await picks.nth(k).boundingBox())!;
    expect(b.y).toBeGreaterThanOrEqual(frame.y);
    expect(b.y + b.height).toBeLessThanOrEqual(frame.y + frame.height);
  }
  await picks.nth(2).hover();
  await expect(tutorial).toContainText('Prof. Birch');
  await picks.first().click();
  await expect(tutorial).toContainText('Tutorial 1/');
  await expect(tutorial).toContainText('Prof. Oak');
  for (let i = 0; i < 12 && !(await tutorial.innerText()).includes('Finish this lesson'); i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
  }
  await tutorial.locator('[data-act="pick"]', { hasText: 'Finish this lesson' }).click();
  await expect(tutorial).toContainText('Tutorial 1/9');
  await expect(picks.first()).toContainText('✓');
  expect(await page.evaluate(() => (window as any).__pkr.session.settings.tutorialDone.length)).toBe(1);
  await picks.last().click();
  await waitForScene(page, 'MainMenu');

  // The asset credits stand still and scroll; Esc leaves, back to Settings where they are opened from.
  await open(page, 'Credits', { assets: true, from: 'MainMenu' });
  const credits = view(page, 'Credits');
  await expect(credits.locator('.rx-credits')).toContainText('Asset credits');
  await expect(credits).toContainText('skip');
  await page.waitForTimeout(500);
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => credits.locator('.rx-credits').evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await waitForScene(page, 'Settings');
  // The ending credits roll by themselves with full animations.
  await page.evaluate(() => { const s = (window as any).__pkr.session; s.saveSettings({ ...s.settings, battleAnimations: 'full' }); });
  await open(page, 'Credits', { assets: false });
  const at = () => credits.locator('.rx-roll').evaluate((el) => (el as HTMLElement).style.transform);
  const first = await at();
  await expect.poll(at, { timeout: 5_000 }).not.toBe(first);
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await expect.poll(() => scene(page), { timeout: 20_000 }).not.toBe('Credits');
  expect(errors).toEqual([]);
  await context.close();
});

test('New UI: the prologue plays on the mock-up pages: talk pages with Prof. Vance, the name entry\'s on-screen keys, the Departure cards', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await open(page, 'Prologue');
  const pro = view(page, 'Prologue');
  const session = () => page.evaluate(() => (window as any).__pkr.session.profile.story.protagonist);
  // The Look: two choices beside the Look's portrait; pointing at one shows it.
  await expect(pro.locator('[data-act="pick"]')).toHaveText(['Look A', 'Look B']);
  expect(await pro.innerHTML()).toContain('packs/mc/look_a/portrait.png');
  await pro.locator('[data-act="pick"]').nth(1).hover();
  await expect.poll(() => pro.innerHTML()).toContain('packs/mc/look_b/portrait.png');
  await pro.locator('[data-act="pick"]').first().click();
  await page.waitForTimeout(250);
  expect((await session()).look).toBe('look_a');
  await pro.locator('[data-act="pick"]', { hasText: 'Quick Start' }).click();
  await page.waitForTimeout(250);

  /** One step: a confirm button when one is lit, else the first choice not ticked yet, else Enter (a page turn). */
  const step = async () => {
    const clicked = await page.evaluate(() => {
      const b = [...document.querySelectorAll<HTMLElement>('#rx [data-act="pick"]')].filter((x) => !/opacity:\s*\.5/.test(x.getAttribute('style') ?? ''));
      const go = b.find((x) => /^(Confirm|Continue|Go |Looks right)/.test(x.innerText.trim())) ?? b.find((x) => !x.innerText.trim().startsWith('✓'));
      go?.click();
      return !!go;
    });
    if (!clicked) await page.keyboard.press('Enter');
    await page.waitForTimeout(280);
  };
  const seen = new Set<string>();
  const note = async () => {
    const html = await pro.innerHTML().catch(() => '');
    if (html.includes('packs/vance/') && html.includes('Prof. Vance')) seen.add('vance');
    if (html.includes('class="beat"') && html.includes('Departure')) seen.add('departure');
    if (/Prologue \d+\/\d+/.test(html)) seen.add('tag');
    return html;
  };

  // Up to the name entry.
  for (let i = 0; i < 80 && (await pro.locator('[data-act="key"]').count()) === 0; i++) { await note(); await step(); }
  await expect(pro.locator('[data-act="key"]')).toHaveCount(30);
  expect(seen.has('vance')).toBe(true);
  expect(seen.has('tag')).toBe(true);
  const key = (k: string) => pro.locator(`[data-act="key"][data-arg="${k}"]`).click();
  // Nothing typed yet: "That is me" is refused and the page stays.
  await pro.locator('[data-act="ok"]').click();
  await page.waitForTimeout(250);
  await expect(pro.locator('[data-act="key"]')).toHaveCount(30);
  // On-screen keys (a capital first, then small letters), the delete key, and the keyboard all type into the box.
  for (const k of ['K', 'A', 'Y', 'Y']) await key(k);
  await expect(pro).toContainText('Kayy');
  await key('⌫');
  await page.keyboard.press('e');
  await expect(pro).toContainText('Kaye');
  await page.keyboard.press('Backspace');
  await pro.locator('[data-act="clear"]').click();
  await expect(pro).not.toContainText('Kay');
  for (const k of ['K', 'A', 'Y']) await key(k);
  await pro.locator('[data-act="ok"]').click();
  await page.waitForTimeout(300);
  await expect(pro.locator('[data-act="key"]')).toHaveCount(0);

  // On to the end: pronouns, the quiz, the partner, then the Departure cards.
  for (let i = 0; i < 160 && (await scene(page)) === 'Prologue'; i++) { await note(); await step(); }
  expect(await scene(page)).not.toBe('Prologue');
  expect(seen.has('departure')).toBe(true);
  expect((await session()).name).toBe('Kay');
  expect(errors).toEqual([]);
});

test('New UI: the Siege map is the mock-up ledger page; keys and clicks move over the districts and a free gate lets you in', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=e4-siege');
  await toMap(page);
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
  const siege = view(page, 'Siege');
  await expect(siege).toContainText('The Long Ledger · Saffron');
  await expect(siege.locator('[data-act="district"]')).toHaveCount(5);
  await expect(siege).toContainText('Lost district effects');
  await expect(siege).toContainText('West Gate: Shinobi Koga poisons the Breather');
  // The cursor starts on a free gate.
  await expect(siege.locator('[data-act="enter"]')).toContainText('Enter by North Gate');
  await expect(siege).toContainText('Your rival');
  // Keys move it: two to the right is a contested gate (one battle); the middle of the city has no gate.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(siege.locator('[data-act="enter"]')).toContainText('Enter by South Gate');
  await expect(siege).toContainText('One battle');
  // Down from above the short last row lands on its last district.
  await page.keyboard.press('ArrowDown');
  await expect(siege.locator('[data-act="enter"]')).toContainText('No gate here');
  await expect(siege).toContainText('Oracle Sabrina');
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.expansion.cut.format.state.entered)).toBeNull();
  // A click moves the cursor; the button goes in. A held gate is free: no battle starts.
  await siege.locator('[data-act="district"]').nth(1).click();
  await expect(siege.locator('[data-act="enter"]')).toContainText('Enter by East Gate');
  await siege.locator('[data-act="enter"]').click();
  await expect(siege.locator('[data-act="enter"]')).toContainText('Begin Phase 1');
  await expect(siege).toContainText('You went in by the East Gate');
  await siege.locator('[data-act="enter"]').click();
  await waitForScene(page, 'Map');
  const out = await page.evaluate(() => (window as any).__pkr.session.run.expansion);
  expect(out.siege.entered).toBe('kanto.east-gate');
  expect(out.cut.format).toBeUndefined();
  expect(errors).toEqual([]);
});

test('New UI: the Rescue screen is the mock-up page: the receipt, the holding clock, the plans with their odds words, then the plan step by step', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=rescue-screen&debug=1');
  await toMap(page);
  // The state a raid loss leaves: a registered rival and two Pokémon held, the plan due now.
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
  const rescue = view(page, 'Rescue');
  await expect(rescue).toContainText('TEAM ROCKET · IMPOUND RECEIPT');
  await expect(rescue).toContainText('Holding site: The Celadon basement cells');
  await expect(rescue).toContainText('Holding clock');
  // The rival speaks first; the plans wait until every line is read (a click or Enter turns the page).
  await expect(rescue.locator('.txt .nm')).toHaveText('Blue');
  await expect(rescue.locator('[data-act="pick"]')).toHaveCount(0);
  for (let i = 0; i < 6 && (await rescue.locator('[data-act="page"]').count()) > 0; i++) {
    await rescue.locator('[data-act="page"]').click();
    await page.waitForTimeout(200);
  }
  // Five plans and "wait": each open plan with a roll shows a word, never a number.
  await expect(rescue.locator('[data-act="pick"]')).toHaveCount(6);
  await expect(rescue.locator('[data-act="pick"]').first()).toContainText('Quiet Extraction');
  await expect(rescue.locator('[data-act="pick"]').first().locator('.tg')).toHaveText(/^(Risky|Even|Likely|Safe)$/);
  await expect(rescue.locator('[data-act="pick"]').last()).toContainText('Wait for a better day');
  // Moving the cursor makes the text box speak for the choice under it.
  await page.keyboard.press('ArrowUp');
  await expect(rescue.locator('.txt')).toContainText('The offer will come back.');
  await page.keyboard.press('ArrowDown');
  // Quiet Extraction: the plan's steps take the clock's place and the answers are the buttons.
  await page.keyboard.press('Enter');
  await expect(rescue).toContainText('The plan');
  await expect(rescue).toContainText('Approach');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.session.run.expansion.rescue.active?.plan ?? null)).toBe('quiet');
  for (let i = 0; i < 6 && (await rescue.locator('[data-act="page"]').count()) > 0; i++) {
    await rescue.locator('[data-act="page"]').click();
    await page.waitForTimeout(200);
  }
  await expect(rescue.locator('[data-act="pick"]')).toHaveCount(3);
  // Esc gives the plan up; the rival is back with the offer at once.
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.session.run.expansion.rescue.active)).toBeNull();
  await expect(rescue).toContainText('Holding clock', { timeout: 15_000 });
  await page.waitForTimeout(400);
  for (let i = 0; i < 6 && (await rescue.locator('[data-act="page"]').count()) > 0; i++) {
    await rescue.locator('[data-act="page"]').click();
    await page.waitForTimeout(200);
  }
  // "Wait for a better day" (the last choice) puts it off and the map comes back.
  await rescue.locator('[data-act="pick"]').last().click();
  await waitForScene(page, 'Map');
  await expect(view(page, 'Rescue')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.expansion.rescue.holds[0].declines)).toBe(1);
  expect(errors).toEqual([]);
});

test('New UI: the Field Trial opens on the mock-up versus card with the rival, and a click starts the spar', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=field-trial&campaign=orrery-circuit&debug=1');
  // A save that has played the full prologue.
  await page.evaluate(() => { const p = (window as any).__pkr.session.profile.story.prologue; p.done = true; p.mode = 'full'; });
  for (let i = 0; i < 12 && (await scene(page)) !== 'FieldTrial'; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
  }
  await waitForScene(page, 'FieldTrial');
  const rival = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('FieldTrial').view.rivalName as string);
  const card = view(page, 'FieldTrial');
  // The card may already have timed out on a slow machine; when it is up it names the rival.
  if (await card.count()) {
    await expect(card).toContainText(rival);
    await card.click({ position: { x: 480, y: 270 } }).catch(() => undefined);
  }
  await expect(card).toHaveCount(0, { timeout: 5_000 });
  // The spar plays under it.
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('FieldTrial').children.list.find((o: any) => o.name === 'trial-body')?.text ?? ''), { timeout: 5_000 }).not.toBe('');
  expect(errors).toEqual([]);
});

test('New UI: a story scene is the mock-up talk page; its lines turn with a click and it ends on the map', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=story-backstory&campaign=orrery-circuit&debug=1');
  for (let i = 0; i < 14 && (await scene(page)) !== 'Story'; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
  }
  await waitForScene(page, 'Story');
  const story = view(page, 'Story');
  await expect(story).toBeVisible();
  await expect(story.locator('.txt')).not.toHaveText('');
  const first = await story.locator('.txt').innerText();
  // A click anywhere turns the page while lines wait; the choices (or Continue) come with the last line.
  let turned = false;
  for (let i = 0; i < 40 && (await scene(page)) === 'Story'; i++) {
    if (await story.locator('[data-act="pick"]').count()) await story.locator('[data-act="pick"]').first().click();
    else if (await story.locator('[data-act="page"]').count()) await story.locator('[data-act="page"]').first().click();
    else await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    if ((await scene(page)) === 'Story' && (await story.locator('.txt').innerText()) !== first) turned = true;
  }
  expect(turned).toBe(true);
  expect(await scene(page)).not.toBe('Story');
  expect(errors).toEqual([]);
});

test('New UI: the Breather is the mock-up page: the party strip, the quiet room, and a click on Rest heals and goes back to the map', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=e4-breather');
  await toMap(page);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    run.party[0].hp = 1;
    run.expansion = { ...(run.expansion ?? {}), cut: { format: { id: 'breather', state: { healPct: 0.5, step: 'choose', revived: null, healed: 0 } } } };
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Format');
  const room = view(page, 'Format');
  for (const bit of ['Breather', 'Bring one back', 'Nobody is down.', 'The quiet room', '+50% HP', 'Heal', '50%', 'When you rest']) await expect(room).toContainText(bit);
  await expect(room.locator('.an')).toHaveCount(1); // the one Pokémon of the party, drawn on the strip
  await expect(room.locator('[data-act="pick"]')).toHaveCount(1);
  await expect(room.locator('[data-act="pick"]')).toContainText('Rest');
  await page.screenshot({ path: 'test-results/newui-breather.png' });
  await room.locator('[data-act="pick"]').click();
  // The rest is over: the page stays until the player goes on.
  await expect(room.locator('[data-act="pick"]')).toContainText('Continue');
  await expect(room).toContainText('Everyone still standing has rested.');
  expect(await scene(page)).toBe('Format');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Map');
  const out = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    return { hp: run.party[0].hp, done: run.expansion.cut.done, format: run.expansion.cut.format ?? null };
  });
  expect(out.hp).toBeGreaterThan(1);
  expect(out.done).toEqual(['breather']);
  expect(out.format).toBeNull();
  expect(errors).toEqual([]);
});

test('New UI: the Blackout shows a card per anchor and the Seal; keys move over the standing ones and a click starts the sealed fight', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=e4-blackout');
  await toMap(page);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    const anchors = [
      { id: 'a1', place: 'the Nugget Bridge crossing', name: 'Anchor: Proton', species: ['mr-mime'], size: 2, beaten: true },
      { id: 'a2', place: 'the Celadon Lane cordon', name: 'Anchor: Petrel', species: ['mr-mime'], size: 2, beaten: false },
      { id: 'a3', place: 'the crossroads below Silph', name: 'Anchor: Ariana', species: ['mr-mime'], size: 2, beaten: false },
    ];
    run.expansion = { ...(run.expansion ?? {}), cut: { format: { id: 'blackout', state: { anchors, triad: false, pending: null, losses: 0 } } } };
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Format');
  const streets = view(page, 'Format');
  for (const bit of ['Anchor: Proton', 'Fallen', 'Anchor: Petrel', 'Standing · the Celadon Lane cordon', 'Anchor: Ariana', 'The violet Seal', 'Anchors fallen 1 / 2']) await expect(streets).toContainText(bit);
  // The count is said once, on the Seal's own line.
  await expect(streets).not.toContainText('Anchors beaten');
  // Only the two standing anchors can be picked; the cursor starts on the first of them.
  await expect(streets.locator('[data-act="pick"]')).toHaveCount(2);
  await expect(streets.locator('.sel')).toContainText('Anchor: Petrel');
  await page.keyboard.press('ArrowRight');
  await expect(streets.locator('.sel')).toContainText('Anchor: Ariana');
  await page.keyboard.press('ArrowRight');
  await expect(streets.locator('.sel')).toContainText('Anchor: Petrel');
  await page.screenshot({ path: 'test-results/newui-blackout.png' });
  await streets.locator('[data-act="pick"]', { hasText: 'Anchor: Ariana' }).click();
  await waitForScene(page, 'Battle');
  const got = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    return { pending: run.expansion.cut.format.state.pending, rule: run.battle.eventRule };
  });
  expect(got.pending).toBe('a3');
  expect(got.rule).toEqual({ noSwitchFirstTurn: true, typeBoost: { type: 'psychic', pct: 10 } });
  expect(errors).toEqual([]);
});

test('New UI: the Colossus page shows the Apex and the Blueprint of its three shields, and the button starts the raid', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=e4-colossus');
  await toMap(page);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    run.expansion = { ...(run.expansion ?? {}), cut: { format: { id: 'colossus', state: { apex: { id: 'ss.rocket.m2', name: 'M2', code: 'XD002' }, pending: false, result: null } } } };
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Format');
  const roof = view(page, 'Format');
  for (const bit of ['XD002 · The Roof', 'M2', 'Blueprint', 'Shield at 75%', 'Shield at 50%', 'Shield at 25%', 'Ten turns before the helicopter lifts it away.', 'Face M2']) await expect(roof).toContainText(bit);
  await expect(roof.locator('.an')).toHaveCount(1); // the Apex
  await page.screenshot({ path: 'test-results/newui-colossus.png' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  const raid = await page.evaluate(() => (window as any).__pkr.session.run.battle.raid);
  expect(raid.pendingShields).toHaveLength(3);
  expect(raid.timerLeft).toBe(10);
  expect(errors).toEqual([]);
});

test('New UI: the Town Roll page opens from the map with O: the town, its starred and rolled spaces, and the ones left out', async ({ page }) => {
  const errors = watch(page);
  // A seed whose first region is Kanto, so Stage 1 is Pewter City with Kanto Canon's spaces.
  await start(page, 'ui=new&seed=roll3');
  await toMap(page);
  const before = await page.evaluate(() => JSON.stringify((window as any).__pkr.session.run.expansion.canon));
  const map = view(page, 'Map');
  await expect(map.locator('[data-act="key"][data-arg="O"]')).toHaveCount(1);
  await page.keyboard.press('o');
  for (const bit of ['Town Roll', 'Veridian Forest', 'Mt. Moon', 'Always here', 'Rolled', 'Not this run:', 'Pewter City · 2 of', 'optional spaces placed on the map', 'To the map', 'Each Kanto town rolls which optional spaces appear this run.']) await expect(map).toContainText(bit);
  await expect(map.locator('.sel')).toContainText('Veridian Forest');
  await page.screenshot({ path: 'test-results/newui-town-roll.png' });
  // The arrows walk the cards; a rolled space tells what it is in the text box.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  const rolled = await map.locator('.sel b').innerText();
  await expect(map.locator('.sel')).toContainText('Rolled');
  await expect(map).toContainText(`${rolled}: `);
  // A click on a space the roll left out says so.
  const left = map.locator('span[data-act="popPick"]').first();
  const name = await left.innerText();
  await left.click();
  await expect(map).toContainText(`${name} is not here this run.`);
  // The button goes back to the map; O opens the page again and Esc closes it.
  await map.locator('[data-act="pop"]').click();
  await expect(map).not.toContainText('optional spaces placed on the map');
  await page.keyboard.press('o');
  await expect(map).toContainText('optional spaces placed on the map');
  await page.keyboard.press('Escape');
  await expect(map).not.toContainText('optional spaces placed on the map');
  // Looking rolled nothing.
  expect(await page.evaluate(() => JSON.stringify((window as any).__pkr.session.run.expansion.canon))).toBe(before);
  expect(await scene(page)).toBe('Map');
  expect(errors).toEqual([]);
});

test('New UI: the League door is the mock-up counter-pick page: pick a boxed Pokémon, swap the answered one out, and the result stays until Enter', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=door1');
  await toMap(page);
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
  const door = view(page, 'Decision');
  for (const bit of ['League counter-pick', 'Charizard', 'The League will answer this', 'Lucario', 'Registered', 'Swap it for a boxed Pokémon?', 'Snorlax', 'Dragonite', 'Tyranitar', 'Swap Charizard out', 'Keep my team', 'Registrar', 'The League has studied Charizard most.']) await expect(door).toContainText(bit);
  await expect(door.locator('.an')).toHaveCount(9); // six in the party, three in the box
  // The swap button is lit and the first boxed Pokémon is marked, as on the mock-up.
  await expect(door.locator('.btn.on')).toContainText('Swap Charizard out');
  await expect(door.locator('[data-act="pick"]', { hasText: 'Pick' })).toContainText('Snorlax');
  await page.screenshot({ path: 'test-results/newui-counter-pick.png' });
  // Up twice is Dragonite's row: the box tells what the swap does, and the mark stays until Enter.
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(door).toContainText('The League has not seen Dragonite.');
  await expect(door.locator('[data-act="pick"]', { hasText: 'Pick' })).toContainText('Snorlax');
  await page.keyboard.press('Enter');
  await expect(door.locator('[data-act="pick"]', { hasText: 'Pick' })).toContainText('Dragonite');
  await expect(door.locator('.btn.on')).toContainText('Swap Charizard out');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.pending.length)).toBe(1);
  // Enter on the swap button swaps; the result stays on the page until the next input.
  await page.keyboard.press('Enter');
  await expect(door.locator('[data-act="done"]')).toHaveCount(1);
  await expect(door).not.toContainText('Swap Charizard out');
  const after = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    return { lead: run.party[0].speciesId, box: run.box.map((m: any) => m.speciesId), pending: run.pending.length, swapped: run.expansion.league.swapped };
  });
  expect(after.lead).toBe('dragonite');
  expect(after.box).toContain('charizard');
  expect(after.pending).toBe(0);
  await page.waitForTimeout(600);
  expect(await scene(page)).toBe('Decision');
  await page.keyboard.press('Enter');
  await expect.poll(() => scene(page), { timeout: 20_000 }).not.toBe('Decision');
  expect(errors).toEqual([]);
});

test('New UI: Memories pages carry the mock-up names and tags, and an entry opens as a page that can be read and closed', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&debug=1');
  const mon = (uid: string, speciesId: string, level: number, starter = false) => ({ uid, speciesId, level, shiny: false, moves: ['tackle'], abilitySlot: 0, nature: null, held: [], starter, knockouts: 4, bossesBeaten: 1, titles: [] });
  const record = (runId: string, over: Record<string, unknown> = {}) => ({
    replays: [{ id: `${runId}:r0:s0:e5`, kind: 'gym', title: 'Gym battle against Brock', outcome: 'lose', region: 0, stage: 0, foe: { name: 'Brock', team: ['onix'] }, team: ['pikachu'], turns: 3, lines: ['T1: Pikachu used Tackle (-4); Onix used Tackle', 'T2: Pikachu fainted'] }],
    world: null, format: 1, source: 'run', runId, endedAt: '2026-10-30T12:00:00Z', seed: runId, archetypeId: 'red', campaignId: 'full', prep: null, rules: null,
    starter: { speciesId: 'pikachu', choices: ['pikachu'] }, regionOrder: ['kanto', 'johto'], regionsCleared: ['kanto'], regionReached: 1, outcome: 'defeat',
    encounters: 44, battlesWon: 30, badges: ['brock'], bosses: { gym: 8, elite: 0, champion: 0 }, team: [mon(`${runId}-a`, 'pikachu', 41, true), mon(`${runId}-b`, 'onix', 38)],
    aceUid: `${runId}-a`, rivals: [{ id: 'rv', name: 'Blue', classId: 'youngster', archetype: 'a', state: 'contender', encounters: 4, setbacks: 1, lastResult: 'lose', resolution: null, team: ['pidgeot'], rank: 'champion', world: null, narrativeWins: 0 }],
    nemeses: [], legendaries: { seen: [], caught: [] }, defeatedBy: { speciesId: 'pidgeot', level: 45, trainer: 'Blue' }, finalBattle: { result: 'lose', speciesId: 'pidgeot', level: 45, trainer: 'Blue' },
    stats: { maxLevel: 41, survivedFatal: 0, closeCalls: 0, caught: 5, shinies: 0, rivalWins: 0 }, narrative: [], chronicle: [],
    moments: [{ kind: 'firstGym', text: 'First Gym victory: beat Brock.', speciesId: null, region: 0 }, { kind: 'runEnding', text: "The journey ended against Blue's Pidgeot (Lv 45).", speciesId: 'pidgeot', region: 1 }],
    journal: [], epitaph: 'Pikachu carried this journey.', ...over,
  });
  const heirloom = { runId: 'past-1', speciesId: 'pikachu', name: 'Pikachu', level: 41, shiny: false, trainer: 'Red', chosen: null, spent: false, options: [{ id: 'egg', label: 'A Pikachu Egg', text: 'A Legacy Egg.' }, { id: 'item', label: 'Everstone', text: 'A keepsake.', itemId: 'everstone' }] };
  await page.evaluate(({ legacyRuns, heirloom }) => {
    const pkr = (window as any).__pkr;
    pkr.session.changeProfile((p: any) => ({ ...p, legacyRuns, memories: { heirlooms: [heirloom], claimed: [], cameos: [] } }));
    pkr.game.scene.getScenes(true)[0].scene.start('Memories');
  }, { legacyRuns: [record('past-1'), record('past-2', { outcome: 'victory', defeatedBy: null })], heirloom });
  await waitForScene(page, 'Memories');
  const mem = page.locator('#rx .stage[data-scene="Memories"]').first();
  const top = page.locator('#rx .stage[data-scene="Memories"]').last();
  await expect(mem).toContainText('Run Chronicles');
  // Run Journal: the mock-up's name in the band, and a Win or Loss tag on each run.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(mem).toContainText('Memories: Run Journal');
  await expect(mem.locator('.hd')).toHaveAttribute('style', /#9a5ad8/); // the story band
  await expect(mem).toContainText('Loss');
  await expect(mem).toContainText('Win');
  // An entry opens as a page over the list (it could not be read in New before), and Enter closes it.
  await page.keyboard.press('Enter');
  await expect(page.locator('#rx .stage[data-scene="Memories"]')).toHaveCount(2);
  for (const bit of ['Team: Pikachu Lv 41, Onix Lv 38', 'Rival Blue', 'Pikachu carried this journey.', 'Enter or Esc to close']) await expect(top).toContainText(bit);
  await page.screenshot({ path: 'test-results/newui-memories-reader.png' });
  await page.keyboard.press('Enter');
  await expect(page.locator('#rx .stage[data-scene="Memories"]')).toHaveCount(1);
  expect(await scene(page)).toBe('Memories');
  await page.keyboard.press('Escape');
  await expect(mem.locator('.hd')).toHaveText('Memories');
  // Fallen Trainers and Battle Replays: their names and tags; a click on the open page closes it too.
  for (const [steps, name, tag, band] of [[3, 'Memories: Fallen Trainers', 'Loss', /#9a5ad8/], [1, 'Memories: Battle Replays', 'Play', /#d8483a/]] as const) {
    for (let i = 0; i < steps; i++) await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(mem).toContainText(name);
    await expect(mem.locator('.hd')).toHaveAttribute('style', band);
    await expect(mem).toContainText(tag);
    await page.keyboard.press('Enter');
    await expect(page.locator('#rx .stage[data-scene="Memories"]')).toHaveCount(2);
    await top.locator('[data-act="close"]').last().click();
    await expect(page.locator('#rx .stage[data-scene="Memories"]')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(mem.locator('.hd')).toHaveText('Memories'); // back on the menu, the cursor where it was
  }
  // Heirlooms is the mock-up gallery.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(mem).toContainText('Memories: Heirlooms');
  await expect(mem).toContainText('Found');
  expect(errors).toEqual([]);
});

test('New UI: a champion in the Hall of Fame opens the winning-team page; Esc goes back to the list', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&debug=1');
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const mk = (speciesId: string, level: number, shiny = false) => ({ speciesId, level, shiny });
    const run = { runId: 'r128', endedAt: '2026-11-10T12:00:00Z', seed: 'r128', archetypeId: 'red', campaignId: 'full', victory: true, regionsCleared: 1, regions: 1, badges: 8, encounters: 128, defeatedBy: null, party: [mk('charizard', 52), mk('lucario', 50), mk('gengar', 49), mk('gyarados', 51, true), mk('garchomp', 53), mk('pikachu', 47)], bankCredits: 0, researchPoints: 0, achievements: [], moments: [], journal: [], epitaph: 'Charizard carried this journey.', legacy: [] };
    pkr.session.changeProfile((p: any) => ({ ...p, runHistory: [run] }));
    pkr.game.scene.getScenes(true)[0].scene.start('HallOfFame');
  });
  await waitForScene(page, 'HallOfFame');
  const stages = page.locator('#rx .stage[data-scene="HallOfFame"]');
  await expect(stages.first()).toContainText('Records');
  await expect(stages.first()).toContainText('Champion team');
  // Enter on the Records row opens nothing.
  await page.keyboard.press('Enter');
  await expect(stages).toHaveCount(1);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(stages).toHaveCount(2);
  const team = stages.last();
  for (const bit of ['Hall of Fame', 'Charizard', 'Lv 52', 'Fire · Flying', 'LEAD', 'Lucario', 'Gengar', 'Gyarados', 'Shiny', 'Garchomp', 'Pikachu', '2026-11-10 · Champion · Red. Your winning team.']) await expect(team).toContainText(bit);
  await expect(team.locator('[data-act="pick"]')).toHaveCount(6);
  await expect(team.locator('.hd')).toHaveAttribute('style', /#b8862a/); // the run end's gold band
  await expect(team.locator('.an')).toHaveCount(6);
  // No HP is on record, so no numbers are made up.
  await expect(team).not.toContainText('1 / 1');
  await expect(team.locator('.sel')).toContainText('Charizard');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(team.locator('.sel')).toContainText('Gengar');
  await page.screenshot({ path: 'test-results/newui-hall-of-fame-team.png' });
  await page.keyboard.press('Escape');
  await expect(stages).toHaveCount(1);
  expect(await scene(page)).toBe('HallOfFame');
  await page.keyboard.press('Escape');
  await waitForScene(page, 'Hub');
  expect(errors).toEqual([]);
});

test('New UI: Esc on the map opens the mock-up pause menu; its buttons open the map\'s own menus, Settings comes back to the map, End run needs an Adventure run and asks first', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  await page.waitForTimeout(250);
  const map = () => view(page, 'Map').first();
  const top = () => view(page, 'Map').last();
  const buttons = () => map().locator('[data-act="pause"][data-over="pauseOver"]');
  const paused = async (yes: boolean) => expect(buttons()).toHaveCount(yes ? 6 : 0);
  const node = await page.evaluate(() => (window as any).__pkr.session.run.currentNodeId);
  await page.keyboard.press('Escape');
  await paused(true);
  await expect(map()).toContainText('Paused');
  await expect(buttons()).toHaveText(['Resume', 'Party', 'Bag', 'Settings', 'Save', 'End run']);
  await expect(map().locator('.btn.on[data-act="pause"]')).toHaveText('Resume');
  await page.screenshot({ path: 'test-results/newui-pause.png' });
  // While paused the map does not travel: Enter is "Resume", not the stop under the cursor.
  await page.keyboard.press('Enter');
  await paused(false);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.currentNodeId)).toBe(node);
  expect(await scene(page)).toBe('Map');
  // Esc closes it too, and a click beside the buttons.
  await page.keyboard.press('Escape');
  await paused(true);
  await page.keyboard.press('Escape');
  await paused(false);
  await page.keyboard.press('Escape');
  await paused(true);
  await map().locator('.shade[data-act="pause"]').click({ position: { x: 40, y: 300 } });
  await paused(false);
  // The arrows wrap; Party, Bag and Save open the map's own menus.
  await page.keyboard.press('Escape');
  await page.keyboard.press('ArrowUp');
  await expect(map().locator('.btn.on[data-act="pause"]')).toHaveText('End run');
  // A Classic run cannot be ended from here: the button is dim, says why, and pressing it does nothing.
  await expect(map()).toContainText('Only an Adventure run can be ended here. Use Save to leave this one.');
  await page.keyboard.press('Enter');
  await paused(true);
  expect(await scene(page)).toBe('Map');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(map().locator('.btn.on[data-act="pause"]')).toHaveText('Party');
  await page.keyboard.press('Enter');
  await expect(top().locator('.hd')).toContainText('Party');
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await expect(view(page, 'Map')).toHaveCount(1);
  await paused(false);
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await buttons().nth(2).click();
  await expect(top().locator('.hd')).toContainText('Bag');
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await expect(view(page, 'Map')).toHaveCount(1);
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await buttons().nth(4).click();
  for (const bit of ['Save', 'Save & Quit', 'Save & go back to Hub']) await expect(top()).toContainText(bit);
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await expect(view(page, 'Map')).toHaveCount(1);
  // Settings opens with a way back to the map, without the rows that would leave the run.
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await buttons().nth(3).click();
  await waitForScene(page, 'Settings');
  const settings = view(page, 'Settings').last();
  await page.waitForTimeout(250);
  // Up from the first row wraps to the last one: the way back.
  await page.keyboard.press('ArrowUp');
  await expect(settings).toContainText('Back to the map');
  await expect(settings).not.toContainText('Back to the title screen');
  await settings.locator('[data-act]', { hasText: 'Save & Data' }).first().click();
  await expect(settings).toContainText('Export save to a file');
  for (const gone of ['Import save from a file', 'Replay the tutorial', 'Asset credits', 'Read the update log']) await expect(settings).not.toContainText(gone);
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await expect(settings).toContainText('Animations & Effects');
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await waitForScene(page, 'Map');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.currentNodeId)).toBe(node);
  // An Adventure run: End run opens the mock-up's "End this run?" box with the cursor on "Keep playing".
  await page.evaluate(() => { (window as any).__pkr.session.run.rules.modeId = 'adventure'; });
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await paused(true);
  await buttons().nth(5).click();
  const answers = () => map().locator('[data-act="pauseAsk"][data-over="pauseAskOver"]');
  await expect(answers()).toHaveText(['Keep playing', 'End run']);
  await expect(map()).toContainText('End this run?');
  await expect(map()).toContainText('Your progress is banked as a defeat. This cannot be undone.');
  await expect(map().locator('.btn.on[data-act="pauseAsk"]')).toHaveText('Keep playing');
  await page.screenshot({ path: 'test-results/newui-pause-confirm.png' });
  // Enter on "Keep playing", Esc, and a click beside the box all go back to the pause menu; the run goes on.
  await page.keyboard.press('Enter');
  await expect(answers()).toHaveCount(0);
  await paused(true);
  await page.keyboard.press('Enter');
  await expect(answers()).toHaveCount(2);
  await page.keyboard.press('ArrowRight');
  await expect(map().locator('.btn.on[data-act="pauseAsk"]')).toHaveText('End run');
  await page.keyboard.press('Escape');
  await expect(answers()).toHaveCount(0);
  await paused(true);
  await page.keyboard.press('Enter');
  await map().locator('.shade[data-act="pauseAsk"]').click({ position: { x: 40, y: 300 } });
  await expect(answers()).toHaveCount(0);
  await paused(true);
  expect(await scene(page)).toBe('Map');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.phase)).toBe('map');
  // "End run" in the box ends it.
  await page.keyboard.press('Enter');
  await answers().nth(1).click();
  await waitForScene(page, 'GameOver');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.victory)).toBe(false);
  expect(errors).toEqual([]);
});
