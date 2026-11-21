// The Pocket look's Type Chart (mock-up page `types`, new to the game outside the Phantom look): the eighteen types as
// tiles six across, and the lit type's card: what it hits hard, what it hits weakly, what hits it hard, what it shrugs
// off, and what cannot touch it either way. It reads the game's type chart (content.typeChart). Presentation only.

import type { TypeChart, TypeName } from '../../../core/contentSchema';
import { badgeArt } from '../art';
import { act, esc, hdr, keys, page, type PkKey, typeColour } from '../kit';
import { fitPic } from '../templates';
import { tyChip } from './party';

/** The mock-up's order, six across. */
export const PK_TYPE_ORDER = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'] as const;
export const PK_TYPE_COLS = 6;

export interface PkTypesModel {
  types: readonly string[];
  index: number;
  chart: TypeChart;
  /** Inside the pause menu's Pokédex: the clicks go to it (dexType, dexGo). */
  book?: boolean;
}

const mult = (chart: TypeChart, a: string, d: string): number => chart[a as TypeName]?.[d as TypeName] ?? 1;
const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);

/** The lit type's rows: [label, types] for each that is not empty ("Hits hard" and "Takes double from" always show). */
export function typeRows(chart: TypeChart, types: readonly string[], on: string): [string, string[]][] {
  const att = (f: (m: number) => boolean): string[] => types.filter((t) => f(mult(chart, on, t)));
  const def = (f: (m: number) => boolean): string[] => types.filter((t) => f(mult(chart, t, on)));
  const rows: [string, string[], boolean][] = [
    ['Hits hard', att((m) => m > 1), true],
    ['Weak hit on', att((m) => m > 0 && m < 1), false],
    ['No effect on', att((m) => m === 0), false],
    ['Takes double from', def((m) => m > 1), true],
    ['Shrugs off', def((m) => m > 0 && m < 1), false],
    ['Can’t be hit by', def((m) => m === 0), false],
  ];
  return rows.filter(([, list, always]) => always || list.length).map(([l, list]) => [l, list]);
}

export function pkTypes(d: PkTypesModel): string {
  const index = Math.max(0, Math.min(d.types.length - 1, d.index)), on = d.types[index] ?? 'normal';
  const pick = (i: number): string => (d.book ? act('dexType', i) : act('pick', i, 'over'));
  const tiles = d.types.map((t, i) => `<div class="tc${i === index ? ' on' : ''}" style="--t:${typeColour(t)}" data-key="tc-${t}"${pick(i)}>${fitPic(badgeArt(t), 40, 40, '', 2)}<b>${esc(cap(t))}</b></div>`).join('');
  const rows = typeRows(d.chart, d.types, on).map(([l, list]) => `<div class="tc-row"><span>${esc(l)}</span><div>${list.length ? list.map(tyChip).join('') : '<em class="gx-tc-none">Nothing</em>'}</div></div>`).join('');
  const side = `<div class="tc-side pn" style="--t:${typeColour(on)}" data-key="tc-side"><div class="tc-h">${fitPic(badgeArt(on), 56, 56, '', 3)}<b>${esc(cap(on))}</b></div>${rows}</div>`;
  const ks: PkKey[] = [['←→↑↓', 'pick a type'], d.book ? ['Esc', 'back', 'dexGo', 'back'] : ['Esc', 'back', 'back']];
  return page('types', 26, `<div class="scr types" data-key="types">${hdr('Type Chart', { area: 'dex', crumb: ['Pokédex', 'Type Chart'] })}<div class="tc-grid" data-key="tc-grid">${tiles}</div>${side}${keys(ks)}</div>`);
}
