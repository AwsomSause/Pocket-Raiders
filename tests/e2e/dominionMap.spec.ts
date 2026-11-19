import { expect, test, type Page } from '@playwright/test';
import { confirmUntil } from './battleInput';
import { open, scene, start, toCommands, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D2 (the Boss's hands): the Region Map (mockup 3) and the Card (mockup 4). Pick a district, a place
// and an action, read the Card, do it; a battle runs through the game's own battle screen and comes back to the map,
// and a loss never ends the run. Saved at every step; a reload continues.

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
  // Setup and the first night through the session (D1's spec walks those screens); then into the HQ on Day 2.
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.dominionStart({ types: ['poison', 'dark'], member: 'grunt', look: 0 });
    for (const t of ['open', 'toNight', 'rest', 'toDay']) p.session.dominionStep({ t });
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  });
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await expect(view(page, 'Dominion').getByTestId('dom-phase')).toHaveText('DAY');
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);

test('the Region Map and the Card: pick Cerulean, read the Card, do an action, fight, and back to the map', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  await dayOne(page);
  const s = view(page, 'Dominion');
  await page.keyboard.press('Digit2');
  await expect(s.getByTestId('dom-map')).toBeVisible();
  await expect(s.getByTestId('dom-dz-pewter')).toContainText('HQ · Outsider');
  await expect(s.getByTestId('dom-dz-celadon')).toContainText('Rocket');
  await expect(s.getByTestId('dom-dz-vermilion')).toContainText('Police');
  await shot('3-map-pewter');
  // Cerulean, the Bike Shop, Extort: the Card (mockup 4).
  await s.getByTestId('dom-dz-cerulean').click();
  await expect(s.getByTestId('dom-file')).toContainText('Cerulean');
  await expect(s.getByTestId('dom-grid')).toContainText('Bike Shop');
  await s.getByTestId('dom-act-extort').click();
  await expect(s.getByTestId('dom-cta')).toHaveText(/Extort the Bike Shop/);
  await shot('3-map-cerulean');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-card')).toBeVisible();
  await expect(s.getByTestId('dom-card-pays')).toContainText('/wk');
  await expect(s.getByTestId('dom-card')).toContainText("Who's hurt");
  await expect(s.getByTestId('dom-card')).toContainText('Battle? 40%');
  await expect(s.getByTestId('dom-card-slot')).toHaveText('Action 1 of 4');
  await shot('4-card');
  // Esc goes back to the map; nothing was spent.
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-map')).toBeVisible();
  expect((await block(page)).actions).toBe(4);
  // A sure thing: Lay Low at Pewter, by taps.
  await s.getByTestId('dom-dz-pewter').click();
  await s.getByTestId('dom-act-lay-low').click();
  await s.getByTestId('dom-cta').click();
  await expect(s.getByTestId('dom-card-chance')).toHaveText('100%');
  await s.getByTestId('dom-doit').click();
  await expect(s.getByTestId('dom-notice')).toContainText('Heat here −10');
  expect((await block(page)).actions).toBe(3);
  await s.getByTestId('dom-notice').click();
  // Failure: Steal is a Night action; the Card says so and Do it does nothing.
  await s.getByTestId('dom-act-steal').click();
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-card-blocked')).toHaveText("That's a Night action.");
  await s.getByTestId('dom-doit').click();
  expect((await block(page)).actions).toBe(3);
  await page.keyboard.press('Escape');
  // Attack on Route 3 always fights: the battle screen, a loss, and back to the map with the run going on.
  await s.getByTestId('dom-target-route-3').click();
  await s.getByTestId('dom-act-attack').click();
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-card')).toContainText('Battle: always');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.battle.trainer.classId)).toBe('hiker');
  await toCommands(page);
  await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    run.party.forEach((m: any, i: number) => { m.hp = i === 0 ? 1 : 0; });
    run.party[0].moves = [{ ...run.party[0].moves[0], id: 'splash', pp: 40 }];
    const ghost = (window as any).__pkr.session.content.species.get(run.party[0].speciesId)?.types.includes('ghost');
    run.battle.enemyTeam.forEach((m: any) => { m.moves = [{ ...m.moves[0], id: ghost ? 'shadow-ball' : 'tackle', pp: 35 }]; });
  });
  const b = view(page, 'Battle');
  const atDom = async () => (await scene(page)) === 'Dominion';
  for (let i = 0; i < 6 && !(await atDom()); i++) {
    const menu = await page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle')?.menu));
    if (menu) {
      await b.locator('[data-act="pick"]', { hasText: 'Fight' }).click();
      await page.waitForTimeout(250);
      await b.locator('.btn.mv').first().click();
    }
    await confirmUntil(page, async () => (await atDom()) || (await page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle')?.menu))), 40_000);
  }
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
  await expect(view(page, 'Dominion').getByTestId('dom-map')).toBeVisible();
  const after = await block(page);
  expect(after.field.fight).toBeNull();
  expect(after.field.at).toBe('pewter');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.phase)).toBe('map');
  await shot('3-map-after-fight');
  // Reload: Continue lands on the HQ where it was.
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
  await page.keyboard.press('Enter');
  await expect(view(page, 'Dominion').getByTestId('dom-phase')).toHaveText('DAY');
  expect(await block(page)).toEqual(after);
  expect(errors).toEqual([]);
});

test('vehicles: V opens the list and the Bike can be bought', async ({ page }) => {
  await start(page, 'ui=new');
  await dayOne(page);
  const s = view(page, 'Dominion');
  await page.keyboard.press('Digit2');
  await page.keyboard.press('KeyV');
  await expect(s.getByTestId('dom-garage')).toBeVisible();
  await s.getByTestId('dom-buy-bike').click();
  await expect(s.getByTestId('dom-notice')).toHaveText('Bought: Bike.');
  expect((await block(page)).field.vehicles).toEqual(['bike']);
});
