// The Pocket look's raid pages (mock-up `rd-lobby`): before going into a den, your side (you and the helpers you can
// hire) against the boss (its level, the card you can add, a talk, co-op). MapScene hands over what raidPreview reads
// from the run; picking a row only chooses how the raid starts. Presentation only.

import { act, esc, keys, page } from '../kit';
import { rxUrl } from '../../redux/assets';
import { pkSide32, type PkSideRow } from './galar';

export interface PkRdLobbyModel {
  /** "Tier 3 raid · Raid Den". */
  tag: string;
  boss: string;
  me: readonly PkSideRow[];
  foe: readonly PkSideRow[];
  /** The line under your side and the one under the boss. */
  meFoot: string;
  foeFoot: string;
  /** What the lit row does, for the button ("Start the raid", "Talk to it", "Turn co-op on"). */
  button: string;
  sub: string;
}

/** The Raid Lobby (mock-up `rd-lobby`). Rows pick with `pick`; the button and Enter start the lit choice. */
export function pkRdLobby(d: PkRdLobbyModel): string {
  return page('rd-lobby', 51, `<div class="scr sz20 ar28 a-rd pg28" data-key="rd-lobby"><div class="sz-h" data-m="hdr"><i class="emb28 rd hd" data-nocheck><img src="${esc(rxUrl('packs/raid/max/icon.png'))}" alt=""></i><b>Raid lobby</b><span>${esc(d.sub)}</span></div>`
    + `<div class="vs32">${pkSide32('a', 'Your side', 'You and your helpers', d.me, d.meFoot)}<i class="vsb32" data-nocheck>VS</i>${pkSide32('b', d.tag, d.boss, d.foe, d.foeFoot)}</div>`
    + `<div class="btn on nx go32" data-key="rd-go"${act('popPick', -1)}><b>${esc(d.button)}</b></div>${keys([['Enter', 'start'], ['↑↓', 'choose'], ['←→', 'change card'], ['Esc', 'leave', 'pop']])}</div>`);
}
