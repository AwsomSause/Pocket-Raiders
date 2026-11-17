import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// Evil Mode slice 16 ("the Crossing"), in the New look. Taps: Kanto's over, the Crossing shows two tickets; Johto's is
// picked. Keys: Enter through who comes, the quay's question and the boats, and the team lands in Johto's Arrival (the
// block now says Kanto was crossed). Hoenn: In person, carry a letter (tap); the count goes up. Screens at three sizes.

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
  b.region.crossing = { step: 'tickets', offer: ['johto', 'hoenn'], pick: null, staying: [], asked: null, base: 'none', baseOfficer: null, forms: null, boats: 'beside', lines: [] };`;

test('the Crossing: pick Johto by tap, Enter through the quay, and the team lands in Johto', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page);
  await setUp(page, OVER);
  const s = stage(page);
  const panel = s.getByTestId('evil-crossing');
  await expect(panel).toHaveAttribute('data-step', 'tickets');
  await expect(s.getByTestId('evil-cross-ticket-johto')).toContainText('Johto');
  await expect(s.getByTestId('evil-cross-ticket-hoenn')).toContainText('Hoenn');
  await shots(page, info, 'tickets');
  await s.getByTestId('evil-cross-ticket-johto').click();
  await expect(panel).toHaveAttribute('data-step', 'who');
  await page.keyboard.press('Enter');
  await expect(panel).toHaveAttribute('data-step', 'forms');
  await page.keyboard.press('Enter');
  await expect(panel).toHaveAttribute('data-step', 'boats');
  await shots(page, info, 'boats');
  await page.keyboard.press('Enter');
  const b = await block(page);
  expect(b.region.crossed).toEqual(['kanto']);
  expect(b.region.id).toBe('johto');
  expect(b.here).toMatchObject({ region: 1, stage: 1 });
  expect(b.region.forms).toBe(false);
  await expect(s.getByTestId('evil-crossing')).toHaveCount(0);
  await expect(s.getByTestId('evil-chip').first()).toContainText('Johto');
  await shots(page, info, 'johto');
  expect(errors).toEqual([]);
});

test('Hoenn: carry a letter in person; the count goes up and the button goes for the day', async ({ page }) => {
  const errors = watch(page);
  await founded(page);
  await setUp(page, `b.fight = null; b.region.id = 'hoenn'; b.here.beat = 'inPerson'; b.inPerson = null; b.queue = [];`);
  const s = stage(page);
  await expect(s.getByTestId('evil-clock-letter')).toContainText('0 of 3');
  await s.getByTestId('evil-clock-letter').click();
  expect((await block(page)).region.letters).toBe(1);
  await expect(s.getByTestId('evil-clock-letter')).toHaveCount(0);
  expect(errors).toEqual([]);
});
