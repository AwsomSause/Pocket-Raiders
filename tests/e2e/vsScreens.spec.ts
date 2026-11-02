import { expect, test, type Page } from '@playwright/test';
import { confirmToMenu } from './battleInput';

// Pokémon Memories slice 5: bosses with their own VS card get that VS screen
// in each style (HGSS Brock, Black/White Clay, the Elite Four bar for
// Champion Cynthia, the champion backdrop for Iris). No page errors.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

const vsCardShown = (page: Page) =>
  page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').children.list.find((o: any) => o.name === 'vs-screen' && o.texture?.key?.startsWith('vs.card.'))?.texture.key ?? null);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('bosses get their own VS screen in four styles', async ({ page }) => {
  test.setTimeout(150_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?seed=memories-vs&debug=1');
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  await confirmToMenu(page);
  for (const [classId, name, leaderId, card] of [
    ['gym-leader', 'Brock', 'brock', 'vs.card.brock'],
    ['gym-leader', 'Clay', 'clay', 'vs.card.clay'],
    ['champion', 'Cynthia', 'cynthia', 'vs.card.cynthia-masters4'],
    ['champion', 'Iris', 'iris', 'vs.card.iris-gen5bw2'],
  ]) {
    await page.evaluate(
      ([c, n, l]) => {
        const pkr = (window as any).__pkr;
        pkr.session.run.battle.trainer = { classId: c, name: n, leaderId: l };
        pkr.game.scene.getScene('Battle').scene.restart();
      },
      [classId, name, leaderId],
    );
    await expect.poll(() => vsCardShown(page), { timeout: 15_000, intervals: [50] }).toBe(card);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `test-results/memories-vs-${leaderId}.png` });
  }
  expect(errors).toEqual([]);
});
