import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D21 (the applications desk, Rotom mockup k5): from the HQ on a Day, I (or the APPLICATIONS chip)
// opens the desk. Tab inspects a field of the paperwork, the quick questions and Type… ask the applicant (with a
// Key-Card, Rotom voices the answer: `?aifake=1` answers without a network), A / R / D stamp. Everything is saved:
// a reload shows the same applicant, the same answers and the same Rotom line without asking again.

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
const aiLog = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.ai ?? {});

/** Steps the clock to the Day phase of Day 2 and opens the HQ again (the scene reads the saved run). */
async function toDay2(page: Page) {
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    for (const t of ['toNight', 'rest']) p.session.dominionStep({ t });
    // A talk card or a fight at the door would wait in the morning: answer and settle them in the session.
    const b = () => p.session.run.expansion.dominion;
    while (b().crew?.talks?.length) p.session.dominionStep({ t: 'talk', choice: 0 });
    if (b().field.fight) b().field.fight = null;
    p.session.dominionStep({ t: 'toDay' });
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  });
  await waitForScene(page, 'Dominion');
  const s = view(page, 'Dominion');
  await s.getByTestId('dom-title-1').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('DAY');
  return s;
}

/** A press can be lost in a busy headless frame (the scene-change gotcha): press again until `check` passes. */
async function pressUntil(page: Page, key: string, check: () => Promise<boolean>) {
  await expect(async () => {
    if (!(await check())) await page.keyboard.press(key);
    expect(await check()).toBe(true);
  }).toPass({ timeout: 15_000 });
}

test('the applications desk: paperwork, Inspect, questions with Rotom, stamps, and it reloads the same', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new&aifake=1');
  // A made-up Key-Card in this tab only (the fake transport answers; nothing leaves the page).
  await page.evaluate(() => sessionStorage.setItem('pkr.ai.card', JSON.stringify({ card: 'ruby', key: `sk-ant-api03-${'x'.repeat(40)}` })));
  await newDominion(page);
  const s = await toDay2(page);

  // The HQ chip says how many wait; I opens the desk.
  const b0 = await block(page);
  const queue = b0.desk.queue;
  expect(queue.length).toBeGreaterThanOrEqual(2);
  await expect(s.getByTestId('dom-desk')).toContainText(`${queue.length} in the rain`);
  await pressUntil(page, 'KeyI', async () => (await s.getByTestId('desk-name').count()) > 0);
  const a = queue[0];
  await expect(s.getByTestId('desk-name')).toHaveText(a.name.toUpperCase());
  await expect(s.getByTestId('desk-home')).toHaveText(a.homeShown);
  await expect(s.getByTestId('desk-idno')).toHaveText(a.idNo);
  await expect(s.getByTestId('desk-stamp')).toHaveText(a.stamp);
  await expect(s.getByTestId('desk-sub')).toContainText(`Day 2 · 1 of ${queue.length}`);
  await expect(s.getByTestId('desk-rotom-note')).toContainText('Rotom');
  await shot('k5-desk-open');

  // Tab: Inspect; Enter checks the home town (the first field). The lens shows what's wrong, or that it looks right.
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await block(page)).desk.queue[0].checked).toEqual(['home']);
  await expect(s.getByTestId('desk-lens')).toContainText(a.miss.includes('home') ? 'should be' : 'Looks right');
  await expect(s.getByTestId('desk-patience')).toHaveAttribute('data-n', '4');
  await page.keyboard.press('Escape');

  // A quick question: Rotom voices the answer (the fake), with its tell and the Rotom chip; stored in the run.
  await s.getByTestId(`desk-q-${a.qs[0]}`).click();
  await expect(s.getByTestId('desk-reply')).toHaveAttribute('data-from', 'rotom');
  await expect(s.getByTestId('desk-reply')).toContainText('The big radio');
  await expect(s.getByTestId('desk-tell')).toHaveText('NERVOUS');
  await expect(s.getByTestId('desk-chip')).toContainText('Quick · tell: nervous');
  expect(Object.keys(await aiLog(page))).toEqual([`desk:2:${a.id}:0`]);
  await shot('k5-desk-rotom');

  // Type…: a box takes the keys (typing "a" and "d" doesn't stamp); Enter asks.
  await page.keyboard.press('KeyT');
  const input = page.getByTestId('type-box-input');
  await expect(input).toBeFocused();
  await input.pressSequentially('And what do you do all day?');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('type-box')).toHaveCount(0);
  await expect.poll(async () => (await block(page)).desk.queue[0].asked.length).toBe(2);
  expect((await block(page)).desk.queue[0].asked[1].text).toBe('And what do you do all day?');
  expect((await block(page)).desk.queue[0].verdict).toBeNull();
  await expect(s.getByTestId('desk-you')).toContainText('And what do you do all day?');
  await expect(s.getByTestId('desk-reply')).toHaveAttribute('data-from', 'rotom');
  await expect(view(page, 'Dominion')).not.toContainText(/Claude|\bAI\b/);

  for (const [w, h] of [[1280, 720], [960, 540], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await expect(s.getByTestId('desk-questions')).toBeVisible();
    await shot(`desk-${w}x${h}`);
  }

  // Reload: the same applicant, the same answers, the stored Rotom line, and no new call.
  const before = await block(page);
  const log = await aiLog(page);
  await page.goto('/?ui=new&aifake=1');
  await waitForScene(page, 'MainMenu');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.continueRun();
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  });
  await waitForScene(page, 'Dominion');
  await s.getByTestId('dom-title-1').click();
  await pressUntil(page, 'KeyI', async () => (await s.getByTestId('desk-name').count()) > 0);
  expect((await block(page)).desk).toEqual(before.desk);
  expect(await aiLog(page)).toEqual(log);
  await expect(s.getByTestId('desk-reply')).toHaveAttribute('data-from', 'rotom');

  // Stamps: A accepts (they join), R rejects, D detains (Heat goes up).
  const members = before.members.length;
  await pressUntil(page, 'KeyA', async () => (await block(page)).members.length === members + 1);
  expect((await block(page)).members.at(-1).name).toBe(a.name);
  await expect(s.getByTestId('desk-name')).toHaveText(queue[1].name.toUpperCase());
  const heat = (await block(page)).field.districts.pewter.heat;
  await pressUntil(page, 'KeyD', async () => (await block(page)).desk.held.length === 1);
  expect((await block(page)).field.districts.pewter.heat).toBeGreaterThan(heat);
  for (let i = 2; i < queue.length; i++) await s.getByTestId('desk-stamp-reject').click();
  await expect(s.getByTestId('desk-closed')).toContainText('queue is empty');
  await shot('k5-desk-empty');

  // Esc: back to the HQ.
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-desk')).toContainText('queue empty');
  expect(errors).toEqual([]);
});
