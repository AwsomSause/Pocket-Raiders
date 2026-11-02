import { expect, test, type Page } from '@playwright/test';

// Screens redesign group E: pin each built look and open the screens that wear it; no console errors.
const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
const wait = async (page: Page, key: string) => {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
};

const LOOKS: Record<string, { scene: string; styles: string[] }> = {
  settings: { scene: 'Settings', styles: ['aero', 'wii', 'shoujo', 'ink', 'notebook', 'rotom', 'sticker'] },
  legacy: { scene: 'LegacyGallery', styles: ['museum', 'polaroids', 'manga', 'timeline', 'cards', 'previously', 'bloom', 'aero', 'ink', 'wii', 'hall'] },
};

test('pinned looks open on Settings and the Legacy screens without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=skins-e');
  await wait(page, 'MainMenu');
  for (const [screen, { scene: key, styles }] of Object.entries(LOOKS)) {
    for (const style of styles) {
      await page.evaluate(([s, st]) => { (window as any).__pkr.session.settings.screenStyles = { [s!]: st }; }, [screen, style]);
      await page.evaluate((k) => { const p = (window as any).__pkr; p.game.scene.getScene(p.activeScene()).scene.start(k); }, key);
      await wait(page, key);
      if (style === styles[0]) await page.screenshot({ path: `test-results/skin-${screen}-${style}.png` });
    }
  }
  // Settings: a sub-page still lists its rows under a skin.
  await page.evaluate(() => { (window as any).__pkr.session.settings.screenStyles = { settings: 'notebook' }; });
  await page.evaluate(() => { const p = (window as any).__pkr; p.game.scene.getScene(p.activeScene()).scene.start("Settings"); });
  await wait(page, 'Settings');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/skin-settings-notebook-page.png' });
  // Hub menus and the Pokédex-style rooms.
  for (const style of ['aero', 'album']) {
    await page.evaluate((st) => { (window as any).__pkr.session.settings.screenStyles = { hubmenus: st, dex: 'ds' }; }, style);
    await page.evaluate(() => { const p = (window as any).__pkr; p.game.scene.getScene(p.activeScene()).scene.start("Hub"); });
    await wait(page, 'Hub');
    await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Hub').enter('research'));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `test-results/skin-dex-ds-${style}.png` });
  }
  expect(errors).toEqual([]);
});
