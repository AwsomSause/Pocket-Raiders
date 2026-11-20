import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D20 (the Debate, Rotom path; Rotom mockup a4 / v4 #k4): at the Leader's Table, T opens the typing box.
// With a Key-Card (`?aifake=1`: a fake transport, nothing leaves the page) the judge scores the words on Giovanni's five
// values, the bar moves inside the set lines' range and Giovanni's reply streams in, stored for replay. Without one the
// rules read the words and the written reply types itself (B skips). Enter goes back to the table.

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

async function sitDown(page: Page, s: ReturnType<typeof view>) {
  await page.evaluate(() => {
    const b = (window as any).__pkr.session.run.expansion.dominion;
    Object.assign(b.rivals.teams.rocket, { tension: 45, peak: 45, stage: 2 });
    b.rivals.cards.push({ kind: 'debate', team: 'rocket', ref: 'neutral-ground-summit', who: 'Giovanni', amount: 0, district: null, ask: null, until: b.day + 3 });
  });
  await page.waitForTimeout(250);
  await page.keyboard.press('KeyR');
  await expect(s.getByTestId('dom-rival-row-card-0-0')).toContainText('Sit down for a Debate');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-debate-title')).toContainText('vs. Giovanni');
  await expect(s.getByTestId('dom-debate-type')).toBeVisible();
}

async function typeWords(page: Page, words: string) {
  const box = page.getByTestId('type-box-input');
  await expect(async () => {
    if (!(await box.count())) await page.keyboard.press('KeyT');
    await expect(box).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 15_000 });
  await expect(page.getByTestId('type-box')).toContainText('Giovanni');
  await page.keyboard.type(words, { delay: 10 });
  await expect(box).toHaveValue(words);
  await page.keyboard.press('Enter');
  await expect(box).toHaveCount(0);
}

const WORDS = 'Rocket keeps the old money scared. My crew keeps the streets. Split Celadon.';

test('The Debate, Rotom path: typed words judged on his values, the streamed reply, stored for a reload', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new&aifake=1');
  // A made-up Key-Card in this tab only (the fake transport answers; nothing leaves the page).
  await page.evaluate(() => sessionStorage.setItem('pkr.ai.card', JSON.stringify({ card: 'ruby', key: `sk-ant-api03-${'x'.repeat(40)}` })));
  const s = await newDominion(page);
  await sitDown(page, s);
  const c0 = (await block(page)).debate.live.conviction;
  await typeWords(page, WORDS);

  // Mockup a4: the note, the judge's five bars, Quick chip, the clamped move, the reply arriving with the Deep chip.
  await expect(s.getByTestId('dom-debate-words')).toContainText('Split Celadon');
  await expect(s.getByTestId('dom-debate-judge-chip')).toHaveText('Quick');
  await expect(s.getByTestId('dom-debate-judge')).toContainText('Against Giovanni\'s values');
  for (const [i, v] of ['8', '9', '4', '6', '5'].entries()) await expect(s.getByTestId(`dom-debate-value-${i}`)).toHaveText(v);
  await expect(s.getByTestId('dom-debate-reply')).toContainText('Celadon. You want my city');
  await shot('a4-debate-rotom-streaming');
  await expect(s.getByTestId('dom-debate-reply-chip')).toContainText('Deep');
  await expect(s.getByTestId('dom-debate-reply')).toContainText('cannot simply take.”', { timeout: 15_000 });
  await expect(s.getByTestId('dom-debate-status')).toContainText('has finished');
  const t = (await block(page)).debate.live.turns[0];
  expect(t.typed).toMatchObject({ text: WORDS, values: [8, 9, 4, 6, 5], rotom: true });
  expect(t.voice).toContain('Tell me what you bring');
  expect(t.move).toBeGreaterThanOrEqual(t.typed.lo);
  expect(t.move).toBeLessThanOrEqual(t.typed.hi);
  expect((await block(page)).debate.live.conviction).toBe(c0 + t.move);
  const run = await page.evaluate(() => (window as any).__pkr.session.run);
  expect(Object.keys(run.ai?.calls ?? run.ai ?? {}).join(' ')).toContain('t1:reply');
  for (const [w, h] of [[1280, 720], [960, 540], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await expect(s.getByTestId('dom-debate-move')).toBeVisible();
    await shot(`a4-debate-rotom-${w}x${h}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });

  // Enter: back to the table; the text box carries Giovanni's voiced reply.
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-debate-argue')).toBeVisible();
  await expect(s.getByTestId('dom-debate-said')).toContainText('Tell me what you bring');

  // Reload: the same turn and voice come back from the save (nothing asked again).
  const before = await block(page);
  await page.goto('/?ui=new&aifake=1');
  await waitForScene(page, 'MainMenu');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.continueRun();
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  });
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
  expect(await block(page)).toEqual(before);
  await s.getByTestId('dom-title-1').click();
  await expect(s.getByTestId('dom-debate-said')).toContainText('Tell me what you bring');
  expect(errors).toEqual([]);
});

test('The Debate, typed words without a Key-Card: the rules read them, the written reply types itself, B skips', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new');
  const s = await newDominion(page);
  await sitDown(page, s);
  // Esc in the typing box cancels; nothing is argued.
  const box = page.getByTestId('type-box-input');
  await expect(async () => {
    if (!(await box.count())) await page.keyboard.press('KeyT');
    await expect(box).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 15_000 });
  await page.keyboard.press('Escape');
  await expect(box).toHaveCount(0);
  await expect(s.getByTestId('dom-notice')).toHaveCount(0);
  expect((await block(page)).debate.live.turns).toHaveLength(0);

  await typeWords(page, 'Power and profit, together. Split Celadon money every week.');
  await expect(s.getByTestId('dom-debate-judge-chip')).toHaveText('Read by the rules (no Key-Card)');
  await expect(s.getByTestId('dom-debate-value-0')).toBeVisible();
  await page.keyboard.press('KeyB');
  await expect(s.getByTestId('dom-debate-status')).toContainText('has finished');
  const t = (await block(page)).debate.live.turns[0];
  expect(t.typed.rotom).toBe(false);
  expect(t.voice).toBeUndefined();
  await expect(s.getByTestId('dom-debate-reply')).toContainText(t.reply);
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-debate-argue')).toBeVisible();
  await expect(s.getByTestId('dom-debate-move')).toHaveText(/[+−±]\d+/);
  expect(errors).toEqual([]);
});
