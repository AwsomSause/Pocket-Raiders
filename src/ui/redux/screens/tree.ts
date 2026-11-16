// New UI: the mock-ups' `tree` page (redux-explorer.js `tree`) for the hub's Research Tree. Rows of nodes, one row per
// branch, bought nodes plain, the cursor's node lit, the ones not open yet dimmed; the card on the right says what the
// lit node does, what it costs and what you have, over the Unlock button. Pure drawing: the Picker steers it.

import { act, type Area, B, esc, facts, H, TX, W } from '../kit';
import type { ReduxCtx } from '../stage';

export type TreeCellState = 'owned' | 'open' | 'locked' | 'none';
export interface TreeModel {
  title: string;
  area?: Area;
  /** Chips beside the title ("0 Research Points"). */
  chips: readonly string[];
  /** One row per branch, its name at the left; `cells` in order along the branch ('none' pads a short branch). */
  rows: readonly { name: string; cells: readonly { label: string; state: TreeCellState }[] }[];
  /** Cells per row: the cursor's index counts across rows of this width. */
  cols: number;
  index: number;
  card: { name: string; line: string; facts: readonly (readonly [string, string])[]; button: string; ready: boolean };
  text: string;
}

export function treeView(_c: ReduxCtx, d: TreeModel): string {
  const chips = d.chips.length ? `<div class="abs row" style="left:350px;top:13px;gap:6px;z-index:4">${d.chips.map((x, k) => `<span class="tg${k ? ' no' : ''}">${esc(x)}</span>`).join('')}</div>` : '';
  const rows = d.rows.map((r, ri) => `<div class="row" style="gap:12px"><span class="sm" style="width:84px;line-height:16px">${esc(r.name)}</span>${Array.from({ length: d.cols }, (_, ci) => {
    const k = ri * d.cols + ci, cell = r.cells[ci];
    if (!cell || cell.state === 'none') return '<div style="flex:1 1 0"></div>';
    const cls = k === d.index ? 'sel' : cell.state === 'owned' ? '' : 'dim';
    return W(`<b style="font-size:14px">${esc(cell.label)}</b>`, 'flex:1 1 0;min-width:0;padding:14px 6px;text-align:center;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis', cls, `${act('pick', k)} data-over="over"`);
  }).join('')}</div>`).join('');
  const card = W(`<b class="acc" style="font-size:20px">${esc(d.card.name)}</b><div class="sm" style="line-height:20px">${esc(d.card.line)}</div>${facts(d.card.facts)}`, 'display:flex;flex-direction:column;gap:9px');
  return H(d.title, d.area ?? 'hub') + chips
    + `<div class="abs col" style="left:24px;top:76px;width:560px;gap:16px">${rows}</div>`
    + `<div class="abs col" style="left:612px;right:24px;top:76px;gap:18px">${card}${B(esc(d.card.button), d.card.ready, 'justify-content:center' + (d.card.ready ? '' : ';opacity:.6'), '', act('pick', d.index))}</div>`
    + TX(esc(d.text));
}
