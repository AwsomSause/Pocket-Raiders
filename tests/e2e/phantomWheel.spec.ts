import { expect, test, type Page } from '@playwright/test';
import { addSide, start, waitForScene, watch } from './helpers/newUi';
import { fitProblems, onPage, toPhantomMap } from './helpers/phantomUi';

// Phantom UI: the map's quick wheel (hold TAB, point, let go) and the run log page, which reads back what was said,
// chosen and gained in this run over whatever screen is open.

const mapIndex = (page: Page) => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').index as number);
const mapBusy = (page: Page) => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy as boolean);
const version = (page: Page, id: string) => page.evaluate((id) => { const pkr = (window as any).__pkr; pkr.session.saveSettings({ ...pkr.session.settings, phantomVersion: id }); pkr.game.scene.getScene('Map').rxView?.refresh(); }, id);
const pageNow = (page: Page, key: string) => page.evaluate((key) => document.querySelector(`#phx .phs[data-scene="${key}"]`)?.getAttribute('data-scr') ?? null, key);
const step = async (page: Page, key: string) => { await page.keyboard.press(key); await page.waitForTimeout(200); };

test('Phantom UI: hold TAB on the map for the quick wheel; point and let go, or tap it and use Enter, the mouse or Esc', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=ph-wheel');
  await onPage(page, 'MainMenu', 'title');
  await toPhantomMap(page);
  const map = page.locator('#phx .phs[data-scene="Map"][data-scr="map"]');
  const wheel = map.locator('.ph-wh');
  const lit = wheel.locator('.wi.on b');
  await expect(wheel).toHaveCount(0);
  await expect(map.locator('.keys [data-act="key"][data-arg="Tab"]')).toBeVisible();
  const at = await mapIndex(page);

  // Held: eight slots, the first one lit; the arrows point, and never move the map under it.
  await page.keyboard.down('Tab');
  await expect(wheel).toBeVisible();
  await expect(wheel.locator('.wi')).toHaveCount(8);
  await expect(wheel.locator('.wi b')).toHaveText(['Party', 'Bag', 'Rivals', 'Log', 'Trainer card', 'Reserve', 'Save', 'Settings'], { ignoreCase: true });
  await expect(lit).toHaveText('Party', { ignoreCase: true });
  await expect(wheel.locator('.wh-c')).toContainText('Let go to open', { ignoreCase: true });
  await expect(wheel.locator('.wh-c .txt')).toContainText('Pokémon');
  await page.waitForTimeout(900);
  expect(await fitProblems(page, 'Map', 'map')).toEqual([]);
  await step(page, 'ArrowRight');
  await expect(lit).toHaveText('Bag', { ignoreCase: true });
  await step(page, 'ArrowLeft');
  await step(page, 'ArrowLeft');
  await expect(lit).toHaveText('Settings', { ignoreCase: true });
  await step(page, 'ArrowUp');
  await step(page, 'ArrowRight');
  await expect(lit).toHaveText('Bag', { ignoreCase: true });
  expect(await mapIndex(page)).toBe(at);
  // Letting go opens the lit one.
  await page.keyboard.up('Tab');
  await onPage(page, 'Map', 'bag');
  await expect(wheel).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('#phx .phs[data-scene="Map"][data-scr="bag"]')).toHaveCount(0);
  await page.waitForTimeout(300);

  // A tap leaves the wheel up: Enter opens, Esc shuts. A slot that cannot open (no rival yet) says so and opens nothing.
  await page.keyboard.press('Tab');
  await expect(wheel).toBeVisible();
  await expect(wheel.locator('.wh-c')).toContainText('Enter to open', { ignoreCase: true });
  await step(page, 'ArrowRight');
  await step(page, 'ArrowRight');
  await expect(lit).toHaveText('Rivals', { ignoreCase: true });
  await expect(wheel.locator('.wi.on')).toHaveClass(/\boff\b/);
  await expect(wheel.locator('.wh-c')).toContainText('Not yet', { ignoreCase: true });
  await step(page, 'Enter');
  await expect(wheel).toHaveCount(0);
  expect(await pageNow(page, 'Map')).toBe('map');
  expect(await mapBusy(page)).toBe(false);
  await page.keyboard.press('Tab');
  await expect(wheel).toBeVisible();
  await step(page, 'Escape');
  await expect(wheel).toHaveCount(0);
  // Esc shut the wheel only: the pause menu did not open.
  expect(await pageNow(page, 'Map')).toBe('map');
  expect(await mapBusy(page)).toBe(false);

  // By mouse: the key hint opens it, pointing lights a slot, a click beside the slots shuts it, a click on one opens it.
  await map.locator('.keys [data-act="key"][data-arg="Tab"]').click();
  await expect(wheel).toBeVisible();
  await wheel.locator('.wi', { hasText: /save/i }).hover();
  await expect(lit).toHaveText('Save', { ignoreCase: true });
  await wheel.locator('.ph-wh-dim').click({ position: { x: 40, y: 300 } });
  await expect(wheel).toHaveCount(0);
  expect(await mapBusy(page)).toBe(false);
  // Every version, at a phone-wide and a big window: nothing cut off.
  for (const [id, w, h] of [['midnight', 844, 390], ['channel', 1920, 1080], ['fantasia', 1024, 768], ['velvet', 1280, 720]] as const) {
    await version(page, id);
    await page.setViewportSize({ width: w, height: h });
    await page.keyboard.press('Tab');
    await expect(page.locator(`#phx .phs[data-scene="Map"][data-liv="${id}"] .ph-wh`)).toBeVisible();
    await step(page, 'ArrowDown');
    await step(page, 'ArrowDown');
    await step(page, 'ArrowDown');
    await step(page, 'ArrowDown');
    await expect(lit).toHaveText('Trainer card', { ignoreCase: true });
    await page.waitForTimeout(900);
    expect(await fitProblems(page, 'Map', 'map'), `${id} at ${w}x${h}`).toEqual([]);
    await step(page, 'Escape');
    await expect(wheel).toHaveCount(0);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await version(page, 'phantom');
  // The Trainer card opens from the wheel; Settings leaves the map and comes back to it.
  await map.locator('.keys [data-act="key"][data-arg="Tab"]').click();
  await wheel.locator('.wi', { hasText: /trainer card/i }).click();
  await onPage(page, 'Map', 'card');
  await step(page, 'Escape');
  await step(page, 'Escape');
  await onPage(page, 'Map', 'map');
  await page.waitForTimeout(250);
  await page.keyboard.down('Tab');
  await expect(wheel).toBeVisible();
  await page.waitForTimeout(300);
  await step(page, 'ArrowLeft');
  await expect(lit).toHaveText('Settings', { ignoreCase: true });
  await page.keyboard.up('Tab');
  await waitForScene(page, 'Settings');
  expect(errors).toEqual([]);
});

test('Phantom UI: the Log page reads the run back: the stage, what an event said, what you chose and what you got', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=phantom-event');
  await onPage(page, 'MainMenu', 'title');
  await toPhantomMap(page);
  const log = page.locator('#phx .phs[data-scene="overlay"][data-scr="log"]');
  const rows = (): Promise<[string, string, string][]> => page.evaluate(() => (window as any).__pkr.log.backlog().map((e: any) => [e.kind ?? 'note', e.who ?? '', e.text]));
  await expect(log).toHaveCount(0);
  // The map opens the run's log with the stage's heading; the wheel's Log slot opens the page.
  expect((await rows()).filter((r) => r[0] === 'stage').map((r) => r[1])).toEqual(['Stage 1']);
  await page.keyboard.press('Tab');
  await step(page, 'ArrowRight');
  await step(page, 'ArrowRight');
  await step(page, 'ArrowDown');
  await expect(page.locator('#phx .phs[data-scene="Map"] .ph-wh .wi.on b')).toHaveText('Log', { ignoreCase: true });
  await step(page, 'Enter');
  await expect(log).toBeVisible();
  await expect(log.locator('.hd')).toContainText('Stage map', { ignoreCase: true });
  await expect(log.locator('.lr.ph-lr-st b')).toHaveText('Stage 1', { ignoreCase: true });
  await page.waitForTimeout(900);
  expect(await fitProblems(page, 'overlay', 'log')).toEqual([]);
  // The page has the keys: Esc shuts it and does not open the pause menu under it.
  await step(page, 'Escape');
  await expect(log).toHaveCount(0);
  expect(await pageNow(page, 'Map')).toBe('map');
  expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy)).toBe(false);

  // An event: each page is told as it is read, then the choice, then the outcome and what changed.
  await addSide(page, { id: 'ph-ev', kind: 'event', used: false, eventId: 'an09-rusted-anchor' });
  await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('Map').scene.start('Event', { sideId: 'ph-ev' }));
  await waitForScene(page, 'Event');
  await onPage(page, 'Event', 'event');
  const before = await rows();
  expect(before.some((r) => r[0] === 'stage' && r[1] === 'Event')).toBe(true);
  const said = before.filter((r) => r[0] === 'say').length;
  expect(said).toBeGreaterThan(0);
  for (let n = 0; n < 8 && (await pageNow(page, 'Event')) === 'event'; n++) { await page.keyboard.press('Enter'); await page.waitForTimeout(350); }
  await onPage(page, 'Event', 'choice');
  expect((await rows()).filter((r) => r[0] === 'say').length).toBeGreaterThan(said);
  expect((await rows()).some((r) => r[0] === 'pick')).toBe(false);
  // The log opens over the event (Shift+L) and its keys do not reach the choices under it.
  const card = page.locator('#phx .phs[data-scene="Event"] .sy-cd');
  await expect(card.nth(0)).toHaveClass(/\bon\b/);
  await page.keyboard.press('Shift+L');
  await expect(log).toBeVisible();
  await expect(log.locator('.hd')).toContainText('Event', { ignoreCase: true });
  await step(page, 'ArrowRight');
  await step(page, 'ArrowUp');
  await step(page, '2');
  await expect(card.nth(0)).toHaveClass(/\bon\b/);
  expect(await pageNow(page, 'Event')).toBe('choice');
  await step(page, 'l');
  await expect(log).toHaveCount(0);
  const label = (await card.nth(0).locator('b').first().textContent())!.trim();
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await rows()).filter((r) => r[0] === 'pick').map((r) => r[2].toLowerCase())).toEqual([label.toLowerCase()]);
  await expect.poll(async () => (await rows()).at(-1)![0], { timeout: 10_000 }).not.toBe('pick');
  const result = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Event').result as { text: string; changes: string[] });
  const told = await rows();
  for (const c of result.changes) expect(told.some((r) => r[0] === 'gain' && r[2] === c.trim()), c).toBe(true);
  // Reading it back on the page: the newest row is lit, the choice is marked, the arrows walk up, a click lights a row.
  await page.waitForTimeout(600);
  await page.keyboard.press('Shift+L');
  await expect(log).toBeVisible();
  await expect(log.locator('.lr.pick')).toContainText('You chose', { ignoreCase: true });
  await expect(log.locator('.lr.pick')).toContainText(label, { ignoreCase: true });
  await expect(log.locator('.ph-lg-n')).toHaveText(`${told.length} / ${told.length}`);
  await expect(log.locator('.lr').last()).toHaveClass(/\bon\b/);
  await step(page, 'ArrowUp');
  await expect(log.locator('.ph-lg-n')).toHaveText(`${told.length - 1} / ${told.length}`);
  await step(page, 'Home');
  await expect(log.locator('.ph-lg-n')).toHaveText(`1 / ${told.length}`);
  await expect(log.locator('.lr').first()).toHaveClass(/\bon\b/);
  await log.locator('.lr').nth(1).click();
  await expect(log.locator('.ph-lg-n')).toHaveText(`2 / ${told.length}`);
  await step(page, 'End');
  for (const [id, w, h] of [['midnight', 844, 390], ['channel', 700, 900], ['fantasia', 1920, 1080], ['velvet', 1280, 720]] as const) {
    await page.evaluate((id) => { const pkr = (window as any).__pkr; pkr.session.saveSettings({ ...pkr.session.settings, phantomVersion: id }); }, id);
    await page.setViewportSize({ width: w, height: h });
    await step(page, 'q');
    await expect(page.locator(`#phx .phs[data-scene="overlay"][data-scr="log"][data-liv="${id}"]`)).toBeVisible();
    await page.waitForTimeout(900);
    expect(await fitProblems(page, 'overlay', 'log'), `${id} at ${w}x${h}`).toEqual([]);
    await step(page, 'e');
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  // A click beside the rows shuts it; the event under it is where it was.
  await log.locator('.ph-fill').click({ position: { x: 1240, y: 300 } });
  await expect(log).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__pkr.activeScene())).toBe('Event');
  expect(errors).toEqual([]);
});
