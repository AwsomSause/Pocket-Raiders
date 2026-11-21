// The Pocket look's Galar pages (mock-up `ga-bracket`): the Champion's Tournament as five round cards with you and
// who you meet, Heal and Shop between the rounds, the trainers still in, and what happens between rounds. MapScene
// hands over what galarTournament.ts reads from the run. Presentation only.

import { act, esc, keys, page, sprH } from '../kit';
import type { PkArt } from '../art';
import { fit } from '../templates';

export interface PkBracketSide { art: PkArt | null; name: string; score?: string; won?: boolean }
export interface PkBracketRound {
  name: string;
  state: 'won' | 'next' | 'later';
  you: PkBracketSide;
  foe: PkBracketSide;
  note: string;
  /** What waits after this round: a heal, a shop, or nothing (the final). */
  after: 'heal' | 'shop' | null;
}
export interface PkBracketModel { rounds: readonly PkBracketRound[]; still: number; pool: readonly (PkArt | null)[]; out: readonly (PkArt | null)[]; index: number; button: string; line: string }

const side = (s: PkBracketSide): string =>
  `<p class="${s.won ? 'w' : ''}"><i>${s.art ? sprH(s.art, 40) : '<q>?</q>'}</i><b style="font-size:${fit(s.name, 80, 15, 10, 0.55)}px">${esc(s.name)}</b><u>${esc(s.score ?? '')}</u></p>`;

/** The bracket: a card per round (the lit one framed), the field still in, Heal and Shop, Back to the map. */
export function pkBracket(d: PkBracketModel): string {
  const cards = d.rounds.map((r, k) => {
    const cls = `${r.state === 'won' ? 'won' : r.state === 'next' ? 'now' : ''}${k === d.rounds.length - 1 ? ' fin' : ''}${k === d.index ? ' gx-lit' : ''}`;
    const gap = r.after ? `<i class="${r.after}"><b>${r.after === 'heal' ? 'Heal' : 'Shop'}</b></i>` : '';
    return `<div class="mt34 ${cls}" data-key="ga-r-${k}"${act('bracketPage', k)}><em>${esc(r.name)}</em>${side(r.you)}${side(r.foe)}<small style="font-size:${fit(r.note, 130, 11, 9, 0.5)}px">${esc(r.note)}</small></div>${k < d.rounds.length - 1 ? gap : ''}`;
  }).join('');
  const shown = d.pool.slice(0, d.out.length ? 8 : 10);
  const more = d.still - shown.length;
  const pool = `<div class="pool34" data-key="ga-pool"><b>Still in · ${d.still}</b>${shown.map((a) => `<i>${a ? sprH(a, 52) : ''}</i>`).join('')}${more > 0 ? `<em>and ${more} more</em>` : ''}${d.out.length ? `<s>${d.out.slice(0, 2).map((a) => (a ? sprH(a, 44) : '')).join('')}<u>Out</u></s>` : ''}</div>`;
  const notes = `<div class="brn34" data-key="ga-notes"><p><em>Heal</em>Your team is healed after every round.</p><p><em>Shop</em>A shop opens after rounds 2 and 4.</p><div class="btn on nx"${act('bracket')}><b>${esc(d.button)}</b></div></div>`;
  return page('ga-bracket', 51, `<div class="scr sz20 ar28 a-ga pg28" data-key="ga-bracket"><div class="sz-h" data-m="hdr"><i class="emb28 ga hd" data-nocheck></i><b>Tournament bracket</b><span style="font-size:${fit(d.line, 520, 14, 11, 0.5)}px">${esc(d.line)}</span></div><div class="br34" data-key="ga-rounds">${cards}</div>${pool}${notes}${keys([['←→', 'look at a round'], ['Enter', 'close'], ['B', 'close bracket', 'bracket']])}</div>`);
}
