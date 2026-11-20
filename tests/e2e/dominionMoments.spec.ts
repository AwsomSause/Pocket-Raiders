import { expect, test, type Page } from '@playwright/test';
import { hashSeed, Rng } from '../../src/core/rng';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D30: job moments and the morning paper (round-4 mockups m8, m9, m10, m12). Do it plays the Boss order
// cut-in (Enter skips; it ends by itself in under two seconds), then Job done or Job botched; the act is already saved
// while the cut-in plays. The next Morning opens on the paper. `?moments=1` turns them on for an automated browser.

/** A run seed whose next act roll (stream dominion-act, the block's roll count) passes, or fails with no battle or police. */
function seedFor(rolls: number, pass: boolean): string {
  for (let i = 0; i < 200_000; i++) {
    const seed = `d30-e2e-${i}`;
    const r = new Rng(hashSeed(`${seed}::dominion-act::${rolls}`));
    const a = r.int(1, 100), b = r.int(1, 100), c = r.int(1, 100);
    if (pass ? a <= 10 : a >= 96 && b > 40 && c >= 99) return seed;
  }
  throw new Error('no seed');
}

async function dayTwo(page: Page) {
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'dominion' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Dominion');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.dominionStart({ types: ['poison', 'dark'], member: 'grunt', look: 0 });
    for (const t of ['open', 'toNight', 'rest', 'toDay']) p.session.dominionStep({ t });
  });
  await restart(page);
  await page.keyboard.press('Enter');
  await expect(view(page, 'Dominion').getByTestId('dom-phase')).toHaveText('DAY');
}

async function restart(page: Page) {
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  });
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);
async function setSeed(page: Page, pass: boolean) {
  const rolls = (await block(page)).field.rolls as number;
  const seed = seedFor(rolls, pass);
  await page.evaluate((s) => { (window as any).__pkr.session.run.seed = s; }, seed);
}

/** Map -> Pewter (the HQ's town, no travel) -> Extort the Pewter Mart -> the Card. */
async function toCard(page: Page) {
  const s = view(page, 'Dominion');
  await page.keyboard.press('Digit2');
  await expect(s.getByTestId('dom-map')).toBeVisible();
  await s.getByTestId('dom-dz-pewter').click();
  await openExtort(page);
}

/** A click on the board's action opens its Card (a first click may only pick it). */
async function openExtort(page: Page) {
  const s = view(page, 'Dominion');
  await s.getByTestId('dom-act-extort').click();
  await page.waitForTimeout(300);
  if (!(await s.getByTestId('dom-card').isVisible())) await s.getByTestId('dom-act-extort').click();
  await expect(s.getByTestId('dom-card')).toBeVisible();
}

test('Do it: the Boss order cut-in, then Job done; the act is saved before the page shows; N goes to the next Card', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new&moments=1');
  await dayTwo(page);
  const s = view(page, 'Dominion');
  await toCard(page);
  await setSeed(page, true);
  const before = await block(page);
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-order')).toContainText('ORDER: EXTORT');
  await expect(s.getByTestId('dom-order-boss')).toContainText('THE BOSS');
  await page.waitForTimeout(800);
  await shot('m8-order');
  // The outcome is already in the save while the cut-in plays.
  const during = await block(page);
  expect(during.funds).toBeGreaterThan(before.funds);
  expect(during.paper.jobs.at(-1).a).toBe('extort');
  // It ends by itself (under two seconds).
  await expect(s.getByTestId('dom-job-done')).toBeVisible({ timeout: 4000 });
  await expect(s.getByTestId('dom-job-stamp')).toHaveText(/PAID IN FULL|BIG SCORE/);
  await expect(s.getByTestId('dom-job-take')).toHaveText(`+₽${(during.funds - before.funds).toLocaleString('en-US')}`);
  await expect(s.getByTestId('dom-job-roll')).toContainText('rolled');
  await expect(s.getByTestId('dom-job-weekly')).toContainText('every week');
  expect(await block(page)).toEqual(during);
  await page.waitForTimeout(600);
  await shot('m9-job-done');
  for (const [w, h] of [[1280, 720], [800, 600], [1920, 1080]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(200);
    await expect(s.getByTestId('dom-job-done')).toBeInViewport();
    await shot(`m9-${w}x${h}`);
  }
  // N: straight to the next action's Card.
  await page.keyboard.press('KeyN');
  await expect(s.getByTestId('dom-card')).toBeVisible();
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('a botched job: Enter skips the cut-in, the police page, Enter back to the Map; Battle motion Off skips the cut-in', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new&moments=1');
  await dayTwo(page);
  const s = view(page, 'Dominion');
  await toCard(page);
  await setSeed(page, false);
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-order')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-job-botched')).toBeVisible();
  await expect(s.getByTestId('dom-job-stamp')).toHaveText('BOTCHED');
  await expect(s.getByTestId('dom-job-botched')).toContainText('got away');
  await expect(s.getByTestId('dom-job-choice-1')).toContainText('next action');
  await page.waitForTimeout(600);
  await shot('m10-botched');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-map')).toBeVisible();
  // With Battle motion Off the cut-in is skipped: Do it goes straight to the result page.
  await page.evaluate(() => {
    const ss = (window as any).__pkr.session;
    ss.saveSettings({ ...ss.settings, battleAnimations: 'off' });
  });
  await openExtort(page);
  await setSeed(page, true);
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-job-done')).toBeVisible();
  await expect(s.getByTestId('dom-order')).toHaveCount(0);
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-map')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the morning paper: yesterday\'s job on the front page, the WANTED poster, the news; Enter folds it; it stays folded for that Morning', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new&moments=1');
  await dayTwo(page);
  const s = view(page, 'Dominion');
  await toCard(page);
  await setSeed(page, true);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-job-done')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-map')).toBeVisible();
  // The rest of the day and the night through the session; then the Morning of Day 3.
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    const b = () => p.session.run.expansion.dominion;
    const talk = () => { while (b().crew?.talks.length) p.session.dominionStep({ t: 'talk', choice: 0 }); };
    // The Chair (D12) sits each evening; set to Off (as the unit tests do), the evening goes straight to the night.
    b().chair = { day: 0, open: false, docket: [], at: 0, result: null, handed: false, tally: [], seen: {}, follow: [], due: [], regulars: {}, tags: {}, deals: [], owed: {}, fame: 0, cool: 0, locks: {}, stake: null, give: [], log: [], week: [0, 0, 0, 0], ...b().chair, opts: { length: 'off', numbers: 'arrows', speed: 'normal' } };
    for (const t of ['endDay', 'toNight', 'rest']) { talk(); p.session.dominionStep({ t }); }
    talk();
  });
  await restart(page);
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-paper')).toBeVisible();
  await expect(s.getByTestId('dom-paper-date')).toHaveText('Day 3 · Morning edition');
  await expect(s.getByTestId('dom-paper-head')).toContainText(/PEWTER/i);
  await expect(s.getByTestId('dom-paper-wanted')).toContainText('WANTED');
  await expect(s.getByTestId('dom-paper-news')).toContainText('Notoriety');
  await page.waitForTimeout(400);
  await shot('m12-paper');
  for (const [w, h] of [[1280, 720], [800, 600], [1920, 1080]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(200);
    await expect(s.getByTestId('dom-paper-fold')).toBeInViewport();
    await shot(`m12-${w}x${h}`);
  }
  // Letters do nothing while it is up; Enter folds it, onto the Morning.
  const was = await block(page);
  await page.keyboard.press('KeyE');
  await expect(s.getByTestId('dom-paper')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-paper')).toHaveCount(0);
  await expect(s.getByTestId('dom-phase')).toHaveText('MORNING');
  expect(await block(page)).toEqual(was);
  // Back into the run on the same Morning (the scene starts again): the paper stays folded.
  await restart(page);
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-phase')).toHaveText('MORNING');
  await expect(s.getByTestId('dom-paper')).toHaveCount(0);
  expect(errors).toEqual([]);
});
