import { expect, test, type Page } from '@playwright/test';
import { fitIssues } from './helpers/textFit';

// Run Prep on phone-sized touch screens: tapping a page chip switches page, the Overview cards fit the screen,
// and the chips are big enough to hit. (Phone tap test + Overview cards from the Run Prep checklist.)

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string, timeout = 30_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(400);
}
/** Canvas (960x540) point to page pixels, using the canvas' on-screen box. */
async function toPage(page: Page, gx: number, gy: number) {
  const r = await page.evaluate(() => { const b = (document.querySelector('canvas') as HTMLCanvasElement).getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
  return { x: r.x + (gx / 960) * r.w, y: r.y + (gy / 540) * r.h, scale: r.w / 960 };
}

for (const size of [{ width: 932, height: 430 }, { width: 844, height: 390 }, { width: 740, height: 360 }]) {
  test.describe(`${size.width}x${size.height}`, () => {
    test.use({ viewport: size, hasTouch: true });

    test('tap the page chips, and the Overview fits', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto('/?seed=prep-phone&debug=1');
      await page.evaluate(() => localStorage.clear());
      await page.goto('/?seed=prep-phone&debug=1');
      await waitForScene(page, 'MainMenu');
      await page.keyboard.press('Enter');
      await waitForScene(page, 'Hub');
      await page.keyboard.press('Enter');
      await waitForScene(page, 'TrainerSelect');
      await page.keyboard.press('Enter');
      await waitForScene(page, 'RunPrep');
      const pageIdx = () => page.evaluate(() => (window as any).__pkr.game.scene.getScene('RunPrep').page as number);
      expect(await pageIdx()).toBe(4); // opens on the Overview
      expect(await fitIssues(page), 'Overview text fit').toEqual([]);
      await page.screenshot({ path: `test-results/prep-phone-${size.width}-overview.png` });

      // Page chips: x0 = (960 - (5*172 + 4*8)) / 2, 172 wide, 38 high at y 48. Tap the first (Run Setup).
      const x0 = (960 - (5 * 172 + 4 * 8)) / 2;
      const tap = await toPage(page, x0 + 86, 67);
      const chipPx = 50 * tap.scale; // the tap zone is 50 canvas units tall (the drawn chip is 38)
      console.log(`chip height on screen: ${chipPx.toFixed(1)}px at ${size.width}x${size.height}`);
      await page.touchscreen.tap(tap.x, tap.y);
      await waitForScene(page, 'RunChoices');
      await page.screenshot({ path: `test-results/prep-phone-${size.width}-setup.png` });
      expect(await fitIssues(page), 'Run Setup text fit').toEqual([]);
      expect(errors).toEqual([]);
      expect(chipPx, 'page chip is tall enough to tap').toBeGreaterThanOrEqual(32);
    });
  });
}
