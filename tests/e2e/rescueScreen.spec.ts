import { expect, test, type Page } from '@playwright/test';

// Rival Rescue (R9): a due plan opens the Rescue screen over the map; the player can pick a plan, answer the beats and
// the complication, beat the guard(s) of Quiet Extraction, see the result, and land back on a map. No console errors.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}
const shot = async (page: Page, name: string) => {
  const dir = process.env.RESCUE_SHOTS;
  if (dir) await page.screenshot({ path: `${dir}/${name}.png` });
};

test('the rival rescue plan opens over the map and plays through', async ({ page }) => {
  test.setTimeout(300_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/?seed=rescue-screen&debug=1');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=rescue-screen&debug=1');
  await waitForScene(page, 'MainMenu');
  await page.keyboard.press('Enter');
  for (const key of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    if (key !== 'Hub') await page.keyboard.press('Enter');
    await waitForScene(page, key);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);

  // Put the run in the state a raid loss would leave: a registered rival and two Pokémon held, plan due now.
  await page.evaluate(() => {
    const { session } = (window as any).__pkr;
    const run = session.run;
    const base = JSON.parse(JSON.stringify(run.party[0]));
    const held = [1, 2].map((i) => ({ ...JSON.parse(JSON.stringify(base)), uid: `held-${i}` }));
    run.expansion = {
      rival: { blue: { role: 'main', personality: 'champion-chaser', style: 'blitz', arc: 'prodigy-learns-humility', lead: 0, marks: [], feelings: { friendship: 3, respect: 3, trust: 3, rivalry: 3, resentment: 0, admiration: 2 }, pityLosses: 0 } },
      rescue: {
        holds: [{ id: 'h1-kanto', teamId: 'rocket', regionId: 'kanto', pokemon: held, impoundNode: -10, waitNodes: 9, lastQuietNode: 50, dueAt: 0, receipt: true, offers: 0, declines: 0, lastDeclineNode: null, lateDue: false, late: false, frozenAt: null, accepted: null, warrantAt: null, heldAtClimax: false }],
        active: null, returned: [], attitude: 0, balloonUsed: false, memory: [], flags: {}, log: [], lost: [],
      },
    };
    (window as any).__pkr.game.scene.getScene('Map').scene.restart();
  });
  await waitForScene(page, 'Rescue');
  await shot(page, '1-offer');

  // Quiet Extraction (first plan). Since the PS-RESCUE fights, Quiet always meets at least one guard: answer each beat,
  // fight every guard that steps in, and carry on when the map reopens the Rescue screen after the fight.
  await page.keyboard.press('Enter');
  const plan = () => page.evaluate(() => (window as any).__pkr.session.run.expansion?.rescue?.active ?? null);
  const rescueUp = () => page.evaluate(() => (window as any).__pkr.game.scene.isActive('Rescue'));
  await expect.poll(async () => Boolean(await plan()), { timeout: 10_000 }).toBe(true);
  let fights = 0;
  let step = 2;
  const end = Date.now() + 240_000;
  for (let active = await plan(); active && Date.now() < end; active = await plan()) {
    await page.waitForTimeout(300);
    if (active.fightNow) {
      // The guard panel: Fight starts a pseudo battle. Win it (the foes are set to 1 HP) and the plan resumes.
      await shot(page, `${step++}-guard-${active.fightNow}`);
      await page.keyboard.press('Enter');
      await waitForScene(page, 'Battle');
      fights++;
      await page.evaluate(() => { for (const m of (window as any).__pkr.session.run.battle.enemyTeam) m.hp = 1; });
      while (Date.now() < end && (await scene(page)) === 'Battle') {
        const menu = await page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle')?.menu));
        await page.keyboard.press('Enter');
        await page.waitForTimeout(menu ? 350 : 150);
      }
      // A level-up after the fight can offer a move first. Decline each one: Esc closes any confirm, Up wraps to the last
      // row ("Don't learn"), Enter picks it, Left focuses Yes, Enter confirms. (Keys only go to the Decision screen.)
      const pending = () => page.evaluate(() => (window as any).__pkr.session.run.pending.length);
      await page.waitForTimeout(600);
      while (Date.now() < end && (await pending()) > 0) {
        for (const [key, pause] of [['Escape', 300], ['ArrowUp', 200], ['Enter', 400], ['ArrowLeft', 200], ['Enter', 900]] as const) {
          if ((await scene(page)) !== 'Decision' || (await pending()) === 0) break;
          await page.keyboard.press(key);
          await page.waitForTimeout(pause);
        }
        await page.waitForTimeout(250);
      }
      await expect.poll(rescueUp, { timeout: 30_000 }).toBe(true);
      const after = await plan();
      expect(after.fights).toHaveLength(fights);
      expect(after.wiped).toBe(false);
      continue;
    }
    // The third row is the clean answer for this seed (the rows are shuffled by seed): no guard at the Door, one at the Cage.
    await shot(page, `${step++}-beat`);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(120);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(120);
    await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(400);
  await shot(page, `${step}-result`);
  // The plan is settled (nothing running) and the result panel is still on the Rescue screen.
  expect(await plan()).toBeNull();
  expect(fights).toBeGreaterThanOrEqual(1);
  expect(await rescueUp()).toBe(true);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Map');
  await shot(page, '7-map-after');
  expect(errors).toEqual([]);
});
