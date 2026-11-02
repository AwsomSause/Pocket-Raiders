// 10 Trading Card Duel: anime card-game style. Both Pokémon are holo cards (name, level, type, base total) on a
// glowing duel mat, the trader's portrait card above. The trade flips both cards mid-air and swaps them in foil.
import Phaser from 'phaser';
import type { TradeSide } from '../../core/trade/view';
import { body, burst, display, H, hit, hue, mon, momentLine, W } from './common';
import type { TradeCtx, TradeStyle } from './types';

const GOLD = 0xf0d070;

/** A holo card for one side (centre x, y), or a card back when `side` is null. */
function card(ctx: TradeCtx, x: number, y: number, side: TradeSide | null, angle = 0): Phaser.GameObjects.Container {
  const { scene } = ctx;
  const c = scene.add.container(x, y).setAngle(angle);
  const g = scene.add.graphics();
  if (!side) {
    g.fillStyle(GOLD, 1).fillRoundedRect(-88, -122, 176, 244, 12).fillStyle(0xa02020, 1).fillRoundedRect(-80, -114, 160, 228, 8);
    g.fillStyle(0xf4f4f4, 1).fillCircle(0, 0, 40).fillStyle(0xe83838, 1).slice(0, 0, 40, Math.PI, 0, false).fillPath().fillStyle(0x202020, 1).fillRect(-40, -4, 80, 8).fillCircle(0, 0, 12).fillStyle(0xffffff, 1).fillCircle(0, 0, 7);
    c.add(g);
    return c;
  }
  g.fillStyle(GOLD, 1).fillRoundedRect(-88, -122, 176, 244, 12);
  g.fillGradientStyle(0xffffff, 0xffffff, hue(side), hue(side), 1).fillRoundedRect(-80, -114, 160, 228, 8);
  g.fillStyle(0xffffff, 0.65).fillRect(-72, -88, 144, 110).lineStyle(3, 0xb89a40, 1).strokeRect(-72, -88, 144, 110);
  const shine = scene.add.graphics().fillStyle(0xffffff, 0.45).fillPoints([{ x: -80, y: 40 }, { x: -20, y: -114 }, { x: 10, y: -114 }, { x: -50, y: 40 }], true);
  c.add([g, mon(ctx, side, 0, 18, 2), shine, body(ctx, -72, -110, side.name, 14, '#222222'), body(ctx, 72, -110, `Lv${side.level}`, 13, '#aa0000').setOrigin(1, 0), body(ctx, -72, 30, side.types.join('/').toUpperCase(), 12, '#222222'), body(ctx, -72, 50, '★★☆  Trade card', 11, '#333333')]);
  if (!ctx.calm) scene.tweens.add({ targets: shine, x: 120, duration: 1800, repeat: -1, repeatDelay: 800 });
  return c;
}

function mat(ctx: TradeCtx, into: Phaser.GameObjects.Container): void {
  const { scene } = ctx;
  const g = scene.add.graphics().fillGradientStyle(0x2a3a7a, 0x2a3a7a, 0x0a0f28, 0x0a0f28, 1).fillRect(0, 0, W, H);
  g.lineStyle(3, 0x7fc8ff, 0.35).strokeEllipse(W / 2, 330, 820, 200).strokeEllipse(W / 2, 330, 600, 130);
  into.add(g);
}

export const cards: TradeStyle = {
  rows: 4,
  frame(ctx) {
    mat(ctx, ctx.layers.back);
  },
  stage(ctx, offer) {
    const { scene } = ctx;
    const L = ctx.layers.stage;
    const a = card(ctx, 250, 300, offer?.give ?? null, -6);
    const b = card(ctx, 710, 300, offer ? offer.get : null, 6);
    L.add([a, b, display(ctx, W / 2, 300, '⇄', 60, '#ffe14a', '#000000', 4, { fontStyle: 'normal' }).setOrigin(0.5)]);
    if (!ctx.calm) {
      scene.tweens.add({ targets: a, y: 290, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      scene.tweens.add({ targets: b, y: 290, duration: 1100, delay: 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    L.add(body(ctx, 20, 16, `${ctx.view.place}\n₽${ctx.view.money}`, 15, '#ffffff'));
    if (offer) {
      const g = scene.add.graphics().fillStyle(0x222233, 1).fillRoundedRect(400, 14, 160, 130, 10).lineStyle(4, 0xb89a40, 1).strokeRoundedRect(400, 14, 160, 130, 10);
      const tr = ctx.scene.textures.exists(offer.trader.art) ? scene.add.image(480, 140, offer.trader.art).setOrigin(0.5, 1).setScale(1) : null;
      tr?.setCrop(0, 0, tr.width, tr.height * 0.85);
      L.add([g, ...(tr ? [tr] : []), body(ctx, 576, 22, offer.trader.name, 16, '#ffffff'), body(ctx, 576, 46, `"${offer.trader.line}"`, 13, '#ccddee', { wordWrap: { width: 360 } }), body(ctx, 576, 120, offer.note, 11, '#ffe14a', { wordWrap: { width: 360 } })]);
    }
  },
  list(ctx, rows, first, hooks) {
    const { scene } = ctx;
    const w = (W - 40) / rows.length - 12;
    return rows.map((r, k) => {
      const box = scene.add.container(26 + k * (w + 12), 462);
      const g = scene.add.graphics();
      const t = body(ctx, 12, 8, r.title, 13, '#ffffff', { wordWrap: { width: w - 20 } });
      const s = body(ctx, 12, 42, r.problem ?? r.sub, 10, '#cccccc', { wordWrap: { width: w - 20 } });
      box.add([g, t, s]);
      ctx.layers.list.add(box);
      hit(ctx, box, 0, 0, w, 64, first + k, hooks);
      return {
        focus(on) {
          g.clear();
          if (on && !r.problem) g.fillGradientStyle(0xffe88a, 0xffe88a, 0xd0a030, 0xd0a030, 1).fillRoundedRect(0, 0, w, 64, 8);
          else g.fillStyle(0x000000, 0.5).fillRoundedRect(0, 0, w, 64, 8);
          g.lineStyle(2, GOLD, 1).strokeRoundedRect(0, 0, w, 64, 8);
          t.setColor(r.problem ? '#888888' : on ? '#332200' : '#ffffff');
          s.setColor(on && !r.problem ? '#443300' : '#bbbbbb');
        },
      };
    });
  },
  moment(ctx, o) {
    const { scene } = ctx;
    const L = ctx.layers.top;
    mat(ctx, L);
    const inn = card(ctx, 690, 240, o.get, 0);
    const out = card(ctx, 270, 240, o.give, 0);
    const head = display(ctx, W / 2, 400, `CARD SWAP — ${o.get.name.toUpperCase()}!`, 44, '#ffe14a', '#000000', 6).setOrigin(0.5, 0);
    L.add([out, inn, head, body(ctx, W / 2, 466, momentLine(o), 16, '#ffffff', { stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5, 0)]);
    if (ctx.calm) {
      inn.setPosition(W / 2, 240);
      out.setVisible(false);
      return 400;
    }
    // Both cards leap, flip edge-on and land on the other side; theirs comes to you face-up.
    scene.tweens.add({ targets: out, x: 690, y: 200, angle: 20, scaleX: { from: 1, to: 0 }, duration: 600, ease: 'Sine.easeInOut', onComplete: () => out.setVisible(false) });
    scene.tweens.add({ targets: inn, x: W / 2, y: 220, angle: { from: 0, to: -360 }, duration: 900, ease: 'Cubic.easeInOut' });
    scene.time.delayedCall(800, () => burst(ctx, L, W / 2, 220, [0xffe14a, 0x7fe8ff, 0xffffff, 0xff8fd0], 46, 380));
    return 1800;
  },
};
