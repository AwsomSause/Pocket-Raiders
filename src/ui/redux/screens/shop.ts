// New UI shop, ported from the mock-ups' `shop` template: A a list with a detail window, B a wall of goods.
// It is a shop "layout" like the ones in ui/shopStyles: ShopScene keeps the state and the buying; this only draws.

import type Phaser from 'phaser';
import type { InputAction } from '../../input';
import type { ShopView } from '../../shopLook';
import type { ChoicePrompt } from '../../shopStyles/common';
import type { BasketLine, ShopCtx, ShopHandles, ShopHooks } from '../../shopStyles/types';
import { act, B, esc, H, TX, W } from '../kit';
import { artOf, partyChips, partyStrip } from '../game';
import { mountRedux } from '../stage';
import { pic, scrollStart } from '../templates';
import { confirmBox } from './saves';

const pickAttr = (k: number): string => `${act('pick', k)} data-over="over"`;

/** The open shop's prompt (Buy / Haggle / Never mind), drawn by the shop view itself. */
let ask: { question: string; options: string[]; index: number; pick: (i: number) => void } | null = null;
let redraw: (() => void) | null = null;

/** The New UI's version of shopStyles' `choicePrompt`: the mock-ups' Confirm dialog over the shop. */
export function reduxChoicePrompt(question: string, options: string[], onPick: (i: number) => void): ChoicePrompt {
  ask = { question, options, index: 0, pick: onPick };
  redraw?.();
  return {
    focus: (i) => { if (ask) ask.index = i; redraw?.(); },
    destroy: () => { ask = null; redraw?.(); },
  };
}

export function reduxShop(ctx: ShopCtx, hooks: ShopHooks): ShopHandles {
  const scene: Phaser.Scene = ctx.scene;
  let view: ShopView = ctx.view;
  let index = 0;
  let message: string | null = ctx.notice ?? null;
  let basket: readonly BasketLine[] = [];
  let cols = 1;
  /** "Buy 5" lit (Right on the list) instead of "Buy 1". */
  let five = false;
  /** The clerk's welcome stays until the player moves or something happens. */
  let moved = false;
  const depot = ctx.type === 'depot';
  const fiveOk = (r: ShopView['rows'][number] | undefined): boolean => !!r && !depot && !r.single;
  // Cursor stops after the goods: Sell (when the shop buys), then the Depot's Checkout and Empty basket.
  const extras = (): string[] => [...(view.canSell ? ['Sell'] : []), ...(depot ? [`Checkout${basket.length ? ` ₽${basket.reduce((n, l) => n + l.total, 0)}` : ''}`, 'Empty basket'] : [])];
  ask = null;

  const rx = mountRedux(scene, {
    render: (c) => {
      const v = c.v(2), R = view.rows, n = R.length, ex = extras();
      cols = v === 1 ? 4 : 1;
      const row = R[Math.min(index, n - 1)];
      const party = partyChips(scene);
      const users = row?.users ? new Set(row.users) : null;
      const notes = ctx.party.map((m) => (users?.has(m.uid) ? 'Can use' : ''));
      const money = `<div class="abs row" style="right:20px;top:60px;gap:6px"><span class="tg no">${esc(ctx.clock)}</span>${view.nextStock ? `<span class="tg no">${esc(view.nextStock)}</span>` : ''}<span class="tg">₽ ${view.money.toLocaleString('en-US')}</span></div>`;
      const price = (r: ShopView['rows'][number]): string => `${r.wasPrice !== null ? `<s style="opacity:.6;margin-right:6px">₽ ${r.wasPrice}</s>` : ''}₽ ${r.price}`;
      const buttons = ex.map((t, k) => B(esc(t), index === n + k, 'flex:1;justify-content:center;height:38px;font-size:15px', '', pickAttr(n + k))).join('');
      const text = message ?? (index >= n ? (ex[index - n] === 'Sell' ? 'Sell items from your Bag here.' : depot ? 'Nothing is bought until you check out. Five or more of one item is cheaper.' : '') : row && moved ? `${row.name}: ${row.who}.${row.problem ? ` ${row.problem}` : ''}` : 'Welcome! Take your time.');
      const up = text.length > 90 ? 126 : 100;
      const lines = basket.length ? `<div class="sm" style="line-height:17px;max-height:68px;overflow:hidden"><b class="acc">Basket</b> ${basket.map((l) => `${esc(l.name)} ×${l.count} ₽${l.total}${l.saving ? ` (−₽${l.saving})` : ''}`).join(' · ')}</div>` : '';
      const head = H(ctx.title, 'shop', [['Enter', depot ? 'add' : 'buy'], ['Esc', 'leave']]) + money;
      const tail = partyStrip(party, `left:24px;right:24px;bottom:${up}px`, notes) + TX(esc(text), 'Clerk') + (ask ? confirmBox({ title: ask.question, body: '', options: ask.options, index: ask.index }) : '');
      if (v === 1) {
        const s = Math.floor(scrollStart(n, Math.min(index, n - 1), 8) / 4) * 4;
        return head + `<div class="abs" style="left:24px;right:24px;top:92px;display:grid;grid-template-columns:repeat(4,1fr);gap:${ex.length || basket.length ? 10 : 16}px">${R.slice(s, s + 8).map((r, q) => W(`${pic(artOf(scene, r.iconAssetId), 48)}<b style="font-size:14px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">${esc(r.label)}</b><span class="tg${r.affordable ? '' : ' no'}">${price(r)}</span>`, 'display:flex;flex-direction:column;align-items:center;gap:5px;padding:8px;min-width:0', s + q === index ? 'sel' : '', pickAttr(s + q))).join('')}</div>${ex.length ? `<div class="abs row" style="left:24px;right:24px;top:338px;gap:10px">${buttons}${lines}</div>` : ''}${n > 8 ? `<div class="abs sm" style="right:28px;top:76px">${s + 1}-${Math.min(n, s + 8)} of ${n}</div>` : ''}` + tail;
      }
      const s = scrollStart(n, Math.min(index, n - 1), 6);
      return head + `<div class="abs col" style="left:24px;top:92px;width:420px;gap:7px">${R.slice(s, s + 6).map((r, q) => `<div class="btn${s + q === index ? ' on' : ''}${r.affordable ? '' : ' off'}" style="height:38px"${pickAttr(s + q)}>${pic(artOf(scene, r.iconAssetId), 28)}<span class="grow" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.label)}</span><span>${price(r)}</span></div>`).join('')}${n > 6 ? `<div class="sm" style="text-align:right">${s + 1}-${Math.min(n, s + 6)} of ${n}</div>` : ''}</div><div class="abs" style="left:476px;right:26px;top:96px">${W(row ? `<div class="row">${pic(artOf(scene, row.iconAssetId), 64)}<div class="col" style="gap:4px;min-width:0"><b class="acc" style="font-size:21px">${esc(row.name)}</b><span class="sm">In bag: ${row.owned} · ${esc(row.pocket.word)}</span></div></div><div style="line-height:20px;max-height:${basket.length ? 40 : 80}px;overflow:hidden">${esc(row.description)}</div>${lines}<div class="row">${depot ? B('Add to basket', index < n, 'flex:1;justify-content:center', '', act('buy')) : B('Buy 1', index < n && !five, 'flex:1;justify-content:center', '', act('buy')) + (fiveOk(row) ? B('Buy 5', index < n && five, `flex:1;justify-content:center${row.price * 5 > view.money ? ';opacity:.5' : ''}`, '', act('buy5')) : '')}${buttons}</div>` : '<b>Sold out.</b>', 'display:flex;flex-direction:column;gap:10px')}</div>` + tail;
    },
    acts: {
      pick: (i) => { if (!ask) hooks.pick(Number(i)); },
      buy: () => { if (!ask) hooks.pick(Math.min(index, view.rows.length - 1)); },
      buy5: () => { if (!ask) hooks.pickMany?.(Math.min(index, view.rows.length - 1), 5); },
      confirm: (k) => ask?.pick(Number(k)),
    },
    overs: { over: (i) => { if (!ask) hooks.focus(Number(i)); } },
  });
  redraw = () => rx.refresh();
  scene.events.once('shutdown', () => { redraw = null; ask = null; });

  return {
    move(action: InputAction, from: number): number {
      const total = view.rows.length + extras().length;
      if (total === 0) return from;
      // On the list, Left/Right light "Buy 1" or "Buy 5" (the mock-up's two buttons) instead of moving.
      if (cols === 1 && (action === 'left' || action === 'right') && from < view.rows.length) {
        const want = action === 'right' && fiveOk(view.rows[from]);
        if (want !== five) { five = want; moved = true; message = null; rx.refresh(); }
        return from;
      }
      const step = action === 'up' ? -cols : action === 'down' ? cols : action === 'left' ? -1 : action === 'right' ? 1 : 0;
      if (!step) return from;
      const to = from + step;
      return to < 0 ? (cols === 1 ? total - 1 : from) : to >= total ? (cols === 1 ? 0 : Math.min(total - 1, Math.max(from, view.rows.length))) : to;
    },
    count: () => (five && cols === 1 && index < view.rows.length && fiveOk(view.rows[index]) ? 5 : 1),
    focus(i: number): void {
      if (i !== index) { message = null; moved = true; if (!fiveOk(view.rows[i])) five = false; }
      index = i;
      rx.refresh();
    },
    refresh(next: ShopView, _bought: number | null, text: string | null): void {
      view = next;
      message = text;
      rx.refresh();
    },
    haggled(next: ShopView, _i: number, _won: boolean, text: string): void {
      view = next;
      message = text;
      rx.refresh();
    },
    basket(lines: readonly BasketLine[], text: string | null): void {
      basket = lines;
      message = text;
      rx.refresh();
    },
  };
}
