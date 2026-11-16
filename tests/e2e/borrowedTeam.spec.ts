import { expect, test, type Page } from '@playwright/test';

// gn.new.29 The Borrowed Team: the rival's team page (R) on the New UI event screen.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}

test('after borrowing, a rival scene offers their team with real moves, and R opens and closes it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?ui=new&seed=e2e-borrow&campaign=dev&debug=1');
  await waitForScene(page, 'MainMenu');
  for (const key of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, key);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    run.story.rivals.push({
      id: 'r1', classId: 'rival', name: 'Okafor', state: 'active', rivalPotential: 5, encounters: 2, setbacks: 0,
      memory: { lastBattle: { eventId: 'e', result: 'win', hpLeftShare: 0.5, turns: 4, team: ['growlithe', 'pidgeotto'], levels: [31, 29], moves: [['ember', 'bite', 'flamethrower', 'agility'], ['gust', 'quick-attack']] } },
    });
    run.story.flags['ev:borrow-knows'] = 1;
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push({ id: 'bt-side', kind: 'event', used: false, eventId: 'gn-new-29-after' });
    run.stage.current = node.id;
    run.stage.visited = [node.id];
    pkr.game.scene.getScene('Map').scene.start('Event', { sideId: 'bt-side' });
  });
  await waitForScene(page, 'Event');
  await page.waitForTimeout(1200);
  await page.keyboard.press('r');
  await page.waitForTimeout(300);
  await expect(page.getByTestId('team-card')).toHaveCount(2);
  await expect(page.getByTestId('team-card').first()).toContainText('Lv 31');
  await page.screenshot({ path: 'test-results/borrowed-team.png' });
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('team-card')).toHaveCount(0);
  expect(errors).toEqual([]);
});
