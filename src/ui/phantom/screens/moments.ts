// Phantom UI: the short full-screen moments of a battle. A wild Pokémon appears (mock-up `wild`), both sides send
// out (`send`), a hit that lands hard (`hit`), a knock-out (`ko`), the win (`win`), the tally after it (`result`) and
// a loss to a rival, which never ends a run (`rloss`). Pure drawing: the battle decides when each one shows, for how
// long, and what is true on it.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import { type Art, figure } from '../../redux/templates';
import { rxUrl } from '../../redux/assets';
import { act, esc, keys, page, ransom, ty } from '../kit';
import { phHead } from '../templates';
import { quoted } from './cutin';
import { tall } from './event';

/** The moving band of words along the top and the bottom edge. */
const cine = (word: string): string => { const run = `${esc(word.toUpperCase())} · `.repeat(Math.max(8, Math.ceil(220 / (word.length + 3)))); return `<div class="cine" aria-hidden="true"><i><u>${run}</u></i><i><u>${run}</u></i></div>`; };
const balls = (alive: number, total: number): string => Array.from({ length: Math.max(0, Math.min(6, total)) }, (_, k) => `<i class="ph-vs-ball${k < alive ? '' : ' out'}"></i>`).join('');
const back = (file: string | null | undefined): string => (file ? `<div class="art" style="background-image:url(${rxUrl(file)})"></div>` : '<div class="bgk"></div>');
/** A long name steps its cut-out letters down so the word stays on the page. */
const wordSize = (n: number, big: number): number => Math.round(big * (n > 16 ? 0.46 : n > 12 ? 0.58 : n > 9 ? 0.74 : n > 7 ? 0.88 : 1));
const pct = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));
/** A Pokémon as a small picture that fits a square of `px`. */
const icon = (file: string | null, px: number, st = ''): string => (file ? `<i class="ph-ic" style="${st}">${figure({ file, atlas: true }, px)}</i>` : '');
const tap = (name = 'next'): string => `<div class="ph-fill ph-ct-next"${act(name)}></div>`;

export interface WildModel {
  name: string;
  mon: Art | null;
  level: number;
  types: readonly string[];
  /** "Stage 14 · Route 22". */
  where: string;
  /** The words around the name: "A wild" … "appeared!". */
  lead: string;
  tail: string;
  /** The band along the edges. */
  tag: string;
  /** A gold note beside the types ("New · not in your Pokédex", "Shiny"), or ''. */
  note: string;
  /** Whether a ball can be thrown at it, and the reason when not. */
  catchable: boolean;
  cant: string;
  balls: readonly { name: string; n: number }[];
  backdrop: string | null;
  /** Tall grass along the bottom (a grassy place). */
  grass?: boolean;
}

export function phWild(_ph: PhantomVersion, d: WildModel): string {
  const n = d.name.length;
  const stock = d.balls.filter((b) => b.n > 0).slice(0, 3);
  const can = d.catchable
    ? `<span class="lab">It can be caught</span><div class="wl-b">${stock.length ? stock.map((b) => `<i class="ph-vs-ball"></i><b>${esc(b.name)} × ${b.n}</b>`).join('') : '<b>No balls in the Bag</b>'}</div>`
    : `<span class="lab">It can't be caught</span><div class="wl-b"><b class="ph-wl-cant">${esc(d.cant || 'A ball will not work here.')}</b></div>`;
  return page('wild', back(d.backdrop) + '<div class="wl-dark" aria-hidden="true"></div>' + cine(d.tag || 'Wild') + (d.grass ? '<div class="wl-grass" aria-hidden="true"></div>' : '')
    + `<div class="wl-mon ph-wl-mon">${d.mon ? figure(d.mon, 360) : ''}</div><div class="wl-bang" aria-hidden="true">!</div>`
    + (d.where ? `<div class="wl-k"><span>${esc(d.where)}</span></div>` : '')
    + `<div class="wl-t"><em>${esc(d.lead)}</em><span style="font-size:${wordSize(n, 104)}px">${ransom(d.name.toUpperCase(), 11)}</span><em class="b">${esc(d.tail)}</em></div>`
    + `<div class="wl-tags"><b>Lv.${d.level}</b>${d.types.map(ty).join('')}${d.note ? `<span class="wl-new">${esc(d.note)}</span>` : ''}</div>`
    + `<div class="pn wl-c">${can}</div>`
    + tap() + keys(['Z', 'Send out', 'next']));
}

export interface SendSide { by: string; name: string; level: number; types: readonly string[]; mon: Art | null }
export interface SendModel {
  me: SendSide;
  /** The foe's Pokémon; `by` is its Trainer's name, or '' for a wild one. */
  foe: SendSide | null;
  /** The party in its order: who leads, who has fainted. */
  order: readonly { file: string | null; on: boolean; ko: boolean }[];
  backdrop: string | null;
}

const plate = (s: SendSide, side: 'l' | 'r', wild: boolean): string =>
  `<div class="pn${side === 'l' ? ' lt' : ''} sn-n ${side} tilt" style="--r:${side === 'l' ? -3 : 2}deg"><span class="lab">${wild ? 'Wild Pokémon' : `${esc(s.by)} sends out`}</span><h3 class="tl1" style="font-size:${s.name.length > 12 ? 30 : 40}px">${esc(s.name)} <small>Lv.${s.level}</small></h3><div class="sn-ty">${s.types.map(ty).join('')}</div></div>`;

export function phSend(_ph: PhantomVersion, d: SendModel): string {
  return page('send', back(d.backdrop) + '<div class="sn-l" aria-hidden="true"></div><div class="sn-r" aria-hidden="true"></div>'
    + '<svg class="sn-arc" viewBox="0 0 1280 720" aria-hidden="true"><path d="M-20 620 Q 180 120 420 330" fill="none" stroke="currentColor" stroke-width="6" stroke-dasharray="4 18" stroke-linecap="round"></path></svg>'
    + '<div class="sn-pop" aria-hidden="true"></div><div class="sn-ball" aria-hidden="true"><i class="ph-vs-ball ph-sn-ball"></i></div>'
    + `<div class="sn-me ph-sn-pk">${d.me.mon ? figure(d.me.mon, 300) : ''}</div>${d.foe ? `<div class="sn-foe ph-sn-pk">${d.foe.mon ? figure(d.foe.mon, 230) : ''}</div>` : ''}`
    + `<div class="sn-go">${ransom('GO!', 9)}</div>`
    + plate(d.me, 'l', false) + (d.foe ? plate(d.foe, 'r', !d.foe.by) : '')
    + `<div class="sn-ord"><span>Your order</span>${d.order.slice(0, 6).map((o) => `<i class="${o.on ? 'on' : ''}${o.ko ? ' ko' : ''}">${icon(o.file, 42)}</i>`).join('')}</div>`
    + tap() + keys(['Z', 'Fight', 'next']));
}

export interface HitModel {
  /** The cut-out words, one or two lines ("SUPER", "EFFECTIVE!"). */
  words: readonly string[];
  victim: Art | null;
  name: string;
  damage: number;
  /** HP before and after, in percent. */
  from: number;
  to: number;
  /** "CHARIZARD used DRAGON CLAW!" as two parts: who, and the move. */
  by: string;
  move: string;
}

export function phHit(_ph: PhantomVersion, d: HitModel): string {
  const from = pct(d.from), to = pct(d.to);
  const longest = Math.max(...d.words.map((w) => w.length), 1);
  return page('hit', '<div class="speed" aria-hidden="true"></div><div class="shard" style="--cp:polygon(0 62%,100% 34%,100% 100%,0 100%);inset:0" aria-hidden="true"></div>'
    + `<div class="victim ph-ht-pk">${d.victim ? figure(d.victim, 400) : ''}</div>`
    + `<div class="big" style="font-size:${wordSize(longest, 104)}px">${d.words.map((w, k) => ransom(w, 13 + k)).join('')}</div>`
    + (d.damage > 0 ? `<div class="dmg">−${d.damage}</div>` : '')
    + `<div class="foebar"><h3>${esc(d.name)} <span class="num2">${to}%</span></h3><div style="position:relative"><div class="ghost" style="width:calc((100% - 30px)*${(from / 100).toFixed(2)})" aria-hidden="true"></div><span class="slash ${to <= 20 ? 'low' : to <= 50 ? 'mid' : ''}" style="--from:${from}%"><i style="width:${to}%"></i></span></div></div>`
    + (d.move ? `<div class="say"${act('next')}>${esc(d.by.toUpperCase())} used <b>${esc(d.move.toUpperCase())}</b>!</div>` : '')
    + tap() + keys(['Z', 'Next', 'next']), false);
}

export interface KoModel {
  /** Who landed it (the picture on the red side). */
  by: Art | null;
  /** The line under the words. */
  tag: string;
  foe: { name: string; file: string | null };
  /** A Trainer's team: how many are left of how many. Null for a wild Pokémon. */
  left: { owner: string; alive: number; total: number } | null;
}

const STARS = [[520, 60, 34, -12], [1150, 300, 22, 20], [640, 560, 26, 8], [980, 70, 18, -30]] as const;

export function phKo(_ph: PhantomVersion, d: KoModel): string {
  const left = d.left;
  return page('ko', '<div class="bgr"></div><div class="burst" style="--x:30%;--y:55%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div>'
    + '<div class="shard" style="--cp:polygon(0 0,22% 0,8% 100%,0 100%);inset:0" aria-hidden="true"></div><div class="shard" style="--cp:polygon(100% 0,100% 100%,62% 100%,84% 0);inset:0" aria-hidden="true"></div>'
    + (d.by ? `<div class="ko-sil ph-ko-sil" aria-hidden="true">${figure(d.by, 900)}</div><div class="ko-mon ph-ko-pk">${figure(d.by, 460)}</div>` : '')
    + STARS.map(([x, y, s, r], k) => `<i class="ko-st" style="left:${x}px;top:${y}px;--s:${s}px;--r:${r}deg;--i:${k}" aria-hidden="true"></i>`).join('')
    + `<div class="ko-t">${ransom('KNOCK', 21)}${ransom('OUT!', 22)}</div>`
    + (d.tag ? `<div class="ko-tag">${esc(d.tag)}</div>` : '')
    + `<div class="pn ko-foe"><div class="ko-dn">${icon(d.foe.file, 92)}</div><div><span class="lab">Fainted</span><h3 class="tl1" style="font-size:${d.foe.name.length > 12 ? 28 : 36}px">${esc(d.foe.name)}</h3>`
    + (left ? `<div class="ko-left"><div class="bl6">${balls(left.alive, left.total)}</div><b>${esc(left.owner)} has ${left.alive} left</b></div>` : '') + '</div></div>'
    + tap() + keys(['Z', 'Next', 'next']), false);
}

export interface WinModel {
  /** The cut-out words ("YOU WIN"). */
  words: string;
  hero: Art | null;
  mon: Art | null;
  /** What the foe says as they lose, and who said it. Left out when there is nothing. */
  line: string;
  by: string;
  /** The line under the words ("Silver is out of Pokémon"). */
  sub: string;
}

export function phWin(_ph: PhantomVersion, d: WinModel): string {
  const said = quoted(d.line);
  return page('win', '<div class="bgr"></div><div class="burst" style="--x:30%;--y:60%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div><div class="shard" style="--cp:polygon(54% 0,100% 0,100% 100%,70% 100%);inset:0" aria-hidden="true"></div>'
    + (d.mon ? `<div class="sil ph-wn-sil" aria-hidden="true">${figure(d.mon, 600)}</div>` : '')
    + `<div class="champ ph-wn-hero">${d.hero ? tall(d.hero, 560, 600) : d.mon ? figure(d.mon, 420) : ''}</div>`
    + (said ? `<div class="line ph-wn-line" style="font-size:${d.line.length > 90 ? 24 : d.line.length > 50 ? 30 : d.line.length > 24 ? 40 : 54}px">${said}${d.by ? `<small>${esc(d.by.toUpperCase())}</small>` : ''}</div>` : '')
    + `<div class="big" style="font-size:${wordSize(d.words.length, 96)}px">${ransom(d.words.toUpperCase(), 31)}</div>`
    + (d.sub ? `<div class="sub"${act('next')}>${esc(d.sub)}</div>` : '')
    + tap() + keys(['Z', 'Next', 'next']));
}

export interface ResultRow {
  file: string | null;
  name: string;
  /** The Exp bar before and after, in percent of the level. */
  from: number;
  to: number;
  /** Exp gained, or null when it took no part. */
  gain: number | null;
  /** Levels gained: from and to. */
  level: readonly [number, number] | null;
  fainted: boolean;
}
export interface ResultModel {
  /** "Stage 15 · Trainer battle". */
  where: string;
  rows: readonly ResultRow[];
  /** The big lines on the right: `[big, small]`; the first is the headline. */
  gains: readonly (readonly [string, string])[];
}

export function phResult(_ph: PhantomVersion, d: ResultModel): string {
  const rows = d.rows.slice(0, 6).map((r, k) =>
    `<div class="tlw"><div class="tl${r.level ? ' up' : ''}" style="--i:${k}">${icon(r.file, 54, r.fainted ? 'filter:grayscale(1)' : '') || '<i class="ph-ic"></i>'}<b style="${r.name.length > 11 ? 'font-size:20px' : ''}">${esc(r.name)}</b><div class="bar"><i style="width:${pct(r.to)}%;--from:${pct(r.from)}%"></i></div><span>${r.gain === null ? '—' : `+${r.gain}`}</span></div>${r.level ? `<div class="lvup">LEVEL UP! ${r.level[0]} → ${r.level[1]}</div>` : ''}</div>`).join('');
  const gains = d.gains.slice(0, 4).map(([big, small], k) => `<div class="g${k ? ' s' : ''}" style="--i:${k}">${esc(big)}<small>${esc(small)}</small></div>`).join('');
  return page('result', '<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(56% 0,100% 0,100% 100%,44% 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:80%;--y:50%" aria-hidden="true"></div>'
    + phHead('Result', d.where) + `<div class="tally">${rows}</div><div class="gains">${gains}</div>`
    + tap() + keys(['Z', 'Next', 'next']));
}

export interface RivalLossModel {
  name: string;
  cast: Art | null;
  /** "Stage 17 · Rival battle lost". */
  where: string;
  line: string;
  /** What happens now, in plain words. */
  text: string;
  party: readonly (string | null)[];
}

export function phRivalLoss(_ph: PhantomVersion, d: RivalLossModel): string {
  const said = quoted(d.line);
  return page('rloss', '<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(58% 0,100% 0,100% 100%,40% 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:78%;--y:50%" aria-hidden="true"></div>'
    + `<div class="rl-p ph-rl-p">${d.cast ? tall(d.cast, 520, 580) : ''}</div>`
    + phHead('Not over', d.where)
    + (said ? `<div class="pn lt rl-q tilt" style="--r:-2deg"><p class="txt"${d.line.length > 110 ? ' style="font-size:18px"' : ''}>${said}</p></div>` : '')
    + `<div class="rl-big">${ransom('THE RUN', 41)}${ransom('GOES ON', 42)}</div>`
    + `<div class="pn rl-i"><span class="lab">What happens now</span><p class="txt">${esc(d.text)}</p><div class="rl-team">${d.party.slice(0, 6).map((f) => `<span>${icon(f, 38, 'filter:grayscale(1) brightness(.7)')}</span>`).join('')}<em>Your team gets back up</em></div></div>`
    + tap() + keys(['Z', 'Carry on', 'next']));
}
