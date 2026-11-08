import { expect, test } from '@playwright/test';

// The update splash shows once, covers loading, skips on a key press, then lands in the hub (no saved run) instead of the main menu.

const scene = (page: import('@playwright/test').Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

test('update splash shows once, skips on key press, then enters the hub', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=splash&campaign=dev&debug=1&splash=1');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr?.game?.scene.getScene('Boot')?.children?.list?.some((c: any) => c.type === 'Container' && c.depth === 100000)), { timeout: 30_000 }).toBe(true);
  await page.keyboard.press('Space');
  await expect.poll(() => scene(page), { timeout: 30_000 }).toBe('Hub');
  expect(await page.evaluate(() => localStorage.getItem('pkr.splashSeen'))).toBe('beta-0.5');
  expect(errors).toEqual([]);
});
