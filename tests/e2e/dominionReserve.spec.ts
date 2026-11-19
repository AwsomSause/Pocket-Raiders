import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D4 (ranks, Team Types and the Reserve): the Pokémon Reserve (mockup 11, tab 4) where the Boss gives
// Rook his second Pokémon by hand, and the Rank Pyramid (mockup 12, P on the Crew File) where Rook is promoted.
// Saved at every step; a reload keeps both.

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

test('the Reserve: give Rook a Pokémon by hand; the Pyramid: promote him; both reload', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  const s = await newDominion(page);

  // Tab 4: the Reserve, with Day 1's Pokémon of the other Team Type.
  await page.keyboard.press('Digit4');
  await expect(s.getByTestId('dom-reserve')).toBeVisible();
  await expect(s.getByTestId('dom-reserve-count')).toHaveText('1 / 20');
  await expect(s.getByTestId('dom-who')).toHaveText('Rook');
  await expect(s.getByTestId('dom-tile-0')).toContainText('FITS');
  await expect(s.getByTestId('dom-ghost')).toBeVisible();
  await expect(s.getByTestId('dom-give-cta')).toContainText('to Rook');
  await page.waitForTimeout(900); // let the round-3 entrance finish so the shot is the rest frame
  await shot('11-reserve');
  const b0 = await block(page);
  const uid = b0.reserve.box[0].uid;
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-notice')).toContainText('goes to Rook');
  const b1 = await block(page);
  expect(b1.members[0].team.map((m: { uid: string }) => m.uid)).toContain(uid);
  expect(b1.reserve.box).toHaveLength(0);
  await expect(s.getByTestId('dom-reserve-count')).toHaveText('0 / 20');

  // E and W: the Boss is the other target (no BST cap). (Q is the command wheel.)
  await page.keyboard.press('KeyE');
  await expect(s.getByTestId('dom-who')).toHaveText('The Boss');
  await expect(s.getByTestId('dom-bstcap')).toHaveText('—');
  await page.keyboard.press('KeyW');
  await expect(s.getByTestId('dom-who')).toHaveText('Rook');

  // Several window sizes.
  for (const [w, h] of [[1280, 720], [960, 540], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await expect(s.getByTestId('dom-give')).toBeVisible();
    await shot(`reserve-${w}x${h}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });

  // The Crew File, then P: the Rank Pyramid. Rook reaches member Lv 6 (as if he'd earned it): a Senior Grunt seat waits.
  await page.keyboard.press('Digit3');
  await expect(s.getByTestId('dom-file-keys')).toContainText('Pyramid');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.run.expansion.dominion.members[0].level = 6;
  });
  await page.keyboard.press('KeyP');
  await expect(s.getByTestId('dom-tier-16')).toContainText('THE BOSS');
  await expect(s.getByTestId('dom-tier-4')).toHaveClass(/hot/);
  await expect(s.getByTestId('dom-seat')).toContainText('SENIOR GRUNT SEAT OPEN');
  await expect(s.getByTestId('dom-promote')).toContainText('Promote Rook');
  await page.waitForTimeout(900);
  await shot('12-pyramid');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-notice')).toContainText('SENIOR GRUNT');
  const after = await block(page);
  expect(after.members[0].rank).toBe('senior-grunt');
  expect(after.members[0].wage).toBe(130);
  await shot('pyramid-promoted');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-file-keys')).toBeVisible();

  // Reload: the gift and the rank are still there.
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
  await expect(view(page, 'Dominion').getByTestId('dom-phase')).toHaveText('EVENING');
  expect(await block(page)).toEqual(after);
  expect(errors).toEqual([]);
});
