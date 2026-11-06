import { expect, test, type Page } from '@playwright/test';
import { confirmToMenu } from './battleInput';

// Google Drive trainers (plans/drive-assets-plan.md): their art loads on demand. A PokeRogue class
// (animated atlas), an animated intro strip and a new named boss each show up in battle. No page errors.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

/** True while a sprite drawn from `key` is on the battle screen (also inside containers). */
const showsTexture = (page: Page, key: string) =>
  page.evaluate((k) => {
    const walk = (list: any[]): boolean => list.some((o: any) => o.texture?.key === k || (o.list && walk(o.list)));
    return walk((window as any).__pkr.game.scene.getScene('Battle').children.list);
  }, key);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('Drive trainers load their art in battle', async ({ page }) => {
  test.setTimeout(150_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?seed=drive-trainers&debug=1');
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  await confirmToMenu(page);
  const cases = [
    { trainer: { classId: 'ace-trainer-f', name: 'Wren', leaderId: null }, key: 'trainer.pr/ace_trainer_f', shot: 'drive-class-pokerogue' },
    { trainer: { classId: 'beauty', name: 'Ada', leaderId: null }, key: 'trainer.drive/beauty', shot: 'drive-class-strip' },
    { trainer: { classId: 'gym-leader', name: 'Professor Oak', leaderId: 'professor-oak' }, key: 'boss.drive/professor-oak', shot: 'drive-boss' },
  ];
  for (const c of cases) {
    await page.evaluate((t) => {
      const pkr = (window as any).__pkr;
      pkr.session.run.battle.trainer = t;
      pkr.game.scene.getScene('Battle').scene.restart();
    }, c.trainer);
    await expect.poll(() => showsTexture(page, c.key), { timeout: 20_000, intervals: [150] }).toBe(true);
    await page.screenshot({ path: `test-results/${c.shot}.png` });
  }
  expect(errors).toEqual([]);
});
