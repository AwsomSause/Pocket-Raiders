// New UI dock, ported from the mock-ups' `hub` template (three layouts by theme): the place's name and chips on top,
// a line-up of Pokémon and people standing on the ground line, and the dock of buttons (centred row, left column,
// or a grid). Used by the Plaza (its districts) and the hub's dock screens. The scene keeps the cursor and the input.

import { act, B, esc, foot, mon, tall } from '../kit';
import { rxAtlas } from '../assets';
import type { ReduxCtx } from '../stage';
import { figure, type Art } from '../templates';

export interface DockButton { label: string; small?: string; off?: boolean }
export interface DockModel {
  town: string;
  chips: string[];
  tabs: string[];
  tab: number;
  buttons: DockButton[];
  index: number;
  /** Who stands on the ground line, centre first then alternating right and left. `scale` 1 is the sprite's own size. */
  lineup: { art: Art; scale: number }[];
  /** A speech bubble over the line-up ('' for none). */
  say: string;
  /** The small line about the focused button. */
  note: string;
  hints: readonly (readonly [string, string])[];
}

export function dockView(c: ReduxCtx, d: DockModel): string {
  const v = c.v(3), n = d.buttons.length;
  const gy = v === 1 ? 420 : 318, cx = v === 1 ? 600 : 480;
  const stand = (a: { art: Art; scale: number }): string => {
    if (!a.art.atlas) return figure(a.art, Math.round(84 * a.scale));
    const at = rxAtlas(a.art.file);
    return at ? tall(a.art.file, Math.round(at.sh * a.scale)) : mon(a.art.file, a.scale);
  };
  const line = `<div class="abs" style="left:0;right:0;top:${gy}px;height:${540 - gy}px;background:var(--p);border-top:5px solid var(--f)"></div>` + d.lineup.slice(0, v === 1 ? 11 : 13).map((a, r) => foot(cx + (r % 2 ? 1 : -1) * Math.ceil(r / 2) * 58, gy + 4, stand(a), `z-index:${40 - r}`)).reverse().join('');
  const tabs = d.tabs.length ? `<div class="tabs">${d.tabs.map((t, k) => `<span class="${k === d.tab ? 'on' : ''}"${act('tab', k)}>${esc(t)}</span>`).join('')}</div>` : '';
  const top = `<div class="abs row" style="left:20px;right:20px;top:14px;gap:8px"><b style="font-size:24px;text-shadow:2px 2px 0 var(--l)">${esc(d.town)}</b><span class="grow"></span>${d.chips.map((t, k) => `<span class="tg${k ? ' no' : ''}">${esc(t)}</span>`).join('')}</div>`;
  const say = d.say ? `<div class="abs txt" style="left:${v === 1 ? 280 : 200}px;right:${v === 1 ? 40 : 200}px;top:64px;bottom:auto;font-size:15px;line-height:20px;padding:10px 16px;z-index:50">${esc(d.say)}</div>` : '';
  const pick = (k: number): string => `${act('pick', k)} data-over="over"`;
  const dim = (b: DockButton): string => (b.off ? 'opacity:.5;' : '');
  const keys = d.hints.map(([k, t]) => `<kbd>${esc(k)}</kbd>${esc(t)}`).join(' ');
  if (v === 1) {
    const h = n > 7 ? 36 : 0;
    return top + line + say + `<div class="abs col" style="left:20px;top:64px;width:220px;gap:${n > 7 ? 6 : 8}px">${tabs}${d.buttons.map((b, k) => B(esc(b.label), k === d.index, dim(b) + (k === d.index ? `height:${h ? 46 : 56}px;font-size:${h ? 18 : 21}px` : h ? `height:${h}px;font-size:15px` : ''), esc(b.small ?? ''), pick(k))).join('')}</div><div class="abs sm" style="left:260px;right:20px;top:${gy + 16}px;line-height:18px;color:var(--wink)">${esc(d.note)}</div><div class="abs sm" style="left:260px;right:20px;bottom:12px;color:var(--wink)">${keys}</div>`;
  }
  if (v === 2) {
    return top + line + say + `<div class="abs row" style="left:20px;right:20px;top:${gy + 22}px;gap:14px">${tabs}<span class="sm grow" style="line-height:16px;max-height:32px;overflow:hidden;color:var(--wink)">${esc(d.note)}</span></div><div class="abs" style="left:20px;right:20px;top:${gy + 52}px;display:grid;grid-template-columns:repeat(${n > 6 ? 4 : 3},1fr);gap:${n > 6 ? 8 : 10}px">${d.buttons.map((b, k) => B(esc(b.label), k === d.index, `justify-content:center;${n > 6 ? 'height:40px;font-size:15px;' : ''}${dim(b)}`, '', pick(k))).join('')}</div>`;
  }
  const tight = n > 6;
  return top + line + say + `<div class="abs" style="left:${tight ? 40 : 150}px;top:${gy + 24}px">${tabs}</div><div class="abs row" style="left:0;right:0;top:${gy + 60}px;justify-content:center;gap:${tight ? 6 : 10}px;align-items:flex-end">${d.buttons.map((b, k) => B(esc(b.label), k === d.index, (k === d.index ? `height:64px;font-size:${tight ? 17 : 22}px;padding:0 ${tight ? 14 : 26}px;` : `height:46px;${tight ? 'font-size:14px;padding:0 10px;' : ''}`) + dim(b), '', pick(k))).join('')}</div><div class="abs sm" style="left:20px;right:20px;top:${gy + 138}px;text-align:center;line-height:17px;max-height:34px;overflow:hidden;color:var(--wink)">${esc(d.note)}</div><div class="abs sm" style="left:0;right:0;bottom:12px;text-align:center;color:var(--wink)">${keys}</div>`;
}
