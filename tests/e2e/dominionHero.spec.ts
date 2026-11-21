import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D11 (the Hero): the Hero's file (mockup s9) on H, an encounter card answered with a number key, the
// Hero stepping into a job (m11) before any battle, Run, and a Legendary out over the region fought from the file.

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

/** Changes the saved block, then opens the Dominion screen again (the title's Continue). */
async function edit(page: Page, f: string) {
  await page.evaluate((src) => {
    const p = (window as any).__pkr;
    const b = p.session.run.expansion.dominion;
    new Function('b', src)(b);
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  }, f);
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
  await pressUntil(page, 'Enter', () => view(page, 'Dominion').getByTestId('dom-phase').isVisible());
  await expect(view(page, 'Dominion').getByTestId('dom-phase')).toHaveText('DAY');
  await page.waitForTimeout(250);
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);

/** Waits for `n` drawn frames, so the game's input step has read every key pressed so far. */
const frames = (page: Page, n: number) =>
  page.evaluate((k) => new Promise<void>((done) => { const f = (i: number) => (i ? requestAnimationFrame(() => f(i - 1)) : done()); f(k); }), n);

/**
 * A key press can be lost in a busy headless frame (the scene-change gotcha), so press, wait for the new state, and press
 * again only while it hasn't come (same as dominionPersonality / dominionDesk). Never presses once the state is reached,
 * so toggles like H can't flip back.
 */
async function pressUntil(page: Page, key: string, reached: () => Promise<boolean>) {
  await expect(async () => {
    if (!(await reached())) await page.keyboard.press(key);
    await expect.poll(reached, { timeout: 1500 }).toBe(true);
  }).toPass({ timeout: 15_000 });
}

test('the Hero: the file on H, a card, the Hero steps into a job, Run; a Legendary fought from the file', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  await dayOne(page);
  // Red is the Boss, so the rival plays the Hero (Q5). A card waits: the Hero spotted in town.
  await edit(page, "b.hero.meet = { id: 'O166', day: b.day, district: 'pallet' };");
  const s = view(page, 'Dominion');
  await expect(s.getByTestId('dom-phase')).toHaveText('DAY');
  await expect(s.getByTestId('dom-hero-chip')).toContainText('IGNORES');
  const fileOpen = () => s.getByTestId('dom-hero').isVisible();
  const notice = () => s.getByTestId('dom-notice').isVisible();
  await pressUntil(page, 'KeyH', fileOpen);
  await expect(s.getByTestId('dom-hero')).toBeVisible();
  await expect(s.getByTestId('dom-hero-name')).toHaveText('BLUE');
  await expect(s.getByTestId('dom-legend-moltres')).toContainText('Asleep');
  await expect(s.getByTestId('dom-meet')).toContainText('THE HERO IS SPOTTED IN TOWN');
  await shot('s9-hero-file-card');
  // 2 = Watch: the route is known for two days.
  await pressUntil(page, 'Digit2', notice);
  await expect(s.getByTestId('dom-notice')).toContainText('next two days');
  const b1 = await block(page);
  expect(b1.hero.intel).toBe(b1.day + 2);
  expect(b1.hero.meet).toBeNull();
  await pressUntil(page, 'Enter', async () => !(await notice()));
  await expect(s.getByTestId('dom-notice')).toBeHidden();
  await expect(s.getByTestId('dom-hero')).toBeVisible();
  await pressUntil(page, 'KeyH', async () => !(await fileOpen()));
  await expect(s.getByTestId('dom-hero')).toBeHidden();
  await expect(s.getByTestId('dom-phase')).toHaveText('DAY');

  // The Hero foils one job a week: Lay Low at Pewter, and Blue steps in (m11) before anything is fought.
  await edit(page, 'Object.assign(b.hero, { threat: 30, stage: 1, foilWeek: 1, foilDay: b.day, foiled: false });');
  await pressUntil(page, 'Digit2', () => s.getByTestId('dom-dz-pewter').isVisible());
  await s.getByTestId('dom-dz-pewter').click();
  await s.getByTestId('dom-act-lay-low').click();
  await s.getByTestId('dom-cta').click();
  await s.getByTestId('dom-doit').click();
  await expect(s.getByTestId('dom-interrupt')).toContainText('BLUE');
  await expect(s.getByTestId('dom-interrupt-2')).toContainText('no Smoke Ball');
  expect((await block(page)).field.fight).toMatchObject({ why: 'hero', begun: false });
  await shot('m11-hero-interrupt');
  // Esc doesn't leave the run here; 2 = Run: the job is lost, Heat goes up.
  await page.keyboard.press('Escape');
  // Let the game read Esc before 2 is pressed: in a busy headless frame the two can arrive in the wrong order, and a
  // late Esc on the map would clear the Run notice. Then check the interrupt is still up after Esc was read.
  await frames(page, 3);
  await expect(s.getByTestId('dom-interrupt')).toBeVisible();
  await pressUntil(page, 'Digit2', async () => (await block(page)).field.fight === null);
  await expect(s.getByTestId('dom-map')).toBeVisible();
  await expect(s.getByTestId('dom-notice')).toContainText('Heat');
  expect((await block(page)).field.fight).toBeNull();

  // A Legendary out over the region: the file's button fights it (a wild battle that can't be caught).
  await edit(page, "Object.assign(b.hero.legends.moltres, { seen: true, next: b.day + 2 });");
  await pressUntil(page, 'KeyH', fileOpen);
  await expect(s.getByTestId('dom-legend-fight-moltres')).toHaveText('FIGHT IT');
  await expect(s.getByTestId('dom-hero-cta')).toContainText('Fight Moltres');
  await shot('s9-hero-file-legend');
  await pressUntil(page, 'KeyF', async () => (await block(page)).field.fight?.begun === true);
  await waitForScene(page, 'Battle');
  const battle = await page.evaluate(() => (window as any).__pkr.session.run.battle);
  expect(battle.kind).toBe('wild');
  expect(battle.enemyTeam[0].speciesId).toBe('moltres');
  expect((await block(page)).field.fight).toMatchObject({ why: 'legend', begun: true });
  expect(errors).toEqual([]);
});
