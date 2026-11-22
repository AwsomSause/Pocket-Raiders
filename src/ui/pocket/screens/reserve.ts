// The Pocket look's Reserve (mock-up `reserve`): the PC drawn as the party on the left, the boxed Pokémon as a wall of
// cards, and the swap bar for the lit card (who joins the party, or which slot takes a party Pokémon). The PC's own
// picker decides what Enter does; this only draws it. Presentation only.

import { act, esc, hdr, keys, page } from '../kit';
import { monArt } from '../art';
import { fit, fitPic } from '../templates';
import { gridStart } from '../../redux/templates';

export interface PkReserveMon {
  name: string;
  file: string | null;
  level: number | null;
  fainted?: boolean;
}

export interface PkReserveModel {
  party: readonly PkReserveMon[];
  /** The PC's slots in order; null is an empty slot. */
  box: readonly (PkReserveMon | null)[];
  index: number;
  /** In use and room ("7 of 30"). */
  used: number;
  room: number;
  /** What Enter does with the lit slot, or why it can't. */
  say: string;
  back: boolean;
}

const card = (m: PkReserveMon | null, cls = '', extra = ''): string =>
  m ? `<div class="pkm${cls}${m.fainted ? ' fnt' : ''}"${extra}><i>${m.file ? fitPic(monArt(m.file), 56, 46, '', 2) : ''}</i><b style="font-size:${fit(m.name, 90, 12, 9, 0.6)}px">${esc(m.name)}</b>${m.level !== null ? `<span>Lv ${m.level}</span>` : ''}</div>` : `<div class="pkm empty${cls}"${extra}></div>`;

export function pkReserve(d: PkReserveModel): string {
  const size = 18, s = gridStart(d.box.length, d.index, size, 6);
  const head = hdr('Reserve', { area: 'party', crumb: ['Party', 'Reserve'], pills: [`${d.used} of ${d.room}`] });
  const party = `<div class="rs-party pn" data-key="rs-party"><b>Party</b>${d.party.map((m) => card(m)).join('')}</div>`;
  const wall = d.box.slice(s, s + size).map((m, q) => card(m, s + q === d.index ? ' on' : '', ` data-key="rs-${s + q}"${act('pick', s + q, 'over')}`)).join('');
  const lit = d.box[d.index] ?? null;
  const swap = `<div class="rs-swap" data-key="rs-swap"><span>${lit ? 'Bring' : 'Send'}</span>${card(lit)}<i>${lit ? '→' : '←'}</i><em style="font-size:${fit(d.say, 420, 15, 11, 0.5)}px">${esc(d.say)}</em></div>`;
  return page('reserve', 26, `<div class="scr reserve" data-key="reserve">${head}${party}<div class="rs-box pn" data-key="rs-box"><b>Reserve</b><div>${wall}</div></div>${swap}${keys([['←→↑↓', 'move'], ['Enter', lit ? 'to the party' : 'fill this slot', 'pick', d.index], ...(d.back ? [['Esc', 'back'] as const] : [])])}</div>`);
}
