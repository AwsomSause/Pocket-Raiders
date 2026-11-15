// New UI: Save Slots (mock-up piece "Save Slots", layout A rows / B columns) and the shared Confirm dialog.

import type { ReduxCtx } from '../stage';
import { act, B, esc, H, mini, TX, W } from '../kit';

export interface SavesModel {
  slots: { tag: string; name: string; where: string; time: string; party: string[]; empty: boolean }[];
  focus: number;
  /** The cursor is on Delete rather than on the slot. */
  onDelete: boolean;
  note: string;
  confirm: ConfirmModel | null;
}

export interface ConfirmModel { title: string; body: string; options: string[]; index: number }

/** The mock-ups' Confirm dialog: a shade, a window, the options side by side. Clicks call `confirm` with the option's index. */
export const confirmBox = (d: ConfirmModel): string =>
  '<div class="shade"></div>' + W(`<b style="font-size:21px">${esc(d.title)}</b><div class="sm" style="line-height:20px">${esc(d.body)}</div><div class="row">${d.options.map((o, k) => B(esc(o), k === d.index, 'flex:1;justify-content:center', '', `${act('confirm', k)} data-over="confirmOver"`)).join('')}</div>`, 'position:absolute;left:260px;right:260px;top:170px;display:flex;flex-direction:column;gap:12px;padding:18px 20px;z-index:9');

export function savesView(c: ReduxCtx, d: SavesModel): string {
  const v = c.v(2);
  const rows = d.slots.map((s, k) => {
    const on = k === d.focus;
    const del = on && !s.empty ? `<span class="tg${d.onDelete ? '' : ' no'}"${d.onDelete ? ' style="background:#e84838;color:#fff"' : ''}${act('del', k)}>Delete</span>` : '';
    return W(`<div class="${v ? 'col' : 'row'}" style="gap:${v ? 10 : 16}px"><span class="tg${on ? '' : ' no'}">${esc(s.tag)}</span><b style="font-size:21px">${esc(s.name)}</b><span class="sm grow">${esc(s.where)}</span>${s.party.length ? `<div class="row" style="gap:3px">${s.party.slice(0, 6).map((p) => mini(p, 38)).join('')}</div>` : ''}<span class="sm">${esc(s.time)}</span>${del}</div>`, `flex:1;padding:${v ? 18 : 12}px 16px`, s.empty ? 'dim' : '', `${act('open', k)} data-over="over"`);
  }).join('');
  return H('Save Slots', 'sys', [['Enter', 'choose'], ['→', 'delete'], ['Esc', 'back']]) + `<div class="abs ${v ? 'row' : 'col'}" style="left:24px;right:24px;top:74px;gap:18px;align-items:stretch">${rows}</div>` + TX(esc(d.note)) + (d.confirm ? confirmBox(d.confirm) : '');
}
