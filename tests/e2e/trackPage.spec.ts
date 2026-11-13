import { expect, test, type Page } from '@playwright/test';

// Beta 0.6 E2: the Notebook track page is a pop-up on the map (T opens, T closes). It only appears once the Kanto track has moved.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}
const named = (page: Page, name: string) =>
  page.evaluate((name) => {
    const s = (window as any).__pkr.game.scene.getScene('Map');
    const all: any[] = [];
    const walk = (list: any[]) => list.forEach((o) => (all.push(o), o.list && walk(o.list)));
    walk(s.children.list);
    return all.filter((o) => o.name === name).length;
  }, name);

test('Track page opens and closes on the map', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=e2-track-e2e');
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  // Track has not moved: T does nothing.
  await page.keyboard.press('t');
  await page.waitForTimeout(200);
  expect(await named(page, 'track-page')).toBe(0);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    run.regionOrder[run.regionIndex] = 'kanto';
    run.expansion = { ...(run.expansion ?? {}), tracks: true, track: { kanto: { step: 2, peak: 3, applied: [], log: [] } } };
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Map');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
  await page.keyboard.press('t');
  await page.waitForTimeout(200);
  expect(await named(page, 'track-page')).toBe(1);
  await page.screenshot({ path: 'test-results/e2-track-page.png' });
  await page.keyboard.press('t');
  await page.waitForTimeout(200);
  expect(await named(page, 'track-page')).toBe(0);
  expect(errors).toEqual([]);
});
