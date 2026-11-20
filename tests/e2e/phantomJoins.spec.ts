import { expect, test, type Page } from '@playwright/test';
import { start, watch } from './helpers/newUi';
import { fitProblems, onPage, pview } from './helpers/phantomUi';

// The Phantom UI's page changes (Slash, Flare, Drop, Turn, Sweep, with Carry on each) and their page in Settings >
// Look. The page that left stays a moment as a still copy under the new page; the new page takes input at once.

const settings = (page: Page) => page.evaluate(() => {
  const s = (window as any).__pkr.session.settings;
  return { menu: s.menuAnimations as boolean, all: s.disableAllAnimations as boolean, strength: s.animationIntensity as string };
});
const ghosts = (page: Page) => page.locator('#phx [data-ghost]').count();
/** Counts every still copy put on the Phantom layer from now on (one lives well under a second). */
const spy = (page: Page) => page.evaluate(() => {
  const w = window as any;
  w.__ghosts = 0;
  new MutationObserver((list) => { for (const m of list) for (const n of m.addedNodes) if (n instanceof HTMLElement && n.hasAttribute('data-ghost')) w.__ghosts += 1; }).observe(document.getElementById('phx')!, { childList: true });
});
const seen = (page: Page) => page.evaluate(() => (window as any).__ghosts as number);
const step = async (page: Page, key: string) => { await page.keyboard.press(key); await page.waitForTimeout(250); };
const open = (page: Page, data: object) => page.evaluate((data) => { (window as any).__pkr.game.scene.getScene('MainMenu').scene.start('Settings', data); }, data);

test('Phantom UI: Page changes shows the six page changes, plays one, and sets how much they move', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=phantom');
  await onPage(page, 'MainMenu', 'title');

  // Opening Settings from the title: the title stays as a still copy for a moment, then it is gone.
  await spy(page);
  await open(page, { from: 'MainMenu', page: 'display' });
  await expect(pview(page, 'Settings', 'set-look')).toBeVisible();
  await expect.poll(() => seen(page), { timeout: 5000 }).toBe(1);
  await expect.poll(() => ghosts(page), { timeout: 5000 }).toBe(0);
  await onPage(page, 'Settings', 'set-look');

  // Look has a row for it, the last before Back; left and right on the row set the motion without opening the page.
  await step(page, 'ArrowUp');
  await step(page, 'ArrowUp');
  const row = pview(page, 'Settings', 'set-look').locator('.sr.on');
  await expect(row).toContainText('Page changes');
  await expect(row).toContainText('Full');
  await step(page, 'ArrowRight');
  await expect(row).toContainText('Reduced');
  expect(await settings(page)).toEqual({ menu: true, all: false, strength: 'reduced' });
  await step(page, 'ArrowLeft');
  await expect(row).toContainText('Full');
  expect(await settings(page)).toEqual({ menu: true, all: false, strength: 'normal' });

  await step(page, 'Enter');
  await onPage(page, 'Settings', 'reel');
  const reel = pview(page, 'Settings', 'reel');
  await expect(reel.locator('.rr-c')).toHaveCount(6);
  await expect(reel.locator('.rr-c .tl1')).toHaveText(['Slash', 'Flare', 'Drop', 'Turn', 'Sweep', 'Carry']);
  await expect(reel.locator('.rr-c.lt .tl1')).toHaveText('Slash');
  await expect(reel.locator('.rr-m span.on')).toHaveText('Full');
  expect(await fitProblems(page, 'Settings', 'reel')).toEqual([]);

  // Up and down pick a card (they wrap); Enter plays it on this page: a still copy leaves while the page comes back.
  await step(page, 'ArrowDown');
  await step(page, 'ArrowDown');
  await expect(reel.locator('.rr-c.lt .tl1')).toHaveText('Drop');
  await step(page, 'ArrowUp');
  await step(page, 'ArrowUp');
  await step(page, 'ArrowUp');
  await expect(reel.locator('.rr-c.lt .tl1')).toHaveText('Carry');
  await step(page, 'ArrowDown');
  await expect(reel.locator('.rr-c.lt .tl1')).toHaveText('Slash');
  const had = await seen(page);
  await page.keyboard.press('Enter');
  await expect.poll(() => seen(page), { timeout: 5000 }).toBe(had + 1);
  await expect.poll(() => ghosts(page), { timeout: 5000 }).toBe(0);
  await expect(reel.locator('.rr-c.lt .tl1')).toHaveText('Slash');

  // A click on a card lights and plays it; the motion chips set the motion.
  await reel.locator('.rr-c').nth(3).click();
  await expect(reel.locator('.rr-c.lt .tl1')).toHaveText('Turn');
  await expect.poll(() => seen(page), { timeout: 5000 }).toBe(had + 2);
  await expect.poll(() => ghosts(page), { timeout: 5000 }).toBe(0);
  await step(page, 'ArrowRight');
  await expect(reel.locator('.rr-m span.on')).toHaveText('Reduced · fades only');
  await expect(reel.locator('.ph-rr-say')).toHaveText('Pages fade in and out; nothing slides.');
  expect(await settings(page)).toEqual({ menu: true, all: false, strength: 'reduced' });
  await page.keyboard.press('Enter');
  await expect.poll(() => seen(page), { timeout: 5000 }).toBe(had + 3);
  await expect.poll(() => ghosts(page), { timeout: 5000 }).toBe(0);

  // Off: nothing plays, and the page says why. Menu motion is off; the other animation settings are as they were.
  await reel.locator('.rr-m span').nth(2).click();
  await expect(reel.locator('.rr-m span.on')).toHaveText('Off · instant');
  expect(await settings(page)).toEqual({ menu: false, all: false, strength: 'reduced' });
  await expect(page.locator('#phx .phs[data-scene="Settings"]')).toHaveAttribute('data-calm', '');
  const off = await seen(page);
  await page.keyboard.press('Enter');
  await expect(reel.locator('.ph-rr-say')).toContainText('Motion is off');
  expect(await seen(page)).toBe(off);
  expect(await fitProblems(page, 'Settings', 'reel')).toEqual([]);

  // With motion off a page change leaves no copy behind; Esc goes back to Look, on the row.
  await page.keyboard.press('Escape');
  await onPage(page, 'Settings', 'set-look');
  expect(await seen(page)).toBe(off);
  await expect(row).toContainText('Page changes');
  // (On the row, Off reads "Instant": a plain "Off" there would draw as an on/off switch.)
  await expect(row).toContainText('Instant');

  // Full again from the row (right wraps round), and the setting is kept.
  await step(page, 'ArrowRight');
  await expect(row).toContainText('Full');
  expect(await settings(page)).toEqual({ menu: true, all: false, strength: 'normal' });
  await expect(page.locator('#phx .phs[data-scene="Settings"]')).not.toHaveAttribute('data-calm', '');
  expect(errors).toEqual([]);
});

test('Phantom UI: a page takes input while its page change still plays, and a closed page leaves nothing behind', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await start(page, 'ui=phantom');
  await onPage(page, 'MainMenu', 'title');
  await open(page, { from: 'MainMenu' });
  await expect(pview(page, 'Settings', 'set')).toBeVisible();
  // Straight away, with the title's copy still on screen: a tile opens its page.
  await pview(page, 'Settings', 'set').locator('.c8').nth(2).click();
  await expect(pview(page, 'Settings', 'set-look')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(pview(page, 'Settings', 'set')).toBeVisible();
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await onPage(page, 'MainMenu', 'title');
  await expect.poll(() => ghosts(page), { timeout: 5000 }).toBe(0);
  // Only the title is on the Phantom layer now.
  await expect(page.locator('#phx > .phs')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('Phantom UI: Every page lists the look’s pages in their groups, says where each is found, and opens the ones Settings has', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=phantom');
  await onPage(page, 'MainMenu', 'title');
  await open(page, { from: 'MainMenu' });
  await onPage(page, 'Settings', 'set');
  const home = pview(page, 'Settings', 'set');
  await home.locator('.ph-more .key', { hasText: 'Every page' }).click();
  await onPage(page, 'Settings', 'index');
  const index = pview(page, 'Settings', 'index');
  const lit = index.locator('.ix-g span.on');
  const say = index.locator('.ph-ix-say');
  await expect(index.locator('.hd small')).toHaveText('84 PAGES · 10 GROUPS');
  await expect(index.locator('.ix-g')).toHaveCount(10);
  await expect(index.locator('.ix-g span')).toHaveCount(84);
  await expect(lit).toHaveText('Title');
  await expect(say).toContainText('The first screen when the game opens.');
  expect(await fitProblems(page, 'Settings', 'index')).toEqual([]);
  // Nothing runs under the keys: the last line of the tallest column ends above them.
  const low = await index.locator('.ix-g span').evaluateAll((all) => Math.max(...all.map((n) => n.getBoundingClientRect().bottom)));
  const keysTop = await index.locator('.keys').evaluate((n) => n.getBoundingClientRect().top);
  const sayTop = await say.evaluate((n) => n.getBoundingClientRect().top);
  expect(low).toBeLessThan(Math.min(keysTop, sayTop));

  // Down goes page by page, right and left group by group (they wrap round).
  await step(page, 'ArrowDown');
  await expect(lit).toHaveText('Main menu');
  await step(page, 'ArrowRight');
  await expect(lit).toHaveText('Command');
  await expect(say).toContainText('Every fight, on your turn.');
  // A page Settings cannot open: Enter does nothing, and there is no Open key.
  await expect(index.locator('.keys')).not.toContainText('Open');
  await step(page, 'Enter');
  await expect(lit).toHaveText('Command');
  await step(page, 'ArrowLeft');
  await expect(lit).toHaveText('Title');
  await step(page, 'ArrowLeft');
  await expect(lit).toHaveText('Hall of Fame');
  await step(page, 'ArrowUp');
  await expect(lit).toHaveText('Dominion · morning paper');
  await expect(say).toContainText('Comes with the Evil Mode update.');

  // A Settings page opens from here, and Esc comes back to the same entry.
  const entry = index.locator('.ix-g span', { hasText: 'Page changes' });
  await entry.hover();
  await expect(lit).toHaveText('Page changes');
  await expect(index.locator('.keys')).toContainText('Open');
  await page.waitForTimeout(250);
  await entry.click();
  await onPage(page, 'Settings', 'reel');
  await step(page, 'Escape');
  await onPage(page, 'Settings', 'index');
  await expect(lit).toHaveText('Page changes');
  await index.locator('.ix-g span', { hasText: 'Sound' }).hover();
  await expect(lit).toHaveText('Sound');
  await step(page, 'Enter');
  await onPage(page, 'Settings', 'set-look');
  await expect(pview(page, 'Settings', 'set-look').locator('.hd').first()).toContainText('Sound');
  await step(page, 'Escape');
  await onPage(page, 'Settings', 'index');
  await expect(lit).toHaveText('Sound');

  // Esc goes back to Settings, on the Every page key.
  await step(page, 'Escape');
  await onPage(page, 'Settings', 'set');
  await expect(home.locator('.ph-more .key.on')).toHaveText('Every page');
  expect(await fitProblems(page, 'Settings', 'set')).toEqual([]);

  // Every version draws it without cut text.
  for (const v of ['midnight', 'channel', 'fantasia', 'velvet']) {
    await page.evaluate((v) => { const pkr = (window as any).__pkr; pkr.session.saveSettings({ ...pkr.session.settings, phantomVersion: v }); pkr.game.scene.getScene('Settings').scene.restart({ from: 'MainMenu', page: 'index', focus: 40 }); }, v);
    await onPage(page, 'Settings', 'index');
    await expect(page.locator('#phx .phs[data-scene="Settings"]')).toHaveAttribute('data-liv', v);
    expect(await fitProblems(page, 'Settings', 'index'), v).toEqual([]);
    await page.evaluate(() => { (window as any).__pkr.game.scene.getScene('Settings').scene.restart({ from: 'MainMenu', page: 'reel' }); });
    await onPage(page, 'Settings', 'reel');
    expect(await fitProblems(page, 'Settings', 'reel'), v).toEqual([]);
  }
  expect(errors).toEqual([]);
});
