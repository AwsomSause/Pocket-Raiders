// Phantom UI: the Town Map pages. `town` is Hub Town as a map with its districts and the places of the lit one
// (a faster way to a door than walking; "walk instead" is always one key away); `place` is a place's rooms with who
// keeps it and what the lit room holds; `pocket` is Pocket Town's directory by hamlet with what is ready today.
// All three only draw: the scenes keep the cursor and open the same rooms and buildings the doors do.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import { rxUrl } from '../../redux/assets';
import { pic as rxPic, type Art } from '../../redux/templates';
import { act, esc, hero, keys, mon, page } from '../kit';
import { phHead } from '../templates';
import { tall } from './event';

const fit = (t: string, room: number, big: number, small: number): number => Math.max(small, Math.min(big, Math.floor(room / Math.max(1, t.length * 0.56))));
/** A line that has to stay one line: cut at a word, with an ellipsis. */
export function clip(t: string, n: number): string {
  if (t.length <= n) return t;
  const cut = t.slice(0, n - 1), sp = cut.lastIndexOf(' ');
  return `${(sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:]+$/, '')}…`;
}
const pct = (n: number, of: number): string => `${Math.round((n / of) * 10000) / 100}%`;

/** The map's tiles as runs of one kind along each row (grass is the ground under them all). */
const TILE: Record<string, string> = { T: 'mt', '#': 'mb', '=': 'mp', '~': 'mw', o: 'mo' };
export function mapRuns(rows: readonly string[]): { cls: string; x: number; y: number; w: number }[] {
  const out: { cls: string; x: number; y: number; w: number }[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; ) {
      const cls = TILE[row[x]!];
      let w = 1;
      while (x + w < row.length && row[x + w] === row[x]) w++;
      if (cls) out.push({ cls, x, y, w });
      x += w;
    }
  });
  return out;
}

export interface TownMapModel {
  /** "Hub Town" and "Evening, lamps on". */
  town: string;
  when: string;
  /** The map in tiles, and its rows (one letter a tile). */
  size: readonly [number, number];
  rows: readonly string[];
  districts: readonly { name: string; color: string; rect: readonly [number, number, number, number] }[];
  district: number;
  blurb: string;
  /** The places of the lit district, with their doors on the map. */
  places: readonly { name: string; small: string; x: number; y: number }[];
  place: number;
  /** The doors of the other districts. */
  pins: readonly { x: number; y: number }[];
  /** Where you stand (walking the town), with the Pokémon you walk as. */
  you: { x: number; y: number; file: string | null } | null;
  /** What M does: "Walk instead" from the menu, "Keep walking" in town. */
  walk: string;
}

export function phTownMap(_ph: PhantomVersion, d: TownMapModel): string {
  const [W, H] = d.size;
  const rects = mapRuns(d.rows).map((r) => `<rect class="${r.cls}" x="${r.x}" y="${r.y}" width="${r.w}" height="1.03"></rect>`).join('');
  const zones = d.districts.map((z, i) => `<div class="hm-z${i === d.district ? ' on' : ''}" style="left:${pct(z.rect[0], W)};top:${pct(z.rect[1], H)};width:${pct(z.rect[2], W)};height:${pct(z.rect[3], H)}"><span>${esc(z.name)}</span></div>`).join('');
  const door = (p: { x: number; y: number }): string => `left:${pct(p.x + 0.5, W)};top:${pct(p.y + 0.5, H)}`;
  const pins = d.pins.map((p) => `<i class="pin" style="${door(p)}"></i>`).join('')
    + d.places.map((p, i) => `<i class="pin n${i === d.place ? ' on' : ''}" style="${door(p)}"${act('mapPlace', i)}><b>${i + 1}</b>${i === d.place ? `<u>${esc(p.name)}</u>` : ''}</i>`).join('');
  const you = d.you ? `<div class="hm-you" style="${door(d.you)}">${d.you.file ? mon(d.you.file, 0.5, 'ol') : ''}<span>YOU</span></div>` : '';
  const tabs = d.districts.map((z, i) => `<span class="${i === d.district ? 'on' : ''}"${act('mapDistrict', i)}><i style="background:${esc(z.color)}"></i>${esc(z.name)}</span>`).join('');
  // A name keeps the version's own size unless it is too long for the row.
  const many = d.places.length > 6;
  const small = (name: string, on: boolean): string => { const base = many ? (on ? 28 : 22) : on ? 33 : 25, f = fit(name, on ? 300 : 380, base, 16); return f < base ? ` style="font-size:${f}px"` : ''; };
  const rows = d.places.map((p, i) => `<div class="hl-i pn${i === d.place ? ' lt on' : ''}" data-key="p${d.district}-${i}" style="--i:${i}"${act('mapPlace', i, 'mapOver')}><kbd>${i + 1}</kbd><b${small(p.name, i === d.place)}>${esc(p.name)}</b><span>${esc(clip(p.small, i === d.place ? 42 : 64))}</span>${i === d.place ? '<em>Z · GO THERE</em>' : ''}</div>`).join('');
  const none = d.places.length ? '' : '<div class="hl-i pn ph-hl-none"><b>Open ground</b><span>No door to knock on here. Walk it instead.</span></div>';
  return page('town', '<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(46% 0,100% 0,100% 100%,58% 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:86%;--y:40%" aria-hidden="true"></div>'
    + phHead('Town map', `${d.town} · ${d.when}`)
    + `<div class="hm tilt ph-hm" style="--r:-2deg"><svg class="hmap" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><rect class="mg" width="${W}" height="${H}"></rect>${rects}</svg>${zones}${pins}${you}</div>`
    + `<div class="hl ph-hl${d.places.length > 6 ? ' many' : ''}" data-key="d${d.district}"><div class="hl-t">${tabs}</div><p class="txt hl-b">${esc(d.blurb)}</p>${rows}${none}</div>`
    + keys(['◀▶', 'District'], ['▲▼', 'Place'], ['Z', 'Go', 'mapGo'], ['M', d.walk, 'mapWalk'], ['X', 'Back', 'mapBack']));
}

export interface PlaceModel {
  /** "Hub Town" and the district ("Champions' Row"; empty for a menu that is not a building). */
  town: string;
  district: string;
  name: string;
  rooms: readonly { label: string; small: string }[];
  index: number;
  /** Who keeps the place ("Arena steward") and what they say. */
  who: string;
  say: string;
  /** The keeper's picture; without one the version's own trainer stands there. */
  bust: Art | null;
  /** What the lit room holds: its name, a line, and (for a room of people) who is in it. */
  preview: { label: string; text: string; people: readonly { art: Art | null; name: string; small: string; on: boolean }[] };
  backdrop: string | null;
  /** The X key's word ("Back to town"). */
  back: string;
}

export function phPlace(ph: PhantomVersion, d: PlaceModel): string {
  const n = d.rooms.length, tight = n > 8 ? ' xs' : n > 5 ? ' sm' : '';
  const tilt = [-4, -2, -3, -1, -3, -2];
  const rooms = d.rooms.map((r, i) => `<div class="blade${i === d.index ? ' on' : ''}" data-key="r${i}" style="--i:${i};--sh:#000;--r:${tilt[i % tilt.length]}deg"${act('roomPick', i, 'roomOver')}>${esc(r.label)}${r.small ? `<small>${esc(r.small)}</small>` : ''}</div>`).join('');
  const bust = d.bust
    ? `<div class="bust ph-qz-bust ph-pl-bust" aria-hidden="true"><div class="ph-qz-sh">${tall(d.bust, 560, 720)}</div><div>${tall(d.bust, 560, 720)}</div></div>`
    : `<div class="bust ph-pl-bust">${hero(ph.hero, 8, 'sh', 'position:absolute;left:18px;top:16px')}${hero(ph.hero, 8, 'ol', 'position:relative')}</div>`;
  const people = d.preview.people.length
    ? `<div class="pl-tr ph-pl-tr">${d.preview.people.slice(0, 5).map((p) => `<div class="${p.on ? 'on' : ''}">${p.art ? rxPic(p.art, 64) : '<i class="ph-pl-q">?</i>'}<b style="font-size:${fit(p.name, 74, 19, 11)}px">${esc(p.name)}</b><span>${esc(p.small)}</span></div>`).join('')}</div>`
    : '';
  return page('place', (d.backdrop ? `<div class="art" style="background-image:url(${rxUrl(d.backdrop)})"></div>` : '<div class="bgk"></div>') + '<div class="dim" style="background:rgba(8,6,10,.72)"></div><div class="strip r" aria-hidden="true"></div><div class="strip" aria-hidden="true"></div>'
    + bust + phHead(d.name, [d.town, d.district].filter(Boolean).join(' · '))
    + `<div class="pl-rooms ph-pl-rooms${tight}">${rooms}</div>`
    + (d.say ? `<div class="pn pl-say tilt ph-pl-say" style="--r:-1.5deg"><span class="lab">${esc(d.who)}</span><p class="txt">${esc(d.say)}</p></div>` : '')
    + `<div class="pn pl-prev ph-pl-prev" data-key="v${d.index}"><span class="lab">${esc(d.preview.label)}</span>${people}<p class="txt">${esc(d.preview.text)}</p></div>`
    + keys(['▲▼', 'Room'], ['Z', 'Enter', 'roomPick', d.index], ['X', d.back, 'roomBack']));
}

export interface PocketModel {
  /** "Pocket Town" and the lit hamlet's line. */
  town: string;
  hamlets: readonly { name: string; count: number }[];
  hamlet: number;
  places: readonly { name: string; text: string; tag: string; off: boolean }[];
  place: number;
  today: string;
  /** The way back to Hub Town has its own key when the town can be left from here. */
  hub: boolean;
}

export const POCKET_COLS = 4;
export const POCKET_ROWS = 3;

export function phPocket(_ph: PhantomVersion, d: PocketModel): string {
  const size = POCKET_COLS * POCKET_ROWS, n = d.places.length;
  // More than a page of places: the grid shows the page the cursor is on.
  const from = Math.floor(Math.max(0, Math.min(n - 1, d.place)) / size) * size;
  const rail = d.hamlets.map((h, i) => `<div class="pn${i === d.hamlet ? ' lt on' : ''}" data-key="h${i}" style="--i:${i}"${act('pocketHamlet', i)}><b style="font-size:${fit(h.name, 196, 22, 14)}px">${esc(h.name)}</b><span>${h.count} ${h.count === 1 ? 'place' : 'places'}</span></div>`).join('');
  const grid = d.places.slice(from, from + size).map((p, q) => {
    const i = from + q;
    return `<div class="pkt pn${i === d.place ? ' lt on' : ''}${p.off ? ' off' : ''}" data-key="b${d.hamlet}-${i}" style="--i:${q}"${act('pocketPlace', i, 'pocketOver')}><i aria-hidden="true">${esc(p.name.trim().charAt(0).toUpperCase())}</i><b style="font-size:${fit(p.name, 190, 24, 14)}px">${esc(p.name)}</b><p class="txt">${esc(clip(p.text, p.tag ? 46 : 68))}</p>${p.tag ? `<em>${esc(p.tag)}</em>` : ''}</div>`;
  }).join('');
  const more = n > size ? `<div class="ph-more2 ph-pk-more">${from > 0 ? '▲ ' : ''}${from + 1}–${Math.min(n, from + size)} of ${n}${from + size < n ? ' ▼' : ''}</div>` : '';
  return page('pocket', '<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 0,24% 0,16% 100%,0 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:8%;--y:70%" aria-hidden="true"></div>'
    + phHead('Town directory', `${d.town} · ${d.hamlets[d.hamlet]?.name ?? ''}`)
    + `<div class="pk-rail ph-pk-rail">${rail}</div><div class="pk-grid ph-pk-grid" data-key="g${d.hamlet}-${from}">${grid}</div>${more}`
    + `<div class="pn ac pk-today ph-pk-today"><span class="lab">Today in ${esc(d.town)}</span><p class="txt">${esc(d.today)}</p></div>`
    + keys(['Q E', 'Hamlet', 'pocketHamlet', (d.hamlet + 1) % Math.max(1, d.hamlets.length)], ['Z', 'Visit', 'pocketPlace', d.place], ['M', 'Walk there', 'pocketWalk'], ...(d.hub ? [['H', 'Hub Town', 'pocketHub'] as const] : []), ['X', 'Back', 'pocketBack']));
}
