// 01 Manga Page: a black-and-white screentone page. Slanted panels hold the trader (with a speech balloon),
// your Pokémon and theirs; the options sit in the bottom panel. The trade is a full-bleed splash page.
import { body, burst, display, enter, grayscale, H, jp, label, mon, momentLine, row, screentone, speedLines, trainer, W } from './common';
import type { TradeStyle } from './types';

const INK = 0x101010;
const PAPER = 0xf4f0e6;

function balloon(ctx: Parameters<TradeStyle['frame']>[0], x: number, y: number, w: number, text: string): void {
  const t = body(ctx, x, y, text, 14, '#101010', { wordWrap: { width: w - 36 }, align: 'center' }).setOrigin(0.5, 0);
  const h = t.height + 26;
  const g = ctx.scene.add.graphics();
  g.fillStyle(0xffffff, 1).lineStyle(3, INK, 1).fillEllipse(x, y + h / 2 - 12, w, h).strokeEllipse(x, y + h / 2 - 12, w, h);
  g.fillTriangle(x - 40, y + h - 20, x - 70, y + h + 18, x - 14, y + h - 16);
  t.setY(y + 1);
  ctx.layers.stage.add([g, t]);
}

export const manga: TradeStyle = {
  rows: 3,
  frame(ctx) {
    const { scene } = ctx;
    const g = scene.add.graphics();
    g.fillStyle(0xe8e4da, 1).fillRect(0, 0, W, H);
    ctx.layers.back.add(g);
  },
  stage(ctx, offer) {
    const { scene } = ctx;
    const L = ctx.layers.stage;
    const g = scene.add.graphics();
    // Panel 1 (trader, slanted right edge), panel 2 (yours, speed lines), panel 3 (theirs, tone).
    g.fillStyle(PAPER, 1).fillPoints([{ x: 18, y: 18 }, { x: 410, y: 18 }, { x: 362, y: 330 }, { x: 18, y: 330 }], true);
    screentone(g, 18, 200, 360, 130, INK, 0.25, 6, 1);
    g.fillStyle(0xffffff, 1).fillPoints([{ x: 426, y: 18 }, { x: 664, y: 18 }, { x: 664, y: 330 }, { x: 378, y: 330 }], true);
    g.fillStyle(0xffffff, 1).fillRect(676, 18, 266, 312);
    screentone(g, 676, 18, 266, 312, INK, 0.18, 7, 1.3);
    L.add(g);
    const lines = speedLines(scene.add.graphics(), 520, 175, INK, 0.28, 48, 60, 3);
    lines.setMask(scene.make.graphics({}, false).fillPoints([{ x: 426, y: 18 }, { x: 664, y: 18 }, { x: 664, y: 330 }, { x: 378, y: 330 }], true).createGeometryMask());
    L.add(lines);
    const ink = scene.add.graphics().lineStyle(4, INK, 1);
    ink.strokePoints([{ x: 18, y: 18 }, { x: 410, y: 18 }, { x: 362, y: 330 }, { x: 18, y: 330 }], true);
    ink.strokePoints([{ x: 426, y: 18 }, { x: 664, y: 18 }, { x: 664, y: 330 }, { x: 378, y: 330 }], true);
    ink.strokeRect(676, 18, 266, 312);
    if (!offer) {
      const t = trainer(ctx, ctx.player, 190, 322, 2.4);
      grayscale(t);
      L.add([ink, t, display(ctx, 540, 150, '...?', 64, '#101010', '#ffffff', 6).setOrigin(0.5)]);
      return;
    }
    const tr = trainer(ctx, offer.trader.art, 150, 326, 2.3);
    grayscale(tr);
    L.add([tr, ink]);
    balloon(ctx, 270, 34, 230, `"${offer.trader.line}"`);
    if (offer.give) {
      const y = mon(ctx, offer.give, 520, 300, 3.4, 'front', true);
      grayscale(y);
      L.add([y, body(ctx, 410, 300, `YOUR ${label(offer.give).toUpperCase()}`, 13, '#101010')]);
      enter(ctx, y, -60);
    }
    const t = mon(ctx, offer.get, 808, 300, 3.4);
    grayscale(t);
    L.add([t, body(ctx, 690, 300, `THEIR ${label(offer.get).toUpperCase()}`, 13, '#101010')]);
    enter(ctx, t, 60);
    L.add(jp(ctx, 616, 120, '⇄', 60, '#101010', '#ffffff', 6).setAngle(-8));
  },
  list(ctx, rows, first, hooks) {
    const { scene } = ctx;
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 1).fillRect(18, 346, 924, 176).lineStyle(4, INK, 1).strokeRect(18, 346, 924, 176);
    ctx.layers.list.add([g, display(ctx, 36, 356, ctx.view.place, 16, '#101010', '#ffffff', 0, { fontStyle: 'normal' }), body(ctx, 924, 358, `₽${ctx.view.money}`, 18, '#101010').setOrigin(1, 0)]);
    return rows.map((r, k) =>
      row(ctx, 30, 386 + k * 44, 900, 40, r, first + k, hooks, (gg, on, locked) => {
        if (on) gg.fillStyle(locked ? 0x6a6a6a : INK, 1).fillPoints([{ x: 8, y: 0 }, { x: 640, y: 0 }, { x: 632, y: 40 }, { x: 0, y: 40 }], true);
      }, { on: '#ffffff', off: '#101010', sub: undefined }),
    );
  },
  moment(ctx, o) {
    const { scene } = ctx;
    const L = ctx.layers.top;
    const g = scene.add.graphics().fillStyle(0xffffff, 1).fillRect(0, 0, W, H);
    L.add([g, speedLines(scene.add.graphics(), W / 2, H / 2 - 20, INK, 0.9, 90, 150, 7)]);
    L.add(scene.add.circle(W / 2, H / 2 - 20, 150, 0xffffff).setStrokeStyle(6, INK));
    const out = mon(ctx, o.give, W / 2, H / 2 + 90, 4);
    grayscale(out);
    const inn = mon(ctx, o.get, W / 2, H / 2 + 100, 4.6);
    grayscale(inn);
    L.add([out, inn]);
    inn.setAlpha(0);
    const sfx = jp(ctx, 40, 24, 'シュン!', 110, '#101010', '#ffffff', 8).setAngle(-10);
    const pow = display(ctx, W - 40, H - 120, 'FWOOSH!', 58, '#101010', '#ffffff', 6).setOrigin(1, 0).setAngle(6);
    const bar = scene.add.rectangle(0, H - 46, W, 46, INK).setOrigin(0);
    L.add([sfx, pow, bar, body(ctx, 20, H - 36, momentLine(o), 16, '#ffffff')]);
    if (ctx.calm) {
      out.setAlpha(0);
      inn.setAlpha(1);
      return 400;
    }
    scene.tweens.add({ targets: out, x: W / 2 - 260, angle: -20, alpha: 0, duration: 600, delay: 300, ease: 'Cubic.easeIn' });
    scene.tweens.add({ targets: inn, alpha: 1, scale: { from: inn.scale * 1.6, to: inn.scale }, duration: 500, delay: 800, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: sfx, scale: { from: 1.6, to: 1 }, duration: 300, ease: 'Back.easeOut' });
    scene.time.delayedCall(800, () => burst(ctx, L, W / 2, H / 2, [INK, 0x888888, 0xffffff], 30));
    return 2000;
  },
};
