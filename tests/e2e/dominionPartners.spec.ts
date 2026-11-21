import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D16: the Partnership page on J (Snagem and Cipher: the two deals, both at once, the Shadow Machine, the
// purge's fight), the Charters page on the setup's Boss page (locked until a Dominion run is finished), and the Turn
// offered on the Game Over screen of a main-game run that won.

async function newDominion(page: Page) {
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'dominion' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Dominion');
}

async function dayOne(page: Page) {
  await newDominion(page);
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.dominionStart({ types: ['poison', 'dark'], member: 'grunt', look: 0 });
    for (const t of ['open', 'toNight', 'rest', 'toDay']) p.session.dominionStep({ t });
  });
}

/** Changes the saved block, opens the Dominion screen again and continues to the HQ. */
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
  await page.waitForTimeout(250);
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);

async function pressUntil(page: Page, key: string, reached: () => Promise<boolean>) {
  await expect(async () => {
    if (!(await reached())) await page.keyboard.press(key);
    await expect.poll(reached, { timeout: 1500 }).toBe(true);
  }).toPass({ timeout: 15_000 });
}

test('Partners: J opens the Partnership page; both deals, the Shadow Machine, and the purge fight', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  await dayOne(page);
  const s = view(page, 'Dominion');
  const ptOpen = () => s.getByTestId('dom-partner-ways').isVisible();
  // Before Syndicate the page stays shut and says why.
  await edit(page, 'b.funds = 40000;');
  await page.keyboard.press('KeyJ');
  await expect(s.getByTestId('dom-notice')).toContainText('Syndicate');
  await pressUntil(page, 'Enter', async () => !(await s.getByTestId('dom-notice').isVisible()));

  await edit(page, "b.empire = b.empire || { peak: 0 }; b.empire.peak = 4; b.funds = 40000;");
  await pressUntil(page, 'KeyJ', ptOpen);
  await expect(s.getByTestId('dom-partner-state-snagem')).toHaveText('OFFERED');
  await expect(s.getByTestId('dom-partner-state-cipher')).toHaveText('OFFERED');
  await shot('partners-offered');
  await s.getByTestId('dom-partner-row-sign-snagem').click();
  await expect(s.getByTestId('dom-notice')).toContainText('Deal made with Team Snagem');
  await pressUntil(page, 'Enter', async () => !(await s.getByTestId('dom-notice').isVisible()));
  await expect(s.getByTestId('dom-partner-state-snagem')).toHaveText('IN BUSINESS');
  await expect(s.getByTestId('dom-partner-cut-snagem')).toHaveText('15%');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.inventory['snag-ball'])).toBeGreaterThan(0);

  await s.getByTestId('dom-partner-row-sign-cipher').click();
  await expect(s.getByTestId('dom-notice')).toContainText('Deal made with Team Cipher');
  await pressUntil(page, 'Enter', async () => !(await s.getByTestId('dom-notice').isVisible()));
  await expect(s.getByTestId('dom-partner-both')).toContainText('30%');
  await shot('partners-both');

  // The Shadow Machine: pick a Pokémon; its heart closes.
  await s.getByTestId('dom-partner-row-machine').click();
  await expect(s.getByTestId('dom-partner-ways')).toContainText('SHADOW MACHINE');
  await shot('partners-machine');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-notice')).toContainText('closes');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.party.some((m: any) => !!m.shadow))).toBe(true);
  await pressUntil(page, 'Enter', async () => !(await s.getByTestId('dom-notice').isVisible()));
  for (const size of [{ width: 1280, height: 720 }, { width: 800, height: 600 }]) {
    await page.setViewportSize(size);
    await shot(`partners-${size.width}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });

  // J closes the page; J opens it again; the purge's first fight starts at once.
  await pressUntil(page, 'KeyJ', async () => !(await ptOpen()));
  await expect(s.getByTestId('dom-phase')).toBeVisible();
  await pressUntil(page, 'KeyJ', ptOpen);
  await s.getByTestId('dom-partner-row-purge-snagem').click();
  await waitForScene(page, 'Battle');
  expect((await block(page)).field.fight).toMatchObject({ why: 'partner', begun: true });
  expect(errors).toEqual([]);
});

test('Charters: C on the Boss page; locked until a Dominion run is finished, then a Charter starts founded', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  await newDominion(page);
  const s = view(page, 'Dominion');
  await pressUntil(page, 'Enter', () => s.getByTestId('dom-setup-boss').isVisible());
  await expect(s.getByTestId('dom-setup-charter-chip')).toContainText('Finish one Dominion run');
  await pressUntil(page, 'KeyC', () => s.getByTestId('dom-setup-charters').isVisible());
  await expect(s.getByTestId('dom-charter-lock')).toBeVisible();
  await shot('charters-locked');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-problem')).toContainText('Finish one Dominion run');

  // One finished run on the profile opens them.
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.profile = { ...p.session.profile, dominionDone: ['an-old-run'] };
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  });
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
  await pressUntil(page, 'Enter', () => s.getByTestId('dom-setup-boss').isVisible());
  await pressUntil(page, 'KeyC', () => s.getByTestId('dom-setup-charters').isVisible());
  await expect(s.getByTestId('dom-charter-lock')).toHaveCount(0);
  await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('dom-charter-detail')).toContainText('Rocket');
  await shot('charters-open');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-opening')).toBeVisible();
  const b = await block(page);
  expect(b.origin).toEqual({ kind: 'charter', id: 'rocket-return' });
  expect(b.team.name).toBe('Rocket');
  expect(errors).toEqual([]);
});

test('The Turn: a main-game run that won offers D on the Game Over screen; it carries on in the Dominion', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new');
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    // The Road Home (NE100) already walked, so the results show.
    p.session.run = { ...p.session.run, phase: 'over', victory: true, money: 7000, itemCounters: { ...(p.session.run.itemCounters ?? {}), 'event-seen:ne100-road-home': 1 } };
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('GameOver');
  });
  await waitForScene(page, 'GameOver');
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => !!(window as any).__pkr.session.dominionTurnOffer())).toBe(true);
  await page.keyboard.press('KeyD');
  await waitForScene(page, 'Dominion');
  const run = await page.evaluate(() => (window as any).__pkr.session.run);
  expect(run.rules.modeId).toBe('dominion');
  expect(run.party).toHaveLength(1);
  expect(run.party[0].level).toBe(15);
  expect(errors).toEqual([]);
});
