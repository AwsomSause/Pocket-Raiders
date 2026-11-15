// New UI: the mock-ups' shared screen templates (redux-explorer.js `T`), fed with live data. Each takes the look's
// layout number and a small model, and returns the stage HTML. Lists longer than a layout holds scroll with the cursor.

import type { ReduxCtx } from './stage';
import { act, type Area, B, esc, facts, H, mini, TX, W } from './kit';

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
}

const pickAttr = (k: number): string => `${act('pick', k)} data-over="over"`;
const off = (h: string, disabled?: boolean): string => (disabled ? h.replace(/class="(btn|win)/, 'class="$1 off') : h);

/** The mock-ups' `menu` template: A list with a detail window, B two-column cards, C a carousel of three. */
export function menuView(c: ReduxCtx, d: MenuModel): string {
  const v = c.v(3), it = d.items, n = it.length, cur = it[d.index], text = TX(esc(d.text ?? ''));
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
  return head + `<div class="abs col" style="left:24px;top:70px;width:380px;gap:9px">${it.slice(s, s + 7).map((x, q) => off(B(esc(x.label), s + q === d.index, '', esc(x.note ?? ''), pickAttr(s + q)), x.disabled)).join('')}</div>` + dots(n, s, 7, 'left:28px;top:432px') +
    `<div class="abs" style="left:436px;right:26px;top:74px">${W(`<div class="row">${det?.sprite ? mini(det.sprite, 64) : ''}<b class="acc" style="font-size:22px">${esc(det?.title ?? cur?.label ?? '')}</b></div><div style="line-height:23px">${esc(det?.body ?? cur?.note ?? '')}</div>${facts(det?.facts)}`, 'display:flex;flex-direction:column;gap:9px')}</div>` + text;
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
