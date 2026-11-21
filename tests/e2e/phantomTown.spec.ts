import { expect, test, type Page } from '@playwright/test';
import { open, start, waitForScene, watch } from './helpers/newUi';
import { fitProblems, onPage, pview } from './helpers/phantomUi';

// The Phantom UI's Town Map pages (menus the game did not have): Hub Town as a map with its districts and places,
// a place's rooms with who keeps it, and Pocket Town's directory by hamlet. They open the same rooms and buildings
// the doors do, and walking is always one key away.

const fits = async (page: Page, key: string, id: string, note = '') => { await page.waitForTimeout(900); expect(await fitProblems(page, key, id), note).toEqual([]); };
const version = (page: Page, id: string) => page.evaluate((id) => { const s = (window as any).__pkr.session; s.saveSettings({ ...s.settings, phantomVersion: id }); }, id);
const step = async (page: Page, key: string) => { await page.keyboard.press(key); await page.waitForTimeout(250); };
const hub = (page: Page) => page.evaluate(() => {
  const s = (window as any).__pkr.game.scene.getScene('Hub');
  return { picker: !!s.picker, section: !!s.section, map: !!s.phMap, town: !!s.town, at: s.town ? s.town.tile() : null };
});

test('Phantom UI: Hub Town has a Town Map: districts, places, a place\'s rooms, and walking instead', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watch(page);
  await start(page, 'ui=phantom');
  await onPage(page, 'MainMenu', 'title');
  await open(page, 'Hub');
  await waitForScene(page, 'Hub');
  await onPage(page, 'Hub', 'dock');
  await page.waitForTimeout(250);
  const map = pview(page, 'Hub', 'town'), place = pview(page, 'Hub', 'place');
  const tab = map.locator('.hl-t span.on'), lit = map.locator('.hl-i.on > b');

  // M opens the map on Champions' Row: six places, the first one lit, every door of the town as a pin.
  await step(page, 'm');
  await onPage(page, 'Hub', 'town');
  await expect(map.locator('.hl-t span')).toHaveCount(5);
  await expect(tab).toHaveText("Champions' Row");
  await expect(map.locator('.hl-i')).toHaveCount(6);
  await expect(lit).toHaveText('Achievement Hall');
  await expect(map.locator('.pin.n')).toHaveCount(6);
  await expect(map.locator('.pin:not(.n)')).toHaveCount(12);
  await expect(map.locator('.pin.on u')).toHaveText('Achievement Hall');
  await expect(map.locator('.hm-z.on span')).toHaveText("Champions' Row");
  // Not walking yet: YOU stands at the gate where a walk starts, as in the mock-up.
  await expect(map.locator('.hm-you')).toHaveCount(1);
  await expect(map.locator('.keys')).toContainText('Walk instead', { ignoreCase: true });
  await fits(page, 'Hub', 'town');

  // Left and Right turn the district; Up and Down move through its places and come round.
  await step(page, 'ArrowLeft');
  await expect(tab).toHaveText('Market Green');
  await expect(map.locator('.hl-i')).toHaveCount(1);
  await expect(map.locator('.ph-hl-none')).toContainText('Open ground');
  await step(page, 'Enter');
  await onPage(page, 'Hub', 'town');
  await step(page, 'ArrowLeft');
  await expect(tab).toHaveText('Village Gate');
  await expect(map.locator('.hl-i')).toHaveCount(7);
  await step(page, 'ArrowUp');
  await expect(lit).toHaveText('Departure Gate');
  await fits(page, 'Hub', 'town', 'seven places');
  await step(page, 'ArrowDown');
  await expect(lit).toHaveText('Network Post');
  await step(page, 'ArrowRight');
  await step(page, 'ArrowRight');
  await expect(tab).toHaveText("Champions' Row");
  // The mouse: a district's tab, then a place (the pointer lights it, a click goes there).
  await map.locator('.hl-t span', { hasText: 'Meadow Park' }).click();
  await expect(tab).toHaveText('Meadow Park');
  await map.locator('.hl-t span', { hasText: "Champions' Row" }).click();
  for (const [id, w, h] of [['midnight', 844, 390], ['channel', 1920, 1080], ['fantasia', 1024, 768], ['velvet', 1280, 720]] as const) {
    await version(page, id);
    await page.setViewportSize({ width: w, height: h });
    await step(page, 'ArrowDown');
    await expect(page.locator(`#phx .phs[data-scene="Hub"][data-liv="${id}"][data-scr="town"]`)).toBeVisible();
    await fits(page, 'Hub', 'town', `${id} at ${w}x${h}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await version(page, 'phantom');
  await step(page, 'ArrowUp');

  // The Competitive Arena has two rooms: the place page, with its keeper and what the lit room holds.
  await map.locator('.hl-i', { hasText: 'Competitive Arena' }).hover();
  await expect(lit).toHaveText('Competitive Arena');
  await page.waitForTimeout(250);
  await map.locator('.hl-i', { hasText: 'Competitive Arena' }).click();
  await onPage(page, 'Hub', 'place');
  await expect(place.locator('.hd')).toContainText('Competitive Arena', { ignoreCase: true });
  await expect(place.locator('.hd small')).toHaveText("Hub Town · Champions' Row");
  await expect(place.locator('.pl-rooms .blade')).toHaveCount(2);
  await expect(place.locator('.pl-rooms .blade.on')).toContainText('Trainer Archive', { ignoreCase: true });
  await expect(place.locator('.pl-say .lab')).toHaveText('Arena steward');
  await expect(place.locator('.pl-prev .lab')).toContainText('Trainer Archive');
  await expect(place.locator('.pl-tr > div')).toHaveCount(5);
  await fits(page, 'Hub', 'place');
  await step(page, 'ArrowDown');
  await expect(place.locator('.pl-rooms .blade.on')).toContainText('Intelligence Board', { ignoreCase: true });
  await expect(place.locator('.pl-tr')).toHaveCount(0);
  await step(page, 'ArrowDown');
  await expect(place.locator('.pl-rooms .blade.on')).toContainText('Trainer Archive', { ignoreCase: true });
  for (const [id, w, h] of [['midnight', 1024, 768], ['channel', 844, 390], ['fantasia', 1920, 1080], ['velvet', 1280, 720]] as const) {
    await version(page, id);
    await page.setViewportSize({ width: w, height: h });
    await step(page, 'ArrowDown');
    await expect(page.locator(`#phx .phs[data-scene="Hub"][data-liv="${id}"][data-scr="place"]`)).toBeVisible();
    await fits(page, 'Hub', 'place', `${id} at ${w}x${h}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await version(page, 'phantom');
  // Back from a place reached through the map lands on the map again, on the same place.
  await step(page, 'Escape');
  await onPage(page, 'Hub', 'town');
  await expect(lit).toHaveText('Competitive Arena');
  await step(page, 'Escape');
  await onPage(page, 'Hub', 'dock');
  expect(await hub(page)).toMatchObject({ picker: false, section: false, map: false });

  // The dock's Town word is the map too. A long menu (Unlocks, eleven rooms) is a place page with a tighter list.
  await page.waitForTimeout(250);
  await pview(page, 'Hub', 'dock').locator('.hub .h', { hasText: /^unlocks/i }).click();
  await onPage(page, 'Hub', 'place');
  await expect(place.locator('.pl-rooms.xs .blade')).toHaveCount(11);
  await expect(place.locator('.hd small')).toHaveText('Hub Town');
  await fits(page, 'Hub', 'place', 'eleven rooms');
  await step(page, 'Escape');
  await onPage(page, 'Hub', 'dock');
  await page.waitForTimeout(250);
  await pview(page, 'Hub', 'dock').locator('.hub .h', { hasText: /^town/i }).click();
  await onPage(page, 'Hub', 'town');

  // M on the map walks instead: Hub Town on foot. There M opens the map on the district you stand in, with you on it.
  await page.waitForTimeout(250);
  await step(page, 'm');
  await expect.poll(async () => (await hub(page)).town, { timeout: 20_000 }).toBe(true);
  await expect(page.locator('#phx .phs[data-scene="Hub"]')).toHaveCount(0);
  await page.waitForTimeout(600);
  await step(page, 'm');
  await onPage(page, 'Hub', 'town');
  await expect(map.locator('.hm-you')).toHaveCount(1);
  await expect(map.locator('.keys')).toContainText('Keep walking', { ignoreCase: true });
  await expect(tab).toHaveText('Village Gate');
  await fits(page, 'Hub', 'town', 'on foot');
  // Going to a place from here puts you at its door, then opens it (the Bank has one room: it opens straight away).
  await map.locator('.hl-t span', { hasText: 'Meadow Park' }).click();
  await map.locator('.hl-i', { hasText: 'Pokémon Bank' }).hover();
  await expect(lit).toHaveText('Pokémon Bank');
  await page.waitForTimeout(250);
  await step(page, 'Enter');
  await expect.poll(async () => (await hub(page)).picker, { timeout: 10_000 }).toBe(true);
  const stand = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Hub').town.map.places.find((p: any) => p.id === 'bank').stand);
  expect((await hub(page)).at).toMatchObject({ x: stand.x, y: stand.y });
  expect((await hub(page)).map).toBe(false);
  expect(errors).toEqual([]);
});

test('Phantom UI: Pocket Town has a Town directory by hamlet: what is ready today, visit, walk there, or leave', async ({ page }) => {
  test.setTimeout(200_000);
  const errors = watch(page);
  await start(page, 'ui=phantom');
  await onPage(page, 'MainMenu', 'title');
  await open(page, 'Town');
  await waitForScene(page, 'Town');
  await page.waitForTimeout(800);
  const town = (): Promise<{ picker: boolean; dir: boolean; at: { x: number; y: number } }> => page.evaluate(() => { const s = (window as any).__pkr.game.scene.getScene('Town'); return { picker: !!s.picker, dir: !!s.directory, at: s.town.tile() }; });
  const dir = pview(page, 'Town', 'pocket');
  const hamlet = dir.locator('.pk-rail .pn.on > b'), lit = dir.locator('.pkt.on > b');
  const start0 = (await town()).at;

  // Esc opens the directory: every hamlet with how many places, a grid of this hamlet's places, and today's line.
  await step(page, 'Escape');
  await onPage(page, 'Town', 'pocket');
  expect(await town()).toMatchObject({ picker: true, dir: true });
  await expect(dir.locator('.pk-rail .pn')).toHaveCount(5);
  const counts = (await dir.locator('.pk-rail .pn span').allTextContents()).map((t) => parseInt(t, 10));
  expect(counts.every((n) => n > 0)).toBe(true);
  expect(counts.reduce((a, b) => a + b, 0)).toBeGreaterThan(40);
  // The grid holds the lit hamlet's places (a page of twelve at most).
  const at = await dir.locator('.pk-rail .pn').evaluateAll((els) => els.findIndex((e) => e.classList.contains('on')));
  await expect(dir.locator('.pkt')).toHaveCount(Math.min(12, counts[at]!));
  await expect(dir.locator('.pkt.on')).toHaveCount(1);
  await expect(dir.locator('.pk-today')).toContainText('ready');
  expect(await dir.locator('.pkt em').count()).toBeGreaterThan(0);
  await fits(page, 'Town', 'pocket');

  // Q and E turn the hamlet and come round; the arrows walk the grid and stop at its edges.
  const first = await hamlet.textContent();
  await step(page, 'e');
  await expect(hamlet).not.toHaveText(first!);
  await step(page, 'q');
  await expect(hamlet).toHaveText(first!);
  await step(page, 'q');
  await expect(hamlet).toHaveText('Fountain Glade');
  await expect(dir.locator('.pkt')).toHaveCount(1);
  await step(page, 'ArrowRight');
  await step(page, 'ArrowDown');
  await expect(dir.locator('.pkt.on')).toHaveCount(1);
  await fits(page, 'Town', 'pocket', 'one place');
  await dir.locator('.pk-rail .pn', { hasText: 'Home Gardens' }).click();
  await expect(hamlet).toHaveText('Home Gardens');
  const at0 = await lit.textContent();
  await step(page, 'ArrowRight');
  await expect(lit).not.toHaveText(at0!);
  await step(page, 'ArrowDown');
  await step(page, 'ArrowLeft');
  await step(page, 'ArrowUp');
  await expect(lit).toHaveText(at0!);
  await step(page, 'ArrowUp');
  await step(page, 'ArrowLeft');
  await expect(lit).toHaveText(at0!);
  for (const [id, w, h] of [['midnight', 844, 390], ['channel', 1920, 1080], ['fantasia', 1024, 768], ['velvet', 1280, 720]] as const) {
    await version(page, id);
    await page.setViewportSize({ width: w, height: h });
    await step(page, 'ArrowRight');
    await expect(page.locator(`#phx .phs[data-scene="Town"][data-liv="${id}"][data-scr="pocket"]`)).toBeVisible();
    await fits(page, 'Town', 'pocket', `${id} at ${w}x${h}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await version(page, 'phantom');

  // M walks there: the directory shuts and you stand at that door.
  await dir.locator('.pkt', { hasText: 'Hot Spring' }).hover();
  await expect(lit).toHaveText('Hot Spring');
  await page.waitForTimeout(250);
  await step(page, 'm');
  await expect(page.locator('#phx .phs[data-scene="Town"]')).toHaveCount(0);
  const door = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Town').town.map.places.find((p: any) => p.name === 'Hot Spring').stand);
  expect(await town()).toMatchObject({ picker: false, dir: false, at: { x: door.x, y: door.y } });
  expect(door).not.toMatchObject(start0);

  // M from the street opens it again on the hamlet you stand in; a click on the lit place visits it (the building's own panel).
  await page.waitForTimeout(400);
  await step(page, 'm');
  await onPage(page, 'Town', 'pocket');
  await expect(hamlet).toHaveText('Home Gardens');
  await dir.locator('.pkt', { hasText: 'Kitchen' }).hover();
  await expect(lit).toHaveText('Kitchen');
  await page.waitForTimeout(250);
  await dir.locator('.pkt', { hasText: 'Kitchen' }).click();
  await expect(page.locator('#phx .phs[data-scene="Town"][data-scr="pocket"]')).toHaveCount(0);
  await expect.poll(async () => (await town()).picker, { timeout: 10_000 }).toBe(true);
  expect((await town()).dir).toBe(false);
  await step(page, 'Escape');
  await expect.poll(async () => (await town()).picker, { timeout: 10_000 }).toBe(false);

  // H on the directory leaves for Hub Town.
  await page.waitForTimeout(400);
  await step(page, 'Escape');
  await onPage(page, 'Town', 'pocket');
  await expect(dir.locator('.keys')).toContainText('Hub Town', { ignoreCase: true });
  await page.waitForTimeout(250);
  await step(page, 'h');
  await waitForScene(page, 'Hub');
  expect(errors).toEqual([]);
});
