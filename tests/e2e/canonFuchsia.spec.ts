import { expect, test, type Page } from '@playwright/test';

// Fuchsia canon: Safari Land is a plain event (money, flags, a wild fight).

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

async function toMap(page: Page) {
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
}

test('the Fuchsia Safari Land event is plain data: it costs money and starts a wild fight', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=safari-e2e');
  await waitForScene(page, 'MainMenu');
  await toMap(page);
  const ev = await page.evaluate(() => {
    const events = (window as any).__pkr.session.content.events;
    const list = Array.isArray(events) ? events : [...(events?.values?.() ?? [])];
    const e = list.find((x: any) => x.id === 'cs-kanto-fuchsia-safari');
    return e ? { kinds: e.choices[0].success.effects.map((f: any) => f.kind), battle: e.choices[0].success.battle?.kind } : null;
  });
  expect(ev).toEqual({ kinds: ['money', 'flag', 'flag'], battle: 'wild' });
  expect(errors).toEqual([]);
});
