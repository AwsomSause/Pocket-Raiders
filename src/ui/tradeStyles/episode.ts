// 05 Episode Title Card: every trade is an "episode". A slanted white title card names it ("Episode 14:
// Squirtle for Eevee?! Fenn the Breeder's Offer!"), subtitles run under the scene and a channel bug sits in the
// corner. The trade plays as the ending card with a "Next time..." line.
import { backdrop, body, display, enter, H, hit, label, mon, trainer, W } from './common';
import type { TradeStyle } from './types';

const PINK = 0xff3a6a;
const episodeNo = (seed: string): number => 1 + ([...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % 99);

export const episode: TradeStyle = {
  rows: 4,
  frame(ctx) {
    const { scene } = ctx;
    backdrop(ctx, ctx.layers.back);
    ctx.layers.back.add(scene.add.rectangle(0, H * 0.6, W, H * 0.4, 0x000000, 0.35).setOrigin(0));
    const bug = scene.add.text(W - 14, 10, 'PKR TV ● LIVE', { fontFamily: 'PokemonMain, monospace', fontSize: '13px', color: '#ffffff', backgroundColor: '#00000066', padding: { x: 8, y: 3 } }).setOrigin(1, 0);
    ctx.layers.back.add(bug);
    if (!ctx.calm) scene.tweens.add({ targets: bug, alpha: 0.5, duration: 900, yoyo: true, repeat: -1 });
  },
  stage(ctx, offer) {
    const { scene } = ctx;
    const L = ctx.layers.stage;
    const card = scene.add.container(-20, 30).setAngle(-4);
    const g = scene.add.graphics().fillStyle(0xffffff, 1).fillRect(0, 0, 620, 170).fillStyle(PINK, 1).fillRect(8, 170, 620, 8);
    const title = offer?.give ? `${offer.give.name} for ${offer.get.name}?!\n${offer.trader.name}'s Offer!` : offer ? `${offer.trader.name}\nWants ${offer.note.replace(/^Wants /, '')}` : 'See You\nNext Time!';
    card.add([g, display(ctx, 46, 12, `EPISODE ${episodeNo(ctx.view.sideId)}`, 18, '#ff3a6a', '#ffffff', 0, { fontStyle: 'normal' }), display(ctx, 46, 42, title, 34, '#1a1a40', '#ffffff', 0, { fontStyle: 'normal', lineSpacing: 2 })]);
    L.add(card);
    enter(ctx, card, -500, 0, 0, 450);
    if (offer) {
      const tr = trainer(ctx, offer.trader.art, 740, 440, 2.6);
      L.add(tr);
      if (offer.give) L.add(mon(ctx, offer.give, 580, 440, 2.2, 'front', true));
      L.add(mon(ctx, offer.get, 880, 440, 2.2));
      L.add(body(ctx, W / 2, 470, `"${offer.trader.line}"`, 18, '#ffffff', { stroke: '#000000', strokeThickness: 5, align: 'center', wordWrap: { width: 860 } }).setOrigin(0.5, 0));
    }
  },
  list(ctx, rows, first, hooks) {
    const { scene } = ctx;
    return rows.map((r, k) => {
      const box = scene.add.container(30, 236 + k * 52);
      const g = scene.add.graphics();
      const t = body(ctx, 22, 12, r.title, 16, '#ffffff');
      const s = body(ctx, 384, 15, r.problem ?? r.sub, 11, '#dddddd').setOrigin(1, 0);
      box.add([g, t, s]);
      ctx.layers.list.add(box);
      hit(ctx, box, 0, 0, 400, 44, first + k, hooks);
      return {
        focus(on) {
          g.clear().fillStyle(on && !r.problem ? 0xffe14a : 0x000000, on ? 1 : 0.65).fillRect(0, 0, 400, 44).fillStyle(PINK, 1).fillRect(0, 0, 8, 44);
          t.setColor(r.problem ? '#888888' : on ? '#000000' : '#ffffff');
          s.setColor(on && !r.problem ? '#333333' : '#bbbbbb');
        },
      };
    });
  },
  moment(ctx, o) {
    const { scene } = ctx;
    const L = ctx.layers.top;
    backdrop(ctx, L, 0xffd0a0);
    L.add(scene.add.rectangle(0, 0, W, H, 0x200010, 0.25).setOrigin(0));
    const got = mon(ctx, o.get, 480, 420, 4);
    const pl = trainer(ctx, ctx.player, 350, 430, 2.2);
    const gone = mon(ctx, o.give, 700, 380, 2, 'front', true).setAlpha(0.75);
    const head = display(ctx, 40, 40, 'ENDING', 22, '#ffe14a', '#000000', 4, { fontStyle: 'normal' });
    const title = display(ctx, 40, 72, `Goodbye ${o.give.name},\nHello ${o.get.name}!`, 46, '#ffffff', '#000000', 6, { lineSpacing: 2 });
    const next = body(ctx, W / 2, H - 50, `NEXT TIME: ${label(o.get)} joins the team! What will happen...?`, 18, '#ffe14a', { stroke: '#000000', strokeThickness: 5 }).setOrigin(0.5);
    L.add([gone, pl, got, head, title, next]);
    if (ctx.calm) return 400;
    enter(ctx, title, -400, 0, 200, 500);
    enter(ctx, got, 200, 0, 500, 600);
    scene.tweens.add({ targets: gone, x: gone.x + 160, alpha: 0, duration: 1400, delay: 400 });
    next.setAlpha(0);
    scene.tweens.add({ targets: next, alpha: 1, duration: 400, delay: 1200 });
    return 1900;
  },
};
