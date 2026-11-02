// 08 Chibi Sticker Swap: a kawaii pastel table. Trainers and Pokémon are die-cut stickers with white outlines and
// emote bubbles (!? ♪), on a swap mat with two dashed slots. The trade peels the stickers and swaps them in confetti.
import Phaser from 'phaser';
import { body, burst, display, H, hit, label, mon, trainer, W } from './common';
import type { TradeCtx, TradeStyle } from './types';

const INK = '#996644';

/** Sticker look: a white outline (glow FX on WebGL, a plain sprite on canvas). */
function sticker<T extends Phaser.GameObjects.Sprite>(s: T): T {
  s.preFX?.addGlow(0xffffff, 4, 0, false, 0.1, 6);
  return s;
}

function emote(ctx: TradeCtx, x: number, y: number, text: string, color: number): Phaser.GameObjects.Container {
  const { scene } = ctx;
  const t = display(ctx, 0, 0, text, 22, `#${color.toString(16).padStart(6, '0')}`, '#ffffff', 0, { fontStyle: 'normal' }).setOrigin(0.5);
  const g = scene.add.graphics().fillStyle(0xffffff, 1).fillRoundedRect(-t.width / 2 - 12, -18, t.width + 24, 36, 16).lineStyle(3, color, 1).strokeRoundedRect(-t.width / 2 - 12, -18, t.width + 24, 36, 16);
  const c = scene.add.container(x, y, [g, t]);
  if (!ctx.calm) scene.tweens.add({ targets: c, y: y - 6, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return c;
}

export const chibi: TradeStyle = {
  rows: 3,
  frame(ctx) {
    const { scene } = ctx;
    const g = scene.add.graphics().fillStyle(0xfff4d8, 1).fillRect(0, 0, W, H);
    g.fillStyle(0xffaabe, 0.22);
    for (let x = 0; x < W; x += 60) g.fillRect(x, 0, 30, H);
    for (let y = 0; y < H; y += 60) g.fillRect(0, y, W, 30);
    ctx.layers.back.add([g, body(ctx, 14, 10, `₽${ctx.view.money}`, 16, INK, { backgroundColor: '#ffffff', padding: { x: 8, y: 3 } })]);
  },
  stage(ctx, offer) {
    const { scene } = ctx;
    const L = ctx.layers.stage;
    const mat = scene.add.graphics();
    mat.fillStyle(0xc8f0e0, 1).fillRoundedRect(150, 190, 660, 190, 30).lineStyle(4, 0xffffff, 1).strokeRoundedRect(150, 190, 660, 190, 30);
    mat.fillStyle(0xffffff, 0.5).fillRoundedRect(190, 212, 220, 140, 22).fillRoundedRect(550, 212, 220, 140, 22);
    L.add([mat, display(ctx, W / 2, 285, '⇄', 54, '#ff6fa0', '#ffffff', 0, { fontStyle: 'normal' }).setOrigin(0.5)]);
    L.add(sticker(trainer(ctx, ctx.player, 80, 470, 1.8)));
    L.add(emote(ctx, 100, 250, '!?', 0xff6fa0));
    if (offer?.give) {
      const y = sticker(mon(ctx, offer.give, 300, 340, 2.6, 'front', true));
      L.add([y, body(ctx, 300, 356, label(offer.give), 15, '#446688').setOrigin(0.5, 0)]);
      if (!ctx.calm) scene.tweens.add({ targets: y, angle: { from: -4, to: 4 }, duration: 700, yoyo: true, repeat: -1 });
    }
    if (offer) {
      const t = sticker(mon(ctx, offer.get, 660, 340, 2.6));
      L.add([t, body(ctx, 660, 356, label(offer.get), 15, '#446688').setOrigin(0.5, 0)]);
      L.add(sticker(trainer(ctx, offer.trader.art, W - 70, 470, 1.8, true)));
      L.add(emote(ctx, W - 100, 230, '♪', 0x5aa0ff));
      const g = scene.add.graphics().fillStyle(0xffffff, 1).fillRoundedRect(170, 26, 620, 70, 26).lineStyle(4, 0xffb0c8, 1).strokeRoundedRect(170, 26, 620, 70, 26);
      L.add([g, body(ctx, W / 2, 61, `${offer.trader.name}: "${offer.trader.line}"`, 15, '#775533', { align: 'center', wordWrap: { width: 580 } }).setOrigin(0.5)]);
      if (!ctx.calm) scene.tweens.add({ targets: t, angle: { from: 4, to: -4 }, duration: 700, yoyo: true, repeat: -1 });
    }
  },
  list(ctx, rows, first, hooks) {
    const { scene } = ctx;
    const w = 200;
    return rows.map((r, k) => {
      const x = W / 2 + (k - (rows.length - 1) / 2) * (w + 14);
      const box = scene.add.container(x, 470);
      const g = scene.add.graphics();
      const t = body(ctx, 0, -8, r.title, 13, INK, { align: 'center', wordWrap: { width: w - 20 } }).setOrigin(0.5);
      const s = body(ctx, 0, 14, r.problem ?? r.sub, 10, INK, { align: 'center', wordWrap: { width: w - 20 } }).setOrigin(0.5);
      box.add([g, t, s]);
      ctx.layers.list.add(box);
      hit(ctx, box, -w / 2, -28, w, 56, first + k, hooks);
      return {
        focus(on) {
          const fill = on && !r.problem ? 0xff8fb0 : 0xffffff;
          g.clear().fillStyle(on ? 0xd05a88 : 0xe4c8b8, 1).fillRoundedRect(-w / 2, -24, w, 56, 20).fillStyle(fill, 1).fillRoundedRect(-w / 2, -28, w, 56, 20).lineStyle(3, 0xffffff, 1).strokeRoundedRect(-w / 2, -28, w, 56, 20);
          t.setColor(r.problem ? '#c8b0a0' : on ? '#ffffff' : INK);
          s.setColor(r.problem ? '#c8b0a0' : on ? '#fff0f4' : INK);
          box.setY(on ? 466 : 470);
        },
      };
    });
  },
  moment(ctx, o) {
    const { scene } = ctx;
    const L = ctx.layers.top;
    const g = scene.add.graphics().fillStyle(0xfff4d8, 1).fillRect(0, 0, W, H);
    L.add(g);
    const inn = sticker(mon(ctx, o.get, W / 2 - 60, 340, 4.6)).setAngle(-6);
    const out = sticker(mon(ctx, o.give, W - 200, 230, 2.4, 'front', true)).setAngle(16);
    L.add([inn, out, emote(ctx, W / 2 + 80, 110, '♪♪', 0xff6fa0), emote(ctx, W - 160, 110, 'bye!', 0x5aa0ff)]);
    L.add(display(ctx, W / 2, 380, `SWAP! ${o.get.name} is yours~`, 40, '#ff6fa0', '#ffffff', 6, { fontStyle: 'normal' }).setOrigin(0.5, 0));
    L.add(body(ctx, W / 2, 446, `${o.give.name} went to ${o.trader.name}. ${o.get.name} joined at Lv${o.get.level}!`, 16, '#996677').setOrigin(0.5, 0));
    if (ctx.calm) return 400;
    inn.setScale(0);
    scene.tweens.add({ targets: inn, scale: 4.6, duration: 500, delay: 300, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: out, x: W + 80, angle: 60, duration: 800, delay: 600, ease: 'Cubic.easeIn' });
    scene.time.delayedCall(400, () => burst(ctx, L, W / 2, 260, [0xff8fb0, 0x7fd8ff, 0xffe14a, 0x9ae89a], 50, 420));
    return 1700;
  },
};
