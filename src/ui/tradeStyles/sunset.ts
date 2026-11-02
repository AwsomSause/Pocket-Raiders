// 11 Sunset Farewell: an emotional anime goodbye. A warm sunset over the place, your Pokémon looking back at you,
import type Phaser from 'phaser';
// a polaroid "memory" of it from this run. The trade is a slow wave goodbye: a tear sparkle, the old friend
// walking off with the trader and the new one running to your side.
import { backdrop, body, display, enter, H, hit, jp, label, mon, trainer, W } from './common';
import type { TradeCtx, TradeStyle } from './types';

const DUSK = 0x3c1432;

function sunset(ctx: TradeCtx, into: Phaser.GameObjects.Container): void {
  const { scene } = ctx;
  backdrop(ctx, into, 0xffa070);
  const g = scene.add.graphics().fillGradientStyle(0xff7840, 0xff7840, 0x902870, 0x902870, 0.35).fillRect(0, 0, W, H);
  const sun = scene.add.circle(W / 2, 140, 70, 0xffd080, 0.9);
  into.add([g, sun]);
  if (!ctx.calm) scene.tweens.add({ targets: sun, scale: 1.06, alpha: 0.75, duration: 2000, yoyo: true, repeat: -1 });
}

export const sunsetStyle: TradeStyle = {
  rows: 3,
  frame(ctx) {
    sunset(ctx, ctx.layers.back);
    ctx.layers.back.add(body(ctx, 14, 10, `${ctx.view.place} · ₽${ctx.view.money}`, 15, '#ffffff', { stroke: '#000000', strokeThickness: 3 }));
  },
  stage(ctx, offer) {
    const { scene } = ctx;
    const L = ctx.layers.stage;
    L.add(trainer(ctx, ctx.player, 90, 440, 2));
    if (offer?.give) {
      L.add(mon(ctx, offer.give, 220, 440, 3, 'back'));
      // The polaroid: this Pokémon at its best on this run.
      const pc = scene.add.container(390, 290).setAngle(-5);
      const g = scene.add.graphics().fillStyle(0x000000, 0.25).fillRect(-80, -92, 172, 200).fillStyle(0xffffff, 1).fillRect(-86, -98, 172, 200).fillStyle(0x88b070, 1).fillRect(-76, -88, 152, 140);
      pc.add([g, mon(ctx, offer.give, 0, 46, 2), body(ctx, -76, 60, `${label(offer.give)}\nOur adventure`, 12, '#664444')]);
      L.add(pc);
      enter(ctx, pc, 0, 60, 0, 500);
    }
    if (offer) {
      L.add([mon(ctx, offer.get, 640, 440, 2.6), trainer(ctx, offer.trader.art, 760, 446, 1.9, true)]);
      const g = scene.add.graphics().fillStyle(DUSK, 0.78).fillRoundedRect(540, 40, 400, 96, 14).lineStyle(2, 0xffc89a, 1).strokeRoundedRect(540, 40, 400, 96, 14);
      L.add([g, body(ctx, 556, 50, `${offer.trader.name}:`, 15, '#ffd8b0'), body(ctx, 556, 72, `"${offer.trader.line}"`, 14, '#ffffff', { wordWrap: { width: 370 } })]);
    }
  },
  list(ctx, rows, first, hooks) {
    const { scene } = ctx;
    const w = (W - 40) / rows.length - 12;
    return rows.map((r, k) => {
      const box = scene.add.container(26 + k * (w + 12), 470);
      const g = scene.add.graphics();
      const t = body(ctx, 18, 8, r.title, 14, '#ffffff', { wordWrap: { width: w - 30 } });
      const s = body(ctx, 18, 30, r.problem ?? r.sub, 11, '#ffe4d0', { wordWrap: { width: w - 30 } });
      box.add([g, t, s]);
      ctx.layers.list.add(box);
      hit(ctx, box, 0, 0, w, 54, first + k, hooks);
      return {
        focus(on) {
          g.clear();
          if (on && !r.problem) g.fillGradientStyle(0xffb070, 0xff7090, 0xffb070, 0xff7090, 1).fillRoundedRect(0, 0, w, 54, 27);
          else g.fillStyle(DUSK, 0.72).fillRoundedRect(0, 0, w, 54, 27);
          g.lineStyle(2, 0xffd8b0, 1).strokeRoundedRect(0, 0, w, 54, 27);
          t.setColor(r.problem ? '#aa8899' : '#ffffff');
        },
      };
    });
  },
  moment(ctx, o) {
    const { scene } = ctx;
    const L = ctx.layers.top;
    sunset(ctx, L);
    const pl = trainer(ctx, ctx.player, 280, 450, 2.2);
    const inn = mon(ctx, o.get, 400, 450, 3);
    const tr = trainer(ctx, o.trader.art, 720, 446, 2, true);
    const gone = mon(ctx, o.give, 620, 450, 2.4, 'back');
    const tear = jp(ctx, 296, 300, '✦', 22, '#bfefff', '#ffffff', 2);
    const call = display(ctx, 600, 300, `"${o.give.name.slice(0, 6)}...!"`, 26, '#ffffff', '#a04060', 5, { fontStyle: 'normal' });
    const bar = scene.add.graphics().fillGradientStyle(0x280a28, 0x280a28, 0x280a28, 0x280a28, 0, 0, 0.9, 0.9).fillRect(0, H - 80, W, 80);
    L.add([pl, inn, tr, gone, tear, call, bar, body(ctx, W / 2, H - 36, `${o.give.name} looks back one last time. ${o.get.name} runs to your side! (Lv${o.get.level})`, 16, '#ffffff').setOrigin(0.5)]);
    if (ctx.calm) return 400;
    inn.setX(900);
    scene.tweens.add({ targets: inn, x: 400, duration: 1200, delay: 600, ease: 'Sine.easeOut' });
    scene.tweens.add({ targets: [gone, tr], x: '+=220', alpha: 0.5, duration: 2200, delay: 900, ease: 'Sine.easeIn' });
    tear.setAlpha(0);
    scene.tweens.add({ targets: tear, alpha: 1, y: 330, duration: 900, delay: 400 });
    call.setAlpha(0);
    scene.tweens.add({ targets: call, alpha: 1, duration: 400, delay: 300, hold: 1200, yoyo: true });
    return 2300;
  },
};
