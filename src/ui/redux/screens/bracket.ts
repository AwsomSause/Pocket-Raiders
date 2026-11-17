// New UI bracket screen, ported from the mock-ups' `bracket` template: a header, four columns of 8, 4, 2 and 1
// names, and a text box. A 32-entrant bracket is shown eight at a time: four groups and the finals, as pages.
// Pure drawing and pure model building; the scene keeps the state and the input.

import type { TourneyView } from '../../../core/expansion/tourney';
import type { BracketTree } from '../../../core/galarTournament';
import { act, esc, H, mini, W } from '../kit';
import type { ReduxCtx } from '../stage';

export interface BracketSlot { name: string; file: string | null; you: boolean; out: boolean; named: boolean }
export interface BracketModel {
  title: string;
  /** Four columns of 8, 4, 2 and 1 slots. A null slot is a match that has not been played yet. */
  columns: { name: string; now: boolean; slots: (BracketSlot | null)[] }[];
  pages: string[];
  page: number;
  text: string;
  /** One more chip after the pages (Galar: watch a match). */
  extra?: string;
  /** The key hints in the header (a run's bracket: group and close). */
  hints?: readonly (readonly [string, string])[];
}

const X = [24, 260, 496, 732] as const;

export function bracketView(_c: ReduxCtx, d: BracketModel): string {
  const slot = (s: BracketSlot | null, last: boolean): string =>
    s
      ? W(`<div class="row" style="gap:6px"><span style="width:28px;height:28px;flex:none;display:flex;align-items:center;justify-content:center">${s.file ? mini(s.file, 28) : ''}</span><b style="font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0"${s.you && !last ? ' class="acc"' : ''}>${s.you ? '★ ' : ''}${esc(s.name)}</b></div>`, `padding:5px 10px${s.out ? ';opacity:.45' : ''}`, last ? 'sel' : '')
      : W('<div class="row" style="gap:6px;height:28px"><b style="font-size:14px;opacity:.6">?</b></div>', 'padding:5px 10px;opacity:.55');
  // A long text (Galar's next opponent and the big-screen line) wraps onto a second line: the columns end higher,
  // and the page chips sit on the text box whatever its height.
  const long = d.text.length > 92;
  const cols = d.columns.slice(0, 4).map((col, i) => `<div class="abs sm" style="left:${X[i]}px;top:54px;width:${i === 3 ? 204 : 200}px;text-align:center${col.now ? ';opacity:1;color:var(--acc);font-weight:700' : ''}">${esc(col.name)}</div><div class="abs col" style="left:${X[i]}px;top:76px;bottom:${long ? 136 : 110}px;width:${i === 3 ? 204 : 200}px;justify-content:space-around${long ? ';gap:2px' : ''}">${col.slots.map((s) => slot(s, i === 3)).join('')}</div>`).join('');
  const chips = d.pages.length > 1 ? `<div class="row" style="gap:8px;justify-content:center">${d.pages.map((p, k) => `<span class="tg${k === d.page ? '' : ' no'}" style="cursor:pointer"${act('bracketPage', k)}>${esc(p)}</span>`).join('')}${d.extra ? `<span class="tg" style="cursor:pointer;margin-left:12px"${act('bracketWatch')}>${esc(d.extra)}</span>` : ''}</div>` : '';
  return `<div class="fill"${act('bracket')}></div>` + H(d.title, 'map', d.hints ?? [['◀ ▶', 'group'], ['B', 'close']]) + cols + `<div class="abs col" style="left:20px;right:20px;bottom:16px;gap:13px">${chips}<div class="txt">${esc(d.text)}</div></div>`;
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

/**
 * One page of Galar's Champion Tournament as the same 8/4/2/1 columns (core/galarTournament.ts bracketTree): pages 0
 * to 3 are the four groups, page 4 the finals. `text` is what the old five-card pop-up said about the next opponent.
 */
export function galarPage(tree: BracketTree, fileOf: (species: string) => string | null, page: number, text: string): BracketModel {
  const p = Math.max(0, Math.min(4, Math.floor(page)));
  const finals = p === 4;
  const names = finals ? ['Quarterfinal', 'Semifinal', 'Final', 'Champion'] : ['Round of 32', 'Round of 16', 'Quarterfinal', 'Group winner'];
  const columns = [8, 4, 2, 1].map((n, i) => {
    const c = finals ? i + 2 : i;
    const line = tree.lines[c] ?? [];
    const next = new Set((tree.lines[c + 1] ?? []).map((e) => e.id));
    const from = finals ? 0 : p * n;
    const slots = Array.from({ length: n }, (_, k): BracketSlot | null => {
      const e = c <= tree.wins ? line[from + k] : undefined;
      return e ? { name: e.name, file: e.ace ? fileOf(e.ace) : null, you: e.you, named: true, out: c < tree.wins && !next.has(e.id) } : null;
    });
    return { name: names[i]!, now: tree.wins === c, slots };
  });
  return { title: 'Champion Tournament', columns, pages: [...GROUPS, 'Finals'], page: p, text };
}

/** The page Galar's bracket opens on: the player's group (always the first) until the quarter-final, then the finals. */
export const galarHome = (tree: BracketTree): number => (tree.wins >= 2 ? 4 : 0);

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

/** The pages of a typed-in bracket (Tools > Tournament bracket): one for up to eight names, else groups of eight and the finals. */
export const friendsPages = (size: number): string[] => (size > 8 ? [...GROUPS.slice(0, size / 8), 'Finals'] : []);

/**
 * One page of a bracket made from typed names (core/tools/bracket.ts makeBracket). Nothing has been played, so only
 * round one and the names with a bye are known; every later slot shows "?". Eight names or fewer fit on one page.
 */
export function friendsPage(rounds: readonly (readonly { a: string | null; b: string | null }[])[], page: number, text: string): BracketModel {
  const first = rounds[0] ?? [], size = first.length * 2, total = rounds.length;
  const pages = friendsPages(size), p = Math.max(0, Math.min(Math.max(0, pages.length - 1), Math.floor(page)));
  const finals = pages.length > 0 && p === pages.length - 1;
  // level 0 is every name, level 1 who is through round one (only a bye is known), and so on up to the winner.
  const level = (c: number): (string | null)[] => (c === 0 ? first.flatMap((m) => [m.a, m.b ?? '(bye)']) : c === 1 ? first.map((m) => (m.b === null ? m.a : null)) : Array.from({ length: size >> c }, () => null));
  const name = (c: number): string => (c >= total ? 'Winner' : total - c === 1 ? 'Final' : total - c === 2 ? 'Semifinal' : total - c === 3 ? 'Quarterfinal' : `Round of ${size >> c}`);
  const levels = pages.length === 0 ? Array.from({ length: total + 1 }, (_, c) => c) : finals ? Array.from({ length: total - 2 }, (_, i) => i + 3) : [0, 1, 2, 3];
  const columns = levels.map((c) => {
    const n = pages.length === 0 || finals ? size >> c : 8 >> c, from = finals || pages.length === 0 ? 0 : p * n;
    const slots = level(c).slice(from, from + n).map((who): BracketSlot | null => (who === null ? null : { name: who, file: null, you: false, named: true, out: who === '(bye)' }));
    return { name: name(c), now: c === 0, slots };
  });
  return { title: 'Tournament bracket', columns, pages, page: p, text, hints: [...(pages.length ? [['◀ ▶', 'group'] as const] : []), ['Enter', 'copy'], ['Esc', 'back']] };
}
