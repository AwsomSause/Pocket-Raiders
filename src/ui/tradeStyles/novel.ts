// 03 Visual Novel: the trader stands large over the location art with a name tag and a story box; the deal
// card and the choices sit on the right. The trade plays as a letterboxed "CG" still with a parting line.
import { backdrop, body, enter, H, hit, label, mon, trainer, W } from './common';
import type { TradeStyle } from './types';

const PINK = 0xff7fb0;
const BLUE = 0x5588aa;

export const novel: TradeStyle = {
  rows: 4,
  frame(ctx) {
    const img = backdrop(ctx, ctx.layers.back);
    img?.setAlpha(0.9);
    ctx.layers.back.add(body(ctx, W - 16, 10, `₽${ctx.view.money}`, 18, '#ffffff', { stroke: '#000000', strokeThickness: 4 }).setOrigin(1, 0));
  },
  stage(ctx, offer) {
    const { scene } = ctx;
    const L = ctx.layers.stage;
    if (offer) {
      const t = trainer(ctx, offer.trader.art, 230, 470, 3.6);
      L.add(t);
      enter(ctx, t, -120, 0, 0, 380);
    }
    // Deal card.
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 0.9).fillRoundedRect(520, 40, 400, 170, 18).lineStyle(3, 0x99ddff, 1).strokeRoundedRect(520, 40, 400, 170, 18);
    L.add([g, body(ctx, 540, 50, 'OFFER', 14, '#5588aa')]);
    if (offer) {
      if (offer.give) L.add(mon(ctx, offer.give, 610, 160, 2, 'front', true));
      L.add([body(ctx, 720, 100, '⇄', 30, '#ff77aa').setOrigin(0.5), mon(ctx, offer.get, 830, 160, 2)]);
      L.add(body(ctx, 540, 176, `${offer.give ? `${label(offer.give)} for ` : ''}${label(offer.get)}`, 14, '#333333'));
      L.add(body(ctx, 540, 192, offer.note, 11, '#666666', { wordWrap: { width: 370 } }));
    } else L.add(body(ctx, 720, 120, 'Leave the stop', 18, '#555555').setOrigin(0.5));
    // Story box.
    const box = scene.add.graphics();
    box.fillStyle(0xffffff, 0.94).fillRoundedRect(30, 430, 900, 96, 14).lineStyle(3, 0x99ddff, 1).strokeRoundedRect(30, 430, 900, 96, 14);
    const name = offer?.trader.name ?? 'You';
    const tag = scene.add.graphics().fillStyle(BLUE, 1).fillRoundedRect(46, 416, name.length * 10 + 30, 26, 10);
    L.add([box, tag, body(ctx, 60, 420, name, 16, '#ffffff'), body(ctx, 52, 452, offer ? `"${offer.trader.line}"` : 'Nothing here for me today.', 18, '#333333', { wordWrap: { width: 850 } }), body(ctx, 908, 506, '▼', 16, '#ff77aa')]);
  },
  list(ctx, rows, first, hooks) {
    const { scene } = ctx;
    return rows.map((r, k) => {
      const box = scene.add.container(560, 226 + k * 48);
      const g = scene.add.graphics();
      const t = body(ctx, 20, 10, r.title, 16, '#555555');
      box.add([g, t]);
      ctx.layers.list.add(box);
      hit(ctx, box, 0, 0, 360, 40, first + k, hooks);
      return {
        focus(on) {
          g.clear();
          g.fillStyle(on ? 0xffe0ee : 0xffffff, on ? 1 : 0.78).fillRoundedRect(0, 0, 360, 40, 20).lineStyle(3, on ? PINK : 0xccccdd, 1).strokeRoundedRect(0, 0, 360, 40, 20);
          t.setText(`${on ? '♥ ' : ''}${r.title}${r.problem ? ' 🔒' : ''}`).setColor(r.problem ? '#999999' : on ? '#c0306a' : '#555555');
        },
      };
    });
  },
  moment(ctx, o) {
    const { scene } = ctx;
    const L = ctx.layers.top;
    backdrop(ctx, L, 0xffd8b0);
    const shade = scene.add.rectangle(0, 0, W, H, 0x000000, 0.2).setOrigin(0);
    const glow = scene.add.circle(560, 200, 300, 0xffd0a0, 0.35);
    const top = scene.add.rectangle(0, 0, W, 54, 0x000000).setOrigin(0);
    const bot = scene.add.rectangle(0, H - 54, W, 54, 0x000000).setOrigin(0);
    const player = trainer(ctx, ctx.player, 280, 410, 2.4);
    const got = mon(ctx, o.get, 400, 410, 3);
    const tr = trainer(ctx, o.trader.art, 700, 410, 2.4, true);
    const gone = mon(ctx, o.give, 590, 410, 3, 'front', true);
    const box = scene.add.graphics().fillStyle(0xffffff, 0.94).fillRoundedRect(60, 400, 840, 74, 14).lineStyle(3, 0xffb4d0, 1).strokeRoundedRect(60, 400, 840, 74, 14);
    const tag = scene.add.graphics().fillStyle(PINK, 1).fillRoundedRect(76, 386, o.trader.name.length * 10 + 30, 26, 10);
    L.add([shade, glow, top, bot, player, got, tr, gone, box, tag, body(ctx, 90, 390, o.trader.name, 16, '#ffffff'), body(ctx, 84, 420, `"I promise ${o.give.name} will be happy here." ${o.give.name} waves one last time... ${o.get.name} joined at Lv${o.get.level}!`, 16, '#333333', { wordWrap: { width: 800 } })]);
    if (ctx.calm) return 400;
    top.setY(-54);
    bot.setY(H);
    scene.tweens.add({ targets: top, y: 0, duration: 400, ease: 'Cubic.easeOut' });
    scene.tweens.add({ targets: bot, y: H - 54, duration: 400, ease: 'Cubic.easeOut' });
    enter(ctx, got, 260, 0, 500, 700);
    scene.tweens.add({ targets: gone, y: gone.y - 10, duration: 300, yoyo: true, repeat: 2, delay: 900 });
    return 1800;
  },
};
