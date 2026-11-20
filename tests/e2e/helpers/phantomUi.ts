import { expect, type Page } from '@playwright/test';

// Shared steps for the Phantom UI browser specs. The Phantom UI is drawn on its own HTML layer (#phx) over the
// canvas; these specs open the game with `?ui=phantom` (an automated browser gets Old otherwise).

/** A scene's Phantom view. */
export const pview = (page: Page, key: string, id?: string) => page.locator(`#phx .phs[data-scene="${key}"]${id ? `[data-scr="${id}"]` : ''}`);

/** Title to a new run's stage map by the keys (every step of starting a run takes Enter). */
export async function toPhantomMap(page: Page) {
  for (let n = 0; n < 40 && (await page.evaluate(() => (window as any).__pkr.activeScene())) !== 'Map'; n++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.activeScene()), { timeout: 20_000 }).toBe('Map');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
  await page.waitForTimeout(400);
}

/** Waits until a scene's Phantom view shows mock-up page `id` (its rules and fonts load the first time). */
export async function onPage(page: Page, key: string, id: string) {
  await expect(page.locator(`#phx .phs[data-scene="${key}"][data-scr="${id}"]`)).toBeVisible({ timeout: 15_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
}

/**
 * Text that is cut off or runs off the screen in a scene's Phantom view (Kice: no text cut off, nothing cramped).
 * Measured on the 1280 x 720 Phantom stage whatever the window size. Decorations (`aria-hidden`) are left out, and
 * so is the small live screen in Settings (a shrunken copy of another page).
 */
export async function fitProblems(page: Page, key: string, id?: string): Promise<string[]> {
  return page.evaluate(([key, id]) => {
    // A scene can have several views open over each other (a room over the dock): `id` picks the one showing that page.
    const S = document.querySelector<HTMLElement>(`#phx .phs[data-scene="${key}"]${id ? `[data-scr="${id}"]` : ''}`);
    if (!S) return ['no Phantom view'];
    const box = S.getBoundingClientRect(), k = box.width / 1280, res: string[] = [];
    for (const el of S.querySelectorAll<HTMLElement>('*')) {
      if (el.closest('[aria-hidden=true],.pv-st,.wipe')) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
      const nodes = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent!.trim());
      if (!nodes.length) continue;
      const txt = nodes.map((n) => n.textContent!.trim()).join(' ').slice(0, 30);
      const rg = document.createRange();
      let L = 1e9, T = 1e9, R = -1e9, B = -1e9;
      for (const n of nodes) { rg.selectNodeContents(n); for (const q of rg.getClientRects()) { L = Math.min(L, q.left); T = Math.min(T, q.top); R = Math.max(R, q.right); B = Math.max(B, q.bottom); } }
      if (R < L) continue;
      const r = [(L - box.left) / k, (T - box.top) / k, (R - box.left) / k, (B - box.top) / k].map(Math.round);
      if (r[0]! < -2 || r[1]! < -2 || r[2]! > 1282 || r[3]! > 722) res.push(`OFFSCREEN "${txt}" [${r.join(',')}]`);
      if (el.scrollWidth > el.clientWidth + 2 && cs.overflowX !== 'visible') res.push(`CLIPPED-X "${txt}"`);
      if (el.scrollHeight > el.clientHeight + 4 && cs.overflowY !== 'visible' && cs.display !== 'inline') res.push(`CLIPPED-Y "${txt}"`);
    }
    return res;
  }, [key, id] as const);
}
