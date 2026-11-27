import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION redesign R9 (pass 50 of plans/evil-mode-rework/redesign-50): Settings (home, categories and the pages around
// them), Rotom's Key-Card vault and the command wheel. Shots go to the test's output folder for the side-by-side check
// against the mockups (`?bare&still&pass=50&s=<id>`). Settings change the settings record only, never the run.

test.use({ viewport: { width: 960, height: 540 } });

async function toHq(page: Page) {
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
  await s.getByTestId('dom-title-0').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-type-poison').click();
  await s.getByTestId('dom-type-dark').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-next').click();
  for (let i = 0; i < 4; i++) await s.getByTestId('dom-opening').click();
  await expect(s.getByTestId('r5-hq')).toBeVisible();
  return s;
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);
const look = (page: Page) => page.evaluate(() => (window as any).__pkr.session.settings.expansion.dominionPrefs.look);
const prefs = (page: Page) => page.evaluate(() => (window as any).__pkr.session.settings.expansion.dominionPrefs);
/** Opens a Settings page by its mockup id, the way a chrome link does (the scene's own `r5go`). */
const goTo = (page: Page, id: string) => page.evaluate((x) => { const sc = (window as any).__pkr.game.scene.getScene('Dominion'); sc.menu.go(x); sc.view?.refresh(); }, id);

test('Settings, the pages around it, the vault and the wheel in the pass-50 look', async ({ page }, info) => {
  test.setTimeout(240_000);
  const shot = async (n: string, wait = Number(process.env.R5_WAIT ?? 600)) => {
    await page.waitForTimeout(wait);
    await page.screenshot({ path: info.outputPath(`${n}.png`) });
    if (process.env.R5_DUMP) writeFileSync(info.outputPath(`${n}.html`), await page.locator('#r5').first().innerHTML());
  };
  const errors = watch(page);
  await start(page, 'ui=new&tutorial=0');
  const s = await toHq(page);
  const before = await block(page);

  // Esc, then S: the Settings home with its eight tiles; arrows move, Enter opens.
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-menu')).toBeVisible();
  await page.keyboard.press('KeyS');
  await expect(s.getByTestId('r5-set')).toBeVisible();
  await expect(s.locator('[data-testid^="r5-set-tile-"]')).toHaveCount(8);
  await expect(s.getByTestId('r5-set-tile-dominion')).toHaveClass(/\bon\b/);
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('r5-set-tile-rotom')).toHaveClass(/\bon\b/);
  await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('r5-set-tile-controls')).toHaveClass(/\bon\b/);
  await page.keyboard.press('ArrowLeft');
  await expect(s.getByTestId('r5-set-tile-access')).toHaveClass(/\bon\b/);
  await shot('set');

  // Dominion: rows with segments and switches, the rail, the preview. Heat warnings off reaches the look.
  await s.getByTestId('r5-set-tile-dominion').click();
  await expect(s.getByTestId('r5-setdom')).toBeVisible();
  await expect(s.getByTestId('dom-set-row-0')).toContainText('Tutorial');
  await shot('setdom');
  // Five rows show at a time; the arrows scroll the rest in.
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowDown');
  await s.getByTestId('dom-set-row-5').locator('.sw').click();
  await expect.poll(async () => (await look(page)).heatWarn).toBe(false);
  await s.getByTestId('dom-set-row-5').locator('.sw').click();
  // The Chair rows scroll in under the run rows.
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('dom-set-row-9')).toContainText('The Chair');
  await expect(s.getByTestId('dom-set-row-9')).toHaveClass(/\bon\b/);

  // Tab walks the categories: Rotom, Effects, Sound, Captions, Access, Screen.
  for (const [pid, n] of [['rotom', 'rotom'], ['seteff', 'seteff'], ['setsnd', 'setsnd'], ['captions', 'captions'], ['access', 'access'], ['hud', 'hud']] as const) {
    await page.keyboard.press('Tab');
    await expect(s.getByTestId(`r5-${pid}`)).toBeVisible();
    await shot(n);
  }
  await expect(view(page, 'Dominion')).not.toContainText(/Claude|\bAI\b/);

  // Screen: News ticker Off and Key hints Icons go on every page's root.
  await s.getByTestId('dom-set-row-1').getByText('Off', { exact: true }).click();
  await s.getByTestId('dom-set-row-2').getByText('Icons', { exact: true }).click();
  await expect.poll(async () => [(await look(page)).ticker, (await look(page)).keyHints]).toEqual(['off', 'icons']);
  await expect(s.locator('#r5')).toHaveAttribute('data-keys', 'icons');
  await page.keyboard.press('KeyD');
  await expect.poll(async () => (await look(page)).keyHints).toBe('full');

  // Effects: Calm from the Show row stops every move.
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-set')).toBeVisible();
  await s.getByTestId('r5-set-tile-fx').click();
  await s.getByTestId('dom-fx-calm').click();
  await expect.poll(async () => (await prefs(page)).fx.level).toBe('calm');
  await expect(page.locator('#rx .domfx.fx-calm')).toHaveCount(1);
  expect(await s.locator('.dial-ring, .pv-blade, .sw').first().evaluate((e) => getComputedStyle(e, '::after').animationName)).toBe('none');
  await s.getByTestId('dom-fx-full').click();

  // The pages around the categories.
  for (const id of ['save', 'controls', 'options', 'calm', 'colours', 'readaloud', 'feel', 'skins', 'ambience', 'vault']) {
    await goTo(page, id);
    await expect(s.getByTestId(`r5-${id}`)).toBeVisible();
    await shot(id);
  }

  // Calm mode: Enter flips it both ways.
  await goTo(page, 'calm');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await prefs(page)).fx.level).toBe('calm');
  await expect(s.getByTestId('r5-calm-state')).toContainText('On');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await prefs(page)).fx.level).toBe('full');

  // Colour assist: Shapes puts a shape on the Heat chip.
  await goTo(page, 'colours');
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await look(page)).colour).toBe('shapes');
  await expect(s.locator('#r5')).toHaveAttribute('data-colour', 'shapes');
  expect(await s.locator('.heat b').first().evaluate((e) => getComputedStyle(e, '::before').content)).toContain('▲');
  await shot('colours-on');
  // Esc goes back to Access.
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-access')).toBeVisible();

  // Options: a frame by tap; Button feel: the cursor.
  await goTo(page, 'options');
  await s.getByTestId('dom-set-row-5').locator('.fp25 i').nth(1).click();
  await expect.poll(async () => (await look(page)).frame).toBe('gold');
  await expect(s.locator('#r5')).toHaveAttribute('data-frame', 'gold');
  await goTo(page, 'feel');
  await s.getByTestId('r5-cursor-arrow').click();
  await expect.poll(async () => (await look(page)).cursor).toBe('arrow');

  // Region skin: Johto by tap puts the gold skin on the pages; following the region again takes it off.
  await goTo(page, 'skins');
  await s.getByTestId('r5-skin-johto').click();
  await expect(s.locator('#r5 .scr.sk-johto')).toHaveCount(1);
  await shot('skins-johto');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await look(page)).skin).toBe('region');

  // Save and quit: Back to the Boss Menu.
  await goTo(page, 'save');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('r5-menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-hq')).toBeVisible();

  // The wheel (hold Q): the Nova Dial over the HQ.
  await page.keyboard.down('KeyQ');
  await expect(s.getByTestId('dom-wheel')).toBeVisible();
  // The first arrow points at the first place, the next one moves round.
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('dom-wheel-spot-0')).toHaveClass(/\bon\b/);
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('dom-wheel-spot-1')).toHaveClass(/\bon\b/);
  await shot('wheel');
  await page.keyboard.up('KeyQ');
  await expect(s.getByTestId('dom-wheel')).toHaveCount(0);

  // Nothing in the run moved; the settings survive a reload.
  expect(await block(page)).toEqual(before);
  const kept = await look(page);
  await page.goto('/?ui=new');
  await waitForScene(page, 'MainMenu');
  expect(await look(page)).toEqual(kept);
  expect(errors).toEqual([]);
});
