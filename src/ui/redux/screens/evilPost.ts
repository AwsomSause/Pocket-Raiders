// Evil Mode slice 18 in the New look: the post page (P) and a bark's bubble (design Part 25a, Part 25b, Part 29). Plain
// data in from core/evilMode/voiceScreens.ts. Every button is a tap target with a key path (P opens the page; Up/Down
// pick; Enter does it; Esc closes).

import type { PostModel } from '../../../core/evilMode/voiceScreens';
import { act, B, esc, W } from '../kit';

const sm = (t: string, st = ''): string => `<div class="sm" style="line-height:17px;${st}">${esc(t)}</div>`;
const LETTER = "font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:19px";

export function postView(m: PostModel, sel: number, notice: string | null): string {
  const head = `<div class="row" style="gap:8px;align-items:center;margin-bottom:6px"><b data-testid="evil-post-title">${esc(m.title)}</b><div class="grow"></div>${B('Close', false, 'padding:2px 10px;font-size:13px', '', `${act('post')} data-testid="evil-post-close"`)}</div>`;
  const t = m.today;
  const today = t
    ? `<div style="margin-bottom:8px" data-testid="evil-post-today" data-opened="${t.opened}"><b class="sm">${esc(t.from)}</b>${t.steamed ? sm('Steamed open, and stuck down again badly.', 'opacity:.7;font-style:italic') : ''}${t.text !== null ? `<div style="${LETTER};margin:4px 0;padding:6px 8px;background:#fff1;border-left:3px solid var(--team-a)" data-testid="evil-post-text">${esc(t.text || '(Nothing inside.)')}</div>` : ''}${t.answered ? sm(`Answered: ${t.answered}`, 'opacity:.75') : ''}${t.pinned ? sm('On the Wall.', 'opacity:.75') : ''}</div>`
    : sm(m.empty, 'opacity:.6;margin-bottom:8px');
  const acts = m.acts.map((a, i) => `<div style="margin-top:3px">${B(esc(a.label), i === sel, 'padding:3px 10px;font-size:13px;text-align:left;width:100%;box-sizing:border-box', '', `${act('pact', a.code)} data-testid="evil-post-act" data-code="${esc(a.code)}"`)}</div>`).join('');
  const side = (title: string, line: string | null, id: string) => (line ? `<div style="margin-top:8px" data-testid="${id}"><b class="sm">${esc(title)}</b>${sm(line)}</div>` : '');
  const drawer = m.drawer.length ? `<div style="margin-top:8px" data-testid="evil-post-drawer"><b class="sm">The drawer</b>${m.drawer.map((d) => sm(`Day ${d.day}, ${d.from}${d.pinned ? ' (on the Wall)' : ''}: ${d.text}`, 'margin-top:3px')).join('')}</div>` : '';
  const note = notice ? sm(notice, 'margin-top:6px;font-weight:700') : '';
  return W(`${head}<div style="position:absolute;left:10px;right:10px;top:40px;bottom:8px;overflow:auto" data-testid="evil-post-body">${today}${note}${acts}${side('The Radio', m.radio, 'evil-post-radio')}${side('The paper', m.paper, 'evil-post-paper')}${side('The Ledger', m.margin, 'evil-post-margin')}${drawer}</div>`, 'position:absolute;left:16px;right:16px;top:130px;bottom:70px;padding:8px 10px', '', ' data-testid="evil-postpage"');
}

/** A bark: one line in a small bubble over the board's text. It needs no input and blocks nothing. */
export function barkView(b: { name: string; line: string } | null): string {
  if (!b) return '';
  return `<div class="abs sm" style="right:26px;bottom:80px;max-width:430px;padding:4px 10px;border-radius:12px;background:#fff;color:#141414;box-shadow:0 0 0 2px #141414;pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" data-testid="evil-bark"><b>${esc(b.name)}:</b> ${esc(b.line)}</div>`;
}
