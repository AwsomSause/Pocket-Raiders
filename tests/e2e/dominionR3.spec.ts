import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION redesign R3 (pass 50 of plans/evil-mode-rework/redesign-50): The Day. The Region Map (mockup `map`), Focus
// view (`focus`), Place your crew (`deploy`), the District file (`district`) and Walk the street (`street`). Shots go to
// the test's output folder for the side-by-side check against the mockups (`?bare&still&pass=50&s=<id>`).

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
  // The opening's four pages (R1 added a last "To the HQ" press on the fourth).
  for (let i = 0; i < 6 && !(await s.getByTestId('r5-hq').isVisible()); i++) {
    await s.getByTestId('dom-opening').click();
    await page.waitForTimeout(150);
  }
  await expect(s.getByTestId('r5-hq')).toBeVisible();
  return s;
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);

test('The Day: the map, Focus view, Place your crew, the District file and the street', async ({ page }, info) => {
  const shot = async (n: string) => {
    await page.waitForTimeout(Number(process.env.R5_WAIT ?? 6000));
    await page.screenshot({ path: info.outputPath(`${n}.png`) });
    if (process.env.R5_DUMP) writeFileSync(info.outputPath(`${n}.html`), await page.locator('#r5').innerHTML());
  };
  const errors = watch(page);
  await start(page, 'ui=new&tutorial=0&moments=1');
  const s = await toHq(page);

  // The map: the board, the district file with its chips, the text box.
  await page.keyboard.press('Digit2');
  await expect(s.getByTestId('r5-map')).toBeVisible();
  await expect(s.getByTestId('dom-dz-cerulean')).toBeVisible();
  await expect(s.getByTestId('dom-file')).toBeVisible();
  await s.getByTestId('dom-dz-cerulean').click();
  await expect(s.getByTestId('dom-dz-cerulean')).toHaveClass(/\bon\b/);
  await shot('map');

  // F: Focus view; F again: the HUD comes back.
  await page.keyboard.press('KeyF');
  await expect(s.getByTestId('r5-focus')).toBeVisible();
  await shot('focus');
  await page.keyboard.press('KeyF');
  await expect(s.getByTestId('r5-map')).toBeVisible();

  // Place your crew: the tray of members; Enter places the first one in the district under the cursor.
  await s.getByText('Place crew').click();
  await expect(s.getByTestId('r5-deploy')).toBeVisible();
  await shot('deploy');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-map')).toBeVisible();

  // Enter: the District file; the street from there; Esc back.
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('r5-district')).toBeVisible();
  await expect(s.getByTestId('dom-df-acts')).toBeVisible();
  await shot('district');
  await s.getByTestId('dom-df-street').click();
  await expect(s.getByTestId('r5-street')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('dom-st-cerulean-gym')).toHaveClass(/\bon\b/);
  await shot('street');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-district')).toBeVisible();

  // The Ledger (L) from the map.
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-map')).toBeVisible();
  await page.keyboard.press('KeyL');
  await expect(s.getByTestId('dom-ledger')).toBeVisible();
  await shot('ledger');
  await s.getByTestId('dom-ledger-back').click();
  await expect(s.getByTestId('r5-map')).toBeVisible();

  // The clock (the Day on the top bar), then the calendar (C).
  await page.keyboard.press('Digit1');
  await expect(s.getByTestId('r5-hq')).toBeVisible();
  await s.locator('[data-act="r5go"][data-arg="clock"]').first().click();
  await expect(s.getByTestId('r5-clock')).toBeVisible();
  await shot('clock');
  await page.keyboard.press('KeyC');
  await expect(s.getByTestId('r5-calendar')).toBeVisible();
  await shot('calendar');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-hq')).toBeVisible();

  // End the day; the Evening's take from the map.
  for (let i = 0; i < 4 && (await block(page)).phase !== 'evening'; i++) {
    await s.getByTestId('dom-next').click();
    await page.waitForTimeout(300);
  }
  expect((await block(page)).phase).toBe('evening');
  await page.keyboard.press('Digit2');
  await s.getByTestId('dom-eve-open').click();
  await expect(s.getByTestId('r5-evening')).toBeVisible();
  await shot('evening');
  await s.getByTestId('dom-eve-close').click();
  await expect(s.getByTestId('r5-hq')).toBeVisible();

  // Night, then the Morning paper, the Morning report and Assign a task.
  for (let i = 0; i < 4 && (await block(page)).phase !== 'morning'; i++) {
    await s.getByTestId('dom-next').click();
    await page.waitForTimeout(300);
  }
  await expect(s.getByTestId('dom-paper')).toBeVisible();
  await shot('paper');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-morning-report')).toBeVisible();
  await shot('morning');
  // Last night: the clock's Morning row.
  await s.locator('[data-act="r5go"][data-arg="clock"]').first().click();
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('r5-recap')).toBeVisible();
  await shot('recap');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-morning-report')).toBeVisible();
  if (await s.getByTestId('dom-talk').isVisible()) await s.getByTestId('dom-talk-0').click();
  await s.getByTestId('dom-morning-assign').click();
  await expect(s.getByTestId('dom-as-grid')).toBeVisible();
  await shot('assign');
  expect(errors).toEqual([]);
});

// R3's own rules (theDay.ts): Rotom's forecast, Travel, the Timetable, the Flooded tunnel, the Newsstand, the Scrapbook.
test('The Day: forecast, travel, timetable, flooded tunnel, newsstand and scrapbook', async ({ page }, info) => {
  const shot = async (n: string) => {
    await page.waitForTimeout(Number(process.env.R5_WAIT ?? 6000));
    await page.screenshot({ path: info.outputPath(`${n}.png`) });
    if (process.env.R5_DUMP) writeFileSync(info.outputPath(`${n}.html`), await page.locator('#r5').innerHTML());
  };
  const errors = watch(page);
  await start(page, 'ui=new&tutorial=0&moments=1');
  const s = await toHq(page);
  // Test setup only: a clipping in the Scrapbook (a job makes one the morning after).
  await page.evaluate(() => {
    const b = (window as any).__pkr.session.run.expansion.dominion;
    b.paper = { ...(b.paper ?? { jobs: [], prev: null, snap: null }), book: [{ d: 1, head: 'NEW GANG IN PEWTER?', deck: 'Police shrug' }] };
  });

  // The clock's Forecast: seven days; Esc goes back to the clock.
  await s.locator('[data-act="r5go"][data-arg="clock"]').first().click();
  await s.getByTestId('dom-clock-wx').click();
  await expect(s.getByTestId('r5-weather')).toBeVisible();
  await expect(s.locator('.dy15')).toHaveCount(7);
  await expect(s.getByTestId('dom-wx-0')).toContainText('Sunny');
  await s.getByTestId('dom-wx-2').click();
  await expect(s.getByTestId('dom-wx-2')).toHaveClass(/\bon\b/);
  await shot('weather');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-clock')).toBeVisible();
  await page.keyboard.press('Escape');

  // The Timetable (Y on the map): trains from the HQ's station; Board makes the Magnet Line the way.
  await page.keyboard.press('Digit2');
  await expect(s.getByTestId('r5-map')).toBeVisible();
  await page.keyboard.press('KeyY');
  await expect(s.getByTestId('r5-timetable')).toBeVisible();
  await expect(s.getByTestId('dom-tt-here')).toBeVisible();
  await shot('timetable');
  await s.getByTestId('dom-tt-board').click();
  expect((await block(page)).field.route).toBe('train');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-map')).toBeVisible();

  // Travel (V) to Vermilion on a storm day: the ways, then the Flooded tunnel.
  await page.evaluate(() => { (window as any).__pkr.session.run.expansion.dominion.field.sky = 'storm'; });
  await s.getByTestId('dom-dz-vermilion').click();
  await page.keyboard.press('Enter');
  await s.getByTestId('dom-df-travel').click();
  await expect(s.getByTestId('r5-travel')).toBeVisible();
  await expect(s.getByTestId('dom-tv-way-2')).toContainText('Cancelled');
  await s.getByTestId('dom-tv-way-0').click();
  await s.getByTestId('dom-tv-go').click();
  expect((await block(page)).field.route).toBe('road');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-tv-back')).toHaveCount(0);
  await shot('travel');
  await s.getByTestId('dom-tv-flood').click();
  await expect(s.getByTestId('r5-flood')).toBeVisible();
  await s.getByTestId('dom-fl-way-0').click();
  await shot('flood');
  await s.getByTestId('dom-fl-go').click();
  expect((await block(page)).field.wet).toBe('wade');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-travel')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-map')).toBeVisible();

  // The Newsstand (U): three papers; the Scrapbook from there.
  await page.keyboard.press('KeyU');
  await expect(s.getByTestId('r5-papers')).toBeVisible();
  await expect(s.locator('.np18')).toHaveCount(3);
  await shot('papers');
  await s.getByTestId('dom-np-scrap').click();
  await expect(s.getByTestId('r5-scrap')).toBeVisible();
  await expect(s.getByTestId('dom-clip-0')).toContainText('NEW GANG IN PEWTER?');
  await shot('scrap');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-papers')).toBeVisible();
  expect(errors).toEqual([]);
});
