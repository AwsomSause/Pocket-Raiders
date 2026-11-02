// Supply Depot (mock-up 05, Basket & Register): a warehouse with metal shelves of balls and medicine.
// Picking a good puts it in the basket (nothing is bought yet); the basket on the clipboard shows each
// line with its bulk discount (5 or more of one item), and Checkout rings it all up at the register,
// which prints a receipt. Back empties the basket first. Mouse: hover focuses, click adds.
import Phaser from 'phaser';
import { fitBlock, fitLine } from '../fitText';
import { itemVisual } from '../sprites';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../theme';
import type { ShopView } from '../shopLook';
import { countMoney, gridMove, iconFit, partyStrip, plusOne } from './common';
import { mat } from './stall';
import type { BasketLine, ShopLayout } from './types';

const COLS = 5;
const SHELF = { x: 28, y: 132, w: 566, rowH: 112, rows: 3 };
const PANEL = { x: 608, y: 76, w: 336, h: 384 };
const BTN = { x: PANEL.x + 18, w: PANEL.w - 36, checkoutY: PANEL.y + 300, emptyY: PANEL.y + 346 };
const INFO_Y = 470;
const INK = '#2a2f3a';

export const depot: ShopLayout = (ctx, hooks) => {
  const { scene, content, motion } = ctx;
  let view = ctx.view;
  const bulk = content.balance.shopTypes?.depot;

  // Warehouse: concrete wall with panel seams, a hazard-striped header.
  const wall = scene.add.graphics().setDepth(-60);
  wall.fillGradientStyle(0xc9d2dc, 0xc9d2dc, 0x9aa6b4, 0x9aa6b4, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  for (let x = 0; x < GAME_WIDTH; x += 120) wall.fillStyle(0x7a8696, 0.25).fillRect(x, 0, 2, GAME_HEIGHT);
  const head = scene.add.graphics();
  head.fillStyle(0x2a2f3a, 1).fillRect(0, 0, GAME_WIDTH, 60);
  for (let x = -40, k = 0; x < GAME_WIDTH + 40; x += 28, k++) head.fillStyle(k % 2 ? 0xffc21a : 0x2a2f3a, 1).fillTriangle(x, 60, x + 14, 60, x + 28, 68).fillTriangle(x, 60, x + 14, 68, x + 28, 68);
  scene.add.text(22, 30, ctx.title.toUpperCase(), textStyle(32, '#ffc21a', { stroke: '#000000', strokeThickness: 4 })).setOrigin(0, 0.5).setName('shop-title');
  fitLine(scene.add.text(330, 30, ctx.clock, textStyle(16, '#c9d2dc')).setOrigin(0, 0.5), 240, 12);
  const moneyBg = scene.add.graphics();
  moneyBg.fillStyle(0x111419, 1).fillRoundedRect(GAME_WIDTH - 186, 12, 170, 36, 6).lineStyle(2, 0xffc21a, 1).strokeRoundedRect(GAME_WIDTH - 186, 12, 170, 36, 6);
  const money = scene.add.text(GAME_WIDTH - 101, 30, `₽${view.money}`, textStyle(24, '#7af0a0')).setOrigin(0.5).setName('shop-money');

  // Shelves: three metal planks with uprights, then the goods on them.
  const shelves = scene.add.graphics();
  for (let r = 0; r < SHELF.rows; r++) {
    const y = SHELF.y + r * SHELF.rowH + 54;
    shelves.fillStyle(0x5a6676, 1).fillRect(SHELF.x - 8, y, SHELF.w + 16, 10);
    shelves.fillStyle(0x8a96a6, 1).fillRect(SHELF.x - 8, y, SHELF.w + 16, 3);
  }
  shelves.fillStyle(0x4a5666, 1).fillRect(SHELF.x - 14, 84, 8, 380).fillRect(SHELF.x + SHELF.w + 6, 84, 8, 380);
  const goods = mat(ctx, hooks, { ...SHELF, columns: COLS }, { tag: 0xfff27a, tagText: '#3a2f10', glow: 0xffc21a });

  // The clipboard: basket lines, bulk note, total, Checkout and Empty buttons.
  const board = scene.add.graphics();
  board.fillStyle(0x8a5a30, 1).fillRoundedRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 12);
  board.fillStyle(0xfdfcf6, 1).fillRoundedRect(PANEL.x + 10, PANEL.y + 16, PANEL.w - 20, PANEL.h - 26, 6);
  for (let y = PANEL.y + 64; y < PANEL.y + 280; y += 30) board.fillStyle(0xbcd6f0, 0.6).fillRect(PANEL.x + 18, y, PANEL.w - 36, 1);
  board.fillStyle(0xb0b8c4, 1).fillRoundedRect(PANEL.x + PANEL.w / 2 - 40, PANEL.y - 6, 80, 22, 6);
  scene.add.text(PANEL.x + 20, PANEL.y + 40, 'BASKET', textStyle(24, INK)).setOrigin(0, 0.5);
  const tally = scene.add.text(PANEL.x + PANEL.w - 20, PANEL.y + 40, '', textStyle(16, '#6a7a8a')).setOrigin(1, 0.5).setName('shop-basket-count');
  const lineBox = scene.add.container(0, 0).setName('shop-basket');
  const note = scene.add.text(PANEL.x + 20, PANEL.y + 252, bulk ? `Bulk: ${bulk.bulkMin}+ of one item = ${Math.round(bulk.bulkDiscount * 100)}% off` : '', textStyle(16, '#2a8a4a')).setOrigin(0, 0.5);
  fitLine(note, PANEL.w - 40, 10);
  const totalText = scene.add.text(PANEL.x + PANEL.w - 20, PANEL.y + 278, '', textStyle(24, INK)).setOrigin(1, 0.5).setName('shop-basket-total');
  scene.add.text(PANEL.x + 20, PANEL.y + 278, 'Total', textStyle(16, '#6a7a8a')).setOrigin(0, 0.5);
  const btnG = scene.add.graphics();
  const checkoutText = scene.add.text(BTN.x + BTN.w / 2, BTN.checkoutY + 20, 'CHECKOUT', textStyle(24, '#ffffff')).setOrigin(0.5).setName('shop-checkout');
  const emptyText = scene.add.text(BTN.x + BTN.w / 2, BTN.emptyY + 13, 'Empty basket', textStyle(16, '#6a4a4a')).setOrigin(0.5);
  const sellIndex = () => (view.canSell ? view.rows.length : -1);
  const checkoutIndex = () => view.rows.length + (view.canSell ? 1 : 0);
  scene.add.zone(BTN.x, BTN.checkoutY, BTN.w, 40).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerover', () => hooks.focus(checkoutIndex())).on('pointerdown', () => hooks.pick(checkoutIndex()));
  scene.add.zone(BTN.x, BTN.emptyY, BTN.w, 26).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerover', () => hooks.focus(checkoutIndex() + 1)).on('pointerdown', () => hooks.pick(checkoutIndex() + 1));

  // Sell: a crate by the door (bottom left of the header strip).
  const sellG = scene.add.graphics();
  if (view.canSell) {
    scene.add.text(GAME_WIDTH - 286, 30, 'Sell items…', textStyle(16, '#ffc21a')).setOrigin(0.5).setName('shop-sell').setDepth(1);
    scene.add.zone(GAME_WIDTH - 350, 12, 128, 36).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerover', () => hooks.focus(sellIndex())).on('pointerdown', () => hooks.pick(sellIndex()));
  }

  // Info strip: the party and what the focused good does.
  const info = scene.add.graphics();
  info.fillStyle(0x2a2f3a, 0.92).fillRoundedRect(12, INFO_Y, GAME_WIDTH - 24, 60, 10);
  const party = partyStrip(ctx, 44, INFO_Y + 30, { gap: 34 });
  const hint = scene.add.text(258, INFO_Y + 30, ctx.notice ?? '', textStyle(16, '#e8eef6', { wordWrap: { width: GAME_WIDTH - 290 }, lineSpacing: 2 })).setOrigin(0, 0.5).setName('shop-hint');

  let lines: readonly BasketLine[] = [];
  let current = -1;
  const paintButtons = () => {
    const c = checkoutIndex();
    btnG.clear();
    if (view.canSell) {
      btnG.fillStyle(current === sellIndex() ? 0x4a5466 : 0x111419, 1).fillRoundedRect(GAME_WIDTH - 350, 12, 128, 36, 6);
      btnG.lineStyle(2, current === sellIndex() ? 0xffffff : 0xffc21a, 1).strokeRoundedRect(GAME_WIDTH - 350, 12, 128, 36, 6);
    }
    const ready = lines.length > 0;
    btnG.fillStyle(current === c ? 0x2ad06a : ready ? 0x1fa050 : 0x9aa6b4, 1).fillRoundedRect(BTN.x, BTN.checkoutY, BTN.w, 40, 10);
    if (current === c) btnG.lineStyle(3, 0xffc21a, 1).strokeRoundedRect(BTN.x - 3, BTN.checkoutY - 3, BTN.w + 6, 46, 12);
    btnG.fillStyle(current === c + 1 ? 0xf8d8d0 : 0xf2ece4, 1).fillRoundedRect(BTN.x, BTN.emptyY, BTN.w, 26, 8);
    if (current === c + 1) btnG.lineStyle(2, 0xc04030, 1).strokeRoundedRect(BTN.x, BTN.emptyY, BTN.w, 26, 8);
    checkoutText.setAlpha(ready ? 1 : 0.7);
    emptyText.setAlpha(ready ? 1 : 0.5);
  };
  const drawLines = () => {
    lineBox.removeAll(true);
    const shown = lines.slice(0, 6);
    shown.forEach((l, k) => {
      const y = PANEL.y + 80 + k * 30;
      const icon = itemVisual(scene, l.iconAssetId, PANEL.x + 34, y, 1);
      if ('setScale' in icon) (icon as Phaser.GameObjects.Image).setScale(iconFit(icon, 24));
      const name = fitLine(scene.add.text(PANEL.x + 54, y, `${l.name} ×${l.count}`, textStyle(16, INK)).setOrigin(0, 0.5), 170, 10);
      const price = scene.add.text(PANEL.x + PANEL.w - 20, y, l.saving > 0 ? `₽${l.total} -₽${l.saving}` : `₽${l.total}`, textStyle(16, l.saving > 0 ? '#2a8a4a' : INK)).setOrigin(1, 0.5);
      lineBox.add([icon, name, price]);
    });
    if (lines.length > shown.length) lineBox.add(scene.add.text(PANEL.x + 54, PANEL.y + 80 + 6 * 30, `+${lines.length - shown.length} more`, textStyle(16, '#6a7a8a')).setOrigin(0, 0.5));
    if (lines.length === 0) lineBox.add(scene.add.text(PANEL.x + PANEL.w / 2, PANEL.y + 150, 'Empty. Pick goods off\nthe shelves to add them.', textStyle(16, '#9aa6b4', { align: 'center' })).setOrigin(0.5));
    const items = lines.reduce((n, l) => n + l.count, 0);
    tally.setText(items ? `${items} item${items === 1 ? '' : 's'}` : '');
    totalText.setText(`₽${lines.reduce((n, l) => n + l.total, 0)}`);
    paintButtons();
  };
  drawLines();

  // The register rings and a receipt slides out over the clipboard, then tears off.
  const receipt = (message: string) => {
    const box = scene.add.container(PANEL.x + PANEL.w / 2, PANEL.y + 40).setDepth(20).setName('shop-receipt');
    const h = 120;
    const paper = scene.add.graphics();
    paper.fillStyle(0xffffff, 1).fillRect(-120, 0, 240, h).lineStyle(1, 0xc9d2dc, 1).strokeRect(-120, 0, 240, h);
    for (let x = -120; x < 120; x += 12) paper.fillStyle(0xffffff, 1).fillTriangle(x, h, x + 12, h, x + 6, h + 8);
    const t = scene.add.text(0, 12, 'SUPPLY DEPOT  ·  RECEIPT', textStyle(16, '#6a7a8a')).setOrigin(0.5, 0);
    const body = fitBlock(scene.add.text(0, 40, '', textStyle(16, INK, { align: 'center', wordWrap: { width: 220 } })).setOrigin(0.5, 0), 220, 70, message);
    box.add([paper, t, body]);
    const ka = scene.add.text(BTN.x + BTN.w / 2, BTN.checkoutY - 16, 'KA-CHING!', textStyle(24, '#ffc21a', { stroke: '#2a2f3a', strokeThickness: 5 })).setOrigin(0.5).setDepth(21);
    if (motion === 'off') {
      scene.time.delayedCall(1400, () => { box.destroy(); ka.destroy(); });
      return;
    }
    box.setScale(1, 0);
    scene.tweens.add({ targets: box, scaleY: 1, duration: motion === 'full' ? 420 : 140, ease: 'Cubic.easeOut' });
    scene.tweens.add({ targets: ka, y: ka.y - 20, scale: { from: 0.6, to: 1.15 }, duration: 260, yoyo: true, hold: 300, onComplete: () => ka.destroy() });
    scene.tweens.add({ targets: box, y: box.y - 30, alpha: 0, angle: 6, delay: 1600, duration: 300, onComplete: () => box.destroy() });
    plusOne(ctx, BTN.x + BTN.w / 2, BTN.checkoutY - 40);
  };

  const focus = (i: number) => {
    current = i;
    goods.focus(i < view.rows.length ? i : -1);
    paintButtons();
    const r = view.rows[i];
    party.show(r ?? null);
    const c = checkoutIndex();
    const text = r
      ? `${r.hint}${(lines.find((l) => l.itemId === r.itemId)?.count ?? 0) > 0 ? `  ·  ${lines.find((l) => l.itemId === r.itemId)!.count} in the basket` : ''}`
      : i === c ? 'Pay for everything in the basket at once.' : i === c + 1 ? 'Put everything back on the shelves.' : 'Sell items from your Bag.';
    fitBlock(hint, GAME_WIDTH - 290, 52, text);
  };

  return {
    move(action, from) {
      const n = view.rows.length;
      const c = checkoutIndex();
      // On the right: Sell (top), Checkout, Empty; Left goes back to the shelves.
      if (from >= n) {
        if (action === 'left') return Math.max(0, Math.min(n - 1, COLS - 1));
        if (action === 'up') return from === c + 1 ? c : from === c && view.canSell ? sellIndex() : from;
        if (action === 'down') return from === sellIndex() ? c : from === c ? c + 1 : from;
        return from;
      }
      if (action === 'right' && (from % COLS === COLS - 1 || from === n - 1)) return c;
      return gridMove(action, from, n, COLS);
    },
    focus,
    refresh(next: ShopView, bought, message) {
      const before = view.money;
      view = next;
      goods.rebuild(view.rows);
      countMoney(ctx, money, before, view.money);
      const keep = current;
      current = -1;
      focus(keep);
      if (message) fitBlock(hint, GAME_WIDTH - 290, 52, message);
      if (bought !== null) plusOne(ctx, goods.at(bought).x, goods.at(bought).y - 40);
    },
    basket(nextLines, message, rang) {
      const added = nextLines.reduce((n, l) => n + l.count, 0) > lines.reduce((n, l) => n + l.count, 0);
      lines = nextLines;
      drawLines();
      if (message) fitBlock(hint, GAME_WIDTH - 290, 52, message);
      if (rang && message) receipt(message);
      // A good hops from the shelf into the basket.
      if (added && motion !== 'off' && current >= 0 && current < view.rows.length) {
        const at = goods.at(current);
        const row = view.rows[current]!;
        const fly = itemVisual(scene, row.iconAssetId, at.x, at.y, 2) as Phaser.GameObjects.Image;
        if ('setScale' in fly) fly.setScale(iconFit(fly, 40));
        fly.setDepth(30);
        scene.tweens.add({ targets: fly, x: PANEL.x + 40, y: PANEL.y + 40, scale: 0.6, duration: motion === 'full' ? 380 : 160, ease: 'Cubic.easeIn', onComplete: () => fly.destroy() });
        if (motion === 'full') scene.tweens.add({ targets: board, y: 3, duration: 80, yoyo: true, delay: 360 });
      }
    },
  };
};
