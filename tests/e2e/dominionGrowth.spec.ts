import { expect, test, type Page } from '@playwright/test';
import { confirmUntil } from './battleInput';
import { open, scene, start, toCommands, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D10 (Growth): the action list a section at a time (s3), the Card's choices (s4: Left/Right picks a
// Gym way), a Gym broken in a chain of fights (each battle comes back to the map, Enter starts the next), and the Gym
// kept after a reload. Saved at every step.

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
  // Setup and the first night through the session; a sharp Boss feared enough in Pewter to be a Crew (Notoriety 50).
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.dominionStart({ types: ['poison', 'dark'], member: 'grunt', look: 0 });
    for (const t of ['open', 'toNight', 'rest', 'toDay']) p.session.dominionStep({ t });
    const b = p.session.run.expansion.dominion;
    for (const k of ['brawn', 'nerve', 'wits', 'charm', 'stealth']) b.field.edge.stats[k] = 10;
    b.field.districts.pewter.dread = 60;
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  });
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await expect(view(page, 'Dominion').getByTestId('dom-phase')).toHaveText('DAY');
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);

/** Wins the battle on screen: every foe at 1 HP and only Splash to use (a Leader may heal up to four times). */
async function winBattle(page: Page) {
  await waitForScene(page, 'Battle');
  await page.waitForTimeout(250);
  await toCommands(page);
  await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    run.party[0].moves = [{ ...run.party[0].moves[0], id: 'tackle', pp: 35 }];
    run.battle.enemyTeam.forEach((m: any) => { m.hp = 1; m.moves = [{ ...m.moves[0], id: 'splash', pp: 40 }]; });
  });
  const b = view(page, 'Battle');
  const atDom = async () => (await scene(page)) === 'Dominion';
  for (let i = 0; i < 24 && !(await atDom()); i++) {
    const menu = await page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle')?.menu));
    if (menu) {
      await page.evaluate(() => (window as any).__pkr.session.run.battle.enemyTeam.forEach((m: any) => { if (m.hp > 1) m.hp = 1; }));
      await b.locator('[data-act="pick"]', { hasText: 'Fight' }).click();
      await page.waitForTimeout(250);
      await b.locator('.btn.mv').first().click();
    }
    await confirmUntil(page, async () => (await atDom()) || (await page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle')?.menu))), 40_000);
  }
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
}

test('Growth: the section pages, the Card\'s five Gym ways, Break in a chain of fights, and the Gym kept on reload', async ({ page }, info) => {
  test.setTimeout(240_000);
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  await dayOne(page);
  const s = view(page, 'Dominion');
  await page.keyboard.press('Digit2');
  await expect(s.getByTestId('dom-map')).toBeVisible();
  await expect(s.getByTestId('dom-section')).toHaveText('Starting moves');
  await expect(s.getByTestId('dom-section')).toBeVisible();
  // ] turns the pages; each names its list section. Find Gym Takeover.
  await s.getByTestId('dom-grid').click();
  for (let i = 0; i < 40 && !(await s.getByTestId('dom-act-gym-takeover').isVisible()); i++) {
    const was = await s.getByTestId('dom-section').textContent();
    await page.keyboard.press('BracketRight');
    await expect.poll(async () => `${await s.getByTestId('dom-section').textContent()}|${await s.getByTestId('dom-pager').textContent()}`).not.toBe(`${was}|`);
    await page.waitForTimeout(120);
  }
  await expect(s.getByTestId('dom-section')).toHaveText('Gyms and Heroes');
  await shot('s3-gyms-page');
  // The page opens with Gym Takeover picked, so a tap on it opens the Card.
  await s.getByTestId('dom-act-gym-takeover').click();
  if (!(await s.getByTestId('dom-card').isVisible())) await s.getByTestId('dom-cta').click();
  // The Card: five ways, Left/Right picks; the note says what the way means.
  await expect(s.getByTestId('dom-card-strip')).toBeVisible();
  await expect(s.getByTestId('dom-opt-beat')).toBeVisible();
  await expect(s.getByTestId('dom-card-note')).toContainText('Brock (rock)');
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('dom-card-note')).toContainText('clean money');
  await expect(s.getByTestId('dom-card-blocked')).toContainText('Not enough money');
  await shot('s4-card-buy');
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('dom-card-note')).toContainText('2 fights');
  await expect(s.getByTestId('dom-card-chance')).toHaveText('100%');
  await shot('s4-card-break');
  // Several window sizes.
  for (const [w, h] of [[1280, 720], [960, 540], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await expect(s.getByTestId('dom-card-strip')).toBeVisible();
    await shot(`card-${w}x${h}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  // Break: the Camper, then Brock; the map in between says what's next.
  await page.keyboard.press('Enter');
  await winBattle(page);
  await expect(s.getByTestId('dom-notice')).toContainText('Fight 2 of 2: Brock next. Enter to go on.');
  expect((await block(page)).growth.chain.step).toBe(1);
  await shot('chain-between');
  await page.keyboard.press('Enter');
  await winBattle(page);
  // The battle read out the result; the map has no fight waiting now.
  await expect(s.getByTestId('dom-map')).toBeVisible();
  await expect(s.getByTestId('dom-notice')).toHaveCount(0);
  const after = await block(page);
  expect(after.growth.gyms['pewter-gym'].way).toBe('break');
  expect(after.growth.badges).toEqual(['pewter-gym']);
  expect(after.field.fight).toBeNull();
  await shot('gym-taken');

  // Reload: the Gym is still the Boss's.
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
  expect((await block(page)).growth.gyms['pewter-gym'].way).toBe('break');
  expect(errors).toEqual([]);
});
