import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D6 (districts, Notoriety and the Ledger): the Empire Ledger (mockup 7) on tab 6 / key L, its three
// spreads, the map's Regard and Dread, and a crew district task sent to another town from the Morning (P). Saved at
// every step; a reload keeps the books.

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

test('the Ledger: money and empire, territory and the ladder, the crew; a district task; reload keeps the books', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  const s = await newDominion(page);

  // Round to the Morning; answer any talk; send Rook to Chant, then pick the town with P.
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('NIGHT');
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('MORNING');
  for (let n = (await block(page)).crew.talks.length; n > 0; n--) {
    await s.getByTestId('dom-talk-0').click();
    await expect.poll(async () => (await block(page)).crew.talks.length).toBe(n - 1);
  }
  await page.evaluate(() => (window as any).__pkr.session.dominionStep({ t: 'assign', member: 'm1', task: 'chant' }));
  await s.getByTestId('dom-strip-m1').click();
  await expect(s.getByTestId('dom-where')).toContainText('Pewter');
  await page.keyboard.press('KeyP');
  await expect(s.getByTestId('dom-where')).toContainText('Viridian');
  await expect(s.getByTestId('dom-strip-m1')).toContainText('Viridian');
  expect((await block(page)).members[0].crew.where).toBe('viridian');
  await shot('morning-where');

  // The Day: odd jobs go on the books as clean money.
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('DAY');
  await page.keyboard.press('KeyE');
  await expect(s.getByTestId('dom-phase')).toHaveText('EVENING');

  // The map's district file shows the town's Regard and Dread.
  await page.keyboard.press('Digit2');
  await expect(s.getByTestId('dom-regard')).toBeVisible();
  await expect(s.getByTestId('dom-dread')).toBeVisible();

  // L opens the Ledger (mockup 7) from the map: Money | Empire.
  await page.keyboard.press('KeyL');
  await expect(s.getByTestId('dom-ledger')).toContainText('Week 1');
  // L here is the Ledger, not the game's interaction log.
  await expect(page.getByText('Interaction log')).toBeHidden();
  await expect(s.getByTestId('dom-ledger-money')).toBeVisible();
  await expect(s.getByTestId('dom-ledger-lines')).toContainText('Odd jobs');
  await expect(s.getByTestId('dom-ledger-lines')).toContainText('due Day 7');
  await expect(s.getByTestId('dom-ledger-clean')).not.toHaveText('₽0');
  await expect(s.getByTestId('dom-ledger-empire')).toContainText('0 of 10');
  await expect(s.getByTestId('dom-ledger-stamp')).toHaveText('NOBODY');
  await shot('7-ledger');

  // ▶ turns to Territory | Notoriety; the CREW tab to the crew.
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('dom-ledger-territory')).toContainText('Cinnabar');
  await expect(s.getByTestId('dom-ledger-ladder')).toContainText('Street Gang');
  await shot('ledger-territory');
  await s.getByTestId('dom-ledger-tab-2').click();
  await expect(s.getByTestId('dom-ledger-crew')).toContainText('Rook');
  await expect(s.getByTestId('dom-ledger-stores')).toContainText('Boss team');
  await shot('ledger-crew');
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('dom-ledger-money')).toBeVisible();

  // Several window sizes.
  for (const [w, h] of [[1280, 720], [960, 540], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await expect(s.getByTestId('dom-ledger-money')).toBeVisible();
    await shot(`ledger-${w}x${h}`);
  }

  // L closes back to the map; tab 6 opens it from the HQ too, Esc closes.
  await page.keyboard.press('KeyL');
  await expect(s.getByTestId('dom-map')).toBeVisible();
  await page.keyboard.press('Digit1');
  await page.keyboard.press('Digit6');
  await expect(s.getByTestId('dom-ledger')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-phase')).toHaveText('EVENING');
  const before = await block(page);
  expect(before.empire.week.oddJobs).toBeGreaterThan(0);

  // Reload: the books are still there.
  await page.goto('/?ui=new');
  await waitForScene(page, 'MainMenu');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.continueRun();
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  });
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await expect(view(page, 'Dominion').getByTestId('dom-phase')).toHaveText('EVENING');
  expect(await block(page)).toEqual(before);
  await page.keyboard.press('KeyL');
  await expect(view(page, 'Dominion').getByTestId('dom-ledger-lines')).toContainText('Odd jobs');
  expect(errors).toEqual([]);
});
