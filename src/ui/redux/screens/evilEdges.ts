// Evil Mode slice 21: the Edges page, in the New look (design Part 29 sections 6 and 16). Left: what's off, the Tear, the
// Beast in the building, the Corruption figure (only with the Shadow branch in). Right: the rows, and the chosen row's
// Honest Card: a Tear's Card reads "We don't know." in the same type as everything else, and CONFIRM's still there.
// U opens; Up/Down picks a row; Enter confirms; Esc closes. Taps: press a row, then CONFIRM.

import type { EdgesModel } from '../../../core/evilMode/edgesScreens';
import { act, B, esc, W } from '../kit';

const sm = (t: string, st = ''): string => `<div class="sm" style="line-height:16px;${st}">${esc(t)}</div>`;

export function edgesView(m: EdgesModel, notice: string | null = null): string {
  const head = `<div class="row" style="gap:6px;margin-bottom:6px;align-items:center"><b data-testid="evil-edge-title">${esc(m.title)}</b><div class="grow"></div>${B('Close', false, 'padding:2px 10px;font-size:13px', '', `${act('edges')} data-testid="evil-edge-close"`)}</div>`;
  const card = m.card ? `<div data-testid="evil-edge-card" style="margin-top:8px;padding:6px;border:2px solid currentColor">${m.card.map((f, i) => `<div class="sm" data-testid="evil-edge-field-${i + 1}" style="line-height:15px;margin-bottom:2px"><b>${i + 1}. ${esc(f.label)}.</b> ${esc(f.text)}</div>`).join('')}</div>` : '';
  const left = `<div style="min-width:0"><div data-testid="evil-edge-lines">${m.lines.map((l) => sm(l, 'margin-bottom:4px')).join('')}</div>${card}</div>`;
  const rows = m.rows.map((r, i) => `<div class="row sm" style="line-height:18px;padding:2px 4px;cursor:pointer;gap:6px;opacity:${r.why ? 0.55 : 1};${r.sel ? 'outline:2px solid var(--team-a);' : ''}"${act('erow', i)} data-testid="${esc(r.testid)}" data-open="${!r.why}"><span style="flex:1 1 50%;min-width:0"><b>${esc(r.label)}</b><br>${esc(r.sub)}</span>${r.why ? `<span style="flex:0 1 40%;min-width:0;text-align:right;font-size:12px;line-height:15px">${esc(r.why)}</span>` : ''}</div>`).join('');
  const sel = m.rows.find((r) => r.sel);
  const confirm = sel ? `<div style="margin-top:6px">${B('CONFIRM', true, `padding:3px 14px;opacity:${sel.why ? 0.4 : 1}`, '', `${act('edo')} data-testid="evil-edge-confirm"`)}</div>` : '';
  const note = sm(notice ?? m.hint, 'margin-top:6px;opacity:.75');
  const right = `<div style="min-width:0">${confirm}<div data-testid="evil-edge-said">${note}</div>${rows}</div>`;
  return W(`${head}<div style="position:absolute;left:10px;right:10px;top:40px;bottom:8px;overflow:auto"><div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:12px">${left}${right}</div></div>`, 'position:absolute;left:16px;right:16px;top:130px;bottom:70px;padding:8px 10px', '', ' data-testid="evil-edge"');
}
