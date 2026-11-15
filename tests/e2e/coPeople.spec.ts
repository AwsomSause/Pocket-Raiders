import { expect, test, type Page } from '@playwright/test';

// Catalog Overhaul, people (mentors, past Champions and Leaders, the Road Roster), played in the New UI:
// a Road Roster crossover pays its reward and remembers it after a reload, and the Trivia Mentor's first answer opens her
// next question as a room beside the node. No console errors.

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

test('Road Roster crossover: Elliot and Kai fish together, the Good Rod is paid once and kept after a reload', async ({ page }) => {
  const errors = watch(page);
  await toMap(page, 'co-people-e2e');
  await openEvent(page, 'co-cross', 'roster-crossover-elliot-kai', ['roster-elliot-done', 'roster-kai-done']);
  const ev = view(page, 'Event');
  await expect(ev).toContainText('Two Lines in the Water');
  await playFirstChoice(page);
  const after = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    return { rod: (run.inventory['good-rod'] ?? 0) + (run.passives?.['good-rod'] ?? 0), flag: run.story.flags['ev:roster-crossover-elliot-kai'] ?? 0 };
  });
  expect(after).toEqual({ rod: 1, flag: 1 });

  await page.reload();
  await waitForScene(page, 'MainMenu');
  const saved = await page.evaluate(() => {
    const raw = Object.entries(localStorage).find(([k]) => k.endsWith('run'));
    const run = raw ? JSON.parse(raw[1] as string).data : null;
    return run ? { rod: (run.inventory?.['good-rod'] ?? 0) + (run.passives?.['good-rod'] ?? 0), flag: run.story?.flags?.['ev:roster-crossover-elliot-kai'] ?? 0 } : null;
  });
  expect(saved).toEqual({ rod: 1, flag: 1 });
  expect(errors).toEqual([]);
});

test('The Trivia Mentor: "Ask." opens her first question beside the node, and it can be played', async ({ page }) => {
  const errors = watch(page);
  await toMap(page, 'co-people-quiz');
  await openEvent(page, 'co-quiz', 'mentor-quiz');
  await expect(view(page, 'Event')).toContainText('silver-haired woman');
  await playFirstChoice(page);
  const room = await page.evaluate(() =>
    (window as any).__pkr.session.run.stage.map.nodes.flatMap((n: any) => n.sides).find((s: any) => s.eventId === 'mentor-quiz-q1' && !s.used)?.id ?? null);
  expect(room).not.toBeNull();
  await page.evaluate((id) => void (window as any).__pkr.game.scene.getScene('Map').scene.start('Event', { sideId: id }), room);
  await waitForScene(page, 'Event');
  await expect(view(page, 'Event')).toContainText('with you on the first day');
  expect(errors).toEqual([]);
});
