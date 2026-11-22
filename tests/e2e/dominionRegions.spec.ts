import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D15 (Many regions): with Kanto Taken, G opens the Empire page (mockup s10), L the Leaving page (a
// Holder, standing orders, one member to bring); sailing opens Johto's first morning with ₽1,000 and the ace at Lv 15;
// back on G, Kanto's card shows its Holder, Stability and answers.

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

/** Changes the saved block, opens the Dominion screen again and Continues to the HQ. */
async function edit(page: Page, f: string) {
  await page.evaluate((src) => {
    const p = (window as any).__pkr;
    new Function('b', 'run', src)(p.session.run.expansion.dominion, p.session.run);
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  }, f);
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
  await pressUntil(page, 'Enter', () => view(page, 'Dominion').getByTestId('dom-phase').isVisible());
  await page.waitForTimeout(250);
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);

const TAKEN = `
  b.takeover = { goal: { track: 0, cost: 9, stage: 0, tp: null, done: false, lost: 0 }, last: {}, plan: 0, league: { elite: [], champion: false, studied: [], swayed: [], sway: 0 }, hold: {}, scouts: {}, chain: null, won: { path: 'shadow', day: b.day }, paths: ['shadow'], taken: { path: 'shadow', day: b.day }, bcast: { queue: [], seen: [] }, cracked: false };
  const m0 = b.members[0];
  b.members.push({ ...structuredClone(m0), id: 'rosa', name: 'Rosa', rank: 'executive', loyalty: 80 }, { ...structuredClone(m0), id: 'dale', name: 'Dale', rank: 'executive' });
  b.funds = 54321;
  run.party[0].level = 36;
`;

test('Many regions: the Empire page on G, the Leaving page on L, and Johto\'s first morning', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  await dayOne(page);
  await edit(page, TAKEN);
  const s = view(page, 'Dominion');

  // G: the Empire page. Only Kanto so far (here), then the regions ahead; the leave CTA is open.
  await pressUntil(page, 'KeyG', () => s.getByTestId('dom-empire').isVisible());
  await expect(s.getByTestId('dom-empire-card-kanto')).toBeVisible();
  await expect(s.getByTestId('dom-empire-leave')).toContainText('Johto');
  await shot('s10-empire-kanto');

  // L: the Leaving page. Rosa holds Kanto, Dale comes along.
  await pressUntil(page, 'KeyL', () => s.getByTestId('dom-leave').isVisible());
  // Redesign R8: Pick the Holder (mockup `holder`), a second tap goes on to Sail (`sail`).
  await s.getByTestId('dom-leave-holder-rosa').dispatchEvent('click');
  await s.getByTestId('dom-leave-holder-rosa').dispatchEvent('click');
  await s.getByTestId('dom-leave-bring-dale').dispatchEvent('click');
  await expect(s.getByTestId('dom-leave-go')).toContainText('Johto');
  for (const size of [{ width: 1280, height: 720 }, { width: 800, height: 600 }]) {
    await page.setViewportSize(size);
    await shot(`s10-leave-${size.width}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await s.getByTestId('dom-leave-go').dispatchEvent('click');

  // Johto: the first morning, ₽1,000, the ace at Lv 15, Dale here and Rosa holding Kanto.
  await expect(s.getByTestId('dom-opening')).toBeVisible();
  await shot('johto-opening');
  const b = await block(page);
  expect(b.realm.at).toBe('johto');
  expect(b.funds).toBe(1000);
  expect(b.members.map((m: { id: string }) => m.id)).toContain('dale');
  expect(b.realm.held[0]).toMatchObject({ id: 'kanto', status: 'held', holder: { name: 'Rosa' } });
  expect(await page.evaluate(() => (window as any).__pkr.session.run.party[0].level)).toBe(15);

  // Through the opening (redesign R8: the arrival page, whose top bar also shows the phase) to the HQ, then G: Kanto is held and answers.
  await pressUntil(page, 'Enter', async () => !(await s.getByTestId('dom-opening').isVisible()));
  await page.waitForTimeout(250);
  await pressUntil(page, 'KeyG', () => s.getByTestId('dom-empire').isVisible());
  await expect(s.getByTestId('dom-empire-card-kanto')).toContainText('Rosa');
  await expect(s.getByTestId('dom-empire-card-johto')).toBeVisible();
  await expect(s.getByTestId('dom-empire-tribute')).toBeVisible();
  for (const size of [{ width: 1280, height: 720 }, { width: 800, height: 600 }]) {
    await page.setViewportSize(size);
    await shot(`s10-empire-held-${size.width}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });

  // Orders: the Kanto card opens its region page (redesign R8), the sheet opens from there and Esc closes it.
  await s.getByTestId('dom-empire-card-kanto').dispatchEvent('click');
  await s.getByTestId('dom-empire-card-kanto').dispatchEvent('click');
  await s.getByTestId('dom-empire-kanto-orders').dispatchEvent('click');
  await expect(s.getByTestId('dom-orders')).toBeVisible();
  await shot('s10-orders');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-orders')).toBeHidden();

  // G closes the page again.
  await pressUntil(page, 'KeyG', async () => !(await s.getByTestId('dom-empire').isVisible()));
  expect(errors).toEqual([]);
});
