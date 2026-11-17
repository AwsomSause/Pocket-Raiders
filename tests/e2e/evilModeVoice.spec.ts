import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// Evil Mode slice 18 ("the voice"), in the New look. The Morning shows the Radio, the paper and an envelope. Keys: P opens
// the post, Enter opens the letter, Down to an answer and Enter answers it, Esc closes. Taps: the Post tag opens it again,
// the letter's in the drawer the next day. A bark's bubble shows over the board. Screens at three sizes; no console errors.

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

// An Officer (the first person in) left holding the district behind; their letter (Nerve, number 15) on today's Board;
// the Radio and the paper for today.
const LETTER = `const c = b.crew.find((x) => x.where === 'in'); c.where = 'away'; c.talent = 'nerve';
  b.region.past.push({ district: { ...b.district, n: 1 }, leftWith: c.id });
  b.here.beat = 'morning'; b.fight = null;
  b.voice.radio = [{ day: b.here.day, id: 'badge:brock', args: { town: 'Pewter', leader: 'Brock', count: '1' } }];
  b.voice.paper = [{ day: b.here.day, id: 'guess:nothing', args: {} }];
  b.voice.inbox = [{ id: 'P1', what: 'officer:15', who: c.id, args: { name: c.name, town: 'Pewter' }, made: b.here.day, due: b.here.day, day: b.here.day, opened: false, steamed: true, pinned: false, answer: null, left: false }];`;

test('the voice: the Radio, the paper and a letter on the Board; open and answer it by keys, by taps', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page);
  await setUp(page, LETTER);
  const s = stage(page);
  const text = s.getByTestId('evil-text');
  await expect(text).toContainText('Boulder Badge');
  await expect(text).toContainText('QUIET WEEK');
  await expect(text).toContainText('from Pewter');
  await expect(text).toContainText('steamed');
  await expect(s.getByTestId('evil-bark')).toBeVisible();
  await shots(page, info, 'morning');

  // Keys: P opens the post; Enter opens the letter.
  await page.keyboard.press('KeyP');
  const pageEl = s.getByTestId('evil-postpage');
  await expect(pageEl).toBeVisible();
  await expect(s.getByTestId('evil-post-today')).toHaveAttribute('data-opened', 'false');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('evil-post-today')).toHaveAttribute('data-opened', 'true');
  await expect(s.getByTestId('evil-post-text')).toContainText('come back in a year');
  // Every letter fits one screen: the text sits inside the page at the smallest size.
  await page.setViewportSize({ width: 740, height: 360 });
  await page.waitForTimeout(250);
  const box = await s.getByTestId('evil-post-text').boundingBox();
  const body = await s.getByTestId('evil-postpage').boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(body!.y + body!.height + 1);
  await page.setViewportSize({ width: 1280, height: 720 });
  await shots(page, info, 'letter');

  // Down twice to "Train him." and Enter.
  const before = await block(page);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const after = await block(page);
  expect(after.voice.inbox[0].answer).toBe(2);
  expect(after.voice.flags).toContain('trainedLad');
  expect(after.given).toBe(before.given + 1);
  await expect(s.getByTestId('evil-post-today')).toContainText('Answered');

  // Esc closes; a tap on the Post tag opens it again.
  await page.keyboard.press('Escape');
  await expect(pageEl).toBeHidden();
  await s.getByTestId('evil-post-open').click();
  await expect(pageEl).toBeVisible();
  await expect(s.getByTestId('evil-post-radio')).toContainText('Brock');
  await s.locator('[data-testid="evil-post-act"][data-code="close"]').click();
  await expect(pageEl).toBeHidden();
  expect(errors).toEqual([]);
});
