import { expect, test } from '@playwright/test';

const scene = (page: import('@playwright/test').Page) => page.evaluate(() => ((window as any).__pkr.game.scene.getScenes(true) as { scene: { key: string } }[]).map((s) => s.scene.key));

test('welcome flow: update log, tutorial offer, then the title; shown once', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?welcome=1');
  await expect.poll(() => scene(page), { timeout: 40_000 }).toContain('Welcome');
  for (let i = 0; i < 12 && (await scene(page)).includes('Welcome'); i++) {
    await page.keyboard.press('Escape'); // skips the log, then declines the tutorial
    await page.waitForTimeout(250);
  }
  await expect.poll(() => scene(page)).toContain('MainMenu');
  await page.goto('/?welcome=1');
  await expect.poll(() => scene(page), { timeout: 40_000 }).toContain('MainMenu');
  expect(errors).toEqual([]);
});
