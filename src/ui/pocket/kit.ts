// Drawing helpers of the Pocket look, kept the same as the mock-up source (plans/ui-redesign/src/kit.js and the
// shared parts of pNN.js) so a page built from them matches its mock-up. Everything returns HTML text for the
// 960 x 540 Pocket stage. Text that comes from the player or from data goes through esc(). Presentation only.

import { esc } from '../redux/kit';
import { rxUrl } from '../redux/assets';
import { type PkArt, ballArt, frontArt, itemArt, pkPic } from './art';

export { esc };

/** The picks a page is drawn at: Title pass 17, Pause pass 24, the main game's Final Cut (26), the new areas' Master Cut (51). */
export type PkTier = 17 | 24 | 26 | 51;
/** Every Pocket view's HTML starts with this mark, its page id and its tier: the stage reads it and draws the view on the Pocket layer. */
export const PK_MARK = '<!--pk:';
/**
 * One Pocket page. `id` is the mock-up page it is built from; `html` is that page's own markup (a `.scr` element).
 * `hud`: the page lies over the game's own picture (a battle HUD, a prompt): no paper behind it, clicks only on its
 * buttons, and it does not take part in page changes.
 */
export const page = (id: string, tier: PkTier, html: string, hud = false): string => `${PK_MARK}${id}:${tier}${hud ? ':hud' : ''}-->${html}`;
export interface PkPage { id: string; tier: PkTier; hud: boolean }
/** The page id, tier and kind inside a view's HTML, or null when the view is not a Pocket one. */
export function pkPageOf(html: string): PkPage | null {
  if (!html.startsWith(PK_MARK)) return null;
  const [id, tier, hud] = html.slice(PK_MARK.length, html.indexOf('-->')).split(':');
  return { id: id!, tier: Number(tier) as PkTier, hud: hud === 'hud' };
}
/** The tier classes a view carries so that page's rules apply (tools/build-pocket-css.mjs). */
export const tierClass = (t: PkTier): string => (t >= 51 ? ' t24 t26 t51' : t >= 26 ? ' t24 t26' : t >= 24 ? ' t24' : '');

/** `data-act` attribute: a click calls the scene's handler `name` with `arg`; `over` also names the hover handler. */
export const act = (name: string, arg: string | number = '', over = ''): string => ` data-act="${name}" data-arg="${esc(arg)}"${over ? ` data-over="${over}"` : ''}`;
/** `data-m`: the part keeps its name through a page change, so it glides to its new place (the mock-ups' morphs). */
export const mm = (key: string): string => `data-m="${key}"`;
export const rep = (n: number, f: (i: number) => string): string => Array.from({ length: n }, (_, i) => f(i)).join('');
export const pct = (a: number, b: number): number => Math.round((100 * a) / Math.max(1, b));
export const hpc = (p: number): string => (p > 50 ? 'ok' : p > 20 ? 'mid' : 'low');
export const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/** A picture `sc` times its size, as the mock-ups draw it: an <img> the page's rules can place. Nothing until it is measured. */
export function spr(a: PkArt | null | undefined, sc = 2, cls = '', style = ''): string {
  const c = pkPic(a);
  if (!c) return `<img class="px ${cls}" alt="" draggable="false" style="width:0;height:0;${style}">`;
  return `<img class="px ${cls}" src="${c.url}" alt="" draggable="false" style="width:${Math.round(c.w * sc)}px;height:${Math.round(c.h * sc)}px;${style}">`;
}
/** A picture scaled to a height in pixels (a trainer standing on a page). */
export function sprH(a: PkArt | null | undefined, h: number, cls = '', style = ''): string {
  const c = pkPic(a);
  return spr(a, c ? h / c.h : 1, cls, style);
}
/** A whole file stretched by the page's rules (backdrops). */
export const back = (file: string, cls: string): string => `<img class="px ${cls}" src="${rxUrl(file)}" alt="">`;
/** Rotom, who speaks on the menus (in the game the helper is always "Rotom"). */
export const frontRotom: PkArt = frontArt(479);
/** The Hub Town street the menus stand in front of. */
export const STREET = 'ui/pocket/town-street.png';

export const TYC: Record<string, string> = { normal: '#9fa19f', fire: '#e8452b', water: '#2980ef', electric: '#f5b800', grass: '#3fa129', ice: '#3dcef3', fighting: '#ff8000', poison: '#9141cb', ground: '#915121', flying: '#6aa7e8', psychic: '#ef4179', bug: '#91a119', rock: '#afa981', ghost: '#704170', dragon: '#5060e1', dark: '#624d4e', steel: '#60a1b8', fairy: '#e86fe8' };
export const typeColour = (t: string | undefined): string => TYC[(t ?? '').toLowerCase()] ?? '#9fa19f';
/** A type chip (the Final Cut's plain one: colour and name). */
export const ty = (t: string): string => `<span class="ty" style="--t:${typeColour(t)}">${esc(cap(t))}</span>`;
export const hp = (p: number): string => `<span class="hp ${hpc(p)}"><i style="width:${Math.max(0, Math.min(100, p))}%"></i></span>`;
export const stars = (n: number, of = 3): string => `<i class="stars">${rep(of, (i) => `<u class="${i < n ? 'on' : ''}">★</u>`)}</i>`;

/** Where the run stands, for the progress ribbon: stops in all, the current one (0-based), and which are Gym stops. */
export interface PkRoad { n: number; at: number; gyms: readonly number[] }
/** The progress ribbon: one mark per stop, past ones filled, Gym stops taller, the League at the end. */
export function ribbon(r: PkRoad | null | undefined, cls = ''): string {
  if (!r || r.n < 2) return '';
  return `<i class="rib ${cls}">${rep(r.n, (i) => `<u class="${i < r.at ? 'past' : i === r.at ? 'on' : ''}${r.gyms.includes(i) ? ' gym' : ''}${i === r.n - 1 ? ' lg' : ''}"></u>`)}</i>`;
}

/** The header's areas: band colour (in the rules, by `data-a`) and icon. */
export type PkArea = 'party' | 'bag' | 'dex' | 'map' | 'town' | 'set' | 'guide' | 'card';
const AREA_ICON: Record<PkArea, readonly [PkArt, number]> = {
  party: [ballArt('pb'), 2], bag: [itemArt('potion'), 1], dex: [itemArt('scanner'), 1], map: [itemArt('map'), 1], town: [itemArt('coin_case'), 1],
  set: [itemArt('metal_coat'), 1], guide: [itemArt('calendar'), 1], card: [itemArt('master_ribbon'), 1],
};
const PILL_ICON: readonly (readonly [RegExp, PkArt, number])[] = [
  [/^₽/, itemArt('amulet_coin'), 0.5], [/Badge/i, itemArt('master_ribbon'), 0.5], [/of 6$/, ballArt('pb'), 1], [/Day/, itemArt('calendar'), 0.5], [/cap/, itemArt('rare_candy'), 0.5], [/Rank/, itemArt('shiny_charm'), 0.5],
];
/** The big faint word behind a page (the title's last part, or its first word when that is long). */
const watermark = (t: string): string => { const s = t.split(' · ').pop() ?? t; return s.length <= 9 ? s : s.split(' ')[0]!; };
export interface PkHeader { area?: PkArea; pills?: readonly string[]; crumb?: readonly string[]; road?: PkRoad | null; /** The title's font size when it must step down to fit beside the pills. */ size?: number }
/** The page header: area icon, title, the trail of pages that led here, fact pills, and (inside a run) the progress ribbon under it. */
export function hdr(title: string, o: PkHeader = {}): string {
  const a = o.area ?? 'map', [icon, sc] = AREA_ICON[a];
  const pills = (o.pills ?? []).map((p) => { const ic = PILL_ICON.find((x) => x[0].test(p)); return ic ? `<b class="ip"><u>${spr(ic[1], ic[2])}${esc(p)}</u></b>` : `<b><u>${esc(p)}</u></b>`; }).join('');
  return `<div class="hdr" data-a="${a}" ${mm('hdr')}><span class="hdr-ic">${spr(icon, sc)}</span><span class="hdr-t"${o.size ? ` style="font-size:${o.size}px"` : ''}>${esc(title)}</span>${o.crumb?.length ? `<span class="crumb">${o.crumb.map((c) => `<i>${esc(c)}</i>`).join('')}</span>` : ''}<span class="hdr-p">${pills}</span>${ribbon(o.road, 'under')}</div>` +
    `<i class="wm17" data-nocheck>${esc(watermark(title))}</i><i class="bunt22 hd" data-nocheck></i>`;
}

/** Key hints along the bottom: `[key, what it does, act?, arg?]`. Enter is lit green and Esc red; a hint with an act is a button too. */
export type PkKey = readonly [string, string, string?, (string | number)?];
export const keys = (ks: readonly PkKey[]): string =>
  `<div class="keys k20" ${mm('keys')}>${ks.map(([k, t, g, arg]) => `<span class="${/Enter/.test(k) ? 'ok' : /Esc/.test(k) ? 'no' : ''}"${g ? act(g, arg ?? '') : /Esc/.test(k) ? act('back') : ''}><kbd>${esc(k)}</kbd>${esc(t)}</span>`).join('')}</div>`;
/** The game's own key hints (`[['Enter', 'choose'], ['Esc', 'back']]`) as the Pocket key row. */
export const gameKeys = (hints: readonly (readonly [string, string])[] | undefined, fallback: readonly (readonly [string, string])[] = [['↑↓', 'move'], ['Enter', 'choose'], ['Esc', 'back']]): string =>
  keys((hints ?? fallback).map(([k, t]) => [k, t] as const));

/** The text box along the bottom. `who`: a speaker's name on a tab. `txt` is plain text. */
export const box = (txt: string, who = ''): string =>
  `<div class="tb${who ? ' talk' : ''}" ${mm('tb')}>${who ? `<b class="tb-w">${esc(who)}</b>` : ''}<p>${esc(txt)}</p>${who ? '<em class="tb-go"><kbd>Enter</kbd></em>' : ''}</div>`;

// ---- Settings controls (pass 5) ----
export const seg = (opts: readonly string[], on: number): string => `<span class="seg">${opts.map((o, i) => `<i class="${i === on ? 'on' : ''}">${esc(o)}</i>`).join('')}</span>`;
export const tog = (on: boolean): string => `<span class="tog${on ? ' on' : ''}"><i></i><u>${on ? 'On' : 'Off'}</u></span>`;
export const sld = (v: number): string => `<span class="sld"><i style="width:${v}%"></i><u style="left:${v}%"></u><b>${v}%</b></span>`;
