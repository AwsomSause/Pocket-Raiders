import { expect, test } from '@playwright/test';
import { start, waitForScene, watch } from './helpers/newUi';
import { fitProblems, onPage, pview } from './helpers/phantomUi';

// The Phantom UI (Settings > Display > UI style > Phantom): the Persona-style look built from the mock-ups in
// plans/ui-redesign-persona. This file covers the first slice: the Title, the main menu and Settings.

test('Phantom UI: the splash waits for a button, then the main menu opens and works by keyboard and mouse', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=phantom');
  await onPage(page, 'MainMenu', 'title');
  const title = pview(page, 'MainMenu');
  await expect(title).toContainText('Press any button');
  await expect(title).toContainText('Red VERSION');
  expect(await fitProblems(page, 'MainMenu')).toEqual([]);

  // V opens Version Select: five cards, the cursor on the version in use; the next one changes colours, shapes and the trainer.
  await page.keyboard.press('v');
  await waitForScene(page, 'VersionSelect');
  await onPage(page, 'VersionSelect', 'version');
  const pick = pview(page, 'VersionSelect');
  await expect(pick.locator('.vc')).toHaveCount(5);
  await expect(pick.locator('.vc.on')).toContainText('Red');
  await expect(pick.locator('.vc.on')).toContainText('IN USE');
  expect(await fitProblems(page, 'VersionSelect')).toEqual([]);
  await page.keyboard.press('ArrowRight');
  await expect(pick.locator('.vc.on')).toContainText('Blue');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'MainMenu');
  await onPage(page, 'MainMenu', 'title');
  await expect(title).toHaveAttribute('data-liv', 'midnight');
  await expect(title).toContainText('Blue VERSION');
  expect(await page.evaluate(() => (window as any).__pkr.session.settings.phantomVersion)).toBe('midnight');

  await page.keyboard.press('ArrowDown');
  await onPage(page, 'MainMenu', 'menu');
  await expect(title).toContainText('Main menu');
  expect(await fitProblems(page, 'MainMenu')).toEqual([]);
  // The cursor follows the keys and the mouse; the list is the scene's own menu.
  const on = () => title.locator('.blade.on').innerText();
  await page.keyboard.press('ArrowDown');
  const second = await on();
  await title.locator('.blade', { hasText: 'Settings' }).hover();
  await expect.poll(on).toContain('SETTINGS');
  expect(second).not.toContain('SETTINGS');
  await title.locator('.blade', { hasText: 'Settings' }).click();
  await waitForScene(page, 'Settings');
  await onPage(page, 'Settings', 'set');
  // Back from a menu goes straight to the list, not the splash again.
  await page.keyboard.press('Escape');
  await waitForScene(page, 'MainMenu');
  await onPage(page, 'MainMenu', 'menu');
  expect(errors).toEqual([]);
});

test('Phantom UI: Settings has presets, a tile per page, rows that change, and a page for the phone', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=phantom');
  await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('MainMenu').scene.start('Settings', { from: 'MainMenu' }));
  await waitForScene(page, 'Settings');
  await onPage(page, 'Settings', 'set');
  const set = pview(page, 'Settings');
  const hd = set.locator('section.s-set-look > .hd');
  const settings = () => page.evaluate(() => (window as any).__pkr.session.settings);
  await expect(set.locator('.c8')).toHaveCount(10);
  await expect(set.locator('.ps.on')).toContainText('Standard');
  expect(await fitProblems(page, 'Settings')).toEqual([]);

  // A preset changes several settings with one press, and says so.
  await set.locator('.ps', { hasText: 'Calm' }).click();
  await expect(set.locator('.ps.on')).toContainText('Calm');
  await expect(set).toContainText('Calm preset in use.');
  expect((await settings()).reducedFlash).toBe(true);
  await page.keyboard.press('p');
  await expect(set.locator('.ps.on')).toContainText('Showtime');
  expect((await settings()).reducedFlash).toBe(false);

  // A page: the rail, six rows, the row's explanation and its values; right changes the value, left changes it back.
  await set.locator('.c8', { hasText: 'Sound' }).click();
  await onPage(page, 'Settings', 'set-look');
  await expect(hd).toContainText('Sound');
  await expect(set.locator('.rl8 span.on')).toHaveText('S');
  expect(await fitProblems(page, 'Settings')).toEqual([]);
  const before = (await settings()).muted;
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await settings()).muted).toBe(!before);
  await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => (await settings()).muted).toBe(before);

  // E turns to the next page, Q back; the Phone page gathers the settings that matter on a phone.
  await page.keyboard.press('e');
  await expect(hd).toContainText('Controls');
  await page.keyboard.press('q');
  await expect(hd).toContainText('Sound');
  await set.locator('.rl8 span', { hasText: 'P' }).click();
  await expect(hd).toContainText('Phone');
  await expect(set.locator('.sr8 .sr').first()).toContainText('One-handed');
  await page.waitForTimeout(700); // the live screen slides in
  expect(await fitProblems(page, 'Settings')).toEqual([]);

  // Every page of every version keeps its text on the screen.
  for (const liv of ['midnight', 'channel', 'fantasia', 'velvet']) {
    await page.evaluate((liv) => { const s = (window as any).__pkr.session; s.saveSettings({ ...s.settings, phantomVersion: liv }); (window as any).__pkr.game.scene.getScene('Settings').scene.restart({ from: 'MainMenu', page: 'display' }); }, liv);
    await expect(set).toHaveAttribute('data-liv', liv);
    await onPage(page, 'Settings', 'set-look');
    expect(await fitProblems(page, 'Settings'), liv).toEqual([]);
  }
  await page.keyboard.press('Escape');
  await onPage(page, 'Settings', 'set');
  await page.keyboard.press('Escape');
  await waitForScene(page, 'MainMenu');
  expect(errors).toEqual([]);
});

test('Phantom UI: a screen without a Phantom page yet shows its New page in Phantom colours', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=phantom');
  await onPage(page, 'MainMenu', 'title');
  await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('MainMenu').scene.start('Hub'));
  await waitForScene(page, 'Hub');
  const hub = page.locator('#rx .stage[data-scene="Hub"]').first();
  await expect(hub).toBeVisible();
  await expect(hub).toHaveClass(/phfb/);
  expect(errors).toEqual([]);
});
