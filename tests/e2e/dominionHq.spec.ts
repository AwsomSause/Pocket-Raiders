import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D5 (the HQ), redrawn by redesign R2 (pass 50): B opens the Ground Floor; a free plot opens Build a
// room, where a room you can't afford is refused with the reason and the Bunk Room goes up, ready the next morning;
// L opens the Laundromat; a Compound like the mockups' draws its floors at three sizes; a reload keeps the room.

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

test('HQ floor: refuse a room, build a Bunk Room, open the Laundromat, draw a Compound, and it reloads', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  const s = await newDominion(page);

  // B opens the Ground Floor: the Loading Dock, three free plots and one for sale.
  await page.keyboard.press('KeyB');
  await expect(s.getByTestId('dom-build')).toBeVisible();
  await expect(s.getByTestId('r5-tile-fix')).toContainText('Loading Dock');
  await page.waitForTimeout(250);
  await shot('hq-floor');

  // A free plot opens Build a room. The Training Room costs more than the ₽1,000 we have: refused with the reason.
  await s.getByTestId('r5-tile-free-2').click();
  await page.waitForTimeout(150);
  if (!(await s.getByTestId('r5-build-grid').count())) await s.getByTestId('r5-tile-free-2').click();
  await expect(s.getByTestId('r5-build-grid')).toBeVisible();
  const find = async (id: string, key = 'ArrowDown') => {
    // ↓ / ↑ move a row (three cards), so every page of six is passed through.
    for (let n = 0; n < 80 && !(await s.getByTestId(`dom-build-${id}`).count()); n++) {
      await page.keyboard.press(key);
      await page.waitForTimeout(120);
    }
    await expect(s.getByTestId(`dom-build-${id}`)).toBeVisible();
  };
  await find('training-room');
  await expect(s.getByTestId('dom-build-training-room')).toContainText('not enough money');
  await s.getByTestId('dom-build-training-room').click();
  await page.waitForTimeout(150);
  if (!(await s.getByTestId('dom-notice').count())) await s.getByTestId('dom-build-training-room').click();
  await expect(s.getByTestId('dom-notice')).toContainText('Not enough money');
  expect((await block(page)).funds).toBe(1000);
  // The Bunk Room goes up: back on the floor, building.
  await find('bunk-room', 'ArrowUp');
  await s.getByTestId('dom-build-bunk-room').click();
  await page.waitForTimeout(150);
  if (await s.getByTestId('r5-build-grid').count()) await s.getByTestId('dom-build-bunk-room').click();
  await expect(s.getByTestId('dom-notice')).toContainText('Work starts on the Bunk Room');
  const built = await block(page);
  expect(built.funds).toBe(200);
  expect(built.hq.rooms).toHaveLength(1);
  const uid = built.hq.rooms[0].uid;
  await expect(s.getByTestId(`dom-room-${uid}`)).toContainText('Building');

  // L: the Laundromat opens and closes.
  await page.waitForTimeout(200);
  await page.keyboard.press('KeyL');
  await expect(s.getByTestId('dom-money')).toBeVisible();
  await shot('hq-launder');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-money')).toBeHidden();
  await page.waitForTimeout(200);

  // Esc back to the HQ; the night passes; the room is ready and the crew cap is 5.
  for (let n = 0; n < 4 && !(await s.getByTestId('r5-hq').count()); n++) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
  }
  await expect(s.getByTestId('dom-next')).toBeVisible();
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('NIGHT');
  await s.getByTestId('dom-next').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('MORNING');
  expect((await block(page)).rosterCap).toBe(5);
  await page.waitForTimeout(200);
  await page.keyboard.press('KeyB');
  await expect(s.getByTestId(`dom-room-${uid}`)).toBeVisible();
  await expect(s.getByTestId(`dom-room-${uid}`)).not.toContainText('Building');
  const before = await block(page);

  // A Compound three weeks in, like the mockups' (drawn from a block set by hand: a picture check, not a rules check).
  await page.evaluate(() => {
    const b = (window as any).__pkr.session.run.expansion.dominion;
    const room = (uid: string, id: string, floor: number, tier = 1) => ({ uid, id, tier, cond: 100, spent: 1000, building: false, up: false, ready: 0, shut: false, ruined: false, at: null, floor });
    Object.assign(b, { hqLevel: 3, levelCap: 40, rosterCap: 10, teamName: 'Team Nova', funds: 18900, day: 21, phase: 'evening' });
    b.hq.rooms = [room('x1', 'barracks', 1), room('x2', 'operations-room', 3), room('x3', 'treasury', 2, 3), room('x4', 'print-shop', 3), room('x5', 'training-room', 2), room('x6', 'infirmary', 1), room('x7', 'holding-pens', 2)];
    b.hq.floorSeen = 3;
  });
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  await expect(s.getByTestId('dom-room-x1')).toContainText('Barracks');
  for (const [w, h] of [[1280, 720], [960, 540], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await expect(s.getByTestId('dom-build')).toBeVisible();
    await shot(`hq-compound-${w}x${h}`);
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
