import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// Evil Mode slice 2 ("a district"): the Board and Dispatch in the New look. A job is queued with keys only and another
// with taps only; Send rolls them at the Evening; the queue and the day survive a reload.

const stage = (page: Page) => view(page, 'Evil');

async function foundedAtMorning(page: Page) {
  await start(page, 'ui=new');
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'evil-mode' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Evil');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.evilFound({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm' });
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  });
  await waitForScene(page, 'Evil');
  await expect(stage(page).getByTestId('evil-map')).toBeVisible();
  await page.waitForTimeout(300);
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.evilMode);

test('the Board: twenty steps, a holding pressed shows what is known, the count and the day', async ({ page }, info) => {
  const errors = watch(page);
  await foundedAtMorning(page);
  const s = stage(page);
  for (let i = 1; i <= 20; i++) await expect(s.getByTestId(`evil-cell-${i}`)).toBeVisible();
  await expect(s.getByTestId('evil-count')).toHaveText('Held: 0 of 11');
  await expect(s.getByTestId('evil-day')).toHaveText('Day 1 of 7');
  await s.getByTestId('evil-cell-20').click();
  await expect(s.getByTestId('evil-panel-name')).toHaveText('Cerulean Gym');
  for (const [w, h] of [[1280, 720], [960, 540], [800, 600], [740, 360]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    await page.screenshot({ path: info.outputPath(`board-${w}x${h}.png`) });
  }
  expect(errors).toEqual([]);
});

test('queue one job with keys only and one with taps only; Send rolls them at the Evening; a reload keeps the day', async ({ page }, info) => {
  const errors = watch(page);
  await foundedAtMorning(page);
  const s = stage(page);
  await page.keyboard.press('Enter'); // Morning -> Dispatch
  await expect(s.getByTestId('evil-beat-dispatch')).toHaveAttribute('data-state', 'now');

  // Keys only: Enter picks the first holding, Enter, Down, Enter take Grunts 1 and 2, Down three times and Enter go to How,
  // Left Left moves from Persuade to Scout (the seven wrap round), Enter queues.
  for (const k of ['Enter', 'Enter', 'ArrowDown', 'Enter', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'Enter', 'ArrowLeft', 'ArrowLeft']) await page.keyboard.press(k);
  await expect(s.getByTestId('evil-how')).toHaveClass(/sel/);
  await expect(s.getByTestId('evil-odds')).toContainText('Certain');
  await page.keyboard.press('Enter'); // opens the Honest Card (slice 3)
  await expect(s.getByTestId('evil-card-confirm')).toHaveAttribute('data-lit', 'true');
  await page.keyboard.press('Enter'); // CONFIRM
  await expect(s.getByTestId('evil-queued')).toHaveCount(1);
  await expect(s.getByTestId('evil-queued').first()).toContainText('Grunt 1, Grunt 2 → step 1 · Scout');

  // Taps only: a local, Grunts 3 and 4, Persuade, Queue it.
  const b = await block(page);
  const local = b.district.holdings.find((h: any) => h.kind === 'local' && h.step !== 1);
  await s.getByTestId(`evil-row-${local.step}`).click();
  await s.getByTestId('evil-crew-g3').click();
  await s.getByTestId('evil-crew-g4').click();
  await s.getByTestId('evil-method-persuade').click();
  await expect(s.getByTestId('evil-odds')).toContainText('Base +50');
  await page.screenshot({ path: info.outputPath('dispatch.png') });
  await s.getByTestId('evil-queue').click();
  await s.getByTestId('evil-card-confirm').click();
  await expect(s.getByTestId('evil-queued')).toHaveCount(2);

  // A dark method shows why and can't be queued.
  await s.getByTestId('evil-row-' + local.step).click();
  await s.getByTestId('evil-method-lean').click();
  await expect(s.getByText('Not in this build yet.')).toBeVisible();

  // Saved mid-Dispatch: a reload keeps the queue.
  await page.goto('/?ui=new');
  await waitForScene(page, 'MainMenu');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.continueRun();
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  });
  await waitForScene(page, 'Evil');
  await expect(stage(page).getByTestId('evil-queued')).toHaveCount(2);

  await stage(page).getByTestId('evil-advance').click(); // Send them
  await stage(page).getByTestId('evil-advance').click(); // Go -> Evening
  await expect(stage(page).getByTestId('evil-beat-evening')).toHaveAttribute('data-state', 'now');
  await expect(stage(page).getByTestId('evil-sheet')).toHaveCount(2);
  await expect(stage(page).getByTestId('evil-evening')).toContainText('Wages');
  await page.screenshot({ path: info.outputPath('evening.png') });
  const after = await block(page);
  expect(after.draws['evil-dispatch']).toBe(2);
  expect(after.district.holdings[0].scouted).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
