// New UI Bag, ported from the mock-ups' `bag` template: pockets as tabs, the items as a list with a detail window
// (or a grid of cells), and the party strip that says who the focused item would help. Pure drawing.

import { act, B, esc, H, TX, W } from '../kit';
import type { ReduxCtx } from '../stage';
import { type Art, gridStart, pic, scrollStart } from '../templates';

export interface BagItem { label: string; tag: string; note: string; art: Art | null; off: boolean }
export interface BagModel {
  title: string;
  hints: readonly (readonly [string, string])[];
  pockets: { labels: readonly string[]; index: number } | null;
  n: number;
  /** Only the items on screen are asked for. */
  item: (i: number) => BagItem;
  index: number;
  /** The party strip, already drawn ('' outside a run). */
  strip: string;
  text: string;
}

/** How many columns the cursor moves across: the grid layout is seven wide, the list is one. */
export const bagCols = (c: Pick<ReduxCtx, 'v'>): number => (c.v(2) === 1 ? 7 : 1);

/**
 * What Enter does with an item, read from the first words of its note: the name on the detail window's button.
 * '' is an item with nothing to press (always on, working now, or battle-only while it cannot be chosen).
 */
export function bagAction(note: string, off = false): 'Use' | 'Give' | 'Change holder' | '' {
  if (/^held by/i.test(note)) return 'Change holder';
  if (/^not held/i.test(note)) return 'Give';
  if (/^(always on|working now)/i.test(note)) return '';
  if (off && /^battle use/i.test(note)) return '';
  return 'Use';
}

/** A row's tag reads "×2 · RARE": the count is the part that starts with × and a number. */
export const bagCount = (tag: string): string => tag.split(' · ').find((x) => /^[×x]\s*\d/.test(x)) ?? '';

/** The note under one party member for the focused item ('' for no note). `problem` is why it cannot be used, or null. */
export function bagUseNote(holds: number, usableOutside: boolean, problem: string | null, hp: number): string {
  if (holds > 0) return holds > 1 ? `Holds ${holds}` : 'Holds it';
  if (!usableOutside) return '';
  return problem === null ? 'Can use' : hp <= 0 ? 'Fainted' : 'No effect';
}

export function bagView(c: ReduxCtx, d: BagModel): string {
  const grid = bagCols(c) === 7;
  const n = Math.max(0, Math.floor(d.n));
  const head = H(d.title, 'shop', d.hints);
  const many = (d.pockets?.labels.length ?? 0) > 7;
  const pockets = d.pockets ? `<div class="abs tabs" style="left:24px;top:62px;z-index:3">${d.pockets.labels.map((t, k) => `<span class="${k === d.pockets!.index ? 'on' : ''}" style="cursor:pointer${many ? ';padding:5px 9px' : ''}"${act('tab', k)}>${esc(t)}</span>`).join('')}</div>` : '';
  if (n === 0) return head + pockets + '<div class="abs cen" style="left:0;right:0;top:200px;display:flex;font-size:26px;opacity:.6">Nothing here yet</div>' + d.strip + TX(esc(d.text));
  const index = Math.max(0, Math.min(n - 1, Math.floor(d.index)));
  const attr = (k: number): string => `${act('pick', k)} data-over="over"`;
  const size = grid ? 14 : 6;
  const s = grid ? gridStart(n, index, size, 7) : scrollStart(n, index, size);
  const shown = Array.from({ length: Math.max(0, Math.min(size, n - s)) }, (_, q) => s + q);
  const where = n > size ? `<div class="abs sm" style="${grid ? 'right:28px;top:66px' : 'left:28px;top:356px'}">${s > 0 ? '▲' : ''} ${s + 1}–${Math.min(n, s + size)} of ${n} ${s + size < n ? '▼' : ''}</div>` : '';
  let list: string;
  if (grid) {
    list = `<div class="abs" style="left:24px;right:24px;top:102px;display:grid;grid-template-columns:repeat(7,1fr);gap:10px">${shown.map((i) => { const r = d.item(i); return `<div class="cell${i === index ? ' sel' : ''}${r.off ? ' off' : ''}"${attr(i)}>${pic(r.art, 52) || `<span style="font-size:12px;font-weight:700;text-align:center;padding:4px">${esc(r.label)}</span>`}<span style="position:absolute;right:5px;bottom:2px;font-size:12px">${esc(bagCount(r.tag))}</span></div>`; }).join('')}</div>`;
  } else {
    const cur = d.item(index), does = bagAction(cur.note, cur.off);
    // "Not held · Raises Speed": the words after the first dot are the description.
    const about = cur.note.replace(/^[^·]*·\s*/, '');
    const button = does
      ? `<div class="row">${B(esc(does), true, `flex:1;justify-content:center${cur.off ? ';opacity:.5' : ''}`, '', act('pick', index))}</div>`
      : `<div class="row"><span class="tg">${esc(cur.note.split(/[·:]/)[0]!.trim())}</span></div>`;
    list = `<div class="abs col" style="left:24px;top:102px;width:400px;gap:6px">${shown.map((i) => { const r = d.item(i); return `<div class="btn${i === index ? ' on' : ''}" style="height:36px${r.off ? ';opacity:.55' : ''}"${attr(i)}>${pic(r.art, 28)}<span class="grow" style="min-width:0;overflow:hidden;text-overflow:ellipsis">${esc(r.label)}</span><small>${esc(bagCount(r.tag))}</small></div>`; }).join('')}</div>`
      + `<div class="abs" style="left:456px;right:26px;top:104px">${W(`<div class="row">${pic(cur.art, 60)}<b class="acc" style="font-size:21px">${esc(cur.label)}</b></div><div class="sm">${esc(cur.tag)}</div><div style="line-height:22px;max-height:88px;overflow:hidden">${esc(about || cur.note)}</div>${button}`, 'display:flex;flex-direction:column;gap:10px')}</div>`;
  }
  return head + pockets + list + where + d.strip + TX(esc(d.text));
}
