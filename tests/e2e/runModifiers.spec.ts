import { expect, test, type Page } from '@playwright/test';

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
const waitFor = async (page: Page, key: string) => {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
};

test('Modifiers page: toggle, category filter, and back to the desk keeps the choice', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 844, height: 390 }); // phone landscape
  await page.goto('/?seed=mods&debug=1');
  await waitFor(page, 'MainMenu');
  await page.keyboard.press('Enter');
  await waitFor(page, 'Hub');
  await page.keyboard.press('Enter');
  await waitFor(page, 'TrainerSelect');
  await page.keyboard.press('Enter');
  await waitFor(page, 'RunPrep');
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('RunPrep').goPage(2)); // the Modifiers tab
  await waitFor(page, 'RunModifiers');
  await page.keyboard.press('Enter'); // first modifier on
  await page.keyboard.press('ArrowRight'); // next category
  await page.keyboard.press('Escape');
  await waitFor(page, 'RunPrep');
  const rules = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('RunPrep').rules);
  expect(rules.modifierIds).toEqual(['no-transformations']);
  expect(errors).toEqual([]);
});
