import { expect, test, type Page } from '@playwright/test';

// Map event stops show art (Pokémon, cast, item, scene) instead of the plain "!" glyph, and the map loads without errors.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}

test('event stops on the map draw art, not just a glyph', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=stop-art-e2e');
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  // Give the first nodes a spread of ordinary events, then redraw the map.
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    const ids = ['vitamin-seller', 'ovc-fisherman-tip-s1', 'ovc-lost-hat-s1', 'ovc-swap-meet-s1', 'ovc-berry-bush-guard-s1', 'ovc-coin-fountain-s1', 'ovc-kite-flyer-s1', 'ovc-herb-gatherer-s1'];
    const nodes = run.stage.map.nodes.filter((n: any) => n.column <= 3);
    ids.forEach((eventId, i) => nodes[i % nodes.length].sides.push({ id: `art-${i}`, kind: 'event', used: false, eventId }));
    pkr.game.scene.getScene('Map').scene.restart();
  });
  await waitForScene(page, 'Map');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/stop-art-map.png' });
  expect(errors).toEqual([]);
});
