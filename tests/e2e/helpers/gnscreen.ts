import { expect, type Page } from '@playwright/test';
import { view, waitForScene, scene } from './newUi';

// Shared steps for the Greenneedle screen specs (gnscreen-*.spec.ts): open a story room that waits beside the node and pick a choice.

/** Puts `eventId` beside the node the run stands on (first column) and returns its stop id. */
export async function putRoom(page: Page, eventId: string): Promise<string> {
  return page.evaluate((eventId) => {
    const run = (window as any).__pkr.session.run;
    const node = run.stage.map.nodes.find((n: any) => n.id === run.stage.current) ?? run.stage.map.nodes.find((n: any) => n.column === 1);
    run.stage.current = node.id;
    if (!run.stage.visited.includes(node.id)) run.stage.visited.push(node.id);
    const id = `gs-${node.sides.length + 1}-${eventId}`;
    node.sides.push({ id, kind: 'event', used: false, eventId });
    return id;
  }, eventId);
}

/** The stop the story opened last for `eventId` (a room), or null. */
export const roomOf = (page: Page, eventId: string) =>
  page.evaluate((eventId) => {
    const run = (window as any).__pkr.session.run;
    const node = run.stage.map.nodes.find((n: any) => n.id === run.stage.current);
    return ([...node.sides].reverse().find((s: any) => s.kind === 'event' && !s.used && s.eventId === eventId)?.id as string | undefined) ?? null;
  }, eventId);

/** Opens the stop, clicks choice `pick`, and reads on until the Event screen is left. */
export async function playRoom(page: Page, sideId: string, pick: number): Promise<void> {
  await page.evaluate((sideId) => {
    const g = (window as any).__pkr.game;
    const from = g.scene.getScenes(true)[0];
    from.scene.start('Event', { sideId });
  }, sideId);
  await waitForScene(page, 'Event');
  const ev = view(page, 'Event');
  await page.waitForTimeout(400);
  // The intro may have pages: the choices come with the last one.
  for (let i = 0; i < 12 && (await ev.locator('[data-act="pick"]').count()) === 0; i += 1) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(350);
  }
  await ev.locator('[data-act="pick"]').nth(pick).click();
  const end = Date.now() + 40_000;
  while (Date.now() < end && (await scene(page)) === 'Event') {
    const next = ev.locator('[data-act="next"]');
    if (await next.count()) await next.first().click({ timeout: 2000 }).catch(() => undefined);
    await page.waitForTimeout(500);
  }
  expect(await scene(page)).not.toBe('Event');
}

/** Opens the game fresh, like `start` in helpers/newUi.ts, with room for a slow first boot on a busy machine. */
export async function boot(page: Page, query: string): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/?${query}`);
  await waitForScene(page, 'MainMenu', 120_000);
}
