import { expect, test, type Page } from '@playwright/test';

// Catalog Overhaul, families-b (STORY_FAMILIES_6.md), played in the New UI: a two-step road chain remembers the first
// step in the second, and The Last Train opens its third carriage. No console errors.

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

/** Stands the run on a first-column node with this event beside it (and these run flags set), then opens it. */
async function openEvent(page: Page, sideId: string, eventId: string, flags: string[] = []) {
  await page.evaluate(({ sideId, eventId, flags }) => {
    const run = (window as any).__pkr.session.run;
    for (const f of flags) run.story.flags[`ev:${f}`] = 1;
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push({ id: sideId, kind: 'event', used: false, eventId });
    run.stage.current = node.id;
    if (!run.stage.visited.includes(node.id)) run.stage.visited.push(node.id);
    (window as any).__pkr.game.scene.getScene('Map').scene.start('Event', { sideId });
  }, { sideId, eventId, flags });
  await waitForScene(page, 'Event');
}

/** Picks the first choice, then reads through the outcome and results back to the map. */
async function playFirstChoice(page: Page) {
  const ev = view(page, 'Event');
  // A long intro is read page by page; the choices come with the last page.
  for (let i = 0; i < 8 && (await ev.locator('[data-act="pick"]').count()) === 0; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
  }
  await ev.locator('[data-act="pick"]').first().click();
  await expect(ev.locator('.btn[data-act="next"]')).toBeVisible({ timeout: 10_000 });
  // Outcome pages, then the results: each waits for an input (Enter, as a player would press it).
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(800);
    if ((await scene(page)) !== 'Event') break;
    await page.keyboard.press('Enter');
  }
  await waitForScene(page, 'Map');
}

test('The Roadside Stand: the second step remembers keeping the change, and the chain timer starts', async ({ page }) => {
  const errors = watch(page);
  await toMap(page, 'co-families-b-e2e');
  await page.evaluate(() => { (window as any).__pkr.session.run.money = 2000; });
  await openEvent(page, 'fb-stand', 'ovc-roadside-stand-s1');
  await expect(view(page, 'Event')).toContainText('BERRIES, 100');
  await playFirstChoice(page);
  const flags = await page.evaluate(() => {
    const f = (window as any).__pkr.session.run.story.flags;
    return { kept: f['ev:rs-kept'] ?? 0, step: f['ev:ovc-roadside-stand-s1'] ?? 0, timer: f['ev:ovt-roadside-stand-s1'] ?? -1 };
  });
  expect(flags.kept).toBe(1);
  expect(flags.step).toBe(1);
  expect(flags.timer).toBeGreaterThanOrEqual(0);

  await openEvent(page, 'fb-stand-2', 'ovc-roadside-stand-s2');
  await expect(view(page, 'Event')).toContainText('Your change bought the jars');
  await playFirstChoice(page);
  expect(errors).toEqual([]);
});

test('The Last Train: asking "Who?" opens the third carriage beside the node', async ({ page }) => {
  const errors = watch(page);
  await toMap(page, 'co-families-b-e2e-2');
  await openEvent(page, 'fb-train', 'ovc-last-train-s1', ['last-stop-ticket']);
  await expect(view(page, 'Event')).toContainText('The ticket in your pocket');
  await playFirstChoice(page);
  const state = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    return { done: run.story.flags['ev:train-done'] ?? 0, room: run.stage.map.nodes.some((n: any) => (n.sides ?? []).some((s: any) => s.eventId === 'fb-last-train-carriage')) };
  });
  expect(state).toEqual({ done: 1, room: true });
  expect(errors).toEqual([]);
});
