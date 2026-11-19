import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D5 (the HQ): the HQ menu (mockup 6). B opens it from the HQ; Buy Room builds a Bunk Room that is
// ready the next morning; View Assets and Money open and close; a Compound like the mockup's draws its rooms; a reload
// keeps the room.

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
  const s = view(page, 'Dominion');
  await expect(s.getByTestId('dom-logo')).toBeVisible();
  await page.waitForTimeout(300);
  await s.getByTestId('dom-title-0').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-type-poison').click();
  await s.getByTestId('dom-type-dark').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-next').click();
  for (let i = 0; i < 4; i++) await s.getByTestId('dom-opening').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('EVENING');
  return s;
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);

test('HQ menu: build a Bunk Room, open View Assets and Money, draw a Compound, and it reloads', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  const s = await newDominion(page);

  // B opens the HQ menu: the Warehouse, three free slots, the next level and the Buy Room list.
  await page.keyboard.press('KeyB');
  await expect(s.getByTestId('dom-build')).toBeVisible();
  await page.waitForTimeout(250);
  await expect(s.getByTestId('dom-next-lv')).toContainText('NEXT: LV. 2 HIDEOUT');
  await expect(s.getByTestId('dom-region')).toHaveText('15');
  await expect(s.getByTestId('dom-blueprint')).toContainText('TRAINING ROOM');
  await shot('6-hq-warehouse');

  // The Training Room costs more than the ₽1,000 we have: refused with the reason.
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-notice')).toContainText('Not enough money');
  // Down to the Bunk Room (after the poster's seven) and build it.
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(120);
  }
  await expect(s.getByTestId('dom-build-bunk-room')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-notice')).toContainText('Work starts on the Bunk Room');
  const built = await block(page);
  expect(built.funds).toBe(200);
  expect(built.hq.rooms).toHaveLength(1);
  const uid = built.hq.rooms[0].uid;
  await expect(s.getByTestId(`dom-room-${uid}`)).toContainText('building');

  // View Assets and Money open and close.
  await page.waitForTimeout(200);
  await page.keyboard.press('KeyA');
  await expect(s.getByTestId('dom-assets')).toContainText('Bunk Room');
  await page.waitForTimeout(200);
  await shot('hq-assets');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-assets')).toBeHidden();
  await page.waitForTimeout(200);
  await page.keyboard.press('KeyL');
  await expect(s.getByTestId('dom-money')).toBeVisible();
  await expect(s.getByTestId('dom-clean')).toHaveText('₽200');
  await shot('hq-money');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-money')).toBeHidden();
  await page.waitForTimeout(200);

  // Esc back to the HQ; the night passes; the room is ready and the crew cap is 5.
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-next')).toBeVisible();
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('NIGHT');
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('MORNING');
  expect((await block(page)).rosterCap).toBe(5);
  await page.keyboard.press('KeyB');
  await expect(s.getByTestId(`dom-room-${uid}`)).toContainText('crew +2');
  const before = await block(page);

  // A Compound three weeks in, like mockup 6 (drawn from a block set by hand: a picture check, not a rules check).
  await page.evaluate(() => {
    const b = (window as any).__pkr.session.run.expansion.dominion;
    const room = (uid: string, id: string, tier = 1) => ({ uid, id, tier, cond: 100, spent: 1000, building: false, up: false, ready: 0, shut: false, ruined: false, at: null });
    Object.assign(b, { hqLevel: 3, levelCap: 40, rosterCap: 10, teamName: 'Team Nova', funds: 18900, day: 21, phase: 'evening' });
    b.hq.rooms = [room('x1', 'barracks'), room('x2', 'operations-room'), room('x3', 'treasury', 3), room('x4', 'print-shop'), room('x5', 'training-room'), room('x6', 'infirmary'), room('x7', 'holding-pens'), room('x8', 'garage')];
  });
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  await expect(s.getByTestId('dom-room-x1')).toContainText('2 slots · crew +6');
  await expect(s.getByTestId('dom-room-x3')).toContainText('₽30k safe');
  for (const [w, h] of [[1280, 720], [960, 540], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await expect(s.getByTestId('dom-build')).toBeVisible();
    await shot(`6-hq-compound-${w}x${h}`);
  }

  // Reload: the Bunk Room is still there (the hand-set Compound was never saved).
  await page.goto('/?ui=new');
  await waitForScene(page, 'MainMenu');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.continueRun();
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  });
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
  expect(await block(page)).toEqual(before);
  expect(errors).toEqual([]);
});
