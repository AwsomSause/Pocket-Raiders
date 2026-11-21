// The Pocket look's battle cards (mock-up pages `vs`, Trainer Intro, and `ace`, Ace Announcement). The battle decides
// when a card shows and for how long; the animations thread's playback moves it. For that playback each card has a
// root with a state class (`is-in` plays the entrance, `is-hold` stands every part at its end, `is-out` leaves),
// its durations as CSS variables (`--pk-in`, `--pk-out`) and a `data-key` on every part it may move. Presentation only.

import type { CutModel } from '../../redux/screens/cut';
import type { VersusModel } from '../../redux/screens/versus';
import { ballArt, type PkArt } from '../art';
import { act, esc, page, spr, sprH, ty, typeColour } from '../kit';
import { fit, fitPic, pkArtOf } from '../templates';
import { rxUrl } from '../../redux/assets';

/** A card's playback state (see the file's head). */
export type PkCue = 'in' | 'hold' | 'out';
/** How long each card's entrance and exit take, in seconds (the mock-ups' timelines). */
export const PK_CUE_TIMES = { vs: { in: 1.36, out: 0.3 }, ace: { in: 1.55, out: 0.3 }, boss: { in: 1.7, out: 0.3 } } as const;

const cueRoot = (cls: string, key: keyof typeof PK_CUE_TIMES, cue: PkCue = 'in', style = ''): string =>
  `<div class="scr ${cls} gx-cue is-${cue}" data-key="${key}" style="--pk-in:${PK_CUE_TIMES[key].in}s;--pk-out:${PK_CUE_TIMES[key].out}s${style ? `;${style}` : ''}">`;

/** A row of six balls: `n` full ones, `ko` of them greyed (fainted), the rest empty slots. */
function balls(n: number, ko = 0): string {
  const full = Math.max(0, Math.min(6, Math.floor(n)));
  return `<span class="balls">${Array.from({ length: 6 }, (_, i) => spr(i < full ? ballArt('pb') : ballArt('premier'), 1.5, i < full ? (i >= full - ko ? 'ko' : '') : 'none')).join('')}</span>`;
}

/** The Trainer Intro: the screen splits, both Trainers slide in, VS stamps down, then names and balls. A click moves on. */
export function pkVersus(d: VersusModel, cue: PkCue = 'in'): string {
  const me = pkArtOf(d.player), foe = pkArtOf(d.cast);
  const say = d.line ? `${d.name}: "${d.line}"` : d.role ? `${d.role} ${d.name} wants to battle!` : `${d.name} wants to battle!`;
  return page('vs', 26, cueRoot(`vsp${d.evil ? ' gx-evil' : ''}`, 'vs', cue)
    + `<div class="vs-l" data-key="vs-l"></div><div class="vs-r" data-key="vs-r"></div>`
    + (me ? `<div class="vs-me" data-key="vs-me">${sprH(me, 345)}</div>` : '') + (foe ? `<div class="vs-foe" data-key="vs-foe">${sprH(foe, 370)}</div>` : '')
    + `<div class="vs-n me" data-key="vs-n-me"><small>Challenger</small><b style="font-size:${fit(d.playerName, 300, 52, 26, 0.5)}px">${esc(d.playerName)}</b><span>${balls(d.party.length)}</span></div>`
    + `<div class="vs-n foe" data-key="vs-n-foe"><small style="font-size:${fit(d.role || 'Trainer', 300, 12, 9, 0.62)}px">${esc(d.role || 'Trainer')}</small><b style="font-size:${fit(d.name, 300, 52, 26, 0.5)}px">${esc(d.name)}</b><span>${balls(d.team)}</span></div>`
    + `<div class="vs-mark" data-key="vs-mark"><b>VS</b></div>`
    + `<div class="vs-say" data-key="vs-say"><p style="font-size:${fit(say, 1500, 17, 13, 0.5)}px">${esc(say)}</p><div class="btn on nx"${act('next')}><b>Next</b></div></div>`
    + `<div class="gx-hit"${act('next')}></div></div>`);
}

/** The Boss Intro (mock-up `boss-intro`): a Gym Leader, Elite Four member or Champion in a cut-in, with what the battle holds as chips. */
export function pkBoss(d: VersusModel & { pkBoss: NonNullable<VersusModel['pkBoss']> }, cue: PkCue = 'in'): string {
  const b = d.pkBoss, foe = pkArtOf(d.cast);
  const say = d.line ? `${d.name}: "${d.line}"` : `${d.role} ${d.name} wants to battle!`;
  const bold = (t: string): string => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  return page('boss-intro', 26, cueRoot('cut cboss', 'boss', cue, `--c:${typeColour(b.type)}`)
    + '<i class="ct-rays"></i>' + (foe ? `<div class="ct-mon" data-key="ct-mon">${sprH(foe, 300)}</div>` : '')
    + `<div class="ct-title" data-key="ct-title"><small style="font-size:${fit(b.where, 440, 13, 10, 0.62)}px">${esc(b.where)}</small><b style="font-size:${fit(d.name, 440, 88, 44, 0.5)}px">${esc(d.name)}</b></div>`
    + `<div class="ct-chips" data-key="ct-chips">${b.chips.map((c) => `<span>${bold(c)}</span>`).join('')}</div>`
    + `<div class="vs-say" data-key="vs-say"><p style="font-size:${fit(say, 1500, 17, 13, 0.5)}px">${esc(say)}</p><div class="btn on nx"${act('next')}><b>Next</b></div></div>`
    + `<div class="gx-hit"${act('next')}></div></div>`);
}

/** What the Legendary and Ultra Beast cut-ins show (mock-up pages `legend` and `ub`). Only true facts go in `chips`. */
export interface PkCutIn {
  page: 'legend' | 'ub';
  /** The small line over the name: "Legendary Pokémon · Cerulean Cave", "Ultra Deep Sea · Ultra Beast". */
  where: string;
  type: string;
  /** Chips; `**word**` is drawn bold. A chip starting with `ball:` draws the Beast Ball after its text. */
  chips: readonly string[];
  say: string;
  /** The backdrop picture's file (under assets/images), or null for the card's own dark. */
  backdrop: string | null;
}

/** A wild Legendary (`cleg`: rays, the shine spiral, the glowing Pokémon) or an Ultra Beast (`cub`: the wormhole). */
export function pkCutIn(d: CutModel & { pkCut: PkCutIn }, cue: PkCue = 'in'): string {
  const k = d.pkCut, mon = pkArtOf(d.mon);
  const bold = (t: string): string => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const chip = (t: string): string => (t.startsWith('ball:') ? `<span>${bold(t.slice(5))} ${spr(ballArt('ub'), 1.5)}</span>` : `<span>${bold(t)}</span>`);
  const leg = k.page === 'legend';
  return page(k.page, 26, cueRoot(leg ? 'cut cleg' : 'cut cub', 'boss', cue, `--c:${leg ? '#8a5cff' : '#7a4fd0'}`)
    + (k.backdrop ? `<img class="px ct-bg" src="${esc(rxUrl(k.backdrop))}" alt="" data-key="ct-bg">` : '')
    + (leg ? '' : '<i class="hole22" data-key="ct-hole"></i>') + '<i class="ct-rays"></i>'
    + (leg ? '<i class="gx-spiral" data-key="ct-spiral"></i>' : '')
    + (mon ? `<div class="ct-mon" data-key="ct-mon">${fitPic(mon, leg ? 340 : 260, leg ? 325 : 280, '', 4)}</div>` : '')
    + `<div class="ct-title" data-key="ct-title"><small style="font-size:${fit(k.where, 440, 13, 10, 0.62)}px">${esc(k.where)}</small><b style="font-size:${fit(d.name, 440, 88, 44, 0.5)}px">${esc(d.name)}</b></div>`
    + `<div class="ct-chips" data-key="ct-chips">${k.chips.map(chip).join('')}</div>`
    + `<div class="vs-say" data-key="vs-say"><p style="font-size:${fit(k.say, 1500, 17, 13, 0.5)}px">${bold(k.say)}</p><div class="btn on nx"${act('next')}><b>Next</b></div></div>`
    + `<div class="gx-hit"${act('next')}></div></div>`);
}

/** The Ace Announcement over the battle: the arena dims, a band slams across, the name stamps in, the ace lands with its gold tag. */
export function pkAce(d: CutModel & { types?: readonly string[]; facts?: readonly string[] }, cue: PkCue = 'in'): string {
  const mon: PkArt | null = pkArtOf(d.mon), who = pkArtOf(d.cast);
  const colour = typeColour(d.types?.[0] ?? 'water');
  const facts = [...(d.types ?? []).map((t) => ty(t)), ...(d.facts ?? []).map((f) => `<em>${esc(f)}</em>`)].join('');
  return page('ace', 26, cueRoot('acep gx-ace', 'ace', cue)
    + `<i class="gx-shade-in" data-key="ace-dim"></i>`
    + `<div class="aceband" data-key="ace-band" style="--t:${colour}"><div class="ab-in">${who ? `<i class="ab-por" data-key="ace-por">${sprH(who, 148)}</i>` : ''}<div class="ab-t"><small>${esc(d.role || 'Ace')}</small><b data-key="ace-name" style="font-size:${fit(d.name, 520, 68, 34, 0.5)}px">${esc(d.name)}</b>${facts ? `<span data-key="ace-facts">${facts}</span>` : ''}</div></div></div>`
    + (mon ? `<div class="ab-mon" data-key="ace-mon">${fitPic(mon, 280, 250, '', 4)}<i class="ab-star" data-key="ace-star">★ Ace</i></div>` : '')
    + `<div class="gx-hit"${act('next')}></div></div>`, true);
}
