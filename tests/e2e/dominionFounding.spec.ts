import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D7 (the Founding and team colours): before the Founding Rook wears a grey band and the emblem is
// blank; at Street Gang with both First Steps done the HQ shows THE FOUNDING (key O). The page: a name from the
// record or typed, two colours, the initial and mark, a motto and a Goal; Found the team plays the sign going up and
// the emblem, the armband and Rook's picture take the colours. Saved; a reload keeps the team.

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

test('the Founding: grey band before, the page, typing a name, colours and Goal, the sign goes up; reload keeps it', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  const s = await newDominion(page);

  // Before: blank emblem, grey band, no Founding yet (O says why).
  await expect(s.getByTestId('dom-team')).toHaveText('UNNAMED CREW');
  await expect(s.getByTestId('dom-band')).toContainText('blank armband');
  await expect(s.getByTestId('dom-founding-ready')).toHaveCount(0);
  await page.keyboard.press('KeyO');
  await expect(s.getByTestId('dom-notice')).toContainText('Street Gang');
  await expect(s.getByTestId('dom-hq-pic')).toHaveAttribute('src', /^data:image\/png/);
  await shot('hq-before');

  // Both First Steps done and Street Gang reached (set on the run: D6's ladder and D1's steps are tested there).
  await page.evaluate(() => {
    const b = (window as any).__pkr.session.run.expansion.dominion;
    b.stepsDone = ['earn-500', 'contact'];
    b.empire.peak = 1;
  });
  await page.keyboard.press('Digit1');
  await expect(s.getByTestId('dom-founding-ready')).toBeVisible();
  await shot('hq-founding-ready');
  await page.keyboard.press('KeyO');
  await expect(s.getByTestId('dom-founding')).toBeVisible();
  await expect(s.getByTestId('dom-f-ideas')).toContainText('Team Venom');
  await expect(s.getByTestId('dom-f-name-text')).toContainText('Team Venom');
  await expect(s.getByTestId('dom-f-letter')).toHaveText('V');
  await shot('founding');

  // ▶ on the name: the next idea from the record (and its initial).
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('dom-f-name-text')).toContainText('Team Shade');
  await expect(s.getByTestId('dom-f-letter')).toHaveText('S');

  // Enter types: Backspace, letters (WASD, Space, X and Z are letters here), Enter finishes. (The keyboard switches
  // between the game and the field at a frame's end: a short wait either side, as a player's hands give.)
  const settle = () => page.waitForTimeout(120);
  await page.keyboard.press('Enter');
  await settle();
  for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
  await page.keyboard.type('Night Shift');
  await expect(s.getByTestId('dom-f-name-text')).toContainText('Night Shift');
  await page.keyboard.press('Enter');
  await settle();
  await expect(s.getByTestId('dom-founding')).toBeVisible();
  await expect(s.getByTestId('dom-f-letter')).toHaveText('N');

  // Colours: ▼ to Primary, ▶ moves it; the secondary is picked with a tap.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await s.locator('[data-act="fSecondary"][data-arg="gold"]').click();
  // ▼ to the Goal (initial, mark, motto between), ▶ to the first Goal.
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('dom-f-goal-name')).toHaveText('Total Takeover');
  await expect(s.getByTestId('dom-armband')).toContainText('N');
  await shot('founding-filled');

  // A taken name is refused on the page.
  await s.getByTestId('dom-f-name').click();
  for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
  await page.keyboard.type('Rocket');
  await page.keyboard.press('Enter');
  await settle();
  await s.getByTestId('dom-f-found').click();
  await expect(s.getByTestId('dom-problem')).toContainText('already a team');
  await s.getByTestId('dom-f-name').click();
  for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
  await page.keyboard.type('Night Shift');
  await page.keyboard.press('Enter');
  await settle();
  await expect(s.getByTestId('dom-f-name-text')).toContainText('Night Shift');

  // Several window sizes.
  for (const [w, h] of [[1280, 720], [960, 540], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await expect(s.getByTestId('dom-founding')).toBeVisible();
    await shot(`founding-${w}x${h}`);
  }

  // Found the team: the sign goes up, Rook ties his armband on.
  await s.getByTestId('dom-f-found').click();
  await expect(s.getByTestId('dom-sign-name')).toHaveText('NIGHT SHIFT');
  await expect(s.getByTestId('dom-founded')).toContainText('Night Shift');
  await page.waitForTimeout(400);
  await shot('founded');
  for (let i = 0; i < 3; i++) await s.getByTestId('dom-founded').click();
  await expect(s.getByTestId('dom-team')).toHaveText('NIGHT SHIFT');
  await expect(s.getByTestId('dom-emblem').first()).toHaveText('N');
  await expect(s.getByTestId('dom-band')).toContainText('Night Shift armband');
  await expect(s.getByTestId('dom-founding-ready')).toHaveCount(0);
  const b = await block(page);
  expect(b.team).toMatchObject({ name: 'Night Shift', initial: 'N', secondary: 'gold', goal: 'total-takeover' });
  expect(b.team.primary).not.toBe('purple');
  await page.waitForTimeout(300);
  await shot('hq-after');

  // Reload: the team is still there, and the title tower carries the initial.
  await page.goto('/?ui=new');
  await waitForScene(page, 'MainMenu');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.continueRun();
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  });
  await waitForScene(page, 'Dominion');
  const t = view(page, 'Dominion');
  await expect(t.getByTestId('dom-tower')).toHaveText('N');
  await shot('title-after');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await expect(t.getByTestId('dom-team')).toHaveText('NIGHT SHIFT');
  expect((await block(page)).team).toEqual(b.team);
  expect(errors).toEqual([]);
});
