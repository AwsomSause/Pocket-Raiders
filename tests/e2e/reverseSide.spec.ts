import { expect, test, type Page } from '@playwright/test';
import { confirmToMenu } from './battleInput';

// Catalog Overhaul batch 5 row B: The Renegade's Reverse Side. With Giratina's blessing, the battle menu offers "Reverse Side": the
// player steps out of an ordinary fight, lands back on the map, and the node now holds the gate of a Distortion pseudo-stage.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}
const labels = (page: Page) => page.evaluate(() => (((window as any).__pkr.game.scene.getScene('Battle').menu?.config.options ?? []) as { label: string }[]).map((o) => o.label));

test('Reverse Side steps out of a wild fight and opens a Distortion gate on the node', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=e2e-reverse-side&debug=1');
  await waitForScene(page, 'MainMenu');
  await page.evaluate(() => { (window as any).__pkr.session.settings.expansion.blessingsEnabled = false; });
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  // Give the run The Renegade (as The Rift Whisper would) and clear the first column's attached events.
  await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    run.expansion = { ...run.expansion, blessing: { id: 'giratina', tier: 'primordial', influence: 1, seen: true, ashRegions: [], communion: false, riteUsed: false, stagesDone: [] } };
    for (const n of run.stage.map.nodes) if (n.column === 1) { n.sides = []; n.kind = 'wild'; n.harder = false; }
  });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  await confirmToMenu(page);
  expect(await labels(page)).toContain('Reverse Side');
  await page.screenshot({ path: 'test-results/reverse-side-menu.png' });
  await page.evaluate(() => {
    const battle = (window as any).__pkr.game.scene.getScene('Battle');
    const i = (battle.menu.config.options as { label: string }[]).findIndex((o) => o.label === 'Reverse Side');
    battle.menu.focus(i, false);
    battle.menu.confirm();
  });
  for (let t = 0; t < 20 && (await scene(page)) === 'Battle'; t++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
  }
  await waitForScene(page, 'Map');
  const after = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    return { phase: run.phase, gates: run.stage.map.nodes.flatMap((n: any) => n.sides).map((s: any) => s.eventId).filter((id: string) => id?.startsWith('ps-distortion')) };
  });
  expect(after).toEqual({ phase: 'map', gates: ['ps-distortion-incident-gate'] });
  expect(errors).toEqual([]);
});
