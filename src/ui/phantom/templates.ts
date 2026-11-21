// Phantom UI: the game's shared screen templates (menu, grid, board, number tiles, option rows, save slots, confirm)
// drawn from the mock-ups' own parts (plans/ui-redesign-persona: the Bag list, the Pokédex wall, the Run record tiles,
// the Save page). Each takes the same model as its New UI twin in ../redux/templates.ts, so a scene needs no change:
// the New view hands over when the Phantom style is on. The Phantom style always uses layout A's cursor geometry
// (stage.ts fixes `v` to 0): one column of rows, a wall six cells wide, a board one row wide. Presentation only.

import type { PhantomVersion } from '../../core/presentation/phantom';
import { type Area, esc } from '../redux/kit';
import type { ConfirmModel, SavesModel } from '../redux/screens/saves';
import { type Art, type BoardModel, type GridModel, type MenuModel, type SettingsModel, type StatsModel, gridStart, pic as rxPic, scrollStart } from '../redux/templates';
import { act, keys, mon, page } from './kit';

/** The small line over a page title, by the part of the game the page belongs to. */
export const AREA_WORD: Record<Area, string> = { sys: 'System', hub: 'Pocket Town', run: 'New run', map: 'On the road', story: 'Story', shop: 'Shop', reward: 'Reward', battle: 'Battle', party: 'Party', end: 'Results' };
type Hints = readonly (readonly [string, string])[] | undefined;

/** The slanted page title. A long title is set smaller so it stays on the page. */
export function phHead(title: string, small: string, cls = ''): string {
  const n = title.length, size = n > 30 ? 30 : n > 22 ? 38 : n > 15 ? 48 : 62;
  return `<div class="hd ${cls}"${size < 62 ? ` style="font-size:${size}px"` : ''}><small>${esc(small)}</small>${esc(title)}</div>`;
}
const KEY_FACE: Record<string, string> = { '←→': '◀▶', '↔': '◀▶', '←/→': '◀▶', '↑↓': '▲▼', '↑/↓': '▲▼', '→': '▶', '←': '◀' };
/** The game's key hints (key, what it does) as the Phantom key row. The first hint clicks `ok`, an Esc hint clicks `back`. */
export function phKeys(hints: Hints, fallback: readonly (readonly [string, string])[] = [['Enter', 'choose'], ['Esc', 'back']]): string {
  return keys(...(hints ?? fallback).map(([k, t]) => [KEY_FACE[k] ?? k, t.charAt(0).toUpperCase() + t.slice(1), k === 'Esc' ? 'back' : undefined] as const));
}
/** The page backdrop: black with one slanted colour field and a burst behind the detail. */
export const backK = (cp = 'polygon(48% 0,100% 0,100% 100%,56% 100%)', x = 85, y = 40): string =>
  `<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:${cp};inset:0" aria-hidden="true"></div><div class="burst" style="--x:${x}%;--y:${y}%" aria-hidden="true"></div>`;
/** The line the game's text box holds, as a tilted note along the bottom. */
export const say = (t: string | undefined, cls = ''): string => (t ? `<div class="pn ph-say ${cls}"><p class="txt">${esc(t)}</p></div>` : '');
export const more = (n: number, start: number, size: number, st: string): string => (n > size ? `<div class="ph-more2" style="${st}">${start > 0 ? '▲ ' : ''}${start + 1}–${Math.min(n, start + size)} of ${n}${start + size < n ? ' ▼' : ''}</div>` : '');
export const factRows = (f: readonly (readonly [string, string])[] | undefined): string => (f ?? []).map(([a, b]) => `<div class="dm-fr"><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('');
/** A row label's font size: long names step down rather than being cut. */
export const fit = (t: string, room: number, big: number, small: number): number => Math.max(small, Math.min(big, Math.floor(room / Math.max(1, t.length * 0.56))));
const pageTabs = (tabs: { labels: readonly string[]; index: number } | undefined): string =>
  tabs ? `<div class="pockets ph-tabs">${tabs.labels.map((t, k) => `<span class="${k === tabs.index ? 'on' : ''}"${act('tab', k)}>${esc(t)}</span>`).join('')}</div>` : '';
const art = (a: Art | null | undefined, size: number, cls = ''): string => rxPic(a, size, cls);

/** The shared menu: the Bag page's list at the left, the lit row's card at the right, the game's line along the bottom. */
export function phMenu(_ph: PhantomVersion, d: MenuModel, id = 'list'): string {
  const it = d.items, n = it.length, cur = it[d.index], det = d.detail, size = d.text ? 6 : 7, s = scrollStart(n, d.index, size);
  const rows = it.slice(s, s + size).map((x, q) => {
    const k = s + q, note = x.note && x.note.length <= 16 ? x.note : '';
    return `<div class="it ph-it${k === d.index ? ' on' : ''}${x.disabled ? ' off' : ''}" style="--i:${q};font-size:${fit(x.label, note ? 360 - note.length * 9 : 440, 32, 17)}px" data-key="r${k}"${act('pick', k, 'over')}><i class="ph-no">${String(k + 1).padStart(2, '0')}</i><div>${esc(x.label)}</div><span>${esc(note)}</span></div>`;
  }).join('');
  const title = det?.title ?? cur?.label ?? '', body = det?.body ?? cur?.note ?? '';
  const long = body.length + (det?.facts ?? []).length * 40;
  const card = `<div class="ph-det${det?.sprite ? ' pic' : ''}" data-key="d${d.index}">${det?.sprite ? `<div class="big">${mon(det.sprite, 2)}</div>` : ''}<div class="pn lt tilt" style="--r:1.2deg"><span class="lab">${esc(AREA_WORD[d.area ?? 'sys'])}</span><h3 class="tl1" style="font-size:${fit(title, 440, 40, 22)}px">${esc(title)}</h3><p class="txt" style="white-space:pre-line${long > 420 ? ';font-size:15px' : long > 260 ? ';font-size:17px' : ''}">${esc(body)}</p>${factRows(det?.facts)}</div></div>`;
  return page(id, backK() + phHead(d.title, AREA_WORD[d.area ?? 'sys']) + pageTabs(d.tabs) + `<div class="items ph-items">${rows}</div>` + more(n, s, size, `left:74px;top:${144 + size * 68}px`) + card + say(d.text, 'ph-say-m') + phKeys(d.hints));
}

/** The shared option rows (Run choices, Modifiers): tabs along the top, the rows as the Settings pages draw theirs. */
export function phOptions(_ph: PhantomVersion, d: SettingsModel): string {
  const n = d.rows.length, size = 6, s = scrollStart(n, d.index, size);
  const rows = d.rows.slice(s, s + size).map((r, q) => {
    const k = s + q;
    return `<div class="sr ph-sr${k === d.index ? ' on' : ''}${r.disabled ? ' off' : ''}" style="--i:${q}" data-key="r${k}"${act('pick', k, 'over')}><span style="font-size:${fit(r.label, 520, 30, 18)}px">${esc(r.label)}</span>${r.value ? `<span class="v cyc" style="font-size:${fit(r.value, 300, 26, 15)}px">${esc(r.value)}</span>` : ''}</div>`;
  }).join('');
  return page('opts', backK('polygon(0 86%,100% 66%,100% 100%,0 100%)', 82, 30) + phHead(d.title, AREA_WORD[d.area ?? 'sys'])
    + `<div class="pockets ph-tabs">${d.tabs.map((t, k) => `<span class="${k === d.tab ? 'on' : ''}"${act('tab', k)}>${esc(t)}</span>`).join('')}</div>`
    + `<div class="ph-rows">${rows}</div>` + more(n, s, size, 'left:872px;top:166px') + say(d.text, 'ph-say-r') + phKeys(d.hints, [['◀▶', 'change'], ['Enter', 'choose'], ['Esc', 'back']]));
}

/** The shared wall of pictures: the Pokédex page's grid at the left and its card at the right. */
export function phGrid(_ph: PhantomVersion, d: GridModel): string {
  const n = d.n, long = d.text.length > 96, size = long ? 18 : 24, s = gridStart(n, d.index, size, 6), det = d.detail;
  const cells = Array.from({ length: Math.max(0, Math.min(size, n - s)) }, (_, q) => {
    const i = s + q, r = d.cell(i);
    return `<div class="dx ph-dx${i === d.index ? ' on' : ''}${r.off ? ' unk' : ''}" style="--i:${q}" data-key="c${i}"${act('pick', i, 'over')}>${art(r.art, 62, r.sil ? 'sil' : '') || (r.off ? '<em>?</em>' : '')}<small>${esc(r.label)}</small></div>`;
  }).join('');
  const body = det.body ?? '', heavy = body.length + (det.facts ?? []).length * 34;
  const card = `<div class="dexcard ph-card" data-key="d${d.index}"><span class="no">${esc(det.sub ?? AREA_WORD[d.area ?? 'hub'])}</span><h3 style="font-size:${fit(det.title, 380, 60, 24)}px">${esc(det.title)}</h3><div class="pic">${art(det.art, 132)}</div><p${heavy > 330 ? ' style="font-size:15px"' : heavy > 200 ? ' style="font-size:17px"' : ''}>${esc(body)}</p><div class="ph-facts${heavy > 330 ? ' sm' : ''}">${(det.facts ?? []).map(([a, b]) => (a === '+' || a === '−' ? `<div class="dm-fr one"><b>${esc(a)}</b><span>${esc(b)}</span></div>` : `<div class="dm-fr"><span>${esc(a)}</span><b>${esc(b)}</b></div>`)).join('')}</div></div>`;
  return page('wall', backK('polygon(58% 0,100% 0,100% 100%,66% 100%)', 84, 50) + phHead(d.title, AREA_WORD[d.area ?? 'hub'])
    + `<div class="dexcount ph-count2"><span>${esc(d.foundLabel ?? 'Found')} <b>${d.found}</b> / ${d.total}</span></div>`
    + `<div class="dexgrid ph-wall">${cells}</div>` + more(n, s, size, 'left:560px;top:124px;width:164px;text-align:right') + card + say(d.text, 'ph-say-w') + phKeys(d.hints));
}

/** The shared board (quests, chains, tasks): five slanted rows, each with its line, its bar and its state. */
export function phBoard(_ph: PhantomVersion, d: BoardModel): string {
  const n = d.rows.length, index = Math.max(0, Math.min(n - 1, d.index)), size = d.text.length > 150 ? 4 : 5, s = scrollStart(n, index, size);
  const arts = d.rows.some((r) => r.art);
  const rows = d.rows.slice(s, s + size).map((r, q) => {
    const k = s + q, on = k === index, pct = r.pct === null || r.pct === undefined ? '' : `<span class="slash xp ph-bar" style="--w:150px"><i style="width:${Math.max(0, Math.min(100, r.pct))}%"></i></span>`;
    return `<div class="pn ph-row${on ? ' lt on' : ''}${r.off ? ' off' : ''}" style="--i:${q}" data-key="r${k}"${act('pick', k, 'over')}>${arts ? `<span class="ph-av">${art(r.art, 52)}</span>` : ''}<div class="ph-rt"><b style="font-size:${fit(r.title, 620, 30, 18)}px">${esc(r.title)}</b><span>${esc(r.sub)}</span></div>${pct}${r.tag ? `<em>${esc(r.tag)}</em>` : ''}</div>`;
  }).join('');
  return page('board', backK('polygon(0 0,34% 0,16% 100%,0 100%)', 88, 70) + phHead(d.title, AREA_WORD[d.area])
    + `<div class="ph-board${arts ? '' : ' noart'}">${rows}${n ? '' : '<div class="ph-none">Nothing here yet</div>'}</div>` + more(n, s, size, 'left:920px;top:118px;width:160px;text-align:right') + say(d.text, 'ph-say-b') + phKeys(d.hints));
}

/** The shared number tiles (Me, My stats, the timer): the Run record page's tiles. */
export function phStats(_ph: PhantomVersion, d: StatsModel): string {
  const tiles = d.tiles.slice(0, 8).map(([a, b], k) => `<div class="rc-s ph-tile${k ? '' : ' first'}" style="--i:${k}"${d.press === k ? act('pick', k) : ''}><small>${esc(a)}</small><b style="font-size:${fit(b, d.cols === 3 ? 320 : 230, 54, 20)}px">${esc(b)}</b><span></span></div>`).join('');
  return page('tiles', '<div class="bgr"></div><div class="burst" style="--x:82%;--y:30%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div><div class="shard" style="--cp:polygon(0 0,58% 0,44% 100%,0 100%);inset:0" aria-hidden="true"></div>'
    + phHead(d.title, AREA_WORD[d.area ?? 'hub']) + `<div class="rc-g ph-tiles${d.cols === 3 ? ' c3' : ''}">${tiles}</div>` + say(d.text, 'ph-say-t') + phKeys(d.hints));
}

/** The Confirm dialog: a dark sheet, a tilted card and the answers as blades. Clicks call `confirm` with the answer's index. */
export const phConfirm = (d: ConfirmModel): string =>
  `<div class="ph-shade" data-key="confirm"></div><div class="pn lt ph-ask tilt" style="--r:-1.5deg" data-key="ask"><span class="lab">Are you sure?</span><h3 class="tl1">${esc(d.title)}</h3><p class="txt">${esc(d.body)}</p><div class="ph-ans">${d.options.map((o, k) => `<div class="blade${k === d.index ? ' on' : ''}" style="--i:${k};--sh:#000;--r:${-3 + k * 2}deg"${act('confirm', k, 'confirmOver')}>${esc(o)}</div>`).join('')}</div></div>`;

/** Save files: the mock-ups' Save page. Each file is a slanted card; the lit one offers to open or erase it. */
export function phSaves(_ph: PhantomVersion, d: SavesModel): string {
  const slots = d.slots.map((s, k) => {
    const on = k === d.focus;
    return `<div class="slot${on ? ' on' : ''}${s.empty ? ' empty' : ''}" style="--r:${[-2, 1, -1][k % 3]}deg;--i:${k}" data-key="s${k}"${act('open', k, 'over')}><div class="no">${k + 1}</div><div><h4 style="font-size:${s.empty ? 38 : fit(s.name + s.where, 560, 38, 20)}px">${esc(s.empty ? 'Empty' : s.name)}${s.empty || !s.where ? '' : ` · ${esc(s.where)}`}</h4><p>${esc(s.empty ? s.where || 'Start a new run here' : s.time)}</p></div><div class="team">${s.party.slice(0, 6).map((p) => mon(p, 0.55)).join('')}</div></div>`;
  }).join('');
  const cur = d.slots[d.focus];
  const runActs = d.acts && cur ? `<div class="acts ph-acts" data-key="a${d.focus}-${d.actAt ?? 0}">${d.acts.map((a, k) => `<div class="blade${k === (d.actAt ?? 0) ? ' on' : ''}" style="--i:${k};--sh:#000;--r:${-5 + 2 * k}deg"${act('saveAct', k, 'saveOver')}>${esc(a.label)}</div>`).join('')}</div>` : '';
  const acts = cur ? `<div class="acts ph-acts" data-key="a${d.focus}${d.onDelete ? 'd' : ''}"><div class="blade${d.onDelete ? '' : ' on'}" style="--i:0;--sh:#000;--r:-5deg"${act('open', d.focus)}>${cur.empty ? 'Start here' : 'Load'}</div>${cur.empty ? '' : `<div class="blade${d.onDelete ? ' on' : ''}" style="--i:1;--sh:#000;--r:-3deg"${act('del', d.focus)}>Erase</div>`}</div>` : '';
  return page('save', '<div class="bgr"></div><div class="burst" style="--x:90%;--y:90%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div><div class="shard" style="--cp:polygon(0 0,100% 0,100% 100%,84% 100%,74% 0);inset:0;opacity:.25" aria-hidden="true"></div><div class="shard" style="--cp:polygon(0 0,30% 0,8% 100%,0 100%);inset:0" aria-hidden="true"></div>'
    + phHead(d.title ?? 'Save files', 'Auto-save is on · every stage', 'onred') + `<div class="slots">${slots}</div>` + (d.acts ? runActs : acts) + say(d.note, 'ph-say-s')
    + (d.acts
      ? keys(['Z', 'Choose', 'saveAct', d.actAt ?? 0], ...(d.acts.length > 1 ? [['◀▶', 'Action'] as const] : []), ['X', 'Back', 'back'])
      : keys(['Enter', 'Choose', 'open', d.focus], ...(cur && !cur.empty ? [['▶', 'Erase'] as const] : []), ['Esc', 'Back', 'back']))
    + (d.confirm ? phConfirm(d.confirm) : ''));
}
