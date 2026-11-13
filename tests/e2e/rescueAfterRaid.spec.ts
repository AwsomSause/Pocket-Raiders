import { expect, test, type Page } from '@playwright/test';

// Beta 0.6 R9: letting a Rocket operation through (a lost or skipped raid) impounds Pokémon, and when the rival's plan is due
// the Rescue offer opens on the map. Nothing is offered before the clock runs out.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}

test('losing a raid impounds Pokémon and the rival offers a rescue when the plan is due', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=r9-raid-e2e');
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  // Set the stage: a Rocket operation running, five Pokémon, a main rival with a voice.
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const run = session.run;
    const base = run.party[0];
    run.party = Array.from({ length: 5 }, (_, i) => ({ ...structuredClone(base), uid: `e2e${i}` }));
    run.story.evil = { teamId: 'rocket', beat: 0, stages: 2, nextAt: 2, heat: 0, ops: [{ id: 'pokemon-heist', region: 0, outcome: 'running' }], villains: {}, defector: false, end: 'none' };
    run.expansion = { ...(run.expansion ?? {}), rival: { blue: { role: 'main', personality: 'strategist', style: 'blitz', arc: 'prodigy-learns-humility', lead: 1, marks: ['beat-you'], feelings: { friendship: 3, respect: 3, trust: 3, rivalry: 3, resentment: 0, admiration: 2 }, pityLosses: 0 } } };
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push({ id: 'e2e-op', kind: 'event', used: false, eventId: 'evil-rocket-op-pokemon-heist' });
    run.stage.current = node.id;
    run.stage.visited = [node.id];
    game.scene.getScenes(true)[0].scene.start('Event', { sideId: 'e2e-op' });
  });
  await waitForScene(page, 'Event');
  await page.waitForTimeout(1200);
  // "Leave it alone" (the third choice): Team Rocket pulls it off.
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Event').focus(2));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);
  const hold = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    const h = run.expansion.rescue?.holds?.[0];
    return h ? { n: h.pokemon.length, party: run.party.length, dueAt: h.dueAt, impoundNode: h.impoundNode, team: h.teamId } : null;
  });
  expect(hold).not.toBeNull();
  expect(hold!.team).toBe('rocket');
  expect(hold!.n).toBeGreaterThanOrEqual(1);
  expect(hold!.party).toBe(5 - hold!.n);
  // Back on the map right away: nothing is offered yet.
  await page.evaluate(() => { (window as any).__pkr.game.scene.getScenes(true)[0].scene.start('Map', { focus: 0 }); });
  await waitForScene(page, 'Map');
  await page.waitForTimeout(600);
  expect(await scene(page)).toBe('Map');
  // Time passes: move the run to the due node and open the map again. The rival's offer opens on top.
  await page.evaluate((dueAt) => {
    const { session, game } = (window as any).__pkr;
    const per = session.content.campaigns.get(session.run.campaignId).stagesPerRegion;
    session.run.regionIndex = Math.floor(dueAt / per);
    session.run.stage.index = dueAt % per;
    game.scene.getScene('Map').scene.restart({ focus: 0 });
  }, hold!.dueAt);
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.isActive('Rescue')), { timeout: 15_000 }).toBe(true);
  await page.screenshot({ path: 'test-results/r9-rescue-offer.png' });
  expect(errors).toEqual([]);
});

test('Loud Grab: a guard fights at the Approach and a win resumes the plan', async ({ page }) => {
  test.setTimeout(300_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=r9-raid-e2e');
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  // Set the stage: a Rocket operation running, five Pokémon, a main rival with a voice.
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const run = session.run;
    const base = run.party[0];
    run.party = Array.from({ length: 5 }, (_, i) => ({ ...structuredClone(base), uid: `e2e${i}` }));
    run.story.evil = { teamId: 'rocket', beat: 0, stages: 2, nextAt: 2, heat: 0, ops: [{ id: 'pokemon-heist', region: 0, outcome: 'running' }], villains: {}, defector: false, end: 'none' };
    run.expansion = { ...(run.expansion ?? {}), rival: { blue: { role: 'main', personality: 'strategist', style: 'blitz', arc: 'prodigy-learns-humility', lead: 1, marks: ['beat-you'], feelings: { friendship: 3, respect: 3, trust: 3, rivalry: 3, resentment: 0, admiration: 2 }, pityLosses: 0 } } };
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push({ id: 'e2e-op', kind: 'event', used: false, eventId: 'evil-rocket-op-pokemon-heist' });
    run.stage.current = node.id;
    run.stage.visited = [node.id];
    game.scene.getScenes(true)[0].scene.start('Event', { sideId: 'e2e-op' });
  });
  await waitForScene(page, 'Event');
  await page.waitForTimeout(1200);
  // "Leave it alone" (the third choice): Team Rocket pulls it off.
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Event').focus(2));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);
  const hold = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    const h = run.expansion.rescue?.holds?.[0];
    return h ? { n: h.pokemon.length, party: run.party.length, dueAt: h.dueAt, impoundNode: h.impoundNode, team: h.teamId } : null;
  });
  expect(hold).not.toBeNull();
  expect(hold!.team).toBe('rocket');
  expect(hold!.n).toBeGreaterThanOrEqual(1);
  expect(hold!.party).toBe(5 - hold!.n);
  await page.evaluate(() => { (window as any).__pkr.game.scene.getScenes(true)[0].scene.start('Map', { focus: 0 }); });
  await waitForScene(page, 'Map');
  await page.waitForTimeout(600);
  await page.evaluate((dueAt) => {
    const { session, game } = (window as any).__pkr;
    const per = session.content.campaigns.get(session.run.campaignId).stagesPerRegion;
    session.run.regionIndex = Math.floor(dueAt / per);
    session.run.stage.index = dueAt % per;
    game.scene.getScene('Map').scene.restart({ focus: 0 });
  }, hold!.dueAt);
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.isActive('Rescue')), { timeout: 15_000 }).toBe(true);
  await page.waitForTimeout(400);
  // Loud Grab is the second plan; take the first choice of the first beat.
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Rescue').menu.config.onSelect(1));
  await page.waitForTimeout(300);
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Rescue').menu.config.onSelect(0));
  await page.waitForTimeout(300);
  // The guard is waiting: the plan says so, and Fight starts a pseudo battle.
  expect(await page.evaluate(() => (window as any).__pkr.session.run.expansion.rescue.active.fightNow)).toBe('approach');
  await page.screenshot({ path: 'test-results/r9-rescue-guard.png' });
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Rescue').menu.config.onSelect(0));
  await waitForScene(page, 'Battle');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.battle.event.eventId)).toBe('rescue:approach');
  await page.evaluate(() => { for (const m of (window as any).__pkr.session.run.battle.enemyTeam) m.hp = 1; });
  // Play it out: Enter on any message, Fight + the first move when the command menu is up.
  const end = Date.now() + 200_000;
  while (Date.now() < end && (await scene(page)) === 'Battle') {
    const menu = await page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle')?.menu));
    await page.keyboard.press('Enter');
    await page.waitForTimeout(menu ? 350 : 150);
  }
  // Back on the map, the Rescue screen resumes the plan: one fight won, no fight waiting.
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.isActive('Rescue')), { timeout: 30_000 }).toBe(true);
  const plan = await page.evaluate(() => (window as any).__pkr.session.run.expansion.rescue.active);
  expect(plan.fights).toEqual(['won']);
  expect(plan.fightNow).toBeNull();
  expect(plan.wiped).toBe(false);
  expect(errors).toEqual([]);
});
