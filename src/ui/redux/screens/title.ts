// New UI: the Title screen, the mock-ups' "Title (Main Menu)" piece in its four layouts
// (A list at the right, B press-start row, C left column, D tilted band). The scene owns the menu.

import type { ReduxCtx } from '../stage';
import { act, B, bg, esc } from '../kit';

export interface TitleModel {
  options: { label: string; disabled?: boolean }[];
  index: number;
  /** Version plate under the logo. */
  version: string;
  /** Splash picture under assets/images. */
  art: string;
  /** Save warnings; shown in place of the fan-game line. */
  notes: string[];
}

export function titleView(c: ReduxCtx, d: TitleModel): string {
  const v = c.v(4), art = bg(d.art);
  const btn = (st = '') => d.options.map((o, k) => B(esc(o.label), k === d.index, st, '', `${act('pick', k)} data-over="over"`).replace('class="btn', `class="btn${o.disabled ? ' off' : ''}`)).join('');
  const logo = (st: string) => `<div class="abs" style="${st}"><div style="font-size:64px;font-weight:700;line-height:.9;color:#fff;text-shadow:5px 5px 0 var(--l)">POCKET<br><span class="acc">RAIDERS</span></div><div class="plate" style="display:inline-block;margin-top:10px;font-size:14px">${esc(d.version)}</div></div>`;
  const notes = d.notes.length ? `<div class="abs txt" style="left:36px;bottom:60px;max-width:520px;font-size:15px;line-height:19px">${d.notes.map(esc).join('<br>')}</div>` : '';
  if (v === 1) return art + '<div class="shade" style="background:linear-gradient(#0000 40%,#000c)"></div>' + logo('left:0;right:0;top:60px;text-align:center') + `<div class="abs pulse" style="left:0;right:0;bottom:104px;text-align:center;font-size:24px;font-weight:700;color:#fff">Press Enter</div><div class="abs row" style="left:0;right:0;bottom:28px;justify-content:center;gap:10px">${btn('height:38px;font-size:15px')}</div>` + notes;
  if (v === 2) return art + `<div class="abs win col" style="left:0;top:0;bottom:0;width:340px;padding:150px 26px 0;gap:9px;border-radius:0;clip-path:none">${btn()}</div>` + logo('left:26px;top:24px;transform:scale(.62);transform-origin:0 0') + notes.replace('left:36px', 'left:376px');
  if (v === 3) return art + `<div class="abs" style="left:-80px;right:-80px;top:300px;height:150px;background:var(--p);transform:rotate(-5deg);box-shadow:0 0 0 4px var(--f),0 0 0 8px var(--l)"></div>` + logo('left:40px;top:40px') + `<div class="abs row" style="left:40px;right:40px;top:352px;gap:10px;transform:rotate(-5deg)">${btn('flex:1;justify-content:center;font-size:15px;padding:0 6px')}</div>` + notes;
  return art + '<div class="shade" style="background:linear-gradient(90deg,#0000 45%,#000b)"></div>' + logo('left:36px;top:36px') + `<div class="abs col" style="right:36px;top:120px;width:300px;gap:10px">${btn()}</div>` + (notes || `<div class="abs sm" style="left:36px;bottom:24px;color:#fff">Fan game. Not for sale.</div>`);
}
