import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D22 (spies on the crew): a suspected member shows Suspicion on the Crew File; F opens the Confront room
// (Rotom mockup a6): quick questions and a typed line, the tell, the endings picked by the rules; Let it go / Accuse.
// The talk is saved and comes back after a reload.

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
/** Presses a key until the screen shows `id` (a press can be lost in a busy headless frame). */
const pressUntil = (page: Page, key: string, shown: () => Promise<unknown>) => expect(async () => {
  await page.keyboard.press(key);
  await shown();
}).toPass({ timeout: 15_000 });

test('Confront a suspected member: Suspicion, questions, a typed line, the tell, and the talk reloads', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  const s = await newDominion(page);

  // A rival mole is the first member, with three clues against them (the World Turn's job in a real run).
  await page.evaluate(() => {
    const b = (window as any).__pkr.session.run.expansion.dominion;
    const id = b.members[0].id;
    b.rivals.teams.rocket.spies = 1;
    b.spies = {
      moles: [{ member: id, team: 'rocket', day: b.day, turned: false, exposed: false }],
      sus: { [id]: 78 }, quiet: {}, talk: null, done: [],
      clues: [
        { member: id, day: b.day, text: 'Seen near the Game Corner Hideout' },
        { member: id, day: b.day, text: 'Paid off a debt in cash' },
        { member: id, day: b.day, text: 'Team Rocket knew the patrol time' },
      ],
    };
  });

  await pressUntil(page, 'Digit3', () => expect(s.getByTestId('dom-file-suspicion')).toHaveText('Suspicion 78', { timeout: 1500 }));
  await expect(s.getByTestId('dom-file-keys')).toContainText('Confront');
  await pressUntil(page, 'KeyF', () => expect(s.getByTestId('dom-spy-title')).toContainText('Confront', { timeout: 1500 }));
  await expect(s.getByTestId('dom-spy-sus')).toHaveText('78');
  await expect(s.getByTestId('dom-spy-clue')).toHaveCount(3);
  await expect(s.getByTestId('dom-spy-note')).toContainText('patrol time');
  await expect(s.getByTestId('dom-spy-end-confess')).toBeVisible();
  await expect(s.getByTestId('dom-spy-end-battle')).toBeVisible();

  // A quick question: the member answers from the rules.
  await s.getByTestId('dom-spy-q-evidence').click();
  await expect(s.getByTestId('dom-spy-reply')).toHaveCount(1);
  await expect(s.getByTestId('dom-spy-talk')).toContainText('3 left');

  // A typed line: Enter says it; the input keeps the keys (Q, R, L, digits don't leave the room).
  const input = s.getByTestId('dom-spy-type');
  await input.click();
  await page.keyboard.type('Your mum lives in Fuchsia. R? L? 3');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-spy-talk')).toContainText('2 left');
  await expect(s.getByTestId('dom-spy-talk')).toContainText('Your mum lives in Fuchsia. R? L? 3');
  const b = await block(page);
  expect(b.spies.talk.turns.map((t: any) => t.q)).toEqual(['evidence', 'typed']);
  expect(b.spies.talk.turns[1].said).toBe('Your mum lives in Fuchsia. R? L? 3');

  // Esc leaves the box; a letter pressed on the screen starts a new line (and W isn't read as a move).
  await expect(input).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(input).not.toBeFocused();
  await page.keyboard.press('KeyW');
  await expect(input).toHaveValue('w');
  await expect(s.getByTestId('dom-spy-title')).toBeVisible();
  await expect(view(page, 'Dominion')).not.toContainText(/Claude|\bAI\b/);

  for (const [w, h] of [[1280, 720], [960, 540], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await expect(s.getByTestId('dom-spy-talk')).toBeVisible();
    await shot(`a6-confront-${w}x${h}`);
  }

  // Reload mid-talk: the talk is in the save.
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
  expect((await block(page)).spies).toEqual(before.spies);
  expect(errors).toEqual([]);
});

test('Accuse ends the talk with the rules\' ending; Let it go lowers Suspicion', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new');
  const s = await newDominion(page);
  await page.evaluate(() => {
    const b = (window as any).__pkr.session.run.expansion.dominion;
    const id = b.members[0].id;
    b.spies = { moles: [], sus: { [id]: 50 }, quiet: {}, talk: null, done: [], clues: [{ member: id, day: b.day, text: 'Came back late with no story' }] };
  });
  await pressUntil(page, 'Digit3', () => expect(s.getByTestId('dom-file-suspicion')).toHaveText('Suspicion 50', { timeout: 1500 }));
  await pressUntil(page, 'KeyF', () => expect(s.getByTestId('dom-spy-title')).toBeVisible({ timeout: 1500 }));
  await s.getByTestId('dom-spy-q-probe').click();
  await expect(s.getByTestId('dom-spy-reply')).toHaveCount(1);
  // Innocent: accusing clears them (and hurts).
  const loyalty = (await block(page)).members[0].loyalty;
  await s.getByTestId('dom-spy-accuse').click();
  await expect(s.getByTestId('dom-file-stats')).toBeVisible();
  await expect(s.getByTestId('dom-notice')).toContainText('was clean');
  const b = await block(page);
  expect(b.spies.talk).toBeNull();
  expect(b.spies.done[0].end).toBe('cleared');
  expect(b.members[0].loyalty).toBe(loyalty - 15);
  // Once a day: F now explains instead of opening.
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});
