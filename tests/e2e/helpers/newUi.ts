import { expect, type Page } from '@playwright/test';
import { confirmToMenu } from '../battleInput';

// Shared steps for the New UI browser specs (newUi.spec.ts and the *NewUi.spec.ts files). The New UI is an HTML layer over the canvas, so these
// specs drive the game by clicking that layer and open the game with `?ui=new` (an automated browser gets Old otherwise).

export const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
export const view = (page: Page, key: string) => page.locator(`#rx .stage[data-scene="${key}"]`);

export async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

export function watch(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

export async function start(page: Page, query: string) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/?${query}`);
  await waitForScene(page, 'MainMenu');
}

/** Title to the stage map with the keyboard; each screen on the way that has a mock-up must show its New view. */
export async function toMap(page: Page) {
  await expect(view(page, 'MainMenu')).toBeVisible();
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
    if (next !== 'Hub') await expect(view(page, next)).toBeVisible();
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
}

/** Stands the run on a first-column node with this side stop beside it. */
export async function addSide(page: Page, side: Record<string, unknown>) {
  await page.evaluate((side) => {
    const run = (window as any).__pkr.session.run;
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push(side);
    run.stage.current = node.id;
    if (!run.stage.visited.includes(node.id)) run.stage.visited.push(node.id);
  }, side);
}

/**
 * Through the opening lines to the battle's first choice. The game keeps a key press for a moment, so an Enter sent
 * during the last opening line can land on the commands and open Fight; this steps back, so every run starts there.
 */
export async function toCommands(page: Page) {
  await confirmToMenu(page);
  await page.waitForTimeout(400);
  const tab = () => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').tabs.current as string | null);
  if ((await tab()) !== null) {
    await page.keyboard.press('Escape');
    await expect.poll(tab).toBeNull();
    await page.waitForTimeout(250);
  }
}

/** Starts a scene by name from whatever is on screen. */
export async function open(page: Page, key: string, data?: Record<string, unknown>) {
  await page.evaluate(([k, d]) => {
    const g = (window as any).__pkr.game;
    for (const s of g.scene.getScenes(true)) if (s.scene.key !== k) g.scene.stop(s.scene.key);
    g.scene.start(k, d ?? undefined);
  }, [key, data] as const);
  await waitForScene(page, key);
}
