import { expect, test, type Page } from '@playwright/test';

// Galar stadium (Beta 0.5 M8): a gym battle in Galar gets the stadium director, and every camera cut draws its art without errors.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}

test('a Galar gym battle shows every stadium camera cut', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=galar-stadium-e2e');
  await waitForScene(page, 'MainMenu');
  for (const k of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, k);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const run = session.run;
    run.regionOrder = ['galar', ...run.regionOrder.filter((r: string) => r !== 'galar')];
    run.regionIndex = 0;
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.kind = 'gym';
    session.chooseNode(node.id);
    game.scene.getScene('Map').scene.start('Battle');
  });
  await waitForScene(page, 'Battle');
  await expect.poll(() => page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle').stadium)), { timeout: 20_000 }).toBe(true);
  // Let the intro finish, then fire each cut through the director the way a battle beat would.
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
  }
  const ids = ['crowd-cheer', 'fan-group', 'trainers-watching', 'private-box', 'commentator', 'opponent-closeup', 'champion-silhouette', 'rival-silhouette'];
  for (const [i, id] of ids.entries()) {
    const art = await page.evaluate(async (cutId) => {
      const b = (window as any).__pkr.game.scene.getScene('Battle');
      return b.stadium.previewCut(cutId);
    }, id);
    expect(art).toBe(true);
    await page.waitForTimeout(450);
    await page.screenshot({ path: `test-results/galar-cut-${i}-${id}.png` });
    await page.waitForTimeout(1800);
  }
  expect(errors).toEqual([]);
});
