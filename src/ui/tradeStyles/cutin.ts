// 06 Cut-In Strips: anime cut-ins. Slanted strips slash across a speed-lined night: the trader's face with
// their line, your Pokémon, theirs. The trade fires a "GO!" cut-in and a ball streaking between the strips.
import Phaser from 'phaser';
import { body, display, H, hit, hue, mon, momentLine, speedLines, trainer, W } from './common';
import type { TradeCtx, TradeStyle } from './types';

const NIGHT = 0x1a1440;

/** A slanted strip (container rotated a few degrees) with a white rim, contents clipped to it. */
function strip(ctx: TradeCtx, into: Phaser.GameObjects.Container, y: number, h: number, color: number, angle: number, delay: number): Phaser.GameObjects.Container {
  const { scene } = ctx;
  const c = scene.add.container(W / 2, y).setAngle(angle);
  const g = scene.add.graphics().fillStyle(0xffffff, 1).fillRect(-W, -h / 2 - 4, W * 2, h + 8).fillStyle(color, 1).fillRect(-W, -h / 2, W * 2, h);
  c.add(g);
  const mask = scene.make.graphics({}, false).fillStyle(0xffffff).fillRect(-W, -h / 2, W * 2, h);
  mask.setPosition(W / 2, y).setAngle(angle);
  c.setData('mask', mask.createGeometryMask());
  into.add(c);
  if (!ctx.calm) {
    c.x = angle < 0 ? -W : W * 2;
    scene.tweens.add({ targets: c, x: W / 2, duration: 320, delay, ease: 'Cubic.easeOut' });
  }
  return c;
}

export const cutin: TradeStyle = {
  rows: 4,
  frame(ctx) {
    const { scene } = ctx;
    ctx.layers.back.add([scene.add.rectangle(0, 0, W, H, NIGHT).setOrigin(0), speedLines(scene.add.graphics(), W / 2, H / 2, 0xffffff, 0.22, 90, 40, 4)]);
    ctx.layers.back.add(body(ctx, W - 14, 8, `${ctx.view.place} · ₽${ctx.view.money}`, 15, '#ffffff', { stroke: '#000000', strokeThickness: 3 }).setOrigin(1, 0));
  },
  stage(ctx, offer) {
    const L = ctx.layers.stage;
    const a = strip(ctx, L, 80, 86, 0xff5a8a, -6, 0);
    if (offer) a.add([trainer(ctx, offer.trader.art, -270, 120, 2.2), body(ctx, -170, -30, `"${offer.trader.line}"`, 15, '#ffffff', { stroke: '#000000', strokeThickness: 3, wordWrap: { width: 560 } })]);
    else a.add(display(ctx, -100, -30, 'LEAVING?', 40, '#ffffff', '#000000', 6));
    const b = strip(ctx, L, 190, 104, offer?.give ? hue(offer.give) : 0x444466, -5, 90);
    if (offer?.give) b.add([mon(ctx, offer.give, 260, 70, 3, 'front', true), display(ctx, -380, -34, `YOUR ${offer.give.name.toUpperCase()}`, 38, '#ffffff', '#000000', 6), body(ctx, -370, 16, `Lv${offer.give.level} ${offer.give.types.join('/')}`, 15, '#ffffff', { stroke: '#000000', strokeThickness: 3 })]);
    const c = strip(ctx, L, 310, 104, offer ? hue(offer.get) : 0x444466, -5, 180);
    if (offer) c.add([mon(ctx, offer.get, -260, 70, 3), display(ctx, -120, -34, `THEIR ${offer.get.name.toUpperCase()}`, 38, '#ffffff', '#000000', 6), body(ctx, -110, 16, `Lv${offer.get.level} ${offer.get.types.join('/')}`, 15, '#ffffff', { stroke: '#000000', strokeThickness: 3 })]);
    for (const s of [a, b, c]) {
      const m = s.getData('mask') as Phaser.Display.Masks.GeometryMask;
      s.list.forEach((o) => (o as Phaser.GameObjects.Image).setMask?.(m));
    }
  },
  list(ctx, rows, first, hooks) {
    const { scene } = ctx;
    const w = (W - 40) / rows.length - 12;
    return rows.map((r, k) => {
      const box = scene.add.container(26 + k * (w + 12), 432);
      const g = scene.add.graphics();
      const t = body(ctx, 16, 10, r.title, 14, '#ffffff', { wordWrap: { width: w - 24 } });
      const s = body(ctx, 16, 46, r.problem ?? r.sub, 11, '#dddddd', { wordWrap: { width: w - 24 } });
      box.add([g, t, s]);
      ctx.layers.list.add(box);
      hit(ctx, box, 0, 0, w, 80, first + k, hooks);
      return {
        focus(on) {
          const pts = [{ x: 14, y: 0 }, { x: w, y: 0 }, { x: w - 14, y: 80 }, { x: 0, y: 80 }];
          g.clear().fillStyle(on && !r.problem ? 0xffffff : 0xffffff, on ? 1 : 0.12).fillPoints(pts, true).lineStyle(3, 0xffffff, 1).strokePoints(pts, true);
          t.setColor(r.problem ? '#9999aa' : on ? '#1a1440' : '#ffffff');
          s.setColor(on && !r.problem ? '#333355' : '#aaaacc');
        },
      };
    });
  },
  moment(ctx, o) {
    const { scene } = ctx;
    const L = ctx.layers.top;
    L.add([scene.add.rectangle(0, 0, W, H, NIGHT).setOrigin(0), speedLines(scene.add.graphics(), W / 2, H / 2, 0xffffff, 0.4, 100, 30, 8)]);
    const a = strip(ctx, L, 130, 100, 0x3ab0ff, -8, 0);
    a.add([trainer(ctx, ctx.player, -280, 120, 2.6), display(ctx, -60, -40, `GO, ${o.get.name.toUpperCase()}!`, 54, '#ffffff', '#000000', 7)]);
    const b = strip(ctx, L, 300, 130, hue(o.get), 6, 200);
    const inn = mon(ctx, o.get, 160, 90, 4.2);
    const out = mon(ctx, o.give, -300, 80, 3, 'front', true).setAlpha(0.6);
    b.add([out, inn]);
    for (const s of [a, b]) {
      const m = s.getData('mask') as Phaser.Display.Masks.GeometryMask;
      s.list.forEach((x) => (x as Phaser.GameObjects.Image).setMask?.(m));
    }
    const ball = scene.add.circle(-40, 230, 18, 0xe83838).setStrokeStyle(4, 0x202020);
    L.add([ball, body(ctx, W / 2, H - 40, momentLine(o), 17, '#ffffff', { stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5)]);
    if (ctx.calm) {
      ball.setVisible(false);
      return 400;
    }
    scene.tweens.add({ targets: ball, x: W + 40, duration: 500, delay: 500, ease: 'Cubic.easeIn' });
    scene.tweens.add({ targets: out, x: out.x - 200, alpha: 0, duration: 500, delay: 700 });
    return 1700;
  },
};
