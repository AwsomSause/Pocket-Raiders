// The Pocket look's Rival Board (mock-up `rivals`), opened from the stage map (R, or Rivals in the menu): a card per
// rival on your trail (their picture and ace, Rival or Friend, the ace, this run's wins and losses, who leads), the lit
// one framed. Enter or a click on the lit card opens the full report (the older page). Presentation only.

import type { Art } from '../../redux/templates';
import { act, esc, hdr, keys, page, sprH } from '../kit';
import type { PocketRoad } from '../../../core/presentation/pocket';
import { fit, fitPic, pkArtOf } from '../templates';
import { monArt } from '../art';

export interface PkRival {
  name: string;
  role: 'Rival' | 'Friend';
  art: Art | null;
  /** The ace's name and front picture file, or null while it has not been seen. */
  ace: { name: string; file: string | null } | null;
  wins: number;
  losses: number;
  /** "You lead by 2", "Blue is ahead by 1", "Level". */
  lead: string;
}

export interface PkRivalsModel {
  rivals: readonly PkRival[];
  index: number;
  road: PocketRoad | null;
}

const COLOURS = ['#2a75bb', '#9b2c3f', '#2f9e44', '#e8791a'] as const;
const plural = (n: number, one: string): string => `${n} ${one}${n === 1 ? '' : one.endsWith('s') ? 'es' : 's'}`;

export function pkRivals(d: PkRivalsModel): string {
  const n = d.rivals.length, first = Math.floor(Math.max(0, d.index) / 4) * 4;
  const head = hdr('Rival Board', { area: 'card', crumb: ['Map', 'Rivals'], pills: [`${n} on your trail`], road: d.road });
  const cards = d.rivals.slice(first, first + 4).map((r, k) => {
    const i = first + k, who = pkArtOf(r.art);
    const ace = r.ace?.file ? fitPic(monArt(r.ace.file), 56, 56, '', 2) : '<b>?</b>';
    return `<div class="rvc pn${i === d.index ? ' on' : ''}" style="--c:${COLOURS[i % 4]}" data-key="rv-${i}"${act('popPick', i)}>`
      + `<div class="rv-top">${who ? sprH(who, 128) : ''}<i>${ace}</i></div><em>${r.role}</em><b style="font-size:${fit(r.name, 180, 34, 18, 0.55)}px">${esc(r.name)}</b>`
      + `<p><span>Ace</span><u>${esc(r.ace?.name ?? 'Not seen yet')}</u></p>`
      + `<p><span>This run</span><u>${r.wins + r.losses ? `${plural(r.wins, 'win')} · ${plural(r.losses, 'loss')}` : 'Not met yet'}</u></p>`
      + `<p><span>Lead</span><u style="font-size:${fit(r.lead, 180, 14, 11, 0.55)}px">${esc(r.lead)}</u></p></div>`;
  }).join('');
  const note = '<div class="rv-note" data-key="rv-note"><b>Good to know</b><span>A loss to a rival never ends your run. There are always four of them on your trail.</span></div>';
  return page('rivals', 26, `<div class="scr rivp" data-key="rivals">${head}<i class="wm17" data-nocheck>Rival</i><i class="bunt22 hd" data-nocheck></i><div class="rv-row" data-key="rv-row">${cards}</div>${note}${keys([['←→', 'rival'], ['Enter', 'full report', 'popOpen'], ['Esc', 'back', 'pop']])}</div>`);
}
