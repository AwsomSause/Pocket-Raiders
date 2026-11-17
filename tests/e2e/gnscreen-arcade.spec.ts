import { expect, test, type Page } from '@playwright/test';
import type { ArcadeState } from '../../src/core/greenneedle/arcade';
import { arcadePress } from '../unit/helpers/arcadePlay';
import { addSide, toMap, view, waitForScene, watch } from './helpers/newUi';

// Greenneedle gn.new.14, the Arcade Cabinet, in the New UI: "Play." opens the cabinet beside the node, the three games are
// played with the keyboard (one careful press at a time) and the mouse, and clearing all three opens the room where the
// Porygon steps out. The last test takes the three pictures (only when GN_SHOTS names a folder).

const SHOTS = process.env.GN_SHOTS;
/** The helper's start with a longer wait for the first load (a busy machine takes over 20 s to boot the game). */
async function start(page: Page, query: string) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/?${query}`);
  await waitForScene(page, 'MainMenu', 90_000);
}
// On a slow machine a game can be lost to the clock: "Take the life." is the first button, so Enter takes it and the game goes on, slower.
const KEY: Record<string, string> = { l: 'ArrowLeft', r: 'ArrowRight', u: 'ArrowUp', d: 'ArrowDown', a: 'Enter', take: 'Enter' };
const state = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.minigame?.state ?? null) as Promise<ArcadeState | null>;
const outcome = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.minigame?.outcome ?? null);

test('New UI: the Arcade Cabinet is three played games, and clearing them brings the Porygon out of the screen', async ({ page }) => {
  test.setTimeout(420_000);
  const errors = watch(page);
  await start(page, 'ui=new&seed=gnscreen-arcade');
  await toMap(page);
  await addSide(page, { id: 'gn-cab', kind: 'event', used: false, eventId: 'gn-new-14-cabinet' });
  const sideId = await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    pkr.session.chooseEvent('gn-cab', 0); // "Play."
    const run = pkr.session.run;
    const node = run.stage.map.nodes.find((n: any) => n.id === run.stage.current);
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
    return node.sides.find((s: any) => s.minigameId === 'gn-arcade').id as string;
  });
  await waitForScene(page, 'Map');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
  await page.evaluate((id) => void (window as any).__pkr.game.scene.getScene('Map').openMinigame(id), sideId);
  await expect(view(page, 'Map').filter({ hasText: 'One coin' })).toHaveCount(1);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Minigame');

  const mg = view(page, 'Minigame');
  await expect(mg.locator('[data-board]')).toHaveCount(1);
  await expect(mg.locator('[data-table]')).toContainText('HELP');
  await expect(mg).toContainText('Game 1 of 3: The Maze');
  // The bird is the pack's Porygon sprite.
  await expect.poll(() => mg.evaluate((el) => el.innerHTML)).toContain('pokemon/137');

  // The title card waits: nothing moves until Start.
  const before = await state(page);
  await page.waitForTimeout(800);
  expect(await state(page)).toEqual(before);

  // Mouse: the Start button, then one step with the on-screen arrow.
  await mg.locator('[data-press]').first().dispatchEvent('pointerdown');
  await expect.poll(async () => (await state(page))?.stage).toBe('play');
  await expect(mg.locator('[data-press]')).toHaveCount(4);
  const first = await state(page);
  const step = arcadePress(first!);
  // The field is redrawn on every tick, so the button is never "stable" for Playwright: press it where it is.
  await mg.locator('[data-press]').nth(['l', 'u', 'd', 'r'].indexOf(step)).dispatchEvent('pointerdown');
  await expect.poll(async () => (await state(page))?.g.k === 'maze' && ((await state(page))!.g as any).at !== (first!.g as any).at).toBe(true);

  // Keyboard: play all three, one press at a time (never faster than the cabinet's clock).
  for (let i = 0; i < 600; i++) {
    if (await outcome(page)) break;
    const s = (await state(page))!;
    // The saved run always holds the game in progress.
    if (i === 20) {
      const saved = await page.evaluate(() => {
        const raw = Object.entries(localStorage).find(([k]) => k.endsWith('run'));
        const run = raw ? JSON.parse(raw[1] as string).data : null;
        return run ? { phase: run.phase, id: run.minigame?.id, game: run.minigame?.state?.game } : null;
      });
      expect(saved).toEqual({ phase: 'minigame', id: 'gn-arcade', game: s.game });
    }
    await page.keyboard.press(KEY[arcadePress(s)]!);
    await page.waitForTimeout(s.stage === 'play' ? 380 : 450);
  }
  expect(await outcome(page)).toMatchObject({ score: 3, max: 3, medal: 'gold', money: 0 });
  await expect(mg).toContainText('All three games cleared.');

  // Back into the story: the room where it steps out is beside the node.
  await page.waitForTimeout(400);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Map');
  const room = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    const node = run.stage.map.nodes.find((n: any) => n.id === run.stage.current);
    return node.sides.find((s: any) => s.eventId === 'gn-new-14-clear' && !s.used)?.id ?? null;
  });
  expect(room).not.toBeNull();
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
  await page.evaluate((id) => void (window as any).__pkr.game.scene.getScene('Map').scene.start('Event', { sideId: id }), room);
  await waitForScene(page, 'Event');
  await expect(view(page, 'Event')).toContainText('All Three Cleared');
  expect(errors).toEqual([]);
});

test('New UI: mashing the buttons panics the bird, the game is lost, and it pushes its last life back', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=gnscreen-arcade-rush');
  await toMap(page);
  await addSide(page, { id: 'gn-cab', kind: 'minigame', used: false, minigameId: 'gn-arcade' });
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    pkr.session.beginMinigame('gn-cab', 0);
    pkr.game.scene.getScene('Map').scene.start('Minigame');
  });
  await waitForScene(page, 'Minigame');
  const mg = view(page, 'Minigame');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page))?.stage).toBe('play');
  // Eight presses inside one tick of the cabinet's clock (a busy test machine cannot type that fast key by key).
  await page.evaluate(() => {
    for (let i = 0; i < 8; i++) for (const type of ['keydown', 'keyup']) window.dispatchEvent(new KeyboardEvent(type, { code: 'ArrowUp', key: 'ArrowUp', keyCode: 38, bubbles: true }));
  });
  await expect.poll(async () => (await state(page))?.panics).toBeGreaterThan(0);
  // Left alone, the timer runs out.
  await expect.poll(async () => (await state(page))?.stage, { timeout: 60_000 }).toBe('lost');
  await expect(mg).toContainText('last life');
  await expect(mg.locator('[data-press]')).toHaveText(['Take the life.', 'Walk away.']);
  await page.waitForTimeout(400);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter'); // Walk away.
  await expect.poll(() => outcome(page)).toMatchObject({ score: 0, medal: 'none' });
  expect(await page.evaluate(() => (window as any).__pkr.session.run.story.flags['ev:arcade-walked'])).toBe(1);
  expect(errors).toEqual([]);
});

test('pictures of the three games (GN_SHOTS)', async ({ browser }) => {
  test.skip(!SHOTS, 'set GN_SHOTS to a folder');
  test.setTimeout(240_000);
  const context = await browser.newContext({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 2, baseURL: 'http://localhost:' + (process.env.GN_PORT ?? '4173') });
  const page = await context.newPage();
  await start(page, 'ui=new&seed=gnscreen-arcade');
  await toMap(page);
  await addSide(page, { id: 'gn-cab', kind: 'minigame', used: false, minigameId: 'gn-arcade' });
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    pkr.session.beginMinigame('gn-cab', 0);
    pkr.game.scene.getScene('Map').scene.start('Minigame');
  });
  await waitForScene(page, 'Minigame');
  await page.evaluate(() => { (window as any).__pkr.game.scene.getScene('Minigame').time.paused = true; });
  // Presses and ticks are sent straight to the rules to reach each game quickly; the screen's own clock is stopped.
  const send = (id: string, tick: boolean) => page.evaluate(([id, tick]) => {
    const s = (window as any).__pkr.session;
    s.minigameAct(id);
    if (tick && s.run.minigame.state.stage === 'play') s.minigameTick();
  }, [id, tick] as const);
  const ready = (s: ArcadeState): boolean => s.stage === 'play' && (s.g.k === 'maze' ? s.g.t >= 9 : s.g.k === 'stack' ? s.g.cells.filter((c) => c !== 0).length >= 3 : s.g.hits >= 4);
  for (const [n, kind] of [[1, 'maze'], [2, 'stack'], [3, 'shoot']] as const) {
    for (let i = 0; i < 400; i++) {
      const s = (await state(page))!;
      if (s.g.k === kind && ready(s)) break;
      await send(arcadePress(s), true);
      // A key the game does not use, so the idle-tip toast stays away from the pictures.
      if (i % 5 === 0) await page.keyboard.press('Shift');
    }
    // Redraw from the rules' state with the screen's own clock stopped, so the picture is the moment picked above.
    await page.evaluate(() => {
      const scene = (window as any).__pkr.game.scene.getScene('Minigame');
      scene.events.once('create', () => { scene.time.paused = true; });
      scene.scene.restart();
    });
    await page.waitForTimeout(400);
    await expect(view(page, 'Minigame')).toContainText(`Game ${n} of 3`);
    await expect.poll(() => view(page, 'Minigame').evaluate((el) => el.innerHTML)).toContain('pokemon/137');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/arcade-${n}.png` });
  }
  await context.close();
});
