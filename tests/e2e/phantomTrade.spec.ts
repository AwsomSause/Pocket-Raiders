import { expect, test, type Page } from '@playwright/test';
import { addSide, start, waitForScene, watch } from './helpers/newUi';
import { fitProblems, onPage, pview, toPhantomMap } from './helpers/phantomUi';

// Phantom UI: the Trade Post's quick trade and an event's Honest Trade Card are Phantom pages. The rules decide the
// trade; the page only shows it, and what happened stays until an input.

const fits = async (page: Page, key: string) => { await page.waitForTimeout(900); expect(await fitProblems(page, key, 'trade')).toEqual([]); };
const version = (page: Page, id: string) => page.evaluate((id) => { const s = (window as any).__pkr.session; s.saveSettings({ ...s.settings, phantomVersion: id }); }, id);
const species = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.party.map((m: any) => m.speciesId as string));

test('Phantom UI: the Trade Post is a Phantom page: offers, a trade, and the swap stays until an input', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=trade-e2e');
  await onPage(page, 'MainMenu', 'title');
  await toPhantomMap(page);
  const sideId = await page.evaluate(() => {
    const pkr = (window as any).__pkr, run = pkr.session.run;
    const tpl = JSON.parse(JSON.stringify(run.party[0]));
    run.party = ['squirtle', 'eevee', 'onix'].map((sp: string) => ({ ...JSON.parse(JSON.stringify(tpl)), uid: `${tpl.uid}-${sp}`, speciesId: sp, level: 14 }));
    run.plaza.used = {};
    run.money = 9000;
    const node = run.stage.map.nodes.find((x: any) => x.column === 1);
    run.stage.current = node.id;
    if (!run.stage.visited.includes(node.id)) run.stage.visited.push(node.id);
    node.sides = node.sides.filter((s: any) => s.kind !== 'event');
    node.sides.push({ id: 'ph-trade', kind: 'service', serviceId: 'trade', used: false });
    return 'ph-trade';
  });
  await page.evaluate((id) => (window as any).__pkr.game.scene.getScene('Map').openService(id), sideId);
  await waitForScene(page, 'Trade');
  await onPage(page, 'Trade', 'trade');
  const tr = pview(page, 'Trade', 'trade');
  await expect(tr.locator('.ph-tr-card')).toHaveCount(2);
  await expect(tr.locator('[data-act="accept"]')).toHaveClass(/\bon\b/);
  await expect(tr.locator('.wallet')).toContainText('9,000');
  await fits(page, 'Trade');
  // The arrows walk the offers and then Decline, and wrap back to the first offer.
  const nav = tr.locator('.ph-tr-nav b');
  const n = (await nav.count()) ? Number(((await nav.textContent()) ?? '1 / 1').split('/')[1]) : 1;
  for (let k = 1; k < n; k++) {
    await page.keyboard.press('ArrowDown');
    await expect(nav).toHaveText(`${k + 1} / ${n}`);
  }
  await page.keyboard.press('ArrowDown');
  await expect(tr.locator('.ph-tr-btn [data-act="decline"]')).toHaveClass(/\bon\b/);
  await page.keyboard.press('ArrowDown');
  await expect(tr.locator('[data-act="accept"]')).toHaveClass(/\bon\b/);
  if (n > 1) await expect(nav).toHaveText(`1 / ${n}`);
  for (const [id, w, h] of [['midnight', 844, 390], ['channel', 700, 900], ['velvet', 1920, 1080]] as const) {
    await version(page, id);
    await page.setViewportSize({ width: w, height: h });
    await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('Trade').rx.refresh());
    await expect(page.locator(`#phx .phs[data-scene="Trade"][data-liv="${id}"]`)).toBeVisible();
    await fits(page, 'Trade');
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  const before = await species(page);
  const gives = ((await tr.locator('.ph-tr-card.lt .tl1').textContent()) ?? '').trim();
  const gets = ((await tr.locator('.ph-tr-card.dk .tl1').textContent()) ?? '').trim();
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  // The swap: your side now holds what you got, with one Continue, and it stays.
  await expect(tr.locator('[data-act="accept"]')).toHaveCount(0, { timeout: 15_000 });
  await expect(tr.locator('.ph-tr-card.lt .tl1')).toHaveText(gets);
  await expect(tr.locator('.ph-tr-card.dk .tl1')).toHaveText(gives);
  expect(await species(page)).not.toEqual(before);
  await fits(page, 'Trade');
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => (window as any).__pkr.activeScene())).toBe('Trade');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Map');
  expect(errors).toEqual([]);
});

test('Phantom UI: the Honest Trade Card is a Phantom page: read it with T, a worse deal is asked once more, then it trades', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=newui-honest');
  await onPage(page, 'MainMenu', 'title');
  await toPhantomMap(page);
  // A strong Pokémon (worth more than the Krabby on offer) and a small one (an even trade).
  await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    const big = run.party[0];
    big.speciesId = 'charizard';
    big.level = 30;
    const small = JSON.parse(JSON.stringify(big));
    small.uid = 'e2e-small';
    small.speciesId = 'caterpie';
    small.level = 5;
    run.party.push(small);
  });
  await addSide(page, { id: 'ph-honest', kind: 'event', used: false, eventId: 'trade-t001' });
  await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('Map').scene.start('Event', { sideId: 'ph-honest' }));
  await waitForScene(page, 'Event');
  await onPage(page, 'Event', 'choice');
  await expect(pview(page, 'Event', 'choice')).toContainText('Net-mender Effie', { ignoreCase: true });

  // T: the card before choosing, for the first Pokémon that fits. One button closes it.
  await page.keyboard.press('t');
  await onPage(page, 'Event', 'trade');
  const card = pview(page, 'Event', 'trade');
  for (const t of ['Effie', 'Krabby', 'Adamant', 'Hyper Cutter', 'Collector', 'Caterpie', 'Shield Dust', 'Fair value', 'ruined forty nets']) await expect(card).toContainText(t, { ignoreCase: true });
  await expect(card.locator('[data-act="accept"]')).toHaveCount(0);
  await expect(card.locator('.ph-tr-btn [data-act="back"]')).toHaveText('Close');
  await fits(page, 'Event');
  await page.keyboard.press('Escape');
  await onPage(page, 'Event', 'choice');

  // "Trade.": both sides with Trade and Back. The small one is first: an even trade.
  await page.waitForTimeout(250);
  await pview(page, 'Event', 'choice').locator('[data-act="pick"]').first().click();
  await onPage(page, 'Event', 'trade');
  await expect(card.locator('[data-act="accept"]')).toHaveText('Trade');
  await expect(card).toContainText('Fair trade', { ignoreCase: true });
  await expect(card.locator('.ph-tr-nav b')).toHaveText('1 / 2');
  await expect(card.locator('.ph-tr-say .txt')).toContainText('ruined forty nets');
  // Right: the Charizard. It is worth more than the Krabby, and the card says so.
  await page.keyboard.press('ArrowRight');
  await expect(card.locator('.ph-tr-card.lt .tl1')).toContainText('Charizard');
  await expect(card).toContainText('You give more than you get', { ignoreCase: true });
  for (const [id, w, h] of [['midnight', 844, 390], ['fantasia', 1920, 1080]] as const) {
    await version(page, id);
    await page.setViewportSize({ width: w, height: h });
    await page.keyboard.press('ArrowUp');
    await expect(page.locator(`#phx .phs[data-scene="Event"][data-scr="trade"][data-liv="${id}"]`)).toBeVisible();
    await fits(page, 'Event');
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  // The first Enter does not trade: the trader asks once more.
  await page.keyboard.press('Enter');
  await expect(card.locator('.ph-tr-say .txt')).toContainText('You sure?');
  await expect(card.locator('[data-act="accept"]')).toHaveText('Yes, trade');
  expect(await species(page)).toContain('charizard');
  // Down puts the cursor on Back, up on Trade again.
  await page.keyboard.press('ArrowDown');
  await expect(card.locator('.ph-tr-btn [data-act="back"]')).toHaveClass(/\bon\b/);
  await page.keyboard.press('ArrowUp');
  await expect(card.locator('[data-act="accept"]')).toHaveClass(/\bon\b/);
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  // The outcome is the event's own page: text first.
  await onPage(page, 'Event', 'sy-result');
  const party = await species(page);
  expect(party).not.toContain('charizard');
  expect(party).toContain('krabby');
  expect(errors).toEqual([]);
});
