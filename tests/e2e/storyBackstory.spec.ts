import { expect, test, type Page } from '@playwright/test';

// Story Overhaul S5: a Story Run opens with its backstory intro (Viridian), the answer is kept in the run, and the save reloads onto the map.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

test('the Story Run opens with the Viridian intro scene and keeps the answer', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=story-backstory&campaign=orrery-circuit&debug=1');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Story']) {
    await page.keyboard.press('Enter');
    await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(next);
    await page.waitForTimeout(250);
  }
  const texts = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Story').children.list.filter((o: any) => o.name?.startsWith('story-')).map((o: any) => `${o.name}=${o.text ?? ''}`));
  expect(texts.join('\n')).toContain('story-kicker=Your Story Begins');
  await page.screenshot({ path: 'test-results/story-intro-page1.png' });
  // Page through the lines until the three answers show, then take the second one.
  for (let i = 0; i < 4; i++) {
    const shown = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Story').children.list.some((o: any) => o.name?.startsWith('story-choice-')));
    if (shown) break;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: 'test-results/story-intro-choices.png' });
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(150);
  await page.keyboard.press('Enter');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('Map');
  const info = await page.evaluate(() => {
    const m = (window as any).__pkr.session.run.story.v2.module;
    const f = (window as any).__pkr.session.run.story.v2.facts;
    return { backstory: m.backstory, played: m.played, active: m.active, curiosity: f.curiosity, adaptability: f.adaptability, intro: f.bs_viridian_intro };
  });
  expect(info).toMatchObject({ backstory: 'bs_viridian', played: ['ev_intro_viridian'], active: null, curiosity: 1, adaptability: 1, intro: true });
  // Reload: the run comes back on the map with the intro still played (not shown again).
  await page.reload();
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
  expect(errors).toEqual([]);
});
