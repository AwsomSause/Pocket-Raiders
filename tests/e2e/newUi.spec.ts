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
  // The keyboard still drives the screen under it (the pointer may have moved the cursor, so any way on counts).
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
