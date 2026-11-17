// Evil Mode's Base page, in the New look (design Part 16, Part 17, Part 29). B opens it. With no base: the three sites
// on offer. With one: the grid (rooms, posts, pieces, the intruder's route, the failing square in red), the tabs Build ·
// Staff · Defend with what can be done at the chosen square, the fairness light and its sentence, the Night's base
// actions, WALK IT and the latch. Walk it draws the route as stops over the site's background; the Raid draws the Siege
// Map. Keys: Left/Right the square, Up/Down the option, T the tab, Enter does it, Esc closes.

import type { BaseModel, RaidModel } from '../../../core/evilMode/baseScreens';
import { BASE_TABS } from '../../../core/evilMode/baseScreens';
import { act, B, bg, esc, nodeDot, W } from '../kit';

const sm = (t: string, st = ''): string => `<div class="sm" style="line-height:16px;${st}">${esc(t)}</div>`;
const STATUS_C: Record<string, string> = { held: '#7fd18f', contested: '#e8c060', lost: '#f08a7a' };

function gridView(m: BaseModel, area: { w: number; h: number }): string {
  const g = m.grid!;
  const cs = Math.max(22, Math.min(92, Math.floor(area.w / g.w), Math.floor(area.h / g.h)));
  const small = cs < 56;
  const cells = g.cells.map((c) => {
    const fill = c.kind === 'door' ? '#ffffff10' : c.kind === 'office' ? 'var(--team-a)' : c.kind === 'common' ? '#ffffff22' : c.kind === 'room' ? (c.open ? '#3a5a7a' : '#4a4450') : '#ffffff08';
    const ring = c.bad ? 'box-shadow:inset 0 0 0 3px #f05a4a;' : c.sel ? 'box-shadow:inset 0 0 0 3px var(--acc);' : c.route ? 'box-shadow:inset 0 0 0 1px #ffffff55;' : '';
    const label = small ? esc(c.name.charAt(0)) : `<b style="font-size:12px">${esc(c.name)}</b>${c.sub ? `<div style="font-size:10px;opacity:.8">${esc(c.sub)}</div>` : ''}${c.piece ? `<div style="font-size:10px;color:#e8c060">${esc(c.piece)}</div>` : ''}${c.post ? `<div style="font-size:10px;color:#9fd0ff">${esc(c.post)}</div>` : ''}`;
    return `<div style="position:absolute;left:${c.x * cs + 2}px;top:${c.y * cs + 2}px;width:${cs - 4}px;height:${cs - 4}px;background:${fill};border:1px solid #ffffff30;overflow:hidden;cursor:pointer;padding:2px;line-height:13px;${ring}${c.piece && small ? 'outline:2px dashed #e8c060;outline-offset:-4px;' : ''}"${act('bsq', c.at)} data-testid="evil-base-sq" data-at="${esc(c.at)}" data-kind="${c.kind}" data-bad="${c.bad}">${label}</div>`;
  }).join('');
  const doors = g.doors.map((d) => {
    const w = d.across ? 8 : Math.min(30, cs * 0.5);
    const h = d.across ? Math.min(30, cs * 0.5) : 8;
    const col = d.bad ? '#f05a4a' : d.piece ? '#e8c060' : d.sel ? 'var(--acc)' : '#ffffff40';
    return `<div style="position:absolute;left:${(d.x + 0.5) * cs - w / 2}px;top:${(d.y + 0.5) * cs - h / 2}px;width:${w}px;height:${h}px;background:${col};cursor:pointer;z-index:2;border-radius:2px"${act('bsq', d.at)} title="${esc(d.piece ?? 'A door')}" data-testid="evil-base-door" data-at="${esc(d.at)}" data-bad="${d.bad}"></div>`;
  }).join('');
  return `<div style="position:relative;width:${g.w * cs}px;height:${g.h * cs}px;flex:none" data-testid="evil-base-grid">${cells}${doors}</div>`;
}

function siteView(m: BaseModel): string {
  return `<div style="display:grid;grid-template-columns:repeat(${Math.max(1, m.sites.length)},minmax(0,1fr));gap:8px">${m.sites.map((s) => `<div class="win" style="padding:8px 10px"><b>${esc(s.name)}</b>${sm(s.and, 'margin-top:4px')}${sm(`Already here: ${s.local}`, 'opacity:.75;margin-top:4px')}<div style="margin-top:8px">${B('Move in', true, 'padding:3px 12px;font-size:13px', '', `${act('bsite', s.id)} data-testid="evil-base-site-${s.id}"`)}</div></div>`).join('')}</div>`;
}

function warnView(m: BaseModel): string {
  if (!m.warn.length) return '';
  // Compact: each choice's button and what it is; its cost and what it gives on hover (the Card's words).
  return `<div class="win" style="padding:5px 8px;margin-bottom:6px;border:2px solid var(--team-b)" data-testid="evil-base-warn"><b class="sm">They know where you are. Tomorrow, maybe.</b><div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:3px">${m.warn.map((c) => `<div style="opacity:${c.waits ? 0.55 : 1}" title="${esc(`Costs: ${c.costs}. Gives: ${c.gives}.${c.waits ? ` ${c.waits}` : ''}`)}">${B(esc(c.name), !c.waits, 'padding:1px 8px;font-size:12px', '', `${act('bwarn', c.id)} data-testid="evil-base-warn-${c.id}"`)}${sm(c.waits ?? c.is, `font-size:11px;${c.waits ? 'color:#f08a7a' : ''}`)}</div>`).join('')}</div></div>`;
}

function panelView(m: BaseModel): string {
  const tabs = `<div class="row" style="gap:4px">${BASE_TABS.map((t, i) => `<span class="tg" style="cursor:pointer;${i === m.tab ? 'outline:2px solid var(--acc);' : ''}"${act('btab', i)} data-testid="evil-base-tab-${t.toLowerCase()}">${t}</span>`).join('')}<span class="sm" style="opacity:.6;margin-left:4px">(T)</span></div>`;
  const light = `<div class="row sm" style="gap:6px;margin-top:6px;align-items:center" data-testid="evil-base-fair" data-ok="${m.fair.ok}"><span style="width:12px;height:12px;border-radius:50%;background:${m.fair.ok ? '#7fd18f' : '#f05a4a'};flex:none"></span><span>${esc(m.fair.ok ? 'Fair: the kid can get to the Office.' : m.fair.problem ?? '')}</span></div>`;
  const opts = m.options.length ? m.options.map((o, i) => `<div style="padding:3px 6px;cursor:pointer;${i === m.opt ? 'background:#ffffff18;outline:1px solid var(--acc);' : ''}${o.problem ? 'opacity:.7;' : ''}"${act('bopt', i)} data-testid="evil-base-opt"><b style="font-size:13px">${esc(o.label)}</b>${sm(o.sub, 'font-size:11px;opacity:.85')}${o.problem ? sm(o.problem, 'font-size:11px;color:#f08a7a') : ''}</div>`).join('') : sm('Pick a square, or a door between two squares.', 'opacity:.7;margin-top:6px');
  const chosen = m.options[m.opt];
  const go = `<div class="row" style="gap:6px;margin-top:6px;align-items:center">${B('Do it', !!chosen && !chosen.problem, 'padding:3px 12px;font-size:13px', '', `${act('bdo')} data-testid="evil-base-do"`)}<span class="sm" style="opacity:.75" data-testid="evil-base-problem">${esc(chosen?.problem ?? m.hint)}</span></div>`;
  const pairs = m.pairs.length ? `<div style="margin-top:4px">${m.pairs.map((p) => sm(`Next door: ${p}`, 'font-size:11px;opacity:.85')).join('')}</div>` : '';
  return `${tabs}${light}<div style="margin-top:6px;max-height:300px;overflow:auto" data-testid="evil-base-opts">${opts}</div>${go}${pairs}`;
}

function nightBar(m: BaseModel): string {
  const night = m.night.map((n, i) => B(esc(n.label), !n.problem, `padding:2px 10px;font-size:12px;${n.problem ? 'opacity:.55' : ''}`, '', `${act('bnight', i)} title="${esc(n.problem ?? '')}" data-testid="evil-base-night-${i}"`)).join('');
  const walk = B('WALK IT', !m.walkIt.problem, `padding:2px 12px;font-size:12px;${m.walkIt.problem ? 'opacity:.55' : ''}`, '', `${act('bwalk')} title="${esc(m.walkIt.problem ?? '')}" data-testid="evil-base-walkit"`);
  const latch = m.latch === null ? '' : `<span class="tg" style="cursor:pointer"${act('blatch')} data-testid="evil-base-latch" title="The Pen's latch. Off, a Pokémon may walk home in the night.">Latch: ${m.latch ? 'on' : 'off'}</span>`;
  return `<div class="row" style="gap:6px;flex-wrap:wrap;align-items:center;margin-top:6px">${night}${walk}${latch}</div>`;
}

function walkView(m: BaseModel): string {
  const w = m.walk!;
  const step = Math.min(64, Math.floor(1100 / Math.max(2, w.route.length)));
  const dots = w.route.map((r, i) => nodeDot(r.kind, 30 + i * step, 30, i === w.at, i > w.at)).join('');
  const lines = w.lines.slice(-8).map((l) => sm(l, 'margin-top:2px')).join('');
  const btn = w.end ? B('Put it away', true, 'padding:3px 14px', '', `${act('wclose')} data-testid="evil-walk-close"`) : w.fight ? B('Fight', true, 'padding:3px 14px', '', `${act('wfight')} data-testid="evil-walk-fight"`) : '';
  return `<div style="position:relative;height:64px;flex:none;margin-top:6px" data-testid="evil-walk-route">${dots}</div><div class="win" style="padding:6px 10px;margin-top:6px" data-testid="evil-walk-lines">${lines}</div><div class="row" style="gap:6px;margin-top:6px;align-items:center">${btn}<span class="sm" style="opacity:.75">${esc(m.hint)}</span></div>`;
}

function raidView(r: RaidModel, hint: string): string {
  const wings = `<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px">${r.wings.map((w) => `<div class="win" style="padding:6px 8px;border-top:4px solid ${STATUS_C[w.status]}" data-testid="evil-raid-wing-${w.id}" data-status="${w.status}"><b style="font-size:13px">${esc(w.name)}</b>${sm(`${w.status[0]!.toUpperCase()}${w.status.slice(1)}${w.status === 'lost' ? '' : w.left ? ` · ${w.left} turn${w.left > 1 ? 's' : ''} left` : ''}`, `color:${STATUS_C[w.status]}`)}${sm(w.people.join(', ') || 'Nobody', 'font-size:11px;opacity:.85')}${r.state === 'turns' && w.status !== 'lost' ? `<div class="row" style="gap:3px;flex-wrap:wrap;margin-top:4px">${r.orders.map((o) => `<span class="tg" style="cursor:pointer;font-size:11px;${w.order === o.id ? 'outline:2px solid var(--acc);' : ''}"${act('rorder', `${w.id}:${o.id}`)} data-testid="evil-raid-order-${w.id}-${o.id}">${esc(o.name)}</span>`).join('')}</div>` : ''}</div>`).join('')}</div>`;
  const queue = r.queue.length && (r.state === 'turns' || r.state === 'door') ? `<div style="margin-top:6px" data-testid="evil-raid-queue">${sm('The back way, in order (three a turn; the young first):', 'opacity:.8')}${r.queue.map((q, i) => `<div class="row sm" style="gap:6px;line-height:18px"><span>${i + 1}. ${esc(q.name)}${q.minor ? ' (young)' : ''}</span>${i ? `<span class="tg" style="cursor:pointer;font-size:11px"${act('rup', q.id)}>Up</span>` : ''}</div>`).join('')}</div>` : '';
  const log = `<div class="win" style="padding:6px 10px;margin-top:6px;max-height:120px;overflow:auto" data-testid="evil-raid-log">${r.log.slice(-6).map((l) => sm(l)).join('')}</div>`;
  let ctl = '';
  if (r.state === 'door') ctl = `${B('Open the door', true, 'padding:3px 12px', '', `${act('rdoor', 1)} data-testid="evil-raid-open"`)}${B("Don't", true, 'padding:3px 12px', '', `${act('rdoor', 0)} data-testid="evil-raid-force"`)}`;
  else if (r.state === 'turns') ctl = B('Play the turn', true, 'padding:3px 12px', '', `${act('rturn')} data-testid="evil-raid-turn"`);
  else if (r.state === 'office' && r.fight) ctl = B('Fight', true, 'padding:3px 12px', '', `${act('wfight')} data-testid="evil-raid-fight"`);
  else if (r.state === 'office') ctl = r.choices.map((c) => B(esc(c.name), !c.problem, `padding:3px 12px;${c.problem ? 'opacity:.55' : ''}`, '', `${act('roffice', c.id)} title="${esc(c.problem ?? '')}" data-testid="evil-raid-office-${c.id}"`)).join('');
  else ctl = B('The morning after', true, 'padding:3px 12px', '', `${act('rdone')} data-testid="evil-raid-done"`);
  const speech = r.speech.length ? `<div class="win" style="padding:6px 10px;margin-top:6px" data-testid="evil-raid-speech"><b>${esc(r.detective)}</b>${r.speech.map((l) => sm(l, 'font-style:italic;margin-top:2px')).join('')}</div>` : '';
  const after = r.after.length ? `<div class="win" style="padding:6px 10px;margin-top:6px" data-testid="evil-raid-after">${r.after.map((l) => sm(l)).join('')}</div>` : '';
  return `${wings}<div class="row" style="gap:6px;margin-top:6px;align-items:center;flex-wrap:wrap">${ctl}<span class="sm" style="opacity:.75">${esc(hint)}</span></div>${speech}${after}${log}${queue}`;
}

/** `bgFile`: the site's background, resolved by the scene from the manifest (null while it's missing: no picture, no crash). */
export function baseView(m: BaseModel, notice: string | null = null, bgFile: string | null = null): string {
  const head = `<div class="row" style="gap:6px;margin-bottom:6px;align-items:center"><b data-testid="evil-base-title">${esc(m.title)}</b><span class="tg" data-testid="evil-base-mode">${esc(m.mode)}</span><div class="grow"></div>${m.mode === 'raid' || m.mode === 'walk' ? '' : B('Close', false, 'padding:2px 10px;font-size:13px', '', `${act('base')} data-testid="evil-base-close"`)}</div>`;
  const said = notice ? `<div class="sm" style="line-height:16px;margin:4px 0" data-testid="evil-base-said">${esc(notice)}</div>` : '';
  let body = '';
  if (m.mode === 'none') body = sm(m.hint);
  else if (m.mode === 'site') body = `${warnView(m)}${sm(m.hint, 'margin-bottom:6px')}${siteView(m)}${said}`;
  else if (m.mode === 'walk') body = `${walkView(m)}${said}`;
  else if (m.mode === 'raid') body = `${raidView(m.raid!, m.hint)}${said}`;
  else body = `${warnView(m)}<div class="row" style="gap:12px;align-items:flex-start"><div style="flex:1 1 60%;min-width:0;overflow:auto">${gridView(m, { w: 640, h: 270 })}${nightBar(m)}</div><div style="flex:1 1 40%;min-width:220px">${panelView(m)}${said}</div></div>`;
  const back = bgFile && m.mode !== 'site' ? bg(bgFile, 'opacity:.25;position:absolute;inset:0;background-size:cover;pointer-events:none') : '';
  return W(`${back}${head}<div style="position:absolute;left:10px;right:10px;top:40px;bottom:8px;overflow:auto">${body}</div>`, 'position:absolute;left:16px;right:16px;top:130px;bottom:70px;padding:8px 10px;overflow:hidden', '', ' data-testid="evil-base"');
}
