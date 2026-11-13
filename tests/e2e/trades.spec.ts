import { expect, test, type Page } from '@playwright/test';

// Trade Stops redesign: every built style draws the Trade Post, trades, plays its moment and returns to the map;
// the Plaza's specialist traders open the same screen and return to the Plaza. No console errors.

const STYLES = (process.env.TRADE_STYLES ?? 'manga,versus,novel,eyecatch,episode,cutin,shoujo,chibi,cable,cards,sunset,ink').split(',');

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

async function toMap(page: Page) {
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
}

/** Stands on a visited first-column node with a fresh stop of this kind and a party every trader wants something from. */
async function prepare(page: Page, kind: 'service' | 'plaza', style: string, n: number): Promise<string> {
  return page.evaluate(
    ({ kind, style, n }) => {
      const pkr = (window as any).__pkr;
      const run = pkr.session.run;
      pkr.session.settings.screenStyles = { trade: style };
      const tpl = (window as any).__tpl ?? ((window as any).__tpl = JSON.parse(JSON.stringify(run.party[0])));
      run.party = ['squirtle', 'eevee', 'onix'].map((sp: string) => ({ ...JSON.parse(JSON.stringify(tpl)), uid: `${tpl.uid}-${sp}-${n}`, speciesId: sp, level: 14 }));
      run.plaza.used = {};
      run.money = 9000;
      const node = run.stage.map.nodes.find((x: any) => x.column === 1);
      run.stage.current = node.id;
      if (!run.stage.visited.includes(node.id)) run.stage.visited.push(node.id);
      const id = `e2e-${kind}-${n}`;
      node.sides.push(kind === 'service' ? { id, kind: 'service', serviceId: 'trade', used: false } : { id, kind: 'plaza', used: false });
      return id;
    },
    { kind, style, n },
  );
}

test('every Trade Stop style trades at the Trade Post and returns to the map', async ({ page }) => {
  test.setTimeout(400_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=trade-e2e');
  await waitForScene(page, 'MainMenu');
  await toMap(page);

  for (const [i, style] of STYLES.entries()) {
    const sideId = await prepare(page, 'service', style, i);
    await page.evaluate((id) => (window as any).__pkr.game.scene.getScene('Map').openService(id), sideId);
    await waitForScene(page, 'Trade');
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Trade').drawnStyle)).toBe(style);
    await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Trade').phase), { timeout: 30_000 }).toBe('choose'); // Enter is ignored while the style loads
    const before = await page.evaluate(() => (window as any).__pkr.session.run.party.map((m: any) => m.speciesId).join(','));
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Trade').phase), { timeout: 30_000 }).toBe('done').catch((e) => { throw new Error(`${style}: ${errors.join(' | ')} ${e}`); });
    await page.screenshot({ path: `test-results/trade-${style}.png` });
    expect(await page.evaluate(() => (window as any).__pkr.session.run.party.map((m: any) => m.speciesId).join(','))).not.toBe(before);
    await page.keyboard.press('Enter');
    await waitForScene(page, 'Map');
    await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  }
  expect(errors).toEqual([]);
});

test('the Plaza traders open the Trade Stop screen and come back to the Plaza', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=trade-e2e-plaza');
  await waitForScene(page, 'MainMenu');
  await toMap(page);
  const sideId = await prepare(page, 'plaza', 'random', 0);
  await page.evaluate((id) => (window as any).__pkr.game.scene.getScene('Map').openPlaza(id), sideId);
  await waitForScene(page, 'Plaza');
  await page.evaluate(() => {
    const s = (window as any).__pkr.game.scene.getScene('Plaza');
    const d = s.layout.districts.find((x: any) => x.sections.some((y: any) => y.id === 'traders'));
    s.openSection(d, 'traders');
  });
  await waitForScene(page, 'Trade');
  await page.waitForTimeout(600);
  expect(STYLES).toContain(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Trade').drawnStyle));
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Trade').phase), { timeout: 30_000 }).toBe('choose'); // Esc is ignored while the style loads
  await page.keyboard.press('Escape');
  await waitForScene(page, 'Plaza');
  expect(errors).toEqual([]);
});
