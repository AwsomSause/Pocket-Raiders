import { expect, test, type Page } from '@playwright/test';

// Battle depth (redo of #808, Kice's reference 2026-11-07): the foe stands on its feet in the middle of its platform,
// your Pokémon stands low in the foreground with its feet hidden behind the message bar (clipped, never drawn over it),
// and a double battle's two foes share the enemy platform.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}

async function startBattle(page: Page, doubles: boolean) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=depth-e2e');
  await waitForScene(page, 'MainMenu');
  for (const k of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, k);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.evaluate((dbl) => {
    const { session, game } = (window as any).__pkr;
    const run = session.run;
    if (dbl) run.party.push({ ...structuredClone(run.party[0]), uid: 'p-twin' });
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.kind = 'trainer';
    session.chooseNode(node.id);
    const b = session.run.battle;
    b.enemyTeam[0].speciesId = 'emolga'; // a Flying type whose wing-beat frames reach the frame's bottom edge
    if (dbl) {
      const foe = structuredClone(b.enemyTeam[0]);
      foe.uid = 'e-twin';
      foe.speciesId = 'zigzagoon';
      b.enemyTeam.push(foe);
      const blank = (v: any) => structuredClone(v);
      b.doubles = {
        player: { index: 1, stages: blank(b.playerStages), vol: blank(b.playerVolatile) },
        enemy: { index: 1, stages: blank(b.enemyStages), vol: blank(b.enemyVolatile) },
        swapped: { player: false, enemy: false },
        refill: [],
        commanding: [],
        aims: {},
      };
      b.participants.push('p-twin');
    }
    game.scene.getScene('Map').scene.start('Battle');
  }, doubles);
  await waitForScene(page, 'Battle');
  const ready = () =>
    page.evaluate((dbl) => {
      const b = (window as any).__pkr.game.scene.getScene('Battle');
      // The second Pokémon of a side is the one filled slot in `duo.slots[side]` (the Triple Battle layout, #1225).
      const other = (side: 'player' | 'enemy') => b.duo?.slots[side].find((o: any) => o?.sprite)?.sprite;
      return Boolean(b.playerSprite?.frame && b.enemySprite?.frame && (!dbl || (other('enemy') && other('player'))));
    }, doubles);
  for (let i = 0; i < 30 && !(await ready()); i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
  }
  expect(await ready()).toBe(true);
}

test('singles: foe stands in its platform, your Pokémon is clipped at the message bar', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startBattle(page, false);
  const s = await page.evaluate(() => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    const e = b.enemySprite;
    const p = b.playerSprite;
    // Where the foe's feet land on screen: its y minus the floaters' lift baked into the origin.
    return { ex: e.x, ey: e.y, eoy: e.originY, py: p.y, masked: Boolean(p.mask), pTop: p.getBounds().top };
  });
  // The enemy patch art spans x 456-840, y 174-270: the foe's feet are inside it, not on its front rim.
  expect(s.ex).toBeGreaterThan(456);
  expect(s.ex).toBeLessThan(840);
  expect(s.ey).toBeGreaterThan(174);
  expect(s.ey).toBeLessThan(262);
  // Anchored on its feet: Emolga's art does not reach its frame's bottom edge.
  expect(s.eoy).toBeLessThan(0.95);
  // Your Pokémon stands below the bar's top (396), clipped there, and clear of the foe's databox at the top.
  expect(s.py).toBeGreaterThan(396);
  expect(s.masked).toBe(true);
  expect(s.pTop).toBeGreaterThan(100);
  expect(errors).toEqual([]);
});

test('doubles: both foes share the enemy platform and both of yours stand in the foreground', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startBattle(page, true);
  const s = await page.evaluate(() => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    const xs = (a: any, o: any) => [a.x, o.x, a.y, o.y];
    const other = (side: 'player' | 'enemy') => b.duo.slots[side].find((o: any) => o?.sprite).sprite;
    return { e: xs(b.enemySprite, other('enemy')), p: xs(b.playerSprite, other('player')), masked: Boolean(other('player').mask) };
  });
  for (const x of s.e.slice(0, 2)) {
    expect(x).toBeGreaterThan(456);
    expect(x).toBeLessThan(840);
  }
  for (const y of s.e.slice(2)) {
    expect(y).toBeGreaterThan(174);
    expect(y).toBeLessThan(270);
  }
  for (const y of s.p.slice(2)) expect(y).toBeGreaterThan(396);
  expect(s.masked).toBe(true);
  expect(errors).toEqual([]);
});
