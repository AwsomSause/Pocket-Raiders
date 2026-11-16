// New UI screens for the stops of a run (reward draft, shop, decision, trade), ported from the mock-up templates.

import { act, B, esc, H, mon, TX, ty, W } from '../kit';
import { partyStrip, type PartyChip } from '../game';
import type { ReduxCtx } from '../stage';
import { figure, pic, type Art } from '../templates';

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

// ---------- Trade (mock-up `trade`): you and the trader side by side, the swap between ----------

export interface TradeMon { file: string | null; name: string; level: number; types: string[] }
export interface TradeModel {
  title: string;
  money: number;
  you: Art | null;
  trader: string;
  traderArt: Art | null;
  /** Your Pokémon that leaves (null: you have nothing this trader wants) and the one you get (null: no offers at all). */
  give: TradeMon | null;
  get: TradeMon | null;
  /** The small print under the arrows: why it can't be done, or how the two compare. */
  verdict: string;
  bad: boolean;
  cost: number;
  /** Which offer is showing, of how many. */
  at: number;
  count: number;
  /** The cursor: 0 accept, 1 decline. */
  focus: 0 | 1;
  line: string;
  /** After the trade: what happened. The sides have swapped; it stays until the next input. */
  done: string | null;
}

export function tradeView(c: ReduxCtx, d: TradeModel): string {
  const v = c.v(2), swapped = d.done !== null;
  const side = (name: string, art: Art | null, m: TradeMon | null, empty: string, attr = ''): string =>
    W(`<div class="row">${figure(art, 104)}<b>${esc(name)}</b></div><div class="cell" style="height:150px;aspect-ratio:auto;align-self:stretch">${m?.file ? mon(m.file, 2.4, swapped ? 'rx-pop' : '', true) : `<span class="sm" style="padding:0 16px;text-align:center">${esc(m ? m.name : empty)}</span>`}</div>${m ? `<b style="font-size:20px">${esc(m.name)} <span class="sm">Lv ${m.level}</span></b><div class="row" style="gap:4px">${m.types.map(ty).join('')}</div>` : ''}`, 'flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;min-width:0', '', attr);
  const nav = d.count > 1 && !swapped ? `<div class="row sm" style="gap:${v ? 3 : 6}px;white-space:nowrap${v ? ';font-size:11px' : ''}"><span${act('step', -1)} style="cursor:pointer">◀</span><span>${d.at + 1}/${d.count}</span><span${act('step', 1)} style="cursor:pointer">▶</span></div>` : '';
  const cost = d.cost > 0 && !swapped ? `<span class="tg">₽ ${d.cost.toLocaleString('en-US')}</span>` : '';
  const verdict = swapped ? '' : `<span class="sm" style="text-align:center;font-size:${d.verdict.length > 40 ? 11 : 13}px;line-height:15px;${d.bad ? 'color:#f08080' : ''}">${esc(d.verdict)}</span>`;
  const ok = !d.bad && d.give !== null;
  const buttons = swapped
    ? B(v ? '✓' : 'Continue', true, v ? 'justify-content:center;padding:0;width:60px' : 'justify-content:center', '', act('done'))
    : B(v ? '✓' : 'Accept', d.focus === 0, `justify-content:center;${v ? 'padding:0;width:60px;' : ''}${ok ? '' : 'opacity:.5'}`, '', `${act('accept')} data-over="acc"`) + B(v ? '✕' : 'Decline', d.focus === 1, `justify-content:center${v ? ';padding:0;width:60px' : ''}`, '', `${act('decline')} data-over="dec"`);
  const mid = `<div class="col cen" style="gap:10px;width:${v ? 60 : 150}px;flex:none"><b class="acc" style="font-size:44px">⇄</b>${v ? '' : verdict}${cost}${buttons}${nav}${v ? '' : `<span class="sm" style="font-size:12px">You have ₽ ${d.money.toLocaleString('en-US')}</span>`}</div>`;
  const mine = swapped ? d.get : d.give, theirs = swapped ? d.give : d.get;
  const hints: readonly (readonly [string, string])[] = swapped ? [['Enter', 'continue']] : [['Enter', 'choose'], ...(d.count > 1 ? ([['←→', 'offers']] as const) : []), ['Esc', 'back']];
  return H(d.title, 'story', hints) + `<div class="abs row" style="left:${v ? 80 : 24}px;right:${v ? 80 : 24}px;top:76px;gap:${v ? 60 : 20}px;align-items:stretch">${side('You', d.you, mine, 'Nothing this trader wants')}${mid}${side(d.trader, d.traderArt, theirs, 'No offer')}</div>` + (v ? `<div class="abs sm" style="left:80px;right:80px;top:446px;text-align:center"><span style="${d.bad ? 'color:#f08080' : ''}">${swapped ? '' : esc(d.verdict) + ' · '}</span>You have ₽ ${d.money.toLocaleString('en-US')}</div>` : '') + TX(esc(swapped ? d.done! : d.line), d.trader);
}

// ---------- Honest Trade Card (Catalog Overhaul TRADES.md 1.1–1.3) on the mock-up `trade` layout ----------
// Both sides told in full before the player agrees: nature, ability, all four moves, the quirk, the history marks,
// one fair-value number each, and the trader's own reason in the text box.

export interface HonestSide {
  file: string | null;
  name: string;
  level: number;
  types: string[];
  nature: string;
  ability: string | null;
  /** The ability is its hidden one. */
  hidden: boolean;
  moves: string[];
  quirk: { name: string; line: string } | null;
  /** Its history, as event marks ("hatched on a ferry"). */
  marks: string[];
  held: string | null;
  shiny: boolean;
  value: number;
  /** Trading it makes it evolve into this. */
  evolvesTo: string | null;
}
export interface HonestModel {
  title: string;
  you: Art | null;
  trader: string;
  traderArt: Art | null;
  /** What the trader is looking for, in words. */
  wants: string;
  /** Nothing is asked in return. */
  gift: boolean;
  /** The player's Pokémon on offer; null: a gift, or nothing in the party fits. */
  give: HonestSide | null;
  get: HonestSide;
  /** 'worse': the player gives more than they get. 'much-better': they get 2+ more. */
  warn: 'worse' | 'much-better' | null;
  /** Why the trader is trading it, in their words. */
  why: string;
  /** The trader has said theirs is worth less and waits for a second yes. */
  asking: boolean;
  /** Which of the player's fitting Pokémon is on offer, of how many. */
  at: number;
  count: number;
  /** The cursor: 0 trade, 1 back. */
  focus: 0 | 1;
  /** "Ask about it": the card is only shown; one button closes it. */
  readOnly: boolean;
}

/** The trader's line for the text box: the second question after a warning, else their reason. */
export function honestLine(d: Pick<HonestModel, 'asking' | 'why' | 'wants' | 'gift' | 'give'>): string {
  if (d.asking) return 'Mine’s worth less than yours. You sure?';
  if (!d.gift && !d.give) return `I’m looking for ${d.wants}. ${d.why}`.trim();
  return d.why;
}

/** The small print under the arrows: how the two values compare. */
export function honestVerdict(d: Pick<HonestModel, 'gift' | 'give' | 'warn' | 'wants'>): { text: string; bad: boolean } {
  if (d.gift) return { text: 'A gift', bad: false };
  if (!d.give) return { text: `Needs ${d.wants}`, bad: true };
  if (d.warn === 'worse') return { text: 'You give more than you get', bad: true };
  if (d.warn === 'much-better') return { text: 'Much better for you', bad: false };
  return { text: 'Fair trade', bad: false };
}

export function honestView(c: ReduxCtx, d: HonestModel): string {
  const v = c.v(2), verdict = honestVerdict(d), ok = d.gift || d.give !== null;
  const row = (label: string, value: string): string => `<div class="row" style="gap:6px;align-items:baseline"><span style="opacity:.7;flex:none">${label}</span><b style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${value}</b></div>`;
  const facts = (m: HonestSide): string =>
    `<b style="font-size:18px;white-space:nowrap">${m.shiny ? '<span class="acc">✦</span> ' : ''}${esc(m.name)} <span class="sm">Lv ${m.level}</span></b>`
    + `<div class="row" style="gap:4px">${m.types.map(ty).join('')}<span class="tg" style="margin-left:4px">Fair value ${m.value}</span></div>`
    + `<div class="col" style="align-self:stretch;gap:2px;font-size:12px;line-height:15px">`
    + row('Nature', esc(m.nature)) + row('Ability', m.ability ? esc(m.ability) + (m.hidden ? ' <span class="acc">(Hidden)</span>' : '') : '—')
    + (m.held ? row('Holds', esc(m.held)) : '')
    + `<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;margin:2px 0">${[0, 1, 2, 3].map((k) => `<span style="background:#0003;border-radius:3px;padding:1px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.moves[k] ?? '—')}</span>`).join('')}</div>`
    + (m.quirk ? `<div style="white-space:normal"><b class="acc">${esc(m.quirk.name)}</b> ${esc(m.quirk.line)}</div>` : '')
    + (m.marks.length ? `<div style="white-space:normal;opacity:.8;font-size:11px;line-height:13px">${m.marks.map(esc).join(' · ')}</div>` : '')
    + (m.evolvesTo ? `<div class="acc" style="white-space:normal">Evolves into ${esc(m.evolvesTo)} when traded</div>` : '')
    + '</div>';
  const side = (name: string, art: Art | null, m: HonestSide | null, empty: string): string =>
    W(`<div class="row" style="align-self:center;gap:8px;height:60px"><div style="flex:none;height:60px;display:flex;align-items:flex-end;overflow:hidden">${figure(art, 60)}</div><b style="white-space:nowrap">${esc(name)}</b></div><div class="cell" style="height:${v ? 74 : 88}px;aspect-ratio:auto;align-self:stretch;flex:none">${m?.file ? mon(m.file, 1.5, '', true) : `<span class="sm" style="padding:0 16px;text-align:center">${m ? '' : esc(empty)}</span>`}</div>${m ? facts(m) : ''}`, 'flex:1;display:flex;flex-direction:column;align-items:flex-start;gap:5px;min-width:0;padding:8px 12px');
  const nav = d.count > 1 && !d.readOnly && !d.asking ? `<div class="row sm" style="gap:${v ? 3 : 6}px;white-space:nowrap${v ? ';font-size:11px' : ''}"><span${act('step', -1)} style="cursor:pointer">◀</span><span>${d.at + 1}/${d.count}</span><span${act('step', 1)} style="cursor:pointer">▶</span></div>` : '';
  const small = (t: string): string => `<span class="sm" style="text-align:center;font-size:${t.length > 22 ? 11 : 13}px;line-height:15px;${verdict.bad ? 'color:#f08080' : ''}">${esc(t)}</span>`;
  const narrow = v ? 'padding:0;width:60px;' : '';
  const buttons = d.readOnly
    ? B(v ? '✓' : 'Close', true, `justify-content:center;${narrow}`, '', act('back'))
    : B(v ? '✓' : d.asking ? 'Yes, trade' : 'Trade', d.focus === 0, `justify-content:center;${narrow}${ok ? '' : 'opacity:.5'}`, '', `${act('accept')} data-over="acc"`) + B(v ? '✕' : 'Back', d.focus === 1, `justify-content:center;${narrow}`, '', `${act('back')} data-over="dec"`);
  const mid = `<div class="col cen" style="gap:10px;width:${v ? 60 : 150}px;flex:none"><b class="acc" style="font-size:44px">⇄</b>${v ? '' : small(verdict.text)}${buttons}${nav}</div>`;
  const hints: readonly (readonly [string, string])[] = d.readOnly ? [['Enter', 'close']] : [['Enter', 'choose'], ...(d.count > 1 && !d.asking ? ([['←→', 'your Pokémon']] as const) : []), ['Esc', 'back']];
  return H(d.title, 'story', hints)
    + `<div class="abs row" style="left:${v ? 60 : 24}px;right:${v ? 60 : 24}px;top:62px;bottom:${v ? 122 : 104}px;gap:${v ? 16 : 14}px;align-items:stretch">${side('You', d.you, d.give, d.gift ? 'Nothing asked in return' : `Nothing in your party fits: ${d.wants}`)}${mid}${side(d.trader, d.traderArt, d.get, '')}</div>`
    + (v ? `<div class="abs sm" style="left:60px;right:60px;bottom:100px;text-align:center;${verdict.bad ? 'color:#f08080' : ''}">${esc(verdict.text)}</div>` : '')
    + TX(esc(honestLine(d)), d.trader);
}
