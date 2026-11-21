// The Pocket look's Galar pages (mock-up `ga-bracket`): the Champion's Tournament as five round cards with you and
// who you meet, Heal and Shop between the rounds, the trainers still in, and what happens between rounds. MapScene
// hands over what galarTournament.ts reads from the run. Presentation only.

import { act, esc, keys, page, sprH } from '../kit';
import type { PkArt } from '../art';
import { fit, fitBody, fitPic } from '../templates';

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

export interface PkGaWonModel {
  /** The round just won ("Round of 16"). */
  round: string;
  text: string;
  rows: readonly { art: PkArt | null; title: string; sub: string; on?: boolean }[];
  side: string;
  lines: readonly (readonly [string, string])[];
  party: readonly (PkArt | null)[];
  counts: readonly (readonly [string, string])[];
  /** The Final won (mock-up `ga-champ`): "Galar Champion" over the red, white and blue ground, the button says what is next. */
  champ?: { title: string; button: string };
}

/** A Champion's Tournament round won (mock-up `ga-won`): who went out, the heal, the prize, the shop, what comes next. */
export function pkGaWon(d: PkGaWonModel): string {
  const title = d.champ?.title ?? `${d.round} Won`;
  const rows = d.rows.slice(0, 4).map((r) => `<p class="${r.on ? 'on' : ''}"><span>${r.art ? fitPic(r.art, 60, 76, '', 3) : ''}</span><b style="font-size:${fit(r.title, 170, 18, 12, 0.55)}px">${esc(r.title)}</b><em>${esc(r.sub)}</em></p>`).join('');
  const walk = d.party.slice(0, 6).map((p, k) => `<span style="animation-delay:${(k * 0.12).toFixed(2)}s">${fitPic(p, 80, 80, '', 2)}</span>`).join('');
  return page(d.champ ? 'ga-champ' : 'ga-won', 51, `<div class="scr sz20 ar28 a-ga res31${d.champ ? ' champ34' : ''}" data-key="ga-won"><i class="rays25 f" data-nocheck></i><div class="rz-h" data-m="hdr"><i class="emb28 ga hd" data-nocheck></i><em>Champion's Tournament</em><b style="font-size:${fit(title, 340, 40, 26, 0.6)}px">${esc(title)}</b><span style="font-size:${fitBody(d.text, 460, 40, [15, 14, 13, 12], 1.3)}px">${esc(d.text)}</span></div>`
    + `<div class="rz-t" data-key="ga-won-rows">${rows}</div><div class="rz-s" data-key="ga-won-side"><b>${esc(d.side)}</b>${d.lines.slice(0, 2).map(([k, l]) => `<p style="font-size:${fitBody(l, 260, 60, [13, 12, 11], 1.3)}px">${k ? `<i>${esc(k)}</i>` : ''}${esc(l)}</p>`).join('')}<div class="btn on nx"${act('next')}><b>${esc(d.champ?.button ?? 'Back to the map')}</b></div></div>`
    + `<div class="rz-p" data-m="party"><i class="rz-g" data-nocheck></i><div class="rz-w">${walk}</div><div class="rz-n">${d.counts.map(([b, e]) => `<p><b>${esc(b)}</b><em>${esc(e)}</em></p>`).join('')}</div></div>${keys([['Enter', 'continue']])}</div>`);
}

/** One row of a two-sided page (mock-ups' `side32`): picture, name, line, tag; `cls` me (lit), boss (gold), out (grey). */
export interface PkSideRow { art: PkArt | null; title: string; sub: string; tag?: string; cls?: string; pick?: number }
const sideRow = (r: PkSideRow): string =>
  `<p class="${r.cls ?? ''}"${r.pick !== undefined ? act('pick', r.pick, 'over') : ''}><i>${r.art ? fitPic(r.art, 44, 40, '', 3) : '<q>?</q>'}</i><b style="font-size:${fit(r.title, 220, 14, 11, 0.55)}px">${esc(r.title)}</b><span style="font-size:${fit(r.sub, 250, 12, 10, 0.52)}px">${esc(r.sub)}</span>${r.tag ? `<u>${esc(r.tag)}</u>` : ''}</p>`;
/** A side of a two-sided page: its tag, its title, its rows and a line under them. */
export const pkSide32 = (cls: 'a' | 'b', tag: string, title: string, rows: readonly PkSideRow[], foot = ''): string =>
  `<div class="sd32 ${cls}"><em>${esc(tag)}</em><b style="font-size:${fit(title, 330, 30, 18, 0.55)}px">${esc(title)}</b>${rows.map(sideRow).join('')}${foot ? `<small>${esc(foot)}</small>` : ''}</div>`;

export interface PkGaShopModel {
  /** "Before the Quarterfinal". */
  heading: string;
  goods: readonly { art: PkArt | null; name: string; desc: string; price: number; off: boolean }[];
  index: number;
  trainer: string;
  mine: readonly PkSideRow[];
  text: string;
}

/** The Champion's Tournament shop (mock-up `ga-shop`): the goods on one side (four at a time), your money and next match on the other. */
export function pkGaShop(d: PkGaShopModel): string {
  const n = d.goods.length, at = Math.min(d.index, n - 1);
  const s = Math.max(0, Math.min(n - 4, at - 1));
  const rows: PkSideRow[] = d.goods.slice(s, s + 4).map((g, q) => ({ art: g.art, title: g.name, sub: g.desc, tag: `₽${g.price.toLocaleString('en-US')}`, cls: `${s + q === d.index ? 'me' : ''}${g.off ? ' out' : ''}`, pick: s + q }));
  const foot = n > 4 ? `${s + 1}–${Math.min(n, s + 4)} of ${n}` : '';
  return page('ga-shop', 51, `<div class="scr sz20 ar28 a-ga pg28" data-key="ga-shop"><div class="sz-h" data-m="hdr"><i class="emb28 ga hd" data-nocheck></i><b>Stadium shop</b><span style="font-size:${fit(d.text, 520, 14, 11, 0.5)}px">${esc(d.text)}</span></div>`
    + `<div class="vs32">${pkSide32('a', 'On sale', d.heading, n ? rows : [{ art: null, title: 'Sold out', sub: 'Nothing left on the shelf' }], foot)}<i class="vsb32" data-nocheck>₽</i>${pkSide32('b', 'Your side', d.trainer, d.mine)}</div>`
    + `<div class="btn on nx go32" data-key="ga-shop-done"${act('back')}><b>Done shopping</b></div>${keys([['↑↓', 'look'], ['Enter', 'buy'], ['Esc', 'done']])}</div>`);
}

export interface PkGaLineupSide { tag: string; name: string; rows: readonly PkSideRow[]; foot: string }
export interface PkGaLineupModel { me: PkGaLineupSide; foe: PkGaLineupSide }

/** Both line-ups on the big screen before a stadium match (mock-up `ga-lineup`): your lead lit, their ace in gold. */
export function pkGaLineup(d: PkGaLineupModel): string {
  return page('ga-lineup', 51, `<div class="scr sz20 ar28 a-ga pg28" data-key="ga-lineup"><div class="sz-h" data-m="hdr"><i class="emb28 ga hd" data-nocheck></i><b>Line-ups</b><span>Shown on the big screen before every stadium match.</span></div>`
    + `<div class="vs32">${pkSide32('a', d.me.tag, d.me.name, d.me.rows, d.me.foot)}<i class="vsb32" data-nocheck>VS</i>${pkSide32('b', d.foe.tag, d.foe.name, d.foe.rows, d.foe.foot)}</div>`
    + `<div class="btn on nx go32" data-key="ga-walk"${act('next')}><b>Walk out</b></div>${keys([['Enter', 'walk out']])}</div>`);
}

/** Match Info in a Galar stadium battle (mock-up `ga-info`): the foe's Pokémon left and the crowd's rules, with the one in play now. */
export function pkGaInfo(d: { foeTag: string; foeTitle: string; foe: readonly PkSideRow[]; crowdTitle: string; crowd: readonly PkSideRow[] }): string {
  return page('ga-info', 51, `<div class="scr sz20 ar28 a-ga pg28 gx-bt-page" data-key="ga-info"><div class="sz-h" data-m="hdr"><i class="emb28 ga hd" data-nocheck></i><b>Match info</b><span>Everything the battle screen no longer shows, one key away.</span></div>`
    + `<div class="vs32">${pkSide32('a', d.foeTag, d.foeTitle, d.foe)}<i class="vsb32" data-nocheck></i>${pkSide32('b', 'The crowd', d.crowdTitle, d.crowd)}</div>`
    + `<div class="btn on nx go32" data-key="ga-info-back"${act('info')}><b>Back to the battle</b></div>${keys([['Enter', 'back', 'info'], ['Esc', 'back', 'info']])}</div>`);
}

export interface PkGaRoadModel {
  gyms: readonly { name: string | null; type: string; state: 'got' | 'next' | 'later'; art: PkArt | null; n: number }[];
  index: number;
  /** The Champion's Tournament card: who waits at the end (null while the Champion is kept secret) and the line under it. */
  cup: { art: PkArt | null; line: string };
  /** B opens the bracket (only once the tournament has begun). */
  bracket: boolean;
}

/** Galar's Gym Challenge road (mock-up `ga-road`), the Badge Case in Galar: a card per stadium match, then the Champion's Tournament. */
export function pkGaRoad(d: PkGaRoadModel): string {
  const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);
  const cards = d.gyms.map((g, k) => {
    const cls = `${g.state === 'next' ? 'now' : g.state === 'later' ? 'gx-later' : ''}${k === d.index ? ' gx-lit' : ''}`;
    const tag = g.state === 'got' ? 'Badge won' : g.state === 'next' ? `Match ${g.n} · next` : 'Not met yet';
    const name = g.name ?? '???';
    return `<p class="${cls}" data-key="ga-g-${k}"${act('popPick', k)}><u>${g.n}</u><span>${g.art ? fitPic(g.art, 92, 124, '', 3) : '<q>?</q>'}</span><b style="font-size:${fit(name, 96, 20, 12, 0.6)}px">${esc(name)}</b><em>${esc(g.type ? cap(g.type) : 'Unknown')}</em><i>${esc(tag)}</i></p>`;
  }).join('');
  const ks: [string, string, string?][] = [['←→', 'look at a gym'], ['Esc', 'close']];
  if (d.bracket) ks.splice(1, 0, ['B', 'bracket', 'roadBracket']);
  return page('ga-road', 51, `<div class="scr sz20 ar28 a-ga pg28" data-key="ga-road"><div class="sz-h" data-m="hdr"><i class="emb28 ga hd" data-nocheck></i><b>Gym Challenge</b><span>${d.gyms.length} stadium matches, then the Champion's Tournament. Every match is shown live.</span></div>`
    + `<div class="gym34" style="grid-template-columns:repeat(${Math.max(1, d.gyms.length)},1fr)" data-key="ga-gyms">${cards}</div>`
    + `<div class="cup34" data-key="ga-cup"${d.bracket ? act('roadBracket') : ''}><span>${d.cup.art ? fitPic(d.cup.art, 70, 84, '', 3) : '<q>?</q>'}</span><b>Champion's Tournament</b><em>${esc(d.cup.line)}</em></div>${keys(ks)}</div>`);
}
