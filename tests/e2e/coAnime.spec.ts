import { expect, test, type Page } from '@playwright/test';

// Catalog Overhaul, anime and Pokémon-anime questlines (row 14), played in the New UI:
// AN11 The Camp at the Lake pays its curry once and keeps it after a reload; AN9's "Join." queues the next beat
// ("three islands", a few nodes on) with the questline laterEvent counter. No console errors.

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

test('AN11 The Camp at the Lake: "Stay." pays the camp curry and remembers the night after a reload', async ({ page }) => {
  const errors = watch(page);
  await toMap(page, 'co-anime-e2e');
  await openEvent(page, 'co-camp', 'an11-camp-at-the-lake');
  const ev = view(page, 'Event');
  await expect(ev).toContainText('The Camp at the Lake');
  await playFirstChoice(page);
  const after = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    return { curry: run.inventory['camp-curry'] ?? 0, flag: run.story.flags['ev:an11-camp-stayed'] ?? 0 };
  });
  expect(after).toEqual({ curry: 1, flag: 1 });

  await page.reload();
  await waitForScene(page, 'MainMenu');
  const saved = await page.evaluate(() => {
    const raw = Object.entries(localStorage).find(([k]) => k.endsWith('run'));
    const run = raw ? JSON.parse(raw[1] as string).data : null;
    return run ? { curry: run.inventory?.['camp-curry'] ?? 0, flag: run.story?.flags?.['ev:an11-camp-stayed'] ?? 0 } : null;
  });
  expect(saved).toEqual({ curry: 1, flag: 1 });
  expect(errors).toEqual([]);
});

test('AN9 The Crew of the Rusted Anchor: "Join." signs you on and queues the three islands five nodes on', async ({ page }) => {
  const errors = watch(page);
  await toMap(page, 'co-anime-e2e-2');
  await openEvent(page, 'co-crew', 'an09-rusted-anchor');
  await expect(view(page, 'Event')).toContainText('The Crew of the Rusted Anchor');
  await playFirstChoice(page);
  const after = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    return { joined: run.story.flags['ev:an09-crew-joined'] ?? 0, later: run.itemCounters['later-event:an09-three-islands'] ?? 0 };
  });
  expect(after).toEqual({ joined: 1, later: 5 });
  expect(errors).toEqual([]);
});
