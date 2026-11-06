import { expect, test, type Page } from '@playwright/test';

// S340: the main screens at several window sizes (small laptop, HD, phone upright, phone sideways). Each screen must
// open with no console error, fit the window with no sideways scrolling, and leave a canvas big enough to read.
// The pictures are attached to the test report so a person can look at them; pixel baselines stay in
// pixelCompare.spec.ts (one size), because baselines at every size would break on every font or art change.

const SIZES = [
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'small', width: 800, height: 450 },
  { name: 'phone-upright', width: 390, height: 844 },
  { name: 'phone-sideways', width: 844, height: 390 },
];
const SCREENS = ['MainMenu', 'Hub', 'TrainerSelect'];

const active = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

test('main screens fit every window size and show no errors', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/?seed=sizes&debug=1');
  await expect.poll(() => active(page), { timeout: 20_000 }).toBe('MainMenu');
  for (const size of SIZES) {
    await page.setViewportSize({ width: size.width, height: size.height });
    for (const screen of SCREENS) {
      await page.evaluate((k) => void (window as any).__pkr.game.scene.getScenes(true)[0].scene.start(k), screen);
      await expect.poll(() => active(page), { timeout: 20_000 }).toBe(screen);
      await page.waitForTimeout(700);
      const fit = await page.evaluate(() => {
        const c = document.querySelector('canvas')!.getBoundingClientRect();
        return { sideways: document.documentElement.scrollWidth - window.innerWidth, w: c.width, h: c.height, right: c.right, bottom: c.bottom, vw: window.innerWidth, vh: window.innerHeight };
      });
      const label = `${screen} at ${size.name}`;
      expect(fit.sideways, `${label}: sideways scroll`).toBeLessThanOrEqual(1);
      expect(fit.w, `${label}: canvas width`).toBeGreaterThan(Math.min(300, size.width * 0.6));
      expect(fit.h, `${label}: canvas height`).toBeGreaterThan(150);
      expect(fit.right, `${label}: canvas past the right edge`).toBeLessThanOrEqual(fit.vw + 1);
      await testInfo.attach(label, { body: await page.screenshot(), contentType: 'image/png' });
    }
  }
  expect(errors).toEqual([]);
});
