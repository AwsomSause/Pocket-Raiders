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
