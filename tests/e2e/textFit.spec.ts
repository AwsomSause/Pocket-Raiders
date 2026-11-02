import { expect, test, type Page } from '@playwright/test';
import { fitIssues } from './helpers/textFit';

// Visits screens at desktop and phone-landscape size, screenshots each (test-results/textfit/) and fails on text that
// leaves the canvas, overlaps other text, or spills out of its panel. Known leftovers go in KNOWN, with a reason.
const SIZES = [{ w: 1280, h: 720 }, { w: 844, h: 390 }];
const SCREENS = ['MainMenu', 'Settings', 'SaveSlots', 'Hub', 'TrainerSelect', 'Memories', 'LegacyGallery', 'HallOfFame', 'Credits'];
// Known leftovers (each with its reason). Remove a line when its fix lands.
const KNOWN: RegExp[] = [
  /^StarterSelect#\d: overlap "Lv 5 moves/, // fitted by the mobile overhaul PR (#623)
  /^Battle#\d: offscreen/, // the fighters are still sliding in
];
const known = (line: string) => KNOWN.some((re) => re.test(line));

const active = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

for (const size of SIZES) {
  test(`text fits on screens at ${size.w}x${size.h}`, async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: size.w, height: size.h });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/?debug=1');
    await expect.poll(() => active(page), { timeout: 30_000 }).toBe('MainMenu');
    const found: string[] = [];
    for (const key of SCREENS) {
      await page.evaluate((k) => (window as any).__pkr.game.scene.getScenes(true)[0].scene.start(k), key).catch(() => undefined);
      await page.waitForTimeout(900);
      const now = await active(page);
      if (now !== key) { found.push(`${key}: did not open (active: ${now})`); await page.evaluate(() => (window as any).__pkr.game.scene.getScenes(true)[0]?.scene.start('MainMenu')); await page.waitForTimeout(500); continue; }
      await page.screenshot({ path: `test-results/textfit/${size.w}-${key}.png` });
      for (const i of await fitIssues(page)) { const line = `${key}: ${i.kind} "${i.text}"${i.other ? ` / "${i.other}"` : ''} (${i.detail})`; if (!known(line)) found.push(line); }
    }
    console.log(found.join('\n'));
    expect(found).toEqual([]);
    expect(errors).toEqual([]);
  });
}

// A run crawl: Enter through Hub -> prep -> starters -> map -> fights, sweeping each scene a few times along the way.
for (const size of SIZES.slice(0, 1)) {
  test(`text fits along a run at ${size.w}x${size.h}`, async ({ page }) => {
    test.setTimeout(420_000);
    await page.setViewportSize({ width: size.w, height: size.h });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/?seed=textfit&debug=1');
    await expect.poll(() => active(page), { timeout: 30_000 }).toBe('MainMenu');
    const found: string[] = [];
    const seen = new Map<string, number>();
    for (let step = 0; step < 70; step++) {
      const key = (await active(page)) ?? 'none';
      const n = seen.get(key) ?? 0;
      if (n < 3 && step % 2 === 0) {
        seen.set(key, n + 1);
        await page.waitForTimeout(700);
        await page.screenshot({ path: `test-results/textfit/${size.w}-run-${key}-${n}.png` });
        for (const i of await fitIssues(page)) { const line = `${key}#${n}: ${i.kind} "${i.text}"${i.other ? ` / "${i.other}"` : ''} (${i.detail})`; if (!known(line) && !found.includes(line)) found.push(line); }
      }
      await page.keyboard.press('Enter');
      await page.waitForTimeout(450);
    }
    console.log(`scenes swept: ${[...seen.keys()].join(', ')}\n${found.join('\n')}`);
    expect(found).toEqual([]);
    expect(errors).toEqual([]);
  });
}
