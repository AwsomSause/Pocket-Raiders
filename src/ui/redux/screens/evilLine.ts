// Evil Mode's Line page, in the New look (design Part 3 section 7.1, Part 29): the three stops side by side, what each
// allows and what moving there would cost, by name, and the team's real Line underneath. N opens; Left/Right picks a
// stop; Enter held two seconds moves it (letting go early cancels); Esc closes. Taps: press and hold the button.

import type { LineModel } from '../../../core/evilMode/lineScreens';
import { act, B, esc, W } from '../kit';

const sm = (t: string, st = ''): string => `<div class="sm" style="line-height:16px;${st}">${esc(t)}</div>`;

/** `held`: 0..1, how far through the two-second hold the confirm is (drawn as a bar); null when nothing's held. */
export function lineView(m: LineModel, held: number | null, notice: string | null = null): string {
  const head = `<div class="row" style="gap:6px;margin-bottom:6px;align-items:center"><b data-testid="evil-line-title">${esc(m.title)}</b><div class="grow"></div>${B('Close', false, 'padding:2px 10px;font-size:13px', '', `${act('line')} data-testid="evil-line-close"`)}</div>`;
  const stops = `<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px">${m.stops.map((s, i) => `<div class="win" style="padding:6px 8px;cursor:pointer;${s.sel ? 'outline:2px solid var(--team-a);' : ''}${s.current ? 'background:#ffffff14;' : ''}"${act('lstop', i)} data-testid="evil-line-stop-${s.id}" data-current="${s.current}">
    <b>${esc(s.name)}${s.current ? ' · now' : ''}</b>${sm(s.feel, 'opacity:.8;margin:2px 0 4px')}${sm(s.allows)}${sm(s.darkens, 'opacity:.8;margin-top:4px')}${s.move ? sm(s.move, 'margin-top:4px;font-style:italic') : ''}</div>`).join('')}</div>`;
  const bar = held !== null ? `<div style="height:4px;background:#0004;margin-top:4px"><div data-testid="evil-line-held" style="height:4px;width:${Math.round(held * 100)}%;background:var(--team-b)"></div></div>` : '';
  const can = !m.problem;
  const move = `<div style="margin-top:8px">${B('Hold to move the Line', can, `padding:4px 14px;${can ? '' : 'opacity:.5'}`, '', ` data-testid="evil-line-hold" data-hold="1"`)}${bar}${sm(m.problem ?? m.hint, m.problem ? 'color:#f08a7a;margin-top:4px' : 'opacity:.75;margin-top:4px')}</div>`;
  const said = notice ? `<div class="sm" style="line-height:16px;margin-top:6px" data-testid="evil-line-said">${esc(notice)}</div>` : '';
  const real = `<div style="margin-top:8px" data-testid="evil-line-real">${m.real.map((l) => sm(l, 'font-weight:700')).join('')}</div>`;
  return W(`${head}<div style="position:absolute;left:10px;right:10px;top:40px;bottom:8px;overflow:auto">${stops}${move}${said}${real}</div>`, 'position:absolute;left:16px;right:16px;top:130px;bottom:70px;padding:8px 10px', '', ' data-testid="evil-line"');
}
