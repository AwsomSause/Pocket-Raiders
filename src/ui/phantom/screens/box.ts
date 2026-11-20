// Phantom UI: the PC, built from the mock-ups' `box` (Reserve) page: the party down the left, the box as a wall of
// square slots, and the lit Pokémon on a card with what Enter does. It takes the shared wall's model (the PC is a
// wall of pictures in the New UI) plus the party. Presentation only.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import type { PartyChip } from '../../redux/game';
import { type GridModel, gridStart, pic as rxPic } from '../../redux/templates';
import { act, esc, mon, page } from '../kit';
import { phHead, phKeys } from '../templates';

export interface PhBoxModel extends GridModel {
  party: readonly PartyChip[];
  /** The lit Pokémon's other buttons (the mock-up's Summary and Give item), each with its key. */
  extras?: readonly { label: string; key: string; off: boolean }[];
}

/** The wall shows five lines of six slots. */
export const BOX_SHOWN = 30;

export function phBox(_ph: PhantomVersion, d: PhBoxModel): string {
  const n = d.n, s = gridStart(n, d.index, BOX_SHOWN, 6), det = d.detail;
  const back = '<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(66% 0,100% 0,100% 100%,74% 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:88%;--y:46%" aria-hidden="true"></div>';
  const team = `<div class="bx-party"><span class="lab">Party</span>${d.party.map((p) => `<div class="bxc p${p.fainted ? ' ko' : ''}">${p.file ? mon(p.file, 0.8) : ''}</div>`).join('')}${'<div class="bxc p e" aria-hidden="true"></div>'.repeat(Math.max(0, 6 - d.party.length))}</div>`;
  const cells = Array.from({ length: Math.max(0, Math.min(BOX_SHOWN, n - s)) }, (_, q) => {
    const i = s + q, r = d.cell(i);
    return `<div class="bxc ph-bxc${i === d.index ? ' on' : ''}${r.art ? '' : ' e'}" style="--i:${q}" data-key="c${i}"${act('pick', i, 'over')}>${rxPic(r.art, 64)}</div>`;
  }).join('')
    // The rest of the wall as empty slots, as the mock-up draws a box that is not full (they take no clicks).
    + `<div class="bxc ph-bxc e ph-bx-pad" aria-hidden="true"></div>`.repeat(Math.max(0, BOX_SHOWN - Math.max(0, n - s)));
  const here = d.cell(Math.max(0, Math.min(n - 1, d.index))), full = !!here?.art;
  const more = (d.extras ?? []).map((x, k) => `<div class="blade ph-bx-x${x.off ? ' off' : ''}" style="--i:${k + 1};--sh:#000;--r:${-2 + k}deg"${act('extra', k)}><kbd>${esc(x.key)}</kbd>${esc(x.label)}</div>`).join('');
  const card = `<div class="pn bx-d ph-bx-d" data-key="d${d.index}"><span class="lab">${esc(det.sub ?? (full ? 'In the PC' : 'Empty slot'))}</span><div class="bx-pic">${rxPic(det.art, 190) || '<b class="ph-de-q">+</b>'}</div><h3 class="tl1">${esc(det.title)}</h3><p class="txt">${esc(det.body ?? '')}</p><div class="bx-acts"><div class="blade on${here?.off ? ' off' : ''}" style="--sh:#000;--r:-3deg"${act('pick', d.index)}>${full ? 'Move to party' : 'Put one here'}</div>${more}</div></div>`;
  const where = n > BOX_SHOWN ? `<div class="ph-more2" style="left:170px;top:${138 + 5 * 94}px">${s > 0 ? '▲ ' : ''}${s + 1}–${Math.min(n, s + BOX_SHOWN)} of ${n}${s + BOX_SHOWN < n ? ' ▼' : ''}</div>` : '';
  return page('box', back + phHead(d.title, `PC · ${d.found} of ${d.total} in use`) + team + `<div class="bx ph-bx">${cells}</div>` + where + card
    + (d.text ? `<div class="pn ph-say ph-say-bx" data-key="t${d.index}"><p class="txt">${esc(d.text)}</p></div>` : '') + phKeys(d.hints, [['▲▼◀▶', 'move'], ['Enter', 'choose'], ['Esc', 'back']]));
}
