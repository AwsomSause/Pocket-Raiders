// Evil Mode's neighbour page, in the New look (design Part 15a; Part 29): the neighbour's Boss, the stance and what it
// means, the count, the five ticks, their messages, and a Sit-Down when one's going on. K opens; Up/Down picks a row;
// Enter does it; Esc closes (not during a Sit-Down: get up first). Taps: press a row.

import type { NeighbourModel } from '../../../core/evilMode/neighbourScreens';
import { act, B, esc, W } from '../kit';

const sm = (t: string, st = ''): string => `<div class="sm" style="line-height:16px;${st}">${esc(t)}</div>`;

export function neighbourView(m: NeighbourModel, notice: string | null = null): string {
  const head = `<div class="row" style="gap:6px;margin-bottom:6px;align-items:center;flex-wrap:wrap"><b data-testid="evil-nb-title" style="border-left:6px solid ${esc(m.colour)};padding-left:6px">${esc(m.title)}</b><span class="tg" data-testid="evil-nb-stance" title="${esc(m.stance.means)}">${esc(m.stance.word)}</span><span class="tg">${esc(m.stance.summary)}</span><div class="grow"></div>${m.sitting ? '' : B('Close', false, 'padding:2px 10px;font-size:13px', '', `${act('nb')} data-testid="evil-nb-close"`)}</div>`;
  const left = `<div style="min-width:0">${sm(m.stance.means)}${sm(m.stance.board, 'opacity:.75')}${m.facts.map((f, i) => sm(f, i === 0 ? 'margin-top:4px;font-weight:700' : '')).join('')}
    <div style="margin-top:6px" data-testid="evil-nb-ticks">${m.ticks.map((t) => `<div class="row sm" style="line-height:16px;gap:6px" title="${esc(t.text)}"><span class="grow">${esc(t.name)} · ${esc(t.when)}</span><span style="opacity:.8">${esc(t.state)}</span></div>`).join('')}</div></div>`;
  const said = m.sitting
    ? `<div data-testid="evil-nb-sitting">${m.sitting.map((l) => sm(l, 'margin-bottom:2px')).join('')}</div>`
    : `<div data-testid="evil-nb-posts">${m.posts.length ? m.posts.map((p) => sm(`Day ${p.day}. ${p.text}${p.answered ? ` (${p.answered}.)` : ''}`, 'margin-bottom:3px')).join('') : sm('No messages yet.', 'opacity:.7')}</div>`;
  const rows = `<div style="margin-top:6px">${m.rows.map((r, i) => `<div class="row sm" style="line-height:20px;padding:0 4px;cursor:pointer;gap:6px;opacity:${r.open ? 1 : 0.55};${r.sel ? 'outline:2px solid var(--team-a);' : ''}"${act('nrow', i)} data-testid="${esc(r.testid)}" data-open="${r.open}"><span class="grow">${esc(r.label)}</span>${r.why ? `<span style="opacity:.8">${esc(r.why)}</span>` : ''}</div>`).join('')}</div>`;
  const note = notice ? sm(notice, 'margin-top:6px') : sm(m.hint, 'margin-top:6px;opacity:.7');
  const right = `<div style="min-width:0">${said}${rows}<div data-testid="evil-nb-said">${note}</div></div>`;
  const body = `<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:12px">${left}${right}</div>`;
  return W(`${head}<div style="position:absolute;left:10px;right:10px;top:40px;bottom:8px;overflow:auto">${body}</div>`, 'position:absolute;left:16px;right:16px;top:130px;bottom:70px;padding:8px 10px', '', ' data-testid="evil-nb"');
}
