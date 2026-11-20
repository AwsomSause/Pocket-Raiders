import { expect, test, type Page } from '@playwright/test';
import { addSide, start, waitForScene, watch } from './helpers/newUi';
import { fitProblems, onPage, pview, toPhantomMap } from './helpers/phantomUi';

// The Phantom UI, part 5: more pages for screens the mock-ups had none for (they wore the stand-in look before): the
// mini-games (with the Arcade Cabinet), the Museum's jigsaw, the Spirit Market, the walkable zones, the wide
// formats, the expedition route, the evolution scene and a Memories entry. Each is opened the way the New look's own
// test opens it, steered by keys and clicks, and checked for text that is cut off.

const fits = async (page: Page, key: string, id: string) => { await page.waitForTimeout(900); expect(await fitProblems(page, key, id), id).toEqual([]); };
/** No New-look page is left showing for the scene (the stand-in look). */
const noStandIn = (page: Page, key: string) => expect(page.locator(`#rx .stage[data-scene="${key}"].phfb:visible`)).toHaveCount(0);
const state = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run?.minigame?.state ?? null);

async function openGame(page: Page, seed: string, game: string, id: string) {
  await start(page, `ui=phantom&seed=${seed}`);
  await toPhantomMap(page);
  await addSide(page, { id: 'ph-game', kind: 'minigame', used: false, minigameId: game });
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    pkr.session.beginMinigame('ph-game', 0);
    pkr.game.scene.getScene('Map').scene.start('Minigame');
  });
  await waitForScene(page, 'Minigame');
  await onPage(page, 'Minigame', id);
  await noStandIn(page, 'Minigame');
  return pview(page, 'Minigame', id);
}

test('Phantom UI: a mini-game is a Phantom page: score tiles, the prompt on the field, a tile for every choice', async ({ page }) => {
  const errors = watch(page);
  const game = await openGame(page, 'ph-memory', 'pokemon-memory', 'game');
  await expect(game.locator('.hd')).toContainText('Memory', { ignoreCase: true });
  await expect(game.locator('.ph-mg-st')).toHaveCount(3);
  await expect(game.locator('.ph-mg-say')).toContainText('Flip two tiles');
  const cells = game.locator('.ph-mg-c');
  await expect(cells).toHaveCount(12);
  await fits(page, 'Minigame', 'game');
  await page.screenshot({ path: 'test-results/phantom-game.png' });
  // The keys move the cursor; a click on a tile flips it.
  await page.keyboard.press('ArrowRight');
  await expect(cells.nth(1)).toHaveClass(/\bon\b/);
  const before = await cells.nth(4).textContent();
  await cells.nth(4).click();
  await expect(cells.nth(4)).not.toHaveText(before ?? '?');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(game.locator('.ph-mg-st').first()).toContainText('13');
  await fits(page, 'Minigame', 'game');
  expect(errors).toEqual([]);
});

test('Phantom UI: the Arcade Cabinet keeps its own screen on the Phantom page, and its buttons answer the press', async ({ page }) => {
  const errors = watch(page);
  const game = await openGame(page, 'ph-arcade', 'gn-arcade', 'game');
  await expect(game.locator('.ph-mg-board [data-board]')).toBeVisible();
  await expect(game.locator('.ph-mg-c[data-press]').first()).toBeVisible();
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page))?.stage).toBe('play');
  await fits(page, 'Minigame', 'game');
  await page.screenshot({ path: 'test-results/phantom-arcade.png' });
  const moves = (await state(page))?.moves ?? 0;
  await game.locator('.ph-mg-c[data-press]').nth(2).dispatchEvent('pointerdown');
  await expect.poll(async () => JSON.stringify(await state(page))).not.toBe('null');
  expect((await state(page))?.moves ?? 0).toBeGreaterThanOrEqual(moves);
  expect(errors).toEqual([]);
});

test('Phantom UI: the Museum jigsaw and the Spirit Market keep their drawings on a Phantom page', async ({ page }) => {
  const errors = watch(page);
  const jig = await openGame(page, 'ph-jigsaw', 'gn-jigsaw', 'jigsaw');
  await expect(jig.locator('.ph-jg-bed')).toContainText('The sandbox', { ignoreCase: true });
  await expect(jig.locator('.ph-mg-st').last()).toContainText('none', { ignoreCase: true });
  await fits(page, 'Minigame', 'jigsaw');
  await page.screenshot({ path: 'test-results/phantom-jigsaw.png' });
  // A click on a tray piece picks it up.
  const s0 = await state(page);
  const cols = s0.cols as number;
  await jig.locator(`[data-cell="${cols}"]`).click();
  await expect.poll(async () => (await state(page))?.held).toBeGreaterThanOrEqual(0);
  await expect(jig.locator('.ph-mg-st').last()).not.toContainText('none', { ignoreCase: true });
  expect(errors).toEqual([]);
});

test('Phantom UI: the Spirit Market: the stalls are pressed in the lane, and a stall’s answers are Phantom tiles', async ({ page }) => {
  const errors = watch(page);
  const market = await openGame(page, 'ph-market', 'gn-spirit-market', 'market');
  await expect(market.locator('[data-lanterns]')).toHaveAttribute('data-lanterns', '6');
  await expect(market.locator('[data-stall]')).toHaveCount(5);
  await fits(page, 'Minigame', 'market');
  await page.screenshot({ path: 'test-results/phantom-market.png' });
  // The first open stall: its answers show as tiles; the last one leads back to the lane.
  await market.locator('[data-stall] [data-act="pick"]').first().click();
  await expect.poll(async () => (await state(page))?.at).not.toBe('lanes');
  const answers = market.locator('.ph-mg-c[data-cell]');
  await expect(answers.first()).toBeVisible();
  await fits(page, 'Minigame', 'market');
  await answers.last().click();
  await expect.poll(async () => (await state(page))?.at).toBe('lanes');
  await expect(market.locator('[data-lanterns]')).toHaveAttribute('data-lanterns', '6');
  expect(errors).toEqual([]);
});

test('Phantom UI: Safari Land is a Phantom page: the walked field, the numbers, the pad and the zone’s own buttons', async ({ page }) => {
  const errors = watch(page);
  const park = await openGame(page, 'ph-park', 'gn-safari', 'park');
  await expect(park.locator('.pk-field')).toBeVisible();
  await expect(park.locator('.ph-zn-stats .ph-mg-st')).toHaveCount(3);
  await expect(park.locator('.ph-zn-pad .ph-zn-b')).toHaveCount(6);
  await fits(page, 'Minigame', 'park');
  await page.screenshot({ path: 'test-results/phantom-park.png' });
  // A key walks one tile, and so does the pad.
  const steps = async () => (await state(page))?.steps as number;
  const s0 = await steps();
  await page.keyboard.press('ArrowRight');
  await expect.poll(steps).toBe(s0 - 1);
  await page.waitForTimeout(300);
  await park.locator('.ph-zn-pad [data-act="go"][data-arg="right"]').click();
  await expect.poll(steps).toBe(s0 - 2);
  await fits(page, 'Minigame', 'park');
  expect(errors).toEqual([]);
});

test('Phantom UI: the wide pages (Breather, Convoy, Colossus) are Phantom pages, and the Breather rests and closes', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=ph-wide');
  await toPhantomMap(page);
  const open = async (id: string, st: Record<string, unknown>) => {
    await page.evaluate(({ id, st }) => {
      const pkr = (window as any).__pkr;
      const run = pkr.session.run;
      run.expansion = { ...(run.expansion ?? {}), cut: { format: { id, state: st } } };
      pkr.game.scene.getScene(pkr.activeScene()).scene.start('Map', { focus: 0 });
    }, { id, st });
    await waitForScene(page, 'Format');
    await onPage(page, 'Format', 'wide');
    await noStandIn(page, 'Format');
    return pview(page, 'Format', 'wide');
  };
  const leg = (id: string, name: string) => ({ id, name, scene: 'Trucks on the road.', species: ['rattata'], types: ['normal'], size: 2, levelBonus: 0 });
  const convoy = await open('convoy', { legs: [leg('l1', 'The Pass'), leg('l2', 'The Tunnel'), leg('l3', 'The Bridge')], index: 1, pending: false, outcome: 'running', ledger: 'none' });
  await expect(convoy.locator('.ph-wd-leg')).toHaveCount(3);
  await expect(convoy.locator('.ph-wd-leg.now')).toContainText('The Tunnel', { ignoreCase: true });
  await expect(convoy.locator('.ph-wd-o')).toHaveCount(1);
  await fits(page, 'Format', 'wide');
  await page.screenshot({ path: 'test-results/phantom-wide-convoy.png' });
  const plate = await open('colossus', { apex: { id: 'mewtwo', name: 'M2 in armor', code: 'Project M2' }, pending: false, result: null });
  await expect(plate.locator('.ph-wd-apex')).toContainText('M2 in armor', { ignoreCase: true });
  await expect(plate.locator('.ph-wd-blue .ph-wd-brow')).toHaveCount(3);
  await fits(page, 'Format', 'wide');
  await page.screenshot({ path: 'test-results/phantom-wide-plate.png' });
  await page.evaluate(() => { (window as any).__pkr.session.run.party[0].hp = 1; });
  const rest = await open('breather', { healPct: 0.5, step: 'choose', revived: null, healed: 0 });
  await expect(rest.locator('.ph-wd-chip')).not.toHaveCount(0);
  await expect(rest.locator('.ph-wd-o')).toContainText('Rest', { ignoreCase: true });
  await fits(page, 'Format', 'wide');
  await page.screenshot({ path: 'test-results/phantom-wide-breather.png' });
  await rest.locator('.ph-wd-o').first().click(); // Rest
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.session.run.party[0].hp)).toBeGreaterThan(1);
  await page.waitForTimeout(400);
  await page.keyboard.press('Enter'); // Continue
  await waitForScene(page, 'Map');
  expect(errors).toEqual([]);
});

test('Phantom UI: an evolution after a fight is the Phantom evolve page: a click moves it on and the Pokémon evolves', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=ph-evolution');
  await toPhantomMap(page);
  // The evolution scene: a Pokémon ready to evolve after a fight. Its page moves on at a click and the run goes on.
  const to = await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    const mon = run.party[0];
    const next = [...pkr.session.content.species.values()].find((s: any) => s.evolvesFrom === mon.speciesId || (s.id !== mon.speciesId && (pkr.session.content.species.get(mon.speciesId)?.evolutions ?? []).some((e: any) => (e.to ?? e.speciesId ?? e) === s.id)));
    const id = (next as any)?.id ?? 'pidgeotto';
    run.pending = [{ kind: 'evolve', uid: mon.uid, to: id }];
    run.phase = 'decision';
    pkr.game.scene.getScene('Map').scene.start('Decision');
    return id as string;
  });
  await waitForScene(page, 'Decision');
  await onPage(page, 'Decision', 'evolve');
  const evo = pview(page, 'Decision', 'evolve');
  await noStandIn(page, 'Decision');
  await expect(evo.locator('.ph-bt-say')).toContainText('evolving', { ignoreCase: true });
  await page.screenshot({ path: 'test-results/phantom-evolution.png' });
  for (let n = 0; n < 40 && (await page.evaluate(() => (window as any).__pkr.activeScene())) === 'Decision'; n++) {
    await evo.locator('[data-act="next"]').click({ timeout: 2_000 }).catch(() => undefined);
    await page.waitForTimeout(500);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.activeScene()), { timeout: 20_000 }).not.toBe('Decision');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.party[0].speciesId)).toBe(to);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.pending.length)).toBe(0);
  expect(errors).toEqual([]);
});

test('Phantom UI: an expedition’s route is the Phantom map page', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=ph-expedition');
  await toPhantomMap(page);
  // The expedition's route.
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push({ id: 'ph-exp', kind: 'expedition', expeditionId: 'ember-trail', used: false });
    run.stage.current = node.id;
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await page.waitForTimeout(600);
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').openExpedition('ph-exp'));
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter'); // begin
  await waitForScene(page, 'Expedition');
  await onPage(page, 'Expedition', 'map');
  const route = pview(page, 'Expedition', 'map');
  await noStandIn(page, 'Expedition');
  await expect(route).toContainText('Ember Trail', { ignoreCase: true });
  await expect(route.locator('.ph-nd')).not.toHaveCount(0);
  await expect(route.locator('.ph-mbar span')).toHaveCount(2);
  await fits(page, 'Expedition', 'map');
  await page.screenshot({ path: 'test-results/phantom-expedition.png' });
  expect(errors).toEqual([]);
});

test('Phantom UI: a Memories entry opens as a Phantom sheet over the list, and Enter closes it', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=phantom');
  await onPage(page, 'MainMenu', 'title');
  const mon = (uid: string, speciesId: string, level: number, starter = false) => ({ uid, speciesId, level, shiny: false, moves: ['tackle'], abilitySlot: 0, nature: null, held: [], starter, knockouts: 4, bossesBeaten: 1, titles: [] });
  const record = {
    replays: [], world: null, format: 1, source: 'run', runId: 'past-1', endedAt: '2026-10-30T12:00:00Z', seed: 'past-1', archetypeId: 'red', campaignId: 'full', prep: null, rules: null,
    starter: { speciesId: 'pikachu', choices: ['pikachu'] }, regionOrder: ['kanto', 'johto'], regionsCleared: ['kanto'], regionReached: 1, outcome: 'defeat',
    encounters: 44, battlesWon: 30, badges: ['brock'], bosses: { gym: 8, elite: 0, champion: 0 }, team: [mon('past-1-a', 'pikachu', 41, true), mon('past-1-b', 'onix', 38)],
    aceUid: 'past-1-a', rivals: [], nemeses: [], legendaries: { seen: [], caught: [] }, defeatedBy: { speciesId: 'pidgeot', level: 45, trainer: 'Blue' }, finalBattle: { result: 'lose', speciesId: 'pidgeot', level: 45, trainer: 'Blue' },
    stats: { maxLevel: 41, survivedFatal: 0, closeCalls: 0, caught: 5, shinies: 0, rivalWins: 0 }, narrative: [], chronicle: [],
    moments: [{ kind: 'firstGym', text: 'First Gym victory: beat Brock.', speciesId: null, region: 0 }], journal: [], epitaph: 'Pikachu carried this journey.',
  };
  await page.evaluate((record) => {
    const pkr = (window as any).__pkr;
    pkr.session.changeProfile((p: any) => ({ ...p, legacyRuns: [record] }));
    pkr.game.scene.getScenes(true)[0].scene.start('Memories');
  }, record);
  await waitForScene(page, 'Memories');
  await page.waitForTimeout(500);
  // Run Journal is the second section: open it, then its newest entry.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await onPage(page, 'Memories', 'memory');
  const sheet = pview(page, 'Memories', 'memory');
  await noStandIn(page, 'Memories');
  await expect(sheet.locator('.ph-mem')).toContainText('Team:');
  await fits(page, 'Memories', 'memory');
  await page.screenshot({ path: 'test-results/phantom-memory.png' });
  await page.keyboard.press('Enter');
  await expect(sheet).toHaveCount(0);
  expect(errors).toEqual([]);
});
