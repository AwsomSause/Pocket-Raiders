import { expect, test } from '@playwright/test';
import { confirmUntil } from './battleInput';
import { scene, view, waitForScene, watch, start, toMap, toCommands } from './helpers/newUi';

// The New UI (Settings > UI style: New, the default for players): the battle (boxes, windows, versus and cutscene cards, Exp), tooltips, notices and the phone layout.
// The New UI specs are split over several files (newUi, battleNewUi, menusNewUi, runNewUi, storyNewUi, worldNewUi) whose
// names are spread over the alphabet, so the browser-test shards each get one of them; the shared steps are in
// helpers/newUi.ts. The older specs run with the Old UI, so both styles stay covered.

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
