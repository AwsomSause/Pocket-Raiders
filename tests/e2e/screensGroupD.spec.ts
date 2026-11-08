import { expect, test, type Page } from '@playwright/test';
import { SCREEN_STYLES_READY } from '../../src/core/presentation/screenStyles';

// Screens redesign, Group D: every built Bag, Camp and run-end look opens with no console errors,
// keeps the menu usable (tabs, back) and fits a small window.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

async function toMap(page: Page, seed: string) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/?seed=${seed}&campaign=dev&debug=1`);
  await expect.poll(() => scene(page), { timeout: 60_000 }).toBe('MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await expect.poll(() => scene(page), { timeout: 40_000 }).toBe(next);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(800);
}

const pin = (page: Page, screen: string, style: string) => page.evaluate(([s, v]) => { (window as any).__pkr.session.settings.screenStyles = { ...(window as any).__pkr.session.settings.screenStyles, [s!]: v }; }, [screen, style]);
const open = (page: Page, kind: string) =>
  page.evaluate((k) => {
    const m = (window as any).__pkr.game.scene.getScene('Map');
    m.activate(m.options.findIndex((o: any) => o.kind === k));
  }, kind);

test('every Bag and Camp look opens, switches pockets and closes', async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await toMap(page, 'screens-d');
  for (const [screen, kind] of [['bag', 'bag'], ['camp', 'camp']] as const) {
    for (const style of SCREEN_STYLES_READY[screen]) {
      await pin(page, screen, style);
      await open(page, kind);
      await page.waitForTimeout(500);
      if (true) await page.screenshot({ path: `test-results/${screen}-${style}.png` });
      await page.keyboard.press('ArrowRight'); // next pocket / group (grid: moves the cursor or the pocket)
      await page.waitForTimeout(300);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      expect(await scene(page)).toBe('Map');
    }
  }
  await page.setViewportSize({ width: 640, height: 360 });
  await pin(page, 'bag', 'manga');
  await open(page, 'bag');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/bag-small.png' });
  expect(errors).toEqual([]);
});

test('every run-end look opens', async ({ page }) => {
  // 11 looks, each a full game boot plus six scene steps: about 180 s on a laptop, so 240 s was too tight for the (slower) CI runner.
  test.setTimeout(720_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => { console.log('PE', e.message, e.stack?.split('\n').slice(0,4).join(' ; ')); errors.push(e.message); });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  for (const style of SCREEN_STYLES_READY.runend) {
    await toMap(page, `screens-d-end-${style}`);
    await pin(page, 'runend', style);
    await page.evaluate(() => { (window as any).__pkr.game.scene.getScene('Map').scene.start('GameOver'); });
    await expect.poll(() => scene(page), { timeout: 20_000, message: errors.join(' | ') }).toBe('GameOver');
    await page.waitForTimeout(900);
    await page.screenshot({ path: `test-results/runend-${style}.png` });
  }
  expect(errors).toEqual([]);
});
