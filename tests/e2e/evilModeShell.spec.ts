import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// Evil Mode slice 1 ("the shell"): with the setting on, Run Setup offers the mode; a team is founded on its pages and an
// empty day goes round, saved at every beat. With the Old look selected the New layer is mounted for the run anyway.

async function settingOn(page: Page, uiStyle?: 'old') {
  await page.evaluate((ui) => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, ...(ui ? { uiStyle: ui } : {}), expansion: { ...s.settings.expansion, evilMode: true } });
  }, uiStyle);
}

async function toFounding(page: Page) {
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'evil-mode' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Evil');
  await expect(view(page, 'Evil').getByTestId('evil-founding')).toBeVisible();
  await page.waitForTimeout(300);
}

const stage = (page: Page) => view(page, 'Evil');

test('found a team in the New look, press through an empty day, and it reloads where it was', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  await settingOn(page);
  await toFounding(page);
  const s = stage(page);
  await s.getByTestId('evil-next').click();
  await expect(s.getByTestId('evil-founding')).toHaveAttribute('data-page', 'name');
  await page.getByTestId('evil-name-input').fill('Rocket');
  await expect(s.getByText('Team Rocket already exists')).toBeVisible();
  await page.getByTestId('evil-name-input').fill('Kettle');
  await expect(s.getByTestId('evil-grunt-says')).toHaveText('Team Kettle!');
  await shot('name');
  await s.getByTestId('evil-next').click();
  await s.getByTestId('evil-creed-belonging').click();
  await shot('creed');
  await s.getByTestId('evil-next').click();
  await s.getByTestId('evil-line-clean').click();
  await shot('line');
  await s.getByTestId('evil-next').click();
  await s.getByTestId('evil-doctrine-tide').click();
  await shot('doctrine');
  // Slice 9's pages: the Look, the Patron and the first region (each has a default, so Next goes straight on).
  for (const p of ['look', 'patron', 'region']) {
    await s.getByTestId('evil-next').click();
    await expect(s.getByTestId('evil-founding')).toHaveAttribute('data-page', p);
    await shot(p);
  }
  await s.getByTestId('evil-next').click();
  await expect(s.getByTestId('evil-founding')).toHaveAttribute('data-page', 'summary');
  await s.getByTestId('evil-next').click();
  await expect(s.getByTestId('evil-confirm')).toBeVisible();
  await shot('summary');
  await s.getByTestId('evil-next').click();

  await expect(s.getByTestId('evil-team-name')).toHaveText('Team Kettle');
  await expect(s.getByTestId('evil-loyalty')).toContainText('Easy');
  await expect(s.getByTestId('evil-chip').first()).toHaveText('Kanto · The Arrival · Day 1');
  await shot('day');
  for (const beat of ['morning', 'dispatch', 'inPerson', 'evening', 'night', 'hero']) {
    await expect(s.getByTestId(`evil-beat-${beat}`)).toHaveAttribute('data-state', 'now');
    await s.getByTestId('evil-advance').click();
  }
  await expect(s.getByTestId('evil-chip').first()).toHaveText('Kanto · The Arrival · Day 2');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('evil-beat-dispatch')).toHaveAttribute('data-state', 'now');

  // Saved at the end of every beat: a reload continues on Day 2, Dispatch.
  await page.goto('/?ui=new');
  await waitForScene(page, 'MainMenu');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.continueRun();
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  });
  await waitForScene(page, 'Evil');
  await expect(stage(page).getByTestId('evil-chip').first()).toHaveText('Kanto · The Arrival · Day 2');
  await expect(stage(page).getByTestId('evil-beat-dispatch')).toHaveAttribute('data-state', 'now');
  const block = await page.evaluate(() => (window as any).__pkr.session.run.expansion.evilMode);
  expect(block.team).toMatchObject({ name: 'Kettle', creed: 'belonging', line: 'clean', doctrine: 'tide', boss: 'red' });
  expect(errors).toEqual([]);
});

test('with the Old look selected, the New layer is mounted for the run and the setting is unchanged', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=old');
  await settingOn(page, 'old');
  await toFounding(page);
  await expect(stage(page).getByTestId('evil-oldlook')).toHaveText("Evil Mode uses the New look. Your setting hasn't been changed.");
  expect(await page.evaluate(() => (window as any).__pkr.session.settings.uiStyle)).toBe('old');
  expect(errors).toEqual([]);
});

test('with the setting off, Run Setup does not offer Evil Mode', async ({ page }) => {
  await start(page, 'ui=new');
  // On by default since slice 9; switched off here.
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: false } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'evil-mode' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.rules.modeId)).toBe('standard');
});
