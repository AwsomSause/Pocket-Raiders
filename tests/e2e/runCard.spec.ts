import { expect, test, type Page } from '@playwright/test';

// W12: the Run menu on the map and the run card button on the run-end screen.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}

test('Run menu opens and the run card saves from the run-end screen', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=e2e-card&campaign=dev&debug=1');
  await waitForScene(page, 'MainMenu');
  for (const key of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, key);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.evaluate(() => { (window as any).__pkr.game.scene.getScene('Map').scene.start('GameOver'); });
  await waitForScene(page, 'GameOver');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/runcard-gameover.png' });
  const [download] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => { (window as any).__pkr.game.scene.getScene('GameOver').children.getByName('save-run-card').emit('pointerdown'); })]);
  expect(download.suggestedFilename()).toBe('pocket-raiders-run.png');
  await download.saveAs('test-results/runcard.png');
  expect(errors).toEqual([]);
});
