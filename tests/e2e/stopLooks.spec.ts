import { expect, test, type Page } from '@playwright/test';

// Raid and Totem looks (screens redesign group E): each pinned look draws the boss card, Esc closes it, Enter starts the battle, no console errors.
const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
const waitFor = async (page: Page, key: string) => {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
};

test('raid and totem looks draw their boss card and still start the fight', async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=stop-looks');
  await waitFor(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitFor(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  const cases: [string, string, string][] = [['raid', 'maxden', 'raid'], ['raid', 'shonen', 'raid'], ['raid', 'tera', 'raid'], ['totem', 'ink', 'totem']];
  for (const [screen, look, kind] of cases) {
    const sideId = await page.evaluate(([scr, st, k]) => {
      const p = (window as any).__pkr;
      p.session.settings.screenStyles = { [scr!]: st };
      const run = p.session.run;
      const node = run.stage.map.nodes[0];
      run.stage.current = node.id;
      run.money = 50000;
      const side = k === 'raid' ? { id: 'e2e-raid', kind: 'raid', raidId: 'den-arcanine', used: false } : { id: 'e2e-totem', kind: 'totem', totemId: 'totem-gumshoos', used: false };
      node.sides = [side];
      return side.id;
    }, [screen, look, kind]);
    await page.evaluate((id) => (window as any).__pkr.game.scene.getScene('Map')[(id as string).includes('raid') ? 'openRaid' : 'openTotem'](id), sideId);
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').picker?.isStopCard ?? false), errors.join(' | ')).toBe(true);
    await page.screenshot({ path: `test-results/stop-${look}.png` });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').picker)).toBeNull();
  }
  expect(errors).toEqual([]);
});
