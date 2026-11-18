// Evil Mode slice 12 in the New look: the Road page, the fire, and the last room (design Parts 19-21, Part 29). Plain data
// in from core/evilMode/roadScreens.ts. Every choice is a tap target with a key path (O opens the Road; Up/Down pick;
// Enter says it; Esc closes the Road page; the fire and the room stay until they're closed).

import type { RoadModel } from '../../../core/evilMode/roadScreens';
import { act, B, esc, W } from '../kit';

const sm = (t: string, st = ''): string => `<div class="sm" style="line-height:17px;${st}">${esc(t)}</div>`;

export function roadView(m: RoadModel, sel: number, notice: string | null): string {
  const close = m.forced ? '' : B('Close', false, 'padding:2px 10px;font-size:13px', '', `${act('road')} data-testid="evil-road-close"`);
  const head = `<div class="row" style="gap:8px;align-items:center;margin-bottom:6px"><b data-testid="evil-road-title">${esc(m.title)}</b>${m.temper ? `<span class="tg" data-testid="evil-temper">${esc(m.temper)}</span>` : ''}<div class="grow"></div>${close}</div>`;
  const lines = m.lines.map((l) => sm(l, 'margin-bottom:4px')).join('');
  const sections = m.sections.map((s) => `<div style="margin-top:6px"><b class="sm">${esc(s.title)}</b>${s.lines.length ? s.lines.map((x) => sm(x)).join('') : sm(s.empty, 'opacity:.55;font-style:italic')}</div>`).join('');
  const own = m.own ? `<div style="margin-top:6px">${sm(m.own.help, 'opacity:.75')}<div class="row" style="gap:6px;align-items:center"><div class="win ev-own grow" style="height:30px" data-testid="evil-own-field"></div>${B('Say it', false, 'padding:2px 10px;font-size:13px', '', `${act('rsay', m.own.id)} data-testid="evil-own-say"`)}</div></div>` : '';
  const choices = m.choices.map((c, i) => `<div style="margin-top:3px">${B(esc(c.say), i === sel, 'padding:3px 10px;font-size:13px;text-align:left;width:100%;box-sizing:border-box', '', `${act('rpick', c.id)} data-testid="evil-road-choice" data-id="${esc(c.id)}"`)}${c.note ? sm(c.note, 'opacity:.65;font-size:11px;margin-left:10px') : ''}</div>`).join('');
  const note = notice ? sm(notice, 'margin-top:6px;font-weight:700') : '';
  return W(`${head}<div style="position:absolute;left:10px;right:10px;top:40px;bottom:8px;overflow:auto" data-testid="evil-road-body">${lines}${note}${own}${choices}${sections}</div>`, 'position:absolute;left:16px;right:16px;top:130px;bottom:70px;padding:8px 10px', '', ` data-testid="evil-roadpage" data-mode="${m.mode}"`);
}
