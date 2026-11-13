import { expect, test, type Page } from '@playwright/test';

// Rocket Row Arcade: an arcade stop asks for a cabinet first, then the difficulty, then plays the chosen game.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

test('an arcade stop lets you pick a cabinet, then the difficulty', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=arcade-select-e2e');
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push({ id: 'mg-arc', kind: 'minigame', minigameId: 'arcade-ball-breaker', used: false });
    run.stage.current = node.id;
    (window as any).__pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Map');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.evaluate(() => {
    (window as any).__pkr.game.scene.getScene('Map').openMinigame('mg-arc');
  });
  await page.waitForTimeout(300);
  await page.keyboard.press('ArrowDown'); // Whack-a-Diglett
  await page.keyboard.press('Enter');
  await expect
    .poll(() => page.evaluate(() => (window as any).__pkr.session.run.stage.map.nodes.flatMap((n: any) => n.sides).find((s: any) => s.id === 'mg-arc').minigameId))
    .toBe('arcade-whack-a-diglett');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter'); // Easy
  await waitForScene(page, 'Minigame');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.minigame.id)).toBe('arcade-whack-a-diglett');
  expect(errors).toEqual([]);
});
