import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D28 (round-4 mockups m5-m7): getting around. Hold Q for the command wheel (point with the arrows,
// let go to jump; digits, R and Backspace jump straight), the Boss's board (M on the wheel) with a photo for every page,
// every page you can walk into reached from both, the crimson shutter between pages (a fade on Lighter, none on Calm),
// the Rotom and Boss Menu places (D27's pages), and no wheel before the run opens. Nothing here is saved.

async function newDominion(page: Page) {
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'dominion' });
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Dominion');
  const s = view(page, 'Dominion');
  await expect(s.getByTestId('dom-logo')).toBeVisible();
  await page.waitForTimeout(300);
  // Boundary: before the run opens (the title card) Q opens nothing.
  await page.keyboard.down('KeyQ');
  await page.waitForTimeout(200);
  await expect(s.getByTestId('dom-wheel')).toHaveCount(0);
  await page.keyboard.up('KeyQ');
  await s.getByTestId('dom-title-0').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-type-poison').click();
  await s.getByTestId('dom-type-dark').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-next').click();
  // The opening's lines: click until the HQ shows (a click can land while a line is still typing).
  await expect(async () => {
    if (await s.getByTestId('dom-opening').isVisible()) await s.getByTestId('dom-opening').click({ timeout: 1000 });
    await expect(s.getByTestId('dom-phase')).toHaveText('EVENING', { timeout: 1000 });
  }).toPass({ timeout: 30_000 });
  return s;
}

const here = (page: Page): Promise<string | null> => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Dominion').navHere());
const block = (page: Page) => page.evaluate(() => JSON.stringify((window as any).__pkr.session.run.expansion.dominion));

/** Holds Q until the wheel is up (a press can be lost in a busy headless frame; the drawing can lag a frame behind, so
 *  this reads the scene's state, not the page). */
const wheelUp = (page: Page): Promise<boolean> => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Dominion').nav.wheel);
async function holdQ(page: Page, s: ReturnType<typeof view>) {
  await expect(async () => {
    if (!(await wheelUp(page))) {
      await page.keyboard.up('KeyQ');
      await page.keyboard.down('KeyQ');
    }
    await expect.poll(() => wheelUp(page), { timeout: 1500 }).toBe(true);
  }).toPass({ timeout: 15_000 });
  await expect(s.getByTestId('dom-wheel')).toBeVisible();
}

async function hereIs(page: Page, want: string | RegExp) {
  await expect.poll(() => here(page), { timeout: 10_000 }).toMatch(want instanceof RegExp ? want : new RegExp(`^${want}$`));
}

test('the command wheel: hold Q, point, let go to jump; digits, R and Backspace; the Q chip for the mouse', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  const s = await newDominion(page);
  await hereIs(page, 'hq');
  const before = await block(page);

  // Hold Q: the wheel opens over the HQ with nothing pointed; the pinned column and the hub talk about the save.
  await holdQ(page, s);
  await expect(s.getByTestId('dom-wheel-hub')).toContainText('let go of Q');
  for (let i = 0; i < 8; i++) await expect(s.getByTestId(`dom-wheel-spot-${i}`)).toBeVisible();
  // Boundary: let go with nothing pointed just closes it, on the same page.
  await page.keyboard.up('KeyQ');
  await expect(s.getByTestId('dom-wheel')).toBeHidden();
  await hereIs(page, 'hq');

  // The arrows point (starting from the place you are on), the middle says what waits there.
  await holdQ(page, s);
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('dom-wheel-spot-0')).toHaveClass(/\bon\b/);
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('dom-wheel-spot-1')).toHaveClass(/\bon\b/);
  await expect(s.getByTestId('dom-wheel-hub')).toContainText('Region Map');
  await shot('m6-wheel');
  await page.keyboard.up('KeyQ');
  await hereIs(page, 'map');
  // The crimson shutter plays on the way (blade by default) and leaves on its own, never taking a tap.
  await expect(s.getByTestId('dom-shutter')).toHaveAttribute('data-mode', 'blade');
  await expect(s.getByTestId('dom-shutter')).toBeHidden({ timeout: 3000 });

  // Digits jump straight to a tab's place; the last pages list remembers, newest first.
  await holdQ(page, s);
  await page.keyboard.press('Digit3');
  await page.keyboard.up('KeyQ');
  await hereIs(page, 'crew');
  await holdQ(page, s);
  await expect(s.getByTestId('dom-wheel-last-0')).toContainText('Region Map');
  await expect(s.getByTestId('dom-wheel-last-1')).toContainText('HQ');
  // Backspace on the wheel: back to the last page (and not also Back on that page).
  await page.keyboard.press('Backspace');
  await page.keyboard.up('KeyQ');
  await hereIs(page, 'map');

  // Failure: Operations isn't open yet: the place is dim and says so; you stay where you are.
  await holdQ(page, s);
  await expect(s.getByTestId('dom-wheel-spot-4')).toHaveClass(/dim4/);
  await page.keyboard.press('Digit5');
  await page.keyboard.up('KeyQ');
  await hereIs(page, 'map');

  // The mouse: on a page with a key strip (the Crew File), tap the Q chip, then tap a place.
  await holdQ(page, s);
  await page.keyboard.press('Digit3');
  await page.keyboard.up('KeyQ');
  await hereIs(page, 'crew');
  await s.locator('.keys .q4').first().click();
  await expect(s.getByTestId('dom-wheel')).toBeVisible();
  await s.getByTestId('dom-wheel-spot-5').click();
  await hereIs(page, 'ledger');
  // A tap on the middle closes it where you are.
  await s.locator('.keys .q4').first().click();
  await s.getByTestId('dom-wheel-hub').click();
  await expect(s.getByTestId('dom-wheel')).toBeHidden();
  await hereIs(page, 'ledger');

  // Moving around changed nothing in the save.
  expect(await block(page)).toBe(before);
  expect(errors).toEqual([]);
});

test('the Boss\'s board: every page has a photo, and every page you can walk into opens from it and from the wheel', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  const s = await newDominion(page);

  // M on the wheel opens the board (sheet 1 is m5); Tab turns to the back rooms; Esc goes back.
  await holdQ(page, s);
  await page.keyboard.press('KeyM');
  await page.keyboard.up('KeyQ');
  await expect(s.getByTestId('dom-pin-menu')).toBeVisible();
  await expect(s.getByTestId('dom-pin-hq')).toHaveClass(/on4/);
  await page.waitForTimeout(500);
  await shot('m5-board');
  await page.keyboard.press('Tab');
  await expect(s.getByTestId('dom-pin-pyramid')).toBeVisible();
  await shot('m5-board-back-rooms');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-pin-pyramid')).toBeHidden();
  await hereIs(page, 'hq');

  // Every photo you can walk into, from the board (a click) and from the wheel (its place, then the page's own key).
  // It is the first evening of a new run.
  const want: Record<string, RegExp> = {
    hq: /^hq$/, morning: /^hq$/, assign: /^hq$/, chair: /^hq$/, crew: /^crew$/, ledger: /^ledger$/, map: /^map$/, district: /^map$/,
    card: /^map$/, takeover: /^map$/, base: /^base$/, rival: /^rival$/, hero: /^hero$/, voices: /^voices$/,
    persona: /^persona$/, pyramid: /^pyramid$/, squads: /^squads$/, reserve: /^reserve$/, desk: /^desk$/,
    menu: /^menu$/, settings: /^settings$/, rotom: /^settings$/,
  };
  const board = async () => {
    await holdQ(page, s);
    await page.keyboard.press('KeyM');
    await page.keyboard.up('KeyQ');
    await expect(s.getByTestId('dom-board-keys')).toBeVisible();
  };
  for (const [id, re] of Object.entries(want)) {
    await board();
    const pin = s.getByTestId(`dom-pin-${id}`);
    if (!(await pin.isVisible())) await page.keyboard.press('Tab');
    await pin.first().click();
    await hereIs(page, re);
    // Back to the HQ through the wheel's first place before the next one.
    await holdQ(page, s);
    await page.keyboard.press('Digit1');
    await page.keyboard.up('KeyQ');
    await hereIs(page, 'hq');
  }
  // The Founding opens once the first steps are done: on day 1 the jump says so (the page's own O key says the same).
  await board();
  await page.keyboard.press('Tab');
  await s.getByTestId('dom-pin-founding').click();
  await hereIs(page, 'hq');
  await expect(s.getByText(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Dominion').notice))).toBeVisible();

  // Pages that come to you can't be walked into: the photo says so.
  await board();
  await page.keyboard.press('Tab');
  await s.getByTestId('dom-pin-police').click();
  await expect(s.getByText('That page comes to you')).toBeVisible();
  await hereIs(page, 'hq');
  expect(errors).toEqual([]);
});

test('Rotom and the Boss Menu places open over the page and Esc comes back; Lighter fades, Calm has no shutter; three sizes', async ({ page }, info) => {
  const errors = watch(page);
  await start(page, 'ui=new');
  const s = await newDominion(page);
  await holdQ(page, s);
  await page.keyboard.press('Digit6');
  await page.keyboard.up('KeyQ');
  await hereIs(page, 'ledger');

  // R on the wheel: the Rotom tab of the Boss Menu's Settings, over the Ledger; Esc steps back out to the Ledger.
  await holdQ(page, s);
  await page.keyboard.press('KeyR');
  await page.keyboard.up('KeyQ');
  await hereIs(page, 'settings');
  await expect(async () => {
    if ((await here(page)) !== 'ledger') await page.keyboard.press('Escape');
    expect(await here(page)).toBe('ledger');
  }).toPass({ timeout: 15_000 });
  // Esc on the wheel is the Boss Menu's place.
  await holdQ(page, s);
  await page.keyboard.press('Escape');
  await page.keyboard.up('KeyQ');
  await hereIs(page, 'menu');
  await holdQ(page, s);
  await page.keyboard.press('Digit6');
  await page.keyboard.up('KeyQ');
  await hereIs(page, 'ledger');

  // Settings · Effects & motion: Lighter makes it a plain fade.
  const fx = (level: string) => page.evaluate((lv) => {
    const x = (window as any).__pkr.session;
    const f = lv === 'calm' ? { level: lv, particles: false, cutIns: 'skip', shake: false, flashes: 'off' } : { level: lv, particles: false, cutIns: 'show', shake: true, flashes: 'soft' };
    x.saveSettings({ ...x.settings, expansion: { ...x.settings.expansion, dominionPrefs: { ...x.settings.expansion.dominionPrefs, fx: f } } });
  }, level);
  await fx('lighter');
  await holdQ(page, s);
  await page.keyboard.press('Digit2');
  await page.keyboard.up('KeyQ');
  await expect(s.getByTestId('dom-shutter')).toHaveAttribute('data-mode', 'fade');
  await hereIs(page, 'map');
  // Calm: no shutter at all.
  await fx('calm');
  await page.waitForTimeout(500);
  await holdQ(page, s);
  await page.keyboard.press('Digit1');
  await page.keyboard.up('KeyQ');
  await hereIs(page, 'hq');
  await expect(s.getByTestId('dom-shutter')).toHaveCount(0);

  for (const [w, h] of [[1280, 720], [960, 540], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(200);
    await holdQ(page, s);
    await expect(s.getByTestId('dom-wheel-spot-7')).toBeInViewport();
    await page.screenshot({ path: info.outputPath(`wheel-${w}x${h}.png`) });
    await page.keyboard.up('KeyQ');
    await expect(s.getByTestId('dom-wheel')).toBeHidden();
  }
  expect(errors).toEqual([]);
});
