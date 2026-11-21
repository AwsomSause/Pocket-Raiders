// The Pocket look's shared pages: the game's menu, option rows, number tiles, picture wall, board, save slots and
// confirm box, drawn from the mock-ups' own parts (plans/ui-redesign: Settings, Bag, Pokédex, Achievement Hall,
// Save Slots, Confirm). Each takes the same model as its New UI twin in ../redux/templates.ts, so a scene needs no
// change: the New view hands over when the Pocket style is on. The Pocket style always uses layout A's cursor
// geometry (stage.ts fixes `v` to 0): one column of rows, a wall six cells wide, a board one row wide.
// Presentation only.

import type { Area } from '../redux/kit';
import type { ConfirmModel, SavesModel } from '../redux/screens/saves';
import { type Art, type BoardModel, type GridModel, type MenuModel, type SettingsModel, type StatsModel, gridStart, scrollStart } from '../redux/templates';
import { backArt, frontArt, monArt, pkPic, type PkArt } from './art';
import { act, back, box, esc, frontRotom, gameKeys, hdr, page, type PkArea, type PkHeader, seg, spr, sprH, tog } from './kit';

/** The header band and icon for each part of the game. */
export const PK_AREA: Record<Area, PkArea> = { sys: 'set', hub: 'town', run: 'card', map: 'map', story: 'guide', shop: 'bag', reward: 'bag', battle: 'party', party: 'party', end: 'card' };

/** A game picture (the New UI's `Art`) as a Pocket one. */
export const pkArtOf = (a: Art | null | undefined): PkArt | null => (a ? { file: a.file, atlas: a.atlas, ...(a.atlas ? {} : a.crop ? { crop: a.crop } : { whole: true }) } : null);
/** A picture inside a `w` x `h` window, as large as whole steps of its own pixels allow (never above `max` times). */
export function fitPic(a: PkArt | null | undefined, w: number, h: number, cls = '', max = 3): string {
  if (!a) return '';
  const c = pkPic(a), k = c ? Math.min(max, w / c.w, h / c.h) : 1;
  return `<span class="gx-fit" style="width:${w}px;height:${h}px">${spr(a, k >= 1 ? Math.floor(k) : k, cls)}</span>`;
}
/** A font size for a line of `t` in `room` pixels: long names step down rather than being cut. */
export const fit = (t: string, room: number, big: number, small: number, k = 0.56): number => Math.max(small, Math.min(big, Math.floor(room / Math.max(1, t.length * k))));
/** Where a long list stands ("8–14 of 30"), for a header pill. Nothing when the whole list shows. */
const span = (n: number, start: number, size: number): string[] => (n > size ? [`${start + 1}–${Math.min(n, start + size)} of ${n}`] : []);
/** The first thought of a description: its first sentence, or that sentence's first clause when it runs long (the lit row shows all of it). */
export function firstThought(t: string, max: number): string {
  const s = t.split(/(?<=[.!?])\s+/)[0] ?? t;
  if (s.length <= max) return s;
  const cut = Math.max(s.lastIndexOf(': ', max), s.lastIndexOf('; ', max), s.lastIndexOf(', ', max), s.lastIndexOf(' (', max));
  return `${s.slice(0, cut > 16 ? cut : s.lastIndexOf(' ', max))}…`;
}
const facts = (f: readonly (readonly [string, string])[] | undefined): string => (f ?? []).map(([a, b]) => `<div class="gx-fact"><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('');
const tabRow = (labels: readonly string[], index: number): string =>
  `<div class="gx-tabs">${labels.map((t, k) => `<div class="btn sm${k === index ? ' on' : ''}"${act('tab', k)}><b>${esc(t)}</b></div>`).join('')}</div>`;
/**
 * A font size for body text so all of it shows: the largest of `sizes` at which `text` (line breaks kept) fits a
 * window `w` wide and `h` high. The smallest size is used when none fits.
 */
export function fitBody(text: string, w: number, h: number, sizes: readonly number[] = [14.5, 13, 12, 11, 10], lead = 1.38): number {
  for (const size of sizes) {
    const perLine = Math.max(8, Math.floor(w / (size * 0.53)));
    const lines = text.split('\n').reduce((n, l) => n + Math.max(1, Math.ceil(l.length / perLine)), 0);
    if (lines * size * lead <= h) return size;
  }
  return sizes[sizes.length - 1]!;
}

/** The shared menu: a list of buttons at the left, the lit row's card at the right, the game's line along the bottom. */
export function pkMenu(d: MenuModel, id = 'list', head: PkHeader = {}): string {
  const it = d.items, n = it.length, cur = it[d.index], det = d.detail;
  const title = det?.title ?? cur?.label ?? '', body = det?.body ?? cur?.note ?? '';
  // The card already says what the text box would: the box is left out then.
  const text = d.text && d.text !== body ? d.text : '';
  const size = (d.tabs ? 6 : 7) - (text.length > 200 ? 1 : 0), s = scrollStart(n, d.index, size);
  const rows = it.slice(s, s + size).map((x, q) => {
    const k = s + q, note = x.note && x.note.length <= 18 ? x.note : '';
    return `<div class="btn${k === d.index ? ' on' : ''}${x.disabled ? ' off' : ''}" data-key="r${k}"${act('pick', k, 'over')}><b style="font-size:${fit(x.label, note ? 280 - note.length * 7 : 290, 16, 11)}px">${esc(x.label)}</b>${note ? `<span>${esc(note)}</span>` : ''}</div>`;
  }).join('');
  // The card stands between the header and the text box (or the key row): its text steps down until all of it shows.
  const room = (text ? 340 : 416) - (d.tabs ? 42 : 0) - 28 - 36 - (det?.facts ?? []).length * 25;
  const card = `<div class="gx-det pn${text ? '' : ' tall'}" data-key="d${d.index}">${det?.sprite ? `<i class="gx-det-pic">${fitPic(monArt(det.sprite), 96, 96)}</i>` : ''}<b style="font-size:${fit(title, 470, 28, 17, 0.5)}px">${esc(title)}</b><p style="font-size:${fitBody(body, det?.sprite ? 360 : 470, room)}px">${esc(body)}</p>${facts(det?.facts)}</div>`;
  return page(id, 26, `<div class="scr gx-menu${d.tabs ? ' tabs' : ''}">${hdr(d.title, { area: PK_AREA[d.area ?? 'sys'], pills: span(n, s, size), ...head })}${d.tabs ? tabRow(d.tabs.labels, d.tabs.index) : ''}<div class="gx-list">${rows}</div>${card}${text ? box(text) : ''}${gameKeys(d.hints)}</div>`);
}

/** What a settings row adds for the Pocket page: its small print and every value it can take (in pressing order). */
export interface PkRowMore { about?: string; opts?: readonly string[] }
export interface PkOptionsMore {
  /** Per row, by index. */
  rows?: readonly (PkRowMore | undefined)[];
  /** The preview window at the right (the Display page): the row list is narrow then. */
  preview?: boolean;
  crumb?: readonly string[];
  /** The line under the rows (a notice, or the game's own line where rows carry no small print). */
  note?: string;
  /** The mock-up page this is (`set-audio`...); 'opts' when left out. */
  id?: string;
}

/** A row's control: a switch for On / Off, a bar for a percentage, the choices side by side when they are few, else the value between arrows. */
function control(value: string, opts: readonly string[] | undefined, room: number): string {
  const v = value.split('  · ')[0]!.trim();
  if (!v) return '<span class="btn sm"><b>Choose</b></span>';
  if (v === 'On' || v === 'Off') return tog(v === 'On');
  const m = /^(\d+)%$/.exec(v);
  if (m) return `<span class="sld"><i style="width:${Math.min(100, Number(m[1]))}%"></i><u style="left:${Math.min(100, Number(m[1]))}%"></u><b>${esc(v)}</b></span>`;
  if (opts && opts.length >= 2 && opts.length <= 4 && opts.includes(v) && opts.join('').length <= 18) return seg(opts, opts.indexOf(v));
  return `<span class="seg gx-cyc"><i>◀</i><i class="on" style="font-size:${fit(v, room, 13, 10, 0.6)}px">${esc(v)}</i><i>▶</i></span>`;
}

/** The shared option rows (Settings pages, Run choices, Modifiers): categories down the left, the rows in a panel. */
export function pkOptions(d: SettingsModel, x: PkOptionsMore = {}): string {
  const n = d.rows.length, wide = !x.preview, note = x.note ?? (x.rows ? '' : d.text);
  const size = (wide ? 6 : 5) - (wide && note ? 1 : 0), s = scrollStart(n, d.index, size), cur = d.rows[d.index];
  const rows = d.rows.slice(s, s + size).map((r, q) => {
    const k = s + q, on = k === d.index, mo = x.rows?.[k], tag = r.value.split('  · ')[1];
    // The lit row of a wide list says everything; the others (and a narrow list, whose lit row is spelled out beside it) their first thought.
    const about = [mo?.about ? (on && wide ? mo.about : firstThought(mo.about, wide ? 76 : 60)) : '', tag ? `Applies ${tag}.` : ''].filter(Boolean).join(' ');
    return `<div class="srow${on ? ' on' : ''}${r.disabled ? ' gx-off' : ''}" data-key="r${k}"${act('pick', k, 'over')}><div><b>${esc(r.label)}</b>${about ? `<span>${esc(about)}</span>` : ''}</div>${control(r.value, mo?.opts, wide ? 240 : 150)}</div>`;
  }).join('');
  const cats = d.tabs.length > 1
    ? `<div class="set-cats${d.tabs.length > 9 ? ' gx-tight' : ''}">${d.tabs.map((t, k) => `<div class="btn sm${k === d.tab ? ' on' : ''}"${act('tab', k)}><b style="font-size:${fit(t, 165, 14, 10.5)}px">${esc(t)}</b></div>`).join('')}</div>`
    : d.tabs.length ? `<div class="set-cats"><div class="btn sm on gx-find"><b>${esc(d.tabs[0]!)}</b></div></div>` : '';
  const preview = x.preview && cur
    ? `<div class="preview pn"><small>Preview</small><div class="pv-scr">${back('arenas/grass_bg.png', '')}${spr(frontArt(9), 1, 'pv-f')}${spr(backArt(6), 1.4, 'pv-m')}<i class="pv-p1"></i><i class="pv-p2"></i><i class="pv-b"></i></div><span>${esc(cur.label)}${cur.value ? `: ${esc(cur.value.split('  · ')[0]!)}` : ''}</span></div>${x.rows?.[d.index]?.about ? `<div class="gx-about pn" data-key="a${d.index}"><p style="font-size:${fitBody(x.rows[d.index]!.about!, 220, 170, [13, 12, 11, 10], 1.36)}px">${esc(x.rows[d.index]!.about!)}</p></div>` : ''}`
    : '';
  return page(x.id ?? 'opts', 26, `<div class="scr settings sp5${wide ? ' wide' : ''} gx-opts">${hdr(d.title, { area: PK_AREA[d.area ?? 'sys'], pills: span(n, s, size), ...(x.crumb ? { crumb: x.crumb } : {}) })}${cats}`
    + `<div class="set-rows pn">${rows}</div>${preview}${note ? `<div class="sv-note gx-note"><span>${esc(note)}</span></div>` : ''}${gameKeys(d.hints, [['←→', 'change'], ['↑↓', 'move'], ['Enter', 'choose'], ['Esc', 'back']])}</div>`);
}

/** The shared number tiles (Me, My stats, the timer): Settings-style tiles, four or three across. */
export function pkStats(d: StatsModel): string {
  const three = d.cols === 3;
  const tiles = d.tiles.slice(0, 8).map(([a, b], k) => `<div class="tile${k ? '' : ' on'}"${d.press === k ? act('pick', k) : ''}><span>${esc(a)}</span><b style="font-size:${fit(b, three ? 250 : 180, 30, 14, 0.5)}px">${esc(b)}</b></div>`).join('');
  return page('tiles', 26, `<div class="scr gx-stats">${hdr(d.title, { area: PK_AREA[d.area ?? 'hub'] })}<div class="gx-tiles${three ? ' c3' : ''}">${tiles}</div>${box(d.text)}${gameKeys(d.hints)}</div>`);
}

/** The shared wall of pictures: the Pokédex page's cells at the left, the lit one's card at the right. */
export function pkGrid(d: GridModel): string {
  const n = d.n, size = 18, s = gridStart(n, d.index, size, 6), det = d.detail;
  const cells = Array.from({ length: Math.max(0, Math.min(size, n - s)) }, (_, q) => {
    const i = s + q, r = d.cell(i), a = pkArtOf(r.art);
    return `<div class="dx${r.off ? ' unk' : ' got'}${i === d.index ? ' on' : ''}${r.sil ? ' sil' : ''}" data-key="c${i}"${act('pick', i, 'over')}>${a ? fitPic(a, 76, 52, '', 2) : r.off ? '<b>?</b>' : ''}<small style="font-size:${fit(r.label, 84, 11, 8)}px">${esc(r.label)}</small></div>`;
  }).join('');
  const body = det.body ?? '';
  const card = `<div class="gx-card pn" data-key="d${d.index}">${det.art ? `<i class="gx-card-pic">${fitPic(pkArtOf(det.art), 120, 96)}</i>` : ''}<b style="font-size:${fit(det.title, 250, 28, 16, 0.5)}px">${esc(det.title)}</b>${det.sub ? `<em>${esc(det.sub)}</em>` : ''}<p style="font-size:${fitBody(body, 260, 338 - 24 - (det.art ? 101 : 0) - 34 - (det.sub ? 22 : 0) - (det.facts ?? []).length * 25, [13.5, 12.5, 11.5, 10.5, 10], 1.35)}px">${esc(body)}</p>${facts(det.facts)}</div>`;
  return page('wall', 26, `<div class="scr dex gx-wall">${hdr(d.title, { area: PK_AREA[d.area ?? 'hub'], pills: [...span(n, s, size), `${d.foundLabel ?? 'Found'} ${d.found} of ${d.total}`] })}<div class="dx-grid">${cells}</div>${card}${box(d.text)}${gameKeys(d.hints)}</div>`);
}

/** The shared board (quests, chains, tasks): the Achievement Hall's cards, one to a row, each with its bar and its state. */
export function pkBoard(d: BoardModel): string {
  const n = d.rows.length, index = Math.max(0, Math.min(n - 1, d.index)), size = d.text.length > 200 ? 4 : 5, s = scrollStart(n, index, size);
  const rows = d.rows.slice(s, s + size).map((r, q) => {
    const k = s + q, a = pkArtOf(r.art);
    const bar = r.pct === null || r.pct === undefined ? '' : `<span class="hp ok gx-bar"><i style="width:${Math.max(0, Math.min(100, r.pct))}%"></i></span>`;
    return `<div class="ac pn${k === index ? ' on' : ''}${r.off ? ' gx-dim' : ' new'}" data-key="r${k}"${act('pick', k, 'over')}>${a ? `<i class="ac-ic">${fitPic(a, 44, 44, '', 2)}</i>` : ''}<div><b style="font-size:${fit(r.title, 520, 18, 12, 0.52)}px">${esc(r.title)}</b><span style="font-size:${fit(r.sub, 560, 12.5, 10, 0.5)}px">${esc(r.sub)}</span></div>${bar}${r.tag ? `<em>${esc(r.tag)}</em>` : ''}</div>`;
  }).join('');
  return page('board', 26, `<div class="scr ach gx-board">${hdr(d.title, { area: PK_AREA[d.area], pills: span(n, s, size) })}<div class="gx-rows">${rows}${n ? '' : '<div class="gx-none">Nothing here yet</div>'}</div>${box(d.text)}${gameKeys(d.hints)}</div>`);
}

/** The Confirm box: Rotom asks, the answers side by side. Clicks call `confirm` with the answer's index. */
export const pkConfirm = (d: ConfirmModel): string =>
  `<div class="gx-shade hit" data-key="shade"></div><div class="cf-box pn gx-ask" data-key="ask">${spr(frontRotom, 2, 'rot')}<b style="font-size:${fit(d.title, 440, 32, 18, 0.48)}px">${esc(d.title)}</b>${d.body ? `<p>${esc(d.body)}</p>` : ''}<div class="row">${d.options.map((o, k) => `<div class="btn${k === d.index ? ' on' : ''}"${act('confirm', k, 'confirmOver')}><b style="font-size:${fit(o, 150, 16, 11)}px">${esc(o)}</b></div>`).join('')}</div></div>`;

/** Save files: the mock-ups' Save Slots page. The lit slot offers to erase it. */
export function pkSaves(d: SavesModel): string {
  const slots = d.slots.map((s, k) => {
    const on = k === d.focus, tr = pkArtOf(s.art);
    if (s.empty) return `<div class="slot pn empty${on ? ' on' : ''}" data-key="s${k}"${act('open', k, 'over')}><em>${esc(s.tag)}</em><div class="sl-b"><b>Empty</b><span>${esc(s.where || 'Start a new journey here.')}</span></div></div>`;
    return `<div class="slot pn${on ? ' on' : ''}" data-key="s${k}"${act('open', k, 'over')}><em>${esc(s.tag)}</em>${tr ? sprH(tr, 138, 'sl-t') : ''}<div class="sl-b"><b style="font-size:${fit(s.name, 300, 30, 16, 0.5)}px">${esc(s.name)}</b><span>${esc(s.where)}</span>${s.time ? `<span>Saved ${esc(s.time)}</span>` : ''}</div>`
      + `<div class="sl-team">${s.party.slice(0, 6).map((p) => spr(monArt(p), 1, 'pc-s')).join('')}</div>${on ? `<div class="btn sm gx-del${d.onDelete ? ' on' : ''}"${act('del', k)}><b>Erase</b></div>` : ''}</div>`;
  }).join('');
  const cur = d.slots[d.focus];
  return page('saves', 26, `<div class="scr saves gx-saves">${hdr('Save Slots', { area: 'card', crumb: ['Title', 'Save'] })}<div class="sl-list">${slots}</div>${box(d.note)}`
    + gameKeys([['↑↓', 'slot'], ['Enter', cur?.empty ? 'start here' : 'load'], ...(cur && !cur.empty ? [['→', 'erase'] as const] : []), ['Esc', 'back']])
    + (d.confirm ? pkConfirm(d.confirm) : '') + '</div>');
}
