// Evil Mode's File, in the New look (design Part 18 section 11): the Report, the Notebook and the Dossier, as tabs in the
// day's frame. Plain data in from core/evilMode/heroScreens.ts. Every tab is a tap target with a key path (F opens;
// Left/Right tabs; Esc closes). Blank lines are drawn as blank lines: the File's never padded.

import type { FileModel } from '../../../core/evilMode/heroScreens';
import { act, B, esc, mini, W } from '../kit';

const sm = (t: string, st = ''): string => `<div class="sm" style="line-height:16px;${st}">${esc(t)}</div>`;

export function fileView(m: FileModel): string {
  const tabs = `<div class="row" style="gap:4px;margin-bottom:6px">${m.tabs.map((t, i) => B(esc(t.name), t.sel, 'padding:2px 10px;font-size:13px', '', `${act('ftab', i)} data-testid="evil-file-tab-${i}"`)).join('')}<div class="grow"></div>${B('Close', false, 'padding:2px 10px;font-size:13px', '', `${act('file')} data-testid="evil-file-close"`)}</div>`;
  const pic = `<div style="width:56px;height:56px;flex:none;border:2px solid #8886;border-radius:4px;overflow:hidden;background:#0002">${mini(`trainer/${m.look.replace(/^trainer\./, '')}`, 56)}</div>`;
  const head = `<div class="row" style="gap:10px;align-items:center;margin-bottom:6px">${pic}<div><b data-testid="evil-file-name">${esc(m.name)}</b>${sm('THE FILE', 'opacity:.6;letter-spacing:2px')}</div></div>`;
  const rows = m.rows.map((r) => `<div class="row sm" style="line-height:18px;align-items:flex-start;padding:2px 0;border-bottom:1px solid #8883" data-testid="evil-file-row" data-blank="${r.blank}"><span style="width:96px;flex:none;opacity:.75">${esc(r.label)}</span><span class="grow" style="${r.blank ? 'opacity:.55;font-style:italic' : ''}">${esc(r.text)}${r.mark ? ` <b style="border:1px solid currentColor;padding:0 4px;margin-left:4px" data-testid="evil-file-kind">${esc(r.mark)}</b>` : ''}</span></div>`).join('');
  const slots = m.slots ? `<b class="sm">The team</b><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin:3px 0 6px">${m.slots.map((s) => `<div class="win" style="padding:3px 6px;min-height:34px" data-testid="evil-file-slot" data-known="${!!s.species}"><b class="sm">${esc(s.name)}</b>${s.line ? sm(s.line, 'opacity:.75;font-size:11px') : ''}</div>`).join('')}</div>` : '';
  const marks = m.marks ? `<div class="row sm" style="gap:8px;line-height:18px"><b style="width:60px">Marks</b><span data-testid="evil-file-marks" data-n="${m.marks.filled}">${'●'.repeat(m.marks.filled)}${'○'.repeat(Math.max(0, m.marks.max - m.marks.filled))}</span><i style="opacity:.75">${esc(m.marks.word)}</i></div>` : '';
  const badges = m.badges ? `<div class="row sm" style="gap:8px;line-height:18px"><b style="width:60px">Badges</b><span data-testid="evil-file-badges">${m.badges.map((b) => (b.how === 'full' ? '●' : b.how === 'half' ? '◐' : '○')).join(' ')}</span></div>` : '';
  const lists = m.lists.map((l) => `<div style="margin-top:6px"><b class="sm">${esc(l.title)}</b>${l.lines.length ? l.lines.map((x) => sm(x)).join('') : sm(l.empty, 'opacity:.55;font-style:italic')}</div>`).join('');
  return W(`${tabs}<div style="position:absolute;left:10px;right:10px;top:40px;bottom:8px;overflow:auto" data-testid="evil-file-body">${head}${rows}${slots}${marks}${badges}${lists}</div>`, 'position:absolute;left:16px;right:16px;top:130px;bottom:70px;padding:8px 10px', '', ' data-testid="evil-file"');
}
