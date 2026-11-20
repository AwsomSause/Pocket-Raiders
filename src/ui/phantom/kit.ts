// Drawing helpers of the Phantom UI, kept the same as the mock-up source (plans/ui-redesign-persona/src/js/00-kit.js)
// so a screen built from them matches its mock-up. Everything returns HTML text for the 1280 x 720 Phantom stage.
// Text that comes from the player or from data goes through esc(). Presentation only.

import { rxAtlas, rxImage, rxTrim, rxUrl } from '../redux/assets';
import { esc } from '../redux/kit';

export { esc };

/** Every Phantom view's HTML starts with this mark and its page id: the stage reads it and draws the view on the Phantom layer. */
export const PH_MARK = '<!--ph:';
/** One Phantom page. `id` is the mock-up page it is built from (it picks that page's rules). */
export const page = (id: string, html: string, wipe = true): string =>
  `${PH_MARK}${id}--><section class="scr s-${id}" data-key="${id}">${html}${wipe ? '<div class="wipe" aria-hidden="true"><i></i><i></i><i></i></div>' : ''}</section>`;
/** The page id inside a view's HTML, or null when the view is not a Phantom one. */
export const pageOf = (html: string): string | null => (html.startsWith(PH_MARK) ? html.slice(PH_MARK.length, html.indexOf('-->')) : null);

/** `data-act` attribute: a click calls the scene's handler `name` with `arg`; `over` also names the hover handler. */
export const act = (name: string, arg: string | number = '', over = ''): string => ` data-act="${name}" data-arg="${esc(arg)}"${over ? ` data-over="${over}"` : ''}`;
export const at = (x: number, y: number, w?: number, h?: number): string => `left:${x}px;top:${y}px;${w != null ? `width:${w}px;` : ''}${h != null ? `height:${h}px;` : ''}`;

/** A plain picture at its own size times `z` (file with extension, under assets/images). */
export const pic = (file: string, z = 1, cls = '', st = ''): string => `<i class="spr" style="${st}"><img class="px ${cls}" src="${rxUrl(file)}" alt="" style="--z:${z}"></i>`;
/** A plain picture cut down to its drawing (the see-through border left off), as the mock-ups' trainer art is. Draws nothing until it is measured. */
export function cut(file: string, z = 1, cls = '', st = ''): string {
  const d = rxImage(file), t = rxTrim(file);
  if (!d || !t) return `<i class="spr" style="${st}"></i>`;
  return `<i class="spr" style="${st}"><b class="px ${cls}" style="--z:${z};width:${t[2]}px;height:${t[3]}px;background:url(${rxUrl(file)}) ${-t[0]}px ${-t[1]}px/${d[0]}px ${d[1]}px no-repeat"></b></i>`;
}
/** A Pokémon or trainer from its atlas (file without extension), cut down to its first frame's drawing. `play` steps through its frames. */
export function mon(file: string, z = 1, cls = '', st = '', play = false): string {
  const a = rxAtlas(file);
  if (!a) return `<i class="spr" style="${st}"></i>`;
  const [x, y, w, h, ox, oy] = a.f[0]!;
  const b = `<b style="position:absolute;left:${ox}px;top:${oy}px;width:${w}px;height:${h}px;background:url(${rxUrl(file + '.png')}) ${-x}px ${-y}px/${a.w}px ${a.h}px no-repeat"></b>`;
  return `<i class="spr" style="${st}"><i class="px ${cls}" style="--z:${z};position:relative;width:${w}px;height:${h}px"><i class="an" data-a="${file}" data-k="1"${play && a.f.length > 1 ? ' data-play' : ''} style="position:absolute;left:${-ox}px;top:${-oy}px;width:${a.sw}px;height:${a.sh}px">${b}</i></i></i>`;
}
/** A player or boss trainer (assets/images/bosses/<key>.png). */
export const hero = (key: string, z = 1, cls = '', st = ''): string => cut(`bosses/${key}.png`, z, cls, st);

export const TYC: Record<string, string> = { normal: '#9fa19f', fire: '#ff6a2b', water: '#2f8fff', grass: '#3fb84a', electric: '#f7c400', ice: '#3fd8ff', fighting: '#ff8000', poison: '#a245d6', ground: '#a0672c', flying: '#7fb8ff', psychic: '#ff4f86', bug: '#96a81f', rock: '#b3a676', ghost: '#70417a', dragon: '#5a63e8', dark: '#50413f', steel: '#60a1b8', fairy: '#ef70ef' };
export const ty = (t: string): string => { const k = t.toLowerCase(); return `<span class="ty" style="--tc:${TYC[k] ?? '#888'}"><img class="px" src="${rxUrl(`packs/story/badge/${k}.png`)}" alt="">${esc(k.toUpperCase())}</span>`; };

/** The mock-ups' own little random source: the same seed always gives the same cut-out letters. Never a gameplay stream. */
function rnd(seed: number): () => number {
  let h = seed >>> 0 || 1;
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909), (h ^= h >>> 16) >>> 0) / 4294967296);
}
/** Cut-out "ransom note" letters. */
export function ransom(str: string, seed = 7, cls = ''): string {
  const r = rnd(seed);
  return `<span class="rs ${cls}" aria-label="${esc(str)}">` + [...str].map((ch) => (ch === ' ' ? '<i></i>' : `<b class="r${Math.floor(r() * 6)}" style="--a:${(r() * 12 - 6).toFixed(1)}deg;--y:${Math.round(r() * 10 - 5)}px;--s:${(0.86 + r() * 0.3).toFixed(2)}">${esc(ch)}</b>`)).join('') + '</span>';
}
/** Key hints: `[label, text, act?, arg?]`. A hint with an act is a button too. */
export const keys = (...k: readonly (readonly [string, string, string?, (string | number)?])[]): string =>
  `<div class="keys">${k.map(([a, b, g, arg]) => `<span class="key"${g ? act(g, arg ?? '') : ''}><b${a.length > 1 ? ' class="w"' : ''}>${esc(a)}</b>${esc(b)}</span>`).join('')}</div>`;
export const hp = (cur: number, max: number, cls = ''): string => { const p = Math.round((cur / Math.max(1, max)) * 100); return `<span class="hpbar ${cls} ${p <= 20 ? 'low' : p <= 50 ? 'mid' : ''}"><i style="width:${p}%"></i></span>`; };
