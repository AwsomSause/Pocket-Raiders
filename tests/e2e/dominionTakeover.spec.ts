import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D14 (Takeover): the Takeover page on K (mockup s9 with the four paths and the Hero's file), a Turning
// Point, the Holdings list (P) and buying a place, the Moment's battle, and the hijacked broadcast (m13).

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

/** Changes the saved block and opens the Dominion screen again (stops on the title). */
async function reopen(page: Page, f: string) {
  await page.evaluate((src) => {
    const p = (window as any).__pkr;
    const b = p.session.run.expansion.dominion;
    new Function('b', src)(b);
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  }, f);
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
}
/** Same, then Continue to the HQ. */
async function edit(page: Page, f: string) {
  await reopen(page, f);
  await pressUntil(page, 'Enter', () => view(page, 'Dominion').getByTestId('dom-phase').isVisible());
  await expect(view(page, 'Dominion').getByTestId('dom-phase')).toHaveText('DAY');
  await page.waitForTimeout(250);
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);

async function pressUntil(page: Page, key: string, reached: () => Promise<boolean>) {
  await expect(async () => {
    if (!(await reached())) await page.keyboard.press(key);
    await expect.poll(reached, { timeout: 1500 }).toBe(true);
  }).toPass({ timeout: 15_000 });
}

const TEAM = "b.teamName = 'Team Venom'; b.team = { name: 'Team Venom', primary: 'red', secondary: 'black', initial: 'V', logo: 'fang', motto: '', goal: 'total-takeover', day: 1 };";

test('Takeover: the four paths on K, a Turning Point, Holdings, the Moment, and the hijacked broadcast', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  await dayOne(page);
  await edit(page, `${TEAM} b.funds = 60000; b.takeover = { goal: { track: 22, cost: 9, stage: 1, tp: 1, done: false, lost: 0 }, last: {}, plan: 0, league: { elite: [], champion: false, studied: [], swayed: [], sway: 0 }, hold: {}, scouts: {}, chain: null, won: null, paths: [], taken: null, bcast: { queue: [], seen: [] }, cracked: false };`);
  const s = view(page, 'Dominion');
  const tkOpen = () => s.getByTestId('dom-takeover').isVisible();
  await pressUntil(page, 'KeyK', tkOpen);
  for (const id of ['wipe', 'shadow', 'monarch', 'goal']) await expect(s.getByTestId(`dom-path-${id}`)).toBeVisible();
  await expect(s.getByTestId('dom-path-goal')).toContainText('YOUR GOAL');
  await expect(s.getByTestId('dom-path-goal')).toContainText('Stage 2');
  await expect(s.getByTestId('dom-takeover-rib')).toContainText('The first path to finish takes Kanto');
  await expect(s.getByTestId('dom-takeover-alerts')).toContainText('EXPOSURE');
  await expect(s.getByTestId('dom-hero-file')).toBeVisible();
  // The Turning Point waits on top until it is read.
  await expect(s.getByTestId('dom-turning-point')).toContainText('TURNING POINT');
  await shot('s9-takeover-turning-point');
  await pressUntil(page, 'Enter', async () => !(await s.getByTestId('dom-turning-point').isVisible()));
  expect((await block(page)).takeover.goal.tp).toBeNull();
  await shot('s9-takeover');

  // P: the Holdings. Red's House is for sale; Enter buys it (one Boss action).
  await pressUntil(page, 'KeyP', () => s.getByTestId('dom-holdings').isVisible());
  await s.getByTestId('dom-holding-reds-house-pallet').click();
  await expect(s.getByTestId('dom-notice')).toContainText("Red's House");
  const b1 = await block(page);
  expect(b1.takeover.hold['kanto:reds-house-pallet']).toMatchObject({ way: 'home', until: null });
  expect(b1.funds).toBeLessThan(60000);
  await pressUntil(page, 'Enter', async () => !(await s.getByTestId('dom-notice').isVisible()));
  await expect(s.getByTestId('dom-holding-reds-house-pallet')).toContainText('YOURS');
  await shot('takeover-holdings');
  await pressUntil(page, 'Escape', tkOpen);
  await pressUntil(page, 'KeyK', async () => await s.getByTestId('dom-phase').isVisible());

  // A town taken: the next time the Boss looks in, every TV plays the broadcast once; Enter skips it.
  await reopen(page, "b.takeover.bcast.queue = ['pewter'];");
  await pressUntil(page, 'Enter', () => s.getByTestId('dom-broadcast').isVisible());
  await expect(s.getByTestId('dom-broadcast-head')).toContainText('Team Venom now controls Pewter');
  await expect(s.getByTestId('dom-broadcast-say')).toContainText('Pewter');
  await shot('m13-broadcast');
  await pressUntil(page, 'Enter', async () => !(await s.getByTestId('dom-broadcast').isVisible()));
  await expect(s.getByTestId('dom-phase')).toHaveText('DAY');
  const b2 = await block(page);
  expect(b2.takeover.bcast).toMatchObject({ queue: [], seen: ['pewter'] });
  await pressUntil(page, 'KeyK', tkOpen);
  for (const size of [{ width: 1280, height: 720 }, { width: 800, height: 600 }]) {
    await page.setViewportSize(size);
    await shot(`s9-takeover-${size.width}`);
  }
  await pressUntil(page, 'KeyK', async () => !(await tkOpen()));
  await expect(s.getByTestId('dom-phase')).toHaveText('DAY');
  await page.setViewportSize({ width: 1280, height: 720 });


  // The Goal Track at 100: the CTA faces the Opposition (the Champion), a trainer battle.
  await edit(page, 'b.takeover.goal.track = 100; b.takeover.goal.cost = 0;');
  await pressUntil(page, 'KeyK', tkOpen);
  await expect(s.getByTestId('dom-takeover-cta')).toContainText('Face');
  await pressUntil(page, 'KeyM', async () => (await block(page)).field.fight?.begun === true);
  await waitForScene(page, 'Battle');
  const battle = await page.evaluate(() => (window as any).__pkr.session.run.battle);
  expect(battle.kind).toBe('trainer');
  expect((await block(page)).field.fight).toMatchObject({ why: 'takeover', begun: true });

  expect(errors).toEqual([]);
});
