// Phantom UI: pages that belong to no one screen. The run log (mock-up `log`) reads back what was said, chosen and
// gained in this run, over whatever screen is open; the quick wheel (mock-up `wheel`) is the map's ring of shortcuts.
// Pure functions from a model to HTML. Presentation only: nothing here reads or changes game state.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import { act, esc, keys, page } from '../kit';

// ---------- Run log ----------

export interface PhLogRow {
  /** Who spoke, or the row's heading ("Stage 3", "Event"); empty for a plain note. */
  who: string;
  text: string;
  kind: 'say' | 'pick' | 'gain' | 'stage' | 'note';
}

export interface PhLogModel {
  /** The line over the title: where the log was opened. */
  where: string;
  /** Oldest first. */
  rows: readonly PhLogRow[];
  /** The lit row, and the first row drawn. */
  cursor: number;
  top: number;
}

/** The room the rows have (the mock-up's column), and how tall a row of this many letters stands. */
export const LOG_ROOM = 500;
export const logRowHeight = (r: PhLogRow): number => 32 + 28 * Math.max(1, Math.ceil(r.text.length / (r.kind === 'gain' ? 96 : 74)));

/**
 * Which rows are drawn: from `top` for as many as fit, moved so the lit row is among them. Returns the first row and
 * one past the last. A row taller than the room is still drawn alone.
 */
export function logWindow(rows: readonly PhLogRow[], top: number, cursor: number, room = LOG_ROOM): { top: number; end: number } {
  const n = rows.length;
  if (!n) return { top: 0, end: 0 };
  const at = Math.max(0, Math.min(n - 1, cursor));
  const fill = (from: number): number => {
    let h = 0, k = from;
    while (k < n && (k === from || h + logRowHeight(rows[k]!) <= room)) h += logRowHeight(rows[k++]!);
    return k;
  };
  let t = Math.max(0, Math.min(n - 1, top));
  if (at < t) t = at;
  while (fill(t) <= at) t += 1;
  // No empty room under the last row while there are rows above.
  while (t > 0 && fill(t - 1) === n) t -= 1;
  return { top: t, end: fill(t) };
}

const EMPTY = 'Nothing yet. What is said, chosen and gained in this run is kept here.';

export function phLog(_ph: PhantomVersion, d: PhLogModel): string {
  const n = d.rows.length, w = logWindow(d.rows, d.top, d.cursor), at = Math.max(0, Math.min(n - 1, d.cursor));
  const row = (r: PhLogRow, k: number): string => `<div class="lr ph-lr${r.kind === 'pick' ? ' pick' : r.kind === 'gain' ? ' gain' : r.kind === 'stage' ? ' ph-lr-st' : ''}${k === at ? ' on' : ''}" data-key="lr${k}" style="--i:${k - w.top}"${act('logAt', k)}>`
    + `<b>${esc(r.who)}</b><p class="txt">${r.kind === 'pick' ? '<i>You chose</i> ' : ''}${esc(r.text)}</p></div>`;
  const rows = n ? d.rows.slice(w.top, w.end).map((r, k) => row(r, w.top + k)).join('') : `<div class="lr ph-lr" style="--i:0"><b></b><p class="txt">${EMPTY}</p></div>`;
  // The bar's thumb: which part of the log is on the page.
  const thumb = n ? `top:${((w.top / n) * 100).toFixed(1)}%;height:${Math.max(6, ((w.end - w.top) / n) * 100).toFixed(1)}%` : 'top:0;height:100%';
  return page('log', '<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(97.5% 0,100% 0,100% 100%,96% 100%);inset:0" aria-hidden="true"></div>'
    + `<div class="ph-fill"${act('log')}></div>`
    + `<div class="hd"><small>${esc(d.where)}</small>Log</div>`
    + `<div class="lg ph-lg">${rows}</div>`
    + `<div class="lg-bar ph-lg-bar" aria-hidden="true"><i style="${thumb};bottom:auto"></i></div>`
    + (n ? `<div class="ph-lg-n">${at + 1} / ${n}</div>` : '')
    + keys(['▲▼', 'Scroll'], ['Q E', 'Page'], ['X', 'Close', 'log']));
}

// ---------- Quick wheel ----------

export interface PhWheelItem { label: string; note: string; off?: boolean }

export interface PhWheelModel {
  items: readonly PhWheelItem[];
  index: number;
  /** True while TAB is held (let go to open); false when the wheel was opened by a tap or a click (Enter opens). */
  held: boolean;
  /** Steps the pointer has turned since the wheel opened, so the needle goes the short way round (default: `index`). */
  spin?: number;
}

/** The slot a direction key points to: one step along the shorter way toward that side of the ring. */
export function wheelStep(index: number, n: number, dir: 'up' | 'right' | 'down' | 'left'): number {
  if (n < 2) return 0;
  const pole = Math.round((['up', 'right', 'down', 'left'].indexOf(dir) * n) / 4) % n;
  const at = ((index % n) + n) % n, ahead = (pole - at + n) % n;
  if (ahead === 0) return at;
  return ahead <= n - ahead ? (at + 1) % n : (at + n - 1) % n;
}

/** The quick wheel, to lie over the map page (`phInto`). The slots stand evenly round the ring, the first at the top. */
export function phWheel(d: PhWheelModel): string {
  const n = Math.max(1, d.items.length), on = d.items[d.index];
  const items = d.items.map((x, k) => `<div class="wi ph-wi${k === d.index ? ' on' : ''}${x.off ? ' off' : ''}" data-key="wi${k}" style="--i:${k};--a:${(k * 360) / n - 90}deg"${act('wheel', k, 'wheelOver')}><b>${esc(x.label)}</b></div>`).join('');
  return `<div class="ph-wh" data-key="wheel"><div class="ph-wh-dim"${act('wheel', -1)}></div><div class="burst" style="--x:50%;--y:49%" aria-hidden="true"></div>`
    + `<div class="wh-ring" aria-hidden="true"></div><div class="ph-wh-needle" aria-hidden="true" style="rotate:${(((d.spin ?? d.index) * 360) / n - 90).toFixed(1)}deg"><i></i></div>`
    + `<div class="wh">${items}</div>`
    + `<div class="wh-c ph-wh-c" data-key="whc${d.index}"><span class="lab">${on?.off ? 'Not yet' : d.held ? 'Let go to open' : 'Enter to open'}</span><h3 class="tl1" style="font-size:${(on?.label.length ?? 0) > 9 ? 44 : 62}px">${esc(on?.label ?? '')}</h3><p class="txt">${esc(on?.note ?? '')}</p></div>`
    + '<div class="wh-hint ph-wh-hint">Hold <kbd>TAB</kbd> on the map, point, and let go.</div>'
    + keys(['▲▼◀▶', 'Point'], d.held ? ['TAB', 'Release to go', 'wheel', d.index] : ['Enter', 'Open', 'wheel', d.index], ['Esc', 'Close', 'wheel', -1])
    + '</div>';
}
