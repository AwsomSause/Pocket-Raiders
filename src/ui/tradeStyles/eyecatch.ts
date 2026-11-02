// 04 Anime Eyecatch: the mid-episode eyecatch card. Bold colour blocks and speed lines, a giant Poké Ball split
// in two with a Pokémon in each half, the deal in big type. The trade spins the ball shut and reveals the new Pokémon.
import Phaser from 'phaser';
import { body, burst, display, enter, H, hit, mon, momentLine, speedLines, trainer, W } from './common';
import type { TradeCtx, TradeStyle } from './types';

const BLOCKS = [0xffcf3a, 0xff5a5a, 0x3ab0ff, 0x7fe07f];

function blocks(ctx: TradeCtx, into: Phaser.GameObjects.Container, spin = 0): Phaser.GameObjects.Graphics {
  const g = ctx.scene.add.graphics();
  const R = 900;
  BLOCKS.forEach((c, i) => {
    const a0 = Phaser.Math.DegToRad(spin + i * 90 + 20);
    g.fillStyle(c, 1).slice(W / 2, H / 2, R, a0, a0 + Math.PI / 2, false).fillPath();
  });
  into.add([g, speedLines(ctx.scene.add.graphics(), W / 2, H / 2, 0xffffff, 0.3, 80, 60, 9)]);
  return g;
}

/** Half a Poké Ball (top red or bottom white) of radius r. */
function halfBall(ctx: TradeCtx, x: number, y: number, r: number, side: 'left' | 'right'): Phaser.GameObjects.Graphics {
  const g = ctx.scene.add.graphics({ x, y });
  const a0 = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
  g.fillStyle(0x202020, 1).slice(0, 0, r + 8, a0, a0 + Math.PI, false).fillPath();
  g.fillStyle(0xe83838, 1).slice(0, 0, r, a0, a0 + Math.PI, false).fillPath();
  g.fillStyle(0xf4f4f4, 1).slice(0, 0, r, a0 + Math.PI / 2, a0 + Math.PI, false).fillPath();
  g.fillStyle(0x202020, 1).fillRect(side === 'left' ? -r : 0, -6, r, 12);
  return g;
}

export const eyecatch: TradeStyle = {
  rows: 3,
  frame(ctx) {
    blocks(ctx, ctx.layers.back);
  },
  stage(ctx, offer) {
    const { scene } = ctx;
    const L = ctx.layers.stage;
    const lb = halfBall(ctx, 230, 270, 190, 'left').setAngle(-14);
    const rb = halfBall(ctx, 730, 270, 190, 'right').setAngle(14);
    L.add([lb, rb]);
    if (offer?.give) L.add(mon(ctx, offer.give, 240, 360, 3.6, 'front', true));
    if (offer) L.add(mon(ctx, offer.get, 720, 360, 3.6));
    if (offer) L.add(trainer(ctx, offer.trader.art, W / 2, 360, 1.6));
    const title = display(ctx, W / 2, 14, 'POKéMON TRADE!', 60, '#ffffff', '#c02040', 8).setOrigin(0.5, 0).setAngle(-3);
    L.add([title, body(ctx, W / 2, 96, offer ? `${offer.trader.name}: "${offer.trader.line}"` : 'Leave the stop?', 16, '#111111', { align: 'center', wordWrap: { width: 760 } }).setOrigin(0.5, 0)]);
    if (!ctx.calm) {
      enter(ctx, lb, -160);
      enter(ctx, rb, 160);
      scene.tweens.add({ targets: title, angle: 3, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  },
  list(ctx, rows, first, hooks) {
    const { scene } = ctx;
    const w = 280;
    return rows.map((r, k) => {
      const x = W / 2 + (k - (rows.length - 1) / 2) * (w + 14);
      const box = scene.add.container(x, 470).setAngle((k - 1) * 3);
      const g = scene.add.graphics();
      const t = body(ctx, 0, -12, r.title, 15, '#333333', { align: 'center', wordWrap: { width: w - 30 } }).setOrigin(0.5);
      const s = body(ctx, 0, 14, r.problem ?? r.sub, 11, '#555555', { align: 'center', wordWrap: { width: w - 30 } }).setOrigin(0.5);
      box.add([g, t, s]);
      ctx.layers.list.add(box);
      hit(ctx, box, -w / 2, -32, w, 64, first + k, hooks);
      return {
        focus(on) {
          g.clear();
          g.fillStyle(0xffffff, on ? 1 : 0.75).fillRoundedRect(-w / 2, -32, w, 64, 32).lineStyle(on ? 5 : 3, on ? 0xc02040 : 0x333333, 1).strokeRoundedRect(-w / 2, -32, w, 64, 32);
          t.setColor(r.problem ? '#999999' : on ? '#c02040' : '#333333');
        },
      };
    });
  },
  moment(ctx, o) {
    const { scene } = ctx;
    const L = ctx.layers.top;
    blocks(ctx, L, 45);
    const ball = scene.add.container(W / 2, H / 2 - 10, [halfBall(ctx, 0, 0, 180, 'left'), halfBall(ctx, 0, 0, 180, 'right')]);
    const out = mon(ctx, o.give, W / 2, H / 2 + 110, 4.4).setTintFill(0x111111);
    const inn = mon(ctx, o.get, W / 2, H / 2 + 110, 4.4);
    const title = display(ctx, W / 2, 16, `IT'S ${o.get.name.toUpperCase()}!`, 70, '#ffffff', '#2040a0', 8).setOrigin(0.5, 0).setAngle(-4);
    L.add([ball, out, inn, title, body(ctx, W / 2, H - 40, momentLine(o), 18, '#111111').setOrigin(0.5)]);
    if (ctx.calm) {
      out.setAlpha(0);
      return 400;
    }
    inn.setAlpha(0);
    title.setAlpha(0);
    scene.tweens.add({ targets: ball, angle: 720, duration: 900, ease: 'Cubic.easeInOut' });
    scene.tweens.add({ targets: out, scaleX: 0, duration: 260, delay: 700, ease: 'Sine.easeIn' });
    scene.tweens.add({ targets: inn, alpha: 1, scaleX: { from: 0, to: inn.scaleX }, duration: 300, delay: 960, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: title, alpha: 1, scale: { from: 1.8, to: 1 }, duration: 300, delay: 1000, ease: 'Back.easeOut' });
    scene.time.delayedCall(1000, () => burst(ctx, L, W / 2, H / 2, BLOCKS, 40));
    return 2000;
  },
};
