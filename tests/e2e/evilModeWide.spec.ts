import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// Evil Mode on wide and tall windows: no page of the Board (the Board itself, the Ledger, the Roster, the File, the
// Line, the Gym, Trade, the Scheme, the Base, the Road) may scroll or slide sideways, at any size.

const SIZES = [[2560, 1080], [1920, 1080], [1440, 900], [1280, 720], [1024, 1366], [740, 360]] as const;
const PAGES = ['ledger-open', 'roster-open', 'file-open', 'line-open', 'gym-open', 'trade-open', 'sc-open', 'base-open', 'road-open'];

async function toEvil(page: Page) {
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
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.evilFound({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm' }, 2);
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  });
  await waitForScene(page, 'Evil');
  await page.waitForTimeout(300);
}

const sideways = (page: Page) => page.evaluate(() => {
  const d = document.documentElement;
  const before = window.scrollX;
  window.scrollTo(10_000, window.scrollY);
  const moved = window.scrollX !== before;
  window.scrollTo(0, window.scrollY);
  const stage = document.querySelector('#rx .stage') as HTMLElement | null;
  const r = stage?.getBoundingClientRect();
  // Anything inside the layer scrolled sideways (a clipped box scrolled by focus or by a wheel slides the page).
  const slid = [...document.querySelectorAll('#rx, #rx *')].filter((e) => (e as HTMLElement).scrollLeft > 0 && getComputedStyle(e).overflowX !== 'auto' && getComputedStyle(e).overflowX !== 'scroll').map((e) => (e as HTMLElement).dataset.testid ?? e.className);
  return { scroll: d.scrollWidth > window.innerWidth + 1 || document.body.scrollWidth > window.innerWidth + 1, moved, outside: !!r && (r.left < -1 || r.right > window.innerWidth + 1), slid };
});

test('Evil Mode pages never slide sideways, from a phone to a wide screen', async ({ page }, info) => {
  test.setTimeout(300_000);
  const errors = watch(page);
  await toEvil(page);
  const s = view(page, 'Evil');
  for (const [w, h] of SIZES) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    expect(await sideways(page), `Board at ${w}x${h}`).toEqual({ scroll: false, moved: false, outside: false, slid: [] });
    // Every page tab is on screen: the tab strip doesn't overflow (so none is hidden off the edge).
    const strip = await s.getByTestId('evil-tabs').evaluate((e) => {
      const row = e.parentElement!.getBoundingClientRect();
      const r = e.getBoundingClientRect();
      return { over: Math.max(r.right - row.right, row.left - r.left) };
    });
    expect(strip.over, `tab strip overflows at ${w}x${h}`).toBeLessThanOrEqual(1);
    // Every page at the widest, a common desktop, and a phone (the Board itself at all six).
    if (![2560, 1920, 740].includes(w)) continue;
    for (const id of PAGES) {
      const tab = s.getByTestId(`evil-${id}`);
      if (!(await tab.count())) continue;
      await tab.first().click();
      await page.waitForTimeout(150);
      for (const k of ['ArrowRight', 'ArrowRight', 'ArrowDown', 'Tab', 'Tab']) await page.keyboard.press(k);
      await page.mouse.wheel(400, 0);
      await page.waitForTimeout(100);
      expect(await sideways(page), `${id} at ${w}x${h}`).toEqual({ scroll: false, moved: false, outside: false, slid: [] });
      if (w === 1920) await page.screenshot({ path: info.outputPath(`${id}-${w}x${h}.png`) });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
      if (await s.getByTestId(`evil-${id}`).count() && (await page.evaluate(() => document.querySelector('[data-testid="evil-map"]') === null))) await tab.first().click().catch(() => {});
    }
  }
  expect(errors).toEqual([]);
});
