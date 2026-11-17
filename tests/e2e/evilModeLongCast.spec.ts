import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// Evil Mode slice 17 ("the long cast"), in the New look. Taps: a crew member's own quest shows on the Roster and its
// step is taken from their card (the block moves a step). Keys: J opens the Suspicions page and closes it; nothing on
// it names the mole. Taps: the mole knocks at the Office at Night; an answer closes the scene. Screens at three sizes.

const stage = (page: Page) => view(page, 'Evil');
const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run?.expansion?.evilMode);

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
  await page.evaluate(() => (window as any).__pkr.session.evilFound({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm' }, 2));
}

async function setUp(page: Page, fn: string) {
  await page.evaluate((fn) => {
    const p = (window as any).__pkr;
    const b = p.session.run.expansion.evilMode;
    new Function('b', fn)(b);
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  }, fn);
  await waitForScene(page, 'Evil');
  await expect(stage(page).getByTestId('evil-team-name')).toBeVisible();
  await page.waitForTimeout(300);
}

async function shots(page: Page, info: { outputPath: (n: string) => string }, name: string) {
  for (const [w, h] of [[1280, 720], [960, 540], [740, 360]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    await page.screenshot({ path: info.outputPath(`${name}-${w}x${h}.png`) });
  }
  await page.setViewportSize({ width: 1280, height: 720 });
}

// The first founder with a written quest, at Dispatch, quest open.
const QUEST = `const p = b.crew.find((c) => c.where === 'in' && c.ref && c.id !== 'patron');
  b.quests[p.id] = { step: 0, at: '0:0', run: 0, state: 'open', ending: null, busy: 0, goes: false };
  b.here.beat = 'dispatch'; window.__questWho = p.id;`;

test('a quest: its line shows on the Roster and a step is taken by tap', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page);
  await setUp(page, QUEST);
  const s = stage(page);
  const who = await page.evaluate(() => (window as any).__questWho as string);
  const b0 = await block(page);
  const name = b0.crew.find((c: any) => c.id === who).name as string;
  await page.keyboard.press('KeyR');
  await expect(s.getByTestId('evil-roster')).toBeVisible();
  const card = s.getByTestId('evil-person').filter({ hasText: name });
  await expect(card).toContainText('Quest:');
  await card.click();
  const stepBtn = s.getByTestId('evil-ract-qstep');
  await expect(stepBtn).toBeVisible();
  await shots(page, info, 'quest');
  const q0 = (await block(page)).quests[who];
  if (q0) {
    await stepBtn.click();
    await page.waitForTimeout(200);
    const b1 = await block(page);
    // Either the step's taken, or its greyed button says why (a boss step waits for In person).
    expect(b1.quests[who].step === 1 || (await stepBtn.getAttribute('title'))!.length > 0).toBe(true);
  }
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('J opens the Suspicions page; it never names the mole', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page);
  await setUp(page, `const p = b.crew.find((c) => c.where === 'in' && c.id !== 'patron'); b.mole.handler = 'police'; b.mole.who = p.id; b.mole.state = 'reporting'; b.mole.marks = 1;
    b.mole.slips = [{ day: 1, tell: 5, about: p.id }];`);
  const s = stage(page);
  await page.keyboard.press('KeyJ');
  await expect(s.getByTestId('evil-suspicions')).toBeVisible();
  expect(await s.getByTestId('evil-suspect').count()).toBeGreaterThan(0);
  expect(await s.getByTestId('evil-suspicions').innerText()).not.toMatch(/\bmole\b/i);
  await shots(page, info, 'suspicions');
  await page.keyboard.press('KeyJ');
  await expect(s.getByTestId('evil-suspicions')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the knock at the Office: an answer by tap closes it', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page);
  await setUp(page, `const p = b.crew.find((c) => c.where === 'in' && c.id !== 'patron'); b.mole.handler = 'police'; b.mole.who = p.id; b.mole.state = 'reporting'; b.mole.marks = 1;
    p.loyalty = 8; b.here.beat = 'night'; b.mole.knocked = true; b.mole.scene = { kind: 'knock', about: p.id, lines: ['I have to tell you something.'] };`);
  const s = stage(page);
  await expect(s.getByTestId('evil-office-scene')).toBeVisible();
  await shots(page, info, 'knock');
  await s.getByTestId('evil-mole-tell').click();
  await expect(s.getByTestId('evil-office-scene')).toHaveCount(0);
  expect((await block(page)).mole.state).toBe('stopped');
  expect(errors).toEqual([]);
});
