import { expect, test, type Page } from '@playwright/test';

// Game events: the Event Hall shows this week's event (fixed clock on a week when Egg Expedition is on),
// its objectives and reward, and a new run's briefing shows the event's rules.
import { readFileSync } from 'node:fs';

// The clock is picked from the data, so adding an event to the weekly rotation doesn't break this test:
// the Friday of the first week from 2027-04-12 on when Egg Expedition comes round (same maths as weeklyEventOn).
const DAY = 86_400_000;
const events = JSON.parse(readFileSync('src/data/gameEvents.json', 'utf8')).events as { id: string; schedule: { kind: string } }[];
const rotation = events.filter((e) => e.schedule.kind === 'weeklyRotation').map((e) => e.id);
const startWeek = Math.floor((Date.UTC(2027, 3, 12) - Date.UTC(1970, 0, 5)) / (7 * DAY));
const week = startWeek + ((rotation.indexOf('egg-expedition') - (startWeek % rotation.length) + rotation.length) % rotation.length);
const CLOCK = new Date(Date.UTC(1970, 0, 5) + week * 7 * DAY + 4 * DAY + 12 * 3_600_000);
// Its ISO week label (the Thursday decides the year), as in src/core/gameEvents.ts isoWeek.
const thursday = new Date(CLOCK.getTime() - DAY);
const isoYear = thursday.getUTCFullYear();
const WEEK_LABEL = `${isoYear}-W${String(Math.ceil(((Date.UTC(isoYear, thursday.getUTCMonth(), thursday.getUTCDate()) - Date.UTC(isoYear, 0, 1)) / DAY + 1) / 7)).padStart(2, '0')}`;

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

const texts = (page: Page, key: string) =>
  page.evaluate((key) => {
    const out: string[] = [];
    const walk = (o: any) => {
      if (typeof o.text === 'string') out.push(o.text);
      for (const c of o.list ?? []) walk(c);
    };
    for (const o of (window as any).__pkr.game.scene.getScene(key).children.list) walk(o);
    return out.join('\n');
  }, key);

test('the Event Hall shows the weekly event and runs play by its rules', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.clock.setFixedTime(CLOCK);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=events-e2e');
  await waitForScene(page, 'MainMenu');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Hub');

  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Hub').openEventHall());
  await page.waitForTimeout(600);
  const hall = await texts(page, 'Hub');
  expect(hall).toContain('★ Egg Expedition');
  expect(hall).toContain('ends in');
  expect(hall).toContain('Finish 25 encounters');
  expect(hall).toContain('Coming up');
  await page.screenshot({ path: 'test-results/event-hall.png' });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  await page.evaluate(() => {
    (window as any).__pkr.game.scene.getScene('Hub').scene.start('TrainerSelect');
  });
  for (const at of ['TrainerSelect', 'RunPrep', 'StarterSelect']) {
    await waitForScene(page, at);
    await page.keyboard.press('Enter');
  }
  await waitForScene(page, 'Briefing');
  expect(await texts(page, 'Briefing')).toContain('Your Pokémon gain 15% more experience');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.gameEvents)).toContain(`egg-expedition@${WEEK_LABEL}`);
  expect(errors).toEqual([]);
});
