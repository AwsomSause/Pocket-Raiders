import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D8 (Squads and Groups): the Squads page (mockup 13, U on the Crew File). A Street Gang crew forms
// "Viper Unit" in the builder (Code Name typed on the form, leader, two members), gives it one order, and the squad
// survives a reload. Saved at every step.

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

/** One key at a time: the game reads keys once a frame, so two presses inside one frame can reach it twice. */
const press = async (page: Page, key: string) => {
  await page.keyboard.press(key);
  await page.waitForTimeout(120);
};
const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);

test('the Squads page: form Viper Unit, give it an order, reload', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  const s = await newDominion(page);

  // A Street Gang crew (Notoriety 20+): Rook plus a Corporal, a Sergeant and grunts, and a feared home town.
  await page.evaluate(() => {
    const b = (window as any).__pkr.session.run.expansion.dominion;
    b.field.districts.pewter.dread = 30;
    const rook = b.members[0];
    const ranks = ['corporal', 'sergeant'];
    for (let i = 0; b.members.length < 20; i++) {
      const m = structuredClone(rook);
      m.id = `m${i + 10}`;
      m.name = ['Gus', 'Mina', 'Dale', 'Rosa', 'Pip', 'Ned', 'Ivy', 'Bo', 'Kit', 'Lou', 'Max', 'Sid', 'Tam', 'Uma', 'Vic', 'Wes', 'Zed', 'Ana', 'Cy'][i] ?? `G${i}`;
      m.rank = ranks[i] ?? 'grunt';
      m.team = [];
      m.crew = { ...m.crew, task: 'guard-hq', motive: i % 2 ? 'money' : 'belonging', line: [], tally: {}, treat: {} };
      b.members.push(m);
    }
    b.crew.next = 40;
  });

  // The Crew File names the page; U opens it. No squads yet: the builder has the keys.
  await press(page, 'Digit3');
  await expect(s.getByTestId('dom-file-keys')).toContainText('Squads');
  await page.keyboard.press('KeyU');
  await expect(s.getByTestId('dom-sq-builder')).toBeVisible();
  await expect(s.getByTestId('dom-sq-empty')).toContainText('No squads yet');
  await expect(s.getByTestId('dom-sq-count')).toHaveText('Squads 0 / 2');
  await expect(s.getByTestId('dom-sq-leader')).toContainText('Gus');
  await expect(s.getByTestId('dom-sq-leader')).toContainText('CORPORAL');

  // Code Name: Enter on the first row opens the typing form.
  await press(page, 'Enter');
  const input = page.getByTestId('ask-input');
  await expect(input).toBeVisible();
  await input.fill('Viper Unit');
  await input.press('Enter');
  await expect(s.getByTestId('dom-sq-name')).toContainText('Viper Unit');
  await page.waitForTimeout(300); // the form hands the keys back

  // Leader row: → picks the Sergeant (up to 4). Members row: pick two.
  await press(page, 'ArrowDown');
  await press(page, 'ArrowRight');
  await expect(s.getByTestId('dom-sq-leader')).toContainText('Mina');
  await expect(s.getByTestId('dom-sq-leader')).toContainText('up to 4');
  for (let i = 0; i < 4; i++) await press(page, 'ArrowDown');
  await press(page, 'Enter');
  await press(page, 'ArrowRight');
  await press(page, 'Enter');
  await expect(s.getByTestId('dom-sq-picked')).toHaveText('3 picked');
  await expect(s.getByTestId('dom-sq-form')).toHaveClass(/shine/);
  await page.waitForTimeout(900); // the entrance settles before the shot
  await shot('13-squads-builder');
  await s.getByTestId('dom-sq-form').click();

  // The card: VIPER UNIT under the Sergeant, Workmates at Cohesion 20.
  const b1 = await block(page);
  expect(b1.squads.list).toHaveLength(1);
  const sq = b1.squads.list[0];
  expect(sq.codeName).toBe('Viper Unit');
  expect(sq.members).toHaveLength(3);
  const card = s.getByTestId(`dom-squad-${sq.id}`);
  await expect(card).toContainText('VIPER UNIT');
  await expect(card).toContainText('3/4');
  await expect(card).toContainText('WORKMATES');
  await expect(s.getByTestId('dom-sq-count')).toHaveText('Squads 1 / 2');

  // Enter on the card: the order picker; the first task for the whole squad.
  await press(page, 'Enter');
  await expect(s.getByTestId('dom-sq-picker')).toBeVisible();
  await press(page, 'ArrowDown');
  await press(page, 'Enter');
  await expect(s.getByTestId('dom-notice')).toContainText('Viper Unit takes');
  const b2 = await block(page);
  const order = b2.squads.list[0].order;
  expect(order).toBeTruthy();
  for (const id of b2.squads.list[0].members) expect(b2.members.find((m: { id: string }) => m.id === id).crew.task).toBe(order);
  await expect(card).toContainText('%');
  await page.waitForTimeout(900);
  await shot('13-squads');

  // Several window sizes.
  for (const [w, h] of [[1280, 720], [960, 540], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await expect(card).toBeVisible();
    await shot(`squads-${w}x${h}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });

  // Esc back to the Crew File; the Pyramid shows the squad's Mark.
  await press(page, 'Escape');
  await expect(s.getByTestId('dom-file-keys')).toBeVisible();

  // Reload: the squad and its order are still there.
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
  await expect(view(page, 'Dominion').getByTestId('dom-phase')).toHaveText('EVENING');
  expect(await block(page)).toEqual(b2);
  await press(page, 'Digit3');
  await press(page, 'KeyU');
  await expect(view(page, 'Dominion').getByTestId(`dom-squad-${sq.id}`)).toContainText('VIPER UNIT');
  expect(errors).toEqual([]);
});
