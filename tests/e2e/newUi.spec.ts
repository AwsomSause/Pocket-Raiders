import { expect, test, type Page } from '@playwright/test';
import { scene, view, waitForScene, watch, start, toMap, addSide } from './helpers/newUi';

// The New UI (Settings > UI style: New, the default for players): from the title to the map, events, the hub dock, Party, Bag and the run end.
// The New UI specs are split over several files (newUi, battleNewUi, menusNewUi, runNewUi, storyNewUi, worldNewUi) whose
// names are spread over the alphabet, so the browser-test shards each get one of them; the shared steps are in
// helpers/newUi.ts. The older specs run with the Old UI, so both styles stay covered.

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

test('New UI: the remade event screen draws each event its own way, and the scene leans with the cursor', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  await addSide(page, { id: 'nu-duel', kind: 'event', used: false, eventId: 'underground-duel-again' });
  await addSide(page, { id: 'nu-alley', kind: 'event', used: false, eventId: 'aq59-empty-alley' });
  await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('Map').scene.start('Event', { sideId: 'nu-duel' }));
  await waitForScene(page, 'Event');
  const ev = view(page, 'Event');
  // A road event: the place's own picture, the event's name and mark, the Hiker in the scene, a card per choice.
  await expect(ev.locator('.ev-name')).toHaveText('Tunneller Hask, Again');
  await expect(ev.locator('.ev-scene .ev-pic')).toHaveCount(1);
  await expect(ev.locator('.ev-fig')).not.toHaveCount(0);
  await expect(ev.locator('.ev-ch')).toHaveCount(3);
  const mark = await ev.locator('.ev-sigil').innerHTML();
  // The first choice is a battle: the scene turns tense. The last one walks away: it cools.
  await expect(ev.locator('.ev-tone.t-danger')).toHaveCount(1);
  await expect(ev.locator('.ev-ch.on .ev-ic')).toHaveCount(1);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(150);
  await page.keyboard.press('ArrowDown');
  await expect(ev.locator('.ev-tone.t-away')).toHaveCount(1);
  await expect(ev.locator('.ev-tone.t-danger')).toHaveCount(0);
  // A redraw does not start the figures' entrance again: it carries on from when they first showed.
  expect(await ev.locator('.ev-in').first().evaluate((el) => (el as HTMLElement).style.getPropertyValue('--t0'))).toMatch(/^-\d+ms$/);
  // A town with no picture of its own is drawn, at night as its text says, with another mark.
  await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('Event').scene.start('Event', { sideId: 'nu-alley' }));
  await expect(ev.locator('.ev-name')).toHaveText('The Empty Alley', { timeout: 10_000 });
  await expect(ev.locator('.ev-scene .ev-pic')).toHaveCount(0);
  await expect(ev.locator('.ev-scene svg.ev-mid')).toHaveCount(1);
  expect(await ev.locator('.ev-sigil').innerHTML()).not.toBe(mark);
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
  await page.screenshot({ path: 'test-results/newui-bracket.png' });
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
  const lit = view(page, 'Hub').first().locator('.btn.on');
  await expect(lit).toHaveText('Town');
  await page.waitForTimeout(400);
  // One step per press, checked each time: on a loaded machine a press right after the scene change can be dropped,
  // so a press that did not move the cursor is sent again.
  for (const want of ['Unlocks', 'Events', 'New Run']) {
    for (let tries = 0; tries < 4 && (await lit.textContent()) !== want; tries++) { await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(200); }
    await expect(lit).toHaveText(want);
  }
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
  await page.screenshot({ path: 'test-results/newui-party.png' });
  // The second card opens its Summary; the seven tabs are there and a click turns the page.
  await page.waitForTimeout(250);
  await top().locator('[data-act="pick"]').nth(1).click();
  await expect(top().locator('.hd')).toContainText('Summary');
  await expect(top()).toContainText('Lv 9');
  await expect(top().locator('[data-act="tab"]')).toHaveCount(8);
  await page.screenshot({ path: 'test-results/newui-summary.png' });
  await top().locator('[data-act="tab"]', { hasText: 'Stats' }).click();
  await expect(top()).toContainText('EV');
  await page.screenshot({ path: 'test-results/newui-summary-stats.png' });
  await top().locator('[data-act="tab"]', { hasText: 'Moves' }).click();
  await expect(top().locator('[data-act="cursor"]').first()).toBeVisible();
  await page.screenshot({ path: 'test-results/newui-summary-moves.png' });
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
  await page.screenshot({ path: 'test-results/newui-bag.png' });
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
  await page.screenshot({ path: 'test-results/newui-end-defeat.png' });
  // The page ignores keys for a moment, so a press meant for the battle does not skip it.
  await page.waitForTimeout(600);
  // Witness the Rest: one card per rival, then the Champion and the last card, then back to this page.
  await page.keyboard.press('Enter');
  await expect(end.locator('.bars')).toHaveCount(2);
  await expect(end).toContainText('Joey');
  await page.screenshot({ path: 'test-results/newui-end-witness.png' });
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
  await page.screenshot({ path: 'test-results/newui-end-report.png' });
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
  await page.screenshot({ path: 'test-results/newui-end-card.png' });
  await page.keyboard.press('Escape');
  await expect(end).toContainText('RUN OVER');
  // Back to Hub leaves the run end.
  await page.waitForTimeout(250);
  await end.locator('[data-act="pick"]', { hasText: 'Back to Hub' }).click();
  await waitForScene(page, 'Hub');
  expect(errors).toEqual([]);
});
