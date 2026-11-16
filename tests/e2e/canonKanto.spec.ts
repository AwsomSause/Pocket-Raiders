import { expect, test, type Page } from '@playwright/test';

// Kanto canon spaces under the New UI (`?ui=new`): three events played with clicks on the mock-up layer.
// The outcome text stays until the player moves on; the results come after it (the extra press).

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
const view = (page: Page, key: string) => page.locator(`#rx .stage[data-scene="${key}"]`);

async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

function watch(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

async function toMap(page: Page, seed: string) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/?ui=new&seed=${seed}`);
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
}

/** Opens a Kanto canon event as a side stop, clicks one choice, then reads through to the map. */
async function play(page: Page, eventId: string, name: string, pick: number, opens?: string) {
  await page.evaluate((eventId) => {
    const run = (window as any).__pkr.session.run;
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push({ id: 'kc-e2e', kind: 'event', used: false, eventId });
    run.stage.current = node.id;
    if (!run.stage.visited.includes(node.id)) run.stage.visited.push(node.id);
  }, eventId);
  await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('Map').scene.start('Event', { sideId: 'kc-e2e' }));
  await waitForScene(page, 'Event');
  const ev = view(page, 'Event');
  await expect(ev).toContainText(name);
  // A long intro is read page by page; the choices show on the last page.
  for (let i = 0; i < 8 && (await ev.locator('[data-act="pick"]').count()) === 0; i++) {
    await ev.locator('[data-act="page"]').click({ position: { x: 400, y: 200 } });
    await page.waitForTimeout(400);
  }
  await ev.locator('[data-act="pick"]').nth(pick).click();
  await expect(ev.locator('[data-act="next"]').first()).toBeVisible({ timeout: 10_000 });
  await readOn(page, opens);
}

/** Reads the outcome and results through, back to the map (or until a pseudo-stage's first room opens with `opens` in its text). */
async function readOn(page: Page, opens?: string) {
  const ev = view(page, 'Event');
  for (let i = 0; i < 8 && (await scene(page)) === 'Event'; i++) {
    await page.waitForTimeout(900);
    if (opens && (await ev.innerText()).includes(opens)) return;
    const next = ev.locator('[data-act="next"]').last();
    if (await next.isVisible()) await next.click();
  }
  await waitForScene(page, 'Map');
}

const flag = (page: Page, key: string) => page.evaluate((key) => Number((window as any).__pkr.session.run.story.flags[`ev:${key}`] ?? 0), key);

test('Kanto canon (New UI): Dark City ends with the inspector and no battle', async ({ page }) => {
  const errors = watch(page);
  await toMap(page, 'kc-darkcity');
  await play(page, 'cs-kanto-route-darkcity', 'Dark City', 3);
  expect(await flag(page, 'kanto-route-darkcity')).toBe(1);
  expect(errors).toEqual([]);
});

test('Kanto canon (New UI): the Kind Stranger leaves his advice and the run goes on', async ({ page }) => {
  const errors = watch(page);
  await toMap(page, 'kc-stranger');
  await play(page, 'cs-kanto-pewter-stranger', 'Kind Stranger', 0);
  expect(await flag(page, 'kanto-pewter-stranger')).toBe(1);
  expect(errors).toEqual([]);
});

test('Kanto canon (New UI): the man on the dock opens One Island as a stage map of rooms', async ({ page }) => {
  const errors = watch(page);
  await toMap(page, 'kc-sevii');
  // "Take me." steps into the Pseudo Stage and stands on its first room, the Network Center, which opens at once.
  await play(page, 'cs-kanto-sevii-network', 'Man on the Dock', 0, 'Network Center');
  const pseudo = await page.evaluate(() => { const s = (window as any).__pkr.session.run.stage; return { name: s.pseudo?.name ?? null, rooms: s.map.nodes.length }; });
  expect(pseudo.name).toBe('The Sevii Islands');
  const ev = view(page, 'Event');
  for (let i = 0; i < 8 && (await ev.locator('[data-act="pick"]').count()) === 0; i++) {
    await ev.locator('[data-act="page"]').click({ position: { x: 400, y: 200 } });
    await page.waitForTimeout(400);
  }
  await ev.locator('[data-act="pick"]').first().click();
  // Celio's choice opens the next room (the dock), which also opens at once.
  await expect(ev.locator('[data-act="next"]').first()).toBeVisible({ timeout: 10_000 });
  await readOn(page, 'The Dock');
  expect(await page.evaluate(() => Number((window as any).__pkr.session.run.story.flags['ev:kanto-sevii-pass'] ?? 0))).toBe(1);
  // One Island and the ferry is a small map (each island is a map of its own, reached by the ferry), and the trainer stands on the dock.
  expect(pseudo.rooms).toBeGreaterThan(10);
  expect(pseudo.rooms).toBeLessThan(30);
  expect(await page.evaluate(() => { const s = (window as any).__pkr.session.run.stage; return s.map.nodes.find((n: any) => n.id === s.current)?.roomEvent; })).toBe('cs-kanto-sevii-network-knot');
  await page.screenshot({ path: 'test-results/kanto-sevii-dock.png' });
  expect(errors).toEqual([]);
});
