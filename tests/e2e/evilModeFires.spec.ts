import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// Evil Mode slice 12 ("the fires and the last room"), in the New look. Keys: the Road page (O) on the fire's day, Sit at
// the fire, every exchange answered with Enter, a line of your own typed and kept word for word, the fire left. Taps: the
// last room opened, "(Say nothing.)" pressed, the room's outcome read and closed. Screens at three sizes.

const stage = (page: Page) => view(page, 'Evil');
const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.evilMode);

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

/** Changes the block in the page, then restarts the scene so it draws what's there. */
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

test('keys: the Road page on the fire\'s day, sit, answer with Enter, type a line of your own, leave the fire', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page);
  // District 3 of the region, its third day, at the In person beat (where the fire is lit).
  await setUp(page, "b.here.stage = 4; b.district.n = 3; b.here.day = (b.district.from ?? 1) + 2; b.here.beat = 'inPerson'; b.inPerson = null; b.fight = null;");
  expect((await block(page)).road).toHaveLength(3);
  const s = stage(page);
  await page.keyboard.press('o');
  await expect(s.getByTestId('evil-roadpage')).toHaveAttribute('data-mode', 'road');
  await expect(s.getByTestId('evil-road-body')).toContainText('small flame');
  await shots(page, info, 'road-page');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('evil-roadpage')).toHaveAttribute('data-mode', 'fire');
  await shots(page, info, 'fire');
  // Esc doesn't leave a fire: it holds the screen until it's done.
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('evil-roadpage')).toHaveAttribute('data-mode', 'fire');
  for (let i = 0; i < 6 && !(await page.getByTestId('evil-own-input').count()); i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
  }
  const own = page.getByTestId('evil-own-input');
  await expect(own).toBeVisible();
  await shots(page, info, 'fire-own');
  await own.fill('Mind the road.');
  await own.press('Enter');
  await expect(s.getByTestId('evil-road-body')).toContainText('The fire burns down');
  expect((await block(page)).hero.fires.at(-1).own).toBe('Mind the road.');
  await page.keyboard.press('Enter');
  expect((await block(page)).fire).toBeNull();
  await expect(s.getByTestId('evil-roadpage')).toHaveAttribute('data-mode', 'road');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('evil-roadpage')).toHaveCount(0);
  // The File keeps it, word for word.
  await s.getByTestId('evil-file-open').click();
  await s.getByTestId('evil-file-tab-2').click();
  await expect(s.getByTestId('evil-file-body')).toContainText('"Mind the road."');
  expect(errors).toEqual([]);
});

test('taps: the last room holds the screen; "(Say nothing.)" ends it, and Close puts it away', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page);
  await setUp(page, `b.here.stage = 8; b.here.beat = 'inPerson'; b.fight = null;
    b.reck = { region: b.here.region, lastDay: null, gone: 0, night: [], gate: ['They came over the wall.'], walk: [], seen: [],
      room: { open: 'They stood in the door.', speech: ['Why?'], lines: [], asked: false, offered: false, shown: [], answer: null, outcome: null, stepped: null } };`);
  const s = stage(page);
  await expect(s.getByTestId('evil-roadpage')).toHaveAttribute('data-mode', 'room');
  await expect(s.getByTestId('evil-road-body')).toContainText('They stood in the door.');
  await expect(s.getByTestId('evil-road-close')).toHaveCount(0);
  await shots(page, info, 'last-room');
  await s.locator('[data-testid="evil-road-choice"][data-id="ra:nothing::"]').click();
  expect((await block(page)).reck.room.outcome).toBe('talked');
  await expect(s.locator('[data-testid="evil-road-choice"][data-id="roomDone"]')).toBeVisible();
  await shots(page, info, 'last-room-over');
  await s.locator('[data-testid="evil-road-choice"][data-id="roomDone"]').click();
  await expect(s.getByTestId('evil-roadpage')).toHaveCount(0);
  expect(errors).toEqual([]);
});
