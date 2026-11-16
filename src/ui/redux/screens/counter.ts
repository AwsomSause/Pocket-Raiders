// New UI Exchange Counter (the Bank's tier 3 service), on the mock-up `shop` page: the offers with their prices, a
// detail card with two buttons (one lot, five lots), what the player holds as chips, and the clerk's text box.
// Presentation only: the Hub scene does the exchange.

import { act, B, esc, H, TX, W } from '../kit';
import type { ReduxCtx } from '../stage';
import { pic, type Art } from '../templates';

export interface CounterOffer {
  name: string;
  /** What one lot costs ("100 credits"). */
  price: string;
  art: Art | null;
  /** What the player holds of what this offer gives ("You have 60 Research Points"). */
  have: string;
  text: string;
  /** Per button: why it can't be pressed (null = fine). */
  problems: (string | null)[];
}
export interface CounterModel {
  title: string;
  clerk: string;
  /** What the player holds, as chips at the top right. */
  chips: string[];
  offers: CounterOffer[];
  /** The buttons on the detail card ("Exchange 1", "Exchange 5"). */
  buttons: string[];
  /** Cursor: offer × buttons, one stop per button of each offer. */
  index: number;
  text: string;
}

/** The cursor's stop for a button of an offer. */
export const counterStop = (offer: number, button: number, buttons: number): number => offer * buttons + button;

export function counterView(c: ReduxCtx, d: CounterModel): string {
  const v = c.v(2), nb = Math.max(1, d.buttons.length), n = d.offers.length;
  const at = Math.max(0, Math.min(n * nb - 1, d.index)), oi = Math.floor(at / nb), bi = at % nb, cur = d.offers[oi];
  const pick = (o: number, b: number): string => `${act('pick', counterStop(o, b, nb))} data-over="over"`;
  const chips = `<div class="abs row" style="right:20px;top:60px;gap:6px">${d.chips.map((t, k) => `<span class="tg${k ? ' no' : ''}">${esc(t)}</span>`).join('')}</div>`;
  const head = H(d.title, 'shop', [['Enter', 'exchange'], ['←→', 'how many'], ['Esc', 'back']]) + chips;
  const buttons = cur ? d.buttons.map((t, j) => B(esc(t), j === bi, `flex:1;justify-content:center${cur.problems[j] ? ';opacity:.45' : ''}`, '', pick(oi, j))).join('') : '';
  const tail = TX(esc(d.text), d.clerk);
  if (!cur) return head + `<div class="abs cen" style="left:0;right:0;top:220px;display:flex;font-size:26px;opacity:.6">Nothing here yet</div>` + tail;
  if (v === 1) {
    return head + `<div class="abs" style="left:24px;right:24px;top:92px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px">${d.offers.map((o, k) => W(`${pic(o.art, 48)}<b style="font-size:14px;text-align:center">${esc(o.name)}</b><span class="tg${o.problems[0] ? ' no' : ''}">${esc(o.price)}</span>`, 'display:flex;flex-direction:column;align-items:center;gap:5px;padding:8px', k === oi ? 'sel' : '', pick(k, k === oi ? bi : 0))).join('')}</div>` +
      `<div class="abs col" style="left:24px;right:24px;top:250px;gap:8px"><div class="sm" style="line-height:20px">${esc(cur.have)} · ${esc(cur.text)}</div><div class="row" style="gap:16px">${buttons}</div></div>` + tail;
  }
  return head + `<div class="abs col" style="left:24px;top:92px;width:420px;gap:7px">${d.offers.map((o, k) => `<div class="btn${k === oi ? ' on' : ''}" style="height:38px"${pick(k, k === oi ? bi : 0)}>${pic(o.art, 28)}<span class="grow">${esc(o.name)}</span><span>${esc(o.price)}</span></div>`).join('')}</div>` +
    `<div class="abs" style="left:476px;right:26px;top:96px">${W(`<div class="row">${pic(cur.art, 64)}<div class="col" style="gap:4px"><b class="acc" style="font-size:21px">${esc(cur.name)}</b><span class="sm">${esc(cur.have)}</span></div></div><div style="line-height:22px">${esc(cur.text)}</div><div class="row">${buttons}</div>`, 'display:flex;flex-direction:column;gap:10px')}</div>` + tail;
}
