import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// Evil Mode slice 3 ("the Card and the Ledger"), in the New look: no job goes without its Honest Card. CONFIRM is lit
// only once field 13 has been on screen, a held Enter never confirms, the twelfth field is filed into the Ledger
// character for character, and the Ledger's tabs and its income lines work with keys only and with taps only.

const stage = (page: Page) => view(page, 'Evil');
const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.evilMode);

async function restartEvil(page: Page) {
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  });
  await waitForScene(page, 'Evil');
  await page.waitForTimeout(300);
}

async function foundedAtDispatch(page: Page) {
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
  await page.evaluate(() => (window as any).__pkr.session.evilFound({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm' }));
  await restartEvil(page);
  await page.keyboard.press('Enter'); // Morning -> Dispatch
  await expect(stage(page).getByTestId('evil-beat-dispatch')).toHaveAttribute('data-state', 'now');
}

test('keys only: a held Enter scrolls and never confirms; a press of its own does; field 12 is the filed line', async ({ page }, info) => {
  const errors = watch(page);
  await foundedAtDispatch(page);
  const s = stage(page);
  // Step 1, Grunts 1 and 2, How, Scout (as in slice 2's spec).
  for (const k of ['Enter', 'Enter', 'ArrowDown', 'Enter', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'Enter', 'ArrowLeft', 'ArrowLeft']) await page.keyboard.press(k);
  await expect(s.getByTestId('evil-odds')).toContainText('Certain');
  // Hold Enter: the first press opens the Card; the repeats that follow scroll and do not confirm.
  await page.keyboard.down('Enter');
  await expect(s.getByTestId('evil-card')).toBeVisible();
  for (let i = 0; i < 8; i++) await page.keyboard.down('Enter');
  await page.waitForTimeout(200);
  await expect(s.getByTestId('evil-card')).toBeVisible();
  expect((await block(page)).queue).toHaveLength(0);
  // All thirteen fit on this Card, so CONFIRM is lit at once; it still wants its own press after a release.
  await expect(s.getByTestId('evil-card-confirm')).toHaveAttribute('data-lit', 'true');
  for (let n = 1; n <= 13; n++) await expect(s.getByTestId(`evil-card-f${n}`)).toBeVisible();
  const written = (await s.getByTestId('evil-card-written').textContent())!.trim();
  await page.screenshot({ path: info.outputPath('card-1280x720.png') });
  await page.keyboard.up('Enter');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('evil-card')).toHaveCount(0);
  await expect(s.getByTestId('evil-queued')).toHaveCount(1);
  const b = await block(page);
  expect(b.log.at(-1).text).toBe(written);
  expect(b.cards[0].fields[11].text).toBe(written);
  await expect(s.getByTestId('evil-filed')).toHaveText(written);

  // The Ledger with keys: L opens it, Right to The run, Enter opens the kept Card, Enter closes it, Esc closes the book.
  await page.keyboard.press('KeyL');
  await expect(s.getByTestId('evil-ledger')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('evil-ledger-line')).toHaveCount(1);
  await expect(s.getByTestId('evil-ledger-line')).toContainText(written);
  await expect(s.getByTestId('evil-ledger-mark')).toHaveText('·');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('evil-card')).toHaveAttribute('data-mode', 'read');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('evil-card')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('evil-ledger')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('taps only: CONFIRM stays dark until field 13 has been scrolled into view; the Ledger waives a line and counts it as Given', async ({ page }, info) => {
  const errors = watch(page);
  await foundedAtDispatch(page);
  const s = stage(page);
  // Make the Card longer than its window, as a long Card would be (Part 29 section 6.2: it scrolls, and CONFIRM's at the bottom).
  await page.addStyleTag({ content: '[data-testid^="evil-card-f"]{min-height:90px}' });
  const b0 = await block(page);
  const local = b0.district.holdings.find((h: any) => h.kind === 'local');
  await s.getByTestId(`evil-row-${local.step}`).click();
  await s.getByTestId('evil-crew-g3').click();
  await s.getByTestId('evil-crew-g4').click();
  await s.getByTestId('evil-method-persuade').click();
  await s.getByTestId('evil-queue').click();
  await expect(s.getByTestId('evil-card')).toBeVisible();
  await page.waitForTimeout(200);
  await expect(s.getByTestId('evil-card-confirm')).toHaveAttribute('data-lit', 'false');
  // Unscouted: red ink, and the Card says so.
  await expect(s.getByTestId('evil-card-f11')).toContainText('not scouted');
  await s.getByTestId('evil-card-confirm').dispatchEvent('click');
  await page.waitForTimeout(200);
  expect((await block(page)).queue).toHaveLength(0);
  await page.screenshot({ path: info.outputPath('card-scrolling.png') });
  await s.getByTestId('evil-card-scroll').evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await expect(s.getByTestId('evil-card-confirm')).toHaveAttribute('data-lit', 'true');
  await s.getByTestId('evil-card-confirm').click();
  await expect(s.getByTestId('evil-queued')).toHaveCount(1);
  const b1 = await block(page);
  expect(b1.log.at(-1).unknowns).toBeGreaterThan(0);

  // Give the team a paying holding, then work its line in the Ledger by taps.
  await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    const h = run.expansion.evilMode.district.holdings.find((x: any) => x.kind === 'local' && x.ref === 'eze') ?? run.expansion.evilMode.district.holdings.find((x: any) => x.kind === 'local' && x.owner !== 'team');
    Object.assign(h, { owner: 'team', method: 'persuade', since: 1, holds: true, scouted: 1 });
  });
  await restartEvil(page);
  await stage(page).getByTestId('evil-funds').click();
  await expect(stage(page).getByTestId('evil-ledger-in')).toHaveCount(1);
  await stage(page).getByTestId('evil-ledger-in').click();
  await stage(page).getByTestId('evil-ledger-waive').click();
  await expect(stage(page).getByTestId('evil-ledger-in')).toContainText('waived');
  await expect(stage(page).getByTestId('evil-ledger-left')).toContainText('Total ₽0');
  await stage(page).getByTestId('evil-ledger-tab-3').click();
  await expect(stage(page).getByTestId('evil-given')).toHaveText('1');
  await expect(stage(page).getByTestId('evil-taken')).toHaveText('0');
  for (const [w, h] of [[1280, 720], [800, 600], [740, 360]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    await page.screenshot({ path: info.outputPath(`ledger-${w}x${h}.png`) });
  }
  await stage(page).getByTestId('evil-ledger-tab-0').click();
  await page.screenshot({ path: info.outputPath('ledger-today.png') });
  expect(errors).toEqual([]);
});
