import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D6b: a street meeting (outside-interactions.md sections A and J) waits on the Region Map as a panel;
// ▲ ▼ pick an answer, Enter gives it, the notice says what it did, and it's saved (a reload shows it answered).

async function newDominion(page: Page) {
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'dominion' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
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
  await expect(s.getByTestId('dom-phase')).toHaveText('EVENING');
  return s;
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);

test('a street meeting on the map: pick an answer with the arrows, Enter gives it, and it is saved', async ({ page }, info) => {
  const errors = watch(page);
  await start(page, 'ui=new');
  const s = await newDominion(page);

  // A lost wallet in Pewter (O001), as if met after the last action; saved like any step.
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    const b = p.session.run.expansion.dominion;
    b.empire = { week: {}, weeks: [], peak: 0, press: false, visits: [], holders: [], collect: {}, guarded: [], ...(b.empire ?? {}), meet: { row: 'O001', district: 'pewter', day: b.day }, met: ['O001'], metDay: b.day };
    p.session.saveRunNow();
  });
  await page.keyboard.press('Digit2');
  const panel = s.getByTestId('dom-town');
  await expect(panel).toContainText('A lost wallet lies on the pavement');
  await expect(panel).toContainText('Pewter');
  await expect(s.getByTestId('dom-town-0')).toHaveClass(/shine/);
  await page.screenshot({ path: info.outputPath('meet.png') });

  // ▼ to "Keep it", Enter: +₽80 and Heat; the panel goes, the notice says so.
  const funds = (await block(page)).funds;
  await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('dom-town-1')).toHaveClass(/shine/);
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-notice')).toContainText('Keep it: +₽80');
  await expect(panel).toBeHidden();
  const after = await block(page);
  expect(after.funds).toBe(funds + 80);
  expect(after.empire.meet).toBeNull();

  // Reload: answered stays answered.
  await page.goto('/?ui=new');
  await waitForScene(page, 'MainMenu');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.continueRun();
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  });
  await waitForScene(page, 'Dominion');
  expect((await block(page)).empire.meet).toBeNull();
  expect((await block(page)).funds).toBe(funds + 80);
  expect(errors).toEqual([]);
});
