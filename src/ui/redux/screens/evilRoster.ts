// Evil Mode's Roster, the Office and the yard, in the New look (design Part 29 sections 7, 8 and 21, Part 7 section 11).
// Plain data in from core/evilMode/rosterScreens.ts; EvilScene keeps the cursor. Every button is a tap target (data-act)
// with a key path. Faces are townsfolk and trainer-class pictures with an armband in the team's first colour.

import type { RefusalModel, RosterModel } from '../../../core/evilMode/rosterScreens';
import { act, B, esc, mini, W } from '../kit';

const sm = (t: string, st = ''): string => `<div class="sm" style="line-height:16px;${st}">${esc(t)}</div>`;

/** A sprite asset id ("trainer.pr/clerk_f") as the kit's file ("trainer/pr/clerk_f"). Missing art draws nothing. */
const fileOf = (id: string | null): string | null => (id ? `trainer/${id.replace(/^trainer\./, '')}` : null);

/** The face: the picture, an armband in the team's first colour, and the band's mark (never a number). Minors: the plain second border. */
export function face(id: string | null, band: string | null, size = 44, minor = false): string {
  const f = fileOf(id);
  return `<div style="position:relative;width:${size}px;height:${size}px;flex:none;border:2px solid ${minor ? 'var(--team-b)' : '#8886'};border-radius:4px;overflow:hidden;background:#0002">${f ? mini(f, size) : ''}
    <i style="position:absolute;left:0;right:0;top:${Math.round(size * 0.52)}px;height:${Math.max(3, Math.round(size / 9))}px;background:var(--team-a);opacity:.9" data-armband="1"></i>
    ${band ? `<span class="sm" style="position:absolute;right:1px;bottom:0;font-size:9px;background:#000a;color:#fff;padding:0 2px">${esc(band)}</span>` : ''}</div>`;
}

const acts = (list: { id: string; name: string; on: boolean; why: string | null; sel: boolean }[], row: number): string =>
  `<div class="row" style="gap:4px;flex-wrap:wrap;margin:3px 0">${list.map((a, j) => B(esc(a.name), a.sel, `padding:1px 8px;font-size:12px;opacity:${a.on ? 1 : 0.4}`, '', `${act('ract', `${row}:${j}`)} data-testid="evil-ract-${a.id}" title="${esc(a.why ?? '')}"`)).join('')}</div>`;

export function rosterView(m: RosterModel): string {
  const tabs = `<div class="row" style="gap:4px;margin-bottom:6px">${m.tabs.map((t, i) => B(esc(t.name), t.sel, 'padding:2px 10px;font-size:13px', '', `${act('rtab', i)} data-testid="evil-roster-tab-${i}"`)).join('')}<div class="grow"></div>${B('Close', false, 'padding:2px 10px;font-size:13px', '', `${act('roster')} data-testid="evil-roster-close"`)}</div>`;
  const top = `<div style="margin-bottom:6px" data-testid="evil-roster-wont"><b class="sm">${esc(m.wont.title)}</b>${m.wont.lines.map((l) => sm(l)).join('')}${m.missing.map((l) => sm(l, 'opacity:.7;font-style:italic')).join('')}</div>`;
  let body = '';
  if (m.people) {
    body = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:6px">${m.people.map((p, i) => `<div style="padding:4px 6px;border:1px solid #8886;border-top:3px solid var(--team-a);cursor:pointer;opacity:${p.left ? 0.5 : 1};${p.sel ? 'outline:2px solid var(--team-b);' : ''}"${act('rrow', i)} data-testid="evil-person" data-id="${esc(p.id)}" data-left="${!!p.left}">
      <div class="row" style="gap:6px;align-items:flex-start">${face(p.face, null, 44, p.minor)}<div class="grow">
        <b class="sm" data-testid="evil-person-name">${esc(p.name)}</b>${sm(`${p.rank} · ${p.talent} · ${p.flaw} · ${p.wage}`)}
        <div class="sm" style="line-height:16px" data-testid="evil-person-band">${esc(`${p.band.name} · ${p.band.face}`)}</div></div></div>
      ${sm(`Line: ${p.line}`, 'font-style:italic')}${sm(p.why, 'opacity:.75')}${p.left ? sm(p.left, 'color:#f08a7a') : ''}${p.acts ? acts(p.acts, i) : ''}</div>`).join('')}</div>`;
  } else if (m.applicants) {
    body = m.empty ? sm(m.empty, 'margin-top:12px') : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:6px">${m.applicants.map((a, i) => `<div style="padding:4px 6px;border:1px solid #8886;cursor:pointer;${a.sel ? 'outline:2px solid var(--team-b);' : ''}"${act('rrow', i)} data-testid="evil-applicant" data-ref="${esc(a.ref)}">
      <div class="row" style="gap:6px;align-items:flex-start">${face(a.face, null, 44, a.minor)}<div class="grow"><b class="sm">${esc(a.name)}</b>${sm(`${a.talent} · ${a.flaw}`)}${sm(a.waits, 'opacity:.7')}</div></div>
      ${sm(a.why, 'opacity:.85')}${a.answer ? sm(a.answer, 'font-style:italic') : ''}${a.acts ? acts(a.acts, i) : ''}</div>`).join('')}</div>`;
  }
  return W(`${tabs}<div style="position:absolute;left:10px;right:10px;top:40px;bottom:8px;overflow:auto" data-testid="evil-roster-body">${top}${body}${sm('Press a card for what can be done. Esc closes.', 'margin-top:6px;opacity:.6')}</div>`, 'position:absolute;left:16px;right:16px;top:130px;bottom:70px;padding:8px 10px', '', ' data-testid="evil-roster"');
}

/** The Office (Part 9 section 5.1): they say one thing about the work; the Boss answers from two. */
export function officeView(o: NonNullable<RosterModel['office']>): string {
  return `<div style="position:absolute;inset:0;background:#141414cc" data-testid="evil-office">${W(`${sm(o.title, 'opacity:.7')}<div class="row" style="gap:10px;align-items:center;margin:8px 0">${face(o.face, null, 64)}<div><b>${esc(o.name)}</b>${sm(`"${o.says}"`, 'font-style:italic;margin-top:4px')}</div></div>
    <div class="row" style="gap:6px">${o.answers.map((a, i) => B(`"${esc(a)}"`, i === 0, 'padding:3px 12px', '', `${act('oanswer', i)} data-testid="evil-office-${i}"`)).join('')}${B('Not now', false, 'padding:3px 12px', '', `${act('ocancel')} data-testid="evil-office-cancel"`)}</div>`, 'position:absolute;left:160px;right:160px;top:150px;padding:14px 16px')}</div>`;
}

/** The yard (Part 7 section 11.1): the refusal, before the job, whether or not the Boss is going in person. */
export function refusalView(m: RefusalModel, sel: number): string {
  const who = m.people.map((p) => `<div class="row" style="gap:10px;align-items:center;margin:6px 0">${face(p.face, null, 56)}<div><b>${esc(p.name)}</b>${sm(`"${p.line}"`, 'opacity:.75')}${sm(`"${p.says}"`, 'font-style:italic;margin-top:3px')}</div></div>`).join('');
  return `<div style="position:absolute;inset:0;background:#141414cc" data-testid="evil-refusal">${W(`${sm(m.title, 'opacity:.7')}${who}
    <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px">${m.answers.map((a, i) => B(esc(a.name), i === sel, `padding:3px 12px;opacity:${a.on ? 1 : 0.4}`, '', `${act('refuse', a.id)} data-testid="evil-refuse-${a.id}" title="${esc(a.why ?? '')}"`)).join('')}</div>`, 'position:absolute;left:120px;right:120px;top:140px;padding:14px 16px')}</div>`;
}
