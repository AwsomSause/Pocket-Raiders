import { expect, test, type Page } from '@playwright/test';
import { open, scene, start, toCommands, view, waitForScene, watch } from './helpers/newUi';
import { confirmUntil } from './battleInput';

// Evil Mode slice 8 ("the Gym"), in the New look. Keys only: the Gym page (Y), five doors with who shut each, Koga
// refused at Buy; Beat at the In person beat goes into the real battle screen against Misty, lost, and the day goes on.
// Taps only: the Board's right rail on the Gym; a Bend step done by its door.

const stage = (page: Page) => view(page, 'Evil');
const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.evilMode);

async function founded(page: Page, prep: string = '') {
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
  await page.evaluate((prep) => {
    const p = (window as any).__pkr;
    p.session.evilFound({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm' }, 2);
    const b = p.session.run.expansion.evilMode;
    for (const c of b.crew) c.line = null;
    if (prep === 'koga') { b.gyms = [{ leaderId: 'koga', region: 0, district: 1, way: null, standing: 'wary', moved: 'Never asked anything.', closed: [], tried: 0, bend: 0, officer: null, insults: 0, foundOut: false, loud: null, heroTries: 0, heroNeeds: null }]; b.team.funds = 50000; for (const h of b.district.holdings) if (h.kind === 'gym') h.scouted = 2; }
    if (prep === 'scouted') for (const h of b.district.holdings) if (h.kind === 'gym') h.scouted = 2;
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  }, prep);
  await waitForScene(page, 'Evil');
  await expect(stage(page).getByTestId('evil-map')).toBeVisible();
  await page.waitForTimeout(300);
}

async function shots(page: Page, info: { outputPath: (n: string) => string }, name: string) {
  for (const [w, h] of [[1280, 720], [960, 540], [740, 360]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    await page.screenshot({ path: info.outputPath(`${name}-${w}x${h}.png`) });
  }
}

test('keys only: Koga can\'t be bought; Misty beaten at, in the battle screen, and the day goes on', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page, 'koga');
  const s = stage(page);
  await page.keyboard.press('KeyY');
  await expect(s.getByTestId('evil-gym-title')).toHaveText('Fuchsia Gym · Koga');
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('evil-gym-door-buy')).toHaveAttribute('data-open', 'false');
  await expect(s.getByTestId('evil-gym-door-buy')).toContainText('Shut by him');
  await expect(s.getByTestId('evil-gym-problem')).toContainText('which pocket');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  expect((await block(page)).gyms[0]).toMatchObject({ leaderId: 'koga', way: null });
  await shots(page, info, 'gym-koga');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('evil-gym')).toHaveCount(0);

  // Back to Cerulean; to the In person beat: Morning, then Send (Up wraps to "Send them").
  await page.evaluate(() => { (window as any).__pkr.session.run.expansion.evilMode.gyms = []; });
  for (const k of ['Enter', 'ArrowUp', 'Enter']) {
    await page.keyboard.press(k);
    await page.waitForTimeout(150);
  }
  await expect(s.getByTestId('evil-beat-inPerson')).toHaveAttribute('data-state', 'now');
  await page.keyboard.press('KeyY');
  await expect(s.getByTestId('evil-gym-title')).toHaveText('Cerulean Gym · Misty');
  await expect(s.getByTestId('evil-gym-door-beat')).toHaveAttribute('data-open', 'true');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  await page.waitForTimeout(250);
  const trainer = await page.evaluate(() => (window as any).__pkr.session.run.battle.trainer);
  expect(trainer).toMatchObject({ classId: 'gym-leader', name: 'Misty', leaderId: 'misty' });
  // Lose: the lead at 1 HP with only Splash, the rest fainted.
  await toCommands(page);
  await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    run.party.forEach((m: any, i: number) => { m.hp = i === 0 ? 1 : 0; });
    run.party[0].moves = [{ ...run.party[0].moves[0], id: 'splash', pp: 40 }];
    run.battle.enemyTeam.forEach((m: any) => { m.moves = [{ ...m.moves[0], id: 'tackle', pp: 35 }]; });
  });
  const b = view(page, 'Battle');
  const atEvil = async () => (await scene(page)) === 'Evil';
  for (let i = 0; i < 6 && !(await atEvil()); i++) {
    const menu = await page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle')?.menu));
    if (menu) {
      await b.locator('[data-act="pick"]', { hasText: 'Fight' }).click();
      await page.waitForTimeout(250);
      await b.locator('.btn.mv').first().click();
    }
    await confirmUntil(page, async () => (await atEvil()) || (await page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle')?.menu))), 40_000);
  }
  await waitForScene(page, 'Evil');
  const after = await block(page);
  expect(after.gyms[0]).toMatchObject({ leaderId: 'misty', way: null, tried: 1 });
  expect(await page.evaluate(() => (window as any).__pkr.session.run.phase)).toBe('map');
  expect(errors).toEqual([]);
});

test('taps only: the right rail on the Gym; a Bend step done by its door', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page, 'scouted');
  const s = stage(page);
  await s.getByTestId('evil-cell-20').click();
  await expect(s.getByTestId('evil-gym-rail')).toContainText('Beat');
  await expect(s.getByTestId('evil-gym-rail')).toContainText('Befriend');
  await expect(s.getByTestId('evil-panel-name')).toHaveText('Cerulean Gym · Misty');
  // Morning, then Send: tap the beat button twice (Dispatch's "Send them" row).
  await s.locator('[data-act="advance"]').first().click();
  await page.waitForTimeout(200);
  await s.getByTestId('evil-send-row').click();
  await page.waitForTimeout(200);
  await expect(s.getByTestId('evil-beat-inPerson')).toHaveAttribute('data-state', 'now');
  await s.getByTestId('evil-gym-open').click();
  await s.getByTestId('evil-gym-door-bend').click();
  await expect(s.getByTestId('evil-gym-card')).toContainText('What bends them');
  await s.getByTestId('evil-gym-do').click();
  await expect(s.getByTestId('evil-gym-said')).toContainText('Bend, step 1 of 3');
  expect((await block(page)).gyms[0]).toMatchObject({ bend: 1, way: null });
  await expect(s.getByTestId('evil-gym-problem')).toContainText('already been out today');
  await shots(page, info, 'gym-bend');
  expect(errors).toEqual([]);
});
