import { expect, test, type Page } from '@playwright/test';

// Regression: losing a rival/story fight used to clear the battle with no "end", so the battle screen asked for a command on a
// battle that no longer existed (TypeError) and the game froze until a refresh. The loss must lead back to a live scene.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

test('losing a rival fight leaves the battle and the next scene takes input', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?debug=1');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    session.newRun('red', 'e2e-storyloss-1', undefined, undefined, { modeId: 'story-run', difficultyId: 'standard', modifierIds: [], deathBlock: false });
    session.chooseStarter(0);
    const first = session.run.stage.map.nodes.filter((n: any) => n.column === 1)[0];
    first.kind = 'trainer';
    session.chooseNode(first.id);
    const b = session.run.battle;
    b.rival = true;
    for (const m of session.run.party) m.hp = 1;
    for (const e of b.enemyTeam) e.level = 100;
    game.scene.getScenes(true)[0].scene.start('Battle');
  });
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('Battle');
  // Fight (Enter picks Fight, then the first move) and confirm text until the battle scene is gone.
  const end = Date.now() + 60_000;
  while (Date.now() < end && (await scene(page)) === 'Battle') {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(120);
  }
  const after = await scene(page);
  expect(after).not.toBe('Battle');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.battle)).toBeNull();
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});
