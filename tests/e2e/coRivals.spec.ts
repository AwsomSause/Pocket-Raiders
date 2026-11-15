import { expect, test, type Page } from '@playwright/test';

// Catalog Overhaul rivals (row 12): three rebuilt rival scenes open in the New UI event screen, with every {token} filled
// and the locked stall choice showing why. Kieran (R16), the inn (R21) and the race (R23).

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

async function openEvent(page: Page, eventId: string, sideId: string) {
  await page.evaluate(
    ([eventId, sideId]) => {
      const pkr = (window as any).__pkr;
      const run = pkr.session.run;
      const node = run.stage.map.nodes.find((n: any) => n.column === 1);
      node.sides.push({ id: sideId, kind: 'event', used: false, eventId });
      run.stage.current = node.id;
      run.stage.visited = [node.id];
      pkr.game.scene.getScene(pkr.activeScene()).scene.start('Event', { sideId });
    },
    [eventId, sideId],
  );
  await waitForScene(page, 'Event');
  await page.waitForTimeout(1200);
}

/** Reads every page of the scene's text (Enter turns a page; the choices show after the last), then the choices. */
const eventText = async (page: Page) => {
  const view = page.locator('#rx .stage[data-scene="Event"]');
  await expect(view).toBeVisible();
  let all = '';
  for (let i = 0; i < 8; i++) {
    all += `\n${await view.innerText()}`;
    if ((await view.locator('.rx-more').count()) === 0) break;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(350);
  }
  return all;
};

test('rival questline scenes play in the New UI with their tokens filled', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=co-rivals-e2e&ui=new');
  await waitForScene(page, 'MainMenu');
  await toMap(page);

  await openEvent(page, 'rq-kieran-finale', 'e2e-kieran');
  let text = await eventText(page);
  expect(text).toContain('Kieran');
  expect(text).toContain('Stall until his Pokémon want to stop.');
  expect(text).not.toMatch(/\{[a-z]/);
  await page.screenshot({ path: 'test-results/co-rivals-kieran.png' });

  await openEvent(page, 'rq-r21-inn', 'e2e-inn');
  text = await eventText(page);
  expect(text).toContain('The Long Night at the Inn');
  expect(text).not.toMatch(/\{[a-z]/);

  await openEvent(page, 'rival-race', 'e2e-race');
  text = await eventText(page);
  expect(text).toContain('First one there picks!');
  expect(text).toContain('Run!');
  expect(text).not.toMatch(/\{[a-z]/);
  for (const [w, h] of [[800, 450], [480, 800]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `test-results/co-rivals-race-${w}x${h}.png` });
  }
  expect(errors).toEqual([]);
});
