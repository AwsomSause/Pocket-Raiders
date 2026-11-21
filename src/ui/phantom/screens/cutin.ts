// Phantom UI: the full-screen cards around a battle. The versus card (mock-up `vs`): your side and the foe's on a
// split page, the cut-out VS between them, what the foe says and what is at stake. The cutscene card, in three cuts:
// a boss's entrance (mock-up `boss`), an ace or a Legendary stepping out (mock-up `ace`), and a transformation
// (mock-up `mega`). Pure drawing; the battle decides when a card shows and for how long.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import { CUT_BEATS, type CutModel } from '../../redux/screens/cut';
import type { VersusModel } from '../../redux/screens/versus';
import { type Art, figure } from '../../redux/templates';
import { rxUrl } from '../../redux/assets';
import { act, esc, keys, mon, page, pic, ransom, ty } from '../kit';
import { phHead } from '../templates';
import { tall } from './event';

const ballRow = (n: number): string => Array.from({ length: Math.max(0, Math.min(6, Math.floor(n))) }, () => '<i class="ph-vs-ball"></i>').join('');
/** A long name steps its letters down so it stays on one line. */
const nameSize = (name: string): number => (name.length > 16 ? 34 : name.length > 11 ? 46 : 64);
/** What is said, in one pair of quote marks (a line that carries its own keeps them). */
export const quoted = (line: string): string => {
  const said = line.trim().replace(/^["“]([^"“”]*)["”]$/, '$1');
  return !said ? '' : /["“”]/.test(said) ? esc(said) : `“${esc(said)}”`;
};

export function phVersus(_ph: PhantomVersion, d: VersusModel): string {
  const rest = Math.max(0, Math.min(6, Math.floor(d.team)) - (d.lead ? 1 : 0));
  const mine = d.party.slice(0, 6).map((f) => (f ? mon(f, 1) : '<i class="ph-vs-ball"></i>')).join('');
  const said = quoted(d.line), len = d.line.length;
  const role = d.role || 'Trainer';
  return page('vs', `<div class="vs-r${d.evil ? ' ph-vs-evil' : ''}" aria-hidden="true"></div><div class="vs-l"><div class="burst" style="--x:30%;--y:60%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div></div><div class="vs-cut" aria-hidden="true"></div>`
    + phHead(/battle$/i.test(role) ? role : `${role.split(' · ')[0]} battle`, d.where ?? '')
    + `<div class="vs-p l ph-vs-p">${d.player ? tall(d.player, 420, 470) : ''}</div><div class="vs-p r ph-vs-p">${d.cast ? tall(d.cast, 420, 470) : ''}</div>`
    + `<div class="vs-n l"><span class="lab">You · ${d.party.length} Pokémon</span><h3 class="tl1" style="font-size:${nameSize(d.playerName)}px">${esc(d.playerName)}</h3><div class="bl6">${mine}</div></div>`
    + `<div class="vs-n r"><span class="lab">${esc(role)}</span><h3 class="tl1" style="font-size:${nameSize(d.name)}px">${esc(d.name)}</h3><div class="bl6">${d.lead ? mon(d.lead, 1) : ''}${ballRow(rest)}</div></div>`
    + `<div class="vs-v" aria-label="versus">${ransom('VS', 3)}</div>`
    + (said ? `<div class="pn lt vs-q tilt" style="--r:2deg"><p class="txt"${len > 110 ? ' style="font-size:18px"' : len > 70 ? ' style="font-size:21px"' : ''}>${said}</p></div>` : '')
    + (d.stake ? `<div class="pn vs-s"><span class="lab">What is at stake</span><p class="txt">${esc(d.stake)}</p></div>` : '')
    + `<div class="ph-fill"${act('next')}></div>` + keys(['Z', 'Battle', 'next']));
}

/** The moving band of words along the top and the bottom edge. */
const cine = (word: string): string => { const run = `${esc(word.toUpperCase())} · `.repeat(Math.max(8, Math.ceil(220 / (word.length + 3)))); return `<div class="cine" aria-hidden="true"><i><u>${run}</u></i><i><u>${run}</u></i></div>`; };
/** The five-beat strip, and the key that skips. */
const beats = (on: number): string => `<div class="ph-ct-beat" aria-label="${CUT_BEATS[on]}">${CUT_BEATS.map((_, k) => `<i class="${k <= on ? 'on' : ''}"></i>`).join('')}<span>${CUT_BEATS[on]}</span></div>`;
const TRANSFORMS = new Set(['mega', 'primal', 'dynamax', 'gigantamax', 'zmove', 'tera', 'evolve', 'hyper', 'overdrive']);
/** Which of the three cuts a moment gets. */
export const cutLook = (d: Pick<CutModel, 'kind' | 'mon' | 'cast'>): 'ace' | 'form' | 'boss' =>
  TRANSFORMS.has(d.kind ?? '') ? 'form' : (d.kind === 'aceEntrance' || d.kind === 'raidIntro' || d.kind === 'raidDefeat') && d.mon ? 'ace' : 'boss';

export function phCut(_ph: PhantomVersion, d: CutModel): string {
  const on = Math.max(0, Math.min(4, Math.floor(d.beat)));
  const hint = d.skip === null ? null : d.skip ?? (['Esc', 'skip'] as const);
  const foot = beats(on) + `<div class="ph-fill ph-ct-next"${act('next')}></div>` + (hint ? keys([hint[0], hint[1], 'next']) : '');
  const said = quoted(d.line), len = d.line.length;
  const sayAt = len > 220 ? 17 : len > 150 ? 19 : len > 90 ? 22 : 26;
  const name = d.name.trim() || d.role, n = name.length;
  const look = cutLook(d);
  const who = d.cast ?? d.player ?? null;
  const band = d.tag?.trim() || d.role || name;
  if (look === 'ace') {
    // The Pokémon steps out: the one who sends it in the red cut, its name in cut-out letters, the star over it.
    const star = /ace/i.test(band) ? 'ACE' : /final/i.test(band) ? 'LAST' : '★';
    return page('ace', '<div class="bgk"></div><div class="ac-rays" aria-hidden="true"></div>' + cine(band.replace(/!+$/, ''))
      + `<div class="ac-cut"><div class="ac-face ph-ct-face">${d.cast ? tall(d.cast, 520, 560) : ''}</div></div><div class="ac-edge" aria-hidden="true"></div><div class="ac-edge b" aria-hidden="true"></div>`
      + `<div class="ac-mon ph-ct-pk">${d.mon ? figure(d.mon, 300) : ''}</div>`
      + (d.role ? `<div class="ac-k"><span>${esc(d.role)}</span></div>` : '')
      + `<div class="ac-t" style="font-size:${n > 16 ? 56 : n > 11 ? 78 : n > 8 ? 96 : 118}px">${ransom(name.toUpperCase(), 5)}</div>`
      + `<div class="ac-star" aria-hidden="true"><b>${star}</b></div>`
      + (d.tags ? `<div class="ac-tags"><b>Lv.${d.tags.level}</b>${d.tags.types.map((t) => ty(t)).join('')}</div>` : '')
      + (said ? `<div class="pn lt ac-say tilt" style="--r:-2deg"><p class="txt" style="font-size:${sayAt}px">${said}</p></div>` : '')
      + '<div class="flashw" aria-hidden="true"></div>' + foot);
  }
  if (look === 'form') {
    // A transformation: the Trainer in the slanted cut, the Pokémon in the ring, the words in cut-out letters.
    const words = (d.role || name).toUpperCase().split(/\s+/), half = Math.ceil(words.length / 2);
    const lines = words.length > 1 ? [words.slice(0, half).join(' '), words.slice(half).join(' ')] : [words[0] ?? ''];
    const longest = Math.max(...lines.map((w) => w.length));
    return page('mega', '<div class="bgk"></div>'
      + `<div class="cut"><div class="rays" aria-hidden="true"></div><div class="face ph-ct-face">${who ? tall(who, 420, 470) : ''}</div></div><div class="cutedge" aria-hidden="true"></div><div class="cutedge b" aria-hidden="true"></div>`
      + `<div class="megaring ph-ct-ring"><div class="ring2" aria-hidden="true"></div></div><div class="ph-ct-pk form">${d.mon ? figure(d.mon, 300) : ''}</div>`
      + `<div class="megat" style="font-size:${longest > 11 ? 54 : longest > 8 ? 66 : 80}px">${lines.map((w, k) => ransom(w, 3 + k)).join('')}</div>`
      + `<div class="megasay" style="font-size:${sayAt}px">${n && name !== d.role ? `<b>${esc(name.toUpperCase())}</b> ` : ''}${esc(d.line)}</div>`
      + '<div class="flashw" aria-hidden="true"></div>' + foot);
  }
  // A boss, a rival, a scene with one speaker: the big portrait over its own shadow, the name in cut-out letters.
  const brings = d.brings ? `<div class="bs-row"><div class="bl6">${ballRow(d.brings.team)}</div><b>${d.brings.team} Pokémon</b></div>${d.brings.notes.map((t) => `<p class="txt ph-ct-note">${esc(t)}</p>`).join('')}` : '';
  const panel = said || brings ? `<div class="pn bs-i ph-ct-i">${said ? `<span class="lab">${esc(d.cast ? name : d.role || name)}</span><p class="txt" style="font-size:${sayAt}px">${said}</p>` : ''}${brings ? `<span class="lab">Brings</span>${brings}` : ''}</div>` : '';
  return page('boss', `<div class="bs-bg${d.evil ? ' ph-ct-evil' : ''}" aria-hidden="true"></div>`
    + (who ? `<div class="bs-sil" aria-hidden="true">${figure(who, 620)}</div>` : '') + cine(band)
    + `<div class="bs-p ph-ct-p">${d.mon && d.cast ? `<span class="ph-ct-with">${figure(d.mon, 240)}</span>` : ''}${who ? tall(who, 500, 560) : d.mon ? figure(d.mon, 320) : ''}</div>`
    + `<div class="bs-t">${d.where ? `<span class="lab">${esc(d.where)}</span>` : ''}${d.role && d.role !== name ? `<em>${esc(d.role)}</em>` : ''}<span class="ph-ct-name" style="font-size:${n > 22 ? 40 : n > 15 ? 56 : n > 10 ? 76 : 104}px">${ransom(name.toUpperCase(), 7)}</span></div>`
    + panel + foot);
}

/** A transformation as it happens in battle: who changes, who gives the order, and the facts the card names. */
export interface GimmickCard {
  kind: 'mega' | 'primal' | 'tera' | 'dynamax' | 'gigantamax' | 'zmove';
  /** The Pokémon's name and picture (the new form's, where it has one). */
  name: string;
  mon: Art | null;
  /** Who gives the order: their name ('' for a wild Pokémon) and picture. */
  trainer: string;
  cast: Art | null;
  /** The Mega Stone or Z-Crystal, by name. */
  item?: string;
  /** The Tera type, or the Z-Move's type. */
  type?: string;
  /** The Z-Move: its name and power (null for a status Z-Move). */
  move?: { name: string; power: number | null };
  /** Dynamax: HP before and after, and how many turns it lasts. */
  hp?: readonly [number, number];
  turns?: number;
  /** Dynamax: the Pokémon across the field, small beside the giant. */
  foe?: Art | null;
}

const letters = (word: string): string => [...word.toUpperCase()].map((ch, k) => (ch === ' ' ? '<i></i>' : `<b style="--i:${k}">${esc(ch)}</b>`)).join('');
const cap = (t: string): string => (t ? t[0]!.toUpperCase() + t.slice(1).toLowerCase() : '');
const SHARDS = [[90, 60, -20], [980, 40, 30], [60, 470, 160], [1040, 460, 200], [520, 20, 80]] as const;
const GIM_WORDS: Record<GimmickCard['kind'], string> = { mega: 'Mega Evolution', primal: 'Primal Reversion', tera: 'Terastallize', dynamax: 'Dynamax', gigantamax: 'Gigantamax', zmove: 'Z-Move' };

/** The cut-in of a Mega Evolution, a Terastallization, a Dynamax or a Z-Move (mock-ups `mega`, `tera`, `dmax`, `zmove`). */
export function phGimmick(_ph: PhantomVersion, d: GimmickCard): string {
  const foot = `<div class="flashw" aria-hidden="true"></div><div class="ph-fill ph-ct-next"${act('next')}></div>` + keys(['Z', 'Skip', 'next']);
  const name = esc(d.name), who = d.trainer ? esc(d.trainer) : '';
  if (d.kind === 'tera') {
    const t = cap(d.type ?? '');
    return page('tera', '<div class="bgk"></div><div class="tr-pr" aria-hidden="true"></div><div class="tr-fc" aria-hidden="true"></div>'
      + SHARDS.map(([x, y, r], k) => `<div class="tr-sh" style="left:${x}px;top:${y}px;--r:${r}deg;--i:${k}" aria-hidden="true"><i class="ph-gm-shard"></i></div>`).join('')
      + `<div class="tr-crown ph-gm-crown" aria-hidden="true">${t ? `<img class="px" src="${rxUrl(`packs/story/badge/${t.toLowerCase()}.png`)}" alt="">` : ''}</div><div class="tr-mon ph-ct-pk">${d.mon ? figure(d.mon, 380) : ''}</div>`
      + `<div class="tr-t" aria-label="Terastallize">${letters('Terastallize')}</div>`
      + (t ? `<div class="tr-ty"><span>Tera type</span>${ty(t)}</div>` : '')
      + `<div class="pn lt tr-say"><p class="txt">${name} Terastallized${t ? ` into the <b>${esc(t)}</b> type` : ''}!</p></div>` + foot);
  }
  if (d.kind === 'dynamax' || d.kind === 'gigantamax') {
    const turns = Math.max(0, Math.min(6, Math.floor(d.turns ?? 0)));
    return page('dmax', '<div class="bgk"></div><div class="dx-sky" aria-hidden="true"></div><div class="dx-beam" aria-hidden="true"></div>'
      + `<div class="dx-mon ph-ct-pk">${d.mon ? figure(d.mon, 640) : ''}</div><div class="dx-gnd" aria-hidden="true"></div>${d.foe ? `<div class="dx-foe ph-ct-pk">${figure(d.foe, 110)}</div>` : ''}`
      + `<div class="dx-t${d.kind === 'gigantamax' ? ' ph-gm-gx' : ''}" aria-label="${GIM_WORDS[d.kind]}">${letters(GIM_WORDS[d.kind])}</div>`
      + (turns ? `<div class="dx-turn"><span>Lasts</span>${'<i></i>'.repeat(turns)}<b>${turns} turn${turns === 1 ? '' : 's'}</b></div>` : '')
      + (d.hp ? `<div class="dx-hp"><span>HP</span><div><i></i></div><b>${d.hp[0]} <em>→</em> ${d.hp[1]}</b></div>` : '')
      + `<div class="pn lt dx-say"><p class="txt">${name} grew enormous! Its moves became <b>Max Moves</b>.</p></div>` + foot);
  }
  if (d.kind === 'zmove') {
    const words = (d.move?.name ?? 'Z-Move').split(/\s+/), last = words.length > 1 ? words.pop()! : '';
    const longest = Math.max(words.join(' ').length, last.length);
    return page('zmove', '<div class="zm-bg" aria-hidden="true"></div><div class="zm-ray" aria-hidden="true"></div><div class="zm-z" aria-hidden="true">Z</div>'
      + `<div class="zm-tr ph-ct-face">${d.cast ? tall(d.cast, 440, 500) : ''}</div><div class="zm-orb ph-gm-orb" aria-hidden="true"><i></i></div>`
      + `<div class="zm-mon ph-ct-pk">${d.mon ? figure(d.mon, 320) : ''}</div>`
      + '<div class="zm-k"><span>Z-Move · once per battle</span></div>'
      + `<div class="zm-t"${longest > 12 ? ' style="scale:.78;transform-origin:0 0"' : ''}>${last ? `<em>${esc(words.join(' '))}</em><strong>${esc(last)}</strong>` : `<strong>${esc(words[0] ?? '')}</strong>`}</div>`
      + `<div class="zm-tags">${d.type ? ty(d.type) : ''}${d.move?.power ? `<b>Power ${d.move.power}</b>` : ''}${d.item ? `<span class="ac-it">${esc(d.item)}</span>` : ''}</div>`
      + `<div class="pn lt zm-say"><p class="txt">${who ? `${who} and ${name} let` : `${name} lets`} loose ${who ? 'their' : 'its'} full-force <b>Z-Power</b>!</p></div>` + foot);
  }
  // Mega Evolution and Primal Reversion (mock-up `mega`): the field dims, the Pokémon fills the slanted cut in close-up,
  // the Mega Ring's stone spins top right, and the cut-out words and the line below.
  const [a, b] = GIM_WORDS[d.kind].toUpperCase().split(' ');
  const say = d.kind === 'primal' ? `${name} returns to its <b>PRIMAL</b> form!`
    : d.item ? `${name}'s <b>${esc(d.item.toUpperCase())}</b> is reacting to ${who ? `${who}'s` : 'the'} Mega Ring!` : `${name} is Mega Evolving!`;
  const ring = d.kind === 'mega' ? `<div class="megaring ph-gm-ring" aria-hidden="true"><div class="ring2">${pic('packs/dbk/mega/ring.png', 3)}</div>${pic('packs/dbk/mega/icon.png', 2.4)}</div>` : '';
  return page('mega', '<div class="dim ph-gm-dim" aria-hidden="true"></div>'
    + `<div class="cut"><div class="rays" aria-hidden="true"></div><div class="face ph-gm-close">${d.mon ? figure(d.mon, 860) : ''}</div></div><div class="cutedge" aria-hidden="true"></div><div class="cutedge b" aria-hidden="true"></div>`
    + ring + `<div class="megat">${ransom(a ?? '', 3)}${ransom(b ?? '', 4)}</div><div class="megasay">${say}</div>` + foot);
}
