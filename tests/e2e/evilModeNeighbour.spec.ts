import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// Evil Mode slice 13 ("a neighbour"), in the New look. Keys only: the neighbour page (K) shows Giovanni at Wary and
// the five ticks; at the In person beat, a Sit-Down called, three exchanges answered with Enter, the Front taken, and
// up from the table. Taps only: the fruit basket on day 2 of the Arrival, sent back ("Wasteful.").

const stage = (page: Page) => view(page, 'Evil');
const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.evilMode);

async function founded(page: Page, at: number, days = 0) {
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
  await page.evaluate(({ at, days }) => {
    const p = (window as any).__pkr;
    p.session.evilFound({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm' }, at);
    const b = p.session.run.expansion.evilMode;
    for (const c of b.crew) c.line = null;
    // Whole days, ended beat by beat through the session (as the screen would).
    const ends = ['dismissOvernight', 'send', 'stayIn', 'callItADay', 'lightsOut', 'watchRoad'];
    for (let i = 0; i < days * 6; i++) p.session.evilStep({ type: ends[i % 6] });
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  }, { at, days });
  await waitForScene(page, 'Evil');
  await expect(stage(page).getByTestId('evil-map')).toBeVisible();
  await page.waitForTimeout(300);
}

async function shots(page: Page, info: { outputPath: (n: string) => string }, name: string) {
  for (const [w, h] of [[1280, 720], [960, 540], [740, 360]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    await page.screenshot({ path: info.outputPath(`${name}-${w}x${h}.png`) });
  }
}

test('keys only: Giovanni\'s page; a Sit-Down called, answered, the Front taken, and up from the table', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page, 4);
  const s = stage(page);
  await page.keyboard.press('KeyK');
  await expect(s.getByTestId('evil-nb-title')).toHaveText('Team Rocket · Giovanni');
  await expect(s.getByTestId('evil-nb-stance')).toHaveText('Wary');
  await expect(s.getByTestId('evil-nb-ticks')).toContainText('The reach');
  await expect(s.getByTestId('evil-nb-sit')).toHaveAttribute('data-open', 'false');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('evil-nb')).toHaveCount(0);
  // To the In person beat: Morning, then Send (Up wraps to "Send them").
  for (const k of ['Enter', 'ArrowUp', 'Enter']) {
    await page.keyboard.press(k);
    await page.waitForTimeout(150);
  }
  await expect(s.getByTestId('evil-beat-inPerson')).toHaveAttribute('data-state', 'now');
  await page.keyboard.press('KeyK');
  await expect(s.getByTestId('evil-nb-sit')).toHaveAttribute('data-open', 'true');
  // The Sit-Down row is first once no message is waiting.
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('evil-nb-sitting')).toContainText('Two chairs');
  // "It is now." / "Take the Front" / the first reason under the Creed.
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
  }
  expect((await block(page)).neighbour).toMatchObject({ stance: 'front' });
  await expect(s.getByTestId('evil-nb-rise')).toBeVisible();
  await shots(page, info, 'neighbour-table');
  await page.setViewportSize({ width: 1280, height: 720 });
  // Esc doesn't leave a Sit-Down; Up wraps to "Get up".
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('evil-nb-sitting')).toBeVisible();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  const b = await block(page);
  expect(b.neighbour.sitting).toBeNull();
  expect(b.neighbour.sitDowns).toHaveLength(1);
  await expect(s.getByTestId('evil-nb-stance')).toHaveText('Front');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('evil-nb')).toHaveCount(0);
  await expect(s.getByTestId('evil-nb-open')).toHaveAttribute('title', 'Rocket · Front');
  expect(errors).toEqual([]);
});

test('taps only: the fruit basket on day 2 of the Arrival, sent back', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page, 1, 1);
  const s = stage(page);
  await expect(s.getByTestId('evil-nb-open')).toBeVisible();
  await s.getByTestId('evil-nb-open').click();
  await expect(s.getByTestId('evil-nb-posts')).toContainText('Welcome to Kanto. — G.');
  await shots(page, info, 'neighbour-basket');
  await page.setViewportSize({ width: 1280, height: 720 });
  const back = s.locator('[data-testid^="evil-nb-post-"][data-testid$="-1"]').first();
  await back.click();
  await expect(s.getByTestId('evil-nb-said')).toContainText('Wasteful');
  expect((await block(page)).neighbour.opinion).toBe(-1);
  await expect(s.getByTestId('evil-nb-posts')).toContainText('(Send it back.)');
  await s.getByTestId('evil-nb-close').click();
  await expect(s.getByTestId('evil-nb')).toHaveCount(0);
  expect(errors).toEqual([]);
});
