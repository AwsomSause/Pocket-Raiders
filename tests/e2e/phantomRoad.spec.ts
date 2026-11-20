import { expect, test, type Page } from '@playwright/test';
import { addSide, start, waitForScene, watch } from './helpers/newUi';
import { fitProblems, onPage, pview, toPhantomMap } from './helpers/phantomUi';

// The Phantom UI, slice 4: the road. The stage map with its pause menu and legend, an event from its first line to
// its reward, the reward draft and the shop. Every page is checked for text that is cut off or off the screen.

const fits = async (page: Page, key: string, id: string) => { await page.waitForTimeout(900); expect(await fitProblems(page, key, id)).toEqual([]); };
const version = (page: Page, id: string) => page.evaluate((id) => { const s = (window as any).__pkr.session; s.saveSettings({ ...s.settings, phantomVersion: id }); }, id);
const pageNow = (page: Page, key: string) => page.evaluate((key) => document.querySelector(`#phx .phs[data-scene="${key}"]`)?.getAttribute('data-scr') ?? null, key);

test('Phantom UI: the stage map, its legend and its pause menu are Phantom pages', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=phantom-road');
  await onPage(page, 'MainMenu', 'title');
  await toPhantomMap(page);
  await onPage(page, 'Map', 'map');
  const map = pview(page, 'Map', 'map');
  await expect(map.locator('.nd.sel')).toHaveCount(1);
  expect(await map.locator('.nd').count()).toBeGreaterThan(3);
  await expect(map.locator('.day > b')).toHaveText('1');
  await expect(map.locator('.wallet')).toContainText('₽');
  await expect(map.locator('.stop h3')).not.toHaveText('');
  await fits(page, 'Map', 'map');
  // Moving lights another stop or a button; the card follows.
  const stops = await map.locator('.nd[data-act]').count();
  if (stops > 1) {
    const before = await map.locator('.nd.sel').getAttribute('data-arg');
    await page.keyboard.press('ArrowDown');
    await expect(map.locator('.nd.sel')).not.toHaveAttribute('data-arg', before!);
  }
  await map.locator('.ph-mbar span').first().hover();
  await expect(map.locator('.ph-mbar span').first()).toHaveClass(/\bon\b/);
  await expect(map.locator('.stop small')).toHaveText('ON THIS MAP');
  await fits(page, 'Map', 'map');
  // The legend opens over the map and closes again.
  await page.keyboard.press('l');
  await expect(map.locator('.ph-mleg')).toBeVisible();
  await fits(page, 'Map', 'map');
  await page.keyboard.press('l');
  await expect(map.locator('.ph-mleg')).toHaveCount(0);
  // Pause: every choice as a slanted word, in every version and at several sizes.
  await page.keyboard.press('Escape');
  await onPage(page, 'Map', 'pause');
  const pause = pview(page, 'Map', 'pause');
  await expect(pause.locator('.hub .h.on')).toHaveText('Resume');
  await expect(pause.locator('.hub .h')).toHaveCount(6);
  await fits(page, 'Map', 'pause');
  await page.keyboard.press('ArrowDown');
  await expect(pause.locator('.hub .h.on')).toHaveText('Party');
  for (const [id, w, h] of [['midnight', 844, 390], ['channel', 1920, 1080], ['fantasia', 700, 900], ['velvet', 1280, 720]] as const) {
    await version(page, id);
    await page.setViewportSize({ width: w, height: h });
    await page.keyboard.press('ArrowDown');
    await expect(page.locator(`#phx .phs[data-scene="Map"][data-scr="pause"][data-liv="${id}"]`)).toBeVisible();
    await fits(page, 'Map', 'pause');
    await page.keyboard.press('Escape');
    await onPage(page, 'Map', 'map');
    await fits(page, 'Map', 'map');
    await page.keyboard.press('Escape');
    await onPage(page, 'Map', 'pause');
  }
  expect(errors).toEqual([]);
});

test('Phantom UI: an event runs talk, choice, outcome and reward; nothing is given before its text is closed', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=phantom-event');
  await onPage(page, 'MainMenu', 'title');
  await toPhantomMap(page);
  await addSide(page, { id: 'ph-ev', kind: 'event', used: false, eventId: 'an09-rusted-anchor' });
  await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('Map').scene.start('Event', { sideId: 'ph-ev' }));
  await waitForScene(page, 'Event');
  await onPage(page, 'Event', 'event');
  const ev = page.locator('#phx .phs[data-scene="Event"]');
  await expect(ev.locator('.sy-st span.on')).toHaveText('Talk');
  await expect(ev.locator('.sy-box p')).not.toHaveText('');
  await expect(ev.locator('.sy-cd')).toHaveCount(0);
  await fits(page, 'Event', 'event');
  // Enter turns the pages until the choices are dealt.
  for (let n = 0; n < 8 && (await pageNow(page, 'Event')) === 'event'; n++) { await page.keyboard.press('Enter'); await page.waitForTimeout(350); }
  await onPage(page, 'Event', 'choice');
  await expect(ev.locator('.sy-st span.on')).toHaveText('Choose');
  await expect(ev.locator('.sy-cd')).toHaveCount(3);
  await expect(ev.locator('.sy-cd').nth(0)).toHaveClass(/\bon\b/);
  await fits(page, 'Event', 'choice');
  await page.keyboard.press('ArrowRight');
  await expect(ev.locator('.sy-cd').nth(1)).toHaveClass(/\bon\b/);
  // A number key lights its card; the mouse does too. Neither chooses.
  await page.keyboard.press('3');
  await expect(ev.locator('.sy-cd').nth(2)).toHaveClass(/\bon\b/);
  await ev.locator('.sy-cd').nth(0).hover();
  await expect(ev.locator('.sy-cd').nth(0)).toHaveClass(/\bon\b/);
  expect(await pageNow(page, 'Event')).toBe('choice');
  for (const [id, w, h] of [['midnight', 844, 390], ['fantasia', 700, 900], ['velvet', 1920, 1080]] as const) {
    await version(page, id);
    await page.setViewportSize({ width: w, height: h });
    await page.keyboard.press('ArrowRight');
    await expect(page.locator(`#phx .phs[data-scene="Event"][data-liv="${id}"]`)).toBeVisible();
    await fits(page, 'Event', 'choice');
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(250);
  // Choosing shows the outcome's text first, with what changed still closed.
  await page.keyboard.press('Enter');
  await onPage(page, 'Event', 'sy-result');
  await expect(ev.locator('.sy-st span.on')).toHaveText('Outcome');
  await expect(ev.locator('.sy-rc')).toHaveCount(0);
  await fits(page, 'Event', 'sy-result');
  for (let n = 0; n < 8 && (await pageNow(page, 'Event')) === 'sy-result'; n++) { await page.keyboard.press('Enter'); await page.waitForTimeout(350); }
  // Either the event had something to give (its cards open and stay until Enter) or it ends on the map.
  if ((await pageNow(page, 'Event')) === 'sy-reward') {
    expect(await ev.locator('.sy-rc').count()).toBeGreaterThan(0);
    await fits(page, 'Event', 'sy-reward');
    await page.waitForTimeout(1200);
    expect(await pageNow(page, 'Event')).toBe('sy-reward');
    await page.keyboard.press('Enter');
  }
  await waitForScene(page, 'Map');
  expect(errors).toEqual([]);
});

test('Phantom UI: the reward draft and the shop are Phantom pages', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=phantom-stops');
  await onPage(page, 'MainMenu', 'title');
  await toPhantomMap(page);

  // The shop: the shelf, the lit good's card, Buy 1 or Buy 5.
  await addSide(page, { id: 'ph-shop', kind: 'shop', used: false });
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    pkr.session.run.money = 3500;
    pkr.session.visitSide('ph-shop');
    pkr.session.run.shop.type = 'mart';
    pkr.game.scene.getScene('Map').scene.start('Shop', { type: 'mart' });
  });
  await waitForScene(page, 'Shop');
  await onPage(page, 'Shop', 'shop');
  const shop = pview(page, 'Shop', 'shop');
  await expect(shop.locator('.bub')).toHaveText('Welcome! Take your time.');
  await expect(shop.locator('.wallet')).toContainText('₽3,500');
  await expect(shop.locator('.it.on')).toHaveCount(1);
  await expect(shop.locator('.ph-sbtn .blade', { hasText: 'Buy 1' })).toHaveClass(/\bon\b/);
  await fits(page, 'Shop', 'shop');
  const before = await page.evaluate(() => {
    const row = (window as any).__pkr.game.scene.getScene('Shop').view().rows[0];
    return { id: row.itemId, price: row.price, have: (window as any).__pkr.session.run.inventory[row.itemId] ?? 0 };
  });
  await page.keyboard.press('ArrowRight');
  await expect(shop.locator('.ph-sbtn .blade', { hasText: 'Buy 5' })).toHaveClass(/\bon\b/);
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate((id) => (window as any).__pkr.session.run.inventory[id] ?? 0, before.id)).toBe(before.have + 5);
  await expect(shop.locator('.wallet')).toContainText(`₽${(3500 - 5 * before.price).toLocaleString('en-US')}`);
  await expect(shop.locator('.bub')).toContainText('Bought 5');
  await fits(page, 'Shop', 'shop');
  await page.keyboard.press('Escape');
  await waitForScene(page, 'Map');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);

  // The reward draft: a card per reward, one lifted; the result stays until Enter.
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    session.run.phase = 'reward';
    session.run.draft = ['protein', 'nugget', 'potion', 'ether', 'revive'];
    game.scene.getScene('Map').scene.start('Reward');
  });
  await waitForScene(page, 'Reward');
  await onPage(page, 'Reward', 'reward');
  const reward = pview(page, 'Reward', 'reward');
  await expect(reward.locator('.rc')).toHaveCount(5);
  await expect(reward.locator('.rc').nth(0)).toHaveClass(/\bon\b/);
  await expect(reward.locator('.rc.on .take')).toHaveCount(1);
  await fits(page, 'Reward', 'reward');
  await page.keyboard.press('ArrowRight');
  await expect(reward.locator('.rc').nth(1)).toHaveClass(/\bon\b/);
  for (const [id, w, h] of [['midnight', 844, 390], ['channel', 700, 900], ['velvet', 1920, 1080]] as const) {
    await version(page, id);
    await page.setViewportSize({ width: w, height: h });
    await page.keyboard.press('ArrowRight');
    await expect(page.locator(`#phx .phs[data-scene="Reward"][data-liv="${id}"]`)).toBeVisible();
    await fits(page, 'Reward', 'reward');
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(250);
  const money = await page.evaluate(() => (window as any).__pkr.session.run.money);
  await reward.locator('.rc').nth(1).click();
  await expect(reward.locator('.ph-rw-res')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__pkr.session.run.money)).toBeGreaterThan(money);
  await fits(page, 'Reward', 'reward');
  await page.waitForTimeout(1200);
  await expect(reward.locator('.ph-rw-res')).toBeVisible();
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Map');
  expect(errors).toEqual([]);
});

test('Phantom UI: a talk page (the tutorial) is a Phantom page with no step strip', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=phantom');
  await onPage(page, 'MainMenu', 'title');
  await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('MainMenu').scene.start('Tutorial'));
  await waitForScene(page, 'Tutorial');
  await onPage(page, 'Tutorial', 'choice');
  const talk = page.locator('#phx .phs[data-scene="Tutorial"]');
  await expect(talk.locator('.sy-st > div')).toHaveCount(0);
  // First the list of lessons, dealt as cards in two rows; picking one opens the lesson.
  await expect(talk.locator('.sy-cd')).toHaveCount(10);
  await expect(talk.locator('.sy-cd.on')).toHaveCount(1);
  await fits(page, 'Tutorial', 'choice');
  await page.keyboard.press('Enter');
  await expect(talk.locator('.sy-cd')).toHaveCount(2);
  await expect(talk.locator('.sy-cd.on')).toHaveText(/Next/);
  const first = await talk.locator('.sy-q > span').innerText();
  await fits(page, 'Tutorial', 'choice');
  await page.keyboard.press('ArrowRight');
  await expect(talk.locator('.sy-cd').nth(1)).toHaveClass(/\bon\b/);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  await expect(talk.locator('.sy-q > span')).not.toHaveText(first);
  for (const [id, w, h] of [['channel', 844, 390], ['fantasia', 1920, 1080]] as const) {
    await version(page, id);
    await page.setViewportSize({ width: w, height: h });
    await page.keyboard.press('ArrowRight');
    await expect(page.locator(`#phx .phs[data-scene="Tutorial"][data-liv="${id}"]`)).toBeVisible();
    await fits(page, 'Tutorial', 'choice');
  }
  expect(errors).toEqual([]);
});

test('Phantom UI: a healing spot is a Phantom page that stays until an input', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=phantom-heal');
  await onPage(page, 'MainMenu', 'title');
  await toPhantomMap(page);
  await addSide(page, { id: 'ph-heal', kind: 'heal' });
  await page.evaluate(() => {
    const pkr = (window as any).__pkr, run = pkr.session.run;
    run.party[0].hp = 1;
    pkr.game.scene.getScene('Map').scene.restart();
  });
  await page.waitForTimeout(900);
  await onPage(page, 'Map', 'map');
  await pview(page, 'Map', 'map').locator('.ph-mbar [data-act]', { hasText: 'Heal' }).click();
  await onPage(page, 'Map', 'heal');
  const heal = pview(page, 'Map', 'heal');
  // The rules healed at once; the page only shows it.
  expect(await page.evaluate(() => (window as any).__pkr.session.run.party[0].hp)).toBeGreaterThan(1);
  await expect(heal.locator('.hc-s')).toHaveCount(await page.evaluate(() => (window as any).__pkr.session.run.party.length));
  await expect(heal.locator('.hc-say')).toContainText('healed');
  await fits(page, 'Map', 'heal');
  // ALL EVENTS rule: the words stay until an input.
  await page.waitForTimeout(2500);
  expect(await pageNow(page, 'Map')).toBe('heal');
  for (const [id, w, h] of [['midnight', 844, 390], ['velvet', 1920, 1080]] as const) {
    await version(page, id);
    await page.setViewportSize({ width: w, height: h });
    await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('Map').rxView.refresh());
    await expect(page.locator(`#phx .phs[data-scene="Map"][data-scr="heal"][data-liv="${id}"]`)).toBeVisible();
    await fits(page, 'Map', 'heal');
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.keyboard.press('Enter');
  await onPage(page, 'Map', 'map');
  // The stop is used up: its button is gone, and the map says what happened.
  await expect(pview(page, 'Map', 'map').locator('.ph-mbar [data-act]', { hasText: 'Heal' })).toHaveCount(0);
  expect(errors).toEqual([]);
});
