// Night Market (mock-up 12): a lantern-lit alley after dark, run by Meowth and Persian. Shops turn into
// it at night (after-hours prices) and wherever Giovanni's Black Market runs; it also sells a couple of
// mystery rare goods no Mart lists, under a purple curtain. Lanterns sway; Meowth flips a coin on a buy.
import Phaser from 'phaser';
import { fitBlock, fitLine } from '../fitText';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../theme';
import type { ShopRow, ShopView } from '../shopLook';
import { countMoney, gridMove, partyStrip, plusOne, priceText } from './common';
import { backdrop, keeper, mat, speech } from './stall';
import type { ShopLayout } from './types';

const COLS = 7;
const MAT = { x: 40, y: 310, w: 620 };
const CURTAIN = { x: 684, y: 96, w: 260, h: 300 };

function patter(row: ShopRow | undefined): string {
  if (!row) return 'Meowth! Selling? We pay cash, no questions.';
  if (row.mystery) return `Psst... the ${row.name}. You won't find that in any Mart. ${priceText(row)}.`;
  if (row.black) return `Black market ${row.name}. Badges? Who needs badges! ${priceText(row)}.`;
  if (!row.affordable) return `${priceText(row)} for the ${row.name}. Come back with more coin, meowth!`;
  return `The ${row.name}, ${priceText(row)}. After-hours prices, but the goods are hot!`;
}

export const night: ShopLayout = (ctx, hooks) => {
  const { scene, motion } = ctx;
  let view = ctx.view;
  scene.add.graphics().setDepth(-60).fillGradientStyle(0x140a3a, 0x140a3a, 0x3a1a4a, 0x3a1a4a, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  backdrop(ctx, 'pack.memories.eventbg.city_night');
  scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a0a3a, 0.45).setOrigin(0);

  // Lantern string across the top.
  const wire = scene.add.graphics();
  wire.lineStyle(2, 0x111111, 1).beginPath().moveTo(0, 18);
  for (let x = 0; x <= GAME_WIDTH; x += 40) wire.lineTo(x, 18 + Math.sin(x / 120) * 8);
  wire.strokePath();
  for (let k = 0; k < 9; k++) {
    const x = 40 + k * 110;
    const lantern = scene.add.container(x, 24 + Math.sin(x / 120) * 8);
    const glow = scene.add.circle(0, 22, 30, 0xff9a3a, 0.22);
    const body = scene.add.ellipse(0, 22, 26, 34, k % 3 === 2 ? 0xd070f0 : 0xff7a3a).setStrokeStyle(2, 0x7a2a1a);
    const shine = scene.add.ellipse(-4, 16, 8, 12, 0xfff3a0, 0.8);
    lantern.add([glow, body, shine]);
    if (motion === 'full') scene.tweens.add({ targets: lantern, angle: { from: -6, to: 6 }, duration: 1400 + k * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (motion !== 'off') scene.tweens.add({ targets: glow, alpha: 0.4, duration: 900 + k * 70, yoyo: true, repeat: -1 });
  }

  // Meowth and Persian behind the mat.
  const meowth = keeper(ctx, 'meowth', 390, 220, 2) as Phaser.GameObjects.Sprite | null;
  keeper(ctx, 'persian', 560, 222, 2);
  const bubble = speech(ctx, 24, 92, 300, 62, true);

  // The mat (rows of goods; scrolls) with a warm glow.
  scene.add.ellipse(MAT.x + MAT.w / 2, MAT.y + 40, MAT.w + 80, 200, 0xffa050, 0.18);
  const rug = scene.add.graphics();
  rug.fillStyle(0x2a4a8a, 1).fillRoundedRect(MAT.x - 10, MAT.y - 40, MAT.w + 20, 150, 10);
  for (let x = 0, k = 0; x < MAT.w; x += 30, k++) rug.fillStyle(k % 2 ? 0x3a5aa0 : 0x2a4a8a, 1).fillRect(MAT.x + x, MAT.y - 36, Math.min(30, MAT.w - x), 142);
  rug.lineStyle(3, 0xc0a060, 1).strokeRoundedRect(MAT.x - 10, MAT.y - 40, MAT.w + 20, 150, 10);
  // Normal goods on the rug, mystery and black-market goods behind the curtain.
  const isBack = (r: ShopRow) => r.mystery || r.black;
  const order = () => [...view.rows.keys()].sort((a, b) => Number(isBack(view.rows[a]!)) - Number(isBack(view.rows[b]!)) || a - b);
  let ordered = order();
  const front = () => ordered.filter((i) => !isBack(view.rows[i]!));
  const back = () => ordered.filter((i) => isBack(view.rows[i]!));
  const proxy = (list: () => number[]) => ({ focus: (j: number) => hooks.focus(list()[j]!), pick: (j: number) => hooks.pick(list()[j]!) });
  const frontCtx = () => ({ ...ctx, view: { ...view, rows: front().map((i) => view.rows[i]!) } });
  const rugGoods = mat(frontCtx(), proxy(front), { x: MAT.x, y: MAT.y, w: MAT.w, rowH: 100, rows: 1, columns: COLS }, { tag: 0x2a1a4a, tagText: '#ffe9a0', glow: 0xffb43a });

  // Curtain with the mystery goods.
  const cur = scene.add.graphics();
  cur.fillStyle(0x000000, 0.35).fillRoundedRect(CURTAIN.x + 6, CURTAIN.y + 8, CURTAIN.w, CURTAIN.h, 10);
  for (let x = 0, k = 0; x < CURTAIN.w; x += 22, k++) cur.fillStyle(k % 2 ? 0x6a2a8a : 0x4a1a6a, 1).fillRect(CURTAIN.x + x, CURTAIN.y, Math.min(22, CURTAIN.w - x), CURTAIN.h);
  cur.fillStyle(0x0a0014, 0.8).fillRoundedRect(CURTAIN.x + 20, CURTAIN.y + 40, CURTAIN.w - 40, CURTAIN.h - 60, 10).lineStyle(2, 0xd070f0, 1).strokeRoundedRect(CURTAIN.x + 20, CURTAIN.y + 40, CURTAIN.w - 40, CURTAIN.h - 60, 10);
  scene.add.text(CURTAIN.x + CURTAIN.w / 2, CURTAIN.y + 20, 'UNDER THE COUNTER', textStyle(16, '#f0d0ff')).setOrigin(0.5);
  const backCtx = () => ({ ...ctx, view: { ...view, rows: back().map((i) => view.rows[i]!) } });
  const curtainGoods = mat(backCtx(), proxy(back), { x: CURTAIN.x + 24, y: CURTAIN.y + 110, w: CURTAIN.w - 48, rowH: 110, rows: 2, columns: 2 }, { tag: 0x2a1a4a, tagText: '#f0d0ff', glow: 0xd070f0 });

  // Bottom info (dark glass), money and Sell.
  const panel = scene.add.graphics();
  panel.fillStyle(0x140a2e, 0.88).fillRoundedRect(12, GAME_HEIGHT - 84, 640, 72, 14).lineStyle(2, 0xd070f0, 0.8).strokeRoundedRect(12, GAME_HEIGHT - 84, 640, 72, 14);
  panel.fillStyle(0x140a2e, 0.88).fillRoundedRect(664, GAME_HEIGHT - 84, 284, 72, 14).lineStyle(2, 0xd070f0, 0.8).strokeRoundedRect(664, GAME_HEIGHT - 84, 284, 72, 14);
  const name = scene.add.text(28, GAME_HEIGHT - 66, '', textStyle(16, '#ffe9a0')).setOrigin(0, 0.5).setName('shop-item-name');
  const info = scene.add.text(28, GAME_HEIGHT - 38, '', textStyle(16, '#e0d0f0', { wordWrap: { width: 380 } })).setOrigin(0, 0.5).setName('shop-hint');
  const party = partyStrip(ctx, 438, GAME_HEIGHT - 44, { gap: 36 });
  const money = scene.add.text(680, GAME_HEIGHT - 66, `₽${view.money}`, textStyle(24, '#ffe9a0')).setOrigin(0, 0.5).setName('shop-money');
  fitLine(scene.add.text(680, GAME_HEIGHT - 34, ctx.clock, textStyle(16, '#c0b0e0')).setOrigin(0, 0.5), 250, 10);
  const sellG = scene.add.graphics();
  if (view.canSell) {
    scene.add.text(GAME_WIDTH - 90, 66, 'Sell items…', textStyle(16, '#f0d0ff')).setOrigin(0.5).setName('shop-sell').setDepth(1);
    scene.add.zone(GAME_WIDTH - 160, 48, 140, 36).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerdown', () => hooks.pick(view.rows.length)).on('pointerover', () => hooks.focus(view.rows.length));
  }
  const paintSell = (on: boolean) => {
    sellG.clear();
    if (!view.canSell) return;
    sellG.fillStyle(on ? 0x6a2a8a : 0x2a1a4a, 0.95).fillRoundedRect(GAME_WIDTH - 160, 48, 140, 36, 18).lineStyle(2, on ? 0xffd84a : 0xd070f0, 1).strokeRoundedRect(GAME_WIDTH - 160, 48, 140, 36, 18);
  };

  let current = -1;
  const focus = (i: number) => {
    current = i;
    const r = view.rows[i];
    const fi = front().indexOf(i);
    const bi = back().indexOf(i);
    rugGoods.focus(fi);
    curtainGoods.focus(bi);
    paintSell(i >= view.rows.length);
    party.show(r ?? null);
    bubble.say(patter(r));
    if (r) {
      fitLine(name.setText(`${r.label}  ·  ${priceText(r)}`), 400, 10);
      fitBlock(info, 380, 36, r.description);
    } else {
      name.setText('Sell items');
      fitBlock(info, 380, 36, 'The market buys from your Bag.');
    }
  };

  /** Keys walk the rug in rows, then the curtain, then Sell (positions in display order). */
  const move = (action: string, from: number): number => {
    const seq = [...front(), ...back(), ...(view.canSell ? [view.rows.length] : [])];
    const at = Math.max(0, seq.indexOf(from));
    const nf = front().length;
    if (at < nf) {
      if (action === 'right' && at === nf - 1) return seq[nf] ?? from;
      if (action === 'down') return seq[at + COLS < nf ? at + COLS : nf] ?? from;
      return seq[gridMove(action, at, nf, COLS)] ?? from;
    }
    if (action === 'left' || action === 'up') return seq[at - 1] ?? from;
    if (action === 'right' || action === 'down') return seq[at + 1] ?? from;
    return from;
  };

  return {
    move,
    focus,
    refresh(next: ShopView, bought, message) {
      const before = view.money;
      view = next;
      ordered = order();
      rugGoods.rebuild(front().map((i) => view.rows[i]!));
      curtainGoods.rebuild(back().map((i) => view.rows[i]!));
      countMoney(ctx, money, before, view.money);
      const keep = current;
      current = -1;
      focus(Math.min(keep, view.rows.length - (view.canSell ? 0 : 1)));
      if (message) bubble.say(message);
      if (bought === null) return;
      const fi = front().indexOf(bought);
      const at = fi >= 0 ? rugGoods.at(fi) : curtainGoods.at(back().indexOf(bought));
      plusOne(ctx, at.x, at.y - 40, undefined, '#ffe9a0');
      // Meowth flips a coin.
      if (meowth && motion !== 'off') {
        const coin = scene.add.circle(meowth.x + 30, meowth.y - 20, 7, 0xffd84a).setStrokeStyle(2, 0xa07a10);
        scene.tweens.add({ targets: coin, y: coin.y - 50, scaleX: 0.2, duration: 260, yoyo: true, repeat: 1, ease: 'Sine.easeOut', onComplete: () => coin.destroy() });
      }
    },
  };
};
