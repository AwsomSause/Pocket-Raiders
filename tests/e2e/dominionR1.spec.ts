import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION redesign R1 (pass 50 of plans/evil-mode-rework/redesign-50): the Start pages (title, help, Boss, team
// types, first member, Charters, the opening talk, the Founding, the sign) and the Guide pages (Lesson Book, Style
// sheet, Motion sheet, X-ray, How pages connect). With R5_DUMP=1, shots go to the test's output folder for the side-by-side check
// against the mockups (`?bare&still&pass=50&s=<id>`). Nothing a page draws changes the run.

test.use({ viewport: { width: 960, height: 540 } });
test.setTimeout(process.env.R5_DUMP ? 240_000 : 90_000);

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);

async function toTitle(page: Page) {
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
  await expect(s.getByTestId('r5-title')).toBeVisible();
  await page.waitForTimeout(300);
  return s;
}

test('the pass-50 Start pages: title, help, Boss, types, member, Charters, opening, Founding, sign', async ({ page }, info) => {
  // Shots only when asked (R5_DUMP=1): they wait for the page's entry motion and toasts to settle.
  const shot = async (n: string) => {
    if (!process.env.R5_DUMP) return;
    await page.waitForTimeout(6000);
    await page.screenshot({ path: info.outputPath(`${n}.png`) });
    writeFileSync(info.outputPath(`${n}.html`), await page.locator('#r5').innerHTML());
  };
  const errors = watch(page);
  await start(page, 'ui=new&tutorial=1');
  const s = await toTitle(page);

  // The title: no run yet, so New Dominion is first; arrows walk the five rows.
  await expect(s.getByTestId('dom-title-1')).toHaveCount(0);
  await expect(s.getByTestId('dom-title-0')).toHaveClass(/\bon\b/);
  await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('dom-title-tut')).toHaveClass(/\bon\b/);
  await page.keyboard.press('ArrowUp');
  await shot('title');

  // How much help? (the tutorial is asked for): three rows, 3 picks No help and goes to the Boss.
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('r5-tut')).toBeVisible();
  await expect(s.getByTestId('dom-tut-help-full')).toHaveClass(/\bon\b/);
  await shot('tut');
  await page.keyboard.press('Digit3');

  // The Boss: portrait, the three Pokémon, notes; the Charters are locked on a new profile.
  await expect(s.getByTestId('dom-setup-boss')).toBeVisible();
  await expect(s.getByTestId('dom-setup-charter-chip')).toContainText('Charters');
  await shot('boss');
  await page.keyboard.press('KeyC');
  await expect(s.getByTestId('dom-setup-charters')).toBeVisible();
  await expect(s.getByTestId('dom-charter-lock')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await shot('nextrun');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-setup-boss')).toBeVisible();
  await s.getByTestId('dom-next').click();

  // The types: one list; Next with none picked says why; every type row is reachable (the list scrolls).
  await expect(s.getByTestId('dom-setup-types')).toBeVisible();
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-problem')).toHaveText('Pick two Team Types.');
  await s.getByTestId('dom-type-poison').click();
  await s.getByTestId('dom-type-dark').click();
  await expect(s.getByTestId('dom-type-dark')).toContainText('Picked');
  await page.keyboard.press('ArrowUp');
  await expect(s.getByTestId('dom-type-ghost')).toHaveClass(/\bon\b/);
  await expect(s.getByTestId('dom-type-ghost')).toBeInViewport();
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowUp');
  await expect(s.getByTestId('dom-type-poison')).toHaveClass(/\bon\b/);
  await expect(s.getByTestId('dom-type-poison')).toBeInViewport();
  await shot('setup');
  await s.getByTestId('dom-next').click();

  // The first member: Grunt or Admin, five skills.
  await expect(s.getByTestId('dom-member-grunt')).toBeVisible();
  await shot('member');
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('dom-setup-member')).not.toContainText('Rook');
  await page.keyboard.press('ArrowLeft');
  await expect(s.getByTestId('dom-setup-member')).toContainText('Rook');
  await s.getByTestId('dom-next').click();

  // The opening talk: Rook and the Boss, one line at a time.
  await expect(s.getByTestId('r5-cold')).toBeVisible();
  await page.keyboard.press('Enter');
  await shot('cold');
  for (let i = 0; i < 3; i++) await s.getByTestId('dom-opening').click();
  await expect(s.getByTestId('r5-hq')).toBeVisible();

  // The Founding (First Steps done, Street Gang reached, as dominionFounding.spec sets it).
  await page.evaluate(() => {
    const b = (window as any).__pkr.session.run.expansion.dominion;
    b.stepsDone = ['earn-500', 'contact'];
    b.empire.peak = 1;
  });
  await page.keyboard.press('Digit1');
  await page.keyboard.press('KeyO');
  await expect(s.getByTestId('r5-found')).toBeVisible();
  await expect(s.getByTestId('dom-f-ideas')).toBeVisible();
  await shot('found');
  await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('dom-f-primary')).toHaveClass(/\bon\b/);
  await shot('found-colours');
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await shot('found-goal');
  const before = await block(page);
  expect(before.team ?? null).toBeNull();
  await s.getByTestId('dom-f-found').click();
  await expect(s.getByTestId('r5-sign')).toBeVisible();
  await expect(s.getByTestId('dom-sign-name')).not.toHaveText('');
  await shot('sign');
  for (let i = 0; i < 3; i++) await s.getByTestId('dom-founded').click();
  await expect(s.getByTestId('r5-hq')).toBeVisible();

  // Reload: back on the title, Continue is first and carries the run.
  await page.goto('/?ui=new&tutorial=0');
  await waitForScene(page, 'MainMenu');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.continueRun();
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  });
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
  await expect(s.getByTestId('dom-title-1')).toBeVisible();
  await expect(s.getByTestId('dom-title-1')).toHaveClass(/\bon\b/);
  await expect(s.getByTestId('dom-title-1')).toContainText('Day');
  await shot('title-continue');
  expect(errors).toEqual([]);
});

test('the pass-50 Guide pages: Lesson Book, Style and Motion sheets, X-ray, How pages connect', async ({ page }, info) => {
  // Shots only when asked (R5_DUMP=1): they wait for the page's entry motion and toasts to settle.
  const shot = async (n: string) => {
    if (!process.env.R5_DUMP) return;
    await page.waitForTimeout(6000);
    await page.screenshot({ path: info.outputPath(`${n}.png`) });
    writeFileSync(info.outputPath(`${n}.html`), await page.locator('#r5').innerHTML());
  };
  const errors = watch(page);
  await start(page, 'ui=new&tutorial=0');
  const s = await toTitle(page);

  // The title's Tutorial row opens the Lesson Book; Esc comes back to the title.
  await s.getByTestId('dom-title-tut').click();
  await expect(s.getByTestId('r5-lessons')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-title')).toBeVisible();

  await s.getByTestId('dom-title-0').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-type-poison').click();
  await s.getByTestId('dom-type-dark').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-next').click();
  for (let i = 0; i < 4; i++) await s.getByTestId('dom-opening').click();
  await expect(s.getByTestId('r5-hq')).toBeVisible();
  const before = await block(page);

  // Boss Menu › Lessons: the book; arrows walk the 5-wide grid.
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-menu')).toBeVisible();
  await s.getByTestId('dom-blade-lessons').click();
  await expect(s.getByTestId('r5-lessons')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(s.locator('[data-testid^="dom-tut-lesson-"]').nth(7)).toHaveClass(/\bon\b/);
  await shot('lessons');

  // K: the Style sheet; Enter: the Motion sheet; Esc back to the book.
  await page.keyboard.press('KeyK');
  await expect(s.getByTestId('r5-style')).toBeVisible();
  await shot('style');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('r5-motion')).toBeVisible();
  await shot('motion');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-lessons')).toBeVisible();

  // I: Rotom's X-ray over the HQ, two parts.
  await page.keyboard.press('KeyI');
  await expect(s.getByTestId('r5-xray')).toBeVisible();
  await expect(s.getByTestId('r5-xray-0')).toContainText('Team emblem');
  await shot('xray-1');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('r5-xray-0')).toContainText('HQ level');
  await shot('xray');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-hq')).toBeVisible();

  // Hold Q, M: How pages connect; Tab turns to the back rooms; Esc closes.
  await page.keyboard.down('KeyQ');
  await page.waitForTimeout(200);
  await page.keyboard.press('KeyM');
  await page.keyboard.up('KeyQ');
  await expect(s.getByTestId('r5-board')).toBeVisible();
  await expect(s.getByTestId('dom-pin-hq')).toHaveClass(/on4/);
  await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('dom-pin-morning')).toHaveClass(/on4/);
  await shot('board');
  await page.keyboard.press('Tab');
  await expect(s.getByTestId('dom-pin-pyramid')).toBeVisible();
  await shot('board-back');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-hq')).toBeVisible();
  expect(await block(page)).toEqual(before);
  expect(errors).toEqual([]);
});
