import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D27: Esc on the HQ opens the Boss Menu (v4 mockup m1); S opens Settings (m2) with the Dominion tab
// (run rules, Show odds, End the day, Effects & motion), the Effects & motion tab and the game's other categories.
// The run rules picked before a run are stamped on its block; Effects & motion only changes how pages are drawn.

async function newDominion(page: Page) {
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    const e = s.settings.expansion;
    s.saveSettings({ ...s.settings, expansion: { ...e, evilMode: true, dominionPrefs: { ...e.dominionPrefs, run: { ...e.dominionPrefs.run, pace: 'ruthless', hero: 'high' } } } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'dominion' });
  // The first key press right after a scene change can be dropped: wait 250 ms after each one.
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Dominion');
  const s = view(page, 'Dominion');
  await expect(s.getByTestId('dom-logo')).toBeVisible();
  await page.waitForTimeout(300);
  return s;
}

/** Presses `key` until `shown` is visible: a press can be lost in a busy headless frame, and every press is checked. */
async function pressUntil(page: Page, key: string, shown: ReturnType<Page['locator']>) {
  await expect(async () => {
    if (!(await shown.isVisible())) await page.keyboard.press(key);
    await expect(shown).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 15_000 });
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);
const prefs = (page: Page) => page.evaluate(() => (window as any).__pkr.session.settings.expansion.dominionPrefs);

test('Boss Menu on Esc, Settings with the Dominion and Effects & motion tabs', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  const s = await newDominion(page);
  await s.getByTestId('dom-title-0').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-type-poison').click();
  await s.getByTestId('dom-type-dark').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-next').click();
  for (let i = 0; i < 4; i++) await s.getByTestId('dom-opening').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('EVENING');

  // The run keeps the rules Settings had when it began.
  expect((await block(page)).rules).toEqual({ length: 'three', pace: 'ruthless', hero: 'high', betrayals: 'normal' });

  // Esc on the HQ: the Boss Menu (nothing in the run changes).
  const before = await block(page);
  await pressUntil(page, 'Escape', s.getByTestId('dom-menu-title'));
  await expect(s.locator('[data-testid^="dom-blade-"]')).toHaveCount(9);
  await expect(s.getByTestId('dom-blade-back')).toHaveClass(/on/);
  await expect(s.getByTestId('dom-menu-keys').locator('.q4')).toHaveText('Q');
  await expect(s.getByTestId('dom-glance')).toContainText('Heat');
  await expect(s.getByTestId('dom-menu-slot')).toContainText('Slot');
  await expect(view(page, 'Dominion')).not.toContainText(/Claude|\bAI\b/);
  expect(await block(page)).toEqual(before);
  await shot('m1-boss-menu');

  // Arrows move the blade; Q does nothing; Esc goes back to work.
  await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('dom-blade-hq')).toHaveClass(/on/);
  await page.keyboard.press('KeyQ');
  await page.waitForTimeout(200);
  await expect(s.getByTestId('dom-menu-title')).toBeVisible();
  await pressUntil(page, 'Escape', s.getByTestId('dom-phase'));
  await expect(s.getByTestId('dom-menu-title')).toHaveCount(0);

  // S opens Settings · Dominion (m2): the run rows and the Effects & motion block side by side.
  await pressUntil(page, 'Escape', s.getByTestId('dom-menu-title'));
  await pressUntil(page, 'KeyS', s.getByTestId('dom-set-run'));
  await expect(s.getByTestId('dom-set-title')).toContainText('Dominion');
  await expect(s.getByTestId('dom-set-fx')).toBeVisible();
  await expect(s.getByTestId('dom-set-row-1')).toContainText('Ruthless');
  await shot('m2-settings-dominion');

  // Arrows: Day pace (row 1) one step left; Show odds (row 4) and End the day (row 5) by tap.
  await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('dom-set-row-1')).toHaveClass(/sel/);
  await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => (await prefs(page)).run.pace).toBe('normal');
  await s.getByTestId('dom-set-row-4').locator('.tg').click();
  await s.getByTestId('dom-set-row-5').locator('.tg').click();
  await expect.poll(async () => [(await prefs(page)).showOdds, (await prefs(page)).autoEndDay]).toEqual([false, true]);
  // D12's Chair settings sit below (this run's, saved as a clock step): the list scrolls to them.
  // (The taps left the cursor on row 5.)
  for (let i = 0; i < 2; i++) await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('dom-set-row-7')).toContainText('The Chair');
  await expect(s.getByTestId('dom-set-row-7')).toHaveClass(/sel/);
  const len = (await block(page)).chair?.opts.length ?? 'normal';
  await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => (await block(page)).chair?.opts.length ?? 'normal').not.toBe(len);
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowUp');
  await expect(s.getByTestId('dom-set-row-1')).toHaveClass(/sel/);
  // Boundary: Six regions stay locked until the Crossing.
  await s.getByTestId('dom-set-row-0').getByText('Six').click();
  expect((await prefs(page)).run.length).toBe('three');
  // The current run keeps the rules it began with.
  expect((await block(page)).rules.pace).toBe('ruthless');

  // Calm: no motion on any Dominion page.
  await s.getByTestId('dom-fx-calm').click();
  await expect.poll(async () => (await prefs(page)).fx).toEqual({ level: 'calm', particles: false, cutIns: 'skip', shake: false, flashes: 'off' });
  await expect(page.locator('#rx .domfx.fx-calm')).toHaveCount(1);
  const anim = await s.locator('.ttl').first().evaluate((e) => getComputedStyle(e, '::before').animationName);
  expect(anim).toBe('none');
  await shot('m2-settings-calm');

  // Tab: the Effects & motion tab with its preview; D resets the tab to Full show.
  await page.keyboard.press('Tab');
  await expect(s.getByTestId('dom-set-title')).toContainText('Effects');
  await expect(s.getByTestId('dom-fx-preview')).toBeVisible();
  await shot('settings-effects-calm');
  await page.keyboard.press('KeyD');
  await expect.poll(async () => (await prefs(page)).fx.level).toBe('full');
  await expect(page.locator('#rx .domfx.fx-full')).toHaveCount(1);
  await shot('settings-effects-full');

  // The game's own categories live in the same list (Audio: a value row, ◀ ▶ changes it).
  await s.getByTestId('dom-set-cat-audio').click();
  await expect(s.getByTestId('dom-set-list')).toBeVisible();
  await shot('settings-audio');
  // Rotom keeps its own tab (never "Claude").
  await s.getByTestId('dom-set-cat-rotom').click();
  await expect(s.getByTestId('dom-set-list')).toContainText('Rotom');
  await expect(view(page, 'Dominion')).not.toContainText(/Claude|\bAI\b/);

  // Esc: rows -> categories -> Boss Menu -> the HQ.
  await pressUntil(page, 'Escape', s.getByTestId('dom-menu-title'));
  await pressUntil(page, 'Escape', s.getByTestId('dom-phase'));

  // A blade with its number: 3 opens the Crew Roster straight from the menu.
  await pressUntil(page, 'Escape', s.getByTestId('dom-menu-title'));
  await page.keyboard.press('Digit3');
  await expect(s.getByTestId('dom-menu-title')).toHaveCount(0);
  await expect(s.getByTestId('dom-file-keys')).toBeVisible();

  // The menu at three window sizes.
  await pressUntil(page, 'Escape', s.getByTestId('dom-phase'));
  await pressUntil(page, 'Escape', s.getByTestId('dom-menu-title'));
  for (const [w, h] of [[1280, 720], [960, 540], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await expect(s.getByTestId('dom-blades')).toBeVisible();
    await shot(`menu-${w}x${h}`);
  }

  // Go into hiding (End): save and quit; the settings and the block come back after a reload.
  const saved = await block(page);
  await s.getByTestId('dom-blade-hide').click();
  await waitForScene(page, 'MainMenu');
  await page.goto('/?ui=new');
  await waitForScene(page, 'MainMenu');
  expect(await prefs(page)).toMatchObject({ showOdds: false, autoEndDay: true, run: { pace: 'normal', hero: 'high' }, fx: { level: 'full' } });
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.continueRun();
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  });
  await waitForScene(page, 'Dominion');
  expect(await block(page)).toEqual(saved);
  expect(errors).toEqual([]);
});
