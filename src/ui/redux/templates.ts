// New UI: the mock-ups' shared screen templates (redux-explorer.js `T`), fed with live data. Each takes the look's
// layout number and a small model, and returns the stage HTML. Lists longer than a layout holds scroll with the cursor.

import type { ReduxCtx } from './stage';
import { act, type Area, B, esc, facts, H, hpb, icon, mini, TX, W } from './kit';

/** First row to show so `index` stays visible in a window of `size` rows out of `n`. */
export const scrollStart = (n: number, index: number, size: number): number => Math.max(0, Math.min(n - size, index - Math.floor(size / 2)));
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
    const s = scrollStart(n, d.index, 8) & ~1;
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
  return H(d.title, 'sys', d.hints) + (v === 1
    ? `<div class="abs col" style="left:24px;top:72px;width:190px;gap:7px">${d.tabs.map((t, k) => B(esc(t), k === d.tab, 'height:34px;font-size:15px', '', act('tab', k))).join('')}</div><div class="abs col" style="left:240px;right:24px;top:72px;gap:8px">${rows}</div>`
    : `<div class="abs tabs" style="left:24px;top:62px">${d.tabs.map((t, k) => `<span class="${k === d.tab ? 'on' : ''}"${act('tab', k)}>${esc(t)}</span>`).join('')}</div><div class="abs col" style="left:24px;right:24px;top:102px;gap:8px">${rows}</div>`) + more + TX(esc(d.text));
}

/** A picture for a cell or a window: an animated atlas (no extension) or a plain image file, under assets/images. */
export interface Art { file: string; atlas: boolean }
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
  return head + `<div class="abs col" style="left:24px;top:74px;width:264px;gap:16px">${W(`<div class="row">${pic(det.art, 56)}<b class="acc" style="font-size:20px">${esc(det.title)}</b></div>${det.sub ? `<b style="font-size:14px">${esc(det.sub)}</b>` : ''}<div class="sm" style="line-height:20px;max-height:${det.facts?.length ? 100 : 160}px;overflow:hidden">${esc(det.body ?? '')}</div>${facts(det.facts)}`, 'display:flex;flex-direction:column;gap:8px')}${W(`<div class="row"><span class="grow">${esc(d.foundLabel ?? 'Found')}</span><b>${d.found}</b><span>/ ${d.total}</span></div>${hpb(d.total ? Math.round((d.found / d.total) * 100) : 0, 0, ' gold')}`, 'display:flex;flex-direction:column;gap:8px')}</div><div class="abs" style="left:316px;right:24px;top:72px;display:grid;grid-template-columns:repeat(6,1fr);gap:10px">${Array.from({ length: Math.min(18, n - s) }, (_, q) => { const i = s + q, r = d.cell(i); return `<div class="cell${r.off ? ' off' : ''}${i === d.index ? ' sel' : ''}"${pickAttr(i)}>${pic(r.art, 76, r.sil ? 'sil' : '') || `<span style="font-size:13px;font-weight:700;text-align:center;padding:4px;overflow:hidden">${r.off && !r.label ? '?' : esc(r.label)}</span>`}</div>`; }).join('')}${n < 18 ? '<div class="cell off">?</div>'.repeat(18 - n) : ''}</div>` + dots(n, s, 18, 'left:28px;top:438px') + TX(esc(d.text));
}
