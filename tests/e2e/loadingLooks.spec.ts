import { expect, test, type Page } from '@playwright/test';

// Loading looks (screens redesign group E): each pinned look builds on the Boot screen with no console errors and the game still reaches the title.
const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

test('every loading look draws and the game still reaches the title', async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/?debug=1');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
  for (const look of ['aero', 'ball', 'terminal', 'wiihealth', 'ds', 'ink', 'shuffle', 'sparkle', 'region']) {
    await page.evaluate((l) => {
      const p = (window as any).__pkr;
      p.session.settings.screenStyles = { loading: l };
      p.game.scene.getScene(p.activeScene()).scene.start('Boot');
    }, look);
    await page.waitForTimeout(150);
    await page.screenshot({ path: `test-results/loading-${look}.png` });
    await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
  }
  expect(errors).toEqual([]);
});
