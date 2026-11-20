import { expect, test, type Page } from '@playwright/test';
import { start, waitForScene, watch } from './helpers/newUi';
import { fitProblems, onPage, pview } from './helpers/phantomUi';

// The Phantom UI, slice 2: save files, the shared pages (menu, option rows, picture wall, board) and the pages of
// starting a run (Trainer, Rules, Partner, Plan). Every page is checked for text that is cut off or off the screen,
// after its parts have finished sliding in.

const go = (page: Page, key: string, data?: Record<string, unknown>) =>
  page.evaluate(([k, d]) => { const pkr = (window as any).__pkr; pkr.game.scene.getScene(pkr.activeScene()).scene.start(k, d); }, [key, data] as const);
const setVersion = (page: Page, id: string) => page.evaluate((id) => { const s = (window as any).__pkr.session; s.saveSettings({ ...s.settings, phantomVersion: id }); }, id);

test('Phantom UI: save files are the Save page; Erase asks first and the answer is kept', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=phantom');
  await onPage(page, 'MainMenu', 'title');
  await go(page, 'SaveSlots');
  await waitForScene(page, 'SaveSlots');
  await onPage(page, 'SaveSlots', 'save');
  const save = pview(page, 'SaveSlots');
  await expect(save.locator('.slot')).toHaveCount(3);
  await expect(save.locator('.slot.on')).toHaveCount(1);
  await expect(save.locator('.ph-acts .blade.on')).toContainText(/Start here|Load/);
  await page.waitForTimeout(600);
  expect(await fitProblems(page, 'SaveSlots')).toEqual([]);
  // The cursor follows the keys and the mouse.
  await page.keyboard.press('ArrowDown');
  await expect(save.locator('.slot.on .no')).toHaveText('2');
  await save.locator('.slot').nth(2).hover();
  await expect(save.locator('.slot.on .no')).toHaveText('3');
  // The Esc key hint is a button too.
  await save.locator('.key', { hasText: 'Back' }).click();
  await waitForScene(page, 'MainMenu');
  expect(errors).toEqual([]);
});

test('Phantom UI: a new run goes Trainer, Rules, Partner, Plan, each on its Phantom page', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=phantom-run');
  await onPage(page, 'MainMenu', 'title');
  await go(page, 'TrainerSelect');
  await waitForScene(page, 'TrainerSelect');
  await onPage(page, 'TrainerSelect', 'wall');
  const wall = pview(page, 'TrainerSelect');
  await expect(wall.locator('.dx.on')).toHaveCount(1);
  await expect(wall.locator('.dexcard h3')).toHaveText('Red');
  await expect(wall).toContainText('Unlocked');
  await page.waitForTimeout(600);
  expect(await fitProblems(page, 'TrainerSelect')).toEqual([]);
  // The card follows the cursor: a locked trainer shows as "???" with how to unlock them, the next open one by name.
  await page.keyboard.press('ArrowRight');
  await expect(wall.locator('.dexcard h3')).toHaveText('???');
  await page.waitForTimeout(600);
  expect(await fitProblems(page, 'TrainerSelect')).toEqual([]);
  await wall.locator('.dx', { hasText: 'Blue' }).hover();
  await expect(wall.locator('.dexcard h3')).toHaveText('Blue');
  await page.waitForTimeout(600);
  expect(await fitProblems(page, 'TrainerSelect')).toEqual([]);
  await wall.locator('.dx', { hasText: 'Red' }).hover();
  await expect(wall.locator('.dexcard h3')).toHaveText('Red');
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');

  await waitForScene(page, 'RunPrep');
  await onPage(page, 'RunPrep', 'setup');
  const rules = pview(page, 'RunPrep');
  await expect(rules.locator('.stp .on')).toContainText('Rules');
  await expect(rules.locator('.cc')).toContainText('Red');
  await expect(rules.locator('.su-go.on')).toContainText('Begin the run');
  await page.waitForTimeout(600);
  expect(await fitProblems(page, 'RunPrep')).toEqual([]);
  // Up lights a row and shows what it changes; the Mode row opens the shared option rows.
  await page.keyboard.press('ArrowUp');
  await expect(rules.locator('.sr.on')).toContainText('Loadout presets');
  await page.waitForTimeout(600);
  expect(await fitProblems(page, 'RunPrep')).toEqual([]);
  await rules.locator('.sr', { hasText: 'Mode' }).click();
  await waitForScene(page, 'RunChoices');
  await onPage(page, 'RunChoices', 'opts');
  const opts = pview(page, 'RunChoices');
  await expect(opts.locator('.sr.on')).toHaveCount(1);
  await page.waitForTimeout(600);
  expect(await fitProblems(page, 'RunChoices')).toEqual([]);
  await page.keyboard.press('Escape');
  await waitForScene(page, 'RunPrep');
  await onPage(page, 'RunPrep', 'setup');
  await page.waitForTimeout(250);
  await rules.locator('.su-go').click();

  await waitForScene(page, 'StarterSelect');
  await onPage(page, 'StarterSelect', 'starter');
  const partner = pview(page, 'StarterSelect');
  await expect(partner.locator('.scd')).toHaveCount(3);
  await expect(partner.locator('.stp .on')).toContainText('Partner');
  const first = await partner.locator('.scd.on h4').innerText();
  await page.keyboard.press('ArrowRight');
  await expect(partner.locator('.scd.on h4')).not.toHaveText(first);
  await page.waitForTimeout(600);
  expect(await fitProblems(page, 'StarterSelect')).toEqual([]);
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');

  await waitForScene(page, 'Briefing');
  await onPage(page, 'Briefing', 'plan');
  const plan = pview(page, 'Briefing');
  await expect(plan.locator('.stp:not(.ph-regs) .on')).toContainText('Plan');
  await expect(plan.locator('.ph-seed')).toContainText('phantom-run');
  await expect(plan.locator('.ph-mate')).toHaveCount(1);
  await page.waitForTimeout(600);
  expect(await fitProblems(page, 'Briefing')).toEqual([]);
  await plan.locator('.ph-go').click();
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.activeScene())).not.toBe('Briefing');
  expect(errors).toEqual([]);
});

test('Phantom UI: the shared pages fit in all five versions and at a phone-wide and a tall window', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=phantom');
  await onPage(page, 'MainMenu', 'title');
  for (const [id, size] of [['midnight', [844, 390]], ['channel', [1920, 1080]], ['fantasia', [700, 900]], ['velvet', [1280, 720]]] as const) {
    await setVersion(page, id);
    await page.setViewportSize({ width: size[0], height: size[1] });
    for (const [key, scr] of [['SaveSlots', 'save'], ['TrainerSelect', 'wall'], ['VersionSelect', 'version']] as const) {
      await go(page, key);
      await waitForScene(page, key);
      await onPage(page, key, scr);
      await expect(pview(page, key)).toHaveAttribute('data-liv', id);
      await page.waitForTimeout(600);
  expect(await fitProblems(page, key), `${key} in ${id} at ${size.join('x')}`).toEqual([]);
    }
  }
  expect(errors).toEqual([]);
});
