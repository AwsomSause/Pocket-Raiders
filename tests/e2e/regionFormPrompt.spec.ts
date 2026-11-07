import { expect, test, type Page } from '@playwright/test';

// Regional form opt-in: a Pokémon with a form of the region you are in is offered it on the map.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

test('Raichu in Alola is offered its Alolan form, free, once', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=region-form&debug=1');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing']) {
    await page.keyboard.press('Enter');
    await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(next);
    await page.waitForTimeout(250);
  }
  for (let i = 0; i < 8 && (await scene(page)) !== 'Map'; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('Map');
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    session.run.regionOrder[session.run.regionIndex] = 'alola';
    session.run.party[0].speciesId = 'raichu';
    game.scene.getScene('Map').scene.restart({});
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: test.info().outputPath('region-form-prompt.png') });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);
  const species = await page.evaluate(() => (window as any).__pkr.session.run.party[0].speciesId);
  expect(species).toBe('raichu-alola');
  await page.screenshot({ path: test.info().outputPath('region-form-after.png') });
  expect(errors).toEqual([]);
});
