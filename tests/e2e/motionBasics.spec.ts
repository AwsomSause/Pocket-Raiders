import { expect, test, type Page } from '@playwright/test';
import { confirmToMenu } from './battleInput';

// Animation redesign, battle basics (plans/animation-redesign): the send-out, the faint and the recall play
// as the mockup clips do, leave the sprites exactly as the battle expects them, and obey the animation setting.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}

async function startBattle(page: Page, seed: string) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/?seed=${seed}`);
  await waitForScene(page, 'MainMenu');
  for (const k of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, k);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const node = session.run.stage.map.nodes.find((n: any) => n.column === 1);
    node.kind = 'trainer';
    session.chooseNode(node.id);
    game.scene.getScene('Map').scene.start('Battle');
  });
  await waitForScene(page, 'Battle');
  await confirmToMenu(page);
}

/** What a side's sprite looks like right now, and the leftovers a clip must never leave behind. */
const look = (page: Page, side: 'player' | 'enemy') =>
  page.evaluate((s) => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    const v = s === 'enemy' ? b.enemySprite : b.playerSprite;
    const home = b.spotXY(s);
    const solid = b.field.list.filter((o: any) => o.type === 'Sprite' && o.tintFill && o !== v).length;
    return { x: v.x, y: v.y, homeX: home.x, homeY: home.y, alpha: v.alpha, sx: v.scaleX, sy: v.scaleY, angle: v.angle, cropped: v.isCropped, shade: Boolean(b.baseShade[s]?.active), solid };
  }, side);

/** Starts one of the scene's moments without waiting for it; `__moment` is true once it is over. */
const start = (page: Page, call: string) =>
  page.evaluate((code) => {
    const w = window as any;
    const b = w.__pkr.game.scene.getScene('Battle');
    w.__moment = false;
    w.__t0 = performance.now();
    void new Function('b', `return ${code}`)(b).then(() => {
      w.__moment = true;
      w.__ms = performance.now() - w.__t0;
    });
  }, call);
const over = (page: Page) => page.evaluate(() => (window as any).__moment === true);

test('send-out, faint and recall play like the mockups and leave the sprites as the battle expects', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await startBattle(page, 'motion-basics');

  // The opening throw has landed: your Pokémon stands whole, on its spot, with nothing left over.
  const rest = await look(page, 'player');
  expect(rest).toMatchObject({ x: rest.homeX, y: rest.homeY, alpha: 1, angle: 0, cropped: false, solid: 0 });
  const foeRest = await look(page, 'enemy');

  // Faint: the foe staggers away from you, then sinks into the ground at its feet and its base goes dark.
  // The sink lasts about 350 ms, shorter than a poll's gap on a slow runner, so a frame watcher notes when the crop shows.
  await page.evaluate(() => {
    const w = window as any, b = w.__pkr.game.scene.getScene('Battle');
    w.__cropSeen = false;
    const tick = () => { if (b.enemySprite?.isCropped) w.__cropSeen = true; if (!w.__cropSeen) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  await start(page, `b.faintMoment('enemy', b.enemySprite)`);
  await expect.poll(async () => (await look(page, 'enemy')).x, { timeout: 3000 }).toBeGreaterThan(foeRest.x + 6);
  await expect.poll(() => page.evaluate(() => (window as any).__cropSeen === true), { timeout: 4000 }).toBe(true);
  expect((await look(page, 'enemy')).shade).toBe(true);
  await expect.poll(() => over(page), { timeout: 5000 }).toBe(true);
  expect(await page.evaluate(() => (window as any).__ms)).toBeGreaterThan(900);
  // Afterwards it is hidden but otherwise as it stood (a revive only has to show it again).
  expect(await look(page, 'enemy')).toMatchObject({ x: foeRest.x, y: foeRest.y, alpha: 0, sx: foeRest.sx, angle: 0, cropped: false, shade: true });

  // Send-out: a ball flies in, the Pokémon bursts out and settles; the dark base lifts.
  await start(page, `b.sendMoment('enemy', b.shown.enemy, null)`);
  await expect.poll(() => over(page), { timeout: 6000 }).toBe(true);
  await page.waitForTimeout(300);
  const back = await look(page, 'enemy');
  expect(back).toMatchObject({ x: foeRest.x, y: foeRest.y, alpha: 1, cropped: false, shade: false, solid: 0 });
  expect(back.sx).toBeCloseTo(foeRest.sx, 1);

  // Recall: your Pokémon turns red (a solid red copy lies over it) and shrinks into the beam.
  await start(page, `b.recallMoment('player', b.playerSprite, null)`);
  await expect.poll(async () => (await look(page, 'player')).solid, { timeout: 3000 }).toBe(1);
  await expect.poll(async () => (await look(page, 'player')).sx, { timeout: 3000 }).toBeLessThan(rest.sx * 0.5);
  await expect.poll(() => over(page), { timeout: 5000 }).toBe(true);
  expect(await look(page, 'player')).toMatchObject({ x: rest.x, y: rest.y, alpha: 0, sx: rest.sx, solid: 0 });
  await start(page, `b.sendMoment('player', b.shown.player, null)`);
  await expect.poll(() => over(page), { timeout: 6000 }).toBe(true);
  expect(await look(page, 'player')).toMatchObject({ x: rest.x, y: rest.y, alpha: 1, cropped: false, solid: 0 });

  expect(errors).toEqual([]);
});

test('Reduced only sinks and is short; Off moves nothing and takes no time', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startBattle(page, 'motion-basics-calm');
  const foeRest = await look(page, 'enemy');
  const setLevel = (level: string) => page.evaluate((l) => ((window as any).__pkr.session.settings.battleAnimations = l), level);

  await setLevel('reduced');
  await start(page, `b.faintMoment('enemy', b.enemySprite)`);
  // No stagger: it never leaves its column.
  for (let i = 0; i < 5; i++) {
    expect((await look(page, 'enemy')).x).toBe(foeRest.x);
    await page.waitForTimeout(60);
  }
  await expect.poll(() => over(page), { timeout: 4000 }).toBe(true);
  expect(await page.evaluate(() => (window as any).__ms)).toBeLessThan(900);
  expect(await look(page, 'enemy')).toMatchObject({ alpha: 0, cropped: false, shade: true });

  await setLevel('off');
  await start(page, `b.sendMoment('enemy', b.shown.enemy, null)`);
  await expect.poll(() => over(page), { timeout: 2000 }).toBe(true);
  expect(await page.evaluate(() => (window as any).__ms)).toBeLessThan(150);
  expect(await look(page, 'enemy')).toMatchObject({ x: foeRest.x, y: foeRest.y, alpha: 1, sx: foeRest.sx, shade: false });
  await start(page, `b.faintMoment('enemy', b.enemySprite)`);
  await expect.poll(() => over(page), { timeout: 2000 }).toBe(true);
  expect(await page.evaluate(() => (window as any).__ms)).toBeLessThan(150);
  expect(await look(page, 'enemy')).toMatchObject({ x: foeRest.x, y: foeRest.y, alpha: 0, cropped: false });
  await start(page, `b.recallMoment('player', b.playerSprite, null)`);
  await expect.poll(() => over(page), { timeout: 2000 }).toBe(true);
  expect(await page.evaluate(() => (window as any).__ms)).toBeLessThan(150);
  expect((await look(page, 'player')).alpha).toBe(0);
  expect(errors).toEqual([]);
});
