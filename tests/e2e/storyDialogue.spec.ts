import { expect, test, type Page } from '@playwright/test';
import { confirmToMenu } from './battleInput';

// Text box redesign (Kice's pick, mockup #5): a trainer line dims the battle, slides in the
// Story Portrait box, types out, and closes on confirm. With animations off it shows at once.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}
const lineUp = (page: Page) =>
  page.evaluate(() => {
    const c = (window as any).__pkr.game.scene.getScene('Battle').children.getByName('story-line');
    if (!c) return null;
    const out: string[] = [];
    const walk = (o: any) => {
      if (typeof o.text === 'string') out.push(o.text);
      o.list?.forEach(walk);
    };
    walk(c);
    return out.join('|');
  });

async function toBattle(page: Page, settings: Record<string, unknown>) {
  await page.goto('/');
  await page.evaluate((s) => {
    localStorage.clear();
    localStorage.setItem('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 12, savedAt: '', data: { muted: true, ...s } }));
  }, settings);
  await page.goto('/?seed=e2e-story-dialogue&debug=1');
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  await confirmToMenu(page);
}

for (const anim of ['full', 'off'] as const) {
  test(`a trainer line shows in the Story Portrait box (animations ${anim})`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await toBattle(page, { battleAnimations: anim });
    await page.evaluate(() => {
      (window as any).__said = (window as any).__pkr.game.scene.getScene('Battle').speak('Cynthia', 'Hmm... [p=300]show me EVERYTHING!', 'calm').then(() => ((window as any).__said = 'done'));
    });
    await expect.poll(() => lineUp(page)).toContain('CYNTHIA');
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter'); // finishes the typing (or closes, when it already finished)
    await expect.poll(() => lineUp(page).then((t) => t ?? 'Hmm... show me EVERYTHING!')).toContain('Hmm... show me EVERYTHING!');
    await page.screenshot({ path: `test-results/story-line-${anim}.png` });
    for (let i = 0; i < 3 && (await lineUp(page)); i++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(400);
    }
    await expect.poll(() => page.evaluate(() => (window as any).__said)).toBe('done');
    expect(await lineUp(page)).toBeNull();
    expect(errors).toEqual([]);
  });
}
