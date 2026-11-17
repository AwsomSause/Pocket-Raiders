import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// Evil Mode slice 6 ("the Line"), in the New look. Keys only: the Line page (N), a hold let go early does nothing, held
// two seconds at Night it moves the Line. Taps only: a Lean queued through its Card, with tonight's Heat forecast, and
// Take's three things.

const stage = (page: Page) => view(page, 'Evil');
const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.evilMode);

async function founded(page: Page) {
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
    // Nobody's line crosses a Lean here, so the Card confirms plainly (asking anyway is slice 4's spec).
    for (const c of p.session.run.expansion.evilMode.crew) c.line = null;
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  });
  await waitForScene(page, 'Evil');
  await expect(stage(page).getByTestId('evil-map')).toBeVisible();
  await page.waitForTimeout(300);
}

test('keys only: the Line page, a hold let go early does nothing, held two seconds at Night it moves', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page);
  const s = stage(page);
  await page.keyboard.press('KeyN');
  await expect(s.getByTestId('evil-line')).toBeVisible();
  await expect(s.getByTestId('evil-line-stop-grey')).toHaveAttribute('data-current', 'true');
  await expect(s.getByText("That's where the Line already is.").first()).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(s.getByText("The Line's moved at Night.")).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('evil-line')).toHaveCount(0);

  // To Night: Morning, Send (Up wraps to "Send them"), Stay in, Call it a day.
  for (const k of ['Enter', 'ArrowUp', 'Enter', 'Enter', 'Enter']) {
    await page.keyboard.press(k);
    await page.waitForTimeout(150);
  }
  await expect(s.getByTestId('evil-beat-night')).toHaveAttribute('data-state', 'now');
  await page.keyboard.press('KeyN');
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('evil-line-stop-whatever')).toHaveCSS('outline-style', 'solid');
  // Let go early: nothing moves.
  await page.keyboard.down('Enter');
  await page.waitForTimeout(600);
  await page.keyboard.up('Enter');
  await page.waitForTimeout(300);
  expect((await block(page)).team.line).toBe('grey');
  // Held two seconds: it moves.
  await page.keyboard.down('Enter');
  await page.waitForTimeout(2400);
  await page.keyboard.up('Enter');
  await expect.poll(async () => (await block(page)).team.line).toBe('whatever');
  await expect(s.getByTestId('evil-line-stop-whatever')).toHaveAttribute('data-current', 'true');
  await expect(s.getByTestId('evil-line-said')).toContainText('Moved the Line from Grey to Whatever it takes.');
  await page.keyboard.press('ArrowLeft');
  await expect(s.getByText("The Line's already been moved in this region.")).toBeVisible();
  for (const [w, h] of [[1280, 720], [960, 540], [740, 360]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    await page.screenshot({ path: info.outputPath(`line-${w}x${h}.png`) });
  }
  expect(errors).toEqual([]);
});

test('taps only: a Lean through its Card with tonight\'s Heat forecast; Take offers three things', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page);
  const s = stage(page);
  await s.getByTestId('evil-advance').click(); // Morning -> Dispatch
  await expect(s.getByTestId('evil-beat-dispatch')).toHaveAttribute('data-state', 'now');
  const b = await block(page);
  const local = b.district.holdings.find((h: any) => h.kind === 'local' && h.ref !== 'amadi');
  await s.getByTestId(`evil-row-${local.step}`).click();
  for (const c of b.crew.slice(0, 3)) await s.getByTestId(`evil-crew-${c.id}`).click();
  await s.getByTestId('evil-method-take').click();
  for (const t of ['stock', 'deed', 'ledger']) await expect(s.getByTestId(`evil-thing-${t}`)).toBeVisible();
  await s.getByTestId('evil-method-lean').click();
  await expect(s.getByTestId('evil-odds')).toContainText('Base +50');
  await expect(s.getByTestId('evil-heat-forecast')).toContainText('nothing loud');
  await page.screenshot({ path: info.outputPath('lean.png') });
  await s.getByTestId('evil-queue').click();
  await expect(s.getByTestId('evil-card-confirm')).toBeVisible();
  await s.getByTestId('evil-card-confirm').click();
  await expect(s.getByTestId('evil-queued')).toHaveCount(1);
  await expect(s.getByTestId('evil-queued').first()).toContainText('Lean');
  await expect(s.getByTestId('evil-heat-forecast')).toContainText(`Lean, step ${local.step}`);
  const after = await block(page);
  expect(after.log.at(-1).text).toMatch(/Frightened/);
  expect(errors).toEqual([]);
});
