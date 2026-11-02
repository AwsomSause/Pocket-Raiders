import { expect, test, type Page } from '@playwright/test';
import { SCREEN_STYLES_READY } from '../../src/core/presentation/screenStyles';

// Screens redesign Group B: each pinned map, reward and party look opens with no console errors and the flow still works.
const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

test('every map, reward and party look opens cleanly', async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=run-flow-styles');
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  const pin = (screen: string, id: string) => page.evaluate(([s, i]) => { (window as any).__pkr.session.settings.screenStyles = { [s!]: i }; }, [screen, id]);

  for (const id of SCREEN_STYLES_READY.map) {
    await pin('map', id);
    await page.evaluate(() => { (window as any).__pkr.game.scene.getScene('Map').scene.restart(); });
    await waitForScene(page, 'Map');
    const options = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').options.filter((o: any) => o.kind === 'node').length);
    expect(options, `map ${id} keeps its choices`).toBeGreaterThan(0);
    if (id === 'townmap' || id === 'starchart') await page.screenshot({ path: `test-results/runflow-map-${id}.png` });
  }

  for (const id of SCREEN_STYLES_READY.party) {
    await pin('party', id);
    await page.evaluate(() => {
      const scene = (window as any).__pkr.game.scene.getScene('Map');
      scene.activate(scene.options.findIndex((o: any) => o.kind === 'party'));
    });
    await page.waitForTimeout(350);
    const open = await page.evaluate(() => !!(window as any).__pkr.game.scene.getScene('Map').children.getByName('pokemon-title') || (window as any).__pkr.game.scene.getScene('Map').picker != null);
    expect(open, `party ${id} opens`).toBe(true);
    if (id === 'manga' || id === 'spotlight') await page.screenshot({ path: `test-results/runflow-party-${id}.png` });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
  }

  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    session.run.phase = 'reward';
    session.run.draft = ['protein', 'nugget', 'potion', 'ether', 'revive'];
    game.scene.getScene('Map').scene.start('Reward');
  });
  await waitForScene(page, 'Reward');
  for (const id of SCREEN_STYLES_READY.reward) {
    await pin('reward', id);
    await page.evaluate(() => { (window as any).__pkr.game.scene.getScene('Reward').scene.restart(); });
    await waitForScene(page, 'Reward');
    await page.waitForTimeout(1300);
    if (['gifts', 'holopack', 'reels', 'aero'].includes(id)) await page.screenshot({ path: `test-results/runflow-reward-${id}.png` });
  }
  // The flow still works on a look: pick the first card.
  await pin('reward', 'cutin');
  await page.evaluate(() => { (window as any).__pkr.game.scene.getScene('Reward').scene.restart(); });
  await waitForScene(page, 'Reward');
  await page.waitForTimeout(500);
  await page.evaluate(() => { (window as any).__pkr.game.scene.getScene('Reward').activate(2); }); // Potion: no target needed
  await expect.poll(() => scene(page), { timeout: 10_000 }).not.toBe('Reward');
  expect(errors).toEqual([]);
});
