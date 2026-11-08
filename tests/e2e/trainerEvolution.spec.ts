import { expect, test, type Page } from '@playwright/test';

// Trainer Evolutions: once Red's quest line is done, Champion Red appears beside Red on the trainer
// screen with an EVOLVED tag and can start a run.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

const texts = (page: Page, key: string) =>
  page.evaluate((key) => {
    const out: string[] = [];
    const walk = (o: any) => {
      if (typeof o.text === 'string') out.push(o.text);
      for (const c of o.list ?? []) walk(c);
    };
    for (const o of (window as any).__pkr.game.scene.getScene(key).children.list) walk(o);
    return out.join('\n');
  }, key);

test('only Nate and Hilda can be chosen (Trainer Evolutions are not offered)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=evolution-e2e');
  await waitForScene(page, 'MainMenu');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Hub');

  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Hub').scene.start('TrainerSelect'));
  await waitForScene(page, 'TrainerSelect');
  const shown = await texts(page, 'TrainerSelect');
  expect(shown).toContain('Nate');
  expect(shown).toContain('Hilda');
  expect(shown).not.toContain('★ EVOLVED');
  expect(shown).not.toContain('Champion Red');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'RunPrep');
  expect(errors).toEqual([]);
});
