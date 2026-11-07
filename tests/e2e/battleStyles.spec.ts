import { expect, test } from '@playwright/test';
import { confirmToMenu, confirmUntil } from './battleInput';
import { SCREEN_STYLES_READY } from '../../src/core/presentation/screenStyles';

// Screens redesign: every built battle style opens, shows the command and move menus, and plays a turn
// with no console errors. Screenshots go to test-results/visual/ for a look.

const scene = (page: import('@playwright/test').Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

for (const campaign of ['dev']) for (const style of SCREEN_STYLES_READY.battle) {
  test(`battle style ${style} (${campaign}) draws and plays a turn`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(`/?seed=battle-style-${style}&campaign=${campaign}&debug=1`);
    await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
    await page.evaluate((id) => {
      const { session } = (window as any).__pkr;
      session.saveSettings({ ...session.settings, screenStyles: { battle: id } });
    }, style);
    for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
      await page.keyboard.press('Enter');
      await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(next);
      await page.waitForTimeout(250);
    }
    await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
    await page.keyboard.press('Enter');
    await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('Battle');
    await confirmToMenu(page, 30_000);
    await page.waitForTimeout(700);
    expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').skinId)).toBe(style);
    await page.screenshot({ path: `test-results/visual/battle-style-${style}${campaign === 'dev' ? '' : '-' + campaign}.png` });
    // Never an empty arena: both Pokémon and both databoxes are on screen.
    const shown = await page.evaluate(() => {
      const b = (window as any).__pkr.game.scene.getScene('Battle');
      const on = (o: any) => Boolean(o?.active && o.visible && o.alpha > 0);
      return { player: on(b.playerSprite), enemy: on(b.enemySprite), playerBox: on(b.playerBox?.container), enemyBox: on(b.enemyBox?.container) };
    });
    expect(shown).toEqual({ player: true, enemy: true, playerBox: true, enemyBox: true });
    const turn = () => page.evaluate(() => (window as any).__pkr.session.run?.battle?.turn ?? 99);
    const before = await turn();
    // Combined styles (Wii) use the focused move straight from the first screen.
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    await page.screenshot({ path: `test-results/visual/battle-style-${style}-moves.png` });
    if (await page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle').menu))) await page.keyboard.press('Enter');
    await confirmUntil(page, async () => (await turn()) > before || (await scene(page)) !== 'Battle', 30_000);
    if (style === 'ink' && (await scene(page)) === 'Battle') {
      // Ink fighters are white silhouettes; a move flash may show their colour, but it must come back after.
      await confirmToMenu(page, 30_000);
      const white = await page.evaluate(() => {
        const b = (window as any).__pkr.game.scene.getScene('Battle');
        return [b.playerSprite, b.enemySprite].filter((s: any) => s?.active).map((s: any) => Boolean(s.tintFill));
      });
      await page.screenshot({ path: 'test-results/visual/battle-style-ink-after-turn.png' });
      expect(white.length).toBeGreaterThan(0);
      expect(white.every(Boolean)).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}

// An opening that fails must not leave an empty arena: the Pokémon and boxes still appear and the menu opens.
test('a failing battle intro still shows both Pokémon and boxes', async ({ page }) => {
  await page.goto('/?seed=battle-intro-fail&campaign=dev&debug=1');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(next);
    await page.waitForTimeout(250);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.keyboard.press('Enter');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('Battle');
  await page.evaluate(() => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    b.playIntro = () => Promise.reject(new Error('test: intro broke'));
    b.scene.restart();
  });
  await page.waitForTimeout(3000);
  const shown = await page.evaluate(() => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    const on = (o: any) => Boolean(o?.active && o.visible && o.alpha > 0);
    return { player: on(b.playerSprite), enemy: on(b.enemySprite), playerBox: on(b.playerBox?.container), enemyBox: on(b.enemyBox?.container), busy: b.busy };
  });
  expect(shown).toEqual({ player: true, enemy: true, playerBox: true, enemyBox: true, busy: false });
});
