// Evil Mode's Office at Night, in the New look (design Part 29 sections 11.1-11.3): the door, the desk, the Wall.
// Plain data in from core/evilMode/nightScreens.ts; EvilScene keeps the cursor. Every row is a tap target (data-act) with
// a key path. The person stands in the doorway with their picture; a mood is a word, never a number.

import type { NightModel, NightRow } from '../../../core/evilMode/nightScreens';
import { act, B, esc, W } from '../kit';
import { face } from './evilRoster';

const sm = (t: string, st = ''): string => `<div class="sm" style="line-height:16px;${st}">${esc(t)}</div>`;
const rowBtn = (r: NightRow, sel: boolean, name: string, i: number, tid: string): string =>
  B(esc(r.name), sel, `padding:3px 12px;text-align:left;opacity:${r.on ? 1 : 0.4}`, '', `${act(name, i)} data-testid="${tid}" data-on="${r.on}" title="${esc(r.why ?? '')}"`);

export function nightView(m: NightModel, notice: string | null = null): string {
  let door = '';
  if (m.door) {
    door = `<div data-testid="evil-door"><div class="row" style="gap:10px;align-items:center;margin:4px 0 8px">${face(m.door.face, null, 64)}<div><b data-testid="evil-door-who">${esc(m.door.who)}</b>${sm(m.door.title, 'opacity:.6')}${sm(m.door.says, 'font-style:italic;margin-top:4px')}</div></div>
      <div style="display:flex;flex-direction:column;gap:4px">${m.door.answers.map((a, i) => rowBtn(a, m.row === i, 'nanswer', i, `evil-answer-${i}`)).join('')}</div></div>`;
  } else if (m.reply) {
    door = `<div data-testid="evil-reply"><div class="row" style="gap:10px;align-items:center;margin:4px 0 8px">${face(m.reply.face, null, 64)}<div><b>${esc(m.reply.who)}</b>${sm(`“${m.reply.line}”`, 'font-style:italic;margin-top:4px')}</div></div>
      ${m.reply.step === 1 ? sm(m.reply.moved, 'margin:6px 0;color:var(--team-b)') : ''}${B(m.reply.step === 0 ? 'Go on' : 'They go', true, 'padding:3px 12px', '', `${act('nreply')} data-testid="evil-reply-next"`)}</div>`;
  } else if (m.quiet) door = sm(m.quiet, 'opacity:.7;margin:6px 0');
  const busy = !!m.door || !!m.reply;
  let side = '';
  if (m.hear) side = `<b class="sm">Hear someone out</b><div style="display:flex;flex-direction:column;gap:4px;margin-top:4px">${m.hear.map((p, i) => `<div class="row" style="gap:6px;align-items:center;cursor:pointer;padding:2px 4px;${m.row === i ? 'outline:2px solid var(--team-b);' : ''}"${act('nhear', i)} data-testid="evil-hear-person" data-id="${esc(p.id)}">${face(p.face, null, 32)}<span class="sm grow">${esc(p.name)}</span><span class="sm" style="opacity:.7">${esc(p.mood)}</span></div>`).join('')}</div>${sm('Esc: back to the desk.', 'opacity:.6;margin-top:6px')}`;
  else if (m.wall) side = `<div class="row" style="gap:8px;align-items:baseline"><b class="sm">${esc(m.wall.title)}</b><span class="sm" style="opacity:.7" data-testid="evil-wall-state">${esc(m.wall.state)}</span></div>${m.wall.empty ? sm(m.wall.empty, 'opacity:.7;margin-top:6px') : ''}
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;margin-top:6px;background:#a07a4a33;padding:6px">${m.wall.items.map((w, i) => w.down
      ? `<div style="min-height:52px;border:1px dashed #fff3;background:#ffffff0d" data-testid="evil-wall-gap"${act('nwall', i)}></div>`
      : `<div style="min-height:52px;padding:4px;background:#f3ead8;color:#2a2418;cursor:pointer;box-shadow:2px 2px 0 #0004;${w.sel ? 'outline:2px solid var(--team-b);' : ''}"${act('nwall', i)} data-testid="evil-wall-item" data-desk="${w.desk}">${sm(w.what)}${sm(`Day ${w.day}. ${w.from}`, 'opacity:.6;font-size:10px')}${w.confirm ? `<div class="row" style="gap:4px;margin-top:3px">${B('Take it down', true, 'padding:1px 8px;font-size:11px', '', `${act('ndown', i)} data-testid="evil-wall-down"`)}${B('Leave it', false, 'padding:1px 8px;font-size:11px', '', `${act('nkeep')}`)}</div>` : ''}</div>`).join('')}</div>${sm('Press a thing to take it down. Esc: back to the desk.', 'opacity:.6;margin-top:6px')}`;
  else side = `<b class="sm">The desk</b><div style="display:flex;flex-direction:column;gap:4px;margin-top:4px">${m.desk.map((r, i) => rowBtn(r, !busy && m.row === i, 'ndesk', i, `evil-desk-${r.id}`)).join('')}</div>`;
  if (notice) side += `<div class="sm" style="margin-top:8px;line-height:16px;font-style:italic" data-testid="evil-night-said">${esc(notice)}</div>`;
  return W(`<div class="row" style="gap:8px;align-items:baseline;margin-bottom:6px"><b data-testid="evil-office-title">${esc(m.title)}</b><span class="sm" style="opacity:.6">A desk, a lamp, a window, the Wall, a door.</span></div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;position:absolute;left:10px;right:10px;top:36px;bottom:8px;overflow:auto">
      <div style="flex:1 1 300px;min-width:260px">${door}</div><div style="flex:1 1 260px;min-width:220px">${side}</div></div>`,
    'position:absolute;left:16px;right:16px;top:130px;bottom:70px;padding:8px 10px', '', ' data-testid="evil-night"');
}
