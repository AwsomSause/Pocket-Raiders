// The Pocket look's healing stop (mock-up page `center`, Pokémon Center): Nurse Joy behind the counter, the party's
// balls light up one by one on the machine, a chime and a flash, then each Pokémon's HP bar fills from what it walked
// in with, with what the heal did under its name. Her line waits for Enter. The map's healing spot already healed the
// party before this page is drawn (MapScene); the page only shows it. Presentation only.

import type { PhHealModel } from '../../phantom/screens/stops';
import { ballArt, monArt, type PkArt } from '../art';
import { act, esc, hdr, hp, keys, page, spr, sprH } from '../kit';
import { fit, fitBody, fitPic } from '../templates';

/** Nurse Joy (the mock-ups' `ow-nurse`). */
export const PK_NURSE: PkArt = { file: 'trainer/drive/nurse', atlas: true };

export interface PkCenterModel extends PhHealModel {
  /** "Day 3 · Evening", or ''. */
  clock: string;
  /** Under each Pokémon: "+26 HP", "Revived", "Full"... (same order as the party). */
  notes: readonly string[];
}

/** What the heal did for one Pokémon, from its HP before (and its max) and after. */
export function healNote(before: number, after: number, max: number): string {
  if (before <= 0 && after > 0) return 'Revived';
  if (after - before <= 0) return before >= max ? 'Full' : '';
  return `+${after - before} HP`;
}

export function pkCenter(d: PkCenterModel): string {
  const n = d.party.length;
  const rows = d.party.map((m, k) => {
    const note = d.notes[k] ?? '';
    return `<div class="pc-r" style="--from:${Math.round(Math.max(0, Math.min(100, m.from)))}%" data-key="pc-r-${k}">${m.file ? fitPic(monArt(m.file), 40, 42, 'pc-s', 2) : '<i></i>'}<b style="font-size:${fit(m.name, 84, 14, 11, 0.56)}px">${esc(m.name)}</b>${hp(100)}<span class="num">${esc(m.hp)}</span><em class="${note === 'Full' ? 'full' : ''}">${esc(note || 'Healed')}</em></div>`;
  }).join('');
  // Six slots on the machine, as in the mock-up; a slot with no Pokémon stays empty.
  const balls = Array.from({ length: Math.max(6, n) }, (_, i) => (i < d.party.length ? `<u style="--i:${i}">${spr(ballArt('pb'), 1.5)}</u>` : '<u class="gx-pc-empty"><i></i></u>')).join('');
  const line = d.text.startsWith('"') ? d.text : `"${d.text}"`;
  return page('center', 26, `<div class="scr center c11" data-key="center">${hdr('Pokémon Center', { area: 'town', crumb: ['Map', 'Pokémon Center'], pills: d.clock ? [d.clock] : [] })}`
    + `<i class="pc-cross" data-key="pc-cross"></i><div class="pc-nurse" data-key="pc-nurse">${sprH(PK_NURSE, 190)}</div><i class="sh-counter"></i>`
    + `<div class="pc-mach" data-key="pc-mach">${balls}</div>`
    + `<div class="pc-list pn${n < 4 ? ' gx-pc-few' : ''}" data-key="pc-list">${rows}</div>`
    + `<div class="tb talk" data-m="tb" data-key="pc-tb"${act('heal')}><b class="tb-w">Nurse Joy</b><p style="font-size:${fitBody(line, 860, 50, [18, 16, 15, 14, 13], 1.35)}px">${esc(line)}</p><em class="tb-go"><kbd>Enter</kbd></em></div>`
    + keys([['Enter', 'back to the map', 'heal']]) + '</div>');
}
