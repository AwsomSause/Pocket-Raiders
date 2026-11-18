import { expect, test } from '@playwright/test';

// Beta 0.7 Pidgey's Resolve: the opening branch fight is a real battle scene with both sides played by the AI. No menu is ever shown,
// the player only reads (Enter), and the real team is back on the map afterwards.

const scene = (page: import('@playwright/test').Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

test('the Pidgey and Spearow branch fight plays by itself on the battle scene', async ({ page }) => {
  test.setTimeout(200_000); // a Spearow two levels up makes the duel a little longer
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/?seed=sky-e2e&campaign=dev&debug=1');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(next);
    await page.waitForTimeout(250);
  }
  const team = await page.evaluate(() => (window as any).__pkr.session.run.party.map((m: any) => m.speciesId));
  // Put the story's opening beside the current node and choose it (back the Pidgey), as the map would.
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const run = session.run;
    run.expansion = { ...run.expansion, density: 'normal' };
    const node = run.stage.map.nodes[0];
    run.stage.current = node.id;
    node.sides.push({ id: 'sky-e2e-side', kind: 'event', used: false, eventId: 'sky.opening' });
    session.chooseEvent('sky-e2e-side', 0);
    game.scene.getScene('Map').scene.start('Battle');
  });
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('Battle');
  const seen = { menu: false, spectate: false };
  let shots = 0;
  const t0 = Date.now();
  while ((await scene(page)) === 'Battle' && Date.now() - t0 < 150_000) {
    // Enter only while a line is waiting to be read. A press made while the battle is closing is handled by no screen,
    // so an automated browser keeps it and replays it into the map, where Enter starts the next trip (a new battle).
    const waiting = await page.evaluate(() => { const b = (window as any).__pkr.game.scene.getScene('Battle'); // a first-time Hyper explainer (Spearow is 2 levels up, so the duel can run long enough to trigger one) also waits for Enter
      return Boolean(b?.advance || b?.children?.getByName?.('hyper-explain')); });
    if (waiting) await page.keyboard.press('Enter');
    await page.waitForTimeout(350);
    const state = await page.evaluate(() => {
      const b = (window as any).__pkr.game.scene.getScene('Battle');
      return { menu: Boolean(b?.menu?.root?.visible ?? b?.menu), spectate: Boolean((window as any).__pkr.session.run?.battle?.spectate) };
    });
    seen.spectate ||= state.spectate;
    const secs = Math.floor((Date.now() - t0) / 3000);
    if (state.spectate && secs > shots && shots < 6) {
      shots = secs;
      await page.screenshot({ path: `test-results/visual/sky-duel-${shots}.png` });
    }
  }
  expect(seen.spectate).toBe(true);
  await expect.poll(() => scene(page), { timeout: 30_000 }).toBe('Map');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.session.run.phase), { timeout: 15_000 }).toBe('map');
  const after = await page.evaluate(() => ({ party: (window as any).__pkr.session.run.party.map((m: any) => m.speciesId), phase: (window as any).__pkr.session.run.phase, sky: (window as any).__pkr.session.run.expansion?.sky }));
  expect(after.party).toEqual(team);
  expect(after.phase).toBe('map');
  expect(after.sky.duelWinner).toMatch(/pidgey|spearow/);
  expect(errors).toEqual([]);
});

test('the cliff finale asks who to cheer for when Pidgeot is low, and the answer plays on', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/?seed=sky-e2e-3&campaign=dev&debug=1');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(next);
    await page.waitForTimeout(250);
  }
  const team = await page.evaluate(() => (window as any).__pkr.session.run.party.map((m: any) => m.speciesId));
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const run = session.run;
    run.party.forEach((m: any) => (m.level = 25));
    run.expansion = { ...run.expansion, density: 'normal', sky: { region: 0, backed: 'pidgey', duelWinner: 'spearow', phase: 'rivalry', metStages: [], meets: 4, spars: 0, boosts: 0, alone: 0, watched: 0, bond: 0, wiser: 0, gifts: [], answers: [], finale: { asked: false }, afterDone: false } };
    run.stage.index = 7;
    const node = run.stage.map.nodes[0];
    run.stage.current = node.id;
    node.sides.push({ id: 'sky-e2e-side', kind: 'event', used: false, eventId: 'sky.finale' });
    session.chooseEvent('sky-e2e-side', 0);
    game.scene.getScene('Map').scene.start('Battle');
  });
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('Battle');
  let asked = false;
  const t0 = Date.now();
  while ((await scene(page)) === 'Battle' && Date.now() - t0 < 110_000) {
    const labels = await page.evaluate(() => {
      const b = (window as any).__pkr.game.scene.getScene('Battle');
      return b?.menu?.labels?.map?.((o: any) => o.text) ?? null;
    });
    if (labels && labels.includes('Pidgeot!')) {
      asked = true;
      await page.screenshot({ path: 'test-results/visual/sky-cheer.png' });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(400);
    } else {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
    }
  }
  const after = await page.evaluate(() => ({ party: (window as any).__pkr.session.run.party.map((m: any) => m.speciesId), sky: (window as any).__pkr.session.run.expansion?.sky }));
  expect(asked).toBe(true);
  expect(after.party).toEqual(team);
  if (after.sky.wiser === 1) {
    // gn.02: Fearow won with Pidgeot cheered: the story goes on next region, one stage wiser, with a fresh finale.
    expect(after.sky).toMatchObject({ region: 1, phase: 'rivalry', finale: { asked: false } });
  } else {
    expect(after.sky.finale.cheer).toBe('pidgeot');
    expect(after.sky.finale.winner).toMatch(/pidgeot|fearow/);
  }
  expect(errors).toEqual([]);
});
