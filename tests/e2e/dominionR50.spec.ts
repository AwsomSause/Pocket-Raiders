import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION redesign R0 (pass 50 of plans/evil-mode-rework/redesign-50): the HQ hub (mockup `hq`), the Start menu over
// it (`start`) and the Boss Menu as Rotom's phone (`menu`). Shots go to the test's output folder for the side-by-side
// check against the mockups (`?bare&still&pass=50&s=<id>`).

test.use({ viewport: { width: 960, height: 540 } });

async function toHq(page: Page) {
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'dominion' });
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Dominion');
  const s = view(page, 'Dominion');
  await expect(s.getByTestId('dom-logo')).toBeVisible();
  await page.waitForTimeout(300);
  await s.getByTestId('dom-title-0').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-type-poison').click();
  await s.getByTestId('dom-type-dark').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-next').click();
  for (let i = 0; i < 4; i++) await s.getByTestId('dom-opening').click();
  await expect(s.getByTestId('r5-hq')).toBeVisible();
  return s;
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);

test('the pass-50 HQ hub, Start menu and Boss Menu phone', async ({ page }, info) => {
  const shot = async (n: string) => {
    await page.waitForTimeout(6000);
    await page.screenshot({ path: info.outputPath(`${n}.png`) });
    if (process.env.R5_DUMP) writeFileSync(info.outputPath(`${n}.html`), await page.locator('#r5').innerHTML());
  };
  const errors = watch(page);
  await start(page, 'ui=new&tutorial=0');
  const s = await toHq(page);

  // The hub: building, tonight's list, the text box with the clock button, six tabs, key strip.
  await expect(s.getByTestId('dom-phase')).toHaveText('EVENING');
  await expect(s.getByTestId('dom-funds')).toHaveText('₽1,000');
  await expect(s.getByTestId('dom-roster')).toHaveText('1/3');
  await expect(s.getByTestId('dom-building').locator('.rm11').first()).toBeVisible();
  await expect(s.getByTestId('dom-next')).toBeVisible();
  await expect(s.locator('[data-testid^="dom-tab-"]')).toHaveCount(6);
  const before = await block(page);
  await shot('hq');

  // Start: the menu over the HQ; arrows move, Esc closes; nothing in the run changes.
  await s.locator('.ph13.st25').click();
  await expect(s.getByTestId('r5-start')).toBeVisible();
  await expect(s.getByTestId('r5-start-menu')).toHaveClass(/\bon\b/);
  await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('r5-start-roster')).toHaveClass(/\bon\b/);
  await shot('start');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-start')).toHaveCount(0);

  // Esc: the Boss Menu as Rotom's phone, ten apps.
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-menu')).toBeVisible();
  await expect(s.locator('[data-testid^="dom-blade-"]')).toHaveCount(10);
  await expect(s.getByTestId('dom-glance')).toContainText('Heat');
  await shot('menu');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-hq')).toBeVisible();
  expect(await block(page)).toEqual(before);
  expect(errors).toEqual([]);
});
