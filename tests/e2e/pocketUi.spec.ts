import { expect, test, type Page } from '@playwright/test';
import { start, waitForScene, watch } from './helpers/newUi';
import { onPkPage, pkFitProblems, pkView, toPocketMap } from './helpers/pocketUi';

// The Pocket look (the Pokémon-style UI redesign, built from the mock-ups in plans/ui-redesign), part 1: the Title,
// Settings, Save Slots, the shared pages and the Pause menu (the Rotom Phone). Nothing here may change a run.

const step = async (page: Page, key: string, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(key); await page.waitForTimeout(200); } };
const runNow = (page: Page) => page.evaluate(() => JSON.stringify((window as any).__pkr.session.run));
const SIZES = [{ width: 960, height: 540 }, { width: 1366, height: 768 }, { width: 820, height: 620 }] as const;

/** No text cut off or off the stage, at three window sizes. */
async function fits(page: Page, key: string, id: string) {
  for (const size of SIZES) {
    await page.setViewportSize(size);
    await page.waitForTimeout(250);
    expect(await pkFitProblems(page, key, id), `${id} at ${size.width}x${size.height}`).toEqual([]);
  }
  await page.setViewportSize(SIZES[0]);
  await page.waitForTimeout(150);
}

test('Pocket look: Title, Settings and Save Slots are drawn as the mock-ups, and Settings still change settings', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-menus');
  await onPkPage(page, 'MainMenu', 'title');
  await expect(pkView(page, 'MainMenu').locator('.logo17')).toBeVisible();
  await fits(page, 'MainMenu', 'title');

  // Settings home: nine tiles, three across; the arrows move the way the tiles lie.
  await pkView(page, 'MainMenu').locator('.tm', { hasText: 'Settings' }).click();
  await waitForScene(page, 'Settings');
  await onPkPage(page, 'Settings', 'settings');
  const home = pkView(page, 'Settings', 'settings');
  await expect(home.locator('.tile.sc')).toHaveCount(9);
  await expect(home.locator('.tile.sc.on b')).toHaveText('Display');
  await step(page, 'ArrowDown');
  await expect(home.locator('.tile.sc.on b')).toHaveText('Animations & Effects');
  await step(page, 'ArrowRight');
  await expect(home.locator('.tile.sc.on b')).toHaveText('Text & Dialogue');
  await fits(page, 'Settings', 'settings');
  // The fit check itself: a name far too long for its tile is reported (then the page is drawn again).
  await page.evaluate(() => { document.querySelector('#pkx .pks[data-scr="settings"] .tile.sc b')!.textContent = 'W'.repeat(90); });
  expect((await pkFitProblems(page, 'Settings', 'settings')).length).toBeGreaterThan(0);
  await page.evaluate(() => { document.querySelector('#pkx .pks[data-scr="settings"] .tile.sc b')!.textContent = 'Display'; });
  await step(page, 'ArrowLeft');
  await step(page, 'ArrowUp');

  // A category: the rows with their controls, and the preview on Display. Right changes the lit setting.
  await step(page, 'Enter');
  await onPkPage(page, 'Settings', 'opts');
  const opts = pkView(page, 'Settings', 'opts');
  await expect(opts.locator('.srow.on b').first()).toHaveText('UI style');
  await expect(opts.locator('.preview .pv-scr')).toBeVisible();
  await expect(opts.locator('.srow.on .seg .on')).toHaveText('New');
  await step(page, 'ArrowRight');
  await expect(opts.locator('.srow.on .seg .on')).toHaveText('Pocket');
  expect(await page.evaluate(() => (window as any).__pkr.session.settings.uiStyle)).toBe('pocket');
  await fits(page, 'Settings', 'opts');
  // A click on a category opens it; a list without the preview is wide.
  await opts.locator('.set-cats .btn', { hasText: 'Audio' }).click();
  await expect(opts.locator('.hdr-t')).toHaveText('Settings · Audio');
  await expect(opts.locator('.srow .sld').first()).toBeVisible();
  await expect(opts.locator('.srow .tog').first()).toBeVisible();
  await fits(page, 'Settings', 'opts');
  await step(page, 'Escape');
  await onPkPage(page, 'Settings', 'settings');

  // The Reset question is Rotom's box over the page; No keeps everything.
  await home.locator('.gx-more .btn', { hasText: 'Reset to defaults' }).click();
  await expect(home.locator('.cf-box')).toBeVisible();
  await fits(page, 'Settings', 'settings');
  await home.locator('.cf-box .btn', { hasText: 'No, keep my settings' }).click();
  await expect(home.locator('.cf-box')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__pkr.session.settings.uiStyle)).toBe('pocket');

  // Game Summary is a shared menu page.
  await home.locator('.gx-more .btn', { hasText: 'Game Summary' }).click();
  await onPkPage(page, 'Settings', 'list');
  await fits(page, 'Settings', 'list');
  await step(page, 'Escape');
  await onPkPage(page, 'Settings', 'settings');
  await step(page, 'Escape');
  await waitForScene(page, 'MainMenu');
  await onPkPage(page, 'MainMenu', 'title');

  // Save Slots: three cards; erasing asks first, and Keep it keeps the slot.
  await pkView(page, 'MainMenu').locator('.tm', { hasText: 'Save Slots' }).click();
  await waitForScene(page, 'SaveSlots');
  await onPkPage(page, 'SaveSlots', 'saves');
  await expect(pkView(page, 'SaveSlots').locator('.slot')).toHaveCount(3);
  await fits(page, 'SaveSlots', 'saves');
  expect(errors).toEqual([]);
});

test('Pocket look: the Pause menu is the Rotom Phone; it changes nothing and its apps open the map\'s own menus', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-phone');
  await onPkPage(page, 'MainMenu', 'title');
  await toPocketMap(page);
  const before = await runNow(page);

  await step(page, 'Escape');
  await onPkPage(page, 'Map', 'menu');
  const phone = pkView(page, 'Map', 'menu');
  await expect(phone.locator('.rapp')).toHaveCount(8);
  await expect(phone.locator('.rapp.on span')).toHaveText('Party');
  await expect(phone.locator('.rp-hand .pkm')).toHaveCount(await page.evaluate(() => (window as any).__pkr.session.run.party.length));
  await fits(page, 'Map', 'menu');
  // The apps lie four across: down moves a line, right one app.
  await step(page, 'ArrowDown');
  await expect(phone.locator('.rapp.on span')).toHaveText('Rivals');
  await step(page, 'ArrowRight');
  await expect(phone.locator('.rapp.on span')).toHaveText('Save');
  // A switched-off app says why, in Rotom's line, and does not open.
  await step(page, 'ArrowRight', 2);
  await expect(phone.locator('.rapp.on span')).toHaveText('End run');
  if (await phone.locator('.rapp.on.gx-off').count()) {
    await expect(phone.locator('.rp-ask p')).toContainText('Only an Adventure run');
    await step(page, 'Enter');
    await expect(phone).toBeVisible();
  }
  expect(await runNow(page)).toBe(before);

  // Esc resumes: the map is back, and the phone is gone.
  await step(page, 'Escape');
  await expect(phone).toHaveCount(0);
  await expect(pkView(page, 'Map', 'map')).toBeVisible();

  // Party opens the map's own Party menu, on top of the map.
  await step(page, 'Escape');
  await onPkPage(page, 'Map', 'menu');
  await phone.locator('.rapp', { hasText: 'Party' }).click();
  await expect(phone).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => { const up = [...document.querySelectorAll<HTMLElement>('#rx .stage[data-scene="Map"], #pkx .pks[data-scene="Map"]')].filter((e) => e.style.display !== 'none' && e.dataset.ghost === undefined); return up[up.length - 1]?.textContent?.includes('Party') ?? false; }), { timeout: 8000 }).toBe(true);
  await step(page, 'Escape');
  await page.waitForTimeout(500);

  // Settings opens from the phone and comes back to the map.
  await step(page, 'Escape');
  await onPkPage(page, 'Map', 'menu');
  await phone.locator('.rapp', { hasText: 'Settings' }).click();
  await waitForScene(page, 'Settings');
  await onPkPage(page, 'Settings', 'settings');
  await expect(pkView(page, 'Settings').locator('.crumb')).toContainText('Menu');
  await step(page, 'Escape');
  await waitForScene(page, 'Map');
  expect(await runNow(page)).toBe(before);
  expect(errors).toEqual([]);
});

test('Pocket look: an event reads as the mock-ups (talk, choice cards, result, rewards) and plays the same', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-event');
  await toPocketMap(page);
  await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push({ id: 'pk-ev', kind: 'event', used: false, eventId: 'an09-rusted-anchor' });
    run.stage.current = node.id;
    if (!run.stage.visited.includes(node.id)) run.stage.visited.push(node.id);
    (window as any).__pkr.game.scene.getScene('Map').scene.start('Event', { sideId: 'pk-ev' });
  });
  await waitForScene(page, 'Event');
  await onPkPage(page, 'Event', 'event');
  const talk = pkView(page, 'Event', 'event');
  await expect(talk.locator('.beats .on')).toHaveText('1 Talk');
  await expect(talk.locator('[data-key="ev-tb"]')).toBeVisible();
  await fits(page, 'Event', 'event');

  // Every page of the talk waits for Enter; the last one brings the choice cards up over the text bar.
  for (let n = 0; n < 8 && !(await pkView(page, 'Event', 'ev-choice').count()); n++) await step(page, 'Enter', 1), await page.waitForTimeout(500);
  await onPkPage(page, 'Event', 'ev-choice');
  const choice = pkView(page, 'Event', 'ev-choice');
  await expect(choice.locator('.chc')).toHaveCount(3);
  await expect(choice.locator('.chc.on')).toHaveCount(1);
  await expect(choice.locator('.beats .on')).toHaveText('2 Choose');
  await fits(page, 'Event', 'ev-choice');
  await step(page, 'ArrowRight');
  await expect(choice.locator('[data-key="ev-ch-1"]')).toHaveClass(/\bon\b/);
  await step(page, 'ArrowLeft');

  // Choosing: the outcome's text first, and what changed only after it.
  await choice.locator('[data-key="ev-ch-0"]').click();
  await onPkPage(page, 'Event', 'ev-result');
  await expect(pkView(page, 'Event', 'ev-result').locator('.erc')).toHaveCount(0);
  await fits(page, 'Event', 'ev-result');
  for (let n = 0; n < 8 && !(await pkView(page, 'Event', 'ev-reward').count()); n++) await step(page, 'Enter', 1), await page.waitForTimeout(500);
  await onPkPage(page, 'Event', 'ev-reward');
  const reward = pkView(page, 'Event', 'ev-reward');
  await expect(reward.locator('.erc').first()).toBeVisible();
  await fits(page, 'Event', 'ev-reward');
  // The rewards stay until Enter.
  await page.waitForTimeout(1500);
  await expect(reward).toBeVisible();
  await step(page, 'Enter');
  await waitForScene(page, 'Map');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.stage.map.nodes.flatMap((n: any) => n.sides).find((s: any) => s.id === 'pk-ev')?.used)).toBe(true);
  expect(errors).toEqual([]);
});

test('Pocket look: the stage map is the small Town Map board; the cursor, the legend and a stop all work as before', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-map');
  await toPocketMap(page);
  await onPkPage(page, 'Map', 'map');
  const map = pkView(page, 'Map', 'map');
  await expect(map.locator('.map-board[data-key="map"]')).toBeVisible();
  await expect(map.locator('.map-tick')).toHaveCount(8);
  await expect(map.locator('.node.next').first()).toBeVisible();
  await expect(map.locator('.hdr-t')).toContainText(/Stage 1 of \d+/);
  // The board is the region's Town Map, not a flat colour.
  expect(await map.locator('.map-board').evaluate((b) => getComputedStyle(b).backgroundImage)).toMatch(/townmap\/region1\.png/);
  await fits(page, 'Map', 'map');
  const before = await runNow(page);

  // The arrows move the lit stop; the legend opens and closes; nothing in the run changes.
  const lit = () => map.locator('.node.gx-lit').getAttribute('data-key');
  const first = await lit();
  await step(page, 'ArrowDown');
  await step(page, 'l');
  await expect(map.locator('[data-key="map-legend"]')).toBeVisible();
  await fits(page, 'Map', 'map');
  await step(page, 'l');
  await expect(map.locator('[data-key="map-legend"]')).toHaveCount(0);
  expect(await runNow(page)).toBe(before);
  expect(first).not.toBeNull();

  // Clicking a stop to go to travels there, as the map always has.
  await map.locator('.node.next[data-act="pick"]').first().click();
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.activeScene()), { timeout: 20_000 }).not.toBe('Map');
  expect(errors).toEqual([]);
});

test('Pocket look: the Poké Mart is two shelves and a counter; a basket checks out on a receipt and pays the same', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-shop');
  await toPocketMap(page);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr, run = pkr.session.run;
    run.money = 4820;
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push({ id: 'pk-shop', kind: 'shop', used: false });
    run.stage.current = node.id;
    if (!run.stage.visited.includes(node.id)) run.stage.visited.push(node.id);
    pkr.session.visitSide('pk-shop');
    pkr.session.run.shop.type = 'depot';
    pkr.game.scene.getScene('Map').scene.start('Shop', { type: 'depot' });
  });
  await waitForScene(page, 'Shop');
  await onPkPage(page, 'Shop', 'shop');
  const shop = pkView(page, 'Shop', 'shop');
  await expect(shop.locator('.si').first()).toBeVisible();
  expect(await shop.locator('.si').count()).toBeLessThanOrEqual(8);
  await expect(shop.locator('[data-key="shop-keeper"]')).toBeVisible();
  await expect(shop.locator('.basket')).toContainText('Nothing yet');
  await fits(page, 'Shop', 'shop');

  // Enter puts the lit good in the basket; C asks to check out on the receipt page.
  await step(page, 'Enter', 2);
  await expect(shop.locator('.basket')).not.toContainText('Nothing yet');
  const money = await page.evaluate(() => (window as any).__pkr.session.run.money);
  await step(page, 'c');
  await onPkPage(page, 'Shop', 'shop-pay');
  const pay = pkView(page, 'Shop', 'shop-pay');
  await expect(pay.locator('.receipt')).toContainText('Total');
  await expect(pay.locator('.pay-btns .btn')).toHaveCount(2);
  await fits(page, 'Shop', 'shop-pay');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.money)).toBe(money);

  // Pay rings it up as before: the money goes down and the shop floor comes back.
  await step(page, 'Enter');
  await onPkPage(page, 'Shop', 'shop');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.session.run.money)).toBeLessThan(money);
  expect(errors).toEqual([]);
});
