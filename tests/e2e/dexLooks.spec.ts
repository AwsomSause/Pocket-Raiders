import { expect, test, type Page } from '@playwright/test';

// Pokédex looks (screens redesign group E): each pinned look draws the set browser, moves, opens a species page, no console errors.
const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

test('every Pokédex look draws the set browser', async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/?debug=1');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.changeProfile((pr: any) => ({ ...pr, speciesSeen: ['pikachu', 'eevee', 'onix'], speciesCaught: ['pikachu', 'onix'] }));
    p.game.scene.getScene(p.activeScene()).scene.start('Hub');
  });
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('Hub');
  for (const look of ['aero', 'wii', 'sticker', 'ds', 'ink']) {
    await page.evaluate((l) => {
      const p = (window as any).__pkr;
      p.session.settings.screenStyles = { dex: l };
      const hub = p.game.scene.getScene('Hub');
      hub.closePicker?.();
      hub.enter('research');
    }, look);
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter'); // the first set
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Hub').picker?.isBrowser ?? false)).toBe(true);
    await page.keyboard.press(look === 'ink' ? 'ArrowDown' : 'ArrowRight');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `test-results/dex-${look}.png` });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Hub').dexInfo))).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }
  expect(errors).toEqual([]);
});
