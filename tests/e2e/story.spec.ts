import { expect, test, type Page } from '@playwright/test';

// Story ideas: the lead Pokémon's comment on the map, and the companion event that sets the companion flag (S112, S129).

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

async function toMap(page: Page) {
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
}

test('the map shows the lead Pokémon comment and the companion event applies once', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=story-e2e');
  await waitForScene(page, 'MainMenu');
  await toMap(page);

  const chatter = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').children.list.find((o: any) => o.name === 'lead-chatter')?.text ?? null);
  expect(chatter).toMatch(/\S+ .+\./);
  for (const [w, h] of [[960, 540], [480, 800]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `test-results/story-map-${w}x${h}.png` });
  }
  await page.setViewportSize({ width: 960, height: 540 });

  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push({ id: 'e2e-companion', kind: 'event', used: false, eventId: 'companion-recruit' });
    run.stage.current = node.id;
    run.stage.visited = [node.id];
    pkr.game.scene.getScene('Map').scene.start('Event', { sideId: 'e2e-companion' });
  });
  await waitForScene(page, 'Event');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'test-results/story-companion-event.png' });
  await page.keyboard.press('Enter'); // Welcome them aboard
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.story.flags['ev:companion'])).toBe(1);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Map');
  expect(errors).toEqual([]);
});
