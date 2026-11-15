import { expect, test, type Page } from '@playwright/test';

// Evil Teams (spec §16) and permanent choices (spec §17): a storyline stop plays in the event scene with the
// team's names filled in, a choice moves the story on, and the Story screen lists the team and the choice history.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

const texts = (page: Page, key: string) =>
  page.evaluate((k): string[] => {
    const all = (o: any): any[] => (o.list ? [o, ...o.list.flatMap(all)] : [o]);
    return (window as any).__pkr.game.scene.getScene(k).children.list.flatMap(all).filter((o: any) => o.type === 'Text').map((o: any) => o.text as string);
  }, key);

test('an Evil Team beat plays, moves the story on, and the Story screen shows the team and your choices', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/?debug=1');
  await waitForScene(page, 'MainMenu');
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    session.newRun('red', 'e2e-evil-1');
    session.chooseStarter(0);
    const run = session.run;
    run.story.evil = { teamId: 'rocket', beat: 0, stages: 2, nextAt: 2, heat: 0, ops: [{ id: 'pokemon-heist', region: 0, outcome: 'running' }], villains: {}, defector: false, end: 'none' };
    run.story.choices = [{ id: 'road-fork', pick: 'mountain', text: 'Took the hard mountain pass', weight: 3, region: 0, stage: 0 }];
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push({ id: 'e2e-evil', kind: 'event', used: false, eventId: 'evil-rocket-suspicious' });
    run.stage.current = node.id;
    run.stage.visited = [node.id];
    game.scene.getScenes(true)[0].scene.start('Event', { sideId: 'e2e-evil' });
  });
  await waitForScene(page, 'Event');
  // The intro types out; wait until the Grunts' names have appeared.
  await expect.poll(async () => (await texts(page, 'Event')).join(' '), { timeout: 15_000 }).toContain('Rocket Grunt');
  for (const [w, h] of [[800, 450], [480, 800], [960, 540]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `test-results/evil-beat-${w}x${h}.png` });
  }
  // "Walk past" (the third choice): no battle, the story moves on a beat.
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Event').focus(2));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.story.evil.beat)).toBe(1);
  // The outcome text, then any rewards, each wait for an input: press until the map is back.
  await expect
    .poll(async () => {
      if ((await scene(page)) === 'Event') await page.keyboard.press('Enter');
      return scene(page);
    }, { timeout: 20_000, intervals: [1500] })
    .toBe('Map');
  await page.waitForTimeout(250);
  await page.evaluate(() => {
    const s = (window as any).__pkr.game.scene.getScene('Map');
    s.activate(s.options.findIndex((o: any) => o.kind === 'story'));
  });
  await expect.poll(async () => (await texts(page, 'Map')).some((t: string) => t.includes('Team Rocket')), { timeout: 5000 }).toBe(true);
  expect((await texts(page, 'Map')).some((t: string) => t.includes('Took the hard mountain pass'))).toBe(true);
  await page.screenshot({ path: 'test-results/evil-story-screen.png' });
  expect(errors).toEqual([]);
});

test('an Operation scene (SF130): a type-locked choice says why, and walking on sends a Pokémon to the Holding Pen', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/?debug=1');
  await waitForScene(page, 'MainMenu');
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    session.newRun('red', 'e2e-evil-2');
    session.chooseStarter(0);
    const run = session.run;
    while (run.party.length < 4) run.party.push({ ...structuredClone(run.party[0]), uid: `e2e-${run.party.length}` });
    run.story.evil = { teamId: 'rocket', beat: 6, stages: 6, nextAt: 7, heat: 0, ops: [], villains: {}, defector: false, end: 'none', region: 0, past: [], planFirst: null, mods: [] };
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push({ id: 'e2e-scene', kind: 'event', used: false, eventId: 'rocket-ambush' });
    run.stage.current = node.id;
    run.stage.visited = [node.id];
    game.scene.getScenes(true)[0].scene.start('Event', { sideId: 'e2e-scene' });
  });
  await waitForScene(page, 'Event');
  // The intro types out (the walk-on consequence is on its next page); "Cut the net." is locked without a Bug or Grass-type.
  await expect.poll(async () => (await texts(page, 'Event')).join(' '), { timeout: 20_000 }).toContain('Prepare for trouble!');
  expect((await texts(page, 'Event')).join(' ')).toMatch(/Cut the net\. 🔒/);
  for (const [w, h] of [[800, 450], [480, 800], [960, 540]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `test-results/evil-scene-${w}x${h}.png` });
  }
  // "Walk on." is the third choice.
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Event').focus(2));
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.session.run.party.length), { timeout: 5000 }).toBe(3);
  await expect
    .poll(async () => {
      if ((await scene(page)) === 'Event') await page.keyboard.press('Enter');
      return scene(page);
    }, { timeout: 20_000, intervals: [1500] })
    .toBe('Map');
  expect(errors).toEqual([]);
});
