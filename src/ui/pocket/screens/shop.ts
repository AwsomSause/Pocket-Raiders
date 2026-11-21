// The Pocket look's shop (mock-up pages `shop`, Poké Mart, and `shop-pay`, Check Out): goods stand on two shelves of
// four with what each costs and how many the player has, the clerk stands behind the counter, the lit good's words are
// the clerk's line, and the basket (or the Buy buttons) sits under the counter. A shop with a basket checks out on a
// receipt. It draws what ui/redux/screens/shop.ts hands it; ShopScene keeps the state and the buying. Presentation only.

import { ballArt, type PkArt } from '../art';
import { act, esc, hdr, keys, type PkKey, page, sprH } from '../kit';
import { fit, fitBody, fitPic, pkArtOf, pkConfirm } from '../templates';
import type { Art } from '../../redux/templates';

/** Goods on show at a time: two shelves of four. */
export const PK_SHELF = 8;
export const PK_SHELF_COLS = 4;
/** The Poké Mart clerk (the mock-ups' `t-clerk`). */
export const PK_CLERK: PkArt = { file: 'trainer/pr/clerk_f', atlas: true };

export interface PkShopGood {
  name: string;
  /** "on sale!", "early", "black market"... from the game's label, or ''. */
  tag: string;
  price: number;
  was: number | null;
  off: boolean;
  have: number;
  art: Art | null;
  /** In the basket (a shop with a basket). */
  inBasket: number;
}
export interface PkShopModel {
  title: string;
  crumb: readonly string[];
  clock: string;
  money: number;
  goods: PkShopGood[];
  index: number;
  /** The Buy buttons of the lit good (a shop without a basket), each with its act and whether it is lit. */
  buy: { label: string; act: string; on: boolean; dim?: boolean }[];
  /** Buttons after the goods (Sell, Checkout, Empty basket), as cursor stops after the last good. */
  extras: string[];
  basket: { name: string; count: number; total: number; art: Art | null; saving: number }[] | null;
  /** The lit good: where it goes in the Bag. */
  pocket: string;
  text: string;
  /** Kecleon or Meowth keeps the shop (a Pokémon sprite file), else the clerk. */
  keeper: string | null;
  nextStock: string | null;
  ask: { title: string; options: string[]; index: number } | null;
}

const money = (n: number): string => `₽ ${n.toLocaleString('en-US')}`;

function keeperArt(d: PkShopModel, h: number): string {
  return d.keeper ? fitPic({ file: d.keeper, atlas: true }, 180, 200, '', 4) : sprH(PK_CLERK, h);
}
/** The clerk's line: their face in the circle and their name on the tab. */
function said(d: PkShopModel, text: string): string {
  return `<div class="tb sp talk" data-m="tb" data-key="shop-tb">${d.keeper ? `<i class="por">${fitPic({ file: d.keeper, atlas: true }, 70, 70, '', 2)}</i>` : `<i class="por">${sprH(PK_CLERK, 159)}</i>`}<b class="tb-w">${d.keeper ? 'Shopkeeper' : 'Clerk'}</b><p style="font-size:${fitBody(text, 700, 46, [16, 15, 14, 13, 12], 1.4)}px">${esc(text)}</p><em class="tb-go"><kbd>Enter</kbd></em></div>`;
}

/** The shop floor: the shelves, the clerk at the counter, the basket or the Buy buttons. */
export function pkShop(d: PkShopModel): string {
  const n = d.goods.length, lit = d.goods[Math.min(d.index, n - 1)], onGood = d.index < n;
  const s = Math.floor(Math.max(0, Math.min(n - PK_SHELF, Math.min(d.index, n - 1) - PK_SHELF / 2)) / PK_SHELF_COLS) * PK_SHELF_COLS;
  const pills = [d.clock, money(d.money), ...(n > PK_SHELF ? [`${s + 1}–${Math.min(n, s + PK_SHELF)} of ${n}`] : [])];
  const goods = d.goods.slice(s, s + PK_SHELF).map((g, q) => {
    const k = s + q, on = k === d.index;
    return `<div class="si${on ? ' on' : ''}${g.off ? ' gx-off' : ''}" data-key="shop-g-${k}"${act('pick', k, 'over')}><i class="si-ic">${fitPic(pkArtOf(g.art), 64, 64, '', 2)}</i>${g.have > 0 ? `<u class="si-have">You have ${g.have}</u>` : ''}${g.tag ? `<u class="gx-si-tag">${esc(g.tag)}</u>` : ''}<b style="font-size:${fit(g.name, on ? 110 : 140, 14, 11, 0.56)}px">${esc(g.name)}</b><em>${g.was !== null ? `<s>${money(g.was)}</s> ` : ''}${money(g.price)}</em>${on && g.inBasket ? `<span class="qty"><kbd>×</kbd><b>${g.inBasket}</b></span>` : ''}</div>`;
  }).join('');
  // After the goods: Check out is the basket's own pill (the mock-up's), Sell and Empty basket small pills above it.
  const extra = (t: string, k: number, cls: string): string => `<i class="${cls}${d.index === n + k ? ' on' : ''}"${act('pick', n + k, 'over')}>${t.startsWith('Checkout') ? '<kbd>C</kbd> Check out' : esc(t)}</i>`;
  const go = d.extras.map((t, k) => (t.startsWith('Checkout') ? extra(t, k, 'bk-go') : '')).join('');
  const side = d.extras.map((t, k) => (t.startsWith('Checkout') ? '' : extra(t, k, 'gx-bk-x'))).join('');
  const total = d.basket ? d.basket.reduce((sum, l) => sum + l.total, 0) : 0;
  const panel = d.basket
    ? `<div class="basket pn" data-key="shop-basket"><b>Basket</b>${side ? `<span class="gx-bk-side">${side}</span>` : ''}<span class="gx-bk-l">${d.basket.length ? d.basket.map((l) => `${esc(l.name)} ×${l.count}`).join(' · ') : 'Nothing yet'}</span><div class="bk-t"><em>Total ${money(total)}</em>${go}</div></div>`
    : `<div class="basket pn gx-buy" data-key="shop-buy">${side ? `<span class="gx-bk-side">${side}</span>` : ''}<b style="font-size:${fit(lit?.name ?? '', 150, 22, 15, 0.5)}px">${esc(onGood && lit ? lit.name : '')}</b><span>${onGood && lit ? `In your Bag: ${lit.have}${d.pocket ? ` · ${esc(d.pocket)}` : ''}` : ''}</span><div class="bk-t">${d.buy.map((b) => `<div class="btn sm${b.on ? ' on' : ''}${b.dim ? ' gx-dim' : ''}"${act(b.act)}><b>${esc(b.label)}</b></div>`).join('')}</div></div>`;
  const ks: PkKey[] = [['←→↑↓', 'shelf'], ['Enter', d.basket ? 'add to basket' : 'buy']];
  const out = d.extras.findIndex((t) => t.startsWith('Checkout'));
  if (d.basket && out >= 0) ks.push(['C', 'check out', 'pick', n + out]);
  ks.push(['Esc', 'leave']);
  return page('shop', 26, `<div class="scr shop sh11 gx-shop">${hdr(d.title, { area: 'town', crumb: d.crumb, pills })}<div class="shelf" data-key="shop-shelf">${goods}</div>`
    + `<div class="sh-keep${d.keeper ? ' gx-mon' : ''}" data-key="shop-keeper">${keeperArt(d, 212)}</div><i class="sh-counter"></i>${d.nextStock ? `<i class="gx-stock">${esc(d.nextStock)}</i>` : ''}${panel}`
    + said(d, d.text) + keys(ks) + (d.ask ? `<div class="gx-over">${pkConfirm({ title: d.ask.title, body: '', options: d.ask.options, index: d.ask.index })}</div>` : '') + '</div>');
}

/** Check Out: the receipt, the money before and after, and the clerk's question with Pay and Keep shopping. */
export function pkShopPay(d: PkShopModel): string {
  const lines = d.basket ?? [], total = lines.reduce((sum, l) => sum + l.total, 0), ask = d.ask!;
  const rows = lines.slice(0, 5).map((l) => `<p><i>${fitPic(pkArtOf(l.art) ?? ballArt('pb'), 32, 32, '', 1)}</i><span>${esc(l.name)}${l.saving ? ` <small class="gx-save">−${money(l.saving)}</small>` : ''}</span><u>×${l.count}</u><em>${money(l.total)}</em></p>`).join('');
  const more = lines.length > 5 ? `<p class="gx-more"><span>…and ${lines.length - 5} more</span></p>` : '';
  const after = d.money - total;
  return page('shop-pay', 26, `<div class="scr shop sh11 pay gx-shop">${hdr('Check Out', { area: 'town', crumb: [d.title, 'Check Out'], pills: [d.clock, money(d.money)] })}`
    + `<div class="receipt" data-key="shop-receipt"><b>Receipt</b>${rows}${more}<p class="tot"><span>Total</span><em>${money(total)}</em></p><div class="rc-after"><span>Your money</span><b>${money(d.money)}</b><i>→</i><b class="${after < 0 ? 'gx-bad' : 'new'}">${money(after)}</b></div></div>`
    + `<div class="sh-keep${d.keeper ? ' gx-mon' : ''}">${keeperArt(d, 212)}</div><i class="sh-counter"></i>`
    + `<div class="pay-btns" data-key="shop-pay">${ask.options.map((o, k) => `<div class="btn${k === ask.index ? ' on' : ''}"${act('confirm', k, 'confirmOver')}><b>${esc(o)}</b></div>`).join('')}</div>`
    + said(d, ask.title) + keys([['↑↓', 'move'], ['Enter', 'choose', 'confirm', ask.index], ['Esc', 'keep shopping', 'confirm', ask.options.length - 1]]) + '</div>');
}
