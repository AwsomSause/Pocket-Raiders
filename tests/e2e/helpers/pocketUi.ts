import { expect, type Page } from '@playwright/test';

// Shared steps for the Pocket look's browser specs. The Pocket look is drawn on its own HTML layer (#pkx) over the
// canvas; these specs open the game with `?ui=pocket` (an automated browser gets Old otherwise).

/** A scene's Pocket view, optionally the one showing mock-up page `id`. */
export const pkView = (page: Page, key: string, id?: string) => page.locator(`#pkx .pks[data-scene="${key}"]${id ? `[data-scr="${id}"]` : ''}:not([data-ghost])`);

/** Waits until a scene's Pocket view shows mock-up page `id` (its rules and fonts load the first time). */
export async function onPkPage(page: Page, key: string, id: string) {
  await expect(pkView(page, key, id)).toBeVisible({ timeout: 15_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
}

/** Title to a new run's stage map by the keys (every step of starting a run takes Enter). */
export async function toPocketMap(page: Page) {
  for (let n = 0; n < 40 && (await page.evaluate(() => (window as any).__pkr.activeScene())) !== 'Map'; n++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.activeScene()), { timeout: 20_000 }).toBe('Map');
  // A new region opens on its region page: Set off closes it.
  await page.waitForTimeout(400);
  if (await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').rxRegion)) await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
  await page.waitForTimeout(400);
}

/**
 * Text that is cut off or runs off the screen in a scene's Pocket view (Kice: no text cut off, nothing cramped).
 * Measured on the 960 x 540 Pocket stage whatever the window size. Decorations (`data-nocheck`, `aria-hidden`) are left out.
 */
export async function pkFitProblems(page: Page, key: string, id?: string): Promise<string[]> {
  return page.evaluate(([key, id]) => {
    const S = document.querySelector<HTMLElement>(`#pkx .pks[data-scene="${key}"]${id ? `[data-scr="${id}"]` : ''}:not([data-ghost])`);
    if (!S) return ['no Pocket view'];
    const box = S.getBoundingClientRect(), k = box.width / 960, res: string[] = [];
    if (Math.abs(box.width / box.height - 960 / 540) > 0.01) res.push(`STAGE ${Math.round(box.width)}x${Math.round(box.height)}`);
    for (const el of S.querySelectorAll<HTMLElement>('*')) {
      if (el.closest('[data-nocheck],[aria-hidden=true]')) continue;
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
      if (r[0]! < -2 || r[1]! < -2 || r[2]! > 962 || r[3]! > 542) res.push(`OFFSCREEN "${txt}" [${r.join(',')}]`);
      // Text wider or taller than the part that holds it, where that part cuts it.
      for (let p: HTMLElement | null = el; p && p !== S; p = p.parentElement) {
        const ps = getComputedStyle(p);
        if (ps.overflowX === 'visible' && ps.overflowY === 'visible') continue;
        const pr = p.getBoundingClientRect();
        if ((ps.overflowX !== 'visible' && (L < pr.left - 2 * k || R > pr.right + 2 * k)) || (ps.overflowY !== 'visible' && (T < pr.top - 3 * k || B > pr.bottom + 3 * k))) { res.push(`CUT "${txt}" by .${p.className.split(' ').join('.')}`); break; }
      }
    }
    return res;
  }, [key, id] as const);
}
