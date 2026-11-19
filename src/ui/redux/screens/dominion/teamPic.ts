// DOMINION D7: crew pictures in the team's colours with the armband (Part 6 §8, Part 11). The picture the game shows
// (Rook's png, or frame 0 of a trainer atlas on its untrimmed canvas) is copied to a canvas, `paintTeam` swaps the
// outfit colours and paints the band, and the result is cached as a data URL per (look, colours, initial). Until it
// is built (or if anything fails) the plain picture is drawn, so missing art never breaks a screen. Presentation only.

import { DOMINION_DATA } from '../../../../core/dominion/data';
import type { TeamColours } from '../../../../core/dominion/founding';
import { paintTeam } from '../../../../core/dominion/teamLook';
import { rxAtlas, rxRedraw, rxUrl } from '../../assets';
import { tall } from '../../kit';

const built = new Map<string, string | null>();
const busy = new Set<string>();

function load(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(url));
    im.src = url;
  });
}

/** The recoloured picture's URL, or null while it builds / when the look has no data (draw the plain one then). */
export function teamSrc(look: string, team: TeamColours | null): string | null {
  const e = DOMINION_DATA.armbands[look];
  if (!e || typeof document === 'undefined') return null;
  const k = `${look}|${team ? `${team.primary}|${team.secondary}|${team.initial}` : 'grey'}`;
  const hit = built.get(k);
  if (hit !== undefined) return hit;
  if (busy.has(k)) return null;
  const png = look.endsWith('.png');
  const a = png ? null : rxAtlas(look);
  if (!png && !a) return null; // the atlas is still loading; its arrival redraws and asks again
  busy.add(k);
  void (async () => {
    try {
      const im = await load(rxUrl(png ? look : `${look}.png`));
      const cv = document.createElement('canvas');
      cv.width = e.w;
      cv.height = e.h;
      const g = cv.getContext('2d');
      if (!g) throw new Error('no 2d');
      if (png) g.drawImage(im, 0, 0);
      else {
        const [x, y, w, h, ox, oy] = a!.f[0]!;
        g.drawImage(im, x, y, w, h, ox, oy, w, h);
      }
      const d = g.getImageData(0, 0, e.w, e.h);
      paintTeam(d.data, e.w, e.h, e, team, DOMINION_DATA.founding.band);
      g.putImageData(d, 0, 0);
      built.set(k, cv.toDataURL());
    } catch {
      built.set(k, null);
    }
    busy.delete(k);
    rxRedraw();
  })();
  return null;
}

/** A png look (Rook's): its src, recoloured when ready. */
export const pngSrc = (look: string, team: TeamColours | null): string => teamSrc(look, team) ?? rxUrl(look);

/** An atlas look scaled to a height, recoloured when ready (same box as kit's `tall`). */
export function tallTeam(look: string, px: number, team: TeamColours | null, cls = ''): string {
  const src = teamSrc(look, team);
  const e = DOMINION_DATA.armbands[look];
  if (!src || !e) return tall(look, px, cls);
  return `<img class="px ${cls}" src="${src}" alt="" data-team="1" style="width:${Math.round((e.w * px) / e.h)}px;height:${px}px;image-rendering:pixelated">`;
}

/** Either kind of look in a box (a png fills the box; an atlas is scaled to `h`). */
export function memberPic(look: string, h: number, style: string, team: TeamColours | null, cls = 'px'): string {
  return look.endsWith('.png')
    ? `<img class="${cls}" src="${pngSrc(look, team)}" alt="" style="${style}">`
    : `<div style="${style};display:flex;align-items:flex-end;justify-content:center;overflow:hidden">${tallTeam(look, h, team)}</div>`;
}
