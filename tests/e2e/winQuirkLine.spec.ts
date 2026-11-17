import { expect, test } from '@playwright/test';
import { confirmToMenu, confirmUntil } from './battleInput';
import { start, waitForScene, watch } from './helpers/newUi';

// A won fight where the lead levels up and a Quirk reaction line ("is relieved it's over") follows must never stop the game.
test('Old UI: a win with a level-up and a Quirk reaction line goes on to the map', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await start(page, 'ui=old&seed=newui-e2e&debug=1');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  await confirmToMenu(page);
  await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    run.battle.enemyTeam.forEach((m: any) => (m.hp = 1));
    const mon = run.party[0];
    // Pick a uid whose Quirk is Stage Fright (its win line is "is relieved it's over and does a little hop").
    const fnv = (t: string) => { let h = 2166136261; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619); return h >>> 0; };
    for (let i = 0; i < 500; i++) if (fnv(`${mon.uid}x${i}:quirk54`) % 54 === 5) { mon.uid = `${mon.uid}x${i}`; break; }
    mon.moves[0] = { ...mon.moves[0], id: 'tackle', pp: 35 };
    mon.xp = 60;
  });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  let seen = false;
  await confirmUntil(page, async () => {
    if (await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle')?.history?.some((h: string) => h.includes('relieved')))) seen = true;
    return (await page.evaluate(() => (window as any).__pkr.activeScene())) !== 'Battle';
  }, 60_000);
  expect(seen).toBe(true);
  expect(errors).toEqual([]);
});
