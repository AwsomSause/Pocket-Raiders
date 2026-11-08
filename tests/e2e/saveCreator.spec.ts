import { expect, test } from '@playwright/test';

// The Save Creator page (savegen.html): a preset loads, validation shows, and a save file downloads.
test('the Save Creator builds a downloadable save', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/savegen.html');
  await expect(page.locator('#msg')).toContainText('import check passed', { timeout: 60_000 });
  await page.locator('#actions select').selectOption({ index: 1 });
  await expect(page.locator('#msg')).toContainText('import check passed');
  await page.getByRole('button', { name: 'Party' }).click();
  await page.locator('input[list="dl-species"]').first().fill('no-such-mon');
  await expect(page.locator('#msg')).toContainText('unknown species');
  await page.locator('input[list="dl-species"]').first().fill('charizard');
  const [file] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download save' }).click()]);
  expect(file.suggestedFilename()).toMatch(/\.json$/);
  expect(errors).toEqual([]);
});
