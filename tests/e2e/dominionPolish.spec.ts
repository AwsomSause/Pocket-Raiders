import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D26 (round-4 polish + re-key): every Dominion screen wears the v4 Nova livery (sigil + crimson
// underlight), every key strip starts with Q (the hold-Q command wheel, D28), Q does nothing else anywhere, the Crew
// File pages on the arrow keys, and End saves and quits to the title. Looks and keys only: the block is unchanged.

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
  return s;
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);
const scene = (page: Page) => page.evaluate(() => (window as any).__pkr.game.scene.getScenes(true).map((x: any) => x.scene.key).join(','));

test('round 4: Nova livery on every screen, Q is free, arrows page the Crew File, End quits to the title', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  const s = await newDominion(page);

  // The title card: the sigil sits in the centre (mockup s0).
  await expect(s.locator('.sig4.c')).toHaveCount(1);
  await expect(s.locator('.vl4')).toHaveCount(1);
  await shot('s0-title');
  await s.getByTestId('dom-title-0').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-type-poison').click();
  await s.getByTestId('dom-type-dark').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-next').click();
  for (let i = 0; i < 4; i++) await s.getByTestId('dom-opening').click();
  await expect(s.getByTestId('dom-phase')).toHaveText('EVENING');

  // The HQ: livery on, and the title banner wears the Nova eye (its ::before is the slit eye, not the old diamond).
  await expect(s.locator('.sig4')).toHaveCount(1);
  await expect(s.locator('.vl4')).toHaveCount(1);
  const edge = await s.locator('.st').first().evaluate((e) => getComputedStyle(e).getPropertyValue('--blood').trim());
  expect(edge).toBe('#c2183a');
  await shot('s1-hq');

  // Boundary: Q on the HQ does nothing (no page, no step).
  const before = await block(page);
  await page.keyboard.press('KeyQ');
  await page.waitForTimeout(200);
  expect(await block(page)).toEqual(before);
  await expect(s.getByTestId('dom-phase')).toHaveText('EVENING');

  // The Crew File: Q Wheel leads the key strip, Q does nothing, C/H/R still work, arrows page members.
  await page.keyboard.press('Digit3');
  await expect(s.getByTestId('dom-file-keys')).toContainText('Card');
  await expect(s.locator('.keys .q4')).toHaveText('Q');
  await page.keyboard.press('KeyH');
  await s.getByTestId('dom-hire-0').click();
  await expect(s.getByTestId('dom-notice')).toContainText('joined');
  await page.keyboard.press('Escape');
  for (let n = (await block(page)).crew.talks.length; n > 0; n--) {
    await s.getByTestId('dom-talk-0').click();
    await expect.poll(async () => (await block(page)).crew.talks.length).toBe(n - 1);
  }
  const b = await block(page);
  expect(b.members).toHaveLength(2);
  const fileName = s.locator('.keys .dm').first();
  const first = (await fileName.textContent()) ?? '';
  await page.keyboard.press('KeyQ');
  await page.waitForTimeout(200);
  await expect(fileName).toHaveText(first);
  await expect(async () => {
    if (((await fileName.textContent()) ?? '') === first) await page.keyboard.press('ArrowRight');
    await expect(fileName).not.toHaveText(first, { timeout: 1500 });
  }).toPass({ timeout: 15_000 });
  await shot('s5-crew-file');
  await expect(async () => {
    if (!(await s.getByTestId('dom-persona-name').count())) await page.keyboard.press('KeyC');
    await expect(s.getByTestId('dom-persona-name')).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 15_000 });
  await expect(s.locator('.keys .q4')).toHaveText('Q');
  await expect(view(page, 'Dominion')).not.toContainText(/Claude|\bAI\b/);
  await shot('k3-card');
  await page.keyboard.press('Escape');

  // The Crew File at three window sizes: the sigil stays on the stage.
  for (const [w, h] of [[1280, 720], [960, 540], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await expect(s.locator('.sig4')).toBeVisible();
    await shot(`crew-${w}x${h}`);
  }

  // End: save and quit to the title from any page; Continue comes back to the same block.
  const saved = await block(page);
  await page.keyboard.press('End');
  await waitForScene(page, 'MainMenu');
  expect(await scene(page)).toContain('MainMenu');
  await page.goto('/?ui=new');
  await waitForScene(page, 'MainMenu');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.continueRun();
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  });
  await waitForScene(page, 'Dominion');
  expect(await block(page)).toEqual(saved);
  expect(errors).toEqual([]);
});
