import { writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { addSide, open, view, waitForScene, watch } from './helpers/newUi';

// Greenneedle gn.18, Safari Land as a walkable zone (New UI): the park's grid is walked with the keyboard, the mouse and
// the on-screen pad; the camera, an encounter and a photograph; a Kanto scene inside the park and back; the far gate's door.
// The rules are tested in tests/unit/gnscreen-safari.test.ts; this plays the screen through and checks for console errors.

const park = (page: Page) => page.evaluate(() => {
  const s = (window as any).__pkr.session.run.minigame?.state;
  return s ? { x: s.x, y: s.y, area: s.area, steps: s.steps, mode: s.mode, spot: s.spot, camera: s.camera, shots: s.shots, balls: s.balls, seen: s.seen, mon: s.mon?.species ?? null } : null;
});
/** The test's hand: put the visitor somewhere (and set what the visit knows), then redraw. */
async function put(page: Page, patch: Record<string, unknown>) {
  await page.evaluate((patch) => Object.assign((window as any).__pkr.session.run.minigame.state, { mode: 'walk', mon: null, spot: null, shot: null }, patch), patch);
  await open(page, 'Minigame');
}
async function enterPark(page: Page, seed: string) {
  // The same steps as helpers/newUi.ts `start` and `toMap`, with room for a slow machine (the first load is the long part).
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/?ui=new&seed=${seed}`);
  await waitForScene(page, 'MainMenu', 150_000);
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next, 60_000);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 60_000 }).toBe(false);
  await addSide(page, { id: 'gn-park', kind: 'minigame', used: false, minigameId: 'gn-safari' });
  await page.evaluate(() => void (window as any).__pkr.session.beginMinigame('gn-park', 0));
  await open(page, 'Minigame');
  await expect(view(page, 'Minigame').locator('.pk-field')).toBeVisible();
}
/** A picture of the screen for the report, at twice the size: only when SAFARI_SHOT names a .png to write. */
async function shot(page: Page, suffix: string) {
  const file = process.env.SAFARI_SHOT;
  if (!file) return;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 2, mobile: false });
  await page.waitForTimeout(500);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(file.replace(/\.png$/, `${suffix}.png`), Buffer.from(data, 'base64'));
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await cdp.detach();
  await page.waitForTimeout(300);
}
/** One key press, then long enough for its step's slide to finish (a press made during a slide waits for it). */
const press = async (page: Page, key: string) => {
  await page.keyboard.press(key);
  await page.waitForTimeout(260);
};

test.setTimeout(420_000);

test('Safari Land: walk the grid, borrow the camera, photograph a Pokémon, and take a door at the far gate', async ({ page }) => {
  const errors = watch(page);
  await enterPark(page, 'gnscreen-safari');
  const v = view(page, 'Minigame');
  await expect(v).toContainText('Safari Land');
  await expect(v).toContainText('The Gatehouse Plain');
  await expect(v).toContainText('Warden Baoba-Lin');
  expect(await park(page)).toMatchObject({ x: 1, y: 3, area: 0, steps: 500, balls: 30 });

  // Keyboard: a tile is a step. A tree turns you and costs nothing.
  await press(page, 'ArrowRight');
  await press(page, 'ArrowUp');
  expect(await park(page)).toMatchObject({ x: 2, y: 2, steps: 498 });
  await press(page, 'ArrowUp');
  await press(page, 'ArrowUp');
  expect(await park(page)).toMatchObject({ x: 2, y: 1, steps: 497 });
  // The on-screen pad and a click on the grid walk too.
  await v.locator('[data-act="go"][data-arg="left"]').click();
  await expect(v).toContainText('The gatehouse wall');
  await expect(v.locator('.pk-photo')).toBeVisible();
  await v.locator('.pk-hit[data-arg="2,1"]').click();
  await v.locator('.pk-hit[data-arg="3,1"]').click();
  await expect.poll(async () => (await park(page))!.mode, { timeout: 5000 }).toBe('spot');
  expect(await park(page)).toMatchObject({ x: 3, y: 1, mode: 'spot', spot: 'camera' });
  // The question opens on "Not now"; the camera is a click (or Left, Enter).
  await expect(v.locator('.btn.on')).toHaveText('Not now');
  await v.locator('[data-act="pick"]', { hasText: 'Borrow the camera' }).click();
  expect(await park(page)).toMatchObject({ camera: true, mode: 'walk' });

  // Into the tall grass until something comes out (Enter waits; the arrows walk).
  await put(page, { x: 8, y: 2, familySeen: true, quiet: 6 });
  for (let i = 0; i < 120 && (await park(page))!.mode !== 'meet'; i++) await press(page, i % 2 ? 'ArrowLeft' : 'ArrowRight');
  const met = await park(page);
  expect(met!.mode).toBe('meet');
  await expect(v).toContainText(/catch \d+%, wanders off \d+%/);
  await expect(v.locator('[data-act="pick"]', { hasText: 'Throw a Ball' })).toBeVisible();
  await shot(page, '');
  await v.locator('[data-act="pick"]', { hasText: 'Take a photo' }).click();
  expect((await park(page))!.shots).toBe(1);
  if ((await park(page))!.mode === 'meet') {
    await expect(v.locator('.pk-photo')).toBeVisible();
    await expect(v.locator('.pk-plate')).not.toHaveText('');
    await shot(page, '-photo');
    // Esc backs off (Leave).
    await press(page, 'Escape');
  }
  expect((await park(page))!.mode).toBe('walk');

  // The far gate, in the Far Marsh: the warden's line, the two doors; the Deep Savanna opens as soon as the visit is over.
  await put(page, { area: 3, x: 13, y: 3, migrationSeen: true, quiet: 5 });
  await expect(v).toContainText('The Far Marsh');
  await press(page, 'ArrowRight');
  await expect(v).toContainText("Beyond here, it isn't a park.");
  await expect(v.locator('.btn.on')).toHaveText('Turn back');
  await v.locator('[data-act="pick"]', { hasText: 'The Deep Savanna' }).click();
  await expect(v).toContainText('Fair enough', { timeout: 10_000 });
  await page.waitForTimeout(400);
  await press(page, 'Enter');
  await waitForScene(page, 'Event');
  await expect(view(page, 'Event')).toContainText('The Deep Savanna');
  expect(errors).toEqual([]);
});

test('Safari Land in Kanto: the Tauros Stampede happens inside the park, and the visit goes on afterwards', async ({ page }) => {
  const errors = watch(page);
  await enterPark(page, 'gnscreen-safari-kanto');
  const v = view(page, 'Minigame');
  await put(page, { x: 9, y: 3, familySeen: true, kanto: ['cs-kanto-fuchsia-tauros', 'cs-kanto-fuchsia-warden'] });
  await press(page, 'ArrowRight');
  expect(await park(page)).toMatchObject({ x: 10, y: 3, mode: 'spot', spot: 'stampede' });
  await press(page, 'ArrowLeft');
  await press(page, 'ArrowLeft');
  await expect(v.locator('.btn.on')).toHaveText('Stand and watch it come');
  await press(page, 'Enter');
  await waitForScene(page, 'Event');
  const ev = view(page, 'Event');
  await expect(ev).toContainText('Tauros Stampede');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.phase)).toBe('map');
  await ev.locator('[data-act="pick"]').first().click();
  await expect(ev.locator('[data-act="next"]').first()).toBeVisible({ timeout: 10_000 });
  // The outcome's pages, then its results: Next until the event closes.
  for (let i = 0; i < 20 && (await page.evaluate(() => (window as any).__pkr.activeScene())) === 'Event'; i++) {
    await page.waitForTimeout(1500);
    await ev.locator('[data-act="next"]').first().dispatchEvent('click', undefined, { timeout: 5000 }).catch(() => undefined);
  }
  // Back on the same tile, the visit on again, the spot gone.
  await waitForScene(page, 'Minigame');
  await expect(v.locator('.pk-field')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__pkr.session.run.phase)).toBe('minigame');
  expect(await park(page)).toMatchObject({ x: 10, y: 3, mode: 'walk', balls: 30, seen: ['cs-kanto-fuchsia-tauros'] });
  await press(page, 'ArrowRight');
  expect((await park(page))!.x).toBe(11);
  // Leaving by the pad's button ends the visit: the warden's verdict shows.
  await put(page, { x: 1, y: 3 });
  await v.locator('[data-act="do"][data-arg="exit"]').click();
  await expect(v).toContainText('Warden:', { timeout: 10_000 });
  await page.waitForTimeout(400);
  await press(page, 'Enter');
  await waitForScene(page, 'Map');
  expect(errors).toEqual([]);
});
