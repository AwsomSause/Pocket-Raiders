import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// Evil Mode slice 9 ("a region"): the mode is on by default; a team founded with a Patron starts at Kanto's Arrival with
// the region rule on the frame, plays the Arrival out to its tally, takes the Road, leaves an Officer behind and arrives in
// District 1 on the next day. Reloading on the Road keeps the Road.

const stage = (page: Page) => view(page, 'Evil');
const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.evilMode);

async function restartEvil(page: Page) {
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  });
  await waitForScene(page, 'Evil');
  await page.waitForTimeout(300);
}

test('the Arrival plays out to a tally, the Road leaves an Officer behind, and District 1 starts the next day', async ({ page }, info) => {
  const errors = watch(page);
  await start(page, 'ui=new');
  expect(await page.evaluate(() => (window as any).__pkr.session.settings.expansion.evilMode)).toBe(true);
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'evil-mode' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Evil');
  await page.evaluate(() => (window as any).__pkr.session.evilFound({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm', patron: 'grunt', region: 'kanto' }));
  await restartEvil(page);
  const s = stage(page);
  await expect(s.getByTestId('evil-chip').first()).toHaveText('Kanto · The Arrival · Day 1');
  await expect(s.getByTestId('evil-chip').nth(1)).toHaveText("Kanto: Everything's owned");
  await page.screenshot({ path: info.outputPath('arrival.png') });

  // Press on through the Arrival's days (nothing queued: no battles) until it ends.
  for (let i = 0; i < 80 && (await block(page)).region.phase === 'day'; i++) {
    await s.getByTestId('evil-advance').click();
    await page.waitForTimeout(60);
  }
  expect((await block(page)).region.phase).toBe('tally');
  await expect(s.getByTestId('evil-tally')).toBeVisible();
  await page.screenshot({ path: info.outputPath('tally.png') });
  await s.getByTestId('evil-advance').click();
  await expect(s.getByTestId('evil-road-page')).toBeVisible();
  expect((await block(page)).region.phase).toBe('road');

  // A reload on the Road comes back to the Road.
  await page.goto('/?ui=new');
  await waitForScene(page, 'MainMenu');
  await page.evaluate(() => (window as any).__pkr.session.continueRun());
  await restartEvil(page);
  await expect(stage(page).getByTestId('evil-road-page')).toBeVisible();
  await page.screenshot({ path: info.outputPath('road.png') });

  const b0 = await block(page);
  await stage(page).getByTestId('evil-stay-patron').click();
  await expect(stage(page).getByTestId('evil-chip').first()).toHaveText('Kanto · District 1 · Day 1');
  const b1 = await block(page);
  expect(b1.here.stage).toBe(2);
  expect(b1.here.day).toBe(b0.here.day + 1);
  expect(b1.region.past[0].leftWith).toBe('patron');
  expect(b1.crew.find((c: any) => c.id === 'patron').where).toBe('away');
  for (const [w, h] of [[1280, 720], [960, 540], [1600, 900]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    await page.screenshot({ path: info.outputPath(`district1-${w}x${h}.png`) });
  }
  expect(errors).toEqual([]);
});
