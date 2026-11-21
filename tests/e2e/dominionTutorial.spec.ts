import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION tutorial and opening (plans/evil-mode-rework/tutorial-mockups a1-e9). With `?tutorial=1` New run asks how
// much help, plays the cold open and its reward, Rotom tips the setup, the kit card follows the opening, and the HQ's
// lessons hold the page until Enter (X stops them). The help level is saved on the run, Settings gets a Tutorial row and
// the Boss Menu a Replay a lesson page. Without the flag (every older spec) none of it shows.

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
  await expect(s.getByTestId('dom-logo')).toBeVisible();
  await page.waitForTimeout(300);
  return s;
}

/** Presses `key` until `shown` is visible: a press can be lost in a busy headless frame. */
async function pressUntil(page: Page, key: string, shown: ReturnType<Page['locator']>) {
  await expect(async () => {
    if (!(await shown.isVisible())) await page.keyboard.press(key);
    await expect(shown).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 15_000 });
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);
const seen = async (page: Page): Promise<string[]> => (await block(page))?.tut?.seen ?? [];

test('the tutorial: help choice, cold open, setup tips, kit, lessons, Replay a lesson', async ({ page }, info) => {
  test.setTimeout(120_000);
  // Tips and reward cards pop in (about 0.8 s): wait for them before each picture.
  const shot = async (n: string) => { await page.waitForTimeout(900); await page.screenshot({ path: info.outputPath(`${n}.png`) }); };
  const errors = watch(page);
  await start(page, 'ui=new&tutorial=1');
  const s = await toTitle(page);

  // A1: the first time, New run has a FIRST TIME tag.
  await expect(s.getByTestId('dom-tut-first')).toBeVisible();
  await shot('a1-title');

  // A2: the help choice; Full is picked by default.
  await s.getByTestId('dom-title-0').click();
  await expect(s.getByTestId('dom-tut-help')).toBeVisible();
  await expect(s.getByTestId('dom-tut-help-full')).toHaveClass(/on/);
  await shot('a2-help');
  await page.keyboard.press('Digit1');

  // A3-A5: three beats of the cold open; A6 the reward, only after the text.
  await expect(s.getByTestId('dom-tut-text')).toBeVisible();
  await expect(s.getByTestId('dom-tut-reward')).toHaveCount(0);
  await shot('a3-cold');
  await s.getByTestId('dom-tut-text').click();
  await expect(s.getByTestId('dom-tut-paper')).toBeVisible();
  await shot('a4-paper');
  await s.getByTestId('dom-tut-text').click();
  await s.getByTestId('dom-tut-text').click();
  await expect(s.getByTestId('dom-tut-reward')).toBeVisible();
  await shot('a6-reward');
  await s.getByTestId('dom-tut-go').click();

  // B1-B3: the setup with Rotom's tips (they never block the page).
  await expect(s.getByTestId('dom-tut-rail')).toContainText('LESSON 1');
  await shot('b1-boss');
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-type-poison').click();
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-tut-tip')).toContainText('One more!');
  await shot('b2x-one-type');
  await s.getByTestId('dom-type-dark').click();
  await shot('b2-types');
  await s.getByTestId('dom-next').click();
  await shot('b3-member');
  await s.getByTestId('dom-next').click();

  // The run keeps the help level picked.
  expect((await block(page)).tut).toEqual({ mode: 'full', seen: [] });

  // C1-C2: the built opening, then C3 the kit card.
  for (let i = 0; i < 4; i++) await s.getByTestId('dom-opening').click();
  await expect(s.getByTestId('dom-tut-reward')).toContainText('STARTING KIT');
  await shot('c3-kit');
  await pressUntil(page, 'Enter', s.getByTestId('dom-tut'));

  // C4: Rotom boots up and holds the page; C5 the top bar.
  await expect(s.getByTestId('dom-tut-tip')).toContainText('Welcome to Dominion');
  await shot('c4-welcome');
  expect(await seen(page)).toContain('kit');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-tut-rail')).toContainText('LESSON 2');
  await shot('c5-top');
  // While a lesson holds the page, a tab key does nothing.
  await page.keyboard.press('Digit2');
  await expect(s.getByTestId('dom-tut-rail')).toContainText('LESSON 2');
  await page.keyboard.press('Enter');

  // C6-C7: lesson 3's Enter plans the order under the cursor.
  await expect(s.getByTestId('dom-tut-rail')).toContainText('LESSON 3');
  await shot('c6-orders');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await block(page)).orders.length).toBe(1);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-tut-tip')).toContainText('costs ₽40');
  await shot('c7-orders-2');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-tut-rail')).toContainText('LESSON 4');
  await shot('c8-steps');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-tut-rail')).toContainText('LESSON 5');
  await shot('c9-tasks');

  // X stops the tips: the run's help level goes to Off and the HQ is free.
  await page.keyboard.press('KeyX');
  await expect(s.getByTestId('dom-tut')).toHaveCount(0);
  expect((await block(page)).tut.mode).toBe('off');

  // Boss Menu: the Replay a lesson blade (T) and page; picking a lesson plays it over the page without changing the run.
  await pressUntil(page, 'Escape', s.getByTestId('dom-blade-lessons'));
  await shot('d10-menu');
  await page.keyboard.press('KeyT');
  await expect(s.getByTestId('dom-tut-replay')).toBeVisible();
  await expect(s.getByTestId('dom-tut-mode-off')).toHaveClass(/on/);
  await shot('e9-replay');
  await page.keyboard.press('ArrowLeft');
  await expect(s.getByTestId('dom-tut-mode-tips')).toHaveClass(/on/);
  expect((await block(page)).tut.mode).toBe('tips');
  const before = JSON.stringify((await block(page)).tut.seen);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-tut-rail')).toContainText('LESSON 2');
  await shot('replay-top');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-tut-rail')).toHaveCount(0);
  expect(JSON.stringify((await block(page)).tut.seen)).toBe(before);
  // Tips only: lesson 5 comes back as one line that never holds the page; the next key closes it and still works.
  await expect(s.getByTestId('dom-tut-tip')).toContainText('any key closes it');
  await shot('tips-toast');
  await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('dom-tut')).toHaveCount(0);
  await expect.poll(async () => (await block(page)).tut.seen).toContain('tasks');
  expect((await page.evaluate(() => (window as any).__pkr.session.settings.expansion.dominionPrefs.tutorial))).toBe('tips');

  expect(errors).toEqual([]);
});

/** Changes the saved block, then opens the Dominion again and presses Continue (the scene reads it fresh). */
async function withBlock(page: Page, change: string) {
  await page.evaluate((src) => {
    const s = (window as any).__pkr.session;
    const b = s.run.expansion.dominion;
    new Function('b', src)(b);
    s.saveRunNow();
  }, change);
  await open(page, 'Dominion');
  const s = view(page, 'Dominion');
  await page.waitForTimeout(300);
  await s.getByTestId('dom-title-1').click();
  return s;
}

test('the first week: kit, Rattata, a First Step, bills, Rocket, the Ledger, the night, Heat, the map, the end', async ({ page }, info) => {
  test.setTimeout(150_000);
  const shot = async (n: string) => { await page.waitForTimeout(900); await page.screenshot({ path: info.outputPath(`${n}.png`) }); };
  const errors = watch(page);
  await start(page, 'ui=new');
  let s = await toTitle(page);
  await s.getByTestId('dom-title-0').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-type-poison').click();
  await s.getByTestId('dom-type-dark').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-next').click();
  for (let i = 0; i < 4; i++) await s.getByTestId('dom-opening').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('EVENING');
  // This run began without the tutorial (automated); turn the walkthrough on for it, as the Settings row would.
  const lessons = "'kit','welcome','top','orders','steps','tasks','tasks-assign','card','map','wheel','menu'";

  // D1-D2: the first morning tells the Rattata story, then the card; the Rattata is in the Reserve once.
  s = await withBlock(page, `b.tut = { mode: 'full', seen: [${lessons},'night'] }; b.day = 2; b.phase = 'morning';`);
  await expect(s.getByTestId('dom-tut-text')).toContainText('Rattata');
  await expect(s.getByTestId('dom-tut-reward')).toHaveCount(0);
  await shot('d1-morning');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-tut-reward')).toContainText('RATTATA');
  await shot('d2-rattata');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await block(page)).reserve?.box.filter((m: { speciesId: string }) => m.speciesId === 'rattata').length).toBe(1);
  await expect(s.getByTestId('dom-tut-reward')).toHaveCount(0);

  // D6: a First Step done.
  s = await withBlock(page, `b.stepsDone = ['contact'];`);
  await expect(s.getByTestId('dom-tut-reward')).toContainText('FIRST STEP DONE');
  await shot('d6-step');
  await page.keyboard.press('Enter');
  await expect.poll(() => seen(page)).toContain('step:contact');

  // D7: Heat went up: lesson 9 with the ladder.
  s = await withBlock(page, `b.heat = 9; b.phase = 'day';`);
  await expect(s.getByTestId('dom-tut-rail')).toContainText('LESSON 9');
  await shot('d7-heat');
  await page.keyboard.press('Enter');

  // D11-D12: Day 7, the bills, then Rocket's note, then lesson 14 on the HQ.
  s = await withBlock(page, `b.day = 7; b.phase = 'morning'; b.report = ['Week 1 bills: rent ₽200, wages ₽80.'];`);
  await expect(s.getByTestId('dom-tut-bills')).toContainText('₽280');
  await expect(s.getByTestId('dom-tut-text')).toContainText('rent ₽200, wages ₽80.');
  await shot('d11-bills');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-tut-rival')).toBeVisible();
  await shot('d12-rival');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-tut-rail')).toContainText('LESSON 14');
  await shot('d12b-rivals');
  await page.keyboard.press('Enter');

  // D13: the week closes with the Ledger.
  s = await withBlock(page, `b.phase = 'evening';`);
  await expect(s.getByTestId('dom-tut-week')).toBeVisible();
  await shot('d13-week');
  await page.keyboard.press('Enter');
  await expect.poll(() => seen(page)).toContain('week');

  // C11: the night (lesson 6) on its own page: Enter rests.
  s = await withBlock(page, `b.phase = 'night'; b.tut.seen = b.tut.seen.filter((x) => x !== 'night');`);
  await expect(s.getByTestId('dom-tut-dial')).toBeVisible();
  await shot('c11-night');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await block(page)).phase).toBe('morning');

  // D8: the map's lesson the first time tab 2 opens.
  s = await withBlock(page, `b.tut.seen = b.tut.seen.filter((x) => x !== 'map');`);
  await page.keyboard.press('Digit2');
  await expect(s.getByTestId('dom-tut-rail')).toContainText('LESSON 10');
  await shot('d8-map');
  await page.keyboard.press('Enter');
  await expect.poll(() => seen(page)).toContain('map');

  // E7-E8: founded, then Rotom signs off (Full only).
  s = await withBlock(page, `b.teamName = 'Venom'; b.team = { name: 'Venom', primary: 'purple', secondary: 'lilac', initial: 'V', logo: 'fang', motto: 'We keep what we take.', goal: null, day: 7 }; b.tut.seen.push('gang'); if (b.crew) b.crew.talks = [];`);
  await expect(s.getByTestId('dom-tut-reward')).toContainText('VENOM IS FOUNDED');
  await shot('e7-founded');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-tut-done')).toBeVisible();
  await shot('e8-done');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-tut')).toHaveCount(0);
  expect(await seen(page)).toEqual(expect.arrayContaining(['founded', 'founding', 'done']));
  expect(errors).toEqual([]);
});

test('without ?tutorial=1 an automated browser keeps the old flow', async ({ page }) => {
  await start(page, 'ui=new');
  const s = await toTitle(page);
  await expect(s.getByTestId('dom-tut-first')).toHaveCount(0);
  await s.getByTestId('dom-title-0').click();
  await expect(s.getByTestId('dom-next')).toBeVisible();
  await expect(s.getByTestId('dom-tut')).toHaveCount(0);
});
