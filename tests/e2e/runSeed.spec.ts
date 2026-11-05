import { expect, test, type Page } from '@playwright/test';

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
const waitFor = async (page: Page, key: string) => {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
};

test('Seed & Codes page: type a seed in the real text box and the desk keeps it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 844, height: 390 }); // phone landscape
  await page.goto('/?seed=seedpage&debug=1');
  await waitFor(page, 'MainMenu');
  await page.keyboard.press('Enter');
  await waitFor(page, 'Hub');
  await page.keyboard.press('Enter');
  await waitFor(page, 'TrainerSelect');
  await page.keyboard.press('Enter');
  await waitFor(page, 'RunPrep');
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('RunPrep').openSeed());
  await waitFor(page, 'RunSeed');
  const box = page.getByTestId('seed-input');
  await expect(box).toBeVisible();
  const r = await box.boundingBox();
  expect(r!.height).toBeGreaterThanOrEqual(20); // a usable touch target at phone size
  await box.fill('my-seed-7');
  await box.press('Enter');
  await waitFor(page, 'RunPrep');
  expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('RunPrep').seed)).toBe('my-seed-7');
  expect(await page.getByTestId('seed-input').count()).toBe(0); // the box is removed on leaving
  expect(errors).toEqual([]);
});
