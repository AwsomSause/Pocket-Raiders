import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D13 (the Debate, offline): Giovanni sends word for a summit (a Rival File card). Sitting down opens
// mockup 8: the Leader's Table, the last verdict, the Conviction bar, the stance cards (keys 1-4), a set line (▲▼) and
// Argue (Enter). Esc asks before walking out. A reload mid-Debate comes back to the table. Six turns give the result.

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

test('The Debate: sit down from a summit card, argue with set lines, walk-out guard, reload, the result', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  const s = await newDominion(page);

  // Giovanni sends word (rival action 119, Neutral ground summit): a Debate card on the Rival File.
  await page.evaluate(() => {
    const b = (window as any).__pkr.session.run.expansion.dominion;
    Object.assign(b.rivals.teams.rocket, { tension: 45, peak: 45, stage: 2 });
    b.rivals.cards.push({ kind: 'debate', team: 'rocket', ref: 'neutral-ground-summit', who: 'Giovanni', amount: 0, district: null, ask: null, until: b.day + 3 });
  });
  await page.waitForTimeout(250);
  await page.keyboard.press('KeyR');
  await expect(s.getByTestId('dom-rival-row-card-0-0')).toContainText('Sit down for a Debate');
  await page.keyboard.press('Enter');

  // Mockup 8: the table.
  await expect(s.getByTestId('dom-debate-title')).toContainText('vs. Giovanni');
  await expect(s.getByTestId('dom-debate-round')).toHaveText('Values');
  await expect(s.getByTestId('dom-debate-said')).toContainText('Power is the only honest currency');
  await expect(s.getByTestId('dom-debate-conviction')).toHaveText('Conviction ±0');
  await expect(s.getByTestId('dom-debate-stance-recruit')).toHaveText(/Recruit him/);
  for (const [w, h] of [[1280, 720], [960, 540], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await expect(s.getByTestId('dom-debate-argue')).toBeVisible();
    await shot(`8-debate-${w}x${h}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });

  // Partnership, line 1 (the mockup's line), Enter: Giovanni leans to profit, +18.
  await page.keyboard.press('Digit1');
  await expect(s.getByTestId('dom-debate-line')).toContainText('You won\'t kneel.');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-debate-move')).toHaveText('+18');
  await expect(s.getByTestId('dom-debate-conviction')).toHaveText('Conviction +18');
  expect((await block(page)).debate.live.turns).toHaveLength(1);
  await shot('8-debate-verdict');

  // Merger (key 2), the second line (▼), Argue by click.
  await page.keyboard.press('Digit2');
  await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('dom-debate-line')).toContainText('Fold Team Rocket into mine');
  await s.getByTestId('dom-debate-argue').click();
  await expect.poll(async () => (await block(page)).debate.live.turns.length).toBe(2);
  await expect(s.getByTestId('dom-debate-round')).toHaveText('Methods');

  // Esc asks first; Enter stays at the table.
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-notice')).toContainText('Walk out on Giovanni?');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-notice')).toBeHidden();
  await expect(s.getByTestId('dom-debate-title')).toBeVisible();

  // Reload mid-Debate: Continue goes straight back to the table, same turns.
  const before = await block(page);
  await page.goto('/?ui=new');
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
  await expect(s.getByTestId('dom-debate-title')).toBeVisible();
  await expect(s.getByTestId('dom-debate-round')).toHaveText('Methods');

  // Four more turns: Recruit, Partnership, Recruit, Partnership.
  for (const key of ['Digit3', 'Digit1', 'Digit3', 'Digit1']) {
    const n = (await block(page)).debate.live.turns.length;
    await page.keyboard.press(key);
    await page.keyboard.press('Enter');
    await expect.poll(async () => (await block(page)).debate.live.turns.length).toBe(n + 1);
  }
  await expect(s.getByTestId('dom-debate-result')).toBeVisible();
  const live = (await block(page)).debate.live;
  expect(live.result).not.toBeNull();
  await shot('8-debate-result');
  if (live.phase === 'choose') {
    await s.getByTestId('dom-debate-branch').click();
    await expect(s.getByTestId('dom-debate-done')).toBeVisible();
  }
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-debate-title')).toBeHidden();
  expect((await block(page)).debate.live).toBeNull();
  expect((await block(page)).debate.past).toHaveLength(1);
  expect(errors).toEqual([]);
});
