import { expect, test, type Page } from '@playwright/test';
import { confirmToMenu } from './battleInput';

// Overhaul slice P2: the player trainer stands on the battle field and plays each moment; every moment can be skipped
// and playing one never changes the battle state.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}

async function startBattle(page: Page, seed: string): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/?seed=${seed}&debug=1`);
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  await confirmToMenu(page);
  return errors;
}

test('player trainer plays every moment, each is skippable, and the battle state is untouched', async ({ page }) => {
  const errors = await startBattle(page, 'e2e-trainer');
  const has = () => page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle').trainerActor));
  await expect.poll(has).toBe(true);
  // P8: the generic pose wears this trainer's colour.
  expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').trainerActor.sprite.isTinted)).toBe(true);
  await page.screenshot({ path: 'test-results/player-trainer.png' });

  const state = () => page.evaluate(() => JSON.stringify((window as any).__pkr.game.scene.getScene('Battle').run.battle));
  const before = await state();
  for (const moment of ['sendOut', 'recall', 'win', 'hit', 'defeat']) {
    const r = await page.evaluate(async (m) => {
      const a = (window as any).__pkr.game.scene.getScene('Battle').trainerActor;
      const t0 = performance.now();
      const frames = new Set<string>();
      const p = a.play(m, { target: { x: 312, y: 400 } });
      const poll = setInterval(() => frames.add(String(a.sprite.frame.name) + a.sprite.texture.key), 20);
      await new Promise((res) => setTimeout(res, 250));
      const midPlaying = a.playing;
      a.skip();
      await p;
      clearInterval(poll);
      return { midPlaying, ms: performance.now() - t0, frames: frames.size, playingAfter: a.playing };
    }, moment);
    expect(r.midPlaying, moment).toBe(true);
    expect(r.playingAfter, moment).toBe(false);
    expect(r.ms, moment).toBeLessThan(1500);
    expect(r.frames, moment).toBeGreaterThan(1);
  }
  expect(await state()).toBe(before);
  expect(errors).toEqual([]);
});

test('a Pokémon caught in a Great Ball is thrown from a Great Ball (and the ball opens with the pack effect)', async ({ page }) => {
  const errors = await startBattle(page, 'e2e-greatball');
  await expect.poll(() => page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle').trainerActor))).toBe(true);
  const seen = await page.evaluate(async () => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    const mon = structuredClone(b.shown.player);
    mon.caughtBall = 'great-ball';
    const keys = new Set<string>();
    const poll = setInterval(() => b.children.list.forEach((c: any) => c.texture?.key && keys.add(c.texture.key)), 15);
    await b.sendOutMoment(mon);
    await new Promise((r) => setTimeout(r, 100));
    clearInterval(poll);
    return [...keys];
  });
  expect(seen).toContain('ball.gb');
  expect(errors).toEqual([]);
});
