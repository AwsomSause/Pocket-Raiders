import { expect, test, type Page } from '@playwright/test';

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
const waitFor = async (page: Page, key: string) => {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
};

test('Starters page: pick another draft rule and keep it on the desk', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/?seed=starters&debug=1');
  await waitFor(page, 'MainMenu');
  await page.keyboard.press('Enter');
  await waitFor(page, 'Hub');
  await page.keyboard.press('Enter');
  await waitFor(page, 'TrainerSelect');
  await page.keyboard.press('Enter');
  await waitFor(page, 'RunPrep');
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('RunPrep').goPage(2)); // the Starters tab
  await waitFor(page, 'RunStarters');
  await page.keyboard.press('ArrowRight'); // Draft rule tab
  await waitFor(page, 'RunStarters');
  const before = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('RunStarters').prep.draftRuleId);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await waitFor(page, 'RunStarters');
  await page.keyboard.press('Escape');
  await waitFor(page, 'RunPrep');
  const after = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('RunPrep').prep.draftRuleId);
  expect(after).not.toBe(before);
  expect(errors).toEqual([]);
});
