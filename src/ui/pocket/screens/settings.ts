// The Pocket look's Settings home (mock-up page `settings`): nine category tiles, three across, each with a line
// about what it holds now, and under them the rows that are not a category (Game Summary, Search, Reset, Back).
// The category pages themselves are the shared option rows (../templates.ts `pkOptions`). Presentation only.

import type { ConfirmModel } from '../../redux/screens/saves';
import { type PkArt, ballArt, itemArt } from '../art';
import { act, box, esc, gameKeys, hdr, page, spr } from '../kit';
import { fit, pkConfirm } from '../templates';

/** The tile picture of each settings category, by its id. */
const TILE_ART: Record<string, readonly [PkArt, number]> = {
  display: [itemArt('scanner'), 1.5], audio: [itemArt('soothe_bell'), 1.5], gameplay: [ballArt('pb'), 3], animations: [itemArt('quick_claw'), 1.5], text: [itemArt('map'), 1.5],
  accessibility: [itemArt('wise_glasses'), 1.5], controls: [itemArt('z_ring'), 1.5], story: [itemArt('calendar'), 1.5], data: [itemArt('coin_case'), 1.5],
};

export interface PkSettingsHome {
  /** The category tiles, in list order: the first rows of the page's list. */
  tiles: readonly { id: string; label: string; sub: string }[];
  /** The rows after the tiles. */
  more: readonly { label: string; disabled?: boolean }[];
  index: number;
  text: string;
  crumb: readonly string[];
  /** The Reset question, over the page. */
  ask?: ConfirmModel | null;
}

/** Columns the cursor moves across on the Settings home. */
export const PK_SETTINGS_COLS = 3;

export function pkSettingsHome(d: PkSettingsHome): string {
  const tiles = d.tiles.map((t, k) => { const [a, sc] = TILE_ART[t.id] ?? TILE_ART.display!; return `<div class="tile sc${k === d.index ? ' on' : ''}" data-key="t${k}"${act('pick', k, 'over')}>${spr(a, sc)}<div><b style="font-size:${fit(t.label, 200, 30, 18, 0.5)}px">${esc(t.label)}</b><span style="font-size:${fit(t.sub, 190, 12.5, 9.5, 0.5)}px">${esc(t.sub)}</span></div></div>`; }).join('');
  const more = d.more.map((r, q) => { const k = d.tiles.length + q; return `<div class="btn sm${k === d.index ? ' on' : ''}${r.disabled ? ' off' : ''}" data-key="m${k}"${act('pick', k, 'over')}><b style="font-size:${fit(r.label, 270, 14, 10.5)}px">${esc(r.label)}</b></div>`; }).join('');
  // The Reset question asks through the page's own rows, so its answers press `pick`.
  const ask = d.ask ? pkConfirm(d.ask).replaceAll('data-act="confirm"', 'data-act="pick"').replaceAll('data-over="confirmOver"', 'data-over="over"') : '';
  return page('settings', 26, `<div class="scr settings sh5 gx-home">${hdr('Settings', { area: 'set', crumb: d.crumb })}<div class="sc-grid">${tiles}</div><div class="gx-more">${more}</div>${box(d.text)}${gameKeys([['←→↑↓', 'move'], ['Enter', 'open'], ['Esc', 'back']])}${ask}</div>`);
}
