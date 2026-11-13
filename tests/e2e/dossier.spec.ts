import { expect, test, type Page } from '@playwright/test';

// Beta 0.6 E1: the Dossier is a pop-up on the map (D opens, Esc closes). It only appears once the run has met someone from the cast.

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

test('Dossier opens, switches person and closes on the map', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=e1-dossier-e2e');
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  // Track has not moved: T does nothing.
  await page.keyboard.press('d');
  await page.waitForTimeout(200);
  expect(await named(page, 'dossier')).toBe(0);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    run.regionOrder[run.regionIndex] = 'kanto';
    const t = (id: string, status: string) => [id, { status, metAt: 3 }];
    run.expansion = { ...(run.expansion ?? {}), dossier: Object.fromEntries([t('sc.rocket.matori', 'at large'), t('sc.rocket.triad-sabrina', 'at large'), t('sc.rocket.triad-surge', 'at large'), t('sc.rocket.triad-koga', 'beaten'), t('sc.rocket.vesper', 'turned'), t('sc.rocket.blaine', 'ally'), t('sc.rocket.madame-boss', 'at large'), t('sc.aqua.amber', 'at large')]) };
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Map');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
  await page.keyboard.press('d');
  await page.waitForTimeout(400);
  expect(await named(page, 'dossier')).toBe(1);
  const caseTitle = () => page.evaluate(() => {
    const s = (window as any).__pkr.game.scene.getScene('Map');
    const all: any[] = [];
    const walk = (list: any[]) => list.forEach((o) => (all.push(o), o.list && walk(o.list)));
    walk(s.children.list);
    return all.find((o) => typeof o.text === 'string' && o.text.startsWith('CASE:'))?.text ?? '';
  });
  const first = await caseTitle();
  expect(first).toMatch(/^CASE: /);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);
  const second = await caseTitle();
  expect(second).not.toBe(first);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  expect(await caseTitle()).not.toBe(second);
  await page.screenshot({ path: 'test-results/e1-dossier.png' });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(await named(page, 'dossier')).toBe(0);
  expect(errors).toEqual([]);
});
