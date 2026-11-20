import { expect, test, type Page } from '@playwright/test';
import { start, toCommands, waitForScene, watch } from './helpers/newUi';
import { fitProblems, onPage, pview, toPhantomMap } from './helpers/phantomUi';

// Phantom UI: the battle. The Phantom page is see-through over the live field: the foe's box, the command fan round
// your Pokémon, the slanted text box, the move cards, the Party and Item windows, the info papers and the log. The
// full-screen cards (a boss, an ace, a Mega Evolution, a Terastallization, a Dynamax, a Z-Move) are Phantom pages too.

const battle = (page: Page) => page.evaluate(() => {
  const s = (window as any).__pkr.game.scene.getScene('Battle');
  const run = (window as any).__pkr.session.run;
  return { turn: (run.battle?.turn ?? -1) as number, tab: s.tabs.current as string | null, menu: (s.menu?.options.map((o: { label: string }) => o.label) ?? []) as string[], name: s.playerBox.name.text as string, foe: s.speciesName(s.shown.enemy) as string, party: run.party.length as number, hidden: s.playerBox.container.cameraFilter !== 0 && s.message.cameraFilter !== 0 };
});
/** Stops (or restarts) the battle's own clock, so a card that ends by itself stays while it is measured. */
const hold = (page: Page, on: boolean) => page.evaluate((on) => { (window as any).__pkr.game.scene.getScene('Battle').time.paused = on; }, on);
const press = async (page: Page, key: string) => { await page.keyboard.press(key); await page.waitForTimeout(300); };
async function toBattle(page: Page, seed: string) {
  await start(page, `ui=phantom&seed=${seed}`);
  await toPhantomMap(page);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  await onPage(page, 'Battle', 'battle');
  await toCommands(page);
}

test('Phantom UI: the battle is a see-through Phantom page; the fan, the move cards, the lists, the info papers and the log all work, and a move chosen by click plays the turn', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await toBattle(page, 'newui-e2e');
  const hud = pview(page, 'Battle', 'battle');
  // The page is see-through: the canvas keeps the arena and the Pokémon, and leaves its own boxes out of the picture.
  await expect(hud).toHaveClass(/clear/);
  const first = await battle(page);
  expect(first.hidden).toBe(true);
  expect(first.tab).toBeNull();
  await expect(hud.locator('.ph-bt-foe')).toHaveCount(1);
  await expect(hud.locator('.ph-bt-m')).toContainText(first.name.trim(), { ignoreCase: true });
  await expect(hud.locator('.ph-bt-say')).toContainText('What will');
  // The command menu stands in the fan round your Pokémon (mock-up `battle`): Info, the commands, then Auto.
  await expect(hud.locator('.ph-bt-fan.cmd')).toHaveCount(1);
  await expect(hud.locator('.ph-bt-cmd')).toHaveCount(first.menu.length);
  await expect(hud.locator('.ph-bt-cmd.on')).toContainText('Fight', { ignoreCase: true });
  await expect(hud.locator('.ph-bt-cmd.on kbd')).toHaveText('Z');
  await expect(hud.locator('.ph-bt-menu')).toHaveCount(0);
  await expect(hud.locator('.ph-bt-tab')).toHaveCount(2);
  await expect(hud.locator('.ph-bt-tab.on')).toHaveCount(0);
  await expect(hud.locator('.ph-bt-tab', { hasText: /info/i }).locator('kbd')).toHaveText('I');
  await expect(hud.locator('.ph-bt-tab', { hasText: /auto/i }).locator('kbd')).toHaveText('T');
  // Your card and the rest of the party stand at the right; the turn ribbon at the top.
  await expect(hud.locator('.ph-bt-stack.top .ph-bt-bn')).toHaveCount(first.party - 1);
  await expect(hud.locator('.ph-bt-ord')).toContainText('Turn');
  expect(await fitProblems(page, 'Battle', 'battle')).toEqual([]);
  // Pointing at a command lights it; the arrows move it back.
  // (The text box is still typing, so the page may redraw under a still pointer: the hover is tried until it lands.)
  await expect(async () => {
    await hud.locator('.ph-bt-cmd').nth(1).hover();
    await expect(hud.locator('.ph-bt-cmd').nth(1)).toHaveClass(/\bon\b/, { timeout: 1000 });
  }).toPass({ timeout: 10_000 });
  await press(page, 'ArrowDown');
  const lit = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').menu.index as number);
  expect(lit).not.toBe(1);
  await expect(hud.locator('.ph-bt-cmd').nth(lit)).toHaveClass(/\bon\b/);
  await expect(hud.locator('.ph-bt-cmd.on')).toHaveCount(1);
  // Fight: the mock-up's cross of move cards with PP and the target's card; the fan and the boxes step aside.
  await hud.locator('.ph-bt-cmd', { hasText: /fight/i }).click();
  await expect.poll(async () => (await battle(page)).tab).toBe('attack');
  const moves = hud.locator('.ph-bt-mv');
  await expect(moves.first()).toBeVisible();
  await expect(moves.first()).toContainText('PP');
  await expect(hud.locator('.ph-bt-x')).toHaveCount(1);
  await expect(hud.locator('.ph-bt-tg')).toContainText(first.foe.trim(), { ignoreCase: true });
  await expect(hud.locator('.ph-bt-tg')).toContainText('Power');
  await expect(hud.locator('.ph-bt-hd')).toContainText('Fight', { ignoreCase: true });
  await expect(hud.locator('.ph-bt-fan')).toHaveCount(0);
  await expect(hud.locator('.ph-bt-foe')).toHaveCount(0);
  await page.waitForTimeout(500);
  expect(await fitProblems(page, 'Battle', 'battle')).toEqual([]);
  // The arrows move the lit card; pointing at a card lights it.
  await press(page, 'ArrowRight');
  await expect(moves.nth(1)).toHaveClass(/\bon\b/);
  await moves.first().hover();
  await expect(moves.first()).toHaveClass(/\bon\b/);
  // The page's Back key goes back to the commands.
  await hud.locator('[data-act="back"]').click();
  await expect.poll(async () => (await battle(page)).tab).toBeNull();
  await expect(hud.locator('.ph-bt-fan.cmd')).toHaveCount(1);
  await hud.locator('.ph-bt-cmd', { hasText: /fight/i }).click();
  await expect.poll(async () => (await battle(page)).tab).toBe('attack');
  // E: the Party window, a Phantom list over the field. Esc steps back to the commands.
  await press(page, 'e');
  await expect.poll(async () => (await battle(page)).tab).toBe('party');
  const list = pview(page, 'Battle', 'blist');
  await expect(list.locator('.ph-bl-r').first()).toBeVisible();
  await expect(list.locator('.ph-bl-r.on')).toHaveCount(1);
  await expect(hud.locator('.ph-bt-tab.on')).toContainText('Party', { ignoreCase: true });
  expect(await fitProblems(page, 'Battle', 'blist')).toEqual([]);
  // E again: the Item window, with its pocket tabs and the battle's item budget.
  await press(page, 'e');
  await expect.poll(async () => (await battle(page)).tab).toBe('item');
  await expect(list.locator('.ph-bl-tabs span').first()).toBeVisible();
  await expect(hud.locator('.ph-bt-fx.bud')).toContainText('Heals');
  await page.waitForTimeout(400);
  expect(await fitProblems(page, 'Battle', 'blist')).toEqual([]);
  expect(await fitProblems(page, 'Battle', 'battle')).toEqual([]);
  await press(page, 'Escape');
  await expect.poll(async () => (await battle(page)).tab).toBeNull();
  await expect(list).toHaveCount(0);
  // I: the Battle info page (mock-up binfo): both sides with their stat ladders, the field and who moves first,
  // and every other line of the old info panel on a card a page at a time (E/Q switch). L opens the log from it.
  await press(page, 'i');
  const sides = hud.locator('.ph-bi-side');
  await expect(sides).toHaveCount(2);
  await expect(sides.nth(1)).toContainText((await battle(page)).foe, { ignoreCase: true });
  expect(await hud.locator('.ph-bi-side .b3-sr').count()).toBeGreaterThanOrEqual(10);
  await expect(hud.locator('.ph-bi-fld')).toContainText('Who moves first');
  await expect(hud.locator('.ph-bi-more .ph-bi-tabs span').first()).toHaveClass(/\bon\b/);
  await expect(hud.locator('.ph-bi-more')).toContainText('Stance');
  await page.waitForTimeout(400);
  expect(await fitProblems(page, 'Battle', 'battle')).toEqual([]);
  await press(page, 'e');
  await expect(hud.locator('.ph-bi-more .ph-bi-tabs span').nth(1)).toHaveClass(/\bon\b/);
  await expect(hud.locator('.ph-bi-side.r')).toHaveClass(/\bon\b/);
  // L: the battle log page, a row per line with who acted; its tabs filter, Q goes back to Battle info.
  await press(page, 'l');
  await expect(sides).toHaveCount(0);
  const rows = hud.locator('.ph-lg .ph-lg-r');
  await expect(hud.locator('.ph-lg')).toContainText('appeared');
  await expect(rows.last()).toHaveClass(/\bon\b/);
  await page.waitForTimeout(400);
  expect(await fitProblems(page, 'Battle', 'battle')).toEqual([]);
  await hud.locator('.ph-lg-tabs [data-act="log"]').nth(1).click();
  await expect(hud.locator('.ph-lg-tabs [data-act="log"]').nth(1)).toHaveClass(/\bon\b/);
  await hud.locator('.ph-lg-tabs [data-act="log"]').first().click();
  await press(page, 'q');
  await expect(sides).toHaveCount(2);
  await hud.locator('.ph-bi-keys [data-act="info"]').click();
  await expect(sides).toHaveCount(0);
  // H opens the same log; Esc shuts it, and the commands are back.
  await press(page, 'h');
  await expect(hud.locator('.ph-lg')).toBeVisible();
  await press(page, 'Escape');
  await expect(hud.locator('.ph-lg')).toHaveCount(0);
  // Every version and several window sizes: nothing cut off.
  for (const [id, w, h] of [['midnight', 844, 390], ['channel', 1920, 1080], ['fantasia', 1024, 768], ['velvet', 1280, 720], ['phantom', 1280, 720]] as const) {
    await page.evaluate((id) => { const pkr = (window as any).__pkr; pkr.session.saveSettings({ ...pkr.session.settings, phantomVersion: id }); pkr.game.scene.getScene('Battle').rx.refresh(); }, id);
    await page.setViewportSize({ width: w, height: h });
    await expect(page.locator(`#phx .phs[data-scene="Battle"][data-scr="battle"][data-liv="${id}"]`)).toBeVisible();
    await page.waitForTimeout(900);
    expect(await fitProblems(page, 'Battle', 'battle'), `${id} at ${w}x${h}`).toEqual([]);
  }
  // A move chosen by click plays the turn.
  await hud.locator('.ph-bt-cmd', { hasText: /fight/i }).click();
  await expect(moves.first()).toBeVisible();
  await page.waitForTimeout(300);
  await moves.first().click();
  await expect.poll(async () => { const b = await battle(page); return b.turn > first.turn || b.turn === -1; }, { timeout: 30_000 }).toBe(true);
  expect(errors).toEqual([]);
});

test('Phantom UI: the full-screen battle cards are Phantom pages: an ace, a boss, and the Mega, Tera, Dynamax and Z-Move cut-ins; a click moves on', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await toBattle(page, 'newui-e2e');
  const gone = async (id: string) => { await pview(page, 'Battle', id).locator('.ph-ct-next').click(); await expect(pview(page, 'Battle', id)).toHaveCount(0); await page.waitForTimeout(300); };
  // The ace is announced: its name in cut-out letters under the star.
  await page.evaluate(() => { const s = (window as any).__pkr.game.scene.getScene('Battle'); void s.bigMoment('aceEntrance', `e2e.ace.${Date.now()}`, 'ACE!', 'Rival: Feebas', true, { name: 'Feebas', role: 'Rival ace', line: 'This is where you stop.' }); });
  await hold(page, true);
  await onPage(page, 'Battle', 'ace');
  await page.waitForTimeout(700);
  const ace = pview(page, 'Battle', 'ace');
  await expect(ace.locator('.ac-t .rs')).toHaveAttribute('aria-label', 'FEEBAS');
  await expect(ace.locator('.ac-star')).toHaveText('ACE');
  await expect(ace.locator('.ac-say')).toContainText('This is where you stop.');
  await expect(ace.locator('.ph-ct-beat i')).toHaveCount(5);
  expect(await fitProblems(page, 'Battle', 'ace')).toEqual([]);
  await gone('ace');
  await hold(page, false);
  // A boss's entrance: the name, the plate, the line.
  await page.evaluate(() => { const s = (window as any).__pkr.game.scene.getScene('Battle'); void s.bigMoment('championIntro', `e2e.boss.${Date.now()}`, 'THE CHAMPION', 'Champion Lance', true, { name: 'Lance', role: 'Champion', line: 'You have earned this. See my true strength!' }); });
  await hold(page, true);
  await onPage(page, 'Battle', 'boss');
  await page.waitForTimeout(700);
  const boss = pview(page, 'Battle', 'boss');
  await expect(boss.locator('.bs-t .rs')).toHaveAttribute('aria-label', 'LANCE');
  await expect(boss.locator('.bs-t em')).toHaveText('Champion');
  await expect(boss.locator('.bs-i')).toContainText('See my true strength!');
  expect(await fitProblems(page, 'Battle', 'boss')).toEqual([]);
  await gone('boss');
  await hold(page, false);
  // The four transformation cut-ins, each with its own facts.
  const cutIn = (kind: string, x: Record<string, unknown>) => page.evaluate(([kind, x]) => {
    const s = (window as any).__pkr.game.scene.getScene('Battle');
    const mon = s.shown.player;
    void s.phGimmickCard('player', mon, kind, { to: mon.speciesId, itemId: null, teraType: null, zBase: null, zMoveId: null, ...(x as object) });
  }, [kind, x] as const);
  const name = (await battle(page)).name.trim().replace(/\s*[♂♀]$/, '');
  for (const [kind, id, x, text] of [['mega', 'mega', {}, 'Mega Evolving'], ['tera', 'tera', { teraType: 'dragon' }, 'Terastallized into the Dragon type'], ['dynamax', 'dmax', {}, 'Max Moves'], ['zmove', 'zmove', {}, 'Z-Power']] as const) {
    await cutIn(kind, x);
    await hold(page, true);
    await onPage(page, 'Battle', id);
    await page.waitForTimeout(700);
    const view = pview(page, 'Battle', id);
    await expect(view).toContainText(text, { ignoreCase: true });
    await expect(view).toContainText(name, { ignoreCase: true });
    expect(await fitProblems(page, 'Battle', id), kind).toEqual([]);
    await gone(id);
    await hold(page, false);
  }
  // Dynamax says how long it lasts.
  await cutIn('dynamax', {});
  await onPage(page, 'Battle', 'dmax');
  await expect(pview(page, 'Battle', 'dmax').locator('.dx-turn')).toContainText('turn');
  // Left alone, a cut-in ends by itself.
  await expect(pview(page, 'Battle', 'dmax')).toHaveCount(0, { timeout: 8_000 });
  // The battle is as it was: the commands are still up.
  await expect(pview(page, 'Battle', 'battle').locator('.ph-bt-op').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('Phantom UI: a Trainer battle opens on the Phantom versus card, and a Gym Leader enters on the boss card that says what they bring', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=newui-e2e');
  await toPhantomMap(page);
  const trainer = await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const node = session.run.stage.map.nodes.find((n: any) => n.column === 1);
    node.kind = 'trainer';
    session.chooseNode(node.id);
    game.scene.getScene('Map').scene.start('Battle');
    return { name: session.run.battle.trainer.name as string, team: session.run.battle.enemyTeam.length as number, party: session.run.party.length as number };
  });
  await waitForScene(page, 'Battle');
  const vs = pview(page, 'Battle', 'vs');
  await expect(vs).toBeVisible({ timeout: 15_000 });
  await hold(page, true);
  await onPage(page, 'Battle', 'vs');
  await page.waitForTimeout(700);
  await expect(vs.locator('.vs-n.r .tl1')).toHaveText(trainer.name);
  await expect(vs.locator('.vs-n.l .lab')).toContainText(`${trainer.party} Pokémon`);
  await expect(vs.locator('.vs-v .rs')).toHaveAttribute('aria-label', 'VS');
  await expect(vs.locator('.hd')).toContainText('battle', { ignoreCase: true });
  // The foe's first Pokémon is shown, the rest stay as balls.
  await expect(vs.locator('.vs-n.r .ph-vs-ball')).toHaveCount(Math.min(6, trainer.team) - 1);
  expect(await fitProblems(page, 'Battle', 'vs')).toEqual([]);
  // The battle's own page is not out yet; a click moves on to it.
  await expect(pview(page, 'Battle', 'battle').locator('.ph-bt-foe')).toHaveCount(0);
  await vs.locator('.ph-fill').click();
  await expect(vs).toHaveCount(0);
  await hold(page, false);
  await toCommands(page);
  await expect(pview(page, 'Battle', 'battle').locator('.ph-bt-op', { hasText: /fight/i })).toBeVisible();
  // A Trainer's box counts their team as balls.
  await expect(pview(page, 'Battle', 'battle').locator('.ph-bt-foe .ph-bt-balls i')).toHaveCount(Math.min(6, trainer.team));

  // The stage's Gym Leader: the boss card first, then the versus card.
  await start(page, 'ui=phantom&seed=newui-e2e');
  await toPhantomMap(page);
  const boss = await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const last = Math.max(...session.run.stage.map.nodes.map((n: any) => n.column));
    session.debugJumpToColumn(last);
    const node = session.run.stage.map.nodes.find((n: any) => n.column === last);
    session.chooseNode(node.id);
    game.scene.getScene('Map').scene.start('Battle');
    return { kind: node.kind as string, name: session.run.battle.trainer.name as string, team: session.run.battle.enemyTeam.length as number };
  });
  expect(boss.kind).toBe('gym');
  await waitForScene(page, 'Battle');
  const card = pview(page, 'Battle', 'boss');
  await expect(card).toBeVisible({ timeout: 15_000 });
  await hold(page, true);
  await onPage(page, 'Battle', 'boss');
  await page.waitForTimeout(700);
  await expect(card.locator('.bs-t em')).toHaveText('Gym Leader');
  await expect(card.locator('.bs-i')).toContainText(`${boss.team} Pokémon`);
  await expect(card.locator('.bs-i')).toContainText('The ace is announced when it enters.');
  await expect(card.locator('.ph-ct-beat i')).toHaveCount(5);
  await expect(card.locator('.keys')).toContainText('skip', { ignoreCase: true });
  expect(await fitProblems(page, 'Battle', 'boss')).toEqual([]);
  // Esc skips it, once and for all; the versus card follows.
  await hold(page, false);
  await page.keyboard.press('Escape');
  await expect(card).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__pkr.session.settings.skippedIntros.length)).toBe(1);
  await expect(pview(page, 'Battle', 'vs')).toBeVisible({ timeout: 15_000 });
  await expect(pview(page, 'Battle', 'vs').locator('.hd')).toContainText('Gym Leader battle', { ignoreCase: true });
  await pview(page, 'Battle', 'vs').locator('.ph-fill').click();
  await toCommands(page);
  await expect(pview(page, 'Battle', 'battle').locator('.ph-bt-op').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('Phantom UI: a wild battle opens on the wild card and the send-out card; a hard hit, a knock-out, the win, the tally and a loss to a rival are Phantom pages', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=newui-e2e');
  await toPhantomMap(page);
  const foe = await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const node = session.run.stage.map.nodes.find((n: any) => n.column === 1);
    node.kind = 'wild';
    session.chooseNode(node.id);
    game.scene.getScene('Map').scene.start('Battle');
    const m = session.run.battle.enemyTeam[0];
    return { name: session.content.species.get(m.speciesId).name as string, level: m.level as number, wild: !session.run.battle.trainer, me: session.content.species.get(session.run.party[0].speciesId).name as string };
  });
  expect(foe.wild).toBe(true);
  await waitForScene(page, 'Battle');
  // A card that ends by itself is held (the battle's clock stops) the moment it shows, so it can be measured.
  await page.evaluate(() => {
    const w = window as any;
    w.__hold = ['wild'];
    w.__holdT = setInterval(() => { for (const id of w.__hold) if (document.querySelector(`#phx .phs[data-scene="Battle"][data-scr="${id}"]`)) w.__pkr.game.scene.getScene('Battle').time.paused = true; }, 20);
  });
  const holdOn = (ids: string[]) => page.evaluate((ids) => { (window as any).__hold = ids; }, ids);
  const measure = async (id: string) => {
    await onPage(page, 'Battle', id);
    await page.waitForTimeout(900);
    expect(await fitProblems(page, 'Battle', id), id).toEqual([]);
  };
  // A click ends a card whatever its clock says (the short ones would end by themselves before a slow machine clicks).
  const gone = async (id: string, next: string[] = []) => {
    await holdOn(next);
    await pview(page, 'Battle', id).locator('.ph-ct-next').click();
    await expect(pview(page, 'Battle', id)).toHaveCount(0);
    await hold(page, false);
    await page.waitForTimeout(300);
  };

  // The wild Pokémon steps out: its name in cut-out letters, its level, and whether a ball will work.
  const wild = pview(page, 'Battle', 'wild');
  await expect(wild).toBeVisible({ timeout: 15_000 });
  await measure('wild');
  await expect(wild.locator('.wl-t .rs')).toHaveAttribute('aria-label', foe.name.toUpperCase());
  await expect(wild.locator('.wl-tags')).toContainText(`Lv.${foe.level}`);
  await expect(wild.locator('.wl-c')).toContainText(/It can(’|')?t? be caught|It can be caught/);
  await expect(wild.locator('.keys')).toContainText('Send out', { ignoreCase: true });
  // The Pokédex key opens the species' page over the card; the card waits under it and is still there afterwards.
  await expect(wild.locator('.keys')).toContainText('Pokédex', { ignoreCase: true });
  await page.keyboard.press('q');
  const entry = pview(page, 'Battle', 'dexentry');
  await expect(entry).toBeVisible();
  await expect(entry.locator('.hd')).toContainText(foe.name, { ignoreCase: true });
  await page.waitForTimeout(900);
  expect(await fitProblems(page, 'Battle', 'dexentry'), 'dexentry').toEqual([]);
  await page.keyboard.press('Escape');
  await expect(entry).toHaveCount(0);
  await expect(wild).toBeVisible();
  await gone('wild', ['send']);

  // Then both sides send out. The lines before it take Enter; the card itself is held when it shows.
  const send = pview(page, 'Battle', 'send');
  for (let n = 0; n < 40 && (await send.count()) === 0; n++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  await expect(send).toBeVisible();
  await measure('send');
  await expect(send.locator('.sn-go .rs')).toHaveAttribute('aria-label', 'GO!');
  await expect(send.locator('.sn-n.l')).toContainText(foe.me);
  await expect(send.locator('.sn-n.r')).toContainText(foe.name);
  await expect(send.locator('.sn-n.r .lab')).toHaveText(/wild pokémon/i);
  await expect(send.locator('.sn-ord i.on')).toHaveCount(1);
  await gone('send');
  await toCommands(page);

  // A hard hit: the words, the damage and the bar.
  await holdOn(['hit', 'ko', 'win', 'result', 'rloss']);
  await page.evaluate(() => {
    const s = (window as any).__pkr.game.scene.getScene('Battle');
    s.phLast = { side: 'player', by: 'Rowlet', move: 'Leafage' };
    void s.phHitCard(s.shown.enemy, Math.max(1, Math.floor(s.shown.enemy.hp * 0.23)), true, false);
  });
  const hit = pview(page, 'Battle', 'hit');
  await expect(hit).toBeVisible();
  await measure('hit');
  await expect(hit.locator('.big .rs').first()).toHaveAttribute('aria-label', 'SUPER');
  await expect(hit.locator('.dmg')).toContainText('−');
  await expect(hit.locator('.foebar h3')).toContainText(foe.name);
  await expect(hit.locator('.say')).toContainText('LEAFAGE');
  await gone('hit');

  // A knock-out: who fell, and how many the Trainer has left.
  await holdOn(['ko', 'win', 'result', 'rloss']);
  await page.evaluate(() => {
    const s = (window as any).__pkr.game.scene.getScene('Battle');
    s.phHits = 1;
    void s.phKoCard(s.shown.enemy, { battle: { trainer: { name: 'Silver' }, enemyTeam: [{ hp: 1 }, { hp: 1 }, { hp: 1 }, { hp: 0 }] } }, 'Silver', 1);
  });
  const ko = pview(page, 'Battle', 'ko');
  await expect(ko).toBeVisible();
  await measure('ko');
  await expect(ko.locator('.ko-tag')).toHaveText('One Leafage was all it took.');
  await expect(ko.locator('.ko-foe')).toContainText(foe.name);
  await expect(ko.locator('.ko-left b')).toHaveText('Silver has 2 left');
  await expect(ko.locator('.ko-left .ph-vs-ball')).toHaveCount(4);
  await gone('ko');

  // The win, with what the foe says as they lose.
  await holdOn(['win', 'result', 'rloss']);
  const said = await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const s = game.scene.getScene('Battle');
    const cls = [...session.content.trainers.values()].find((t: any) => t.lines?.lose) as any;
    void s.phWinCard('Youngster Joey', { battle: { trainer: { name: 'Joey', classId: cls.id } } });
    return cls.lines.lose as string;
  });
  const win = pview(page, 'Battle', 'win');
  await expect(win).toBeVisible();
  await measure('win');
  await expect(win.locator('.big .rs')).toHaveAttribute('aria-label', 'YOU WIN');
  await expect(win.locator('.ph-wn-line')).toContainText(said.replace(/^["“]|["”]$/g, ''));
  await expect(win.locator('.sub')).toHaveText('Youngster Joey is out of Pokémon');
  await gone('win');

  // The tally: it waits for an input (no clock ends it).
  await holdOn([]);
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const s = game.scene.getScene('Battle');
    const r = session.run;
    s.phTallyKey = r.battle.enemyTeam[0].uid;
    s.phTally.set(r.party[0].uid, { gain: 1420, from: 20, fromLevel: 5, toLevel: 6 });
    void s.phResultCard({ end: { outcome: 'win', moneyGained: 1240, itemsFound: ['potion'] }, run: r }, r, false);
  });
  const result = pview(page, 'Battle', 'result');
  await expect(result).toBeVisible();
  await measure('result');
  await page.waitForTimeout(3500);
  await expect(result).toBeVisible();
  await expect(result.locator('.tl')).toHaveCount(await page.evaluate(() => (window as any).__pkr.session.run.party.length));
  await expect(result.locator('.tl').first()).toContainText('+1420');
  await expect(result.locator('.lvup')).toHaveText('LEVEL UP! 5 → 6');
  await expect(result.locator('.gains')).toContainText('+₽1,240');
  await expect(result.locator('.gains')).toContainText('Potion');
  await expect(result.locator('.hd')).toContainText('Wild battle', { ignoreCase: true });
  await gone('result');

  // A loss to a rival: the run goes on, and the page says so.
  const lose = () => page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const s = game.scene.getScene('Battle');
    const cls = [...session.content.trainers.values()].find((t: any) => t.lines?.win) as any;
    void s.phRivalLossCard({ battle: { trainer: { name: 'Silver', classId: cls.id }, rival: true } }, session.run);
  });
  await lose();
  const loss = pview(page, 'Battle', 'rloss');
  await expect(loss).toBeVisible();
  await measure('rloss');
  await expect(loss.locator('.rl-big .rs').first()).toHaveAttribute('aria-label', 'THE RUN');
  await expect(loss.locator('.rl-i')).toContainText('Losing to a rival never ends a run.');
  await expect(loss.locator('.rl-i')).toContainText('Silver');
  await expect(loss.locator('.hd')).toContainText('Rival battle lost', { ignoreCase: true });
  await gone('rloss');
  // Every version and a small window: nothing cut off.
  for (const [id, w, h] of [['midnight', 844, 390], ['fantasia', 1024, 768], ['velvet', 1920, 1080], ['channel', 1280, 720]] as const) {
    await page.evaluate((id) => { const pkr = (window as any).__pkr; pkr.session.saveSettings({ ...pkr.session.settings, phantomVersion: id }); }, id);
    await page.setViewportSize({ width: w, height: h });
    await lose();
    await expect(page.locator(`#phx .phs[data-scene="Battle"][data-scr="rloss"][data-liv="${id}"]`)).toBeVisible();
    await page.waitForTimeout(900);
    expect(await fitProblems(page, 'Battle', 'rloss'), `${id} at ${w}x${h}`).toEqual([]);
    await gone('rloss');
  }
  expect(errors).toEqual([]);
});

test('Phantom UI: the gimmick page shows all four and arms a ready one for the next move; a phase card and a side stage card are Phantom pages', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watch(page);
  await toBattle(page, 'newui-e2e');
  const hud = pview(page, 'Battle', 'battle');
  const scene = <T>(fn: string) => page.evaluate((fn) => new Function('s', 'session', `return (${fn})(s, session)`)((window as any).__pkr.game.scene.getScene('Battle'), (window as any).__pkr.session), fn) as Promise<T>;
  await hud.locator('.ph-bt-op', { hasText: /fight/i }).click();
  await expect.poll(async () => (await battle(page)).tab).toBe('attack');
  const moves = (await battle(page)).menu;
  expect(moves.length).toBeGreaterThan(0);

  // G (or its chip over the moves) opens the page. With no ring, orb or band yet, all four say what they need.
  const chip = hud.locator('.ph-bt-gim.all');
  await expect(chip).toContainText('Gimmicks', { ignoreCase: true });
  await page.waitForTimeout(300);
  await page.keyboard.press('g');
  const gm = pview(page, 'Battle', 'gimmick');
  await expect(gm).toBeVisible();
  await expect(gm.locator('.gm-c')).toHaveCount(4);
  await expect(gm.locator('.gm-c.off')).toHaveCount(4);
  await expect(gm.locator('.gm-tera .gm-f')).toContainText('Tera Orb');
  await expect(gm.locator('.gm-dmax .gm-f')).toContainText('Dynamax Band');
  await expect(gm.locator('.gm-z .gm-f')).toContainText('Z-Ring');
  await expect(gm.locator('.gm-note')).toBeVisible();
  await expect(gm.locator('.keys')).toContainText('Not ready');
  await page.waitForTimeout(800);
  expect(await fitProblems(page, 'Battle', 'gimmick')).toEqual([]);
  // Z on one that is not ready changes nothing; X goes back to the moves.
  await page.keyboard.press('z');
  await page.waitForTimeout(300);
  await expect(gm).toBeVisible();
  expect(await scene<string | null>('(s) => s.transformChoice?.kind ?? null')).toBeNull();
  await page.keyboard.press('x');
  await expect(gm).toHaveCount(0);
  await expect.poll(async () => (await battle(page)).menu).toEqual(moves);
  expect((await battle(page)).turn).toBe(1);

  // With a Tera Orb in the Bag, Terastallize is ready: the cursor starts on it, and Z arms it for the next move.
  await scene('(s, session) => { session.run.inventory["tera-orb"] = 1; }');
  await page.waitForTimeout(300);
  await chip.click();
  await expect(gm).toBeVisible();
  await expect(gm.locator('.gm-c.off')).toHaveCount(3);
  await expect(gm.locator('.gm-tera')).toHaveClass(/(^| )on( |$)/);
  await expect(gm.locator('.gm-tera .gm-f')).toContainText('READY');
  await expect(gm.locator('.keys')).toContainText('Use it');
  await page.keyboard.press('ArrowRight');
  await expect(gm.locator('.gm-dmax')).toHaveClass(/(^| )on( |$)/);
  await expect(gm.locator('.keys')).toContainText('Not ready');
  await page.keyboard.press('ArrowLeft');
  await expect(gm.locator('.gm-tera')).toHaveClass(/(^| )on( |$)/);
  await page.waitForTimeout(300);
  await page.keyboard.press('z');
  await expect(gm).toHaveCount(0);
  expect(await scene<string | null>('(s) => s.transformChoice?.kind ?? null')).toBe('tera');
  // Still choosing a move: the press that armed it did not also pick one.
  await page.waitForTimeout(400);
  expect((await battle(page)).turn).toBe(1);
  expect((await battle(page)).menu.length).toBe(moves.length);
  await expect(hud.locator('.ph-bt-gim.on')).toContainText('Terastallize', { ignoreCase: true });
  // Open again: it shows as on, and Z takes it off.
  await page.keyboard.press('g');
  await expect(gm).toBeVisible();
  await expect(gm.locator('.gm-tera .gm-f')).toContainText('ON');
  await expect(gm.locator('.keys')).toContainText('Take it off');
  await gm.locator('.gm-tera').click();
  await expect(gm).toHaveCount(0);
  expect(await scene<string | null>('(s) => s.transformChoice?.kind ?? null')).toBeNull();

  // A fight that changes gear: the last stand card waits for the player.
  const phaseOn = () => scene('(s) => { void s.phPhaseCard("It is not over! The final boss rises for a second phase. Your party was restored.", "Face the champion", { word: "LAST STAND", meter: { at: 2, of: 2 } }); }');
  const sideOn = () => scene('(s, session) => { session.run.battle.event = { eventId: "rescue:e2e", choiceIndex: 0, success: true }; void s.phSideCard().finally(() => { if (session.run.battle) delete session.run.battle.event; }); }');
  const shut = async (id: string) => { await pview(page, 'Battle', id).locator('.ph-ct-next').click(); await expect(pview(page, 'Battle', id)).toHaveCount(0); await page.waitForTimeout(300); };
  await phaseOn();
  const phase = pview(page, 'Battle', 'phase');
  await expect(phase).toBeVisible();
  await expect(phase.locator('.lp-t .rs')).toHaveAttribute('aria-label', 'LAST STAND');
  await expect(phase.locator('.lp-m')).toContainText('2 of 2');
  await expect(phase.locator('.lp-mid p')).toContainText('It is not over!');
  await expect(phase.locator('.keys')).toContainText('Face the champion');
  await page.waitForTimeout(900);
  expect(await fitProblems(page, 'Battle', 'phase')).toEqual([]);
  // It does not end by itself.
  await page.waitForTimeout(3200);
  await expect(phase).toBeVisible();
  await shut('phase');

  // A fight inside an event: the side stage card names the stage it does not use up.
  await sideOn();
  const side = pview(page, 'Battle', 'side');
  await expect(side).toBeVisible();
  await expect(side.locator('.sy-sd .rs').first()).toHaveAttribute('aria-label', 'SIDE');
  await expect(side.locator('.sy-rule')).toContainText('does not use one up');
  await expect(side.locator('.sy-rule')).toContainText(/You are still on stage 1 of \d+/);
  await expect(side.locator('.sy-line span.on')).toContainText('+ side', { ignoreCase: true });
  await expect(side.locator('.sy-st span.on')).toContainText('Side stage', { ignoreCase: true });
  await expect(side.locator('.sy-foe b')).not.toBeEmpty();
  await page.waitForTimeout(900);
  expect(await fitProblems(page, 'Battle', 'side')).toEqual([]);
  await shut('side');

  // Every version and a small window: nothing cut off.
  for (const [id, w, h] of [['midnight', 844, 390], ['fantasia', 1024, 768], ['velvet', 1920, 1080], ['channel', 1280, 720]] as const) {
    await page.evaluate((id) => { const pkr = (window as any).__pkr; pkr.session.saveSettings({ ...pkr.session.settings, phantomVersion: id }); }, id);
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(300);
    await page.keyboard.press('g');
    await expect(page.locator(`#phx .phs[data-scene="Battle"][data-scr="gimmick"][data-liv="${id}"]`)).toBeVisible();
    await page.waitForTimeout(800);
    expect(await fitProblems(page, 'Battle', 'gimmick'), `gimmick ${id} at ${w}x${h}`).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(gm).toHaveCount(0);
    await phaseOn();
    await expect(page.locator(`#phx .phs[data-scene="Battle"][data-scr="phase"][data-liv="${id}"]`)).toBeVisible();
    await page.waitForTimeout(900);
    expect(await fitProblems(page, 'Battle', 'phase'), `phase ${id} at ${w}x${h}`).toEqual([]);
    await shut('phase');
    await sideOn();
    await expect(page.locator(`#phx .phs[data-scene="Battle"][data-scr="side"][data-liv="${id}"]`)).toBeVisible();
    await page.waitForTimeout(900);
    expect(await fitProblems(page, 'Battle', 'side'), `side ${id} at ${w}x${h}`).toEqual([]);
    await shut('side');
  }
  expect((await battle(page)).turn).toBe(1);
  expect(errors).toEqual([]);
});
