// Evil Mode's Gym page, in the New look (design Part 29 section 12.2): the Leader, five doors (Beat, Buy, Bend,
// Replace, Befriend) each open or shut with who shut it, the chosen door's Card, and the standing. Y opens; Left/Right
// picks a door; Enter does it (at the In person beat); Esc closes. Taps: press a door, then "Do it".

import type { GymModel } from '../../../core/evilMode/gymScreens';
import { act, B, esc, W } from '../kit';

const sm = (t: string, st = ''): string => `<div class="sm" style="line-height:16px;${st}">${esc(t)}</div>`;

export function gymView(m: GymModel, notice: string | null = null): string {
  const head = `<div class="row" style="gap:6px;margin-bottom:6px;align-items:center"><b data-testid="evil-gym-title">${esc(m.title)}</b><span class="tg">${esc(m.leader.type)}</span><span class="tg" data-testid="evil-gym-standing" title="${esc(m.standing.moved)}">${esc(m.standing.word)}</span><div class="grow"></div>${B('Close', false, 'padding:2px 10px;font-size:13px', '', `${act('gym')} data-testid="evil-gym-close"`)}</div>`;
  const doors = `<div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px">${m.doors.map((d, i) => `<div class="win" style="padding:6px 8px;cursor:pointer;opacity:${d.open || d.done ? 1 : 0.6};${d.sel ? 'outline:2px solid var(--team-a);' : ''}${d.done ? 'background:#ffffff14;' : ''}"${act('gdoor', i)} data-testid="evil-gym-door-${d.way}" data-open="${d.open}" data-done="${d.done}">
    <b>${esc(d.name)}</b>${sm(d.word, 'opacity:.75')}${sm(d.done ? 'Done' : d.open ? 'Open' : d.shutBy ?? '', d.open ? 'color:#7fd18f' : d.done ? 'font-weight:700' : 'color:#f08a7a')}${sm(d.why, 'opacity:.85;margin-top:2px')}</div>`).join('')}</div>`;
  const card = `<div style="margin-top:8px" data-testid="evil-gym-card">${m.card.map(([a, b]) => `<div class="row sm" style="line-height:17px"><span style="width:120px;flex:none;opacity:.8">${esc(a)}</span><span class="grow">${esc(b)}</span></div>`).join('')}</div>`;
  const leader = `<div style="margin-top:8px">${sm(m.leader.says, 'font-style:italic')}${m.leader.rule ? sm(`The Gym's rule: ${m.leader.rule}`, 'margin-top:2px') : ''}${m.leader.ruleNote ? sm(m.leader.ruleNote, 'opacity:.7') : ''}${m.leader.respects ? sm(m.leader.respects, 'margin-top:2px') : ''}${sm(`Standing: ${m.standing.word}. ${m.standing.moved}`, 'margin-top:2px')}</div>`;
  const can = !m.problem;
  const go = `<div class="row" style="gap:6px;margin-top:8px;align-items:center">${B('Do it', can, `padding:4px 14px;${can ? '' : 'opacity:.5'}`, '', `${act('gdo')} data-testid="evil-gym-do"`)}<span class="sm" style="opacity:.8" data-testid="evil-gym-problem">${esc(m.problem ?? m.hint)}</span></div>`;
  const said = notice ? `<div class="sm" style="line-height:16px;margin-top:6px" data-testid="evil-gym-said">${esc(notice)}</div>` : '';
  return W(`${head}<div style="position:absolute;left:10px;right:10px;top:40px;bottom:8px;overflow:auto">${doors}${go}${said}${card}${leader}</div>`, 'position:absolute;left:16px;right:16px;top:130px;bottom:70px;padding:8px 10px', '', ' data-testid="evil-gym"');
}
