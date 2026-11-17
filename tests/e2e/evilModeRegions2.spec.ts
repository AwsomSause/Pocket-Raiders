import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// Evil Mode slice 19 ("Sinnoh, Unova, Kalos"), in the New look. Taps: Kanto's over, the Crossing offers Sinnoh and Unova;
// Sinnoh's picked and the team lands at Oreburgh, with Sinnoh's rule on the frame. Sinnoh's Reckoning: the mountain's
// second clock is on the frame and In person offers the climb; a tap stops it. Kalos's light the same. Screens at three sizes.

const stage = (page: Page) => view(page, 'Evil');
const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run?.expansion?.evilMode);

async function founded(page: Page) {
  await start(page, 'ui=new');
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'evil-mode' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Evil');
  await page.evaluate(() => (window as any).__pkr.session.evilFound({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm' }, 2));
}

async function setUp(page: Page, fn: string) {
  await page.evaluate((fn) => {
    const p = (window as any).__pkr;
    const b = p.session.run.expansion.evilMode;
    new Function('b', fn)(b);
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  }, fn);
  await waitForScene(page, 'Evil');
  await expect(stage(page).getByTestId('evil-team-name')).toBeVisible();
  await page.waitForTimeout(300);
}

async function shots(page: Page, info: { outputPath: (n: string) => string }, name: string) {
  for (const [w, h] of [[1280, 720], [960, 540], [740, 360]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    await page.screenshot({ path: info.outputPath(`${name}-${w}x${h}.png`) });
  }
  await page.setViewportSize({ width: 1280, height: 720 });
}

const OVER = `b.fight = null; b.base = null; b.region.phase = 'over'; b.district.end = { how: 'reckoning', day: b.here.day, count: 0 };
  b.region.crossing = { step: 'tickets', offer: ['sinnoh', 'unova'], pick: null, staying: [], asked: null, base: 'none', baseOfficer: null, forms: null, boats: 'beside', lines: [] };`;

test('the Crossing to Sinnoh: two of the new tickets, tap one, and the team lands at Oreburgh', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page);
  await setUp(page, OVER);
  const s = stage(page);
  const panel = s.getByTestId('evil-crossing');
  await expect(s.getByTestId('evil-cross-ticket-sinnoh')).toContainText('Loyalty moves half as far');
  await expect(s.getByTestId('evil-cross-ticket-unova')).toContainText('Regard and Dread move twice as far');
  await shots(page, info, 'tickets');
  await s.getByTestId('evil-cross-ticket-sinnoh').click();
  await expect(panel).toHaveAttribute('data-step', 'who');
  await page.keyboard.press('Enter');
  await expect(panel).toHaveAttribute('data-step', 'forms');
  await page.keyboard.press('Enter');
  await expect(panel).toHaveAttribute('data-step', 'boats');
  await page.keyboard.press('Enter');
  const b = await block(page);
  expect(b.region.id).toBe('sinnoh');
  expect(b.here).toMatchObject({ region: 3, stage: 1 });
  await expect(s.getByTestId('evil-crossing')).toHaveCount(0);
  await expect(s.getByTestId('evil-chip').first()).toContainText('Sinnoh');
  await shots(page, info, 'sinnoh');
  expect(errors).toEqual([]);
});

for (const [id, word, act] of [['sinnoh', 'The mountain', 'Coronet'], ['kalos', 'The light', 'Geosenge']] as const) {
  test(`${id}'s second clock: on the frame at the Reckoning, and stopped in person by a tap`, async ({ page }, info) => {
    const errors = watch(page);
    await founded(page);
    await setUp(page, `b.fight = null; b.region.id = '${id}'; b.here.stage = 8; b.here.beat = 'inPerson'; b.inPerson = null; b.queue = []; b.region.clock = { left: 2, day: b.here.day, stopped: null };`);
    const s = stage(page);
    await expect(s.getByTestId('evil-chip').filter({ hasText: word }).first()).toBeVisible();
    await expect(s.getByTestId('evil-clock-stop-boss')).toContainText(act);
    await shots(page, info, `${id}-clock`);
    await s.getByTestId('evil-clock-stop-boss').click();
    expect((await block(page)).region.clock.stopped).toBe('boss');
    await expect(s.getByTestId('evil-clock-stop-boss')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
