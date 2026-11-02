// PokéNet Shop (mock-up 10, PokéNet Web Store): a mid-2000s web store in a glossy browser window on an
// Aero desktop. A marquee scrolls today's deal; category tabs light up for the focused good (click one to
// jump there); the Deal of the Day banner sits on the left; product cards with "Buy now" fill the page.
// A buy flies the item into the cart in the address bar. Mouse: hover focuses, click buys.
import Phaser from 'phaser';
import { fitBlock, fitLine } from '../fitText';
import { itemVisual } from '../sprites';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../theme';
import type { ShopRow, ShopView } from '../shopLook';
import { categories, categoryColor, countMoney, gridMove, hex, iconFit, partyStrip, plusOne, popIn, priceText, rowTag } from './common';
import type { ShopLayout } from './types';

const WIN = { x: 14, y: 8, w: GAME_WIDTH - 28, h: GAME_HEIGHT - 16 };
const COLS = 3;
const CARD = { w: 204, h: 96, gap: 8 };
const GRID = { x: 290, y: 150, rows: 3 };
const HERO = { x: 30, y: 150, w: 246, h: 304 };
const INK = '#1a2a4a';
const LINK = 0x1a5ad8;

export const pokenet: ShopLayout = (ctx, hooks) => {
  const { scene, motion } = ctx;
  let view = ctx.view;
  let cart = 0;

  // Aero desktop behind the window.
  const desk = scene.add.graphics().setDepth(-60);
  desk.fillGradientStyle(0x3a9ae8, 0x3a9ae8, 0x9ae07a, 0x9ae07a, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  for (let k = 0; k < 5; k++) desk.fillStyle(0xffffff, 0.08).fillEllipse(120 + k * 190, 460 - (k % 2) * 60, 420, 120);

  // The browser window: glass title bar, address bar with the cart and wallet.
  const win = scene.add.graphics();
  win.fillStyle(0x000000, 0.25).fillRoundedRect(WIN.x + 4, WIN.y + 6, WIN.w, WIN.h, 10);
  win.fillGradientStyle(0xd8ecff, 0xd8ecff, 0x8ec0ec, 0x8ec0ec, 1).fillRoundedRect(WIN.x, WIN.y, WIN.w, 34, { tl: 10, tr: 10, bl: 0, br: 0 });
  win.fillStyle(0xffffff, 1).fillRect(WIN.x, WIN.y + 34, WIN.w, WIN.h - 34);
  win.lineStyle(2, 0x5a8ac0, 1).strokeRoundedRect(WIN.x, WIN.y, WIN.w, WIN.h, 10);
  [0xf05a4a, 0xffc23a, 0x4ac05a].forEach((c, k) => win.fillStyle(c, 1).fillCircle(WIN.x + WIN.w - 20 - k * 22, WIN.y + 17, 7));
  scene.add.text(WIN.x + 14, WIN.y + 17, `${ctx.title}  -  PokéNet Explorer`, textStyle(16, INK)).setOrigin(0, 0.5).setName('shop-title');
  win.fillStyle(0xeef4fb, 1).fillRect(WIN.x + 2, WIN.y + 34, WIN.w - 4, 36);
  win.fillStyle(0xffffff, 1).fillRoundedRect(WIN.x + 60, WIN.y + 40, 470, 24, 12).lineStyle(1, 0x9ab4d0, 1).strokeRoundedRect(WIN.x + 60, WIN.y + 40, 470, 24, 12);
  scene.add.text(WIN.x + 22, WIN.y + 52, '◀ ▶', textStyle(16, '#5a8ac0')).setOrigin(0, 0.5);
  scene.add.text(WIN.x + 74, WIN.y + 52, 'http://www.pokenet.shop/store', textStyle(16, '#3a5a7a')).setOrigin(0, 0.5);
  fitLine(scene.add.text(WIN.x + 544, WIN.y + 52, ctx.clock, textStyle(16, '#6a7a9a')).setOrigin(0, 0.5), 150, 10);
  const cartIcon = scene.add.container(WIN.x + WIN.w - 190, WIN.y + 52).setName('shop-cart');
  const cartG = scene.add.graphics();
  cartG.lineStyle(3, 0x1a5ad8, 1).strokeRect(-12, -8, 22, 12).lineBetween(-16, -12, -12, -8);
  cartG.fillStyle(0x1a5ad8, 1).fillCircle(-8, 8, 3).fillCircle(6, 8, 3);
  const cartCount = scene.add.text(14, -12, '', textStyle(16, '#ffffff', { backgroundColor: '#e03a4a', padding: { x: 3, y: 0 } })).setOrigin(0, 0.5);
  cartIcon.add([cartG, cartCount]);
  const money = scene.add.text(WIN.x + WIN.w - 18, WIN.y + 52, `₽${view.money}`, textStyle(24, '#1a7a3a')).setOrigin(1, 0.5).setName('shop-money');

  // Marquee: today's deal and the news, scrolling right to left.
  const deal = view.rows.find((r) => r.deal);
  const news = [
    deal ? `★ DEAL OF THE DAY: ${deal.name} for ${priceText(deal)}!` : '★ Welcome to the PokéNet Shop!',
    '★ Delivered straight to your Bag!',
    view.rows.some((r) => r.early) ? '★ Members get stock early!' : null,
    view.nextStock ? `★ ${view.nextStock}` : null,
  ].filter(Boolean).join('     ');
  const bar = scene.add.graphics();
  bar.fillGradientStyle(0x1a3a8a, 0x1a3a8a, 0x2a5ac8, 0x2a5ac8, 1).fillRect(WIN.x + 2, WIN.y + 72, WIN.w - 4, 26);
  const marquee = scene.add.text(WIN.x + WIN.w, WIN.y + 85, news, textStyle(16, '#ffe85a')).setOrigin(0, 0.5).setName('shop-marquee');
  marquee.setMask(scene.make.graphics({}, false).fillRect(WIN.x + 2, WIN.y + 72, WIN.w - 4, 26).createGeometryMask());
  if (motion === 'off') marquee.setX(WIN.x + 12);
  else scene.tweens.add({ targets: marquee, x: WIN.x - marquee.width, duration: (marquee.width + WIN.w) * (motion === 'full' ? 14 : 28), repeat: -1 });

  // Category tabs.
  const cats = categories(view.rows);
  let tabX = GRID.x;
  const tabs = cats.map((word) => {
    const t = scene.add.text(tabX + 12, 122, word, textStyle(16, INK)).setOrigin(0, 0.5);
    const w = t.width + 24;
    const g = scene.add.graphics();
    scene.add.zone(tabX, 108, w, 28).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerdown', () => hooks.focus(view.rows.findIndex((r) => r.pocket.word === word)));
    const tab = { word, g, t, x: tabX, w };
    tabX += w + 4;
    t.setDepth(1);
    return tab;
  }).filter((t) => t.x + t.w < WIN.x + WIN.w - 10);
  const paintTabs = (row: ShopRow | undefined) => {
    for (const t of tabs) {
      const on = row?.pocket.word === t.word;
      t.g.clear().fillStyle(on ? 0xffffff : 0xdfe9f5, 1).fillRoundedRect(t.x, 108, t.w, 30, { tl: 8, tr: 8, bl: 0, br: 0 });
      t.g.lineStyle(1, 0x9ab4d0, 1).strokeRoundedRect(t.x, 108, t.w, 30, { tl: 8, tr: 8, bl: 0, br: 0 });
      t.t.setColor(on ? hex(LINK) : INK);
    }
  };
  scene.add.graphics().fillStyle(0x9ab4d0, 1).fillRect(WIN.x + 2, 138, WIN.w - 4, 1);

  // Deal of the Day banner (clicking it buys the deal).
  const hero = scene.add.container(HERO.x, HERO.y).setName('shop-deal');
  const heroG = scene.add.graphics();
  heroG.fillGradientStyle(0xff5ad8, 0xffa05a, 0xffd85a, 0xff7ab0, 1).fillRoundedRect(0, 0, HERO.w, HERO.h, 14);
  heroG.fillStyle(0xffffff, 0.28).fillRoundedRect(6, 6, HERO.w - 12, HERO.h / 2 - 10, 10);
  hero.add([heroG, scene.add.text(HERO.w / 2, 26, 'DEAL OF THE DAY', textStyle(24, '#ffffff', { stroke: '#c02a7a', strokeThickness: 5 })).setOrigin(0.5)]);
  const dealIndex = view.rows.findIndex((r) => r.deal);
  if (deal) {
    const icon = itemVisual(scene, deal.iconAssetId, HERO.w / 2, 112, 2);
    if ('setScale' in icon) (icon as Phaser.GameObjects.Image).setScale(iconFit(icon, 88));
    const name = fitLine(scene.add.text(HERO.w / 2, 182, deal.name, textStyle(24, '#ffffff', { stroke: '#7a2a5a', strokeThickness: 4 })).setOrigin(0.5), HERO.w - 20, 12);
    const was = scene.add.text(HERO.w / 2, 218, deal.wasPrice ? `was ₽${deal.wasPrice}` : 'today only', textStyle(16, '#7a2a5a')).setOrigin(0.5);
    const now = scene.add.text(HERO.w / 2, 248, priceText(deal), textStyle(32, '#ffffff', { stroke: '#c02a2a', strokeThickness: 6 })).setOrigin(0.5);
    const btn = scene.add.text(HERO.w / 2, 282, ' Buy now ', textStyle(16, '#ffffff', { backgroundColor: '#1a5ad8', padding: { x: 8, y: 2 } })).setOrigin(0.5);
    hero.add([icon, name, was, now, btn]);
    if (motion === 'full' && 'setAngle' in icon) scene.tweens.add({ targets: icon, y: 104, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    hero.setSize(HERO.w, HERO.h).setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(0, 0, HERO.w, HERO.h), hitAreaCallback: Phaser.Geom.Rectangle.Contains });
    hero.on('pointerover', () => hooks.focus(dealIndex)).on('pointerdown', () => hooks.pick(dealIndex));
  } else hero.add(scene.add.text(HERO.w / 2, HERO.h / 2, 'No deal today.\nCheck back next stop!', textStyle(16, '#ffffff', { align: 'center' })).setOrigin(0.5));
  const heroRing = scene.add.graphics();

  // Product cards (scroll by row).
  const grid = scene.add.container(0, 0);
  grid.setMask(scene.make.graphics({}, false).fillRect(GRID.x - 6, GRID.y - 6, COLS * (CARD.w + CARD.gap) + 8, GRID.rows * (CARD.h + CARD.gap) + 4).createGeometryMask());
  let cards: { box: Phaser.GameObjects.Container; g: Phaser.GameObjects.Graphics; btn: Phaser.GameObjects.Text; icon: Phaser.GameObjects.GameObject | null }[] = [];
  let top = 0;
  const cellPos = (i: number) => ({ x: GRID.x + (i % COLS) * (CARD.w + CARD.gap), y: GRID.y + Math.floor(i / COLS) * (CARD.h + CARD.gap) });
  const paintCard = (g: Phaser.GameObjects.Graphics, on: boolean) => {
    g.clear();
    if (on) g.fillStyle(LINK, 0.18).fillRoundedRect(-4, -4, CARD.w + 8, CARD.h + 8, 12);
    g.fillStyle(on ? 0xf4f9ff : 0xffffff, 1).fillRoundedRect(0, 0, CARD.w, CARD.h, 8);
    g.lineStyle(on ? 2 : 1, on ? LINK : 0xc9d6e6, 1).strokeRoundedRect(0, 0, CARD.w, CARD.h, 8);
  };
  const build = (entrance: boolean) => {
    grid.removeAll(true);
    cards = [];
    const card = (i: number, draw: (box: Phaser.GameObjects.Container) => { btn: Phaser.GameObjects.Text; icon: Phaser.GameObjects.GameObject | null }, name: string) => {
      const { x, y } = cellPos(i);
      const box = scene.add.container(x, y).setName(name);
      const g = scene.add.graphics();
      paintCard(g, false);
      box.add(g);
      const parts = draw(box);
      box.setSize(CARD.w, CARD.h).setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(0, 0, CARD.w, CARD.h), hitAreaCallback: Phaser.Geom.Rectangle.Contains });
      box.on('pointerover', () => hooks.focus(i)).on('pointerdown', () => hooks.pick(i));
      grid.add(box);
      cards.push({ box, g, ...parts });
      if (entrance) popIn(ctx, box, Math.min(i, 9) * 30);
    };
    view.rows.forEach((row, i) => card(i, (box) => {
      const icon = itemVisual(scene, row.iconAssetId, 34, CARD.h / 2 - 6, 2);
      if ('setScale' in icon) (icon as Phaser.GameObjects.Image).setScale(iconFit(icon, 48));
      const name = fitLine(scene.add.text(68, 18, row.label, textStyle(16, hex(LINK))).setOrigin(0, 0.5), CARD.w - 76, 10);
      const price = scene.add.text(68, 44, priceText(row), textStyle(16, row.affordable ? (row.deal || row.sale ? '#d02a4a' : INK) : '#e05050')).setOrigin(0, 0.5).setName('shop-price');
      if (row.wasPrice) box.add(scene.add.text(68 + price.width + 8, 44, `₽${row.wasPrice}`, textStyle(16, '#9aa6b4')).setOrigin(0, 0.5));
      const btn = scene.add.text(CARD.w - 10, CARD.h - 16, ' Buy now ', textStyle(16, '#ffffff', { backgroundColor: '#f0a020', padding: { x: 4, y: 1 } })).setOrigin(1, 0.5);
      box.add([icon, name, price, btn, scene.add.rectangle(0, 0, 4, CARD.h, categoryColor(row)).setOrigin(0)]);
      const tag = rowTag(row);
      if (tag) box.add(scene.add.text(8, CARD.h - 16, tag.text, textStyle(16, '#ffffff', { backgroundColor: hex(tag.color), padding: { x: 3, y: 0 } })).setOrigin(0, 0.5));
      else if (row.owned > 0) box.add(scene.add.text(8, CARD.h - 16, `Own ${row.owned}`, textStyle(16, '#6a7a9a')).setOrigin(0, 0.5));
      return { btn, icon };
    }, 'shop-tile'));
    if (view.canSell) card(view.rows.length, (box) => {
      box.add(scene.add.text(CARD.w / 2, 36, '₽', textStyle(32, '#f0a020')).setOrigin(0.5));
      const btn = scene.add.text(CARD.w / 2, 72, 'Sell items…', textStyle(16, hex(LINK))).setOrigin(0.5);
      box.add(btn);
      return { btn, icon: null };
    }, 'shop-sell');
  };

  // Status bar: party and what the focused good does.
  const status = scene.add.graphics();
  status.fillStyle(0xeef4fb, 1).fillRect(WIN.x + 2, 462, WIN.w - 4, WIN.y + WIN.h - 464);
  status.lineStyle(1, 0x9ab4d0, 1).lineBetween(WIN.x + 2, 462, WIN.x + WIN.w - 2, 462);
  const party = partyStrip(ctx, 50, 494, { gap: 34 });
  const hint = scene.add.text(262, 494, ctx.notice ?? '', textStyle(16, INK, { wordWrap: { width: GAME_WIDTH - 300 }, lineSpacing: 2 })).setOrigin(0, 0.5).setName('shop-hint');

  let current = -1;
  const focus = (i: number) => {
    const prev = cards[current];
    if (prev) {
      paintCard(prev.g, false);
      scene.tweens.killTweensOf(prev.box);
      prev.box.setScale(1);
    }
    current = i;
    heroRing.clear();
    const c = cards[i];
    const r = view.rows[i];
    paintTabs(r);
    party.show(r ?? null);
    fitBlock(hint, GAME_WIDTH - 300, 52, r ? r.hint : 'Sell items from your Bag. The shop pays half the price.');
    if (r?.deal) heroRing.lineStyle(4, 0x1a5ad8, 1).strokeRoundedRect(HERO.x - 4, HERO.y - 4, HERO.w + 8, HERO.h + 8, 16);
    if (!c) return;
    paintCard(c.g, true);
    if (motion !== 'off') scene.tweens.add({ targets: c.box, scale: 1.03, duration: motion === 'full' ? 160 : 60, ease: 'Back.easeOut' });
    const row = Math.floor(i / COLS);
    if (row < top) top = row;
    if (row >= top + GRID.rows) top = row - GRID.rows + 1;
    const y = -top * (CARD.h + CARD.gap);
    if (motion === 'off') grid.y = y;
    else scene.tweens.add({ targets: grid, y, duration: 180, ease: 'Cubic.easeOut' });
  };

  build(true);
  return {
    move: (action, from) => gridMove(action, from, view.rows.length + (view.canSell ? 1 : 0), COLS),
    focus,
    refresh(next: ShopView, bought, message) {
      const before = view.money;
      view = next;
      const keep = current;
      current = -1;
      build(false);
      countMoney(ctx, money, before, view.money);
      focus(Math.min(keep, cards.length - 1));
      if (message) fitBlock(hint, GAME_WIDTH - 300, 52, message);
      if (bought === null || !cards[bought]) return;
      cart++;
      cartCount.setText(String(cart));
      const c = cards[bought]!;
      const row = view.rows[bought]!;
      const from = { x: c.box.x + 34, y: c.box.y + grid.y + CARD.h / 2 };
      const done = () => {
        if (motion !== 'off') scene.tweens.add({ targets: cartIcon, scale: 1.3, duration: 90, yoyo: true });
        plusOne(ctx, cartIcon.x, cartIcon.y + 24);
      };
      if (motion === 'off') return done();
      const fly = itemVisual(scene, row.iconAssetId, from.x, from.y, 2) as Phaser.GameObjects.Image;
      if ('setScale' in fly) fly.setScale(iconFit(fly, 40));
      fly.setDepth(30);
      scene.tweens.add({ targets: fly, x: cartIcon.x, y: cartIcon.y, scale: 0.5, duration: motion === 'full' ? 420 : 160, ease: 'Cubic.easeIn', onComplete: () => { fly.destroy(); done(); } });
    },
  };
};
