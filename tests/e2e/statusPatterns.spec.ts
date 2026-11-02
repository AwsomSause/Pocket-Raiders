import { expect, test, type Page } from '@playwright/test';
import { confirmToMenu } from './battleInput';

// Pokémon Memories leftovers: a burned foe wears the pulsing burn pattern
// (Deluxe Battle Kit status patterns) over its sprite. No page errors.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('a burned foe wears the burn pattern', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?seed=memories-status&debug=1');
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  await confirmToMenu(page);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    pkr.session.run.battle.enemyTeam[0].status = { id: 'brn' };
    pkr.game.scene.getScene('Battle').scene.restart();
  });
  await confirmToMenu(page);
  const worn = () =>
    page.evaluate(() => {
      const s = (window as any).__pkr.game.scene.getScene('Battle').enemySprite;
      return s?.getData?.('pattern') && s.postPipelines?.length ? s.getData('pattern') : null;
    });
  await expect.poll(worn, { timeout: 10_000 }).toBe('fx.status.pattern.burn');
  await page.screenshot({ path: 'test-results/memories-status-burn.png' });
  expect(errors).toEqual([]);
});
