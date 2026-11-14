import { expect, test, type Page } from '@playwright/test';

// Beta 0.7 Node Event Menus P2: the "Here" button opens the node's menu (2 to 5 cards); picking a micro entry plays it.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}
const idle = (page: Page) => expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
const named = (page: Page, name: string) =>
  page.evaluate((name) => {
    const s = (window as any).__pkr.game.scene.getScene('Map');
    const all: any[] = [];
    const walk = (list: any[]) => list.forEach((o) => (all.push(o), o.list && walk(o.list)));
    walk(s.children.list);
    return all.filter((o) => o.name === name).length;
  }, name);

for (const size of [{ width: 1280, height: 720 }, { width: 932, height: 430 }]) {
  test(`node menu opens, picks a card and locks the rest (${size.width}x${size.height})`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.setViewportSize(size);
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/?seed=node-menu-e2e');
    await waitForScene(page, 'MainMenu');
    for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
      await page.keyboard.press('Enter');
      await waitForScene(page, next);
    }
    await idle(page);
    // Turn menus on for this run and stand on the first node (as if its battle were won).
    await page.evaluate(() => {
      const pkr = (window as any).__pkr;
      const run = pkr.session.run;
      run.expansion = { ...(run.expansion ?? {}), nodeMenus: { stage: '', menus: {}, tally: { menus: 0, picks: 0, micro: 0, skipped: 0 } } };
      const first = run.stage.map.nodes.find((n: any) => n.column === 1);
      run.stage.current = first.id;
      run.stage.visited.push(first.id);
      pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
    });
    await waitForScene(page, 'Map');
    await idle(page);
    const opened = await page.evaluate(() => {
      const map = (window as any).__pkr.game.scene.getScene('Map');
      const i = map.options.findIndex((o: any) => o.kind === 'nodeMenu');
      if (i >= 0) map.activate(i);
      return i;
    });
    expect(opened).toBeGreaterThanOrEqual(0);
    await page.waitForTimeout(250);
    expect(await named(page, 'node-menu')).toBe(1);
    await page.screenshot({ path: `test-results/node-menu-${size.width}.png` });
    const menu = await page.evaluate(() => (window as any).__pkr.session.nodeMenu());
    const cards = menu.entries.filter((v: any) => v.entry.kind !== 'encounter');
    expect(cards.length).toBeGreaterThanOrEqual(2);
    expect(cards.length).toBeLessThanOrEqual(6);
    // Pick the first micro entry with the keyboard.
    const micro = cards.findIndex((v: any) => v.entry.kind === 'micro');
    if (micro >= 0) {
      const start = cards.findIndex((v: any) => !v.done && !v.locked);
      for (let i = start; i < micro; i++) await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Enter');
      await waitForScene(page, 'Map');
      await idle(page);
      const after = await page.evaluate(() => (window as any).__pkr.session.nodeMenu());
      expect(after.menu.picked.length).toBe(1);
      expect(after.entries.find((v: any) => v.entry.kind === 'micro' && v.done)).toBeTruthy();
      await page.screenshot({ path: `test-results/node-menu-after-${size.width}.png` });
    }
    expect(errors).toEqual([]);
  });
}
