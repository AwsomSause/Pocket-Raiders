// 02 Shonen Versus: the screen splits on a lightning diagonal in each Pokémon's type colour, trainers in the
// corners, a giant VS. The trade slams the halves together: an impact flash and the new Pokémon in the light.
import { body, display, enter, flash, H, hit, hue, label, mon, momentLine, speedLines, trainer, W } from './common';
import type { TradeStyle } from './types';

export const versus: TradeStyle = {
  rows: 4,
  frame(ctx) {
    ctx.layers.back.add(ctx.scene.add.rectangle(0, 0, W, H, 0x181828).setOrigin(0));
  },
  stage(ctx, offer) {
    const { scene } = ctx;
    const L = ctx.layers.stage;
    const left = offer?.give ? hue(offer.give) : 0x3a4a8a;
    const right = offer ? hue(offer.get) : 0x8a3a4a;
    const g = scene.add.graphics();
    g.fillStyle(left, 1).fillPoints([{ x: 0, y: 0 }, { x: 560, y: 0 }, { x: 400, y: 440 }, { x: 0, y: 440 }], true);
    g.fillStyle(right, 1).fillPoints([{ x: 566, y: 0 }, { x: W, y: 0 }, { x: W, y: 440 }, { x: 406, y: 440 }], true);
    g.lineStyle(6, 0xffffff, 1).lineBetween(563, 0, 403, 440);
    L.add([g, speedLines(scene.add.graphics(), W / 2, 220, 0xffffff, 0.18, 70, 120, 2)]);
    L.add(scene.add.text(20, 14, `${ctx.view.place} · ${offer?.trader.name ?? ''} · ₽${ctx.view.money}`, { fontFamily: 'PokemonMain, monospace', fontSize: '16px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 10, y: 4 } }));
    L.add(trainer(ctx, ctx.player, 70, 240, 1.6));
    if (offer) L.add(trainer(ctx, offer.trader.art, W - 70, 240, 1.6, true));
    if (offer?.give) {
      const y = mon(ctx, offer.give, 250, 360, 4, 'front', true);
      L.add([y, body(ctx, 150, 370, label(offer.give), 22, '#ffffff', { stroke: '#000000', strokeThickness: 4 }), body(ctx, 150, 398, offer.give.types.join('/').toUpperCase(), 14, '#ffffff', { stroke: '#000000', strokeThickness: 3 })]);
      enter(ctx, y, -200);
    }
    if (offer) {
      const t = mon(ctx, offer.get, 712, 360, 4);
      L.add([t, body(ctx, 810, 370, label(offer.get), 22, '#ffffff', { stroke: '#000000', strokeThickness: 4 }).setOrigin(1, 0), body(ctx, 810, 398, offer.get.types.join('/').toUpperCase(), 14, '#ffffff', { stroke: '#000000', strokeThickness: 3 }).setOrigin(1, 0)]);
      enter(ctx, t, 200);
    }
    const vs = display(ctx, W / 2 - 6, 190, 'VS', 110, '#ffffff', '#000000', 10).setOrigin(0.5).setAngle(-8);
    L.add(vs);
    if (!ctx.calm) scene.tweens.add({ targets: vs, scale: { from: 2, to: 1 }, duration: 320, ease: 'Back.easeOut' });
  },
  list(ctx, rows, first, hooks) {
    const { scene } = ctx;
    ctx.layers.list.add(scene.add.rectangle(0, 440, W, 100, 0x000000, 0.85).setOrigin(0).setStrokeStyle(4, 0xffffff));
    const w = (W - 40) / rows.length - 10;
    return rows.map((r, k) => {
      const x = 24 + k * (w + 10);
      const box = scene.add.container(x, 458);
      const g = scene.add.graphics();
      const t = body(ctx, 18, 10, r.title, 15, '#ffffff', { wordWrap: { width: w - 26 } });
      const s = body(ctx, 18, 42, r.problem ?? r.sub, 12, '#dddddd', { wordWrap: { width: w - 26 } });
      box.add([g, t, s]);
      ctx.layers.list.add(box);
      hit(ctx, box, 0, 0, w, 66, first + k, hooks);
      return {
        focus(on) {
          g.clear();
          g.fillStyle(r.problem ? 0x44444c : on ? 0xffe14a : 0x2a2a3a, 1).fillPoints([{ x: 12, y: 0 }, { x: w, y: 0 }, { x: w - 12, y: 66 }, { x: 0, y: 66 }], true);
          g.lineStyle(3, 0xffffff, 1).strokePoints([{ x: 12, y: 0 }, { x: w, y: 0 }, { x: w - 12, y: 66 }, { x: 0, y: 66 }], true);
          t.setColor(on && !r.problem ? '#000000' : '#ffffff');
          s.setColor(on && !r.problem ? '#222222' : '#bbbbbb');
        },
      };
    });
  },
  moment(ctx, o) {
    const { scene } = ctx;
    const L = ctx.layers.top;
    const g = scene.add.graphics();
    g.fillStyle(hue(o.give), 1).fillRect(0, 0, W, H);
    g.fillStyle(hue(o.get), 1).fillPoints([{ x: 560, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 360, y: H }], true);
    L.add([g, speedLines(scene.add.graphics(), W / 2, H / 2, 0xffffff, 0.35, 90, 80, 5)]);
    const glow = scene.add.circle(W / 2, H / 2, 160, 0xffffff, 0.9);
    const out = mon(ctx, o.give, W / 2 + 40, H / 2 + 120, 5).setTintFill(0xffffff);
    const inn = mon(ctx, o.get, W / 2 - 40, H / 2 + 130, 5.5);
    const title = display(ctx, W / 2, 34, 'TRADE BREAK!!', 76, '#ffffff', '#000000', 8).setOrigin(0.5, 0);
    L.add([glow, out, inn, title, body(ctx, W / 2, H - 60, momentLine(o), 18, '#ffffff', { stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5)]);
    if (ctx.calm) {
      out.setAlpha(0);
      return 400;
    }
    inn.setAlpha(0);
    scene.tweens.add({ targets: out, x: W + 120, alpha: 0, duration: 520, delay: 200, ease: 'Cubic.easeIn' });
    scene.tweens.add({ targets: inn, alpha: 1, x: { from: -120, to: inn.x }, duration: 520, delay: 520, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: glow, scale: { from: 0.2, to: 1.1 }, duration: 500, delay: 500, ease: 'Cubic.easeOut' });
    scene.tweens.add({ targets: title, scale: { from: 2.2, to: 1 }, duration: 260, delay: 520, ease: 'Back.easeOut' });
    flash(ctx, L, 0xffffff, 300, 500);
    return 1900;
  },
};
