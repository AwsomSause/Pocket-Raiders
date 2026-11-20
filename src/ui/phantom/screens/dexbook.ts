// Phantom UI: the Pokédex of the pause menu (mock-up `dex`) and the type chart behind an entry (mock-up `types`).
// The list is a wall of pictures with the picked species on a tilted card; the chart is the eighteen types as
// tiles with what the picked one hits and what hits it. Both only draw: ../../phantomDex.ts keeps the place and
// the input, and every number comes from the profile and the game's own type chart. Presentation only.

import type { TypeChart, TypeName } from '../../../core/contentSchema';
import type { PhantomVersion } from '../../../core/presentation/phantom';
import { gridStart } from '../../redux/templates';
import { rxUrl } from '../../redux/assets';
import { act, esc, keys, mon, page, TYC, ty } from '../kit';
import { phHead } from '../templates';

/** The order the chart shows the types in (the mock-up's). */
export const TYPE_ORDER = ['normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'] as const;
export const DEX_COLS = 6;
export const DEX_ROWS = 4;
export const TYPE_COLS = 3;

/** Where a step through a grid lands: one cell sideways, one row up or down, and no move past an edge. */
export function gridStep(index: number, n: number, cols: number, action: 'up' | 'down' | 'left' | 'right' | 'confirm' | 'back'): number {
  const next = index + (action === 'left' ? -1 : action === 'right' ? 1 : action === 'up' ? -cols : action === 'down' ? cols : 0);
  if (action === 'down' && next >= n && Math.floor(index / cols) < Math.floor((n - 1) / cols)) return n - 1;
  return next < 0 || next >= n ? index : next;
}

export interface DexListCell {
  /** "0094". */
  no: string;
  file: string | null;
  /** Not met: the picture is a shadow, or a question mark when the field notes have no shadow of it. */
  unknown: boolean;
}

export interface DexListModel {
  /** "Generation 1 Pokédex". */
  set: string;
  /** The filter that is on ("All", "Seen", "Owned", "Mastered"). */
  tab: string;
  /** Met and caught in every set together. */
  seen: number;
  caught: number;
  n: number;
  cell: (i: number) => DexListCell;
  index: number;
  card: {
    no: string;
    name: string;
    types: readonly string[];
    file: string | null;
    unknown: boolean;
    lines: readonly string[];
    /** The mastery rank in words, how many of the four pips are filled, and what the next one asks. Null until caught. */
    rank: { name: string; at: number; next: string } | null;
  } | null;
  /** More than one set to turn through. */
  sets: boolean;
}

const fit = (t: string, room: number, big: number, small: number): number => Math.max(small, Math.min(big, Math.floor(room / Math.max(1, t.length * 0.56))));

export function phDexList(_ph: PhantomVersion, d: DexListModel): string {
  const size = DEX_COLS * DEX_ROWS, s = gridStart(d.n, d.index, size, DEX_COLS), k = d.card;
  const cells = Array.from({ length: Math.max(0, Math.min(size, d.n - s)) }, (_, q) => {
    const i = s + q, c = d.cell(i);
    return `<div class="dx ph-dxl${i === d.index ? ' on' : ''}${c.unknown ? ' unk' : ''}" data-key="c${i}" style="--i:${q}"${act('dexPick', i, 'dexOver')}><small>${esc(c.no)}</small>${c.file ? mon(c.file, 0.9, '', '', true) : '<em>?</em>'}</div>`;
  }).join('');
  const more = d.n > size ? `<div class="ph-more2" style="left:560px;top:122px;width:164px;text-align:right">${s > 0 ? '▲ ' : ''}${s + 1}–${Math.min(d.n, s + size)} of ${d.n}${s + size < d.n ? ' ▼' : ''}</div>` : '';
  const card = k
    ? `<div class="dexcard ph-dxl-card" data-key="k${d.index}"><span class="no">No. ${esc(k.no)}</span><h3 style="font-size:${fit(k.name, 370, 64, 26)}px">${esc(k.name)}</h3>`
      + `<div class="ph-dxl-ty">${k.types.map(ty).join('')}</div><div class="pic">${k.file ? mon(k.file, 2.2, k.unknown ? 'ol sil' : 'ol', k.unknown ? 'filter:brightness(0) invert(.25)' : '', true) : '<b class="ph-de-q">?</b>'}</div>`
      + k.lines.map((l, i) => `<p${i === 0 ? '' : ' class="s"'}>${esc(l)}</p>`).join('')
      + (k.rank ? `<p><b>MASTERY: ${esc(k.rank.name.toUpperCase())}</b>${k.rank.next ? ` · ${esc(k.rank.next)}` : ''}</p><div class="rank" aria-label="mastery, ${k.rank.at} of 4">${[0, 1, 2, 3].map((r) => `<i${r < k.rank!.at ? ' class="f"' : ''}></i>`).join('')}</div>` : '')
      + '</div>'
    : `<div class="dexcard ph-dxl-card"><span class="no">${esc(d.tab)}</span><h3 style="font-size:40px">Nothing here yet</h3><p>No Pokémon of this set fits this filter. Press C for another one.</p></div>`;
  return page('dex', '<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(58% 0,100% 0,100% 100%,66% 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:84%;--y:50%" aria-hidden="true"></div>'
    + phHead('Pokédex', `${d.set} · ${d.tab} ${d.n}`)
    + `<div class="dexcount"><span>SEEN <b>${d.seen}</b></span><span>CAUGHT <b>${d.caught}</b></span></div>`
    + `<div class="dexgrid ph-dxl-grid">${cells}</div>` + more + card
    + keys(['Z', 'Entry', 'dexGo', 'entry'], ...(d.sets ? [['Q E', 'Region', 'dexGo', 'next'] as const] : []), ['C', `Show: ${d.tab}`, 'dexGo', 'tab'], ['T', 'Type chart', 'dexGo', 'types'], ['X', 'Back', 'dexGo', 'back']));
}

export interface TypesModel {
  types: readonly string[];
  index: number;
  chart: TypeChart;
}

export interface TypeRows { x2: string[]; half: string[]; zero: string[] }

/** What `type` does when it attacks each single type. */
export function typeAttacks(chart: TypeChart, types: readonly string[], type: string): TypeRows {
  const of = (want: (m: number) => boolean): string[] => types.filter((t) => want(chart[type as TypeName]?.[t as TypeName] ?? 1));
  return { x2: of((m) => m > 1), half: of((m) => m > 0 && m < 1), zero: of((m) => m === 0) };
}

/** What each type does when it attacks `type`. */
export function typeHitBy(chart: TypeChart, types: readonly string[], type: string): TypeRows {
  const of = (want: (m: number) => boolean): string[] => types.filter((t) => want(chart[t as TypeName]?.[type as TypeName] ?? 1));
  return { x2: of((m) => m > 1), half: of((m) => m > 0 && m < 1), zero: of((m) => m === 0) };
}

const badge = (t: string): string => rxUrl(`packs/story/badge/${t.toLowerCase()}.png`);

export function phTypes(_ph: PhantomVersion, d: TypesModel): string {
  const on = d.types[d.index] ?? d.types[0] ?? 'normal', name = on.charAt(0).toUpperCase() + on.slice(1), tc = TYC[on] ?? '#888';
  const tiles = d.types.map((t, i) => `<div class="tc-t${i === d.index ? ' on' : ''}" data-key="t${i}" style="--tc:${TYC[t] ?? '#888'};--i:${i}"${act('dexType', i)}><img class="px" src="${badge(t)}" alt=""><b>${esc(t)}</b></div>`).join('');
  const row = (mark: string, cls: string, list: readonly string[]): string => `<div class="tc-r"><b class="${cls}">${mark}</b><div>${list.length ? list.map(ty).join('') : '<em>nothing</em>'}</div></div>`;
  const panel = (label: string, r: TypeRows, top: number, key: string): string =>
    `<div class="pn tc-p ph-tc-p" data-key="${key}${d.index}" style="left:590px;top:${top}px"><span class="lab">${esc(label)}</span>${row('×2', 'u', r.x2)}${row('×½', 'd', r.half)}${row('×0', 'z', r.zero)}</div>`;
  return page('types', `<div class="bgk"></div><div class="shard" style="--c:${tc};--cp:polygon(44% 0,100% 0,100% 100%,38% 100%);inset:0;opacity:.9" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div>`
    + phHead('Type chart', 'Pokédex · Reference')
    + `<div class="tc-g">${tiles}</div>`
    + panel(`${name} attacks`, typeAttacks(d.chart, d.types, on), 132, 'a') + panel(`${name} is hit by`, typeHitBy(d.chart, d.types, on), 400, 'h')
    + keys(['▲▼◀▶', 'Pick a type'], ['X', 'Back', 'dexGo', 'back']));
}
