import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// Evil Mode slice 22 ("other beginnings"), in the New look: the Charters tab (nine, every page printed) and taking the
// Staff Room (Take and Lean absent, no Line control); the Turn's card after a won takeover (take the chair, or walk
// away); and a phone in landscape queueing a job in four taps. Screens at four sizes, no sideways scroll.

const stage = (page: Page) => view(page, 'Evil');
const run = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run);

async function toEvil(page: Page, modeId: string) {
  await start(page, 'ui=new');
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.keyboard.press('Enter');
}

async function shots(page: Page, info: { outputPath: (n: string) => string }, name: string) {
  for (const [w, h] of [[1280, 720], [960, 540], [800, 600], [740, 360]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(300);
    const sideways = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(sideways, `${name} at ${w}x${h} scrolls sideways`).toBe(false);
    await page.screenshot({ path: info.outputPath(`${name}-${w}x${h}.png`) });
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(300);
}

test('the Charters tab: nine Charters, every page printed; the Staff Room is taken by taps', async ({ page }, info) => {
  const errors = watch(page);
  await toEvil(page, 'evil-mode');
  await waitForScene(page, 'Evil');
  await page.waitForTimeout(300);
  const s = stage(page);
  await s.getByTestId('evil-charters-open').click();
  await expect(s.getByTestId('evil-charter-tabs')).toBeVisible();
  for (const id of ['rocket', 'rocket-return', 'joint', 'galactic', 'plasma', 'flare', 'two-boards', 'group', 'staff-room']) await expect(s.getByTestId(`evil-charter-${id}`)).toBeVisible();
  await expect(s.getByTestId('evil-charter-page')).toContainText("What's a ledger for?");
  await s.getByTestId('evil-charter-staff-room').click();
  await expect(s.getByTestId('evil-charter-page')).toContainText('Where were the adults?');
  await expect(s.getByTestId('evil-charter-page')).toContainText('Ortega');
  await shots(page, info, 'charters');
  await s.getByTestId('evil-charter-take').click();
  await expect(s.getByTestId('evil-charter-confirm')).toBeVisible();
  await s.getByTestId('evil-charter-take').click();
  await expect(s.getByTestId('evil-team-name')).toHaveText('Staff');
  const b = (await run(page)).expansion.evilMode;
  expect(b.charter.id).toBe('staff-room');
  expect(b.team.dread).toBe(0);
  await expect(s.getByTestId('evil-house')).toContainText('The register');
  await expect(s.getByTestId('evil-line-open')).toHaveCount(0);
  await page.keyboard.press('Enter'); // Morning -> Dispatch (the Arrival's first day)
  for (const m of ['take', 'lean']) await expect(s.getByTestId(`evil-method-${m}`)).toHaveCount(0);
  for (const m of ['persuade', 'pay', 'outplay', 'scout', 'expose']) await expect(s.getByTestId(`evil-method-${m}`)).toHaveCount(1);
  await shots(page, info, 'staff-room');
  expect(errors).toEqual([]);
});

async function wonTakeover(page: Page) {
  await toEvil(page, 'standard');
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.run.story.flags['ev:evil-start-galactic'] = 1;
    p.session.run.money = 4200;
    p.session.saveRunNow();
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Map');
  });
  await waitForScene(page, 'Evil');
  await page.waitForTimeout(300);
}

test('the Turn: a won takeover offers the card; Take the chair (with its confirm) makes the run an Evil Mode run', async ({ page }, info) => {
  const errors = watch(page);
  await wonTakeover(page);
  const s = stage(page);
  await expect(s.getByTestId('evil-turn-card')).toContainText('Carry on as the Boss');
  await expect(s.getByTestId('evil-turn-card')).toContainText("What can't be undone");
  await shots(page, info, 'turn');
  await s.getByTestId('evil-turn-take').click();
  await expect(s.getByTestId('evil-turn-confirm')).toBeVisible();
  await s.getByTestId('evil-turn-take').click();
  await expect(s.getByTestId('evil-team-name')).toHaveText('Galactic');
  const r = await run(page);
  expect(r.rules.modeId).toBe('evil-mode');
  expect(r.expansion.evilMode.from).toBe('turn');
  expect(r.expansion.evilMode.team.funds).toBe(4200);
  // Saved: a reload continues the Evil Mode run.
  await page.goto('/?ui=new');
  await waitForScene(page, 'MainMenu');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.continueRun();
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  });
  await waitForScene(page, 'Evil');
  await expect(stage(page).getByTestId('evil-team-name')).toHaveText('Galactic');
  expect(errors).toEqual([]);
});

test('the Turn: walking away is today\'s ending, and the card never comes back', async ({ page }) => {
  const errors = watch(page);
  await wonTakeover(page);
  const s = stage(page);
  await s.getByTestId('evil-turn-walk').click();
  await waitForScene(page, 'Map');
  const r = await run(page);
  expect(r.rules.modeId).toBe('standard');
  expect(r.expansion?.evilMode).toBeUndefined();
  expect(r.story.flags['ev:evil-turn-answered']).toBe('walked');
  expect(errors).toEqual([]);
});

test('a phone in landscape: a job is queued in four taps, with no drag', async ({ page }, info) => {
  const errors = watch(page);
  await toEvil(page, 'evil-mode');
  await waitForScene(page, 'Evil');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.evilFound({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm' }, 2);
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  });
  await waitForScene(page, 'Evil');
  await page.setViewportSize({ width: 740, height: 360 });
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => document.body.classList.contains('rx-phone'))).toBe(true);
  const s = stage(page);
  await s.getByTestId('evil-advance').click(); // Morning -> Dispatch
  await expect(s.getByTestId('evil-beat-dispatch')).toHaveAttribute('data-state', 'now');
  const b = (await run(page)).expansion.evilMode;
  const local = b.district.holdings.find((h: any) => h.kind === 'local');
  await s.getByTestId(`evil-row-${local.step}`).click(); // 1. where
  await s.getByTestId(`evil-crew-${b.crew[0].id}`).click(); // 2. who
  await s.getByTestId('evil-method-persuade').click(); // 3. how: the Card opens
  await expect(s.getByTestId('evil-card-confirm')).toHaveAttribute('data-lit', 'true');
  await page.screenshot({ path: info.outputPath('phone-card-740x360.png') });
  await s.getByTestId('evil-card-confirm').click(); // 4. confirm
  await expect(s.getByTestId('evil-queued')).toHaveCount(1);
  const sideways = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(sideways).toBe(false);
  await page.screenshot({ path: info.outputPath('phone-queued-740x360.png') });
  expect(errors).toEqual([]);
});
