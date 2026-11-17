import { expect, test, type Page } from '@playwright/test';

// Beta 0.7 Legendary Blessings: the blessing opening after the starter is chosen, and no screen at all with the setting off.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}
async function toStarter(page: Page, blessings: boolean, more = '') {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/?seed=e2e-blessing&campaign=dev&debug=1${more}`);
  await waitForScene(page, 'MainMenu');
  await page.evaluate((on) => { (window as any).__pkr.session.settings.expansion.blessingsEnabled = on; }, blessings);
  for (const key of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, key);
  }
}

test('a run with a blessing opens with the blessing screen, then the briefing and the map', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await toStarter(page, true);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Blessing');
  const info = await page.evaluate(() => { const b = (window as any).__pkr.session.run.expansion.blessing; return { id: b.id, seen: b.seen }; });
  expect(info.seen).toBe(false);
  await page.waitForTimeout(1200);
  await page.keyboard.press('Enter'); // finishes the sequence at once
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/blessing-opening.png' });
  expect(await scene(page)).toBe('Blessing');
  // The object picture (the species' signature item) loaded and is on screen.
  const item = await page.evaluate(() => { const p = (window as any).__pkr; const id = p.session.run.expansion.blessing.id; const key = `item.legend/${id}`; const sc = p.game.scene.getScene('Blessing'); return { loaded: p.game.textures.exists(key), shown: sc.children.list.some((o: any) => o.texture?.key === key && o.visible) }; });
  expect(item).toEqual({ loaded: true, shown: true });
  await page.keyboard.press('Enter'); // on to the briefing
  await waitForScene(page, 'Briefing');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.expansion.blessing.seen)).toBe(true);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Map');
  expect(errors).toEqual([]);
});

// What the opening draws: its text objects' fonts, and whether any drawn shape (the old spotlight and plinth) is left.
// (The screen-change wipe is a tall rectangle far above everything; it is not part of the scene's picture.)
const drawn = (page: Page) => page.evaluate(() => {
  const list = (window as any).__pkr.game.scene.getScene('Blessing').children.list as any[];
  return { fonts: [...new Set(list.filter((o) => o.type === 'Text').map((o) => String(o.style.fontFamily).split(',')[0]!.replace(/"/g, '')))], shapes: list.filter((o) => o.type === 'Graphics' || (o.type === 'Rectangle' && o.depth < 1000)).length };
});

test('the opening has no spotlight or plinth, and in the New look its text is in the skin font (the mock-ups\' own)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // Old look: the game's own pixel fonts.
  await toStarter(page, true);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Blessing');
  const old = await drawn(page);
  expect(old.shapes).toBe(0);
  expect(old.fonts.every((f) => f.startsWith('Pokemon'))).toBe(true);
  // New look: the chosen skin's font (Raiders: Pixelify Sans), and the next screen's canvas text is not affected.
  await toStarter(page, true, '&ui=new');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Blessing');
  const now = await drawn(page);
  expect(now.shapes).toBe(0);
  expect(now.fonts).toEqual(['Pixelify Sans']);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Briefing');
  expect(errors).toEqual([]);
});

test('with the setting off the starter goes straight to the briefing', async ({ page }) => {
  await toStarter(page, false);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Briefing');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.expansion?.blessing ?? null)).toBeNull();
});

test('a fresh profile has Blessings and Ultra Beasts on by default (settings v44)', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=e2e-blessing&campaign=dev&debug=1&legends=1');
  await waitForScene(page, 'MainMenu');
  const on = await page.evaluate(() => { const e = (window as any).__pkr.session.settings.expansion; return [e.blessingsEnabled, e.ultraBeastsEnabled, e.mythicalsEnabled]; });
  expect(on).toEqual([true, true, true]);
  for (const key of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Blessing']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, key);
  }
});

test("Zekrom's blessing asks for a vow on the opening screen before the briefing", async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await toStarter(page, true);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Blessing');
  // Swap the rolled blessing for Zekrom's and replay the opening.
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    Object.assign(pkr.session.run.expansion.blessing, { id: 'zekrom', tier: 'divine', seen: false });
    pkr.game.scene.getScene('Blessing').scene.restart();
  });
  await page.waitForTimeout(600);
  await page.keyboard.press('Enter'); // finishes the sequence
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter'); // shows the vows
  await page.waitForTimeout(300);
  expect(await scene(page)).toBe('Blessing');
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'test-results/blessing-zekrom-vow.png' });
  await page.keyboard.press('Enter'); // swears Strike no one first
  await waitForScene(page, 'Briefing');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.expansion.blessing.vow)).toBe('strike-no-one-first');
  expect(errors).toEqual([]);
});
