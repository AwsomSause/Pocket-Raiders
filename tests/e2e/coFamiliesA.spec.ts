import { expect, test, type Page } from '@playwright/test';

// Catalog Overhaul, families-a (STORY_FAMILIES 1-4 and 7), played in the New UI: a hazard's "push on" is remembered
// after a reload, and Hettie's ledger pays by the Kindness total. No console errors.

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
async function openEvent(page: Page, sideId: string, eventId: string, flags: Record<string, number> = {}) {
  await page.evaluate(({ sideId, eventId, flags }) => {
    const run = (window as any).__pkr.session.run;
    for (const [f, n] of Object.entries(flags)) run.story.flags[`ev:${f}`] = n;
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

test('Hailstorm: "Run for it." hurts the team and is remembered after a reload', async ({ page }) => {
  const errors = watch(page);
  await toMap(page, 'co-families-a-hail');
  const hpBefore = await page.evaluate(() => (window as any).__pkr.session.run.party.reduce((s: number, m: any) => s + m.hp, 0));
  await openEvent(page, 'co-hail', 'wx-hailstorm');
  const ev = view(page, 'Event');
  await expect(ev).toContainText('Hail hammers the trail');
  await playFirstChoice(page);
  const after = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    return { hp: run.party.reduce((s: number, m: any) => s + m.hp, 0), flag: run.story.flags['ev:hazard-hailstorm-push'] ?? 0 };
  });
  expect(after.flag).toBe(1);
  expect(after.hp).toBeLessThan(hpBefore);

  await page.reload();
  await waitForScene(page, 'MainMenu');
  const saved = await page.evaluate(() => {
    const raw = Object.entries(localStorage).find(([k]) => k.endsWith('run'));
    const run = raw ? JSON.parse(raw[1] as string).data : null;
    return run?.story?.flags?.['ev:hazard-hailstorm-push'] ?? 0;
  });
  expect(saved).toBe(1);
  expect(errors).toEqual([]);
});

test('The Favour Returned: with a Kindness total of 7, Hettie gives a Rare Candy (a level), the Lucky Egg and the drawing', async ({ page }) => {
  const errors = watch(page);
  await toMap(page, 'co-families-a-hettie');
  const levels = () => page.evaluate(() => (window as any).__pkr.session.run.party.reduce((s: number, m: any) => s + m.level, 0));
  const levelsBefore = await levels();
  await openEvent(page, 'co-hettie', 'charity-favor', { 'charity-hettie': 1, 'kind-total': 7 });
  await expect(view(page, 'Event')).toContainText('Hettie, from the orphanage stall');
  await playFirstChoice(page);
  const after = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    const has = (id: string) => (run.inventory[id] ?? 0) + (run.passives?.[id] ?? 0);
    return { egg: has('lucky-egg') > 0, drawing: run.story.flags['ev:hettie-drawing'] ?? 0, done: run.story.flags['ev:charity-favor'] ?? 0 };
  });
  expect(after).toEqual({ egg: true, drawing: 1, done: 1 });
  // The Rare Candy is used on the spot (a level for one of the team).
  expect(await levels()).toBeGreaterThan(levelsBefore);
  expect(errors).toEqual([]);
});
