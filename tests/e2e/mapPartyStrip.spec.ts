import { expect, test } from '@playwright/test';
import { start, toMap } from './helpers/newUi';

// New look map: a full party with eggs, many status chips and a big money total keeps every party icon on screen (the chips wrap instead).
test('New UI map: all six party icons fit on screen with eggs and long chips', async ({ page }) => {
  await start(page, 'ui=new&seed=party-strip');
  await toMap(page);
  await page.evaluate(() => {
    const p = (window as any).__pkr; const run = p.session.run;
    const base = run.party[0];
    run.party = ['pikachu', 'charizard', 'magmuk', 'neocleon', 'hoopno', 'galarian-magneton'].map((id) => ({ ...base, speciesId: id, uid: `u-${id}` }));
    run.money = 1234567; run.badges = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    run.eggs = [{ left: 3, unit: 'step', tier: 'ordinary' }, { left: 2, unit: 'battle', tier: 'ordinary' }];
    p.game.scene.getScene('Map').scene.restart();
  });
  await page.waitForTimeout(2500);
  const boxes = await page.evaluate(() => [...document.querySelectorAll('#rx [data-tip^="mon:"]')].map((e) => { const b = e.getBoundingClientRect(); return [b.left, b.right]; }));
  expect(boxes).toHaveLength(6);
  const vw = await page.evaluate(() => window.innerWidth);
  for (const [l, r] of boxes) { expect(l).toBeGreaterThanOrEqual(0); expect(r).toBeLessThanOrEqual(vw); }
});
