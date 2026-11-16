import { expect, test } from '@playwright/test';
import { scene, view, waitForScene, watch, start, toMap } from './helpers/newUi';

// NE100 The Road Home (Catalog Overhaul new events): after the final battle, win or lose, the run end plays it before the results.

test('The Road Home plays at the end of a won run, then the results show', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = watch(page);
  await start(page, 'ui=new&seed=road-home-e2e');
  await toMap(page);
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    session.run.phase = 'over';
    session.run.victory = true;
    session.finishRun();
    for (const s of game.scene.getScenes(true)) game.scene.stop(s.scene.key);
    game.scene.start('GameOver');
  });
  await waitForScene(page, 'Event');
  const ev = view(page, 'Event');
  await expect(ev).toContainText('The road you came by');
  await page.screenshot({ path: 'test-results/road-home.png' });
  // Read the pages, pick "Again.", read the outcome: then the results.
  // The intro pages turn with Enter; a choice and the outcome have buttons.
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(800);
    if ((await scene(page)) !== 'Event') break;
    const pick = ev.locator('[data-act="pick"]').first();
    if (await pick.isVisible().catch(() => false)) await pick.click();
    else if (await ev.locator('[data-act="next"]').isVisible().catch(() => false)) await ev.locator('[data-act="next"]').click();
    else await page.keyboard.press('Enter');
  }
  await waitForScene(page, 'GameOver');
  await expect(view(page, 'GameOver')).toBeVisible();
  // Once only: the results don't open it again.
  expect(await page.evaluate(() => (window as any).__pkr.session.roadHomeDue())).toBe(false);
  expect(errors).toEqual([]);
});

test('A run lost before the final battle goes straight to the results', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=road-home-e2e-2');
  await toMap(page);
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    session.run.phase = 'over';
    session.run.victory = false;
    session.finishRun();
    for (const s of game.scene.getScenes(true)) game.scene.stop(s.scene.key);
    game.scene.start('GameOver');
  });
  await waitForScene(page, 'GameOver');
  expect(errors).toEqual([]);
});
