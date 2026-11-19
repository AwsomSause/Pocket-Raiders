import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D1 (Evil Mode rework): the title card, the setup pages (the Boss, two Team Types, the First Member),
// the opening scene and the HQ with its clock, drawn from mockups 0 and 1. Saved at every step; a reload continues.

async function settingOn(page: Page, uiStyle?: 'old') {
  await page.evaluate((ui) => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, ...(ui ? { uiStyle: ui } : {}), expansion: { ...s.settings.expansion, evilMode: true } });
  }, uiStyle);
}

async function toTitle(page: Page) {
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'dominion' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Dominion');
  await expect(view(page, 'Dominion').getByTestId('dom-logo')).toBeVisible();
  await page.waitForTimeout(300);
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);
/** D3: Morning talk cards wait for an answer; take the first choice of each, one card at a time. */
async function answerTalks(page: Page) {
  const s = view(page, 'Dominion');
  for (let n = (await block(page)).crew?.talks.length ?? 0; n > 0; n--) {
    await s.getByTestId('dom-talk-0').click();
    await expect.poll(async () => (await block(page)).crew.talks.length).toBe(n - 1);
  }
  await expect(s.getByTestId('dom-talk')).toBeHidden();
}

test('set up a Dominion in the New look, live a day round the clock, and it reloads where it was', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  await settingOn(page);
  await toTitle(page);
  const s = view(page, 'Dominion');
  await shot('0-title');
  await s.getByTestId('dom-title-0').click();
  await expect(s.getByTestId('dom-setup-boss')).toBeVisible();
  await shot('setup-boss');
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-setup-types')).toBeVisible();
  // Failure: Next with no types; Dragon is refused with its line.
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-problem')).toHaveText('Pick two Team Types.');
  await s.getByTestId('dom-type-dragon').click();
  await expect(s.getByTestId('dom-problem')).toHaveText('Too proud to wear a uniform.');
  await s.getByTestId('dom-type-poison').click();
  await s.getByTestId('dom-type-dark').click();
  await shot('setup-types');
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-member-grunt')).toBeVisible();
  await shot('setup-member');
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-opening')).toBeVisible();
  for (let i = 0; i < 4; i++) await s.getByTestId('dom-opening').click();
  // Mockup 1: Day 1, Evening, ₽1,000, Heat 5%, roster 1/3, Rook alone.
  await expect(s.getByTestId('dom-phase')).toHaveText('EVENING');
  await expect(s.getByTestId('dom-funds')).toHaveText('₽1,000');
  await expect(s.getByTestId('dom-heat')).toHaveText('5%');
  await expect(s.getByTestId('dom-roster')).toHaveText('1/3');
  await expect(s.getByTestId('dom-team')).toHaveText('UNNAMED CREW');
  await expect(s.getByTestId('dom-member')).toContainText('YOUR ONLY GRUNT');
  await expect(s.getByTestId('dom-member')).toContainText('ROOK');
  await shot('1-hq-evening');
  // Plan an order, then round the clock: Night (Rest) -> Morning (report) -> Day (do it) -> End Day.
  await s.getByTestId('dom-order-find-recruit').click();
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('NIGHT');
  await shot('hq-night');
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('MORNING');
  // D3: the Morning screen (mockup 2) replaces D1's report panel; a talk card may wait first.
  await expect(s.getByTestId('dom-morning-report')).toContainText(/Rook (guarded the HQ|fell asleep on guard)/);
  await answerTalks(page);
  await shot('hq-morning');
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('DAY');
  await s.getByTestId('dom-order-find-recruit').click();
  await expect(s.getByTestId('dom-notice')).toContainText('Find one useful contact');
  await shot('hq-day');
  // A locked tab says so; Esc closes the line.
  await page.keyboard.press('Digit4');
  await expect(s.getByTestId('dom-notice')).toContainText('later part');
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('EVENING');
  const before = await block(page);
  expect(before).toMatchObject({ day: 2, phase: 'evening', stepsDone: ['contact'] });
  // Reload: the title card offers Continue, and the HQ is where it was.
  await page.goto('/?ui=new');
  await waitForScene(page, 'MainMenu');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.continueRun();
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  });
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
  await expect(view(page, 'Dominion').getByTestId('dom-title-1')).toContainText('Day 2');
  await page.keyboard.press('Enter');
  await expect(view(page, 'Dominion').getByTestId('dom-phase')).toHaveText('EVENING');
  expect(await block(page)).toEqual(before);
  expect(errors).toEqual([]);
});

test('with the Old look selected the Dominion still draws in the New look', async ({ page }) => {
  await start(page, '');
  await settingOn(page, 'old');
  await toTitle(page);
  await expect(view(page, 'Dominion').getByTestId('dom-title-0')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__pkr.session.settings.uiStyle)).toBe('old');
});
