import { expect, test, type Page } from '@playwright/test';

// Story Overhaul S9b: the gym node of the Orrery Circuit opens the Fork Gate (two Leaders and a pass); entering a door runs that Leader's gym.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

test('the gym node asks which Leader to face, and the chosen door sets the gym', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=story-fork&campaign=orrery-circuit&debug=1');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Story']) {
    await page.keyboard.press('Enter');
    await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(next);
    await page.waitForTimeout(250);
  }
  for (let i = 0; i < 6 && (await scene(page)) === 'Story'; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('Map');
  await page.waitForTimeout(800);
  // Stand beside the gym node and step onto it.
  const doors = await page.evaluate(() => {
    const { session } = (window as any).__pkr;
    const stage = session.run.stage;
    const gym = stage.map.nodes.find((n: any) => n.kind === 'gym');
    const pred = stage.map.nodes.find((n: any) => n.next.includes(gym.id));
    stage.current = pred.id;
    stage.visited.push(pred.id);
    session.chooseNode(gym.id);
    return session.run.pending[0]?.options.map((o: any) => o.action) ?? null;
  });
  expect(doors).toEqual(['door0', 'door1', 'pass']);
  await page.evaluate(() => { (window as any).__pkr.game.scene.getScene('Map').scene.start('Decision'); });
  await expect.poll(() => scene(page), { timeout: 10_000 }).toBe('Decision');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/circuit-fork.png' });
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect.poll(() => scene(page), { timeout: 10_000 }).toBe('Map');
  const after = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    return { chosen: run.story.v2.circuit.chosen['0'], leader: run.stage.leaderId, door1: run.story.v2.circuit.cast[0].doors[1] };
  });
  expect(after.leader).toBe(after.door1);
  expect(after.chosen).toBe(after.door1);
  expect(errors).toEqual([]);
});
