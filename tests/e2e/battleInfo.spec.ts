import { expect, test, type Page } from '@playwright/test';
import { confirmToMenu } from './battleInput';

// Overhaul slice 8: the battle Info panel (I) shows how your moves fare against the foe.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}

test('battle Info shows your moves against the foe and the foe ability as not shown yet', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=e2e-battleinfo&debug=1');
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  await confirmToMenu(page);
  await page.keyboard.press('i');
  const texts = () =>
    page.evaluate(() => {
      const out: string[] = [];
      const walk = (o: any) => {
        if (typeof o.text === 'string') out.push(o.text);
        o.list?.forEach(walk);
      };
      (window as any).__pkr.game.scene.getScene('Battle').infoPanel?.list.forEach(walk);
      return out.join('\n');
    });
  await expect.poll(texts).toContain('Your moves vs the foe');
  const all = await texts();
  expect(all).toMatch(/Ability: not shown yet/);
  expect(all).toMatch(/(super effective|not very effective|normal damage|no effect)/);
  await page.screenshot({ path: 'test-results/battle-info.png' });
  expect(errors).toEqual([]);
});
