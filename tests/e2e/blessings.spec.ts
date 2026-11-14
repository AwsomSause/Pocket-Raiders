import { expect, test, type Page } from '@playwright/test';

// Beta 0.7 Legendary Blessings: the Side Plinth opening after the starter is chosen, and no screen at all with the setting off.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}
async function toStarter(page: Page, blessings: boolean) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=e2e-blessing&campaign=dev&debug=1');
  await waitForScene(page, 'MainMenu');
  await page.evaluate((on) => { (window as any).__pkr.session.settings.expansion.blessingsEnabled = on; }, blessings);
  for (const key of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, key);
  }
}

test('a run with a blessing opens with the plinth screen, then the briefing and the map', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await toStarter(page, true);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Blessing');
  const info = await page.evaluate(() => { const b = (window as any).__pkr.session.run.expansion.blessing; return { id: b.id, seen: b.seen }; });
  expect(info.seen).toBe(false);
  await page.waitForTimeout(1200);
  await page.keyboard.press('Enter'); // finishes the sequence at once
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/blessing-plinth.png' });
  expect(await scene(page)).toBe('Blessing');
  await page.keyboard.press('Enter'); // on to the briefing
  await waitForScene(page, 'Briefing');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.expansion.blessing.seen)).toBe(true);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Map');
  expect(errors).toEqual([]);
});

test('with the setting off the starter goes straight to the briefing', async ({ page }) => {
  await toStarter(page, false);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Briefing');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.expansion?.blessing ?? null)).toBeNull();
});
