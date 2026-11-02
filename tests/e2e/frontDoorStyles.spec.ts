import { expect, test, type Page } from '@playwright/test';
import { SCREEN_STYLES_READY } from '../../src/core/presentation/screenStyles';

// Each built front-door style opens its screen with no console errors and the flow still works.
const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
const waitFor = async (page: Page, key: string) => {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
};

for (const screen of ['title', 'trainer', 'starter', 'briefing'] as const) {
  for (const style of SCREEN_STYLES_READY[screen]) {
    test(`${screen} style ${style} opens and the flow continues`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto('/?seed=fd1&debug=1');
      await waitFor(page, 'MainMenu');
      await page.evaluate(([s, v]) => ((window as any).__pkr.session.settings.screenStyles = { [s!]: v }), [screen, style]);
      if (screen === 'title') await page.evaluate(() => { (window as any).__pkr.game.scene.getScene('MainMenu').scene.restart({}); });
      await waitFor(page, 'MainMenu');
      await page.keyboard.press('Enter');
      await waitFor(page, 'Hub');
      await page.keyboard.press('Enter');
      await waitFor(page, 'TrainerSelect');
      await page.keyboard.press('Enter');
      await waitFor(page, 'RunPrep');
      await page.keyboard.press('Enter');
      await waitFor(page, 'StarterSelect');
      await page.keyboard.press('Enter');
      await waitFor(page, 'Briefing');
      await page.keyboard.press('Enter');
      await waitFor(page, 'Map');
      expect(errors).toEqual([]);
    });
  }
}
