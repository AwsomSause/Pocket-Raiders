import { expect, test, type Page } from '@playwright/test';

// Beta 0.7 Fighting Tournament: the bracket strip, the full bracket (B) and the champion podium show on the tournament events.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}
async function toMap(page: Page) {
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
}
async function openEvent(page: Page, eventId: string, n: number) {
  await page.evaluate(([id, sideId]) => {
    const run = (window as any).__pkr.session.run;
    const node = run.stage.map.nodes.find((x: any) => x.column === 1);
    node.sides.push({ id: sideId, kind: 'event', used: false, eventId: id });
    run.stage.current = node.id;
    run.stage.visited = [node.id];
    (window as any).__pkr.game.scene.getScene((window as any).__pkr.activeScene()).scene.start('Event', { sideId });
  }, [eventId, `tb-${n}`]);
  await waitForScene(page, 'Event');
}
const has = (page: Page, name: string) => page.evaluate((n) => Boolean((window as any).__pkr.game.scene.getScene('Event').children.getByName(n)), name);

test('the tournament shows its bracket strip, a full bracket on B, and the champion podium at the end', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=tourney-e2e');
  await waitForScene(page, 'MainMenu');
  await toMap(page);
  await openEvent(page, 'cs-kanto-saffron-tournament', 1);
  expect(await has(page, 'tourney-strip')).toBe(true);
  expect(await has(page, 'tourney-champion')).toBe(false);
  await page.keyboard.press('b');
  await expect.poll(() => has(page, 'tourney-bracket')).toBe(true);
  await page.keyboard.press('b');
  await expect.poll(() => has(page, 'tourney-bracket')).toBe(false);
  await openEvent(page, 'cs-kanto-saffron-t-win1', 2);
  expect(await has(page, 'tourney-champion')).toBe(true);
  expect(errors).toEqual([]);
});
