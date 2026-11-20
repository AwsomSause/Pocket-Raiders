import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D29: the Assign a task page (round-4 mockup m3, out of the Morning) and the District file page (m4, out
// of the Region Map). Both re-show D3's and D2/D6's numbers; the order and the act are the same steps as before.

async function into(page: Page, steps: string[]) {
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'dominion' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Dominion');
  await page.evaluate((list) => {
    const p = (window as any).__pkr;
    p.session.dominionStart({ types: ['poison', 'dark'], member: 'grunt', look: 0 });
    for (const t of list) {
      p.session.dominionStep({ t });
      while (p.session.run.expansion.dominion.crew?.talks?.length) p.session.dominionStep({ t: 'talk', choice: 0 });
    }
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  }, steps);
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);

test('Assign a task: the Morning opens it, cards show the odds, M pages the full list, Enter gives the order', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  await into(page, ['open', 'toNight', 'rest']);
  const s = view(page, 'Dominion');
  await expect(s.getByTestId('dom-phase')).toHaveText('MORNING');
  // Morning: ▼ onto the first task, Enter opens the page on it.
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(150);
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-as-grid')).toBeVisible();
  await expect(s.getByTestId('dom-region')).toHaveText('Morning › Assign');
  await expect(s.getByTestId('dom-as-grid').locator('.task')).toHaveCount(6);
  await expect(s.getByTestId('dom-as-task-shake-down')).toHaveClass(/\bon\b/);
  await expect(s.getByTestId('dom-as-name')).toContainText('ROOK');
  await expect(s.getByTestId('dom-as-line')).toBeVisible();
  await expect(s.getByTestId('dom-tab-3')).toHaveClass(/\bon\b/);
  await shot('1-assign');
  // ▼ walks the cards; the last wraps round to the first.
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('dom-as-task-rest')).toHaveClass(/\bon\b/);
  await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('dom-as-task-shake-down')).toHaveClass(/\bon\b/);
  // M: the full list, six to a page; M again: the quick six.
  await page.keyboard.press('KeyM');
  await expect(s.getByTestId('dom-as-more')).toContainText('Quick six');
  await expect(s.getByTestId('dom-as-page')).toHaveText(/^1\/\d+$/);
  const pages = (await s.getByTestId('dom-as-page').textContent())!.split('/')[1];
  await page.keyboard.press('ArrowUp');
  await expect(s.getByTestId('dom-as-page')).toHaveText(`${pages}/${pages}`);
  await shot('2-assign-all');
  await page.keyboard.press('KeyM');
  await expect(s.getByTestId('dom-as-more')).toContainText('More…');
  // Click a card to pick it, click again (or Enter) to give the order: D3's assign step, saved.
  await s.getByTestId('dom-as-task-train').click();
  await expect(s.getByTestId('dom-as-task-train')).toHaveClass(/\bon\b/);
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await block(page)).members[0].crew.task).toBe('train');
  await expect(s.getByTestId('dom-as-task-train')).toContainText('ON IT');
  for (const [w, h] of [[1280, 720], [960, 540], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await expect(s.getByTestId('dom-as-give')).toBeVisible();
    await shot(`assign-${w}x${h}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  // Esc: back to the Morning, the strip shows the new task.
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-morning-report')).toBeVisible();
  await expect(s.getByTestId('dom-strip-m1')).toContainText('Train');
  // Tab 1 also goes back (the page sits under Roster).
  await s.getByTestId('dom-task-rest').click();
  await expect(s.getByTestId('dom-as-grid')).toBeVisible();
  await page.keyboard.press('Digit1');
  await expect(s.getByTestId('dom-morning-report')).toBeVisible();
  expect((await block(page)).members[0].crew.task).toBe('train');
  expect(errors).toEqual([]);
});

test('District file: Enter on the map opens it, number keys pick, the Card goes back to it, Esc to the map', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  await into(page, ['open', 'toNight', 'rest', 'toDay']);
  const s = view(page, 'Dominion');
  await expect(s.getByTestId('dom-phase')).toHaveText('DAY');
  await page.keyboard.press('Digit2');
  await expect(s.getByTestId('dom-map')).toBeVisible();
  // Pick Cerulean on the map, then click its file panel: the District file page.
  await s.getByTestId('dom-dz-cerulean').click();
  await s.getByTestId('dom-file').click();
  await expect(s.getByTestId('dom-df-title')).toContainText('Cerulean');
  const b = await block(page);
  await expect(s.getByTestId('dom-df-control')).toHaveText(String(b.field.districts.cerulean.control));
  await expect(s.getByTestId('dom-df-rival')).toHaveText(String(b.field.districts.cerulean.rival));
  await expect(s.getByTestId('dom-df-act-extort')).toHaveClass(/\bon\b/);
  await expect(s.getByTestId('dom-df-cta')).toContainText('Extort the Bike Shop');
  await expect(s.getByTestId('dom-df-target-bike-shop')).toContainText('Stubborn');
  await shot('3-district');
  // T: the next target. 9: Lay low; ◀ then ▲ walk the columns (Shadow -> Muscle).
  await page.keyboard.press('KeyT');
  await expect(s.getByTestId('dom-df-target-cerulean-gym')).toHaveClass(/\bon\b/);
  await page.keyboard.press('Digit9');
  await expect(s.getByTestId('dom-df-act-lay-low')).toHaveClass(/\bon\b/);
  await page.keyboard.press('ArrowLeft');
  await expect(s.getByTestId('dom-df-act-attack')).toHaveClass(/\bon\b/);
  await page.keyboard.press('ArrowUp');
  await expect(s.getByTestId('dom-df-act-thieve')).toHaveClass(/\bon\b/);
  for (const [w, h] of [[1280, 720], [960, 540], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await expect(s.getByTestId('dom-df-cta')).toBeVisible();
    await shot(`district-${w}x${h}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  // Esc: back to the map; Enter on the map (Pewter, home) opens its file.
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-map')).toBeVisible();
  await s.getByTestId('dom-dz-pewter').click();
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-df-title')).toContainText('Pewter');
  // Lay low twice (9, 9): its Card; Esc comes back here; Enter, Enter does it and lands back on the file.
  await page.keyboard.press('Digit9');
  await page.keyboard.press('Digit9');
  await expect(s.getByTestId('dom-card')).toBeVisible();
  await expect(s.getByTestId('dom-card-chance')).toHaveText('100%');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-df-title')).toContainText('Pewter');
  const left = (await block(page)).actions;
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-card')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-df-title')).toContainText('Pewter');
  await expect.poll(async () => (await block(page)).actions).toBe(left - 1);
  await expect(s.getByTestId('dom-df-left')).toContainText(`${left - 1} action`);
  // Esc clears the result line, Esc again goes to the map.
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-map')).toBeVisible();
  expect(errors).toEqual([]);
});
