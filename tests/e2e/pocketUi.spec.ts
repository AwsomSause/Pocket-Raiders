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
  expect(await runNow(page)).toBe(before);
  expect(errors).toEqual([]);
});
