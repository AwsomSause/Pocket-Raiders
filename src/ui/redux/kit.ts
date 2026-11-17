// Drawing helpers of the New UI, kept the same as the mock-up sources (redux-lib.js and redux-explorer.js) so a
// screen built from them matches its mock-up: sprites, pictures, windows, buttons, header band, text box.
// Everything returns HTML text for the 960 x 540 stage. Text that comes from the player or from data goes through esc().

import { rxAtlas, rxImage, rxUrl } from './assets';

export const esc = (t: unknown): string => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** A Pokémon or trainer from its atlas (file without extension, under assets/images). The box is the untrimmed frame. */
export function mon(file: string, k = 3, cls = '', play = false): string {
  const a = rxAtlas(file);
  if (!a) return '';
  const [x, y, w, h, ox, oy] = a.f[0]!;
  return `<i class="an ${cls}" data-a="${file}" data-k="${k}"${play ? ' data-play' : ''} style="width:${a.sw * k}px;height:${a.sh * k}px"><b style="left:${ox * k}px;top:${oy * k}px;width:${w * k}px;height:${h * k}px;background-image:url(${rxUrl(file + '.png')});background-position:${-x * k}px ${-y * k}px;background-size:${a.w * k}px ${a.h * k}px"></b></i>`;
}
/** A sprite fitted into a square of `size`. */
export function mini(file: string, size = 48, cls = '', play = false): string {
  const a = rxAtlas(file);
  return a ? mon(file, size / Math.max(a.sw, a.sh), cls, play) : '';
}
/** A sprite scaled to a height. */
export function tall(file: string, px: number, cls = ''): string {
  const a = rxAtlas(file);
  return a ? mon(file, px / a.sh, cls) : '';
}
/** A plain picture (file with extension), k times its size, optionally cropped to [x, y, w, h]. */
export function img(file: string, k = 3, crop?: readonly [number, number, number, number], st = ''): string {
  const d = rxImage(file);
  if (!d) return '';
  const [x, y, w, h] = crop ?? [0, 0, d[0], d[1]];
  return `<i class="im" style="width:${w * k}px;height:${h * k}px;background-image:url(${rxUrl(file)});background-position:${-x * k}px ${-y * k}px;background-size:${d[0] * k}px ${d[1] * k}px;${st}"></i>`;
}
/** A picture fitted into a square of `size`. */
export function icon(file: string, size = 48, st = ''): string {
  const d = rxImage(file);
  return d ? img(file, size / Math.max(d[0], d[1]), undefined, st) : '';
}
export const foot = (x: number, y: number, h: string, st = ''): string => `<div class="foot" style="left:${x}px;top:${y}px;${st}">${h}</div>`;
export const bg = (file: string, st = ''): string => `<div class="bg" style="background-image:url(${rxUrl(file)});${st}"></div>`;

export const TYPE_COLORS: Record<string, string> = { Fire: '#e8622a', Water: '#3d8bea', Grass: '#3fae5a', Electric: '#d8a810', Dragon: '#6a58d8', Ghost: '#6a4a9a', Fighting: '#c03028', Steel: '#7a8aa0', Flying: '#6a98e0', Poison: '#a040a0', Ground: '#b89038', Dark: '#4a4050', Psychic: '#e8508a', Normal: '#8a8a7a', Ice: '#38b0c8', Fairy: '#e070b8', Rock: '#a08838', Bug: '#809818' };
const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
export const ty = (t: string): string => `<span class="ty" style="--tc:${TYPE_COLORS[cap(t)] ?? '#888'}">${esc(cap(t))}</span>`;
export const hpb = (p: number, w = 0, c = ''): string => `<div class="hp${c || (p > 50 ? '' : p > 20 ? ' mid' : ' low')}" style="${w ? `width:${w}px` : 'flex:1'}"><i style="width:${p}%"></i></div>`;

/** Header band colours by area (the mock-ups' C table). */
export const AREA = { sys: '#3d8bea', hub: '#3d8bea', run: '#2aa6a0', map: '#2aa6a0', story: '#9a5ad8', shop: '#e8892a', reward: '#d8a810', battle: '#d8483a', party: '#3fae5a', end: '#b8862a' } as const;
export type Area = keyof typeof AREA;

/** A key hint: `[['Enter', 'choose'], ['Esc', 'back']]`. */
export const keys = (list: readonly (readonly [string, string])[]): string => list.map(([k, t]) => `<span><kbd>${esc(k)}</kbd>${esc(t)}</span>`).join('');
/** Header band with the key hints at the top right. */
export const H = (title: string, area: Area = 'sys', hints: readonly (readonly [string, string])[] = [['Enter', 'choose'], ['Esc', 'back']]): string =>
  `<div class="hd" style="--c:${AREA[area]}"><i class="dot"></i>${esc(title)}</div><div class="keys">${keys(hints)}</div>`;
/** Where the chips beside a header band start: past the title, which grows with its length (about 15 px a letter). */
export const chipsLeft = (title: string): number => Math.max(350, 60 + Math.round(title.length * 15));
/** The text box along the bottom, with an optional speaker name tab. `t` is HTML. */
export const TX = (t: string, name = '', st = ''): string => `<div class="abs txt" style="left:20px;right:20px;bottom:16px;${st}">${name ? `<span class="nm">${esc(name)}</span>` : ''}${t}</div>`;
/** A window. `h` is HTML. */
export const W = (h: string, st = '', c = '', attr = ''): string => `<div class="win ${c}" style="${st}"${attr}>${h}</div>`;
/** A button. `t` is HTML; `sm` is the small note at its right. */
export const B = (t: string, on: boolean, st = '', sm = '', attr = ''): string => `<div class="btn${on ? ' on' : ''}" style="${st}"${attr}>${t}${sm ? `<small>${sm}</small>` : ''}</div>`;
/** A sheet of paper (receipts, ledgers, notebook pages). */
export const paper = (h: string, st = ''): string => `<div style="background:var(--pa);color:var(--pai);padding:16px 18px;box-shadow:0 0 0 3px var(--l),6px 6px 0 #0005;${st}">${h}</div>`;
export const facts = (f: readonly (readonly [string, string])[] = []): string => f.map(([a, b]) => `<div class="row sm"><span class="grow">${esc(a)}</span><b>${esc(b)}</b></div>`).join('');
/** `data-act` attribute: a click calls the view's handler `name` with `arg`. */
export const act = (name: string, arg: string | number = ''): string => ` data-act="${name}" data-arg="${esc(arg)}"`;

/** Map stops, as the mock-ups draw them: a coloured disc with a letter. Game kinds the mock-ups do not name borrow the nearest one. */
const NODE_KINDS: Record<string, readonly [string, string]> = {
  wild: ['#3fae5a', 'W'], trainer: ['#d8483a', 'T'], gym: ['#d8a810', 'G'], elite: ['#d8a810', 'E'], champion: ['#d8a810', 'C'], event: ['#9a5ad8', '?'], shop: ['#e8892a', '$'], heal: ['#3d8bea', 'R'], rest: ['#3d8bea', 'R'],
  raid: ['#c03028', '!'], totem: ['#c03028', 'B'], fish: ['#38b0c8', 'F'], expedition: ['#38b0c8', 'X'], minigame: ['#9a5ad8', 'M'], service: ['#e8892a', 'S'], plaza: ['#3d8bea', 'P'],
  // Mega-Expedition stops.
  cache: ['#e8892a', '$'], research: ['#3d8bea', '?'], mystery: ['#9a5ad8', '!'], recruit: ['#2aa6a0', 'R'], megaEnergy: ['#d8a810', 'M'], finale: ['#d8483a', '★'], blocked: ['#5a4a4a', '✗'],
};
export const nodeStyle = (kind: string): readonly [string, string] => NODE_KINDS[kind] ?? ['#8a8a7a', kind.charAt(0).toUpperCase()];
export const nodeDot = (kind: string, x: number, y: number, cur = false, off = false, attr = ''): string => { const [c, ch] = nodeStyle(kind); return `<div class="nd${off ? ' off' : ''}" style="left:${x}px;top:${y}px;--c:${c}"${attr}>${ch}${cur ? '<u></u>' : ''}</div>`; };

/** The words a picture's stand-in shows while its file is still loading (ui/sprites.ts placeholder): never part of a row's text. */
export const isArtPlaceholder = (text: string): boolean => /\(art missing\)\s*$/.test(text);
