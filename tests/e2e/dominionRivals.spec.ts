import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D9 (the rival team): Team Rocket's Tension shows on the HQ as mockup 9's threat row ("TENSION 83 ·
// Giovanni will raid your HQ within 3 nights.") and on the Morning as mockup 2's badge ("Tension: AT WAR"). R opens
// the Rival File: pay a demand, offer a truce; R or Esc closes it. A click on the badge opens it too. A reload keeps it.

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

test('Rival File: the threat row, pay a demand, offer a truce, the Morning badge, and it reloads', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  const s = await newDominion(page);

  // A new run: Rocket doesn't know you yet (no threat row), but the Rival File is one key away.
  const fresh = await block(page);
  expect(fresh.rivals.teams.rocket).toMatchObject({ tension: 0, stage: 0 });
  await expect(s.getByTestId('dom-rival-open')).toBeVisible();
  await expect(s.getByTestId('dom-threat')).toBeHidden();

  // Weeks later (set by hand, then saved by the first answer): Tension 83, the Boss raid three nights off, a demand.
  await page.evaluate(() => {
    const b = (window as any).__pkr.session.run.expansion.dominion;
    const t = b.rivals.teams.rocket;
    Object.assign(t, { tension: 83, peak: 83, stage: 5, raid: b.day + 3 });
    b.funds = 5000;
    b.rivals.cards.push({ kind: 'demand', team: 'rocket', ref: 'admin-demands-tribute', who: 'Archer', amount: 300, district: null, ask: null, until: b.day + 3 });
  });
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  await expect(s.getByTestId('dom-threat')).toContainText('TENSION 83');
  await expect(s.getByTestId('dom-threat')).toContainText('Giovanni will raid your HQ within 3 nights.');
  for (const [w, h] of [[1280, 720], [960, 540], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await expect(s.getByTestId('dom-threat')).toBeVisible();
    await shot(`9-threat-${w}x${h}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });

  // R opens the Rival File.
  await page.waitForTimeout(250);
  await page.keyboard.press('KeyR');
  await expect(s.getByTestId('dom-rival-boss')).toBeVisible();
  await expect(s.getByTestId('dom-rival-tension')).toHaveText('83');
  await expect(s.getByTestId('dom-rival-stage')).toHaveText('BOSS');
  await expect(s.getByTestId('dom-rival-raid')).toContainText('within 3 nights');
  await expect(s.getByTestId('dom-rival-plan')).toContainText('Hidden');
  await expect(s.getByTestId('dom-rival-row-card-0-0')).toContainText('Pay ₽300');
  await shot('rival-file');

  // Enter pays Archer: −₽300, Tension −5.
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-notice')).toContainText('Paid Archer');
  await expect.poll(async () => (await block(page)).funds).toBe(4700);
  expect((await block(page)).rivals.teams.rocket.tension).toBe(78);
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-notice')).toBeHidden();

  // Offer a truce: tribute paid, Tension −10, the raid called off.
  await s.getByTestId('dom-rival-row-truce').click();
  await expect(s.getByTestId('dom-rival-truce')).toBeVisible();
  const truced = await block(page);
  expect(truced.rivals.teams.rocket.truce).not.toBeNull();
  expect(truced.rivals.teams.rocket.raid).toBeNull();
  expect(truced.rivals.teams.rocket.tension).toBe(68);
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-rival-row-break')).toBeVisible();
  await shot('rival-file-truce');

  // R closes it; the HQ's row now says the truce holds.
  await page.waitForTimeout(200);
  await page.keyboard.press('KeyR');
  await expect(s.getByTestId('dom-rival-boss')).toBeHidden();
  await expect(s.getByTestId('dom-threat')).toContainText('A truce with Team Rocket holds.');

  // Round to the Morning: the badge reads Rocket's Tension (68: At war).
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('NIGHT');
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('MORNING');
  for (let n = (await block(page)).crew.talks.length; n > 0; n--) {
    await s.getByTestId('dom-talk-0').click();
    await expect.poll(async () => (await block(page)).crew.talks.length).toBe(n - 1);
  }
  await expect(s.getByTestId('dom-badge')).toHaveText(/^Tension: (AT WAR|HOSTILE)$/);
  await shot('2-morning-badge');
  // A click on the badge opens the Rival File; Esc goes back to the Morning.
  // (The badge pulses, so it's never "stable" for Playwright: force the click.)
  await s.getByTestId('dom-badge').click({ force: true });
  await expect(s.getByTestId('dom-rival-boss')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-morning-report')).toBeVisible();

  // Reload: the truce and the paid demand are still there.
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
  expect(errors).toEqual([]);
});
