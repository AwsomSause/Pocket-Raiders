import { expect, test, type Page } from '@playwright/test';

// Settings looks (screens redesign group E): each pinned look draws its tabs and rows on a category page, a setting still changes, no console errors.
const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

test('every Settings look draws its category page and a setting still changes', async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/?debug=1');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
  for (const look of ['aero', 'wii', 'shoujo', 'ink', 'notebook', 'rotom', 'sticker']) {
    await page.evaluate((l) => {
      const p = (window as any).__pkr;
      p.session.settings.screenStyles = { settings: l };
      p.game.scene.getScene(p.activeScene()).scene.start('Settings');
    }, look);
    await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('Settings');
    await page.waitForTimeout(600);
    await page.keyboard.press('Enter'); // the first category
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Settings').page)).not.toBe('home');
    await page.screenshot({ path: `test-results/settings-${look}.png` });
    const before = await page.evaluate(() => JSON.stringify((window as any).__pkr.session.settings));
    await page.keyboard.press('Enter'); // change the first setting
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => JSON.stringify((window as any).__pkr.session.settings))).not.toBe(before);
    await page.keyboard.press('Enter'); // put it back
    await page.waitForTimeout(200);
  }
  expect(errors).toEqual([]);
});
