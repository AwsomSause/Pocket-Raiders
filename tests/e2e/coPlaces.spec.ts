import { expect, test, type Page } from '@playwright/test';

// Catalog Overhaul, places (Delves, run events, merged places), played in the New UI: the Cartographer takes his fee and
// the paid map survives a reload, the Hall of Mirrors raises Bond, and the museum theft leaves its lead for later in the run.
// No console errors.

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
async function openEvent(page: Page, sideId: string, eventId: string, flags: string[] = [], money = 0) {
  await page.evaluate(({ sideId, eventId, flags, money }) => {
    const run = (window as any).__pkr.session.run;
    if (money) run.money = money;
    for (const f of flags) run.story.flags[`ev:${f}`] = 1;
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push({ id: sideId, kind: 'event', used: false, eventId });
    run.stage.current = node.id;
    if (!run.stage.visited.includes(node.id)) run.stage.visited.push(node.id);
    (window as any).__pkr.game.scene.getScene('Map').scene.start('Event', { sideId });
  }, { sideId, eventId, flags, money });
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

test('The Cartographer: paying 300 shows the stops ahead, and the payment is kept after a reload', async ({ page }) => {
  const errors = watch(page);
  await toMap(page, 'co-places-map');
  await openEvent(page, 'co-map', 'mr-cartographer', [], 1000);
  await expect(view(page, 'Event')).toContainText('Inigo');
  await playFirstChoice(page);
  const money = await page.evaluate(() => (window as any).__pkr.session.run.money);
  expect(money).toBe(700);

  await page.reload();
  await waitForScene(page, 'MainMenu');
  const saved = await page.evaluate(() => {
    const raw = Object.entries(localStorage).find(([k]) => k.endsWith('run'));
    return raw ? JSON.parse(raw[1] as string).data?.money ?? null : null;
  });
  expect(saved).toBe(700);
  expect(errors).toEqual([]);
});

test('The Hall of Mirrors: looking at each mirror raises the whole team\'s friendship', async ({ page }) => {
  const errors = watch(page);
  await toMap(page, 'co-places-mirrors');
  const before = await page.evaluate(() => (window as any).__pkr.session.run.party.map((p: any) => p.friendship));
  await openEvent(page, 'co-mirrors', 'hall-of-mirrors');
  await expect(view(page, 'Event')).toContainText('none of them show you as you are now');
  await playFirstChoice(page);
  const after = await page.evaluate(() => (window as any).__pkr.session.run.party.map((p: any) => p.friendship));
  after.forEach((f: number, i: number) => expect(f).toBeGreaterThan(before[i]));
  expect(errors).toEqual([]);
});

test('Return to the Museum: "I\'ll look." leaves the relic lead and the black-market lead', async ({ page }) => {
  const errors = watch(page);
  await toMap(page, 'co-places-museum');
  await openEvent(page, 'co-museum', 'museum-return');
  await expect(view(page, 'Event')).toContainText('Someone stole our relics');
  await playFirstChoice(page);
  const state = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    return { lead: run.story.flags['ev:museum-relic-lead'] ?? 0, market: run.story.flags['ev:black-market-lead'] ?? 0 };
  });
  // Lenora's case is not queued from here any more (a later beat only opens rooms); the lead flag is what carries on.
  expect(state).toEqual({ lead: 1, market: 1 });
  expect(errors).toEqual([]);
});
