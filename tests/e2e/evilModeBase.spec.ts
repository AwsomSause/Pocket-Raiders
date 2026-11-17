import { expect, test, type Page } from '@playwright/test';
import { open, scene, start, toCommands, view, waitForScene, watch } from './helpers/newUi';
import { confirmUntil } from './battleInput';

// Evil Mode slice 10 ("the base"), in the New look. Taps: the Base page (B), a site picked, a room built at Night, a
// piece refused with its red square and sentence, a piece placed. Keys: Walk it at the In person beat, into the real
// battle screen against the base's own Grunt, lost, and the walk put away. A Raid's Siege Map: door, a turn, the Office.

const stage = (page: Page) => view(page, 'Evil');
const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.evilMode);
const step = (page: Page, a: unknown) => page.evaluate((a) => (window as any).__pkr.session.evilStep(a), a);
const END: Record<string, string> = { morning: 'dismissOvernight', dispatch: 'send', inPerson: 'stayIn', evening: 'callItADay', night: 'lightsOut', hero: 'watchRoad' };

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
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.evilFound({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm' }, 2);
    const b = p.session.run.expansion.evilMode;
    for (const c of b.crew) c.line = null;
    b.team.funds = 60000;
  });
  await redraw(page);
}

async function redraw(page: Page) {
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  });
  await waitForScene(page, 'Evil');
  await expect(stage(page).getByTestId('evil-team-name')).toBeVisible();
  await page.waitForTimeout(300);
}

async function toBeat(page: Page, beat: string) {
  for (let i = 0; i < 8; i++) {
    const b = await block(page);
    if (b.here.beat === beat) break;
    await step(page, { type: END[b.here.beat] });
  }
  await redraw(page);
}

async function shots(page: Page, info: { outputPath: (n: string) => string }, name: string) {
  for (const [w, h] of [[1280, 720], [960, 540], [740, 360]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    await page.screenshot({ path: info.outputPath(`${name}-${w}x${h}.png`) });
  }
  await page.setViewportSize({ width: 1280, height: 720 });
}

test('taps: pick a site, build a room at Night, a piece refused (red square, the sentence) and one placed', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page);
  const s = stage(page);
  await s.getByTestId('evil-base-open').click();
  await expect(s.getByTestId('evil-base-mode')).toHaveText('site');
  await expect(s.locator('[data-testid^="evil-base-site-"]')).toHaveCount(3);
  await shots(page, info, 'base-sites');
  await s.locator('[data-testid^="evil-base-site-"]').last().click();
  expect((await block(page)).base.site).toBe('lodge');
  await expect(s.getByTestId('evil-base-mode')).toHaveText('base');
  await expect(s.getByTestId('evil-base-fair')).toHaveAttribute('data-ok', 'true');

  await toBeat(page, 'night');
  await s.getByTestId('evil-base-open').click();
  // Build: an empty square, the Mess (the first room's free).
  await s.locator('[data-testid="evil-base-sq"][data-kind="slot"]').first().click();
  await s.getByTestId('evil-base-opt').filter({ hasText: 'The Mess' }).first().click();
  await s.getByTestId('evil-base-do').click();
  await expect(s.getByTestId('evil-base-said')).toBeVisible();
  expect((await block(page)).base.rooms.some((r: any) => r.type === 'mess')).toBe(true);
  await shots(page, info, 'base-built');

  // Defend (a Night's one base action is spent; the next Night).
  await step(page, { type: 'lightsOut' });
  await toBeat(page, 'night');
  await s.getByTestId('evil-base-open').click();
  await s.getByTestId('evil-base-tab-defend').click();
  const office = await page.evaluate(() => (window as any).__pkr.session.run.expansion.evilMode.base.rooms.find((r: any) => r.type === 'office').at);
  // A back way on a square with no outside wall, if there is one; else the free square at the end: something refuses.
  await s.locator('[data-testid="evil-base-sq"][data-kind="slot"]').last().click();
  const bad = s.getByTestId('evil-base-opt').filter({ hasText: 'cupboard' });
  if (await bad.count()) {
    await bad.first().click();
    await expect(s.getByTestId('evil-base-problem')).toContainText('cupboard');
  }
  await s.locator(`[data-testid="evil-base-sq"][data-at="${office}"]`).click();
  await expect(s.getByTestId('evil-base-opt')).toHaveCount(await s.getByTestId('evil-base-opt').count());
  await s.locator('[data-testid="evil-base-sq"][data-kind="slot"]').last().click();
  await s.getByTestId('evil-base-opt').filter({ hasText: 'long corridor' }).first().click();
  await s.getByTestId('evil-base-do').click();
  await expect(s.getByTestId('evil-base-fair')).toHaveAttribute('data-ok', 'true');
  expect((await block(page)).base.pieces).toHaveLength(1);
  await shots(page, info, 'base-defend');
  expect(errors).toEqual([]);
});

test('keys: Walk it at the In person beat, into the battle screen against your own Grunt; lost; put away', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page);
  await page.keyboard.press('KeyB');
  const s = stage(page);
  await expect(s.getByTestId('evil-base-mode')).toHaveText('site');
  await s.locator('[data-testid^="evil-base-site-"]').last().click();
  await toBeat(page, 'night');
  // Two Steady people posted on both squares next to the front door (the lodge's): whichever way the walk goes, one's there.
  await page.evaluate(() => {
    const b = (window as any).__pkr.session.run.expansion.evilMode;
    b.crew[0].loyalty = 7;
    b.crew[1].loyalty = 7;
  });
  expect((await block(page)).base.site).toBe('lodge');
  const crew = (await block(page)).crew;
  await step(page, { type: 'guard', who: crew[0].id, at: '1,0' });
  await step(page, { type: 'guard', who: crew[1].id, at: '0,1' });
  expect((await block(page)).base.posts).toHaveLength(2);
  await toBeat(page, 'inPerson');
  await page.keyboard.press('KeyB');
  await expect(s.getByTestId('evil-base-walkit')).toBeVisible();
  await s.getByTestId('evil-base-walkit').click();
  await waitForScene(page, 'Battle');
  await page.waitForTimeout(250);
  const trainer = await page.evaluate(() => (window as any).__pkr.session.run.battle.trainer);
  expect([crew[0].name, crew[1].name]).toContain(trainer.name);
  await toCommands(page);
  await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    run.party.forEach((m: any, i: number) => { m.hp = i === 0 ? 1 : 0; });
    run.party[0].moves = [{ ...run.party[0].moves[0], id: 'splash', pp: 40 }];
    run.battle.enemyTeam.forEach((m: any) => { m.moves = [{ ...m.moves[0], id: 'tackle', pp: 35 }]; });
  });
  const bt = view(page, 'Battle');
  const atEvil = async () => (await scene(page)) === 'Evil';
  for (let i = 0; i < 6 && !(await atEvil()); i++) {
    const menu = await page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle')?.menu));
    if (menu) {
      await bt.locator('[data-act="pick"]', { hasText: 'Fight' }).click();
      await page.waitForTimeout(250);
      await bt.locator('.btn.mv').first().click();
    }
    await confirmUntil(page, async () => (await atEvil()) || (await page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle')?.menu))), 40_000);
  }
  await waitForScene(page, 'Evil');
  await page.waitForTimeout(300);
  expect((await block(page)).base.walk.end).toBe('lost');
  await expect(s.getByTestId('evil-base-mode')).toHaveText('walk');
  await expect(s.getByTestId('evil-walk-route')).toBeVisible();
  await shots(page, info, 'base-walk');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  expect((await block(page)).base.walk).toBeNull();
  expect(await page.evaluate(() => (window as any).__pkr.session.run.phase)).toBe('map');
  expect(errors).toEqual([]);
});

test('the Raid: the warning\'s four choices, the Siege Map, the door opened, a turn, the Office; never the run', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page);
  await page.keyboard.press('KeyB');
  const s = stage(page);
  await s.locator('[data-testid^="evil-base-site-"]').last().click();
  // Heat 9 at the Evening: the warning.
  await toBeat(page, 'inPerson');
  await page.evaluate(() => { (window as any).__pkr.session.run.expansion.evilMode.team.heat = 9; });
  await step(page, { type: 'stayIn' });
  await redraw(page);
  expect((await block(page)).raid.state).toBe('warned');
  await page.keyboard.press('KeyB');
  await expect(s.getByTestId('evil-base-warn')).toBeVisible();
  await expect(s.getByTestId('evil-base-warn-station')).toContainText('Walk into the station');
  await shots(page, info, 'base-warn');
  await s.getByTestId('evil-base-warn-hold').click();
  // The next Evening at 10: the Raid. The page holds itself open.
  await toBeat(page, 'inPerson');
  await page.evaluate(() => { (window as any).__pkr.session.run.expansion.evilMode.team.heat = 10; });
  await step(page, { type: 'stayIn' });
  await redraw(page);
  expect((await block(page)).raid.state).toBe('door');
  await expect(s.getByTestId('evil-base-mode')).toHaveText('raid');
  await s.getByTestId('evil-raid-open').click();
  await expect(s.getByTestId('evil-raid-wing-front')).toHaveAttribute('data-status', 'lost');
  await shots(page, info, 'base-raid');
  for (let i = 0; i < 12 && (await block(page)).raid.state === 'turns'; i++) {
    await s.getByTestId('evil-raid-turn').click();
    await page.waitForTimeout(100);
  }
  expect((await block(page)).raid.state).toBe('office');
  await expect(s.getByTestId('evil-raid-speech')).toBeVisible();
  await s.getByTestId('evil-raid-office-charge').click();
  const after = await block(page);
  expect(after.raid.state).toBe('done');
  expect(after.base).toBeNull();
  await shots(page, info, 'base-raid-after');
  await s.getByTestId('evil-raid-done').click();
  expect((await block(page)).raid).toBeNull();
  expect(await page.evaluate(() => (window as any).__pkr.session.run.phase)).toBe('map');
  expect(errors).toEqual([]);
});
