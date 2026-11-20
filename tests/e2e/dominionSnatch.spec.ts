import { expect, test, type Page } from '@playwright/test';
import { confirmUntil } from './battleInput';
import { scene, open, start, toCommands, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D23 (Snatch and interrogation): Interrogate at Silph Co. starts a battle; a win puts Mr. Fenwick in the
// Holding Cell and the questioning room (Rotom mockup a7) takes the screen: I/E pick the Goal, 1-5 are the approaches,
// T opens the shared typing box, a reload keeps the room, and 1-3 end it (release / recruit / ransom). Talk only.

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);
const captive = async (page: Page) => {
  const b = await block(page);
  return b.snatch.cell.find((c: any) => c.n === b.snatch.room) ?? b.snatch.cell[0];
};

/** Re-enters the Dominion from the saved run (as after a reload). */
async function reenter(page: Page) {
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.continueRun();
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  });
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
  const s = view(page, 'Dominion');
  await s.getByTestId('dom-title-1').click();
  return s;
}

/** Presses a key until the captive's line count reaches `n` (a press can be lost in a busy headless frame). */
async function line(page: Page, key: string, n: number) {
  await expect(async () => {
    if ((await captive(page)).turns.length < n) await page.keyboard.press(key);
    expect((await captive(page)).turns.length).toBeGreaterThanOrEqual(n);
  }).toPass({ timeout: 15_000 });
}

test('snatch: Interrogate starts a battle, the room after the win, approaches, a typed line, a reload, and an ending', async ({ page }, info) => {
  test.setTimeout(240_000); // one full battle on a loaded runner
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'dominion' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Dominion');

  // Day 2's Night with a Holding Cell, the Boss in Saffron; Interrogate at Silph Co. waits on a battle.
  const queued = await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.dominionStart({ types: ['poison', 'dark'], member: 'grunt', look: 0 });
    const steps: string[] = [];
    for (const t of ['open', 'toNight', 'rest', 'toDay', 'endDay', 'toNight']) {
      const o = p.session.dominionStep({ t });
      steps.push(`${t}:${o.ok ? 'ok' : o.notice}`);
      const b = p.session.run.expansion.dominion;
      if (b.police) b.police.q = null;
    }
    const b = p.session.run.expansion.dominion;
    // D12's Chair may sit first this Evening (its own spec walks it): closed here, straight to the Night.
    if (b.chair?.open) { b.chair.open = false; b.phase = 'night'; }
    if (b.phase !== 'night') return { ok: false, notice: `${b.phase} after ${steps.join(', ')}`, fight: false };
    b.hq.rooms.push({ uid: 'e2e-cell', id: 'holding-cell', tier: 1, cond: 100, spent: 0, building: false, up: false, ready: 0, shut: false, ruined: false, at: null });
    b.field.at = 'saffron';
    b.funds = 5000;
    const out = p.session.dominionStep({ t: 'act', action: 'interrogate', target: 'silph-co', district: 'saffron', bring: [] });
    return { ok: out.ok, notice: out.notice, fight: out.fight };
  });
  expect(queued.ok, queued.notice ?? '').toBe(true);
  expect(queued.fight).toBe(true);
  expect((await block(page)).snatch.pending).not.toBeNull();

  // The battle: the game's own battle screen; the target's Pokémon are made easy so the test wins fast.
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.dominionFight();
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Battle');
  });
  await waitForScene(page, 'Battle');
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.battle.trainer.name)).toBe('Mr. Fenwick');
  await toCommands(page);
  await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    run.party[0].moves = [{ ...run.party[0].moves[0], id: 'tackle', pp: 35 }];
    run.battle.enemyTeam.forEach((m: any) => { m.hp = 1; m.moves = [{ ...m.moves[0], id: 'splash', pp: 40 }]; });
    run.battle.enemyItemsUsed = 99; // no healing items: one hit each
  });
  const bat = view(page, 'Battle');
  const atDom = async () => (await scene(page)) === 'Dominion';
  for (let i = 0; i < 24 && !(await atDom()); i++) {
    const menu = await page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle')?.menu));
    if (menu) {
      await page.evaluate(() => (window as any).__pkr.session.run.battle.enemyTeam.forEach((m: any) => { if (m.hp > 1) m.hp = 1; }));
      await bat.locator('[data-act="pick"]', { hasText: 'Fight' }).click();
      await page.waitForTimeout(250);
      await bat.locator('.btn.mv').first().click();
    }
    await confirmUntil(page, async () => (await atDom()) || (await page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle')?.menu))), 40_000);
  }
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);

  // The win put him in the cell; past the title page (this test started the battle itself), the room owns the screen.
  const won = await block(page);
  expect(won.snatch.cell).toHaveLength(1);
  expect(won.snatch.room).toBe(won.snatch.cell[0].n);
  let s = view(page, 'Dominion');
  if (await s.getByTestId('dom-title-1').count()) await s.getByTestId('dom-title-1').click();
  await expect(s.getByTestId('dom-s-title')).toContainText('Mr. Fenwick');
  expect((await captive(page)).phase).toBe('goal');
  await expect(s.getByTestId('dom-s-goal-info')).toBeVisible();
  await page.waitForTimeout(400);
  await shot('a7-goal');
  // Nothing else moves while the room is open: E (end the day) does nothing to the clock.
  const phase = (await block(page)).phase;
  await expect(async () => {
    if ((await captive(page)).phase === 'goal') await page.keyboard.press('KeyI');
    expect((await captive(page)).goal).toBe('info');
  }).toPass({ timeout: 15_000 });
  await page.keyboard.press('KeyE');
  expect((await block(page)).phase).toBe(phase);

  // 1: a threat. Resolve drops; the exchange and the rules' chip show.
  const start0 = (await captive(page)).resolve;
  await line(page, 'Digit1', 1);
  await expect(s.getByTestId('dom-s-exchange')).toContainText('THREAT');
  await expect(s.getByTestId('dom-s-chip')).toContainText('Rules');
  expect((await captive(page)).resolve).toBeLessThan(start0);
  await expect(s.getByTestId('dom-s-resolve-n')).toHaveText(String((await captive(page)).resolve));
  await page.waitForTimeout(400);
  await shot('a7-room-threat');

  // T: your own words in the shared typing box (no Key-Card here, so the rules judge them; nothing is sent anywhere).
  const box = page.getByTestId('type-box-input');
  await expect(async () => {
    if (!(await box.count())) await page.keyboard.press('KeyT');
    await expect(box).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 15_000 });
  await expect(page.getByTestId('type-box')).toContainText('Mr. Fenwick');
  // Every key belongs to the box: its digits and "e"s never pick an approach or end the day behind it.
  await page.keyboard.type('Your boss sold you out. The patrol sheet, or 2 days in the paper', { delay: 15 });
  expect((await captive(page)).turns).toHaveLength(1);
  await shot('a7-room-typing');
  await page.keyboard.press('Enter');
  await expect(box).toHaveCount(0);
  await expect.poll(async () => (await captive(page)).turns.length).toBe(2);
  const typed = (await captive(page)).turns[1];
  expect(typed.kind).toBe('typed');
  expect(typed.rotom).toBe(false);
  await expect(s.getByTestId('dom-s-exchange')).toContainText('patrol sheet');

  // Reload mid-room: the same captive, the same lines.
  await page.goto('/?ui=new');
  await waitForScene(page, 'MainMenu');
  s = await reenter(page);
  await expect(s.getByTestId('dom-s-title')).toContainText('Mr. Fenwick');
  expect((await captive(page)).turns).toHaveLength(2);

  // Window sizes.
  for (const [w, h] of [[1280, 720], [960, 540], [390, 844]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(300);
    await expect(s.getByTestId('dom-s-resolve')).toBeVisible();
    await shot(`a7-room-${w}x${h}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });

  // Talk until the room reaches its endings (six lines, or sooner if Resolve hits 0), then 1: release.
  await expect(async () => {
    if ((await captive(page)).phase === 'talk') await page.keyboard.press('Digit2');
    expect((await captive(page)).phase).toBe('end');
  }).toPass({ timeout: 30_000 });
  await expect(s.getByTestId('dom-s-end-release')).toBeVisible();
  await page.waitForTimeout(400);
  await shot('a7-room-endings');
  await expect(view(page, 'Dominion')).not.toContainText(/Claude|\bAI\b/);
  await expect(async () => {
    if ((await block(page)).snatch.cell.length) await page.keyboard.press('Digit1');
    expect((await block(page)).snatch.cell).toHaveLength(0);
  }).toPass({ timeout: 15_000 });
  const end = await block(page);
  expect(end.snatch.room).toBeNull();
  expect(end.snatch.last).toContain('Mr. Fenwick');
  await expect(s.getByTestId('dom-s-title')).toHaveCount(0);
  expect(errors).toEqual([]);
});
