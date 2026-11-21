import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { hashSeed, Rng } from '../../src/core/rng';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION redesign R4 (pass 50 of plans/evil-mode-rework/redesign-50): the Card (mockup `card`), Pick the crew
// (`crewpick`), the Boss order cut-in (`order`), Job done (`done`), Job botched (`botched`), the Hero shows up
// (`herohit`) and the Boss card (`tcard`). Shots go to the test's output folder for the side-by-side check against the
// mockups (`?bare&still&pass=50&s=<id>`); R5_DUMP=1 also writes each page's markup.

test.use({ viewport: { width: 960, height: 540 } });

/** A run seed whose next act roll passes, or fails with no battle or police (as dominionMoments.spec). */
function seedFor(rolls: number, pass: boolean): string {
  for (let i = 0; i < 200_000; i++) {
    const seed = `d30-e2e-${i}`;
    const r = new Rng(hashSeed(`${seed}::dominion-act::${rolls}`));
    const a = r.int(1, 100), b = r.int(1, 100), c = r.int(1, 100);
    if (pass ? a <= 10 : a >= 96 && b > 40 && c >= 99) return seed;
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
}

/** A founded crew on Day 2 with a second member (so Pick the crew has a choice), at the HQ. */
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
  await page.keyboard.press('Enter');
  await expect(view(page, 'Dominion').getByTestId('dom-phase')).toHaveText('DAY');
}

async function toCard(page: Page) {
  const s = view(page, 'Dominion');
  await page.keyboard.press('Digit2');
  await expect(s.getByTestId('dom-map')).toBeVisible();
  await s.getByTestId('dom-dz-pewter').click();
  await s.getByTestId('dom-act-extort').click();
  await page.waitForTimeout(300);
  if (!(await s.getByTestId('dom-card').isVisible())) await s.getByTestId('dom-act-extort').click();
  await expect(s.getByTestId('dom-card')).toBeVisible();
}

async function setSeed(page: Page, pass: boolean) {
  const rolls = (await block(page)).field.rolls as number;
  const seed = seedFor(rolls, pass);
  await page.evaluate((x) => { (window as any).__pkr.session.run.seed = x; }, seed);
}

test('the pass-50 Card, Pick the crew, the order, Job done and botched, the Hero and the Boss card', async ({ page }, info) => {
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

  // The Card: the ring, how the odds are made, who is there.
  await toCard(page);
  await expect(s.getByTestId('r5-card')).toBeVisible();
  await expect(s.getByTestId('dom-card-pays')).toContainText('/wk');
  await expect(s.getByTestId('dom-card-slot')).toHaveText(/Action \d of \d/);
  const alone = await s.getByTestId('dom-card-total').textContent();
  await shot('card');

  // B: Pick the crew. Enter picks the one under the cursor (it shows ✓), Esc goes back; the odds now count them.
  const before = await block(page);
  await page.keyboard.press('KeyB');
  await expect(s.getByTestId('r5-crewpick')).toBeVisible();
  await expect(s.getByTestId('dom-crewpick-1')).toContainText('Bram');
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('dom-crewpick-1')).toHaveClass(/\bon\b/);
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-crewpick-1')).toContainText('✓');
  await shot('crewpick');
  expect(await block(page)).toEqual(before);
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-card')).toBeVisible();
  expect(await s.getByTestId('dom-card-total').textContent()).not.toBe(alone);

  // Do it (a pass): the order cut-in, then Job done.
  await setSeed(page, true);
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-order')).toContainText('ORDER: EXTORT');
  await expect(s.getByTestId('dom-order-boss')).toContainText('THE BOSS');
  await shot('order', 1100);
  await expect(s.getByTestId('dom-job-done')).toBeVisible({ timeout: 4000 });
  await expect(s.getByTestId('dom-job-stamp')).toHaveText(/PAID IN FULL|BIG SCORE/);
  await expect(s.getByTestId('dom-job-weekly')).toContainText('every week');
  await shot('done');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-map')).toBeVisible();

  // Do it (a miss, nobody caught): Job botched with To the Map / Next action.
  await s.getByTestId('dom-act-extort').click();
  await page.waitForTimeout(300);
  if (!(await s.getByTestId('dom-card').isVisible())) await s.getByTestId('dom-act-extort').click();
  await setSeed(page, false);
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-order')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-job-botched')).toBeVisible();
  await expect(s.getByTestId('dom-job-stamp')).toHaveText('BOTCHED');
  await expect(s.getByTestId('dom-job-choice-1')).toContainText('next action');
  await shot('botched');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-map')).toBeVisible();

  // The Hero steps into a job (Lay Low at Pewter): three answers, none taken here.
  await page.evaluate(() => {
    const b = (window as any).__pkr.session.run.expansion.dominion;
    Object.assign(b.hero, { threat: 30, stage: 1, foilWeek: 1, foilDay: b.day, foiled: false });
  });
  await restart(page);
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-phase')).toHaveText('DAY');
  await page.keyboard.press('Digit2');
  await s.getByTestId('dom-dz-pewter').click();
  await s.getByTestId('dom-act-lay-low').click();
  await page.waitForTimeout(300);
  if (!(await s.getByTestId('dom-card').isVisible())) await s.getByTestId('dom-act-lay-low').click();
  await s.getByTestId('dom-doit').click();
  await expect(s.getByTestId('dom-interrupt')).toContainText('BLUE');
  await expect(s.getByTestId('dom-interrupt-2')).toContainText('no Smoke Ball');
  await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('dom-interrupt-1')).toHaveClass(/\bon\b/);
  await page.keyboard.press('ArrowUp');
  await shot('herohit');
  await s.getByTestId('dom-interrupt-1').click();
  await expect(s.getByTestId('dom-interrupt')).toHaveCount(0);

  // The Boss card from the HQ's Start menu; Esc closes it and nothing in the run moved.
  await page.keyboard.press('Digit1');
  await expect(s.getByTestId('r5-hq')).toBeVisible();
  const b2 = await block(page);
  await s.locator('.ph13.st25').click();
  await s.getByTestId('r5-start-tcard').click();
  await expect(s.getByTestId('dom-bosscard')).toContainText('BOSS CARD');
  await expect(s.getByTestId('dom-bosscard')).toContainText('Gym marks');
  await shot('tcard');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-hq')).toBeVisible();
  expect(await block(page)).toEqual(b2);
  expect(errors).toEqual([]);
});
