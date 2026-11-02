// 09 Link Cable Sky: the classic trade machine, reimagined. A starry dusk sky, a glowing Pokémon on each side, a
// dashed Link Cable curving between them. The trade sends two Poké Balls racing past each other along the cable.
import Phaser from 'phaser';
import { body, display, H, hit, hue, label, mon, momentLine, W } from './common';
import type { TradeCtx, TradeStyle } from './types';

const CYAN = 0x7fe8ff;
const P0 = { x: 140, y: 230 };
const P1 = { x: W - 140, y: 230 };
const curve = (): Phaser.Curves.CubicBezier => new Phaser.Curves.CubicBezier(new Phaser.Math.Vector2(P0.x, P0.y), new Phaser.Math.Vector2(360, 80), new Phaser.Math.Vector2(600, 380), new Phaser.Math.Vector2(P1.x, P1.y));

function sky(ctx: TradeCtx, into: Phaser.GameObjects.Container): void {
  const { scene } = ctx;
  const g = scene.add.graphics().fillGradientStyle(0x0a1a50, 0x0a1a50, 0xff9a6a, 0xff9a6a, 1).fillRect(0, 0, W, H);
  into.add(g);
  const rng = new Phaser.Math.RandomDataGenerator(['cable']);
  for (let i = 0; i < 60; i++) {
    const s = scene.add.rectangle(rng.between(0, W), rng.between(0, 280), 2, 2, 0xffffff, rng.realInRange(0.3, 1));
    into.add(s);
    if (!ctx.calm && i % 3 === 0) scene.tweens.add({ targets: s, alpha: 0.1, duration: rng.between(500, 1500), yoyo: true, repeat: -1 });
  }
  const c = curve();
  const line = scene.add.graphics().lineStyle(14, CYAN, 0.3);
  c.draw(line, 64);
  line.lineStyle(4, 0xffffff, 1);
  const pts = c.getPoints(60);
  for (let i = 0; i < pts.length - 1; i += 2) line.lineBetween(pts[i]!.x, pts[i]!.y, pts[i + 1]!.x, pts[i + 1]!.y);
  into.add(line);
}

export const cable: TradeStyle = {
  rows: 4,
  frame(ctx) {
    sky(ctx, ctx.layers.back);
  },
  stage(ctx, offer) {
    const { scene } = ctx;
    const L = ctx.layers.stage;
    for (const [p, s, flip] of [[P0, offer?.give, true], [P1, offer?.get, false]] as const) {
      const halo = scene.add.circle(p.x, p.y, 84, 0xffffff, 0.15).setStrokeStyle(4, s ? hue(s) : 0x556688, 0.9);
      L.add(halo);
      if (!ctx.calm) scene.tweens.add({ targets: halo, scale: 1.08, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      if (s) L.add([mon(ctx, s, p.x, p.y + 60, 2.8, 'front', flip), body(ctx, p.x, p.y + 92, label(s), 17, '#ffffff', { stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5, 0), body(ctx, p.x, p.y + 116, s.types.join('/').toUpperCase(), 12, `#${hue(s).toString(16).padStart(6, '0')}`, { stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5, 0)]);
    }
    L.add(body(ctx, W / 2, 18, `${ctx.view.place} · ${offer?.trader.name ?? ''} · ₽${ctx.view.money}`, 17, '#ffffff', { stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5, 0));
    if (offer) L.add(body(ctx, W / 2, 46, `"${offer.trader.line}"`, 14, '#cce4ff', { stroke: '#000000', strokeThickness: 3, align: 'center', wordWrap: { width: 640 } }).setOrigin(0.5, 0));
    // A spark runs along the cable.
    if (!ctx.calm && offer?.give && !offer.problem) {
      const spark = scene.add.circle(P0.x, P0.y, 7, 0xffffff).setStrokeStyle(3, CYAN);
      L.add(spark);
      const c = curve();
      const t = { v: 0 };
      scene.tweens.add({ targets: t, v: 1, duration: 1400, repeat: -1, onUpdate: () => { const p = c.getPoint(t.v); spark.setPosition(p.x, p.y); } });
    }
  },
  list(ctx, rows, first, hooks) {
    const { scene } = ctx;
    ctx.layers.list.add(scene.add.rectangle(0, 438, W, 102, 0x0a1440, 0.75).setOrigin(0).setStrokeStyle(3, CYAN));
    const w = (W - 40) / rows.length - 12;
    return rows.map((r, k) => {
      const box = scene.add.container(26 + k * (w + 12), 452);
      const g = scene.add.graphics();
      const t = body(ctx, 14, 10, r.title, 14, '#ffffff', { wordWrap: { width: w - 24 } });
      const s = body(ctx, 14, 46, r.problem ?? r.sub, 11, '#cce4ff', { wordWrap: { width: w - 24 } });
      box.add([g, t, s]);
      ctx.layers.list.add(box);
      hit(ctx, box, 0, 0, w, 74, first + k, hooks);
      return {
        focus(on) {
          g.clear().fillStyle(on && !r.problem ? 0x3a90ff : 0xffffff, on && !r.problem ? 1 : 0.08).fillRoundedRect(0, 0, w, 74, 12).lineStyle(2, CYAN, 1).strokeRoundedRect(0, 0, w, 74, 12);
          t.setColor(r.problem ? '#8899aa' : '#ffffff');
        },
      };
    });
  },
  moment(ctx, o) {
    const { scene } = ctx;
    const L = ctx.layers.top;
    sky(ctx, L);
    const out = mon(ctx, o.give, P0.x, P0.y + 60, 2.8, 'front', true);
    const inn = mon(ctx, o.get, P1.x, P1.y + 60, 2.8);
    const b1 = scene.add.circle(P0.x, P0.y, 16, 0xe83838).setStrokeStyle(4, 0x202020);
    const b2 = scene.add.circle(P1.x, P1.y, 16, 0xe83838).setStrokeStyle(4, 0x202020);
    const head = display(ctx, W / 2, 300, 'SENDING... RECEIVING!', 44, '#ffffff', '#0a1a50', 6).setOrigin(0.5, 0);
    L.add([out, inn, b1, b2, head, body(ctx, W / 2, 370, momentLine(o), 17, '#ffffff', { stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5, 0)]);
    if (ctx.calm) {
      out.setAlpha(0);
      inn.setPosition(P0.x, P0.y + 60);
      b1.setVisible(false);
      b2.setVisible(false);
      return 400;
    }
    const c = curve();
    const t = { v: 0 };
    scene.tweens.add({ targets: out, scale: 0, alpha: 0, duration: 300 });
    scene.tweens.add({ targets: inn, scale: 0, alpha: 0, duration: 300 });
    scene.tweens.add({
      targets: t, v: 1, duration: 1300, delay: 300, ease: 'Sine.easeInOut',
      onUpdate: () => {
        const a = c.getPoint(t.v);
        const b = c.getPoint(1 - t.v);
        b1.setPosition(a.x, a.y);
        b2.setPosition(b.x, b.y);
      },
      onComplete: () => {
        inn.setPosition(P0.x, P0.y + 60);
        scene.tweens.add({ targets: inn, scale: 2.8, alpha: 1, duration: 400, ease: 'Back.easeOut' });
        b1.setVisible(false);
        b2.setVisible(false);
      },
    });
    return 2200;
  },
};
