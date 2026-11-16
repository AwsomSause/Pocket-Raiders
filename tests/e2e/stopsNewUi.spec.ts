import { expect, test } from '@playwright/test';
import { addSide, start, toMap, view, waitForScene, watch } from './helpers/newUi';

// The New UI's stops from the last pass (mock-up section 5): the shop's Buy 1 / Buy 5 and its Clerk, the fishing
// window over the map ("! A bite !"), a Pokémon Moment event with the party Pokémon standing beside the player, and the
// minigame's "Best" window. One of the New UI spec files (see newUi.spec.ts); the shared steps are in helpers/newUi.ts.

test('New UI: the shop is the mock-up shop page (Clerk, Buy 1 and Buy 5; Right lights Buy 5 and Enter buys five), and a fishing stop opens the mock-up "A bite!" window over the map', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-stops');
  await toMap(page);
  await addSide(page, { id: 'nu-shop', kind: 'shop', used: false });
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    pkr.session.run.money = 3500;
    pkr.session.visitSide('nu-shop');
    pkr.session.run.shop.type = 'mart';
    pkr.game.scene.getScene('Map').scene.start('Shop', { type: 'mart' });
  });
  await waitForScene(page, 'Shop');
  await page.waitForTimeout(250);
  const shop = view(page, 'Shop');
  await expect(shop.locator('.txt .nm')).toHaveText('Clerk');
  await expect(shop).toContainText('Welcome! Take your time.');
  await expect(shop.locator('.btn', { hasText: 'Buy 1' })).toHaveClass(/\bon\b/);
  await expect(shop.locator('.btn', { hasText: 'Buy 5' })).not.toHaveClass(/\bon\b/);
  const before = await page.evaluate(() => {
    const s = (window as any).__pkr.game.scene.getScene('Shop');
    const row = s.view().rows[0];
    return { id: row.itemId, price: row.price, money: (window as any).__pkr.session.run.money, have: (window as any).__pkr.session.run.inventory[row.itemId] ?? 0 };
  });
  await page.keyboard.press('ArrowRight');
  await expect(shop.locator('.btn', { hasText: 'Buy 5' })).toHaveClass(/\bon\b/);
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate((id) => (window as any).__pkr.session.run.inventory[id] ?? 0, before.id)).toBe(before.have + 5);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.money)).toBe(before.money - 5 * before.price);
  await expect(shop).toContainText('Bought 5');
  // Left goes back to Buy 1, and Enter then buys one.
  await page.keyboard.press('ArrowLeft');
  await expect(shop.locator('.btn', { hasText: 'Buy 1' })).toHaveClass(/\bon\b/);
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate((id) => (window as any).__pkr.session.run.inventory[id] ?? 0, before.id)).toBe(before.have + 6);
  await page.screenshot({ path: 'test-results/newui-shop.png' });
  await page.keyboard.press('Escape');
  await waitForScene(page, 'Map');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);

  await addSide(page, { id: 'nu-fish', kind: 'fish', used: false });
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').openFishing('nu-fish'));
  const win = page.locator('#rx .win', { hasText: '! A bite !' });
  await expect(win).toBeVisible();
  await expect(win).toContainText('Which one do you reel in?');
  await expect(win.locator('.hp.gold')).toHaveCount(1);
  await expect(win.locator('[data-act="pick"]').first()).toContainText(/Lv\s?\d+/);
  // The map stays on screen behind the window.
  await expect(view(page, 'Map').first()).toBeVisible();
  await page.screenshot({ path: 'test-results/newui-fishing.png' });
  await page.keyboard.press('Escape');
  await expect(win).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('New UI: a Pokémon Moment shows the party Pokémon beside the player (the mock-up moment page), and a minigame has the mock-up "Best" window', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-moment');
  await toMap(page);
  await addSide(page, { id: 'nu-moment', kind: 'event', used: false, eventId: 'pg2-any-road' });
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    pkr.session.run.party[0].speciesId = 'eevee';
    pkr.game.scene.getScene('Map').scene.start('Event', { sideId: 'nu-moment' });
  });
  await waitForScene(page, 'Event');
  const ev = view(page, 'Event');
  await expect(ev).toContainText('Any Road');
  await expect.poll(() => ev.evaluate((el) => el.innerHTML)).toContain('pokemon/133');
  expect(await ev.evaluate((el) => el.innerHTML)).toContain('/trainer/');
  await page.screenshot({ path: 'test-results/newui-moment.png' });

  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    run.phase = 'map';
    const node = run.stage.map.nodes.find((n: any) => n.id === run.stage.current);
    node.sides.push({ id: 'nu-mg', kind: 'minigame', minigameId: 'pokemon-memory', used: false });
    run.minigames.best['pokemon-memory'] = 'silver';
    pkr.session.beginMinigame('nu-mg', 1);
    pkr.game.scene.getScene('Event').scene.start('Minigame');
  });
  await waitForScene(page, 'Minigame');
  const mg = view(page, 'Minigame');
  await expect(mg).toContainText('Best');
  await expect(mg).toContainText('Silver');
  await page.screenshot({ path: 'test-results/newui-minigame.png' });
  expect(errors).toEqual([]);
});
