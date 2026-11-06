import { expect, test, type Page } from '@playwright/test';

// Story Overhaul S4: a run on the Orrery Circuit is a Story Run with a 44-Stop blueprint, and the map marks its Story Stops with a star.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

test('the Orrery Circuit starts a Story Run with Story Stops on the map', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=story-circuit&campaign=orrery-circuit&debug=1');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(next);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(800);
  const info = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    return { campaign: run.campaignId, mode: run.story.v2?.mode, stops: run.story.v2?.blueprint?.stops.length, region: run.regionOrder[0], marked: run.stage.map.nodes.filter((n: any) => n.storyStops?.length).length };
  });
  expect(info).toMatchObject({ campaign: 'orrery-circuit', mode: 'story_run', stops: 44, region: 'cairnmoor' });
  expect(info.marked).toBeGreaterThan(0);
  const stars = await page.evaluate(() => {
    let n = 0;
    const walk = (o: any) => {
      if (o.text === '★') n++;
      for (const c of o.list ?? []) walk(c);
    };
    for (const o of (window as any).__pkr.game.scene.getScene('Map').children.list) walk(o);
    return n;
  });
  expect(stars).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
