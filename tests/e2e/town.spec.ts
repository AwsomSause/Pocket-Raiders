import { expect, test, type Page } from '@playwright/test';

// Pocket Town (W7): the Hub's Town tile opens the Town; you walk to a door and its panel opens, Esc is the Town directory, and the south gate comes back to the Hub.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

for (const size of [{ w: 1280, h: 720 }, { w: 390, h: 844 }]) {
  test(`Pocket Town opens, runs an action and returns at ${size.w}x${size.h}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: size.w, height: size.h });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto('/?debug=1');
    await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
    await page.evaluate(() => { (window as any).__pkr.game.scene.getScenes(true)[0].scene.start('Hub'); });
    await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('Hub');
    await page.waitForTimeout(300);
    // Pocket Town is through the gate at the top of Hub Town: the gate asks first ("Not yet" is focused).
    await page.evaluate(() => { (window as any).__pkr.game.scene.getScene('Hub').visit('pocket'); });
    await page.waitForTimeout(250);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('Town');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `test-results/town-${size.w}.png` });
    const town = (expr: string) => page.evaluate((e) => new Function('s', `return ${e}`)((window as any).__pkr.game.scene.getScene('Town')), expr);
    // Walking: hold Up from the entrance and the Pokémon moves north (on the Hub Town engine).
    const start = await town('s.town.tile()');
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(900);
    await page.keyboard.up('ArrowUp');
    expect((await town('s.town.tile()')).y).toBeLessThan(start.y);
    // A door: stand on the Training Dojo's doorstep, face it, press Z (Enter): its panel opens over the town.
    await page.evaluate(() => { const s = (window as any).__pkr.game.scene.getScene('Town'); s.town.moveTo(s.doorFor('dojo').stand); });
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    expect(await town('Boolean(s.picker)')).toBe(true);
    await page.screenshot({ path: `test-results/town-building-${size.w}.png` });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    expect(await town('Boolean(s.picker)')).toBe(false);
    // Esc opens the Town directory (the old list) and Esc closes it again.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    expect(await town('Boolean(s.picker)')).toBe(true);
    await page.screenshot({ path: `test-results/town-directory-${size.w}.png` });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    // The south arch asks first; "Go back to Hub Town" returns to the Hub.
    await page.evaluate(() => { const s = (window as any).__pkr.game.scene.getScene('Town'); s.town.moveTo(s.doorFor('hubgate').stand); });
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    expect(await town('Boolean(s.picker)')).toBe(true);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('Hub');
    // The session runs a town action and saves it: a radio broadcast waits as the next run's boon.
    const money = await page.evaluate(() => {
      const session = (window as any).__pkr.session;
      const r = session.town('radio-tune', { choice: 'trainer-tips' });
      return { ok: r.ok, boon: session.profile.town?.boon.money };
    });
    expect(money).toEqual({ ok: true, boon: 300 });
    expect(errors, errors.join('\n')).toEqual([]);
  });
}
