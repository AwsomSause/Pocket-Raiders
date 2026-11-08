import { expect, test, type Page } from '@playwright/test';
import { confirmToMenu } from './battleInput';

// Pokémon Memories slice 4: a boss with an animated sprite (Brock) plays its
// pose during the battle intro, and a trainer with a Gen 5 back sprite (Hilda)
// throws out the first Pokémon. No page errors.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

/** True while a sprite drawn from `key` is on the battle screen. */
const showsTexture = (page: Page, key: string) =>
  page.evaluate((k) => (window as any).__pkr.game.scene.getScene('Battle').children.list.some((o: any) => o.texture?.key === k), key);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('animated boss sprite in the intro and the player throwing pose', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?seed=memories-trainers&debug=1');
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 20_000 }).toBe(false);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  await confirmToMenu(page);
  // Make it Gym Leader Brock's battle, played as Hilda, and start the intro again.
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    pkr.session.run.archetypeId = 'hilda';
    pkr.session.run.battle.trainer = { classId: 'gym-leader', name: 'Brock', leaderId: 'brock' };
    pkr.game.scene.getScene('Battle').scene.restart();
  });
  await expect.poll(() => showsTexture(page, 'boss.anim.brock'), { timeout: 30_000, intervals: [100] }).toBe(true);
  // The pose plays: the frame moves on from the first one.
  await expect
    .poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').children.list.find((o: any) => o.texture?.key === 'boss.anim.brock')?.frame?.name ?? '0001.png'), { timeout: 10_000, intervals: [100] })
    .not.toBe('0001.png');
  await page.screenshot({ path: 'test-results/memories-boss-anim.png' });
  // Move the intro along until Hilda's back sprite throws.
  await expect
    .poll(
      async () => {
        if (await showsTexture(page, 'boss.back.hilda')) return true;
        await page.keyboard.press('Enter');
        return false;
      },
      { timeout: 60_000, intervals: [250] },
    )
    .toBe(true);
  await page.screenshot({ path: 'test-results/memories-throw.png' });
  expect(errors).toEqual([]);
});
