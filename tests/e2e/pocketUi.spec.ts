import { expect, test, type Page } from '@playwright/test';
import { start, toCommands, waitForScene, watch } from './helpers/newUi';
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
  // The mock-up's eight apps on the first screen, four across: down moves a line, right one app.
  await expect(phone.locator('.rapp span')).toHaveText(['Party', 'Bag', 'Pokédex', 'Trainer Card', 'Journal', 'Type Chart', 'Save', 'Settings']);
  await step(page, 'ArrowDown');
  await expect(phone.locator('.rapp.on span')).toHaveText('Journal');
  await step(page, 'ArrowRight');
  await expect(phone.locator('.rapp.on span')).toHaveText('Type Chart');
  // The map's other actions are on the phone's second screen.
  await step(page, 'ArrowDown');
  await expect(phone.locator('.rapp.on span')).toHaveText('Rivals');
  await expect(phone.locator('.rapp')).toHaveCount(3);
  await expect(phone.locator('.gx-rp-dots u.on')).toHaveCount(1);
  // A switched-off app says why, in Rotom's line, and does not open.
  await step(page, 'ArrowRight');
  await expect(phone.locator('.rapp.on span')).toHaveText('End run');
  if (await phone.locator('.rapp.on.gx-off').count()) {
    await expect(phone.locator('.rp-ask p')).toContainText('Only an Adventure run');
    await step(page, 'Enter');
    await expect(phone).toBeVisible();
  }
  expect(await runNow(page)).toBe(before);

  // Pokédex, Type Chart and Trainer Card open over the phone, and Esc comes back to it.
  await phone.locator('.gx-rp-dots u').first().click();
  await expect(phone.locator('.rapp.on span')).toHaveText('Party');
  await phone.locator('.rapp', { hasText: 'Pokédex' }).click();
  await onPkPage(page, 'Map', 'dex');
  await expect(pkView(page, 'Map', 'dex').locator('.dx-tabs span')).toHaveCount(4);
  await fits(page, 'Map', 'dex');
  await step(page, 'Enter');
  await onPkPage(page, 'Map', 'dex-entry');
  await step(page, 'Escape');
  await onPkPage(page, 'Map', 'dex');
  await step(page, 'Escape');
  await onPkPage(page, 'Map', 'menu');
  await phone.locator('.rapp', { hasText: 'Type Chart' }).click();
  await onPkPage(page, 'Map', 'types');
  const chart = pkView(page, 'Map', 'types');
  await expect(chart.locator('.tc')).toHaveCount(18);
  const lit = await chart.locator('.tc.on').getAttribute('data-key');
  await step(page, 'ArrowRight');
  expect(await chart.locator('.tc.on').getAttribute('data-key')).not.toBe(lit);
  await expect(chart.locator('.tc-row').first()).toContainText('Hits hard');
  await fits(page, 'Map', 'types');
  await step(page, 'Escape');
  await onPkPage(page, 'Map', 'menu');
  await phone.locator('.rapp', { hasText: 'Trainer Card' }).click();
  await onPkPage(page, 'Map', 'tcard');
  await expect(pkView(page, 'Map', 'tcard').locator('.tk-side')).toContainText('This run');
  await fits(page, 'Map', 'tcard');
  await step(page, 'Escape');
  await onPkPage(page, 'Map', 'menu');
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

test('Pocket look: Pick a Reward deals the cards as the mock-up and takes one the same way', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-reward');
  await toPocketMap(page);
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    session.run.phase = 'reward';
    session.run.draft = ['protein', 'nugget', 'potion', 'ether', 'revive'];
    game.scene.getScene('Map').scene.start('Reward');
  });
  await waitForScene(page, 'Reward');
  await onPkPage(page, 'Reward', 'reward');
  const reward = pkView(page, 'Reward', 'reward');
  await expect(reward.locator('.rw')).toHaveCount(5);
  await expect(reward.locator('.rw').nth(0)).toHaveClass(/\bon\b/);
  await expect(reward.locator('.rw-rar').first()).toContainText(/Common|Uncommon|Rare/);
  await fits(page, 'Reward', 'reward');
  await step(page, 'ArrowRight');
  await expect(reward.locator('.rw').nth(1)).toHaveClass(/\bon\b/);
  await expect(reward.locator('[data-key="rw-tb"]')).toContainText('Take the Nugget?');

  // Taking the Nugget pays as before; the result waits in the bar until Enter.
  const money = await page.evaluate(() => (window as any).__pkr.session.run.money);
  await reward.locator('[data-key="rw-1"]').click();
  await expect(reward.locator('.gx-rw-done')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__pkr.session.run.money)).toBeGreaterThan(money);
  await fits(page, 'Reward', 'reward');
  await page.waitForTimeout(1200);
  await expect(reward.locator('.gx-rw-done')).toBeVisible();
  await step(page, 'Enter');
  await waitForScene(page, 'Map');
  expect(errors).toEqual([]);
});

test('Pocket look: a healing stop is the Pokémon Center; the party is healed once and the map comes back on Enter', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-center');
  await toPocketMap(page);
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr, run = session.run;
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push({ id: 'pk-heal', kind: 'heal', used: false });
    run.stage.current = node.id;
    if (!run.stage.visited.includes(node.id)) run.stage.visited.push(node.id);
    run.party.forEach((m: any) => { m.hp = 1; });
    game.scene.getScene('Map').scene.restart();
  });
  await onPkPage(page, 'Map', 'map');
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const map = (window as any).__pkr.game.scene.getScene('Map');
    map.activate(map.options.findIndex((o: any) => o.kind === 'side' && o.side.id === 'pk-heal'));
  });
  await onPkPage(page, 'Map', 'center');
  const center = pkView(page, 'Map', 'center');
  await expect(center.locator('.tb-w')).toHaveText('Nurse Joy');
  await expect(center.locator('.pc-r')).toHaveCount(await page.evaluate(() => (window as any).__pkr.session.run.party.length));
  await expect(center.locator('.pc-r em').first()).toContainText(/\+\d+ HP/);
  await fits(page, 'Map', 'center');
  // The heal is done already; the page waits for Enter.
  expect(await page.evaluate(() => (window as any).__pkr.session.run.party.every((m: any) => m.hp > 1))).toBe(true);
  await page.waitForTimeout(1500);
  await expect(center).toBeVisible();
  await step(page, 'Enter');
  await onPkPage(page, 'Map', 'map');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.stage.map.nodes.flatMap((n: any) => n.sides).find((s: any) => s.id === 'pk-heal')?.used)).toBe(true);
  expect(errors).toEqual([]);
});

test('Pocket look: Party is a hand of cards and Summary has every tab; neither changes the run', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-party');
  await toPocketMap(page);
  await page.waitForTimeout(800);
  const before = await runNow(page);
  await page.evaluate(() => {
    const map = (window as any).__pkr.game.scene.getScene('Map');
    map.activate(map.options.findIndex((o: any) => o.kind === 'party'));
  });
  await onPkPage(page, 'Map', 'party');
  const party = pkView(page, 'Map', 'party');
  await expect(party.locator('.pkc')).toHaveCount(await page.evaluate(() => (window as any).__pkr.session.run.party.length));
  await expect(party.locator('.pkc.on')).toHaveCount(1);
  await expect(party.locator('.kc-lead')).toHaveCount(1);
  await fits(page, 'Map', 'party');

  await step(page, 'Enter');
  await onPkPage(page, 'Map', 'summary');
  const sum = pkView(page, 'Map', 'summary');
  const tabs = await sum.locator('.t12 .tab').count();
  expect(tabs).toBeGreaterThanOrEqual(5);
  for (let t = 0; t < tabs; t++) {
    await expect(sum.locator('.t12 .tab').nth(t)).toHaveClass(/\bon\b/);
    await fits(page, 'Map', 'summary');
    await step(page, 'ArrowRight');
  }
  await step(page, 'Escape', 2);
  expect(await runNow(page)).toBe(before);
  expect(errors).toEqual([]);
});

test('Pocket look: the Bag is pockets, a grid of items and the item\'s card; looking changes nothing', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-bag');
  await toPocketMap(page);
  await page.evaluate(() => { Object.assign((window as any).__pkr.session.run.inventory, { potion: 5, revive: 2, 'great-ball': 4 }); });
  await page.waitForTimeout(800);
  const before = await runNow(page);
  await page.evaluate(() => {
    const map = (window as any).__pkr.game.scene.getScene('Map');
    map.activate(map.options.findIndex((o: any) => o.kind === 'bag'));
  });
  await onPkPage(page, 'Map', 'bag');
  const bag = pkView(page, 'Map', 'bag');
  await expect(bag.locator('.pocket.on')).toHaveCount(1);
  await expect(bag.locator('.it12.on')).toHaveCount(1);
  await expect(bag.locator('.bg12-d b').first()).not.toBeEmpty();
  await fits(page, 'Map', 'bag');
  const first = await bag.locator('.it12.on').getAttribute('data-key');
  await step(page, 'ArrowDown');
  expect(await bag.locator('.it12.on').getAttribute('data-key')).not.toBe(first);
  await step(page, 'Escape');
  expect(await runNow(page)).toBe(before);
  expect(errors).toEqual([]);
});

test('Pocket look: the Pokédex is a wall of squares and each entry has a species page and a data page; looking changes nothing', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-dex');
  await onPkPage(page, 'MainMenu', 'title');
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    session.profile.speciesSeen.push('charmander', 'charizard', 'bulbasaur');
    session.profile.speciesCaught.push('charizard');
    for (const s of game.scene.getScenes(true)) game.scene.stop(s.scene.key);
    game.scene.start('Hub');
  });
  await waitForScene(page, 'Hub');
  await page.waitForTimeout(1500);
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Hub').openDexSet({ id: 'k', name: 'Generation 1 Pokédex', members: ['bulbasaur', 'ivysaur', 'charmander', 'charmeleon', 'charizard', 'squirtle'] }));
  await onPkPage(page, 'Hub', 'dex');
  const before = await page.evaluate(() => JSON.stringify((window as any).__pkr.session.profile));
  const wall = pkView(page, 'Hub', 'dex');
  await expect(wall.locator('.dx')).toHaveCount(6);
  await expect(wall.locator('.dx.got')).toHaveCount(1);
  await expect(wall.locator('.dx.unk')).toHaveCount(3);
  await expect(wall.locator('.dx.on')).toHaveCount(1);
  await fits(page, 'Hub', 'dex');
  await step(page, 'ArrowRight', 4);
  await expect(wall.locator('.dx.on')).toHaveAttribute('data-key', 'dex-c-4');
  await expect(wall.locator('.dx-info')).toContainText('Charizard');
  await step(page, 'Enter');
  await onPkPage(page, 'Hub', 'dex-entry');
  const entry = pkView(page, 'Hub', 'dex-entry');
  await expect(entry.locator('[data-key="dex-stats"]')).toBeVisible();
  await fits(page, 'Hub', 'dex-entry');
  await step(page, 'ArrowRight');
  await expect(entry.locator('[data-key="dex-moves"]')).toBeVisible();
  await fits(page, 'Hub', 'dex-entry');
  expect(await page.evaluate(() => JSON.stringify((window as any).__pkr.session.profile))).toBe(before);
  expect(errors).toEqual([]);
});

test('Pocket look: the Trainer Card shows the ID, the record and the badges won', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-card');
  await onPkPage(page, 'MainMenu', 'title');
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    session.profile.best.badges = 3;
    for (const s of game.scene.getScenes(true)) game.scene.stop(s.scene.key);
    game.scene.start('Hub');
  });
  await waitForScene(page, 'Hub');
  await page.waitForTimeout(1500);
  const before = await page.evaluate(() => JSON.stringify((window as any).__pkr.session.profile));
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Hub').openCard());
  await onPkPage(page, 'Hub', 'tcard');
  const card = pkView(page, 'Hub', 'tcard');
  await expect(card.locator('.tk-top')).toContainText(/ID No\. \d{5}/);
  await expect(card.locator('.tk-badges .got')).toHaveCount(3);
  await expect(card.locator('.tk-side')).toContainText('Battles won', { ignoreCase: true });
  await fits(page, 'Hub', 'tcard');
  expect(await page.evaluate(() => JSON.stringify((window as any).__pkr.session.profile))).toBe(before);
  expect(errors).toEqual([]);
});

test('Pocket look: the Story Journal is a numbered list with the lit entry read out; looking changes nothing', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-journal');
  await toPocketMap(page);
  const before = await runNow(page);
  await page.evaluate(() => {
    const map = (window as any).__pkr.game.scene.getScene('Map');
    map.activate(map.options.findIndex((o: any) => o.kind === 'story'));
  });
  await onPkPage(page, 'Map', 'journal');
  const jr = pkView(page, 'Map', 'journal');
  await expect(jr.locator('.jr.on')).toHaveCount(1);
  await expect(jr.locator('.jr-page > b')).not.toBeEmpty();
  await fits(page, 'Map', 'journal');
  if (await jr.locator('.jr').count() > 1) {
    const first = await jr.locator('.jr.on').getAttribute('data-key');
    await step(page, 'ArrowDown');
    expect(await jr.locator('.jr.on').getAttribute('data-key')).not.toBe(first);
  }
  await step(page, 'Escape');
  expect(await runNow(page)).toBe(before);
  expect(errors).toEqual([]);
});

test('Pocket look: a battle is the mock-up HUD; Party and Bag open as pills and tiles, and looking changes nothing', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-bt2');
  await toPocketMap(page);
  await page.evaluate(() => { Object.assign((window as any).__pkr.session.run.inventory, { potion: 2 }); });
  await page.evaluate(() => {
    const map = (window as any).__pkr.game.scene.getScene('Map');
    map.activate(map.options.findIndex((o: any) => o.kind === 'node'));
  });
  await waitForScene(page, 'Battle');
  await onPkPage(page, 'Battle', 'battle');
  await toCommands(page);
  const hud = pkView(page, 'Battle', 'battle');
  await expect(hud.locator('.lb.top')).toHaveCount(1);
  await expect(hud.locator('.lb-me').first()).toBeVisible();
  await fits(page, 'Battle', 'battle');
  const before = await runNow(page);
  // Fight: the moves are typed cards.
  await hud.locator('[data-act="tab"]').first().click();
  await expect(hud.locator('.mv3').first()).toBeVisible();
  await step(page, 'Escape');
  // Pokémon: the party pills and the lit one's card; the HUD hides behind it.
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').tabs.press(1));
  await onPkPage(page, 'Battle', 'b-switch');
  const sw = pkView(page, 'Battle', 'b-switch');
  await expect(sw.locator('.sw.on')).toHaveCount(1);
  await expect(sw.locator('.sw-pick')).toContainText('Send out');
  await expect(hud.locator('.lb.top')).toBeHidden();
  await fits(page, 'Battle', 'b-switch');
  await step(page, 'Escape');
  // Bag: pocket tabs, the tiles and the item's card.
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').tabs.press(2));
  await onPkPage(page, 'Battle', 'b-bag');
  const bag = pkView(page, 'Battle', 'b-bag');
  await expect(bag.locator('.bb-tabs .btn.on')).toHaveCount(1);
  await expect(bag.locator('.it.on')).toHaveCount(1);
  await expect(bag.locator('.bb-use')).toContainText('Use');
  await fits(page, 'Battle', 'b-bag');
  await step(page, 'Escape');
  // I on a move: the move card; Back closes it. H: the Battle Log page; Back to battle closes it.
  await hud.locator('[data-act="tab"]').first().click();
  await step(page, 'i');
  await onPkPage(page, 'Battle', 'moveinfo');
  const mi = pkView(page, 'Battle', 'moveinfo');
  await expect(mi.locator('.mi-card b').first()).toBeVisible();
  await expect(mi.locator('[data-act="pkUse"]')).toHaveText('Use it');
  await fits(page, 'Battle', 'moveinfo');
  await mi.locator('.mi-vs [data-act="info"]').click();
  await onPkPage(page, 'Battle', 'battle');
  await step(page, 'h');
  await onPkPage(page, 'Battle', 'b-log');
  const lg = pkView(page, 'Battle', 'b-log');
  await expect(lg.locator('.gx-lg-row').first()).toBeVisible();
  await fits(page, 'Battle', 'b-log');
  await lg.locator('.lg-sum [data-act="logClose"]').click();
  await onPkPage(page, 'Battle', 'battle');
  // Battle Info (I away from the moves): both sides and the four field cards; Battle Log goes to the log.
  await page.evaluate(() => { const s = (window as any).__pkr.game.scene.getScene('Battle'); s.menu = null; s.toggleInfo(); });
  await onPkPage(page, 'Battle', 'b-info');
  const inf = pkView(page, 'Battle', 'b-info');
  await expect(inf.locator('.in-side')).toHaveCount(2);
  await expect(inf.locator('.in-c')).toHaveCount(4);
  await fits(page, 'Battle', 'b-info');
  await inf.locator('.in-foot [data-act="pkLog"]').click();
  await onPkPage(page, 'Battle', 'b-log');
  expect(await runNow(page)).toBe(before);
  expect(errors).toEqual([]);
});

test('Pocket look: a won Trainer battle shows Victory, Team EXP and Level Up; a new move is its own page', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-bt2');
  await toPocketMap(page);
  // The first stop is a wild battle on this seed: make it a Trainer's, so the Victory page shows.
  await page.evaluate(() => {
    const map = (window as any).__pkr.game.scene.getScene('Map');
    const o = map.options.find((x: any) => x.kind === 'node');
    o.node.kind = 'trainer';
    map.activate(map.options.indexOf(o));
  });
  await waitForScene(page, 'Battle');
  await onPkPage(page, 'Battle', 'battle');
  await toCommands(page);
  await page.evaluate(() => { for (const m of (window as any).__pkr.session.run.battle.enemyTeam) m.hp = 1; });
  const seen: string[] = [];
  for (let i = 0; i < 120 && !seen.includes('exp'); i++) {
    const ids = await page.evaluate(() => [...document.querySelectorAll('#pkx .pks')].filter((e) => !(e as HTMLElement).dataset.ghost).map((e) => (e as HTMLElement).dataset.scr ?? ''));
    const at = ['levelup', 'victory', 'exp'].find((x) => ids.includes(x) && !seen.includes(x));
    if (at === 'victory') {
      const v = pkView(page, 'Battle', 'victory');
      await expect(v.locator('.vic-t')).toContainText('Victory!');
      await expect(v.locator('.rosette')).toContainText('MVP');
      await expect(v.locator('.vp-foe')).toContainText('You defeated');
      await expect(v.locator('.vp-r')).toContainText(['Prize money', 'Nobody fainted', 'Turns taken', 'Biggest hit']);
      await fits(page, 'Battle', 'victory');
    } else if (at === 'exp') {
      const x = pkView(page, 'Battle', 'exp');
      await expect(x.locator('.rs-h')).toContainText('Team EXP');
      await expect(x.locator('.xc').first()).toContainText('EXP');
      await fits(page, 'Battle', 'exp');
    } else if (at === 'levelup') {
      const l = pkView(page, 'Battle', 'levelup');
      await expect(l.locator('.lr')).toHaveCount(6);
      await expect(l.locator('.lv-stamp')).toBeVisible();
      await fits(page, 'Battle', 'levelup');
    }
    if (at) seen.push(at);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  expect(seen).toEqual(['levelup', 'victory', 'exp']);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Reward', 30_000);
  // A Pokémon with four moves wants a fifth: the New Move page, the four rows and the two answers.
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const r = session.run, m = r.party[0];
    const ids = [...session.content.moves.keys()].filter((id: string) => id !== 'razor-leaf' && !m.moves.some((s: any) => s.id === id));
    while (m.moves.length < 4) m.moves.push({ id: ids[m.moves.length * 7], pp: 10 });
    r.pending = [{ kind: 'learnMove', uid: m.uid, moveId: 'razor-leaf' }];
    r.phase = 'decision';
    game.scene.getScenes(true)[0].scene.start('Decision');
  });
  await waitForScene(page, 'Decision');
  await onPkPage(page, 'Decision', 'movelearn');
  const ml = pkView(page, 'Decision', 'movelearn');
  await expect(ml.locator('.ml-new')).toContainText('Razor Leaf');
  await expect(ml.locator('.mv3')).toHaveCount(4);
  await expect(ml.locator('.vs-say .btn')).toContainText(['Keep old moves', 'Learn it']);
  await fits(page, 'Decision', 'movelearn');
  await page.keyboard.press('ArrowDown');
  await expect(ml.locator('.mv3.on')).toHaveCount(1);
  await expect(ml.locator('.ml-cmp')).toContainText('Razor Leaf');
  expect(errors).toEqual([]);
});

test('Pocket look: the Hub is the town street; the doors walk, the tabs change and a door opens its rooms', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-hub');
  await page.evaluate(() => {
    const { game } = (window as any).__pkr;
    for (const s of game.scene.getScenes(true)) game.scene.stop(s.scene.key);
    game.scene.start('Hub');
  });
  await waitForScene(page, 'Hub');
  await onPkPage(page, 'Hub', 'hub');
  const hub = pkView(page, 'Hub', 'hub');
  await expect(hub.locator('.door')).toHaveCount(6);
  await expect(hub.locator('.bld')).toHaveCount(5);
  await expect(hub.locator('.plaque')).toContainText('New Run');
  await expect(hub.locator('.walkrow .wk').first()).toBeVisible();
  await fits(page, 'Hub', 'hub');
  const before = await page.evaluate(() => JSON.stringify((window as any).__pkr.session.profile));
  const lit = () => hub.locator('.door.on b').innerText();
  const first = await lit();
  await step(page, 'ArrowRight');
  expect(await lit()).not.toBe(first);
  await step(page, 'ArrowDown');
  await expect(hub.locator('.gx-hb-tabs .on')).toHaveText('Last run');
  await expect(hub.locator('.door').first()).toContainText('Hall of Fame');
  await step(page, 'ArrowDown');
  await expect(hub.locator('.gx-hb-tabs .on')).toHaveText('Town');
  expect(await page.evaluate(() => JSON.stringify((window as any).__pkr.session.profile))).toBe(before);
  // Trainers opens its rooms; Esc comes back to the street.
  await hub.locator('.door', { hasText: 'Trainers' }).click();
  await onPkPage(page, 'Hub', 'list');
  await step(page, 'Escape');
  await onPkPage(page, 'Hub', 'hub');
  expect(errors).toEqual([]);
});

test('Pocket look: the Tools room is numbered cards a page at a time; a card opens its tool and Esc comes back', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-tools');
  await page.evaluate(() => {
    const { game } = (window as any).__pkr;
    for (const s of game.scene.getScenes(true)) game.scene.stop(s.scene.key);
    game.scene.start('Hub');
  });
  await waitForScene(page, 'Hub');
  await onPkPage(page, 'Hub', 'hub');
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Hub').enter('tools'));
  await onPkPage(page, 'Hub', 'pt-tools');
  const tools = pkView(page, 'Hub', 'pt-tools');
  await expect(tools.locator('.tz39 > .pn')).toHaveCount(8);
  await fits(page, 'Hub', 'pt-tools');
  await step(page, 'ArrowDown', 2);
  await expect(tools.locator('.pn.on')).toHaveAttribute('data-key', 'tl-8');
  await expect(tools.locator('.hdr')).toContainText('Page 2 of');
  await step(page, 'ArrowUp', 2);
  await step(page, 'ArrowRight');
  await expect(tools.locator('.pn.on')).toHaveAttribute('data-key', 'tl-1');
  await step(page, 'Escape');
  await onPkPage(page, 'Hub', 'hub');
  expect(errors).toEqual([]);
});

test('Pocket look: Pocket Town has the street header, the Town Map and a door card; nothing opens without Go in', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-town');
  await page.evaluate(() => {
    const { game } = (window as any).__pkr;
    for (const s of game.scene.getScenes(true)) game.scene.stop(s.scene.key);
    game.scene.start('Town');
  });
  await waitForScene(page, 'Town');
  await onPkPage(page, 'Town', 'pt-town');
  const hud = pkView(page, 'Town', 'pt-town');
  await expect(hud.locator('.hdr')).toContainText('Pocket Town');
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Town').town.moveTo({ x: 14, y: 12, facing: 'up' }));
  await expect(hud.locator('.zp39')).toContainText('Training Dojo');
  await fits(page, 'Town', 'pt-town');
  const before = await page.evaluate(() => JSON.stringify((window as any).__pkr.session.profile));
  // Z at the door asks first; Esc keeps walking.
  await step(page, 'Enter');
  await onPkPage(page, 'Town', 'pt-door');
  await expect(pkView(page, 'Town', 'pt-door').locator('.dc39')).toContainText('Training Dojo');
  await fits(page, 'Town', 'pt-door');
  await step(page, 'Escape');
  await expect(pkView(page, 'Town', 'pt-door')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.stringify((window as any).__pkr.session.profile))).toBe(before);
  // M opens the Town Map; Right and Enter walk to the next district.
  await step(page, 'm');
  await onPkPage(page, 'Town', 'pt-map');
  const map = pkView(page, 'Town', 'pt-map');
  await expect(map.locator('.gr39 .pn')).toHaveCount(5);
  await expect(map.locator('.gr39 .pn.on')).toContainText('You are here');
  await fits(page, 'Town', 'pt-map');
  await step(page, 'ArrowRight');
  await step(page, 'Enter');
  await expect(pkView(page, 'Town', 'pt-map')).toHaveCount(0);
  await expect(hud.locator('.hdr')).toContainText('Culture Quarter');
  expect(errors).toEqual([]);
});

test('Pocket look: the Trainer Plaza is six district cards three across; up and down move a row, Esc goes back', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=plaza-e2e');
  await toPocketMap(page);
  const sideId = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    const middle = Math.ceil(run.stage.map.columns / 2);
    const nodes = run.stage.map.nodes.filter((n: any) => n.column === middle);
    const node = nodes.find((n: any) => n.sides.some((s: any) => s.kind === 'plaza'));
    if (!node) return null;
    run.stage.current = node.id;
    (window as any).__pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
    return node.sides.find((s: any) => s.kind === 'plaza').id as string;
  });
  expect(sideId).not.toBeNull();
  await waitForScene(page, 'Map');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.evaluate((id) => (window as any).__pkr.game.scene.getScene('Map').openPlaza(id), sideId);
  await waitForScene(page, 'Plaza');
  await onPkPage(page, 'Plaza', 'pt-plaza');
  const plaza = pkView(page, 'Plaza', 'pt-plaza');
  await expect(plaza.locator('.gr39 .rw39')).toHaveCount(6);
  await expect(plaza.locator('.rw39.on')).toHaveCount(1);
  await fits(page, 'Plaza', 'pt-plaza');
  const before = await runNow(page);
  const lit = () => plaza.locator('.rw39.on').getAttribute('data-key');
  const first = await lit();
  await step(page, 'ArrowDown');
  expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Plaza').focus)).toBe(3);
  await step(page, 'ArrowUp');
  expect(await lit()).toBe(first);
  expect(await runNow(page)).toBe(before);
  await step(page, 'Escape');
  await waitForScene(page, 'Map');
  expect(errors).toEqual([]);
});

test('Pocket look: the Trade Post shows what you give and get, and No thanks leaves without a trade', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=plaza-e2e');
  await toPocketMap(page);
  const sideId = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    const middle = Math.ceil(run.stage.map.columns / 2);
    const node = run.stage.map.nodes.filter((n: any) => n.column === middle).find((n: any) => n.sides.some((s: any) => s.kind === 'plaza'));
    if (!node) return null;
    run.stage.current = node.id;
    (window as any).__pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
    return node.sides.find((s: any) => s.kind === 'plaza').id as string;
  });
  expect(sideId).not.toBeNull();
  await waitForScene(page, 'Map');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  const before = await runNow(page);
  await page.evaluate((id) => { (window as any).__pkr.game.scene.getScene('Map').scene.start('Trade', { source: 'plaza', sideId: id, back: { scene: 'Map' } }); }, sideId);
  await waitForScene(page, 'Trade');
  await onPkPage(page, 'Trade', 'pt-trade');
  const trade = pkView(page, 'Trade', 'pt-trade');
  await expect(trade.locator('.sw39 > .pn')).toHaveCount(2);
  await expect(trade.locator('.tk39 [data-act="accept"]')).toHaveCount(1);
  await fits(page, 'Trade', 'pt-trade');
  await trade.locator('.tk39 [data-act="decline"]').click();
  await waitForScene(page, 'Map');
  expect(await runNow(page)).toBe(before);
  expect(errors).toEqual([]);
});

test('Pocket look: Memories is a shelf of cards and the Legacy Gallery shows one past Trainer; looking changes nothing', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=mem-e2e');
  await toPocketMap(page);
  // End the run so the profile keeps one legacy record.
  await page.evaluate(() => { const pkr = (window as any).__pkr; pkr.session.run.victory = true; pkr.session.run.phase = 'over'; pkr.session.finishRun(); pkr.game.scene.getScene('Map').scene.start('Memories'); });
  await waitForScene(page, 'Memories');
  await onPkPage(page, 'Memories', 'pt-memories');
  const shelf = pkView(page, 'Memories', 'pt-memories');
  await expect(shelf.locator('.gr39 > .pn')).toHaveCount(8);
  await expect(shelf.locator('[data-key="mem-journal"] p')).toHaveText('1 run');
  await fits(page, 'Memories', 'pt-memories');
  const profile = () => page.evaluate(() => JSON.stringify((window as any).__pkr.session.profile.legacyRuns));
  const before = await profile();
  await step(page, 'ArrowRight');
  await expect(shelf.locator('.pn.on')).toHaveAttribute('data-key', 'mem-journal');
  await step(page, 'Enter');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Memories').shelf)).toBeNull();
  await page.evaluate(() => { (window as any).__pkr.game.scene.getScene('Memories').scene.start('LegacyGallery'); });
  await waitForScene(page, 'LegacyGallery');
  await onPkPage(page, 'LegacyGallery', 'pt-gallery');
  const gallery = pkView(page, 'LegacyGallery', 'pt-gallery');
  await expect(gallery.locator('.lgt39 i.ace')).toHaveCount(1);
  await fits(page, 'LegacyGallery', 'pt-gallery');
  await step(page, 'Enter');
  await expect(gallery.locator('.gx-lg-rl')).toHaveCount(1);
  await step(page, 'Escape');
  await expect(gallery.locator('.gx-lg-rl')).toHaveCount(0);
  await step(page, 't');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('LegacyGallery').pk)).toBeNull();
  expect(await profile()).toBe(before);
  expect(errors).toEqual([]);
});

test('Pocket look: Trainers is a row of cards and the Preparation Desk is four pages; each changes what it says and the Overview shows it', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-desk');
  const now = () => page.evaluate(() => (window as any).__pkr.activeScene());
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep']) {
    await page.keyboard.press('Enter');
    await expect.poll(now, { timeout: 20_000 }).toBe(next);
    await page.waitForTimeout(400);
    if (next !== 'TrainerSelect') continue;
    // Trainers: the lit one on the big card, four beside it; arrows walk the row and come back.
    await onPkPage(page, 'TrainerSelect', 'trainers');
    const tr = pkView(page, 'TrainerSelect', 'trainers');
    await expect(tr.locator('.tr-row .trb')).toHaveCount(5);
    await fits(page, 'TrainerSelect', 'trainers');
    await step(page, 'ArrowRight');
    await expect(tr.locator('.trb.on')).toHaveAttribute('data-key', 'tr-1');
    await step(page, 'ArrowLeft');
    await expect(tr.locator('.trb.on b').first()).toHaveText('Red');
  }
  await onPkPage(page, 'RunPrep', 'pd-desk');
  const desk = pkView(page, 'RunPrep', 'pd-desk');
  await expect(desk.locator('.pdt38 > div')).toHaveCount(4);
  await fits(page, 'RunPrep', 'pd-desk');
  // Run Setup: down to Difficulty, right changes it.
  await desk.locator('[data-key="pd-tab-0"]').click();
  await onPkPage(page, 'RunChoices', 'pd-setup');
  const setup = pkView(page, 'RunChoices', 'pd-setup');
  await fits(page, 'RunChoices', 'pd-setup');
  await step(page, 'ArrowDown', 2);
  const before = await setup.locator('.srow.on .seg .on').innerText();
  await step(page, 'ArrowRight');
  await expect(setup.locator('.srow.on .seg .on')).not.toHaveText(before);
  const difficulty = await setup.locator('.srow.on .seg .on').innerText();
  // Trainer: cards; Tab goes on to Modifiers.
  await step(page, 'Tab');
  await onPkPage(page, 'RunChoices', 'pd-bring');
  const bring = pkView(page, 'RunChoices', 'pd-bring');
  await expect(bring.locator('.pdb38 > .pn:not(.help)')).toHaveCount(7);
  await fits(page, 'RunChoices', 'pd-bring');
  await step(page, 'Tab');
  await onPkPage(page, 'RunModifiers', 'pd-mods');
  const mods = pkView(page, 'RunModifiers', 'pd-mods');
  await expect(mods.locator('.pdm38 > .pn')).toHaveCount(6);
  await fits(page, 'RunModifiers', 'pd-mods');
  const name = (await mods.locator('.pdm38 > .pn.on b').innerText()).toLowerCase();
  await step(page, 'Enter');
  await expect(mods.locator('.pdm38 > .pn.on u')).toHaveText(/On|Off/);
  const on = (await mods.locator('.pdm38 > .pn.on u').innerText()) === 'On';
  // Overview shows the new difficulty and the rule.
  await mods.locator('[data-key="pd-tab-3"]').click();
  await onPkPage(page, 'RunPrep', 'pd-desk');
  await expect(desk.locator('.gx-pd-fact').nth(1)).toContainText(difficulty);
  if (on) await expect(desk.locator('.gx-pd-fact').nth(3)).toContainText(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  // The Seed page: typed letters land in the boxes and come back to the desk.
  await desk.locator('.gx-pd-fact').nth(4).click();
  await onPkPage(page, 'RunSeed', 'pd-seed');
  await fits(page, 'RunSeed', 'pd-seed');
  await page.getByTestId('seed-input').fill('ROCKET7');
  await page.getByTestId('seed-input').press('Enter');
  await onPkPage(page, 'RunPrep', 'pd-desk');
  await expect(desk.locator('.gx-pd-fact').nth(4)).toContainText('ROCKET7');
  expect(await page.evaluate(() => (window as any).__pkr.session.run)).toBeNull();
  expect(errors).toEqual([]);
});

test('Pocket look: the Blessing is the mock-up card; C opens the Reliquary and Enter goes on to the Briefing', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-bless');
  await toPocketMap(page);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr, run = pkr.session.run;
    run.expansion = run.expansion ?? {};
    run.expansion.blessing = { id: 'tapu-lele', tier: 'lesser', seen: false, influence: 0 };
    pkr.game.scene.getScene('Map').scene.start('Blessing');
  });
  await waitForScene(page, 'Blessing');
  await onPkPage(page, 'Blessing', 'blessing');
  const bl = pkView(page, 'Blessing', 'blessing');
  await expect(bl.locator('.blc.on b')).toHaveText('The Guardian of Life');
  await fits(page, 'Blessing', 'blessing');
  await step(page, 'c');
  await expect(bl.locator('.gx-bs-book')).toBeVisible();
  await step(page, 'Escape');
  await expect(bl.locator('.gx-bs-book')).toHaveCount(0);
  await step(page, 'Enter');
  await waitForScene(page, 'Briefing');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.expansion.blessing.seen)).toBe(true);
  expect(errors).toEqual([]);
});

test('Pocket look: the run end is the mock-up page; Tab opens the full report as a window and Esc closes it', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-over');
  await toPocketMap(page);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr, run = pkr.session.run;
    run.phase = 'over';
    pkr.game.scene.getScene('Map').scene.start('GameOver');
  });
  await waitForScene(page, 'GameOver');
  const mode = () => page.evaluate(() => (window as any).__pkr.game.scene.getScene('GameOver').rxMode);
  for (let i = 0; i < 12 && (await mode()) !== 'main'; i++) await step(page, 'Escape');
  expect(await mode()).toBe('main');
  await onPkPage(page, 'GameOver', 'gameover');
  const ov = pkView(page, 'GameOver', 'gameover');
  await expect(ov.locator('.ov-t b')).toHaveText('The journey ends');
  await expect(ov.locator('.ov-btns .btn')).toHaveCount(3);
  await expect(ov.locator('.ov-btns .btn.on')).toHaveCount(1);
  await expect(ov.locator('.ov-team i').first()).toBeVisible();
  await fits(page, 'GameOver', 'gameover');
  await step(page, 'Tab');
  await expect(ov.locator('.gx-ov-rep')).toBeVisible();
  await expect(ov.locator('.gx-ov-rep span')).toContainText('Page 1 of');
  await step(page, 'Escape');
  await expect(ov.locator('.gx-ov-rep')).toHaveCount(0);
  expect(await mode()).toBe('main');
  expect(errors).toEqual([]);
});

test('Pocket look: a winning team opens as the Hall of Fame page and Back closes it; the records are unchanged', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-hof');
  await toPocketMap(page);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr, run = pkr.session.run;
    run.victory = true;
    run.phase = 'over';
    pkr.session.finishRun();
    pkr.game.scene.getScene('Map').scene.start('HallOfFame');
  });
  await waitForScene(page, 'HallOfFame');
  const before = await page.evaluate(() => JSON.stringify((window as any).__pkr.session.profile.runHistory));
  await step(page, 'ArrowDown');
  await step(page, 'Enter');
  await onPkPage(page, 'HallOfFame', 'hof');
  const hf = pkView(page, 'HallOfFame', 'hof');
  await expect(hf.locator('.hf-t b')).toHaveText('Hall of Fame');
  await expect(hf.locator('.hf-row i.me')).toHaveCount(1);
  await expect(hf.locator('.vs-say .btn')).toHaveText('Back');
  await fits(page, 'HallOfFame', 'hof');
  await hf.locator('.vs-say .btn').click();
  await expect(hf.locator('.hf-row')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.stringify((window as any).__pkr.session.profile.runHistory))).toBe(before);
  expect(errors).toEqual([]);
});

test('Pocket look: the credits say thank you, roll the run and walk the team; Enter goes on to the results', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-cred');
  await toPocketMap(page);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    pkr.session.run.victory = true;
    pkr.game.scene.getScene('Map').scene.start('Credits');
  });
  await waitForScene(page, 'Credits');
  await onPkPage(page, 'Credits', 'credits');
  const cr = pkView(page, 'Credits', 'credits');
  await expect(cr.locator('.cr-big b').first()).toHaveText('Thank you');
  await expect(cr.locator('.cr-roll em').first()).toBeVisible();
  await expect(cr.locator('.cr-walk .wk')).not.toHaveCount(0);
  await expect(cr.locator('.cr-back')).toHaveText('On to the results');
  await page.waitForTimeout(500);
  await step(page, 'Enter');
  await waitForScene(page, 'GameOver');
  expect(errors).toEqual([]);
});

test('Pocket look: a new region opens on its region page; a form offer is asked there and Not now keeps the Pokémon', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-reg');
  for (let n = 0; n < 40 && (await page.evaluate(() => (window as any).__pkr.activeScene())) !== 'Map'; n++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
  }
  await onPkPage(page, 'Map', 'region');
  const rg = pkView(page, 'Map', 'region');
  await expect(rg.locator('.rg-facts span')).toHaveCount(4);
  await expect(rg.locator('.vs-say .btn')).toHaveText('Set off');
  await fits(page, 'Map', 'region');
  await step(page, 'Enter');
  await onPkPage(page, 'Map', 'map');
  await page.evaluate(() => {
    const pkr = (window as any).__pkr, run = pkr.session.run;
    run.regionOrder[run.regionIndex] = 'alola';
    run.party[0].speciesId = 'vulpix';
    pkr.game.scene.getScene('Map').scene.restart({});
  });
  await onPkPage(page, 'Map', 'region');
  await expect(rg.locator('.rg-ask .seg i')).toHaveCount(2);
  await fits(page, 'Map', 'region');
  await step(page, 'ArrowRight');
  await expect(rg.locator('.rg-ask .seg i.on')).toHaveText('Not now');
  await step(page, 'Enter');
  await onPkPage(page, 'Map', 'map');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.party[0].speciesId)).toBe('vulpix');
  expect(await page.evaluate(() => (window as any).__pkr.session.regionFormOffers().length)).toBe(0);
  expect(errors).toEqual([]);
});

test('Pocket look: M opens the World Tour and G the Badge Case from the map; looking changes nothing', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-world');
  await toPocketMap(page);
  const before = await page.evaluate(() => JSON.stringify((window as any).__pkr.session.run));
  await step(page, 'm');
  await onPkPage(page, 'Map', 'world');
  const wt = pkView(page, 'Map', 'world');
  await expect(wt.locator('.wt.now')).toHaveCount(1);
  await expect(wt.locator('.wt.now em')).toContainText('You are here');
  await fits(page, 'Map', 'world');
  await step(page, 'ArrowRight');
  await expect(wt.locator('.wt.gx-wt-on')).toHaveAttribute('data-key', 'wt-1');
  await step(page, 'Escape');
  await onPkPage(page, 'Map', 'map');
  await step(page, 'g');
  await onPkPage(page, 'Map', 'badges');
  const bc = pkView(page, 'Map', 'badges');
  await expect(bc.locator('.bc.next')).toHaveCount(1);
  await expect(bc.locator('.bc-next em')).toContainText('Next gym');
  await expect(bc.locator('.bc-league')).toContainText('Pokémon League');
  await fits(page, 'Map', 'badges');
  await step(page, 'ArrowRight');
  await expect(bc.locator('.bc-next b').first()).toHaveText('???');
  await step(page, 'Escape');
  await onPkPage(page, 'Map', 'map');
  expect(await page.evaluate(() => JSON.stringify((window as any).__pkr.session.run))).toBe(before);
  expect(errors).toEqual([]);
});

test('Pocket look: starting a run, Starter Pick is three cards and the Briefing shows the first region and Gym', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=pocket&seed=pk-run1');
  const now = () => page.evaluate(() => (window as any).__pkr.activeScene());
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect']) {
    await page.keyboard.press('Enter');
    await expect.poll(now, { timeout: 20_000 }).toBe(next);
    await page.waitForTimeout(400);
  }
  await onPkPage(page, 'StarterSelect', 'starter');
  const sp = pkView(page, 'StarterSelect', 'starter');
  await expect(sp.locator('.spc')).toHaveCount(3);
  await expect(sp.locator('.spc.on')).toHaveCount(1);
  await expect(sp.locator('.steps .on')).toContainText('Starter');
  await fits(page, 'StarterSelect', 'starter');
  const first = await sp.locator('.spc.on').getAttribute('data-key');
  await step(page, 'ArrowRight');
  expect(await sp.locator('.spc.on').getAttribute('data-key')).not.toBe(first);
  await step(page, 'Enter');
  await expect.poll(now, { timeout: 20_000 }).toBe('Briefing');
  await onPkPage(page, 'Briefing', 'pd-brief');
  const bf = pkView(page, 'Briefing', 'pd-brief');
  await expect(bf.locator('.bff38 .pn')).toHaveCount(3);
  await expect(bf.locator('.bff38 .gym')).toContainText('First Gym');
  await fits(page, 'Briefing', 'pd-brief');
  await step(page, 'Enter');
  await expect.poll(now, { timeout: 20_000 }).toBe('Map');
  expect(errors).toEqual([]);
});
