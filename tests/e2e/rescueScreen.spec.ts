import { expect, test, type Page } from '@playwright/test';

// Rival Rescue (R9): a due plan opens the Rescue screen over the map; the player can pick a plan, answer the beats and
// the complication, see the result, and land back on a map with the Pokémon returned. No console errors.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}
const shot = async (page: Page, name: string) => {
  const dir = process.env.RESCUE_SHOTS;
  if (dir) await page.screenshot({ path: `${dir}/${name}.png` });
};

test('the rival rescue plan opens over the map and plays through', async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/?seed=rescue-screen&debug=1');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=rescue-screen&debug=1');
  await waitForScene(page, 'MainMenu');
  await page.keyboard.press('Enter');
  for (const key of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    if (key !== 'Hub') await page.keyboard.press('Enter');
    await waitForScene(page, key);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);

  // Put the run in the state a raid loss would leave: a registered rival and two Pokémon held, plan due now.
  await page.evaluate(() => {
    const { session } = (window as any).__pkr;
    const run = session.run;
    const base = JSON.parse(JSON.stringify(run.party[0]));
    const held = [1, 2].map((i) => ({ ...JSON.parse(JSON.stringify(base)), uid: `held-${i}` }));
    run.expansion = {
      rival: { blue: { role: 'main', personality: 'champion-chaser', style: 'blitz', arc: 'prodigy-learns-humility', lead: 0, marks: [], feelings: { friendship: 3, respect: 3, trust: 3, rivalry: 3, resentment: 0, admiration: 2 }, pityLosses: 0 } },
      rescue: {
        holds: [{ id: 'h1-kanto', teamId: 'rocket', regionId: 'kanto', pokemon: held, impoundNode: -10, waitNodes: 9, lastQuietNode: 50, dueAt: 0, receipt: true, offers: 0, declines: 0, lastDeclineNode: null, lateDue: false, late: false, frozenAt: null, accepted: null, warrantAt: null, heldAtClimax: false }],
        active: null, returned: [], attitude: 0, balloonUsed: false, memory: [], flags: {}, log: [], lost: [],
      },
    };
    (window as any).__pkr.game.scene.getScene('Map').scene.restart();
  });
  await waitForScene(page, 'Rescue');
  await shot(page, '1-offer');

  // Quiet Extraction (first plan), then the three beats and the complication.
  await page.keyboard.press('Enter');
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(300);
    await shot(page, `${i + 2}-beat`);
    await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(400);
  await shot(page, '6-result');
  expect(await scene(page)).toBe('Rescue');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Map');
  await shot(page, '7-map-after');
  expect(errors).toEqual([]);
});
