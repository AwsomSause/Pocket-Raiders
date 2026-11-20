// The Pocket look's stage map (mock-up page `map`, Final Cut): eight stops at a time on the region's Town Map, the
// road drawn thick where it was walked, the trainer standing on the current stop, the next stops ringed. Under the
// board: the next stop and the Gym, the menu row and the keys. It draws the New UI map's model
// (ui/redux/screens/map.ts); MapScene keeps the state, the cursor and the input. Presentation only.
// For the animations thread's playback the small map has a root (`data-key="map"`) with a state class (`is-in`,
// `is-hold`, `is-out`), its times as `--pk-in` / `--pk-out`, and a `data-key` on every stop, road and the trainer.

import type { MapModel, MapNodeView } from '../../redux/screens/map';
import type { NodeMenuModel } from '../../redux/screens/popups';
import { badgeArt, ballArt, itemArt, type PkArt } from '../art';
import { act, esc, hdr, keys, page, spr, sprH } from '../kit';
import { fit, firstThought } from '../templates';
import type { PkCue } from './cards';

/** How long the small map's entrance and exit take, in seconds. */
export const PK_MAP_TIMES = { in: 0.6, out: 0.3 } as const;
/** Stops shown at a time, and where the board puts them (the Final Cut's smaller map: 80 px apart, rows 74 px apart). */
export const PK_MAP_COLS = 8;
const X = (k: number): number => 70 + k * 80;
const MID = 138;

/** Each kind of stop: its name, its colour and its picture (the mock-ups' NODE and NICON tables, and the game's other stops). */
const KIND: Record<string, readonly [string, string, PkArt, number]> = {
  wild: ['Wild Pokémon', '#3fa129', badgeArt('grass'), 1.5], trainer: ['Trainer', '#e8452b', ballArt('pb'), 3], event: ['Event', '#9141cb', itemArt('map'), 1.5],
  shop: ['Poké Mart', '#2980ef', itemArt('coin_case'), 1.5], rest: ['Pokémon Center', '#ef4179', ballArt('heal'), 3], heal: ['Pokémon Center', '#ef4179', ballArt('heal'), 3],
  gym: ['Gym Leader', '#f5b800', badgeArt('rock'), 1.5], rival: ['Rival', '#ff8000', itemArt('master_ribbon'), 1.5], mystery: ['Mystery', '#624d4e', itemArt('mystery_egg'), 1.5],
  elite: ['Elite Four', '#5060e1', itemArt('kings_rock'), 1.5], champion: ['Champion', '#f5b800', itemArt('shiny_charm'), 1.5],
  raid: ['Max Raid', '#c1121f', itemArt('dynamax_band'), 1.5], totem: ['Totem', '#c1121f', itemArt('z_ring'), 1.5], fish: ['Fishing', '#38b0c8', itemArt('tera_orb'), 1.5],
  expedition: ['Expedition', '#38b0c8', itemArt('map'), 1.5], minigame: ['Minigame', '#9141cb', itemArt('soothe_bell'), 1.5], service: ['Service', '#2980ef', itemArt('coin_case'), 1.5],
  plaza: ['Plaza', '#2980ef', ballArt('friend'), 3], cache: ['Cache', '#e8a100', itemArt('nugget'), 1.5], research: ['Research', '#2980ef', itemArt('scanner'), 1.5],
  recruit: ['Recruit', '#2aa6a0', ballArt('friend'), 3], megaEnergy: ['Mega Energy', '#f5b800', itemArt('mega_bracelet'), 1.5], finale: ['Finale', '#e8452b', itemArt('master_ribbon'), 1.5],
  blocked: ['Blocked', '#5a4a4a', itemArt('metal_coat'), 1.5],
};
export const kindOf = (kind: string): readonly [string, string, PkArt, number] => KIND[kind] ?? [kind.charAt(0).toUpperCase() + kind.slice(1), '#9fa19f', itemArt('mystery_egg'), 1.5];

/** The first stop column on show: the current stop sits fourth from the left, as on the mock-up. */
export function mapWindow(columns: number, column: number): number {
  return Math.max(1, Math.min(Math.max(1, columns - PK_MAP_COLS + 1), column - 3));
}

/** A stop's state on the board: walked (`done`), passed by (`skip`), where the trainer stands (`here`), a stop to go to (`next`). */
export function nodeState(n: MapNodeView, column: number): string {
  return n.cur ? 'here' : n.visited ? 'done' : n.go || n.opt >= 0 ? 'next' : n.col <= column ? 'skip' : '';
}

/** What the Pocket map shows besides the model: the stages of the region (for "Stage 3 of 8"). */
function head(d: MapModel): { title: string; pills: string[]; tags: string[]; gym: string; gymWho: string } {
  const st = d.chips.map((c) => /^Stage (\d+) \/ (\d+)$/.exec(c)).find(Boolean);
  const title = st && !/ of \d+$/.test(d.title) ? `${d.title} of ${st[2]}` : d.title;
  const gymChip = d.chips.find((c) => /^(Gym in|Elite Four|Clear the rooms)/.test(c)) ?? '';
  const pills = d.chips.filter((c) => /^(Day|₽)|Badges|cap/i.test(c)).slice(0, 4);
  const tags = [...d.chips.filter((c) => c !== gymChip && !pills.includes(c) && !/^Stage \d+ \/|^Battle \d+ \/|^Inside Stage/.test(c)), ...d.eggs.map((e) => `Egg ${e}`)];
  // The first status line reads "Theme (Types) · Gym Leader Name · modifier": the Gym card says who and what type.
  const parts = (d.lines[0] ?? '').split(' · ');
  const who = (parts[1] ?? '').replace(/^Gym Leader /, ''), types = d.types.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(' / ');
  return { title, pills, tags, gym: gymChip, gymWho: [who, types ? `${types} type` : ''].filter(Boolean).join(' · ') };
}

/** One stop: its ring in its kind's colour, its picture, and its name when it is a stop to go to (or lit). */
function stop(n: MapNodeView, x: number, y: number, column: number, lit: boolean): string {
  const [name, colour, art, sc] = n.fog ? ['???', '#56627f', itemArt('mystery_egg'), 1.5] as const : kindOf(n.kind);
  const state = nodeState(n, column), show = state === 'next' || lit || n.kind === 'gym' || n.kind === 'champion';
  const sides = n.sides.slice(0, 4).map((s, k) => { const [sn, sc2] = s.color ? [s.kind, s.color] : kindOf(s.kind); return `<i class="gx-side${s.used ? ' used' : ''}" style="--c:${sc2};left:${28 + k * 10}px;z-index:${4 - k}" title="${esc(sn)}"></i>`; }).join('');
  return `<div class="node ${state}${lit ? ' gx-lit' : ''}${n.fog ? ' gx-fog' : ''}${n.harder && !n.fog ? ' gx-hard' : ''}" data-key="map-n-${esc(n.id)}" style="left:${x}px;top:${y}px;--c:${colour}"${n.opt >= 0 ? `${act('pick', n.opt, 'over')}` : ''}>${n.fog ? '<b>?</b>' : spr(art, sc)}${show ? `<span class="keep">${esc(n.fog ? name : n.title || name)}</span>` : ''}${sides}</div>`;
}

/** The small map: eight stops of the stage on the Town Map. Usable alone (the animations thread's cutout). */
export function pkMiniMap(d: MapModel, cue: PkCue = 'in'): string {
  const c0 = mapWindow(d.columns, d.column), on = (n: MapNodeView): boolean => n.col >= c0 && n.col < c0 + PK_MAP_COLS;
  const rows = Math.max(1, ...d.nodes.filter(on).map((n) => n.rows)), dy = rows > 1 ? Math.min(74, 180 / (rows - 1)) : 0;
  const x = (n: MapNodeView): number => X(n.col - c0), y = (n: MapNodeView): number => Math.round(MID + (n.row - (n.rows - 1) / 2) * dy);
  const by = new Map(d.nodes.map((n) => [n.id, n]));
  // Roads: drawn twice (a dark edge, then the light top); a road that leaves the window runs off the board.
  const roads = d.edges.map((e) => { const a = by.get(e.a), b = by.get(e.b); return a && b && (on(a) || on(b)) ? { e, a, b } : null; }).filter((r): r is NonNullable<typeof r> => r !== null);
  const line = (k: number): string => roads.map(({ e, a, b }) => `<line x1="${x(a)}" y1="${y(a)}" x2="${x(b)}" y2="${y(b)}" class="${k ? 'top' : 'edge'}${e.walked ? ' walked' : e.open ? ' gx-open' : ''}"${k ? ` data-key="map-r-${esc(e.a)}-${esc(e.b)}"` : ''}/>`).join('');
  const ticks = Array.from({ length: PK_MAP_COLS }, (_, k) => c0 + k).filter((c) => c <= d.columns).map((c, k) => `<span class="map-tick${c === d.column ? ' on' : ''}" style="left:${X(k)}px">${c}</span>`).join('');
  const lit = d.nodes.find((n) => n.opt >= 0 && n.opt === d.index) ?? null;
  const stops = d.nodes.filter(on).map((n) => stop(n, x(n), y(n), d.column, n === lit)).join('');
  // The trainer stands on the current stop, or walks to the stop being travelled to.
  const cur = d.nodes.find((n) => n.cur) ?? null, to = d.going ? by.get(d.going) ?? null : null, at = to && on(to) ? to : cur && on(cur) ? cur : null;
  const walk = to && cur && at === to && on(cur) ? `;--fx:${x(cur) - x(to)}px;--fy:${y(cur) - y(to)}px` : '';
  const me = at && d.trainer ? `<div class="map-you${walk ? ' gx-walk' : ''}${y(at) < 100 ? ' gx-beside' : ''}" data-key="map-you" style="left:${x(at)}px;top:${y(at)}px${walk}">${sprH({ file: d.trainer, atlas: true }, 104)}</div>` : '';
  return `<div class="map-board pn gx-cue is-${cue}" data-key="map" style="--pk-in:${PK_MAP_TIMES.in}s;--pk-out:${PK_MAP_TIMES.out}s"><svg viewBox="0 0 700 264" class="map-svg">${line(0)}${line(1)}</svg>${ticks}${stops}${me}</div>`;
}

/** The legend (L) with the stage's notes: what each mark means, and every status line the stage has. */
function legend(d: MapModel): string {
  if (!d.legend) return '';
  const notes = d.lines.slice(1);
  const rows = d.legend.map((r) => `<div class="gx-lg-row"><i style="--c:${r.color}">${esc(r.glyph)}</i><span>${esc(r.text)}</span></div>`).join('');
  const keyRow = `<div class="gx-lg-keys">${d.keys.map(([k, t]) => `<span${act('key', k)}><kbd>${esc(k)}</kbd>${esc(t)}</span>`).join('')}<span${act('legend')}><kbd>L</kbd>close</span></div>`;
  return `<div class="gx-shade"${act('legend')}></div><div class="pn gx-legend" data-key="map-legend"><div class="gx-lg-top"><b class="gx-lg-t">Legend</b>${keyRow}</div><div class="gx-lg-grid${d.legend.length > 27 ? ' huge' : d.legend.length > 12 ? ' wide' : ''}">${rows}</div>${notes.length ? `<b class="gx-lg-t">This stage</b><div class="gx-lg-notes">${notes.map((t) => `<p>${esc(t)}</p>`).join('')}</div>` : ''}</div>`;
}

/** The node's menu (a stop with more than one thing at it): its parts as cards over the dimmed map. */
export function pkNodeMenu(m: NodeMenuModel): string {
  const n = Math.max(1, m.cards.length), w = Math.min(220, Math.floor((904 - 16 * (n - 1)) / n));
  const cards = m.cards.map((r, k) => `<div class="chc safe${k === m.index ? ' on' : ''}${r.off ? ' gx-off' : ''}" data-key="map-menu-${k}" style="--tc:${r.color};width:${w}px;height:236px"${act('menu', k, 'menuOver')}><span class="ch-top"><em style="background:${r.color}">${esc(r.kind)}</em>${r.status ? `<em class="gx-st${r.must && !r.off ? ' must' : ''}">${esc(r.status)}</em>` : ''}</span><b style="font-size:${fit(r.name, (w - 32) * 2, 26, 15, 0.5)}px">${esc(r.name)}</b><p class="gx-nm-t">${esc(r.text)}</p></div>`).join('');
  return `<div class="gx-shade" data-key="map-menu-dim"${act('menu', -1)}></div><div class="gx-nmenu" data-key="map-menu">${m.header ? `<b class="gx-nm-h">${esc(m.header)}</b>` : ''}<div class="gx-nm-row">${cards}</div></div>`;
}

/** The stage map page. `menu`: the node's menu over it, if open. */
export function pkMap(d: MapModel, menu: NodeMenuModel | null = null, cue: PkCue = 'in'): string {
  const h = head(d);
  const lit = d.nodes.find((n) => n.opt >= 0 && n.opt === d.index) ?? null, btn = lit ? null : d.buttons.find((b) => b.opt === d.index) ?? null;
  const nextName = lit ? (lit.fog ? 'Fog' : lit.title || kindOf(lit.kind)[0]) : btn ? btn.label : 'Next stop';
  const info = firstThought(d.info.replace(/\s+/g, ' ').trim(), 96);
  const a = `<div class="mi-a" data-key="map-next"><b style="font-size:${fit(nextName, 380, 18, 13, 0.55)}px">${lit ? 'Next stop: ' : ''}${esc(nextName)}</b><span>${esc(info)}</span></div>`;
  const b = h.gym ? `<div class="mi-b" data-key="map-gym"><b>${esc(h.gym)}</b><span>${esc(h.gymWho)}</span></div>` : '';
  const menuRow = `<div class="map-menu" style="grid-template-columns:repeat(${Math.max(1, d.buttons.length)},1fr)">${d.buttons.map((x) => `<div class="btn sm${x.opt === d.index ? ' on' : ''}${x.hot ? ' gx-hot' : ''}"${act('pick', x.opt, 'over')}><b style="font-size:${fit(x.label, 96, 15, 11)}px">${esc(x.label)}</b></div>`).join('')}</div>`;
  const tags = h.tags.length ? `<div class="gx-map-tags" data-key="map-tags">${h.tags.map((t) => `<i>${esc(t)}</i>`).join('')}</div>` : '';
  const notice = d.notice ? `<div class="gx-map-say" data-key="map-say"><p style="font-size:${fit(d.notice, 1500, 14, 11, 0.5)}px">${esc(d.notice)}</p></div>` : '';
  const notes = d.lines.length > 1 ? `<div class="gx-map-notes" ${act('legend')}><b>${d.lines.length - 1}</b><span>stage ${d.lines.length > 2 ? 'notes' : 'note'}</span><kbd>L</kbd></div>` : '';
  const banner = d.banner ? `<div class="gx-shade"></div><div class="gx-map-banner" data-key="map-banner"><small>${esc(d.banner.top)}</small><b style="font-size:${fit(d.banner.title, 820, 64, 30, 0.5)}px">${esc(d.banner.title)}</b><span>${esc(d.banner.sub)}</span>${d.banner.plan.length ? `<p>Built from your last stage: ${d.banner.plan.map(esc).join(' · ')}</p>` : ''}</div>` : '';
  const ks = keys([['←→↑↓', 'pick a stop'], ['Enter', 'go', 'go'], ['L', 'legend and keys', 'legend'], ['Esc', 'pause']]);
  return page('map', 26, `<div class="scr m26 m10 map m2">${hdr(h.title, { area: 'map', pills: h.pills, size: fit(h.title, 900 - 70 - h.pills.reduce((n, t) => n + t.length * 8 + 44, 0), 36, 18, 0.6) })}${pkMiniMap(d, cue)}${tags}${notes}${notice}<div class="map-info">${a}${b}</div>${menuRow}${ks}${legend(d)}${banner}${menu ? pkNodeMenu(menu) : ''}</div>`);
}

