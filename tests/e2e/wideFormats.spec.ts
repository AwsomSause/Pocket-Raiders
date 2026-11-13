import { expect, test, type Page } from '@playwright/test';

// Beta 0.6 E4: a running wide format (the Breather) shows its plain screen over the map, heals once, and returns to the map.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}

test('Breather opens over the map, heals once and closes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=e4-breather');
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    run.party[0].hp = 1;
    run.expansion = { ...(run.expansion ?? {}), cut: { format: { id: 'breather', state: { healPct: 0.5, step: 'choose', revived: null, healed: 0 } } } };
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Format');
  await page.screenshot({ path: 'test-results/e4-breather.png' });
  await page.keyboard.press('Enter'); // Rest
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter'); // Continue
  await waitForScene(page, 'Map');
  const out = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    return { hp: run.party[0].hp, done: run.expansion.cut.done, format: run.expansion.cut.format ?? null, cp: run.expansion.cut.checkpoint };
  });
  expect(out.hp).toBeGreaterThan(1);
  expect(out.done).toEqual(['breather']);
  expect(out.format).toBeNull();
  expect(out.cp).toBe('breather');
  expect(errors).toEqual([]);
});

test('Blackout: picking an anchor starts a sealed battle', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=e4-blackout');
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    const anchors = [
      { id: 'a1', place: 'the Nugget Bridge crossing', name: 'Rocket Scientist (anchor)', species: ['mr-mime'], size: 2, beaten: false },
      { id: 'a2', place: 'the Celadon Lane cordon', name: 'Rocket Scientist (anchor)', species: ['mr-mime'], size: 2, beaten: false },
      { id: 'a3', place: 'the crossroads below Silph', name: 'Rocket Scientist (anchor)', species: ['mr-mime'], size: 2, beaten: false },
    ];
    run.expansion = { ...(run.expansion ?? {}), cut: { format: { id: 'blackout', state: { anchors, triad: false, pending: null, losses: 0 } } } };
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Format');
  await page.screenshot({ path: 'test-results/e4-blackout.png' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  const rule = await page.evaluate(() => (window as any).__pkr.session.run.battle.eventRule);
  expect(rule).toEqual({ noSwitchFirstTurn: true, typeBoost: { type: 'psychic', pct: 10 } });
  expect(errors).toEqual([]);
});

test('Siege Map: the Rocket Ledger shows over the map and a Held gate is a free entry', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=e4-siege');
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    const d = (id: string, name: string, place: string | null, status: string, heldBy: string, ifLost: string, gate = true) => ({ id, name, place, status, heldBy, ifLost, gate });
    const districts = [
      d('north-gate', 'North Gate', 'Route 5', 'held', 'Your rival', "The rival's battle is added to Phase 1 instead of removed"),
      d('east-gate', 'East Gate', 'Route 8', 'held', 'Officer Jenny', 'Reinforcements arrive one turn sooner in Phase 4'),
      d('south-gate', 'South Gate', 'Route 6', 'contested', '', 'Major Surge joins Phase 3 as a third duel'),
      d('west-gate', 'West Gate', 'Route 7', 'lost', '', 'Shinobi Koga poisons the Breather (heal 35% instead of 50%)'),
      d('center', 'The Center', null, 'contested', 'Oracle Sabrina', 'See Phase 1', false),
    ];
    run.expansion = { ...(run.expansion ?? {}), cut: { format: { id: 'siege', state: { region: 'kanto', districts, entered: null, pending: null, tries: 0 } } } };
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Siege');
  await page.screenshot({ path: 'test-results/e4-siege.png' });
  await page.keyboard.press('Enter'); // North Gate: Held, free entry
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter'); // Begin Phase 1
  await waitForScene(page, 'Map');
  const out = await page.evaluate(() => (window as any).__pkr.session.run.expansion);
  expect(out.siege.entered).toBe('kanto.north-gate');
  expect(out.siege.lost).toEqual(['kanto.west-gate']);
  expect(out.cut.format).toBeUndefined();
  expect(errors).toEqual([]);
});

test('Colossus: the fight opens with the Blueprint plate beside it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=e4-colossus');
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    run.expansion = { ...(run.expansion ?? {}), cut: { format: { id: 'colossus', state: { apex: { id: 'ss.rocket.m2', name: 'M2', code: 'XD002' }, pending: false, result: null } } } };
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Format');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.isActive('ColossusPlate')), { timeout: 10_000 }).toBe(true); // the plate runs above the battle
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'test-results/e4-colossus.png' });
  const c = await page.evaluate(() => (window as any).__pkr.session.run.battle.colossus);
  expect(c.seals.map((s: { name: string }) => s.name)).toEqual(['Right Shoulder', 'Left Shoulder', 'Chest', 'Crown']);
  expect(errors).toEqual([]);
});
