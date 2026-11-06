import { expect, test, type Page } from '@playwright/test';

// Battle sprites stand on their platform: anchored on the middle of their feet, not the padded frame edge,
// and a double battle's two spots sit on the one platform.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}

test('battle sprites are anchored on their feet and doubles share the platform', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=align-e2e');
  await waitForScene(page, 'MainMenu');
  for (const k of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, k);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);

  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const run = session.run;
    run.party.push({ ...structuredClone(run.party[0]), uid: 'p-twin' });
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.kind = 'trainer';
    session.chooseNode(node.id);
    const b = session.run.battle;
    b.enemyTeam[0].speciesId = 'emolga'; // its art sits left of the frame's middle
    const foe = structuredClone(b.enemyTeam[0]);
    foe.uid = 'e-twin';
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
    game.scene.getScene('Map').scene.start('Battle');
  });
  await waitForScene(page, 'Battle');
  const ready = () => page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle').duo?.other.enemy.sprite && (window as any).__pkr.game.scene.getScene('Battle').duo?.other.player.sprite));
  for (let i = 0; i < 30 && !(await ready()); i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
  }
  expect(await ready()).toBe(true);

  const s = await page.evaluate(() => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    const a = b.enemySprite, o = b.duo.other.enemy.sprite, p = b.playerSprite, q = b.duo.other.player.sprite;
    return { a: [a.x, a.originX, a.originY], o: [o.x, o.originX], p: p.x, q: q.x };
  });
  expect(s.a[1]).not.toBeCloseTo(0.5, 2); // anchored on the feet, not the frame middle
  expect(s.a[2]).toBeGreaterThan(0.9);
  // Both enemy spots straddle the enemy platform (x 648) and both player spots straddle the player's (x 312).
  expect(Math.min(s.a[0], s.o[0])).toBeLessThan(648);
  expect(Math.max(s.a[0], s.o[0])).toBeGreaterThan(648);
  expect(Math.abs((s.p + s.q) / 2 - 312)).toBeLessThan(2);
  expect(errors).toEqual([]);
});
