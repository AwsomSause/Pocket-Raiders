import { expect, test, type Page } from '@playwright/test';

// Screens redesign group E: the three expedition looks (aero, manga, depth) draw on the route screen; no console errors.
const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
const wait = async (page: Page, key: string) => {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
};

test('expedition looks draw the route screen', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=exp-looks');
  await wait(page, 'MainMenu');
  for (const k of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await wait(page, k);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    const run = p.session.run;
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push({ id: 'exp-e2e', kind: 'expedition', expeditionId: 'ember-trail', used: false });
    run.stage.current = node.id;
    p.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await wait(page, 'Map');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').openExpedition('exp-e2e'));
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await wait(page, 'Expedition');
  for (const style of ['aero', 'manga', 'depth']) {
    await page.evaluate((st) => {
      const p = (window as any).__pkr;
      p.session.settings.screenStyles = { expedition: st };
      p.game.scene.getScene('Expedition').scene.restart();
    }, style);
    await wait(page, 'Expedition');
    await page.screenshot({ path: `test-results/expedition-${style}.png` });
  }
  expect(errors).toEqual([]);
});
