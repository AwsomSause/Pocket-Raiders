import { expect, test, type Page } from '@playwright/test';

// Battle/AI ideas batch 1: the Map shows a region's own type rules (S156); the Settings list has the Auto-Battle rules (S43).

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

async function toMap(page: Page, seed: string) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/?seed=${seed}&campaign=dev&debug=1`);
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(next);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(800);
}

const ruleText = (page: Page) =>
  page.evaluate(() => {
    const m = (window as any).__pkr.game.scene.getScene('Map');
    return (m.children.getByName('region-type-rules') as { text?: string } | null)?.text ?? null;
  });

test('Kanto shows its old type rules on the map; a region without rules shows none', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1280, height: 720 });
  await toMap(page, 'type-rules');
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.run.regionOrder[s.run.regionIndex] = 'kanto';
    (window as any).__pkr.game.scene.getScene('Map').scene.restart();
  });
  await expect.poll(() => ruleText(page), { timeout: 10_000 }).toContain('Ghost→Psychic ×0');
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.run.regionOrder[s.run.regionIndex] = 'paldea';
    (window as any).__pkr.game.scene.getScene('Map').scene.restart();
  });
  await page.waitForTimeout(800);
  expect(await ruleText(page)).toBeNull();
  expect(errors).toEqual([]);
});
