import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D12 (the Chair): from Day 2 the Evening ends at the Chair. A visitor (mockup c1) with two answers and
// Hand it off (c2), the Chair settings (O), a reload in the middle of the sitting, then the Tally (c3) and the Night.

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

test('the Chair: a visitor, the settings, Hand it off, a reload mid-sitting, the Tally, then the Night', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  let s = await newDominion(page);

  // Day 1: hire a second Grunt (Crew File, H), then round to Day 2's Evening. Day 1 has no Chair.
  await page.keyboard.press('Digit3');
  await expect(s.getByTestId('dom-file-name')).toBeVisible();
  await page.keyboard.press('KeyH');
  await s.getByTestId('dom-hire-0').click();
  await expect.poll(async () => (await block(page)).members.length).toBe(2);
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-hire')).toBeHidden();
  await page.keyboard.press('Digit1');
  await expect(s.getByTestId('dom-phase')).toHaveText('EVENING');
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('NIGHT');
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('MORNING');
  for (let n = (await block(page)).crew.talks.length; n > 0; n--) {
    await s.getByTestId('dom-talk-0').click();
    await expect.poll(async () => (await block(page)).crew.talks.length).toBe(n - 1);
  }
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('DAY');
  await page.keyboard.press('KeyE');
  await expect(s.getByTestId('dom-phase')).toHaveText('EVENING');
  // The new hand is made a Grunt so they can take a case (Hand it off needs Grunt rank).
  await page.evaluate(() => { (window as any).__pkr.session.run.expansion.dominion.members[1].rank = 'grunt'; });

  // N: the Chair sits. The first visitor is Rook's mum (card 1, the first sitting).
  await page.keyboard.press('KeyN');
  await expect(s.getByTestId('dom-chair')).toContainText('1 of 1');
  await expect(s.getByTestId('dom-chair-visitor')).toContainText('MUM');
  await expect(s.getByTestId('dom-chair-ask')).toContainText('safe');
  await expect(s.getByTestId('dom-chair-a0')).toContainText('♥');
  await expect(s.getByTestId('dom-chair-a1')).toContainText('✊');
  await expect(s.getByTestId('dom-chair-hand')).toContainText('1 left tonight');
  expect((await block(page)).chair.open).toBe(true);
  await shot('c1-visitor');
  for (const [w, h] of [[1280, 720], [960, 540], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await expect(s.getByTestId('dom-chair-answers')).toBeVisible();
    await shot(`c1-${w}x${h}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });

  // O: the Chair settings. 2 switches the numbers to Exact; the chips then show how much.
  await page.keyboard.press('KeyO');
  await expect(s.getByTestId('dom-chair-opts')).toBeVisible();
  await page.keyboard.press('Digit2');
  await expect.poll(async () => (await block(page)).chair.opts.numbers).toBe('exact');
  await expect(s.getByTestId('dom-chair-opt-numbers').locator('b')).toHaveText('Exact');
  await shot('chair-settings');
  await page.keyboard.press('KeyO');
  await expect(s.getByTestId('dom-chair-opts')).toBeHidden();
  await expect(s.getByTestId('dom-chair-a0')).toContainText('♥ +3');

  // 3: Hand it off (c2). Rook is named on the card, so only the new Grunt can decide. Esc goes back.
  await page.keyboard.press('Digit3');
  await expect(s.getByTestId('dom-hand')).toBeVisible();
  await expect(s.getByTestId('dom-hand-0')).toContainText('named on this card');
  await shot('c2-hand');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-chair-a0')).toBeVisible();

  // Reload in the middle of the sitting: the same visitor waits.
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
  await page.keyboard.press('Enter');
  s = view(page, 'Dominion');
  await expect(s.getByTestId('dom-chair-visitor')).toContainText('MUM');
  expect(await block(page)).toEqual(before);

  // Hand it off to the new Grunt: they decide, and gain Loyalty.
  const loy = before.members[1].loyalty;
  await page.keyboard.press('Digit3');
  await s.getByTestId('dom-hand-1').click();
  await expect(s.getByTestId('dom-chair-result')).toContainText('decides');
  const handed = await block(page);
  expect(handed.chair.handed).toBe(true);
  expect(handed.members[1].loyalty).toBeGreaterThan(loy);

  // Enter: the Tally (c3), then Enter starts the Night.
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-tally')).toContainText('Day 2');
  await expect(s.getByTestId('dom-tally-row')).toHaveCount(1);
  await expect(s.getByTestId('dom-tally-row')).toContainText('decided');
  await shot('c3-tally');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-phase')).toHaveText('NIGHT');
  expect((await block(page)).chair.open).toBe(false);
  expect(errors).toEqual([]);
});
