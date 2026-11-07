import { expect, test, type Page } from '@playwright/test';
import { confirmUntil } from './battleInput';

// Overhaul slice 9: the first Hyper moment stops the battle with an explanation that needs Continue; it shows only once.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}
const explainUp = (page: Page) => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').children.list.some((o: any) => o.name === 'hyper-explain'));

test('the first Hyper moment explains itself and waits for Continue; the second one does not', async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?debug=1');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?debug=1');
  await waitForScene(page, 'MainMenu');
  // Same seed as milestone8_9: the first fatal hit is survived by Toughened It Out.
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    session.profile.attributes = { ...session.profile.attributes, love: 100 };
    session.newRun('red', 'e2e-hyper-16');
    session.chooseStarter(0);
    const stage = session.run.stage;
    const first = stage.map.nodes.filter((n: any) => n.column === 1).find((n: any) => !n.harder) ?? stage.map.nodes.find((n: any) => n.column === 1);
    session.chooseNode(first.id);
    session.debugReplaceEnemy('machamp', 80);
    game.scene.getScenes(true)[0].scene.start('Battle');
  });
  await waitForScene(page, 'Battle');
  await page.waitForTimeout(1500);
  for (let i = 0; i < 6 && (await page.evaluate(() => (window as any).__pkr.session.run.battle?.turn)) === 1; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
  }
  await confirmUntil(page, () => explainUp(page), 30_000);
  // Rapid pressing and Esc right away do not dismiss it, and the explanation is not marked as read.
  // (Sent in one page call: separate key presses can take longer than the 1.2 s read lock on a slow runner.)
  const stillUp = await page.evaluate(() => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    for (let i = 0; i < 4; i++) b.explainWait?.('confirm');
    b.explainWait?.('back');
    return b.children.list.some((o: any) => o.name === 'hyper-explain');
  });
  expect(stillUp).toBe(true);
  expect(await page.evaluate(() => (window as any).__pkr.session.profile.hyperExplained)).toEqual([]);
  const text = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').children.list.find((o: any) => o.name === 'hyper-explain').list.filter((o: any) => o.type === 'Text').map((o: any) => o.text).join('\n'));
  expect(text).toContain('HYPER: Toughened It Out!');
  expect(text).toContain('It survives the hit with 1 HP.');
  await page.screenshot({ path: 'test-results/hyper-explain.png' });
  // After the read lock, Enter continues and the explanation is remembered.
  await page.waitForTimeout(1600);
  await page.keyboard.press('Enter');
  await expect.poll(() => explainUp(page)).toBe(false);
  expect(await page.evaluate(() => (window as any).__pkr.session.profile.hyperExplained)).toEqual(['family:hyper', 'kind:endure']);
  expect(errors).toEqual([]);
});
