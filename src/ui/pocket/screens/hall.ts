// The Pocket look's Hall of Fame (mock-up `hof`): the title in gold, the team under spotlights with the Trainer in the
// middle, and a bar that says what comes next with one button. It shows when a region's Champion falls (BattleScene)
// and when a past winning team is opened from the Hall of Fame records (HallOfFameScene). Presentation only.

import type { Art } from '../../redux/templates';
import { TYPE_COLORS } from '../../redux/kit';
import { monArt } from '../art';
import { act, esc, page } from '../kit';
import { fit, fitBody, fitPic, pkArtOf } from '../templates';

export interface PkHallModel {
  /** "Kanto cleared · Run 13 · 2:14:06". */
  where: string;
  mons: readonly { file: string | null; name: string; /** First type, for the name tag's colour. */ type: string }[];
  trainer: { art: Art | null; name: string };
  /** The bar's line; the words between ** ** are bold (a region name). */
  say: string;
  button: string;
  /** The button's action (default "next"). */
  go?: string;
}

/** A type's colour for the name tag (grey when unknown). */
export const hallTag = (type: string): string => TYPE_COLORS[type.charAt(0).toUpperCase() + type.slice(1)] ?? '#9fa19f';

export function pkHall(d: PkHallModel): string {
  const mons = d.mons.slice(0, 6);
  const mid = Math.ceil(mons.length / 2);
  const spot = (m: PkHallModel['mons'][number], i: number): string => `<i style="--i:${i};--t:${hallTag(m.type)}" data-key="hf-${i}">${m.file ? fitPic(monArt(m.file), 100, 104, '', 3) : ''}<u style="font-size:${fit(m.name, 116, 12, 9, 0.62)}px">${esc(m.name)}</u></i>`;
  const me = `<i class="me" style="--i:${mid};--t:#e3350d" data-key="hf-me">${d.trainer.art ? fitPic(pkArtOf(d.trainer.art), 124, 206, '', 4) : ''}<u style="font-size:${fit(d.trainer.name, 124, 12, 9, 0.62)}px">${esc(d.trainer.name)}</u></i>`;
  const row = [...mons.slice(0, mid).map((m, i) => spot(m, i)), me, ...mons.slice(mid).map((m, k) => spot(m, mid + 1 + k))].join('');
  const say = esc(d.say).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const go = d.go ?? 'next';
  return page('hof', 26, `<div class="scr res hofp" style="--c:#f2a900" data-key="hof"><i class="glow"></i><i class="confetti"></i><div class="hf-t" data-key="hf-title"><small style="font-size:${fit(d.where, 820, 13, 10, 0.62)}px">${esc(d.where)}</small><b>Hall of Fame</b></div><div class="hf-row" data-key="hf-row">${row}</div><div class="vs-say" data-key="hf-say"><p style="font-size:${fitBody(d.say, 760, 52, [18, 16, 14], 1.35)}px">${say}</p><div class="btn on nx"${act(go)}><b style="font-size:${fit(d.button, 200, 20, 13, 0.6)}px">${esc(d.button)}</b></div></div></div>`);
}
