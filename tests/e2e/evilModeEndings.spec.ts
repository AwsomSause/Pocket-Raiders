import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// Evil Mode slice 15 ("the endings"), in the New look. Taps: from Heat 6 the Road page offers "Walk into the station";
// it begins Caught, which holds the screen (Esc doesn't leave it). Keys: every scene answered with Enter, the detective's
// line typed, the Ledger's last page and the cards, then the run-end page with the ending's name. The profile gains one
// Hall of Fame card. Screens at three sizes.

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

test('walk into the station: Caught holds the screen, the count is read, the run ends on its own page with one Hall card', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page);
  await setUp(page, 'b.team.heat = 6; b.fight = null;');
  const s = stage(page);
  await page.keyboard.press('o');
  await expect(s.getByTestId('evil-roadpage')).toHaveAttribute('data-mode', 'road');
  await s.locator('[data-testid="evil-road-choice"][data-id="pr:walkIn"]').click();
  expect((await block(page)).ending).toMatchObject({ id: 'caught', via: 'walkIn' });
  await expect(s.getByTestId('evil-roadpage')).toHaveAttribute('data-mode', 'ending');
  await expect(s.getByTestId('evil-road-close')).toHaveCount(0);
  await shots(page, info, 'courtroom');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('evil-roadpage')).toHaveAttribute('data-mode', 'ending');
  // Enter through the count to the detective's line.
  for (let i = 0; i < 60 && !(await page.getByTestId('evil-own-input').count()); i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(80);
  }
  const own = page.getByTestId('evil-own-input');
  await expect(own).toBeVisible();
  await own.fill('They kept the kettle on.');
  await own.press('Enter');
  const done = await block(page);
  expect(done.ending.done).toBe(true);
  expect(Object.values(done.ending.picks)).toContain('t:They kept the kettle on.');
  await expect(s.getByTestId('evil-road-body')).toContainText('They kept the kettle on.');
  await shots(page, info, 'last-page');
  await s.locator('[data-testid="evil-road-choice"][data-id="endDone"]').click();
  await waitForScene(page, 'GameOver');
  await page.waitForTimeout(300);
  await expect(page.locator('#rx')).toContainText('Caught');
  const hall = await page.evaluate(() => (window as any).__pkr.session.profile.evilHall);
  expect(hall).toHaveLength(1);
  expect(hall[0]).toMatchObject({ team: 'Kettle', ending: 'caught' });
  await shots(page, info, 'run-end');
  expect(errors).toEqual([]);
});
