import { expect, test, type Page } from '@playwright/test';

// Milestone 5.5 in a real browser: the Preparation Desk (no starter pool or
// draft rows: Remembrances are the only starter system), rolling three
// starters from three regions, and the campaign briefing.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
const profile = (page: Page) => page.evaluate(() => (window as any).__pkr.session.profile);
const prepFocus = (page: Page) => page.evaluate(() => (window as any).__pkr.game.scene.getScene('RunPrep').focusIndex as number);

async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

/** Moves the Preparation Desk cursor to a row (0 = Roll starters). */
async function prepRow(page: Page, row: number) {
  for (let i = 0; i < 20 && (await prepFocus(page)) !== row; i++) {
    await page.keyboard.press((await prepFocus(page)) < row ? 'ArrowDown' : 'ArrowUp');
  }
  expect(await prepFocus(page)).toBe(row);
}


/** Opens a Preparation Desk page (0 Run Setup, 1 Trainer, 2 Modifiers, 3 Overview) and waits for it. */
async function prepPage(page: Page, n: number) {
  await page.evaluate((i) => (window as any).__pkr.game.scene.getScene('RunPrep').goPage(i), n);
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('RunPrep').page), { timeout: 5_000 }).toBe(n);
  await page.waitForTimeout(400);
}

async function toPrepDesk(page: Page, url: string) {
  await page.goto(url);
  await waitForScene(page, 'MainMenu');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Hub');
  await page.keyboard.press('Enter'); // Start a run
  await waitForScene(page, 'TrainerSelect');
  await page.keyboard.press('Enter'); // Red
  await waitForScene(page, 'RunPrep');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('the Preparation Desk has no starter pool or draft rows, and rolling gives three Remembrance starters from three regions', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await toPrepDesk(page, '/?seed=e2e-m55&debug=1');
  await prepPage(page, 3); // Overview
  const labels = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('RunPrep').menu.config.options.map((o: any) => o.label as string));
  expect(labels.some((l: string) => /pool|draft/i.test(l))).toBe(false);
  await prepRow(page, 0);
  await page.keyboard.press('Enter'); // Roll starters
  await waitForScene(page, 'StarterSelect');
  const run = await page.evaluate(() => (window as any).__pkr.session.run);
  expect(run.seed).toBe('e2e-m55');
  expect(run.starterChoices).toHaveLength(3);
  const regions = await page.evaluate((ids: string[]) => {
    const { session } = (window as any).__pkr;
    return ids.map((id) => session.content.storyData.remembrances.find((r: any) => r.line[0] === id)?.generation ?? `own:${id}`);
  }, run.starterChoices);
  expect(new Set(regions).size).toBe(3);
  await page.screenshot({ path: 'test-results/m55-starters.png' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Briefing');
  await page.screenshot({ path: 'test-results/m55-briefing.png' });
  expect((await page.evaluate(() => (window as any).__pkr.session.run)).party).toHaveLength(1);
  expect(errors).toEqual([]);
});
