import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D19 (personality cards): P on the Crew File opens the member's card (Rotom mockup a3), Q/E flip
// members, Esc goes back. The card is kept in the save and comes back the same after a reload.

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
const traitName = (id: string) => (id === 'loner' ? 'LONE WOLF' : id.toUpperCase());

test('the personality card on the Crew File: traits, quirk, home town, flip members, and it reloads the same', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  const s = await newDominion(page);

  // Hire a second Grunt so there's someone to flip to.
  await page.keyboard.press('Digit3');
  await expect(s.getByTestId('dom-file-keys')).toContainText('Card');
  await page.keyboard.press('KeyH');
  await s.getByTestId('dom-hire-0').click();
  await expect(s.getByTestId('dom-notice')).toContainText('joined');
  await page.keyboard.press('Escape');
  const b = await block(page);
  expect(b.members).toHaveLength(2);
  for (const m of b.members) expect(m.crew.card.t).toHaveLength(2);

  // P: Rook's card.
  await page.keyboard.press('KeyP');
  await expect(s.getByTestId('dom-persona-name')).toContainText('ROOK');
  const traits = s.getByTestId('dom-persona-trait');
  await expect(traits).toHaveCount(2);
  await expect(traits.nth(0)).toContainText(traitName(b.members[0].crew.card.t[0]));
  await expect(traits.nth(1)).toContainText(traitName(b.members[0].crew.card.t[1]));
  await expect(s.getByTestId('dom-persona-home')).toHaveText(b.members[0].crew.card.h);
  await expect(s.getByTestId('dom-persona-effects')).toContainText('traits do');
  await expect(s.getByTestId('dom-persona-line')).toBeVisible();
  await expect(s.getByTestId('dom-persona-rotom')).toContainText('Rotom');
  await expect(view(page, 'Dominion')).not.toContainText(/Claude|\bAI\b/);
  await shot('a3-personality-card');

  // E: the next member's card; Q back.
  await page.keyboard.press('KeyE');
  await expect(s.getByTestId('dom-persona-name')).toContainText(b.members[1].name.toUpperCase());
  await expect(s.getByTestId('dom-persona-home')).toHaveText(b.members[1].crew.card.h);
  await page.keyboard.press('KeyQ');
  await expect(s.getByTestId('dom-persona-name')).toContainText('ROOK');

  for (const [w, h] of [[1280, 720], [960, 540], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await expect(s.getByTestId('dom-persona-card')).toBeVisible();
    await shot(`card-${w}x${h}`);
  }

  // Esc: back to the Crew File; the card was free to look at.
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-file-stats')).toBeVisible();
  const before = await block(page);
  expect(before).toEqual(b);

  // Reload: the same cards.
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
  const after = await block(page);
  expect(after.members.map((m: any) => m.crew.card)).toEqual(before.members.map((m: any) => m.crew.card));
  expect(errors).toEqual([]);
});
