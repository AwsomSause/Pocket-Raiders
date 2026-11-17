// Evil Mode's Honest Card overlay and the Ledger, in the New look (design Part 29 sections 6 and 8). Plain data in from
// core/evilMode/ledgerScreens.ts; EvilScene keeps the cursor and the Card's gate. Every button is a tap target
// (data-act) and has a key path, so a Card can be read and confirmed, and the Ledger worked, with either alone.

import type { CardModel, LedgerModel } from '../../../core/evilMode/ledgerScreens';
import { act, B, esc, W } from '../kit';

const sm = (t: string, st = ''): string => `<div class="sm" style="line-height:16px;${st}">${esc(t)}</div>`;
const LEDGER_TYPE = 'font-family:"Courier New",Courier,monospace,var(--font);font-weight:700';

/**
 * The Card takes the whole stage; the frame falls away. Thirteen fields, always in the same order, then CONFIRM, under
 * field 13 and in the flow (it scrolls with the card; it doesn't float). Red ink for every field that's a guess.
 */
export function cardView(m: CardModel, teamA: string, teamB: string): string {
  const row = (f: CardModel['fields'][number]): string => `<div class="row" style="align-items:flex-start;gap:8px;padding:3px 0;border-bottom:1px solid #8884" data-testid="evil-card-f${f.n}">
    <span class="sm" style="width:22px;flex:none;opacity:.6;text-align:right;line-height:18px">${f.n}</span>
    <b class="sm" style="width:150px;flex:none;line-height:18px">${esc(f.label)}</b>
    <span class="grow" style="line-height:18px;font-size:${f.n === 1 ? 18 : 14}px;${f.n === 1 ? 'font-weight:700;' : ''}${f.unknown ? 'color:#d8483a;' : ''}${f.n === 12 ? LEDGER_TYPE : ''}"${f.n === 12 ? ' data-testid="evil-card-written"' : ''}>${esc(f.text)}${f.n === 13 && m.swap ? ` <span style="text-decoration:underline;cursor:pointer;margin-left:6px"${act('cardSwap')} data-testid="evil-card-swap">${esc(m.swap)}</span>` : ''}</span></div>`;
  const button = m.mode === 'read'
    ? B('Close', true, 'padding:4px 18px', '', `${act('cardClose')} data-testid="evil-card-close"`)
    : `${B(m.ask ?? 'CONFIRM', m.lit, `padding:4px 22px;${m.lit ? `background:${esc(teamB)};color:#fff;` : 'opacity:.45;'}`, '', `${act('cardConfirm')} data-testid="evil-card-confirm" data-lit="${m.lit}" data-ask="${!!m.ask}"`)}${B('Back', false, 'padding:4px 14px', '', `${act('cardClose')} data-testid="evil-card-back"`)}`;
  const edge = m.clean ? '2px solid #8888' : `4px solid ${esc(teamB)}`;
  const head = `<div class="sm" style="opacity:.7;margin-bottom:4px">${m.mode === 'read' ? `The Card as it was confirmed, day ${m.day}.` : 'The Honest Card.'}</div>`;
  return `<div style="position:absolute;inset:0;background:#141414cc;--team-a:${esc(teamA)};--team-b:${esc(teamB)}" data-testid="evil-card" data-clean="${m.clean}" data-mode="${m.mode}">
    <div class="abs" style="left:90px;right:90px;top:14px;bottom:14px;outline:${edge};outline-offset:-2px;background:var(--pa);color:var(--pai);box-shadow:6px 6px 0 #0006">
      <div style="position:absolute;inset:0;overflow-y:auto;padding:10px 16px" data-testid="evil-card-scroll" data-card-scroll="1">${head}${m.fields.map(row).join('')}
        <div class="row" style="gap:8px;margin-top:10px;padding-bottom:4px">${button}</div></div></div></div>`;
}

/** The Ledger: a book, two pages, tabs along its edge. It shares the day's frame. */
export function ledgerView(m: LedgerModel): string {
  const tabs = `<div class="row" style="gap:4px;margin-bottom:6px">${m.tabs.map((t, i) => B(esc(t.name), t.sel, 'padding:2px 10px;font-size:13px', '', `${act('ltab', i)} data-testid="evil-ledger-tab-${i}"`)).join('')}<div class="grow"></div>${B('Close', false, 'padding:2px 10px;font-size:13px', '', `${act('ledger')} data-testid="evil-ledger-close"`)}</div>`;
  let body = '';
  if (m.today) {
    const t = m.today;
    const left = t.in.length ? t.in.map((l, i) => `<div style="padding:2px 4px;cursor:pointer;${l.sel ? 'outline:2px solid var(--team-a);' : ''}"${act('lrow', i)} data-testid="evil-ledger-in">${sm(l.text, LEDGER_TYPE)}${l.acts ? `<div class="row" style="gap:4px;margin:2px 0">${l.acts.map((a, j) => B(esc(a.name), a.sel, `padding:1px 8px;font-size:12px;opacity:${a.on ? 1 : 0.4}`, '', `${act('lact', `${i}:${j}`)} data-testid="evil-ledger-${a.id}"`)).join('')}</div>` : ''}</div>`).join('') : sm('Nothing comes in yet.');
    const right = t.out.map((o) => sm(o.text, LEDGER_TYPE)).join('') || sm('Nothing goes out.');
    const page = (title: string, h: string, total: string, id: string) => `<div class="grow" style="padding:0 8px" data-testid="${id}"><b class="sm">${esc(title)}</b>${h}<div class="sm" style="border-top:1px solid #8888;margin-top:4px;${LEDGER_TYPE}">Total ${esc(total)}</div></div>`;
    body = `<div class="row" style="align-items:flex-start;gap:0">${page('In', left, t.inTotal, 'evil-ledger-left')}<div style="width:1px;align-self:stretch;background:#8888"></div>${page('Out', right, t.outTotal, 'evil-ledger-right')}</div>${sm('Press a line: Waive · Halve · Ask about.', 'margin-top:6px;opacity:.7')}`;
  } else if (m.run) {
    body = m.run.length ? m.run.map((r) => `<div class="row sm" style="gap:6px;padding:1px 4px;cursor:pointer;${r.sel ? 'outline:2px solid var(--team-a);' : ''}"${act('lcard', r.cardId)} data-testid="evil-ledger-line"><span style="width:14px;flex:none" data-testid="evil-ledger-mark">${esc(r.mark)}</span><span class="grow" style="${LEDGER_TYPE}">${esc(r.text)}</span>${r.note ? `<i style="opacity:.7">${esc(r.note)}</i>` : ''}</div>`).join('') : sm('No Card confirmed yet.');
  } else if (m.person) {
    body = m.person.map((p) => `<div style="margin-bottom:6px"><b class="sm">${esc(p.name)}</b>${p.lines.length ? p.lines.map((l) => sm(l, LEDGER_TYPE)).join('') : sm('Not sent yet.', 'opacity:.6')}</div>`).join('');
  } else if (m.totals) {
    const g = m.totals;
    body = `<div class="row" style="gap:60px;justify-content:center;margin-top:30px"><div class="col cen"><span class="sm">Given</span><b style="font-size:34px" data-testid="evil-given">${g.given}</b></div><div class="col cen"><span class="sm">Taken</span><b style="font-size:34px" data-testid="evil-taken">${g.taken}</b></div></div>${sm(g.note, 'text-align:center;margin-top:12px;opacity:.7')}`;
  }
  return W(`${tabs}<div style="position:absolute;left:10px;right:10px;top:40px;bottom:8px;overflow:auto">${body}</div>`, 'position:absolute;left:16px;right:16px;top:130px;bottom:70px;padding:8px 10px', '', ' data-testid="evil-ledger"');
}

/** The Ledger's corner: the last line filed, in the Ledger's type ("the card folds to its twelfth line"). */
export const filedCorner = (filed: string | null): string => (filed ? `<div class="abs sm" style="right:16px;bottom:52px;max-width:600px;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${LEDGER_TYPE};font-size:12px;opacity:.9" data-testid="evil-filed">${esc(filed)}</div>` : '');
