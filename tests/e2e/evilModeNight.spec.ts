import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// Evil Mode slice 7 ("the Night"): the Office in the New look. Keys only: a knock at the door is answered, the reply and
// what moved are read, someone's heard out, and the lamp's put out. Taps only: "(Not tonight.)", then the Wall, where a
// thing taken down leaves a gap. No Loyalty is ever shown as a figure.

const stage = (page: Page) => view(page, 'Evil');
const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.evilMode);

async function atNight(page: Page, patch = '') {
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
  await page.evaluate((patch) => {
    const p = (window as any).__pkr;
    p.session.evilFound({ name: 'Kettle', creed: 'belonging', line: 'grey', doctrine: 'swarm' });
    for (const type of ['dismissOvernight', 'send', 'stayIn', 'callItADay']) p.session.evilStep({ type });
    if (patch) new Function('b', patch)(p.session.run.expansion.evilMode);
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  }, patch);
  await waitForScene(page, 'Evil');
  await expect(stage(page).getByTestId('evil-night')).toBeVisible();
  await page.waitForTimeout(300);
}

test('keys only: answer the knock, read what moved, hear someone out, lights out', async ({ page }, info) => {
  const errors = watch(page);
  await atNight(page);
  const s = stage(page);
  const b0 = await block(page);
  expect(b0.here.beat).toBe('night');
  expect([1, 2]).toContain(b0.night.knock.n);
  await expect(s.getByTestId('evil-door')).toBeVisible();
  await expect(s.locator('[data-testid^="evil-answer-"]')).toHaveCount(4);
  await expect(s.getByTestId('evil-answer-3')).toHaveText('(Not tonight.)');
  for (const [w, h] of [[1280, 720], [960, 540], [740, 360]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    await page.screenshot({ path: info.outputPath(`office-${w}x${h}.png`) });
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  // Down twice: the third answer. Enter: their reply. Enter: what moved. Enter: they go.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('evil-reply')).toBeVisible();
  await page.keyboard.press('Enter');
  await page.screenshot({ path: info.outputPath('reply.png') });
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('evil-reply')).toHaveCount(0);
  const b1 = await block(page);
  expect(b1.night.knock).toBeNull();
  expect(b1.night.echoes.at(-1)).toMatchObject({ n: b0.night.knock.n, answer: 2 });
  expect(b1.log.at(-1).kind).toBe('knock');
  // The desk: Hear someone out (Enter), the first person (Enter). It moves nothing.
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('evil-hear-person').first()).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('evil-night-said')).toBeVisible();
  const b2 = await block(page);
  expect(b2.crew).toEqual(b1.crew);
  expect(b2.night.actedOn).toBe(b2.here.day);
  expect(await s.getByTestId('evil-night').innerText()).not.toMatch(/loyalty\s*\d/i);
  // Up wraps to Lights out.
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await block(page)).here.beat).toBe('hero');
  expect(errors).toEqual([]);
});

test('taps only: "(Not tonight.)", then the Wall, where taking something down leaves a gap', async ({ page }, info) => {
  const errors = watch(page);
  await atNight(page, "b.night.wall = [{ item: 'mug', day: 1, down: null }, { item: 'crayon', day: 1, down: null }, { item: 'summons', day: 1, down: null }];");
  const s = stage(page);
  await s.getByTestId('evil-answer-3').click();
  await s.getByTestId('evil-reply-next').click();
  await s.getByTestId('evil-reply-next').click();
  const b1 = await block(page);
  expect(b1.night.sleptThrough).toBe(1);
  await s.getByTestId('evil-desk-wall').click();
  await expect(s.getByTestId('evil-wall-item')).toHaveCount(3);
  await expect(s.getByTestId('evil-wall-state')).toHaveText('Kept all of it');
  await s.getByTestId('evil-wall-item').nth(1).click();
  await s.getByTestId('evil-wall-down').click();
  await expect(s.getByTestId('evil-wall-gap')).toHaveCount(1);
  await expect(s.getByTestId('evil-wall-item')).toHaveCount(2);
  await expect(s.getByTestId('evil-wall-state')).toHaveText('Took down the kind ones');
  await page.screenshot({ path: info.outputPath('wall-gap.png') });
  const b2 = await block(page);
  expect(b2.night.wall).toHaveLength(3);
  expect(b2.night.wall[1].down).toBe(b2.here.day);
  expect(errors).toEqual([]);
});
