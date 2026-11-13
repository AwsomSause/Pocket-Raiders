import { expect, test, type Page } from '@playwright/test';

// Fuchsia canon: Safari Land is a zone game opened from the map. Throw balls on the generic screen, walk out, and the catches come home.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

async function toMap(page: Page) {
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
}

test('Safari Land opens from a map stop, plays on the minigame screen and hands the catches over', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=safari-e2e');
  await waitForScene(page, 'MainMenu');
  await toMap(page);

  await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push({ id: 'safari-e2e', kind: 'minigame', minigameId: 'safari-land', used: false });
    run.stage.current = node.id;
    (window as any).__pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Map');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').openMinigame('safari-e2e'));
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter'); // Standard
  await waitForScene(page, 'Minigame');
  const start = await page.evaluate(() => (window as any).__pkr.session.run.minigame.state);
  expect(start.balls).toBe(30);
  expect(start.steps).toBe(500);

  for (let i = 0; i < 60; i++) {
    const done = await page.evaluate(() => (window as any).__pkr.session.run.minigame.state.done);
    if (done) break;
    await page.keyboard.press('Enter'); // the first choice is a Safari Ball
    await page.waitForTimeout(120);
  }
  const caught = await page.evaluate(() => (window as any).__pkr.session.run.minigame.state.caught.length);
  expect(caught).toBeGreaterThan(0);
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Minigame').leave());
  await waitForScene(page, 'Decision');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.pending.length)).toBe(caught);
  expect(errors).toEqual([]);
});
