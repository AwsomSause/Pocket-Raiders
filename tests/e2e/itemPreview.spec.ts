import { expect, test, type Page } from '@playwright/test';
import { confirmToMenu } from './battleInput';

// Overhaul slice 7: choosing a Pokémon for an item shows who it works on, and I opens a quick summary without leaving the list.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}

test('item target list shows a preview for every Pokémon and a quick summary that keeps the list open', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=e2e-itempreview&debug=1');
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  await confirmToMenu(page);
  // Hurt the lead so a Potion has something to do.
  await page.evaluate(() => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    b.run.party[0].hp = 1;
  });
  await page.keyboard.press('ArrowRight'); // Bag
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle').picker))).toBe(true);
  // Open the Potion's target list (the same call the Bag row makes).
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').openItemTarget('potion'));
  const marks = () =>
    page.evaluate(() => {
      const names: string[] = [];
      const walk = (o: any) => {
        if (o.name?.startsWith('item-preview-')) names.push(o.name);
        o.list?.forEach(walk);
      };
      (window as any).__pkr.game.scene.getScene('Battle').children.list.forEach(walk);
      return names;
    });
  await expect.poll(async () => (await marks()).includes('item-preview-good')).toBe(true);
  await page.screenshot({ path: 'test-results/item-preview-list.png' });
  const summaryOpen = () => page.evaluate(() => {
    let found = false;
    const walk = (o: any) => {
      if (o.name === 'picker-summary') found = true;
      o.list?.forEach(walk);
    };
    (window as any).__pkr.game.scene.getScene('Battle').children.list.forEach(walk);
    return found;
  });
  await page.keyboard.press('i');
  await expect.poll(summaryOpen).toBe(true);
  await page.screenshot({ path: 'test-results/item-preview-summary.png' });
  await page.keyboard.press('Escape'); // closes the summary only
  await expect.poll(summaryOpen).toBe(false);
  expect(await page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle').picker))).toBe(true);
  expect(errors).toEqual([]);
});
