// Evil Mode's Scheme page, in the New look (design Part 22 section 1.3; Part 29 section 10.2): the drawing in four pieces
// (each filling in with its stamp, who and the day), the clean version fainter behind it, groundwork ticks, the bar with a
// notch at 80 and the sentence under it; then the rows, and the chosen row's Honest Card (or the Scheme's own Card) on the
// right. C opens; Up/Down picks a row; Enter does it; Esc closes. Taps: press a row.

import type { SchemeModel } from '../../../core/evilMode/schemeScreens';
import { act, B, esc, W } from '../kit';

const sm = (t: string, st = ''): string => `<div class="sm" style="line-height:16px;${st}">${esc(t)}</div>`;

export function schemeView(m: SchemeModel, notice: string | null = null): string {
  const head = `<div class="row" style="gap:6px;margin-bottom:6px;align-items:center;flex-wrap:wrap"><b data-testid="evil-sc-title">${esc(m.title)}</b><span class="tg" style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(m.says)}</span><div class="grow"></div>${B('Close', false, 'padding:2px 10px;font-size:13px', '', `${act('scheme')} data-testid="evil-sc-close"`)}</div>`;
  const piece = (s: SchemeModel['slots'][number], i: number) => {
    const filled = s.state === 'inHand';
    const colour = !filled ? 'transparent' : s.clean ? 'var(--team-a)' : 'var(--team-b)';
    return `<div data-testid="evil-sc-slot-${i}" data-state="${s.state}" data-clean="${s.clean === null ? '' : s.clean}" style="position:relative;min-width:0;padding:6px;background:var(--p);border:2px ${filled ? 'solid' : 'dashed'} ${filled ? colour : 'currentColor'};opacity:${filled ? 1 : 0.7};${s.state === 'lost' ? 'text-decoration:line-through;' : ''}">
      <div class="sm" style="font-weight:700;line-height:16px">${esc(s.part)}</div>${sm(s.piece)}${s.stamp ? `<span class="tg" style="position:absolute;right:4px;top:4px;transform:rotate(-6deg);background:${colour};color:#fff" data-testid="evil-sc-stamp-${i}">${esc(s.stamp)}</span>` : ''}${sm(s.line, 'opacity:.8')}</div>`;
  };
  // The clean version, fainter, behind: the same four pieces, offset, each with its clean way; and the whole of it, under.
  const ghost = `<div aria-hidden="true" data-testid="evil-sc-ghost" style="position:absolute;left:7px;top:7px;right:-7px;bottom:-7px;display:grid;grid-template-columns:1fr 1fr;gap:6px;opacity:.2;pointer-events:none">${m.ghost.map((g) => `<div style="border:2px solid currentColor;padding:4px;font-style:italic;display:flex;align-items:flex-end;justify-content:flex-end;text-align:right" class="sm">${esc(g)}</div>`).join('')}</div>`;
  const drawing = `<div style="position:relative;margin:0 8px 8px 0">${ghost}<div style="position:relative;display:grid;grid-template-columns:1fr 1fr;gap:6px">${m.slots.map(piece).join('')}</div></div>
    <div class="sm" data-testid="evil-sc-faint" style="line-height:16px;opacity:.55;font-style:italic;margin-top:2px">${esc(m.faint)}</div>`;
  const ticks = `<div class="row" style="gap:2px;margin-top:6px;align-items:center" data-testid="evil-sc-ground" title="${esc(m.ground.text)}">${Array.from({ length: m.ground.cap }, (_, i) => `<i style="display:inline-block;width:6px;height:8px;background:${i < m.ground.n ? 'var(--team-a)' : 'transparent'};border:1px solid currentColor"></i>`).join('')}<span class="sm" style="margin-left:6px">Groundwork ${m.ground.n}%</span></div>`;
  const bar = `<div style="position:relative;height:12px;margin-top:6px;border:2px solid currentColor" data-testid="evil-sc-bar" data-pct="${m.pct}"><i style="position:absolute;left:0;top:0;bottom:0;width:${m.pct}%;background:var(--team-a)"></i><i style="position:absolute;left:${m.readyAt}%;top:-4px;bottom:-4px;width:2px;background:currentColor"></i></div>
    <div class="row sm" style="line-height:18px"><b data-testid="evil-sc-pct">${m.pct}%</b><span class="grow" style="margin-left:8px" data-testid="evil-sc-sentence">${esc(m.sentence)}</span></div>`;
  const extra = [m.moment, m.eye, m.home ? `The count: ${m.home.n} of ${m.home.need}.` : null].filter((x): x is string => !!x).map((t) => sm(t)).join('')
    + (m.home ? `<div data-testid="evil-sc-home" style="opacity:.8">${m.home.names.slice(0, 6).map((n) => sm(n)).join('')}</div>` : '')
    + (m.digs.length ? `<div data-testid="evil-sc-digs" style="margin-top:4px">${m.digs.map((d) => sm(d)).join('')}</div>` : '')
    + (m.heist ? `<div data-testid="evil-sc-heist" style="margin-top:4px">${sm(`${m.heist.name}: ${m.heist.stage}. ${m.heist.noise}.`, 'font-weight:700')}${m.heist.lines.map((l) => sm(l)).join('')}</div>` : '');
  const left = `<div style="min-width:0">${drawing}${ticks}${bar}${extra}</div>`;
  const rows = `<div>${m.rows.map((r, i) => `<div class="row sm" style="line-height:20px;padding:0 4px;cursor:pointer;gap:6px;opacity:${r.open ? 1 : 0.55};${r.sel ? 'outline:2px solid var(--team-a);' : ''}"${act('srow', i)} data-testid="${esc(r.testid)}" data-open="${r.open}"><span style="flex:1 1 55%;min-width:0">${esc(r.label)}</span>${r.why ? `<span style="flex:0 1 45%;min-width:0;opacity:.8;text-align:right;font-size:12px;line-height:15px">${esc(r.why)}</span>` : ''}</div>`).join('') || sm('Nothing to do here today.', 'opacity:.7')}</div>`;
  const card = m.card
    ? `<div data-testid="evil-sc-card" style="margin-top:6px">${m.card.map((f, i) => `<div class="sm" style="line-height:15px;margin-bottom:2px${f.unknown ? ';color:#c0392b' : ''}"><b>${i + 1}. ${esc(f.label)}.</b> ${esc(f.text)}</div>`).join('')}</div>`
    : `<div data-testid="evil-sc-own" style="margin-top:6px">${sm(m.title, 'font-weight:700')}${m.own.length ? m.own.map((l) => sm(l)).join('') : sm('Nothing stamped yet.', 'opacity:.7')}</div>`;
  const note = notice ? sm(notice, 'margin-top:6px') : sm(m.hint, 'margin-top:6px;opacity:.7');
  const right = `<div style="min-width:0">${rows}<div data-testid="evil-sc-said">${note}</div>${card}</div>`;
  const body = `<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:12px">${left}${right}</div>`;
  return W(`${head}<div style="position:absolute;left:10px;right:10px;top:40px;bottom:8px;overflow:auto">${body}</div>`, 'position:absolute;left:16px;right:16px;top:130px;bottom:70px;padding:8px 10px', '', ' data-testid="evil-sc"');
}
