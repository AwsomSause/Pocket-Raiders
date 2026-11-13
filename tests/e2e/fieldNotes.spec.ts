import { expect, test, type Page } from '@playwright/test';

// Beta 0.6: Field Notes is a pop-up on the map (F opens, F closes). Tabs change with the arrow keys; entries show what has been met.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}
const named = (page: Page, name: string) =>
  page.evaluate((name) => {
    const s = (window as any).__pkr.game.scene.getScene('Map');
    const all: any[] = [];
    const walk = (list: any[]) => list.forEach((o) => (all.push(o), o.list && walk(o.list)));
    walk(s.children.list);
    return all.filter((o) => o.name === name).length;
  }, name);

for (const size of [{ width: 1280, height: 720 }, { width: 800, height: 600 }]) {
  test(`Field Notes opens, switches tab and closes on the map (${size.width}x${size.height})`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.setViewportSize(size);
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/?seed=fieldnotes-e2e');
    await waitForScene(page, 'MainMenu');
    for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
      await page.keyboard.press('Enter');
      await waitForScene(page, next);
    }
    await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
    // Put the run in Kanto, with one special Pokémon met, one Named Shadow at hint 2 and Data ROM K.
    await page.evaluate(() => {
      const pkr = (window as any).__pkr;
      const run = pkr.session.run;
      run.regionOrder[run.regionIndex] = 'kanto';
      run.expansion = {
        ...(run.expansion ?? {}),
        grandArc: { roms: ['K'], late: [], stock: [1], left: [] },
        fieldNotes: { special: ['sv.rocket.roadblock', 'sv.rocket.ledger'], shadow: { 'ss.rocket.amberjack': 2 } },
      };
      pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
    });
    await waitForScene(page, 'Map');
    await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
    expect(await named(page, 'field-notes')).toBe(0);
    await page.keyboard.press('f');
    await page.waitForTimeout(250);
    expect(await named(page, 'field-notes')).toBe(1);
    await page.screenshot({ path: `test-results/field-notes-special-${size.width}.png` });
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await page.screenshot({ path: `test-results/field-notes-shadow-${size.width}.png` });
    expect(await named(page, 'field-pip-on')).toBe(2);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    await page.screenshot({ path: `test-results/field-notes-rom-${size.width}.png` });
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    await page.screenshot({ path: `test-results/field-notes-keys-${size.width}.png` });
    await page.keyboard.press('f');
    await page.waitForTimeout(200);
    expect(await named(page, 'field-notes')).toBe(0);
    expect(errors).toEqual([]);
  });
}
