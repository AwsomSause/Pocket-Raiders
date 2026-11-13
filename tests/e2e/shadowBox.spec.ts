import { expect, test, type Page } from '@playwright/test';
import { confirmToMenu } from './battleInput';

// Beta 0.6 fix: a Shadow that will disobey shows tier, Heart stage, "tightens" and the prompt without clipping the message box.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}

async function toBattle(page: Page, errors: string[]) {
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=e2e-shadowbox&debug=1');
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  await confirmToMenu(page);
}

test('the Shadow command box fits its worst case (tier, Heart stage, "tightens", prompt)', async ({ page }) => {
  const errors: string[] = [];
  await toBattle(page, errors);
  // Make the lead a sealed Shadow and walk the turn counter until the shadow will override the command.
  const result = await page.evaluate(() => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    b.activeMon().shadow = { heart: 100 };
    for (let t = 1; t < 200; t++) {
      b.run.battle.turn = t;
      b.showRootMenu();
      if (b.message.text.includes('tightens')) {
        const bounds = b.message.getBounds();
        return { wrapped: b.message.getWrappedText(), fs: b.message.style.fontSize, top: bounds.top, text: b.message.text as string, lines: b.message.getWrappedText().length, bottom: bounds.bottom, height: b.sys.game.config.height as number };
      }
    }
    return null;
  });
  expect(result, 'a turn where the shadow tightens').not.toBeNull();
  expect(result!.text.split('\n').filter((l) => l.startsWith('Shadow')).length).toBe(1);
  expect(result!.text).not.toContain('Heart Gauge:');
  expect(result!.lines).toBeLessThanOrEqual(3);
  expect(result!.bottom).toBeLessThanOrEqual(result!.height - 8);
  await page.screenshot({ path: 'test-results/shadow-box.png' });
  expect(errors).toEqual([]);
});

test('Shadow Pokémon get an aura and variant-tagged Pokémon get a mark, a label and (Couture) an accessory', async ({ page }) => {
  const errors: string[] = [];
  await toBattle(page, errors);
  const n = await page.evaluate(() => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    const foe = b.shown.enemy;
    foe.shadow = { heart: 60 };
    b.run.battle.extra.variants[foe.uid] = { line: 'couture', flags: {}, accessory: 'silk-scarf' };
    b.showSprite('enemy', foe, false);
    const mine = b.activeMon();
    mine.shadow = { heart: 80 };
    b.showSprite('player', mine, false);
    return { enemy: b.markObjs.enemy.length, player: b.markObjs.player.length };
  });
  const tinted = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').enemySprite.tintTopLeft ?? -1);
  expect(tinted).toBe(0xb890ff);
  expect(n.enemy).toBeGreaterThan(0);
  expect(n.player).toBeGreaterThan(0);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'test-results/marks.png' });
  expect(errors).toEqual([]);
});
