// New UI: the mock-ups' shared screen templates (redux-explorer.js `T`), fed with live data. Each takes the look's
// layout number and a small model, and returns the stage HTML. Lists longer than a layout holds scroll with the cursor.

import type { ReduxCtx } from './stage';
import { act, type Area, B, esc, facts, H, hpb, icon, mini, tall, TX, W } from './kit';
import { rxImage, rxUrl } from './assets';

/** First row to show so `index` stays visible in a window of `size` rows out of `n`. */
export const scrollStart = (n: number, index: number, size: number): number => Math.max(0, Math.min(n - size, index - Math.floor(size / 2)));
/** The same for a grid `cols` wide: the window starts on a row boundary and still holds `index`, also at an uneven end. */
export const gridStart = (n: number, index: number, size: number, cols: number): number => scrollStart(Math.ceil(n / cols), Math.floor(index / cols), Math.max(1, Math.floor(size / cols))) * cols;
const dots = (n: number, start: number, size: number, st: string): string => (n > size ? `<div class="abs sm" style="${st}">${start > 0 ? '▲' : ''} ${start + 1}–${Math.min(n, start + size)} of ${n} ${start + size < n ? '▼' : ''}</div>` : '');

export interface MenuItem { label: string; note?: string; disabled?: boolean }
export interface MenuModel {
  title: string;
  area?: Area;
  hints?: readonly (readonly [string, string])[];
  items: MenuItem[];
  index: number;
  /** The window at the right (layout A): heading, body text, fact rows, an optional sprite file. */
  detail?: { title?: string; body?: string; facts?: readonly (readonly [string, string])[]; sprite?: string };
  /** The text box along the bottom. */
  text?: string;
  /** Page tabs, drawn at the right under the key hints; a click calls the `tab` handler. */
  tabs?: { labels: readonly string[]; index: number };
}

/** A strip of page tabs at the right, under the key hints. */
export const tabsBar = (labels: readonly string[], index: number): string => `<div class="abs tabs" style="right:24px;top:36px;z-index:3">${labels.map((t, k) => `<span class="${k === index ? 'on' : ''}"${act('tab', k)}>${esc(t)}</span>`).join('')}</div>`;

const pickAttr = (k: number): string => `${act('pick', k)} data-over="over"`;
const off = (h: string, disabled?: boolean): string => (disabled ? h.replace(/class="(btn|win)/, 'class="$1 off') : h);

/** The mock-ups' `menu` template: A list with a detail window, B two-column cards, C a carousel of three. */
export function menuView(c: ReduxCtx, d: MenuModel): string {
  const v = c.v(3), it = d.items, n = it.length, cur = it[d.index], text = TX(esc(d.text ?? '')) + (d.tabs ? tabsBar(d.tabs.labels, d.tabs.index) : '');
  const head = H(d.title, d.area ?? 'sys', d.hints);
  if (v === 1) {
    const s = gridStart(n, d.index, 8, 2);
    return head + `<div class="abs" style="left:24px;right:24px;top:70px;display:grid;grid-template-columns:1fr 1fr;gap:18px">${it.slice(s, s + 8).map((x, q) => off(W(`<b>${esc(x.label)}</b><div class="sm">${esc(x.note || 'Open')}</div>`, 'padding:9px 14px', s + q === d.index ? 'sel' : '', pickAttr(s + q)), x.disabled)).join('')}</div>` + dots(n, s, 8, 'right:28px;top:438px') + text;
  }
  if (v === 2) {
    const at = (k: number) => (k + n) % n, trio = n > 1 ? [at(d.index - 1), d.index, at(d.index + 1)] : [d.index];
    return head + `<div class="abs row" style="left:0;right:0;top:96px;justify-content:center;gap:24px">${trio.map((k) => { const x = it[k]!, mid = k === d.index; return off(W(`${d.detail?.sprite && mid ? mini(d.detail.sprite, 96) : ''}<b style="font-size:${mid ? 24 : 18}px">${esc(x.label)}</b><div class="sm">${esc(x.note ?? '')}</div>`, `width:${mid ? 300 : 210}px;height:${mid ? 240 : 180}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center`, mid ? '' : 'dim', pickAttr(k)), x.disabled); }).join('')}</div><div class="abs row" style="left:0;right:0;top:372px;justify-content:center;gap:8px">${it.map((_, k) => `<i style="width:${k === d.index ? 28 : 10}px;height:10px;border-radius:5px;background:var(--${k === d.index ? 'acc' : 'p2'})"></i>`).join('')}</div>` + text;
  }
  const s = scrollStart(n, d.index, 7), det = d.detail;
  return head + `<div class="abs col" style="left:24px;top:70px;width:380px;gap:9px">${it.slice(s, s + 7).map((x, q) => off(B(`<span style="min-width:0;overflow:hidden;text-overflow:ellipsis">${esc(x.label)}</span>`, s + q === d.index, '', esc(x.note ?? ''), pickAttr(s + q)), x.disabled)).join('')}</div>` + dots(n, s, 7, 'left:28px;top:432px') +
    `<div class="abs" style="left:436px;right:26px;top:74px">${W(`<div class="row">${det?.sprite ? mini(det.sprite, 64) : ''}<b class="acc" style="font-size:22px">${esc(det?.title ?? cur?.label ?? '')}</b></div><div style="line-height:23px;white-space:pre-line;max-height:300px;overflow:hidden">${esc(det?.body ?? cur?.note ?? '')}</div>${facts(det?.facts)}`, 'display:flex;flex-direction:column;gap:9px')}</div>` + text;
}

export interface SettingsModel {
  title: string;
  area?: Area;
  tabs: string[];
  tab: number;
  /** `value` empty draws a plain row (Back, an action). */
  rows: { label: string; value: string; disabled?: boolean }[];
  index: number;
  text: string;
  hints?: readonly (readonly [string, string])[];
}

/** The mock-ups' `settings` template: A tabs across the top, B tabs down the left. Seven rows show; the list scrolls. */
export function settingsView(c: ReduxCtx, d: SettingsModel): string {
  const v = c.v(2), n = d.rows.length, s = scrollStart(n, d.index, 7);
  const rows = d.rows.slice(s, s + 7).map((r, q) => `<div class="btn${s + q === d.index ? ' on' : ''}${r.disabled ? ' off' : ''}" style="height:38px"${pickAttr(s + q)}><span class="grow">${esc(r.label)}</span>${r.value ? `<span>◀ ${esc(r.value)} ▶</span>` : ''}</div>`).join('');
  const more = dots(n, s, 7, v === 1 ? 'right:28px;top:398px' : 'right:28px;top:428px');
  return H(d.title, d.area ?? 'sys', d.hints) + (v === 1
    ? `<div class="abs col" style="left:24px;top:72px;width:190px;gap:7px">${d.tabs.map((t, k) => B(esc(t), k === d.tab, 'height:34px;font-size:15px', '', act('tab', k))).join('')}</div><div class="abs col" style="left:240px;right:24px;top:72px;gap:8px">${rows}</div>`
    : `<div class="abs tabs" style="left:24px;top:62px">${d.tabs.map((t, k) => `<span class="${k === d.tab ? 'on' : ''}"${act('tab', k)}>${esc(t)}</span>`).join('')}</div><div class="abs col" style="left:24px;right:24px;top:102px;gap:8px">${rows}</div>`) + more + TX(esc(d.text));
}

/** A picture for a cell or a window: an animated atlas (no extension) or a plain image file, under assets/images. */
export interface Art { file: string; atlas: boolean; /** A plain picture that is a sheet of frames: the one frame to show, [x, y, w, h]. */ crop?: readonly [number, number, number, number]; /** Drawn this many times the usual height (a big story portrait beside the usual Trainer pictures). */ k?: number }
/** A person or a picture standing `px` tall: a trainer atlas plays its pose, a plain picture is scaled. */
export function figure(a: Art | null | undefined, size: number): string {
  if (!a) return '';
  const px = Math.round(size * (a.k ?? 1));
  if (a.atlas) return tall(a.file, px);
  const dim = rxImage(a.file);
  if (dim && a.crop) {
    const [x, y, w, h] = a.crop, k = px / h;
    return `<i class="im" style="display:block;width:${Math.round(w * k)}px;height:${px}px;background:url(${rxUrl(a.file)}) ${-Math.round(x * k)}px ${-Math.round(y * k)}px/${Math.round(dim[0] * k)}px ${Math.round(dim[1] * k)}px;image-rendering:pixelated"></i>`;
  }
  return dim ? `<i class="im" style="display:block;width:${Math.round((dim[0] * px) / dim[1])}px;height:${px}px;background:url(${rxUrl(a.file)}) 0 0/100% 100%;image-rendering:pixelated"></i>` : '';
}
/**
 * A big story portrait, drawn from one frame of its sheet at the mock-ups' scale: `unit` of the page's figure scale
 * (3.4 on a talk page beside a figure 240 tall). `sunk`: a cutscene card stands its figure this many pixels under the
 * card's bottom edge, so those rows of the frame are left off.
 */
export function portrait(file: string, frame: number, unit: number, scale = 3.4, sunk = 0, base = 240): Art {
  const rows = frame - sunk / (scale * unit);
  return { file, atlas: false, crop: [0, 0, frame, rows], k: (rows * scale * unit) / base };
}
/** The player as the mock-ups draw them (0.8 of the figure scale): Look A's or Look B's ready pose. */
export const playerPortrait = (look: 'a' | 'b', scale = 3.4, sunk = 0, base = 240): Art => portrait(`packs/mc/look_${look}/${look === 'a' ? 'command' : 'throw'}.png`, 128, 0.8, scale, sunk, base);
export const pic = (a: Art | null | undefined, size: number, cls = ''): string => (a ? (a.atlas ? mini(a.file, size, cls) : icon(a.file, size)) : '');

export interface GridCell { art?: Art | null; label: string; off?: boolean; sil?: boolean }
export interface GridModel {
  title: string;
  area?: Area;
  hints?: readonly (readonly [string, string])[];
  n: number;
  /** Cell i; only the cells on screen are asked for. */
  cell: (i: number) => GridCell;
  index: number;
  detail: { title: string; sub?: string; body?: string; facts?: readonly (readonly [string, string])[]; art?: Art | null };
  /** The "Found a / b" bar (layout A). */
  found: number;
  total: number;
  foundLabel?: string;
  text: string;
}
/** Columns the cursor moves across in the grid template for this look. */
export const gridCols = (c: Pick<ReduxCtx, 'v'>): number => (c.v(2) === 1 ? 5 : 6);

/** The mock-ups' `grid` template: A a detail window, the Found bar and a 6 x 3 wall of cells; B 5 x 2 picture cards. */
export function gridView(c: ReduxCtx, d: GridModel): string {
  const head = H(d.title, d.area ?? 'hub', d.hints), n = d.n;
  if (c.v(2) === 1) {
    const s = Math.floor(scrollStart(n, d.index, 10) / 5) * 5;
    return head + `<div class="abs" style="left:24px;right:24px;top:70px;display:grid;grid-template-columns:repeat(5,1fr);gap:14px">${Array.from({ length: Math.min(10, n - s) }, (_, q) => { const i = s + q, r = d.cell(i); return W(`<div class="cell${r.off ? ' off' : ''}" style="width:92px;height:92px;background:#0000">${pic(r.art, 84, r.sil ? 'sil' : '') || (r.off ? '?' : '')}</div><b style="font-size:14px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.label)}</b>`, 'display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px;min-width:0', i === d.index ? 'sel' : '', pickAttr(i)); }).join('')}</div>` + dots(n, s, 10, 'right:28px;top:438px') + TX(esc(d.text));
  }
  const s = Math.floor(scrollStart(n, d.index, 18) / 6) * 6, det = d.detail;
  return head + `<div class="abs col" style="left:24px;top:74px;width:264px;gap:16px">${W(`<div class="row">${pic(det.art, 56)}<b class="acc" style="font-size:20px">${esc(det.title)}</b></div>${det.sub ? `<b style="font-size:14px">${esc(det.sub)}</b>` : ''}<div class="sm" style="line-height:20px;max-height:${det.facts?.length ? 100 : 160}px;overflow:hidden">${esc(det.body ?? '')}</div>${facts(det.facts)}`, 'display:flex;flex-direction:column;gap:8px')}${W(`<div class="row"><span class="grow">${esc(d.foundLabel ?? 'Found')}</span><b>${d.found}</b><span>/ ${d.total}</span></div>${hpb(d.total ? Math.round((d.found / d.total) * 100) : 0, 0, ' gold')}`, 'display:flex;flex-direction:column;gap:8px')}</div><div class="abs" style="left:316px;right:24px;top:72px;display:grid;grid-template-columns:repeat(6,1fr);gap:10px">${Array.from({ length: Math.min(18, n - s) }, (_, q) => { const i = s + q, r = d.cell(i); return `<div class="cell${r.off ? ' off' : ''}${i === d.index ? ' sel' : ''}"${pickAttr(i)}>${pic(r.art, 76, r.sil ? 'sil' : '') || `<span style="font-size:13px;font-weight:700;text-align:center;padding:4px;overflow:hidden">${r.off && !r.label ? '?' : esc(r.label)}</span>`}</div>`; }).join('')}${n < 18 ? '<div class="cell off">?</div>'.repeat(18 - n) : ''}</div>` + dots(n, s, 18, 'right:28px;top:392px') + TX(esc(d.text));
}

/** A board row (quests, chains, tasks): a title, a line under it, an optional progress bar (0 to 100) and a state tag. */
export interface BoardRow { title: string; sub: string; tag?: string; pct?: number | null; off?: boolean; art?: Art | null }
export interface BoardModel {
  title: string;
  area: Area;
  rows: BoardRow[];
  index: number;
  /** The text box along the bottom. */
  text: string;
  hints?: readonly (readonly [string, string])[];
}

/** How many rows a board shows at once: six cards in two columns, or five rows in one (the mock-ups' two layouts). */
export const boardSize = (c: Pick<ReduxCtx, 'v'>): number => (c.v(2) === 1 ? 6 : 5);

/**
 * A count written as a tag ("2/5", "2 of 5", "40%") as the mock-ups draw it: a progress bar, a state word for the tag
 * and the count in words for the line under the title. Null when the tag is anything else.
 */
export function boardProgress(tag: string): { pct: number; state: 'New' | 'Active' | 'Done'; count: string } | null {
  const t = tag.trim();
  const frac = /^(\d+)\s*(?:\/|of)\s*(\d+)$/i.exec(t);
  const cent = /^(\d+(?:\.\d+)?)\s*%$/.exec(t);
  if (!frac && !cent) return null;
  if (frac && Number(frac[2]) === 0) return null;
  const pct = Math.max(0, Math.min(100, Math.round(frac ? (Number(frac[1]) / Number(frac[2])) * 100 : Number(cent![1]))));
  const full = frac ? Number(frac[1]) >= Number(frac[2]) : pct >= 100;
  const none = frac ? Number(frac[1]) === 0 : pct <= 0;
  return { pct: full ? 100 : pct, state: full ? 'Done' : none ? 'New' : 'Active', count: frac ? `${frac[1]} of ${frac[2]}` : `${pct}%` };
}

/** The mock-ups' `board` template. A list longer than one screen scrolls with the focused row and says where it is. */
export function boardView(c: ReduxCtx, d: BoardModel): string {
  const grid = c.v(2) === 1, n = d.rows.length;
  // A long text box (three lines or more) grows up over the last row of the one-column list: show one row fewer then.
  const size = boardSize(c) - (!grid && Math.ceil(d.text.length / 76) >= 3 ? 1 : 0);
  const index = Math.max(0, Math.min(n - 1, d.index));
  // The two-column layout scrolls a whole line (two cards) at a time.
  const from = grid ? gridStart(n, index, size, 2) : scrollStart(n, index, size);
  const shown = d.rows.slice(from, from + size);
  const pct = (r: BoardRow, w: number): string => (r.pct !== null && r.pct !== undefined ? hpb(Math.max(0, Math.min(100, r.pct)), w, ' gold') : '');
  const tag = (r: BoardRow, lit: boolean): string => (r.tag ? `<span class="tg${lit ? '' : ' no'}">${esc(r.tag)}</span>` : '');
  const attr = (k: number): string => `${act('pick', from + k)} data-over="over"`;
  const cls = (r: BoardRow, k: number): string => (from + k === index ? 'sel' : r.off ? 'dim' : '');
  const empty = n ? '' : '<div class="abs cen" style="left:0;right:0;top:220px;display:flex;font-size:26px;opacity:.6">Nothing here yet</div>';
  const body = grid
    ? `<div class="abs" style="left:24px;right:24px;top:70px;display:grid;grid-template-columns:1fr 1fr;gap:18px">${shown.map((r, k) => W(`<div class="row">${pic(r.art ?? null, 30)}<b class="grow" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.title)}</b>${tag(r, from + k === index)}</div><div class="sm" style="line-height:19px;max-height:38px;overflow:hidden">${esc(r.sub)}</div>${pct(r, 0)}`, 'display:flex;flex-direction:column;gap:6px;padding:10px 14px;min-width:0', cls(r, k), attr(k))).join('')}</div>`
    : `<div class="abs col" style="left:24px;right:24px;top:72px;gap:15px">${shown.map((r, k) => W(`${pic(r.art ?? null, 36)}<div class="col grow" style="gap:4px;min-width:0"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.title)}</b><span class="sm" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.sub)}</span></div>${pct(r, 150)}${tag(r, from + k === index)}`, 'display:flex;align-items:center;gap:14px;padding:9px 16px', cls(r, k), attr(k))).join('')}</div>`;
  return H(d.title, d.area, d.hints) + body + empty + dots(n, from, size, grid ? 'right:28px;top:438px' : 'right:28px;top:446px') + TX(esc(d.text));
}
