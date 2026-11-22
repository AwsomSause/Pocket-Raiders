import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { hashSeed, Rng } from '../../src/core/rng';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION redesign R4: the pass-50 Jobs pages with their own rules (core/dominion/jobs.ts). The Job board (the Jobs
// tab), "something happens" on a stealth job (`live`), the calling card (C on Job done), the Black Market (M on the
// board after dark), the Smuggling run (the Smuggle Card) and the Gym plan with the Leader's choice. Shots go to the
// test's output folder for the side-by-side check against the mockups; R5_DUMP=1 also writes each page's markup.

test.use({ viewport: { width: 960, height: 540 } });

/** A run seed whose next act roll passes, or fails with no battle or police (as dominionR4.spec). */
function seedFor(rolls: number, pass: boolean): string {
  for (let i = 0; i < 200_000; i++) {
    const seed = `d30-e2e-${i}`;
    const r = new Rng(hashSeed(`${seed}::dominion-act::${rolls}`));
    const a = r.int(1, 100), b = r.int(1, 100), c = r.int(1, 100);
    if (pass ? a <= 10 : a >= 96 && b > 40 && c >= 99) return seed;
  }
  throw new Error('no seed');
}
/** A run seed where something happens on the next Scout (jobs.json live.chance 35). */
function liveSeed(rolls: number): string {
  for (let i = 0; i < 200_000; i++) {
    const seed = `jobs-live-e2e-${i}`;
    if (new Rng(hashSeed(`${seed}::dominion-live::${rolls}::scout`)).int(1, 100) <= 35) return seed;
  }
  throw new Error('no seed');
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);

async function restart(page: Page) {
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  });
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
}

/** A founded crew on Day 2 with a second member, at the HQ. */
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
    const b = p.session.run.expansion.dominion;
    const m = structuredClone(b.members[0]);
    b.members.push({ ...m, id: `${m.id}-2`, name: 'Bram', stats: { ...m.stats, nerve: 4 } });
  });
  await restart(page);
  await expect(view(page, 'Dominion').getByTestId('dom-phase')).toHaveText('DAY');
}

/** Point the map at an action and open its Card (the board's own Take it). */
const take = (page: Page, action: string, district: string, target: string | null = null) =>
  page.evaluate((x) => { (window as any).__pkr.game.scene.getScene('Dominion').jx.host.take(x); }, { action, district, target });

test('the Job board, a live job, the calling card, the Black Market, the Smuggling run and the Gym plan', async ({ page }, info) => {
  test.setTimeout(180_000);
  const settle = Number(process.env.R5_SETTLE ?? 1500);
  const shot = async (n: string, wait = settle) => {
    await page.waitForTimeout(wait);
    await page.screenshot({ path: info.outputPath(`${n}.png`) });
    if (process.env.R5_DUMP) writeFileSync(info.outputPath(`${n}.html`), await page.locator('#r5').innerHTML());
  };
  const errors = watch(page);
  await start(page, 'ui=new&tutorial=0&moments=1');
  await dayTwo(page);
  const s = view(page, 'Dominion');

  // The Jobs tab: the board. ←→ moves, Enter takes the job (its Card), and the block never moved.
  const b0 = await block(page);
  await page.keyboard.press('Digit5');
  await expect(s.getByTestId('dom-board-0')).toBeVisible();
  await expect(s.getByTestId('dom-board-orders')).toContainText('left today');
  await shot('jobs');
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('dom-board-1')).toHaveClass(/\bon\b/);
  expect(await block(page)).toEqual(b0);
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-card')).toBeVisible();
  await page.keyboard.press('Escape');

  // Scout at the Pewter Mart with something happening: three answers; Stay still goes on to the job.
  const rolls = (await block(page)).field.rolls as number;
  await page.evaluate((x) => { (window as any).__pkr.session.run.seed = x; }, liveSeed(rolls));
  await take(page, 'scout', 'pewter', 'pewter-mart');
  await expect(s.getByTestId('dom-card')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-live')).toContainText('Something happens');
  await expect(s.getByTestId('dom-live-0')).toContainText('Stealth');
  await shot('live');
  await page.keyboard.press('Digit1');
  await expect(s.getByTestId('dom-live')).toHaveCount(0);
  await expect(s.getByTestId('dom-job-done').or(s.getByTestId('dom-job-botched'))).toBeVisible({ timeout: 5000 });
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-map')).toBeVisible();

  // Extort that works, then C on Job done: the calling card. Leave it: Dread up in Pewter.
  const r2 = (await block(page)).field.rolls as number;
  await page.evaluate((x) => { (window as any).__pkr.session.run.seed = x; }, seedFor(r2, true));
  await take(page, 'extort', 'pewter', 'pewter-mart');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-job-done')).toBeVisible({ timeout: 5000 });
  await expect(s.getByTestId('dom-job-calling')).toBeVisible();
  const dread = (await block(page)).field.districts.pewter.dread as number;
  await page.keyboard.press('KeyC');
  await expect(s.getByTestId('dom-calling')).toContainText('WAS HERE');
  await shot('calling');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-job-note')).toContainText('will talk about');
  expect((await block(page)).field.districts.pewter.dread).toBeGreaterThan(dread);
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-map')).toBeVisible();

  // The Gym plan (the Gym takeover Card) and the Leader's choice on Walk in; Walk away changes nothing.
  // Notoriety "Known" opens Gym takeovers: a feared Pewter is enough here.
  await page.evaluate(() => { (window as any).__pkr.session.run.expansion.dominion.field.districts.pewter.dread += 120; });
  await take(page, 'gym-takeover', 'pewter');
  await expect(s.getByTestId('dom-gymplan')).toBeVisible();
  await shot('gymplan');
  await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('dom-gym-way-1')).toHaveAttribute('style', /outline/);
  await page.keyboard.press('ArrowUp');
  await expect(s.getByTestId('dom-gym-way-0')).toHaveAttribute('style', /outline/);
  const b1 = await block(page);
  await page.evaluate(() => { (window as any).__pkr.game.scene.getScene('Dominion').jx.cardKey('confirm'); });
  await expect(s.getByTestId('dom-gymtalk')).toBeVisible();
  await shot('gymtalk');
  // Beat's answers: Battle for the Gym, Walk away (the last; ↑ from the first wraps to it).
  await expect(s.getByTestId('dom-gymtalk-0')).toContainText('Battle for the Gym');
  await page.keyboard.press('ArrowUp');
  await expect(s.getByTestId('dom-gymtalk-1')).toContainText('Walk away');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-gymtalk')).toHaveCount(0);
  expect(await block(page)).toEqual(b1);
  await page.keyboard.press('Escape');

  // After dark with a Fence: the Black Market from the board (M), buy the first thing.
  await page.evaluate(() => {
    const b = (window as any).__pkr.session.run.expansion.dominion;
    b.phase = 'evening';
    b.funds = 20000;
    (b.growth ??= { contacts: [] }).contacts.push('fence');
  });
  await restart(page);
  await page.keyboard.press('Digit5');
  await page.keyboard.press('KeyM');
  await expect(s.getByTestId('dom-market')).toBeVisible();
  await shot('market');
  const funds = (await block(page)).funds as number;
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-market-line')).toContainText('Bought');
  expect((await block(page)).funds).toBeLessThan(funds);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');

  // The Smuggling run (the Smuggle Card at night): Space loads the crate under the cursor; the odds go down.
  await page.evaluate(() => { (window as any).__pkr.session.run.expansion.dominion.phase = 'night'; });
  await take(page, 'smuggle', 'pewter');
  await expect(s.getByTestId('dom-cargo')).toBeVisible();
  const odds = await s.getByTestId('dom-cargo-odds').textContent();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await expect(s.getByTestId('dom-cargo-0')).toHaveClass(/\bon\b/);
  expect(await s.getByTestId('dom-cargo-odds').textContent()).not.toBe(odds);
  await shot('cargo');
  expect(errors).toEqual([]);
});
