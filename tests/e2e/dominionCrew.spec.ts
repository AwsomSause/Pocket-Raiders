import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D3 (the crew): the Crew File (mockup 5) with Hire Grunt, and the Morning (mockup 2) with Assign Task
// and a talk card. Saved at every step; a reload keeps the new member and the task.

async function newDominion(page: Page) {
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'dominion' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
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
  await expect(s.getByTestId('dom-phase')).toHaveText('EVENING');
  return s;
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);

test('Crew File, Hire Grunt, then the Morning: answer a talk, assign a task, and it reloads', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  const s = await newDominion(page);

  // Tab 3 opens the Crew File on Rook (mockup 5).
  await page.keyboard.press('Digit3');
  await expect(s.getByTestId('dom-file-name')).toContainText('ROOK');
  await expect(s.getByTestId('dom-file-stats')).toBeVisible();
  await expect(s.getByTestId('dom-file-personality')).toContainText('Clumsy');
  await expect(s.getByTestId('dom-file-keys')).toContainText('Hire');
  await shot('5-crew-file');

  // H: three Grunts for hire; take the first one.
  const funds0 = (await block(page)).funds;
  await page.keyboard.press('KeyH');
  await expect(s.getByTestId('dom-hire')).toBeVisible();
  await shot('crew-hire');
  await s.getByTestId('dom-hire-0').click();
  await expect(s.getByTestId('dom-notice')).toContainText('joined');
  const hired = await block(page);
  expect(hired.members).toHaveLength(2);
  expect(hired.funds).toBeLessThan(funds0);
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-hire')).toBeHidden();
  await page.waitForTimeout(200);
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('dom-file-name')).toContainText(hired.members[1].name.toUpperCase());

  // Back to the HQ, round to the Morning (mockup 2).
  await page.keyboard.press('Digit1');
  await expect(s.getByTestId('dom-phase')).toHaveText('EVENING');
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('NIGHT');
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('MORNING');
  await expect(s.getByTestId('dom-morning-report')).toContainText('Rook');
  await expect(s.getByTestId('dom-badge')).toBeVisible();
  // A talk card waits for an answer before anything else (internal interactions).
  if ((await block(page)).crew.talks.length) {
    await expect(s.getByTestId('dom-talk')).toBeVisible();
    await shot('morning-talk');
    for (let n = (await block(page)).crew.talks.length; n > 0; n--) {
      await s.getByTestId('dom-talk-0').click();
      await expect.poll(async () => (await block(page)).crew.talks.length).toBe(n - 1);
    }
  }
  await expect(s.getByTestId('dom-talk')).toBeHidden();
  await shot('2-morning');

  // Assign Rook to Rest; the strip shows it and the save has it.
  await s.getByTestId('dom-strip-m1').click();
  await expect(s.getByTestId('dom-info-name')).toContainText('ROOK');
  await s.getByTestId('dom-task-rest').click();
  await expect(s.getByTestId('dom-strip-m1')).toContainText('Rest');
  const before = await block(page);
  expect(before.members[0].crew.task).toBe('rest');

  // Several window sizes.
  for (const [w, h] of [[1280, 720], [960, 540], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await expect(s.getByTestId('dom-assign')).toBeVisible();
    await shot(`morning-${w}x${h}`);
  }

  // Reload: the task and the new member are still there.
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
  await page.keyboard.press('Enter');
  await expect(view(page, 'Dominion').getByTestId('dom-morning-report')).toBeVisible();
  expect(await block(page)).toEqual(before);
  expect(errors).toEqual([]);
});
