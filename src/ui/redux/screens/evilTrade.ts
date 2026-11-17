// Evil Mode's Trade page, in the New look (slice 11; design Part 12 sections 1 and 2, Part 13 sections 1 and 2): four tabs
// (Rackets, Fronts, Works, Running), the rows of the chosen tab, and the chosen row's Honest Card with its buttons under
// field 13. T opens; Up/Down picks a row; Left/Right the tab; P the street or holding; Enter the first button; Esc closes.

import type { TradeModel } from '../../../core/evilMode/tradeScreens';
import { act, B, esc, W } from '../kit';

const sm = (t: string, st = ''): string => `<div class="sm" style="line-height:16px;${st}">${esc(t)}</div>`;

export function tradeView(m: TradeModel, notice: string | null = null): string {
  const head = `<div class="row" style="gap:6px;margin-bottom:6px;align-items:center;flex-wrap:wrap"><b data-testid="evil-trade-title">${esc(m.title)}</b>${m.tabs.map((t, i) => `<span class="tg" style="cursor:pointer;${t.sel ? 'outline:2px solid var(--team-a);' : 'opacity:.8;'}"${act('ttab', i)} data-testid="evil-trade-tab-${i}">${esc(t.name)} ${t.count}</span>`).join('')}<div class="grow"></div>${B('Close', false, 'padding:2px 10px;font-size:13px', '', `${act('trade')} data-testid="evil-trade-close"`)}</div>`;
  const status = m.status.map((s) => sm(s, 'font-weight:700')).join('');
  const rows = m.rows.length
    ? m.rows.map((r, i) => `<div class="row sm" style="line-height:20px;cursor:pointer;padding:0 4px;${r.sel ? 'outline:2px solid var(--team-a);' : ''}${r.open ? '' : 'opacity:.6;'}"${act('trow', i)} data-testid="evil-trade-row" data-key="${esc(r.key)}"><span class="grow">${esc(r.name)}</span><span style="opacity:.8">${esc(r.word)}</span></div>`).join('')
    : sm(m.empty ?? '', 'opacity:.8');
  const pick = m.pick ? `<div class="row sm" style="gap:6px;margin-top:4px;align-items:center"><span style="opacity:.8">${esc(m.pick.label)}:</span><b data-testid="evil-trade-pick">${esc(m.pick.value)}</b>${m.pick.of > 1 ? `<span class="tg" style="cursor:pointer"${act('tpick')} data-testid="evil-trade-pick-next">Next (P)</span>` : ''}</div>` : '';
  const card = m.card.length ? `<div style="margin-top:6px" data-testid="evil-trade-card">${m.card.map((f, i) => `<div class="row sm" style="line-height:17px"${i === m.card.length - 1 ? ' data-testid="evil-trade-field-last"' : ''}><span style="width:132px;flex:none;opacity:.8">${esc(f.label)}</span><span class="grow" style="${f.unknown ? 'color:#f08a7a' : ''}">${esc(f.text)}</span></div>`).join('')}</div>` : '';
  // The buttons sit under the last field (Part 12 section 1.2: "The Confirm button's under field 13").
  const buttons = m.buttons.length ? `<div class="row" style="gap:6px;margin-top:8px;align-items:center;flex-wrap:wrap">${m.buttons.map((b, i) => B(esc(b.label), !b.problem, `padding:4px 12px;${b.problem ? 'opacity:.5' : ''}`, '', `${act('tbtn', i)} data-testid="evil-trade-do-${i}" title="${esc(b.problem ?? '')}"`)).join('')}</div>${m.buttons[0]?.problem ? sm(m.buttons[0].problem, 'color:#f08a7a;margin-top:2px') : ''}` : '';
  const said = notice ? sm(notice, 'margin-top:6px') : '';
  return W(`${head}<div style="position:absolute;left:10px;right:10px;top:40px;bottom:8px;overflow:auto" data-testid="evil-trade-scroll">${status}${rows}${pick}${card}${buttons}<div data-testid="evil-trade-said">${said}</div>${sm(m.hint, 'opacity:.7;margin-top:6px')}</div>`, 'position:absolute;left:16px;right:16px;top:130px;bottom:70px;padding:8px 10px', '', ' data-testid="evil-trade"');
}
