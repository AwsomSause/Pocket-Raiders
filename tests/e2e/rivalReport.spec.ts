import { expect, test, type Page } from '@playwright/test';

// Beta 0.6 R7: the Rival Report is a pop-up on the map (R opens, R closes), shows the registered rivals, no console errors.

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

test('Rival Report opens and closes on the map', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=r7-e2e');
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  // No rival met yet: R does nothing.
  await page.keyboard.press('r');
  await page.waitForTimeout(200);
  expect(await named(page, 'rival-report')).toBe(0);
  // Register a main rival and a Friend, redraw, then open the panel.
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const fresh = (p: string) => ({ role: p, personality: p === 'main' ? 'strategist' : 'protector', style: 'blitz', arc: 'prodigy-learns-humility', lead: 1, marks: ['beat-you'], feelings: { friendship: 3, respect: 3, trust: 3, rivalry: 3, resentment: 0, admiration: 2 }, pityLosses: 0 });
    const run = pkr.session.run;
    run.expansion = { ...(run.expansion ?? {}), rival: { blue: fresh('main'), pal: fresh('friend') } };
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Map');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
  await page.keyboard.press('r');
  await page.waitForTimeout(200);
  expect(await named(page, 'rival-report')).toBe(1);
  await page.screenshot({ path: 'test-results/r7-rival-report.png' });
  await page.keyboard.press('r');
  await page.waitForTimeout(200);
  expect(await named(page, 'rival-report')).toBe(0);
  expect(errors).toEqual([]);
});
