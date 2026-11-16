import { expect, test, type Page } from '@playwright/test';

// Catalog row 9: Team Sky's screens (HOENN_TEAMS 7.9 to 7.13) and the Team Hub (7.1) open from the map menu, in the
// Old look (canvas) and the New look (the #rx layer), at three window sizes, with no console errors.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}
const texts = (page: Page) =>
  page.evaluate((): string => {
    const all = (o: any): any[] => (o.list ? [o, ...o.list.flatMap(all)] : [o]);
    return (window as any).__pkr.game.scene.getScene('Map').children.list.flatMap(all).filter((o: any) => o.type === 'Text').map((o: any) => o.text as string).join(' ');
  });

async function toMap(page: Page, url: string, setup: string): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url);
  await waitForScene(page, 'MainMenu');
  await page.evaluate((what) => {
    const { session, game } = (window as any).__pkr;
    session.newRun('red', 'e2e-sky-1');
    session.chooseStarter(0);
    const run = session.run;
    if (what === 'sky') Object.assign(run.story.flags, { 'ev:sky-founded': 1, 'ev:sky-base-tower': 1, 'ev:sky-creed-balance': 1 });
    else {
      run.story.evil = { teamId: 'magma', beat: 3, stages: 3, nextAt: 3, heat: 0, ops: [], villains: {}, defector: false, end: 'none' };
      Object.assign(run.story.flags, { 'ev:team-magma-inside': 1, 'ev:team-magma-standing': 11, 'ev:team-magma-suspicion': 3, 'ev:hoenn-bunkmate-trust': 2 });
    }
    game.scene.getScenes(true)[0].scene.start('Map');
  }, setup);
  await waitForScene(page, 'Map');
  return errors;
}
const open = (page: Page, kind: string) =>
  page.evaluate((k) => {
    const map = (window as any).__pkr.game.scene.getScene('Map');
    const i = map.options.findIndex((o: any) => o.kind === k);
    if (i < 0) throw new Error(`no ${k} button`);
    map.activate(i);
  }, kind);

test("Team Sky's hub, roster and dispatch open from the map menu (Old look)", async ({ page }) => {
  const errors = await toMap(page, '/?debug=1', 'sky');
  await open(page, 'sky');
  await expect.poll(() => texts(page)).toContain('Renown');
  expect(await texts(page)).toContain('Keep the Balance.');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.expansion.teamSky.grunts.length)).toBe(3);
  for (const [w, h] of [[800, 450], [480, 800], [960, 540]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `test-results/sky-hub-${w}x${h}.png` });
  }
  // The Roster tab, then a grunt's own page.
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => texts(page)).toContain('Marlo');
  await page.keyboard.press('Enter');
  await expect.poll(() => texts(page)).toContain('Promote to Flyer');
  expect(errors).toEqual([]);
});

test("Team Sky's hub in the New look, and the Magma Team Hub", async ({ page }) => {
  const errors = await toMap(page, '/?debug=1&ui=new', 'sky');
  await open(page, 'sky');
  await expect(page.locator('#rx')).toContainText('Renown', { timeout: 10_000 });
  await expect(page.locator('#rx')).toContainText('Heat: Magma');
  await page.screenshot({ path: 'test-results/sky-hub-new.png' });
  expect(errors).toEqual([]);

  const errs2 = await toMap(page, '/?debug=1&ui=new', 'magma');
  await open(page, 'teamHub');
  await expect(page.locator('#rx')).toContainText('RANK', { timeout: 10_000 });
  await expect(page.locator('#rx')).toContainText('Ottoway');
  await expect(page.locator('#rx')).toContainText('More land.');
  await page.screenshot({ path: 'test-results/team-hub-new.png' });
  expect(errs2).toEqual([]);
});
