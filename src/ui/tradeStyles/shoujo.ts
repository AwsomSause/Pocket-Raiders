// 07 Shoujo Sparkle: soft pink bloom, floating bubbles and sparkles, flower-framed portraits of both Pokémon,
// the trader between them and a heart meter for how much they want the deal. The trade blooms into a
// "kira kira" moment with petals.
import Phaser from 'phaser';
import { body, burst, display, H, hit, jp, label, mon, trainer, W } from './common';
import type { TradeCtx, TradeStyle } from './types';

const ROSE = 0xff5fa0;
const ROSE_T = '#ff5fa0';
const DEEP = '#a03070';

function bubbles(ctx: TradeCtx, into: Phaser.GameObjects.Container, n: number): void {
  const { scene } = ctx;
  const rng = new Phaser.Math.RandomDataGenerator(['shoujo']);
  for (let i = 0; i < n; i++) {
    const r = rng.pick([8, 14, 22, 34]);
    const b = scene.add.circle(rng.between(0, W), rng.between(0, H), r, 0xffffff, 0.18).setStrokeStyle(2, 0xffffff, 0.9);
    into.add(b);
    if (!ctx.calm) scene.tweens.add({ targets: b, y: b.y - rng.between(40, 120), alpha: 0.2, duration: rng.between(2500, 5000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  for (let i = 0; i < 12; i++) {
    const s = jp(ctx, rng.between(0, W), rng.between(0, H), '✦', rng.pick([14, 22]), '#ffffff', '#ffb0d0', 2);
    into.add(s);
    if (!ctx.calm) scene.tweens.add({ targets: s, alpha: 0.2, duration: rng.between(600, 1400), yoyo: true, repeat: -1 });
  }
}

/** A round flower frame with a Pokémon in it. */
function frame(ctx: TradeCtx, into: Phaser.GameObjects.Container, x: number, y: number, r: number): Phaser.GameObjects.Container {
  const { scene } = ctx;
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.fillStyle(i % 2 ? 0xffb0d0 : 0xffffff, 1).fillCircle(Math.cos(a) * (r + 6), Math.sin(a) * (r + 6), 14);
  }
  g.fillStyle(0xff8fc0, 1).fillCircle(0, 0, r + 6).fillStyle(0xfff4fa, 1).fillCircle(0, 0, r);
  c.add(g);
  into.add(c);
  return c;
}

export const shoujo: TradeStyle = {
  rows: 3,
  frame(ctx) {
    const { scene } = ctx;
    const g = scene.add.graphics();
    g.fillGradientStyle(0xfff6fb, 0xfff6fb, 0xf7a0c8, 0xf7a0c8, 1).fillRect(0, 0, W, H);
    ctx.layers.back.add(g);
    bubbles(ctx, ctx.layers.back, 22);
    ctx.layers.back.add(body(ctx, 14, 8, `${ctx.view.place} · ₽${ctx.view.money}`, 14, DEEP));
  },
  stage(ctx, offer) {
    const { scene } = ctx;
    const L = ctx.layers.stage;
    const a = frame(ctx, L, 150, 150, 100);
    const b = frame(ctx, L, W - 150, 150, 100);
    if (offer?.give) a.add(mon(ctx, offer.give, 0, 70, 3, 'front', true));
    if (offer) b.add(mon(ctx, offer.get, 0, 70, 3));
    if (offer) {
      L.add(trainer(ctx, offer.trader.art, W / 2, 280, 2));
      const heart = display(ctx, W / 2 - 90, 90, '♡', 56, ROSE_T, '#ffffff', 5, { fontStyle: 'normal' });
      L.add(heart);
      if (!ctx.calm) scene.tweens.add({ targets: heart, scale: 1.2, duration: 500, yoyo: true, repeat: -1 });
      if (offer.give) L.add(body(ctx, 150, 268, label(offer.give), 18, DEEP).setOrigin(0.5, 0));
      L.add(body(ctx, W - 150, 268, label(offer.get), 18, DEEP).setOrigin(0.5, 0));
      // How much the trader wants it (presentation: full when you have what they ask for).
      const want = offer.problem ? 0.25 : 0.85;
      L.add(body(ctx, W / 2, 292, `${offer.trader.name} wants it this much:`, 13, DEEP).setOrigin(0.5, 0));
      const bar = scene.add.graphics().fillStyle(0xffffff, 1).fillRoundedRect(W / 2 - 110, 312, 220, 14, 7).fillStyle(ROSE, 1).fillRoundedRect(W / 2 - 110, 312, 220 * want, 14, 7).lineStyle(2, 0xff8fc0, 1).strokeRoundedRect(W / 2 - 110, 312, 220, 14, 7);
      L.add(bar);
      const quote = scene.add.graphics().fillStyle(0xffffff, 0.85).fillRoundedRect(60, 338, W - 120, 52, 26).lineStyle(2, 0xff8fc0, 1).strokeRoundedRect(60, 338, W - 120, 52, 26);
      L.add([quote, body(ctx, W / 2, 364, `"${offer.trader.line}"`, 15, DEEP, { align: 'center', wordWrap: { width: W - 160 } }).setOrigin(0.5)]);
    }
  },
  list(ctx, rows, first, hooks) {
    const { scene } = ctx;
    const w = 280;
    return rows.map((r, k) => {
      const x = W / 2 + (k - (rows.length - 1) / 2) * (w + 16);
      const box = scene.add.container(x, 448);
      const g = scene.add.graphics();
      const t = body(ctx, 0, -10, r.title, 14, DEEP, { align: 'center', wordWrap: { width: w - 30 } }).setOrigin(0.5);
      const s = body(ctx, 0, 14, r.problem ?? r.sub, 11, DEEP, { align: 'center', wordWrap: { width: w - 30 } }).setOrigin(0.5);
      box.add([g, t, s]);
      ctx.layers.list.add(box);
      hit(ctx, box, -w / 2, -30, w, 60, first + k, hooks);
      return {
        focus(on) {
          g.clear().fillStyle(on && !r.problem ? ROSE : 0xffffff, 1).fillRoundedRect(-w / 2, -30, w, 60, 30).lineStyle(3, 0xffffff, 1).strokeRoundedRect(-w / 2, -30, w, 60, 30);
          t.setText(`${on ? '✿ ' : ''}${r.title}`).setColor(r.problem ? '#c0a0b0' : on ? '#ffffff' : DEEP);
          s.setColor(r.problem ? '#c0a0b0' : on ? '#ffe8f2' : DEEP);
        },
      };
    });
  },
  moment(ctx, o) {
    const { scene } = ctx;
    const L = ctx.layers.top;
    const g = scene.add.graphics().fillGradientStyle(0xfff6fb, 0xfff6fb, 0xf7a0c8, 0xf7a0c8, 1).fillRect(0, 0, W, H);
    L.add(g);
    bubbles(ctx, L, 26);
    const f = frame(ctx, L, W / 2, 200, 140);
    const inn = mon(ctx, o.get, 0, 100, 4.4);
    f.add(inn);
    const kira = jp(ctx, 80, 70, 'キラキラ✦', 56, ROSE_T, '#ffffff', 5).setAngle(-12);
    const head = display(ctx, W / 2, 380, `${o.get.name} has joined you!`, 40, ROSE_T, '#ffffff', 5).setOrigin(0.5, 0);
    L.add([kira, head, body(ctx, W / 2, 446, `${o.give.name} waves goodbye from ${o.trader.name}'s arms... Lv${o.get.level}`, 16, DEEP).setOrigin(0.5, 0)]);
    if (ctx.calm) return 400;
    f.setScale(0);
    scene.tweens.add({ targets: f, scale: 1, duration: 700, ease: 'Back.easeOut' });
    scene.time.delayedCall(600, () => burst(ctx, L, W / 2, 200, [0xff8fc0, 0xffffff, 0xffd0e4, ROSE], 44, 380));
    return 1800;
  },
};
