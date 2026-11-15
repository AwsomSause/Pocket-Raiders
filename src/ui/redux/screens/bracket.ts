// New UI bracket screen, ported from the mock-ups' `bracket` template: a header, four columns of 8, 4, 2 and 1
// names, and a text box. A 32-entrant bracket is shown eight at a time: four groups and the finals, as pages.
// Pure drawing and pure model building; the scene keeps the state and the input.

import type { TourneyView } from '../../../core/expansion/tourney';
import { act, esc, H, mini, TX, W } from '../kit';
import type { ReduxCtx } from '../stage';

export interface BracketSlot { name: string; file: string | null; you: boolean; out: boolean; named: boolean }
export interface BracketModel {
  title: string;
  /** Four columns of 8, 4, 2 and 1 slots. A null slot is a match that has not been played yet. */
  columns: { name: string; now: boolean; slots: (BracketSlot | null)[] }[];
  pages: string[];
  page: number;
  text: string;
}

const X = [24, 260, 496, 732] as const;

export function bracketView(_c: ReduxCtx, d: BracketModel): string {
  const slot = (s: BracketSlot | null, last: boolean): string =>
    s
      ? W(`<div class="row" style="gap:6px"><span style="width:28px;height:28px;flex:none;display:flex;align-items:center;justify-content:center">${s.file ? mini(s.file, 28) : ''}</span><b style="font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0"${s.you && !last ? ' class="acc"' : ''}>${s.you ? '★ ' : ''}${esc(s.name)}</b></div>`, `padding:5px 10px${s.out ? ';opacity:.45' : ''}`, last ? 'sel' : '')
      : W('<div class="row" style="gap:6px;height:28px"><b style="font-size:14px;opacity:.6">?</b></div>', 'padding:5px 10px;opacity:.55');
  const cols = d.columns.slice(0, 4).map((col, i) => `<div class="abs sm" style="left:${X[i]}px;top:54px;width:${i === 3 ? 204 : 200}px;text-align:center${col.now ? ';opacity:1;color:var(--acc);font-weight:700' : ''}">${esc(col.name)}</div><div class="abs col" style="left:${X[i]}px;top:76px;bottom:110px;width:${i === 3 ? 204 : 200}px;justify-content:space-around">${col.slots.map((s) => slot(s, i === 3)).join('')}</div>`).join('');
  const tabs = d.pages.length > 1 ? `<div class="abs row" style="left:24px;right:24px;bottom:74px;gap:8px;justify-content:center">${d.pages.map((p, k) => `<span class="tg${k === d.page ? '' : ' no'}" style="cursor:pointer"${act('bracketPage', k)}>${esc(p)}</span>`).join('')}</div>` : '';
  return `<div class="fill"${act('bracket')}></div>` + H(d.title, 'map', [['◀ ▶', 'group'], ['B', 'close']]) + cols + tabs + TX(esc(d.text));
}

const GROUPS = ['Group A', 'Group B', 'Group C', 'Group D'] as const;

/** The page a tournament bracket opens on: the player's group until the quarter-final, then the finals. */
export const tourneyHome = (view: TourneyView): number => (view.now >= 3 ? 4 : Math.max(0, Math.floor(view.entrants.findIndex((e) => e.you) / 8)));

/**
 * One page of the 32-entrant bracket as the mock-ups' 8/4/2/1 columns: pages 0 to 3 are the four groups (round of 32
 * down to the group winner), page 4 is the finals (quarter-final down to the champion). Matches not played yet show "?".
 */
export function tourneyPage(view: TourneyView, fileOf: (species: string) => string | null, page: number, title: string): BracketModel {
  const p = Math.max(0, Math.min(4, Math.floor(page)));
  const finals = p === 4;
  const names = finals ? ['Quarterfinal', 'Semifinal', 'Final', 'Champion'] : ['Round of 32', 'Round of 16', 'Quarterfinal', 'Group winner'];
  // survivors[c] is who stands at the start of round c + 1; it is known once round c has been played.
  const played = Math.max(0, view.now - 1);
  const columns = [8, 4, 2, 1].map((n, i) => {
    const c = finals ? i + 2 : i;
    const line = view.survivors[c] ?? [];
    const from = finals ? 0 : p * n;
    const slots = Array.from({ length: n }, (_, k): BracketSlot | null => {
      const e = c <= played ? line[from + k] : undefined;
      return e ? { name: e.name, file: fileOf(e.species), you: e.you, named: e.named, out: e.outIn > 0 && e.outIn <= played } : null;
    });
    return { name: names[i]!, now: view.now === c + 1, slots };
  });
  const left = view.now === 0 ? 32 : view.survivors[Math.min(view.now - 1, 5)]?.length ?? 1;
  const opp = view.now >= 1 && view.now <= 5 ? view.opponents[view.now - 1] : null;
  const round = ['Round of 32', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Final'][view.now - 1];
  const text = view.now === 6 ? 'Champion! The whole bracket is decided.' : view.now === 0 ? '32 fighters have signed up. The bracket is drawn.' : `${left} still in. Next: ${round}${opp ? ` against ${opp.name}` : ''}.`;
  return { title, columns, pages: [...GROUPS, 'Finals'], page: p, text };
}

/** The five rounds as the strip over a tournament event: won, next (with the opponent) or still ahead. */
export interface RoundChip { name: string; who: string; state: 'won' | 'next' | 'ahead' }
export function tourneyRounds(view: TourneyView): RoundChip[] {
  return ['Round of 32', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Final'].map((name, i) => {
    const r = i + 1;
    const state = view.now > r ? 'won' : view.now === r ? 'next' : 'ahead';
    const opp = view.opponents[i];
    return { name, state, who: state === 'ahead' && r < 5 ? '?' : opp ? opp.name : '?' };
  });
}
