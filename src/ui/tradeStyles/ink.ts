// 12 Ink Impact Frame: sakuga impact style. Sumi-ink brush strokes in black and red on rice paper, a brushed
// 交換 ("exchange") seal, bold names. The trade is a single inverted impact frame with speed lines, a red slash
// and "DON!!", then the new Pokémon in ink.
import Phaser from 'phaser';
import { body, display, grayscale, H, hit, jp, mon, momentLine, speedLines, tone, trainer, W } from './common';
import type { TradeCtx, TradeStyle } from './types';

const INK = 0x111111;
const RED = 0xd01828;
const PAPER = 0xf1e8d4;

/** A ragged brush stroke: an ellipse made of jittered overlapping blobs. */
function stroke(ctx: TradeCtx, x: number, y: number, w: number, h: number, angle: number, color: number, seed: string): Phaser.GameObjects.Graphics {
  const g = ctx.scene.add.graphics({ x, y }).setAngle(angle);
  const rng = new Phaser.Math.RandomDataGenerator([seed]);
  g.fillStyle(color, 1);
  for (let i = 0; i < 40; i++) {
    const t = (i / 39) * 2 - 1;
    const r = (h / 2) * Math.sqrt(1 - t * t * 0.9) * rng.realInRange(0.75, 1.1);
    g.fillEllipse(t * (w / 2 - h / 4), rng.realInRange(-h * 0.06, h * 0.06), h * 0.7, r * 2);
  }
  for (let i = 0; i < 14; i++) g.fillCircle(rng.realInRange(-w / 2, w / 2), rng.pick([-1, 1]) * rng.realInRange(h * 0.45, h * 0.7), rng.realInRange(2, 7));
  return g;
}

export const ink: TradeStyle = {
  rows: 3,
  frame(ctx) {
    const { scene } = ctx;
    const g = scene.add.graphics().fillStyle(PAPER, 1).fillRect(0, 0, W, H);
    ctx.layers.back.add(g);
    tone(ctx, ctx.layers.back, 0, 0, W, H, 0x000000, 0.08, 8, 1.2);
  },
  stage(ctx, offer) {
    const L = ctx.layers.stage;
    L.add([stroke(ctx, 240, 220, 400, 230, -6, INK, 'l'), stroke(ctx, 720, 220, 400, 230, 6, RED, 'r')]);
    if (offer?.give) L.add([mon(ctx, offer.give, 240, 300, 3.6, 'front', true), display(ctx, 50, 26, offer.give.name.toUpperCase(), 30, '#111111', '#f1e8d4', 0), body(ctx, 52, 64, `Lv${offer.give.level} ${offer.give.types.join('/')}`, 14, '#111111')]);
    if (offer) L.add([mon(ctx, offer.get, 720, 300, 3.6), display(ctx, 540, 26, offer.get.name.toUpperCase(), 30, '#d01828', '#f1e8d4', 0), body(ctx, 542, 64, `Lv${offer.get.level} ${offer.get.types.join('/')}`, 14, '#d01828')]);
    const seal = ctx.scene.add.container(W / 2, 220).setAngle(-6);
    const sg = ctx.scene.add.graphics().fillStyle(PAPER, 1).fillRoundedRect(-58, -66, 116, 132, 8).lineStyle(6, RED, 1).strokeRoundedRect(-58, -66, 116, 132, 8);
    seal.add([sg, jp(ctx, 0, -28, '交', 46, '#d01828', '#f1e8d4', 0).setOrigin(0.5), jp(ctx, 0, 28, '換', 46, '#d01828', '#f1e8d4', 0).setOrigin(0.5)]);
    L.add(seal);
    if (offer) {
      const tr = trainer(ctx, offer.trader.art, W - 40, 450, 1.4, true);
      L.add([tr, body(ctx, 46, 352, `${offer.trader.name}: "${offer.trader.line}"`, 15, '#111111', { wordWrap: { width: 760 } }), body(ctx, W - 100, 352, `₽${ctx.view.money}`, 15, '#111111').setOrigin(1, 0)]);
      L.add(ctx.scene.add.rectangle(36, 350, 5, 40, RED).setOrigin(0));
    }
  },
  list(ctx, rows, first, hooks) {
    const { scene } = ctx;
    const w = 260;
    return rows.map((r, k) => {
      const box = scene.add.container(46 + k * (w + 14), 420);
      const g = scene.add.graphics();
      const t = body(ctx, 16, 16, r.title, 15, '#111111', { wordWrap: { width: w - 30 } });
      const s = body(ctx, 16, 52, r.problem ?? r.sub, 11, '#333333', { wordWrap: { width: w - 30 } });
      box.add([g, t, s]);
      ctx.layers.list.add(box);
      hit(ctx, box, 0, 0, w, 90, first + k, hooks);
      return {
        focus(on) {
          g.clear();
          if (on && !r.problem) g.fillStyle(INK, 1).fillRoundedRect(0, 0, w, 90, { tl: 4, tr: 24, bl: 24, br: 4 });
          g.lineStyle(4, INK, 1).strokeRoundedRect(0, 0, w, 90, { tl: 4, tr: 24, bl: 24, br: 4 });
          t.setText(`${on ? '筆 ' : ''}${r.title}`).setColor(r.problem ? '#999999' : on ? '#ffffff' : '#111111');
          s.setColor(r.problem ? '#999999' : on ? '#dddddd' : '#333333');
        },
      };
    });
  },
  moment(ctx, o) {
    const { scene } = ctx;
    const L = ctx.layers.top;
    L.add([scene.add.rectangle(0, 0, W, H, INK).setOrigin(0), speedLines(scene.add.graphics(), W / 2, H / 2, 0xffffff, 0.55, 110, 120, 6), stroke(ctx, W / 2, 280, 720, 170, -8, RED, 'm')]);
    const inn = mon(ctx, o.get, W / 2, 380, 4.6).setTintFill(0xffffff);
    const kan = jp(ctx, 50, 30, '交換', 110, '#ffffff', '#111111', 0);
    const don = display(ctx, W - 40, 60, 'DON!!', 64, '#d01828', '#111111', 0).setOrigin(1, 0);
    L.add([inn, kan, don, body(ctx, W / 2, H - 40, momentLine(o), 17, '#ffffff').setOrigin(0.5)]);
    if (ctx.calm) {
      inn.clearTint();
      grayscale(inn);
      return 400;
    }
    scene.cameras.main.flash(120, 255, 255, 255);
    don.setScale(2.4);
    scene.tweens.add({ targets: don, scale: 1, duration: 260, ease: 'Back.easeOut' });
    // Impact frame (white silhouette), then the ink-drawn Pokémon snaps in.
    scene.time.delayedCall(500, () => {
      if (!inn.active) return;
      inn.clearTint();
      grayscale(inn);
      scene.tweens.add({ targets: inn, scale: { from: inn.scale * 1.3, to: inn.scale }, duration: 300, ease: 'Back.easeOut' });
    });
    return 1600;
  },
};
