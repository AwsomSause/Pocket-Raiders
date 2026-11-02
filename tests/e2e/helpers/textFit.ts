import type { Page } from '@playwright/test';

/** One problem found on a screen: text that leaves the canvas, overlaps other text, or spills out of its panel. */
export interface FitIssue { kind: 'offscreen' | 'overlap' | 'spill'; text: string; other?: string; detail: string }

/** Runs inside the page: walks every Phaser Text of the active scenes and reports fit problems (canvas is 960x540). */
export async function fitIssues(page: Page): Promise<FitIssue[]> {
  return page.evaluate(() => {
    const game = (window as any).__pkr.game;
    const W = game.scale.gameSize.width, H = game.scale.gameSize.height;
    type R = { x: number; y: number; w: number; h: number };
    const inter = (a: R, b: R) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    const texts: { t: any; b: R; s: string; scroll: boolean; order: number }[] = [];
    const panels: R[] = [];
    const covers: { b: R; order: number }[] = [];
    let order = 0;
    const shown = (o: any): boolean => {
      for (let p = o; p; p = p.parentContainer) if (!p.visible || p.alpha < 0.05) return false;
      return true;
    };
    // Walks in drawing order (lower depth first, then list order) so a later opaque picture counts as covering earlier text.
    const walk = (list: any[], scroll = false) => {
      const sorted = list.map((o, i) => ({ o, i })).sort((a, b) => (a.o.depth ?? 0) - (b.o.depth ?? 0) || a.i - b.i).map((e) => e.o);
      for (const o of sorted) {
        order++;
        if (o.list) walk(o.list, scroll || !!o.mask);
        if (!shown(o)) continue;
        if (o.type === 'Text') {
          const s = String(o.text ?? '').trim();
          if (!s || o.scaleX < 0.05) continue;
          const b = o.getBounds();
          if (b.width < 2 || b.height < 2) continue;
          texts.push({ t: o, b: { x: b.x, y: b.y, w: b.width, h: b.height }, s, scroll, order });
        } else if (['Rectangle', 'NineSlice', 'Image', 'Sprite', 'TileSprite'].includes(o.type) && o.width > 20 && o.height > 14) {
          const b = o.getBounds();
          if (o.alpha >= 0.85 && !o.mask) covers.push({ b: { x: b.x, y: b.y, w: b.width, h: b.height }, order });
          if (o.type === 'Rectangle' || o.type === 'NineSlice') {
            if (b.width * b.height < W * H * 0.45 && o.alpha >= 0.5 && (o.fillAlpha ?? 1) >= 0.5) panels.push({ x: b.x, y: b.y, w: b.width, h: b.height });
          }
        }
      }
    };
    for (const sc of game.scene.getScenes(true)) walk(sc.children.list.filter((o: any) => o.name !== 'notice-stack'));
    // Text drawn under a big opaque picture is not on screen (a style's backdrop hides the original layout).
    const hidden = (t: { b: R; order: number }) => covers.some((c) => c.order > t.order && c.b.w * c.b.h > 3000 && inter(c.b, t.b) > t.b.w * t.b.h * 0.9);
    const out: any[] = [];
    const keep = new Map<any, any[]>();
    const add = (issue: any, ...ts: any[]) => { out.push(issue); keep.set(issue, ts); };
    const live = texts.filter((t) => !hidden(t));
    const short = (s: string) => s.replace(/\s+/g, ' ').slice(0, 50);
    for (const { b, s, scroll, t } of live) {
      if (scroll || !/[\p{L}\p{N}]/u.test(s)) continue;
      const over = Math.max(-b.x, -b.y, b.x + b.w - W, b.y + b.h - H);
      if (over > 3) add({ kind: 'offscreen', text: short(s), detail: `${Math.round(over)}px outside the canvas` }, t);
    }
    for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
      const a = live[i]!, c = live[j]!;
      if (a.s === c.s || a.scroll !== c.scroll || !/[\p{L}\p{N}]/u.test(a.s) || !/[\p{L}\p{N}]/u.test(c.s)) continue;
      const ov = inter(a.b, c.b);
      const small = Math.min(a.b.w * a.b.h, c.b.w * c.b.h);
      if (ov > small * 0.2 && ov > 40) add({ kind: 'overlap', text: short(a.s), other: short(c.s), detail: `${Math.round((ov / small) * 100)}% of the smaller text` }, a.t, c.t);
    }
    // Spill: the smallest panel that holds the text's centre but not all of its box.
    for (const { b, s, t } of live) {
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      let best: R | null = null;
      for (const p of panels) if (cx >= p.x && cx <= p.x + p.w && cy >= p.y && cy <= p.y + p.h && (!best || p.w * p.h < best.w * best.h)) best = p;
      if (!best || best.w * best.h < b.w * b.h) continue;
      const spill = Math.max(best.x - b.x, best.y - b.y, b.x + b.w - (best.x + best.w), b.y + b.h - (best.y + best.h));
      if (spill > 4) add({ kind: 'spill', text: short(s), detail: `${Math.round(spill)}px past its panel` }, t);
    }
    if (!out.length) return out;
    // A text counts only if it really changes the picture: freeze the game, draw it with and without the text, compare pixels.
    // (Some looks keep the original layout under an opaque layer, which scene-graph bounds cannot see.)
    game.loop.sleep();
    const snap = (b: R): Promise<Uint8ClampedArray> => new Promise((res) => {
      const x = Math.max(0, Math.floor(b.x)), y = Math.max(0, Math.floor(b.y));
      const w = Math.max(1, Math.min(W - x, Math.ceil(b.w))), h = Math.max(1, Math.min(H - y, Math.ceil(b.h)));
      game.renderer.snapshotArea(x, y, w, h, (img: HTMLImageElement) => {
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const g = c.getContext('2d')!; g.drawImage(img, 0, 0);
        res(g.getImageData(0, 0, w, h).data);
      });
      game.step(performance.now(), 0);
    });
    const visible = async (t: any): Promise<boolean> => {
      const gb = t.getBounds();
      const b = { x: gb.x, y: gb.y, w: gb.width, h: gb.height };
      const on = await snap(b);
      const was = t.alpha; t.alpha = 0;
      const off = await snap(b);
      t.alpha = was;
      let diff = 0;
      for (let i = 0; i < on.length; i += 4) if (Math.abs(on[i]! - off[i]!) + Math.abs(on[i + 1]! - off[i + 1]!) + Math.abs(on[i + 2]! - off[i + 2]!) > 40) diff++;
      return diff > 6;
    };
    return (async () => {
      const real: any[] = [];
      const cache = new Map<any, boolean>();
      try {
        for (const issue of out) {
          let all = true;
          for (const t of keep.get(issue)!) {
            if (!cache.has(t)) cache.set(t, await visible(t));
            if (!cache.get(t)) all = false;
          }
          if (all) real.push(issue);
        }
      } finally { game.loop.wake(); }
      return real;
    })();
  });
}
