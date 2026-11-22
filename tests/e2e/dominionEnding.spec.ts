import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D17 (the ending): a run whose Goal ends it (Everlasting) opens the ending page by itself: the Empire
// Map, the Ledger graph across every day, the crew's journeys and how far it got. Esc goes back; K then L opens it again;
// Enter closes the books: the run ends, the run-end page pays it, and the Charters unlock.

async function dayOne(page: Page) {
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'dominion' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Dominion');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.dominionStart({ types: ['poison', 'dark'], member: 'grunt', look: 0 });
    for (const t of ['open', 'toNight', 'rest', 'toDay']) p.session.dominionStep({ t });
  });
}

async function pressUntil(page: Page, key: string, reached: () => Promise<boolean>) {
  await expect(async () => {
    if (!(await reached())) await page.keyboard.press(key);
    await expect.poll(reached, { timeout: 1500 }).toBe(true);
  }).toPass({ timeout: 15_000 });
}

/** Kanto Taken by the Goal path with Everlasting (a Goal that ends the run), a crew of three and a few days of books. */
const DONE = `
  b.takeover = { goal: { track: 100, cost: 2, stage: 4, tp: null, done: true, lost: 0 }, last: {}, plan: 0, league: { elite: [], champion: false, studied: [], swayed: [], sway: 0 }, hold: {}, scouts: {}, chain: null, won: { path: 'goal', day: b.day }, paths: ['goal'], taken: { path: 'goal', day: b.day }, bcast: { queue: [], seen: [] }, cracked: false };
  b.team = { name: 'Team Kettle', primary: 'crimson', secondary: 'gold', initial: 'K', logo: 'shield', motto: 'Up.', goal: 'everlasting', day: 1 };
  b.teamName = 'Team Kettle';
  const m0 = b.members[0];
  for (const [id, name] of [['rosa', 'Rosa'], ['dale', 'Dale'], ['ivy', 'Ivy'], ['ned', 'Ned']]) b.members.push({ ...structuredClone(m0), id, name, rank: 'executive' });
  b.annals = { from: 1, step: 1, funds: [800, 650, 1200, 2400, 1900, 3800, 5200] };
`;

test('The ending: the books open by themselves, then close the run and pay it', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  await dayOne(page);
  const runId = await page.evaluate((src) => {
    const p = (window as any).__pkr;
    new Function('b', 'run', src)(p.session.run.expansion.dominion, p.session.run);
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
    return p.session.run.runId as string;
  }, DONE);
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
  const s = view(page, 'Dominion');
  // The title's Continue leads to the HQ, and the ending opens over it.
  await pressUntil(page, 'Enter', () => s.getByTestId('dom-ending').isVisible());
  await expect(s.getByTestId('dom-ending')).toContainText('FOREVER');
  await expect(s.getByTestId('dom-end-pay')).toContainText('Regions taken');
  for (const size of [{ width: 1280, height: 720 }, { width: 800, height: 600 }]) {
    await page.setViewportSize(size);
    await shot(`ending-${size.width}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  // Redesign R8: Enter rolls the Credits (mockup `credits`): the whole crew of five on one page.
  await pressUntil(page, 'Enter', () => s.getByTestId('dom-end-crew').isVisible());
  await expect(s.getByTestId('dom-end-crew')).toContainText('Rosa');
  await expect(s.getByTestId('dom-end-crew')).toContainText('Ivy');

  // Esc goes back (from the Credits to the city, then off the page); K opens the Takeover page, and L there opens the books again.
  await pressUntil(page, 'Escape', async () => !(await s.getByTestId('dom-ending').isVisible()) && !(await s.getByTestId('dom-end-crew').isVisible()));
  await pressUntil(page, 'KeyK', async () => (await s.getByTestId('dom-ending').isVisible()) || (await s.getByTestId('dom-takeover').isVisible()));
  await pressUntil(page, 'KeyL', () => s.getByTestId('dom-ending').isVisible());

  // Enter rolls the Credits, and Enter there closes the books: the run-end page, the profile pays and counts the run for the Charters.
  await pressUntil(page, 'Enter', () => s.getByTestId('dom-end-crew').isVisible());
  await page.keyboard.press('Enter');
  await waitForScene(page, 'GameOver');
  const after = await page.evaluate((id) => {
    const p = (window as any).__pkr.session.profile;
    return { done: p.dominionDone.includes(id), hist: p.runHistory[0]?.runId === id, cleared: p.runHistory[0]?.regionsCleared, credits: p.lastPayout?.total ?? 0 };
  }, runId);
  expect(after).toEqual({ done: true, hist: true, cleared: 1, credits: expect.any(Number) });
  expect(after.credits).toBeGreaterThan(0);
  await shot('run-end');
  expect(errors).toEqual([]);
});
