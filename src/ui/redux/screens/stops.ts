// New UI screens for the stops of a run (reward draft, shop, decision, trade), ported from the mock-up templates.

import { act, B, esc, H, TX, W } from '../kit';
import { partyStrip, type PartyChip } from '../game';
import type { ReduxCtx } from '../stage';
import { pic, type Art } from '../templates';

const pickAttr = (k: number): string => `${act('pick', k)} data-over="over"`;

export interface RewardCard { name: string; kind: string; text: string; art: Art | null; notes: string[] }
export interface RewardModel {
  title: string;
  cards: RewardCard[];
  /** Cursor: cards first, then the buttons. */
  index: number;
  party: PartyChip[];
  buttons: string[];
  text: string;
  /** After the pick: the result lines, shown until an input. */
  result: string[] | null;
}

/** The mock-ups' `reward` template: A a row of cards, B a fanned hand, C a list with a detail window. */
export function rewardView(c: ReduxCtx, d: RewardModel): string {
  const v = c.v(3), R = d.cards, n = R.length, on = Math.min(d.index, n - 1), cur = R[on]!;
  const inCards = d.index < n;
  const strip = partyStrip(d.party, 'left:24px;right:24px;bottom:66px');
  const foot = `<div class="abs row" style="left:24px;right:24px;bottom:16px;gap:10px"><span class="sm grow" style="line-height:17px;max-height:36px;overflow:hidden">${esc(d.text)}</span>${d.buttons.map((b, k) => B(esc(b), d.index === n + k, 'height:36px;font-size:14px', '', pickAttr(n + k))).join('')}${B('Take', inCards, 'height:36px;font-size:14px', '', act('take'))}</div>`;
  const notes = (r: RewardCard, size = 11): string => r.notes.map((t) => `<span class="acc" style="font-size:${size}px;text-align:center;line-height:${size + 3}px">${esc(t)}</span>`).join('');
  const result = d.result ? `<div class="fill" style="background:#000a;z-index:20"${act('done')}></div>` + TX(d.result.filter(Boolean).map(esc).join('<br>'), '', 'z-index:21') + `<div class="abs sm" style="right:34px;bottom:22px;z-index:22"><kbd>Enter</kbd>continue</div>` : '';
  const head = H(d.title, 'reward', [['←→', 'look'], ['Enter', 'take']]);
  if (v === 1) {
    const mid = (n - 1) / 2, dx = Math.min(132, 760 / Math.max(1, n));
    return head + `<div class="abs" style="left:0;right:0;top:86px;height:290px">${R.map((r, k) => `<div class="abs" style="left:${480 - 75 + (k - mid) * dx}px;top:${Math.abs(k - mid) * 16}px;transform:rotate(${(k - mid) * 5}deg);z-index:${inCards && k === on ? 9 : k}"${pickAttr(k)}>${W(`${pic(r.art, 56)}<b style="font-size:14px;text-align:center">${esc(r.name)}</b><span class="tg${inCards && k === on ? '' : ' no'}">${esc(r.kind)}</span><span class="sm" style="font-size:12px;text-align:center;overflow:hidden">${esc(r.text)}</span>${notes(r, 10)}`, 'width:150px;height:230px;display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 10px;overflow:hidden', inCards && k === on ? 'sel' : '')}</div>`).join('')}</div>` + strip + foot + result;
  }
  if (v === 2) {
    return head + `<div class="abs col" style="left:24px;top:70px;width:440px;gap:7px">${R.map((r, k) => `<div class="btn${inCards && k === on ? ' on' : ''}" style="height:${n > 6 ? 34 : 40}px"${pickAttr(k)}>${pic(r.art, 30)}<span class="grow">${esc(r.name)}</span><small>${esc(r.kind)}</small></div>`).join('')}</div><div class="abs" style="left:494px;right:26px;top:74px">${W(`<div class="row">${pic(cur.art, 72)}<div class="col" style="gap:4px"><b class="acc" style="font-size:21px">${esc(cur.name)}</b><span class="tg">${esc(cur.kind)}</span></div></div><div style="line-height:22px">${esc(cur.text)}</div>${cur.notes.map((t) => `<div class="sm acc" style="line-height:17px">${esc(t)}</div>`).join('')}`, 'display:flex;flex-direction:column;gap:10px')}</div>` + strip + foot + result;
  }
  return head + `<div class="abs row" style="left:24px;right:24px;top:74px;gap:12px;align-items:stretch">${R.map((r, k) => W(`${pic(r.art, 56)}<b style="font-size:14px;text-align:center">${esc(r.name)}</b><span class="tg${inCards && k === on ? '' : ' no'}">${esc(r.kind)}</span><span class="sm" style="font-size:12px;text-align:center;line-height:16px;overflow:hidden">${esc(r.text)}</span>${notes(r)}`, 'flex:1;height:250px;display:flex;flex-direction:column;align-items:center;gap:9px;padding:14px 8px;min-width:0;overflow:hidden', inCards && k === on ? 'sel' : '', pickAttr(k))).join('')}</div>` + strip + foot + result;
}
