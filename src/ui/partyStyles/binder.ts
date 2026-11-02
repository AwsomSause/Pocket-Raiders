// 04 Card Binder: a leather binder page with ring holes; each Pokémon is a gold-rimmed trading card.
import { GAME_HEIGHT } from '../theme';
import { windowFace } from './common';
import type { PartySkin } from './types';
import { bar, frac, hit, icon, moves, pop, sprite, stats, text, typeColor } from './kit';

export const binder: PartySkin = {
  shape: 'round',
  tabs: { shape: 'square', gap: 3, upper: true },
  palette: { row: 0x3a1c1c, rowAlpha: 0.92, rowFocus: 0x7a3030, rowRim: 0xc8a050, focusRim: 0xffe080, tab: 0x3a1c1c, tabActive: 0x7a3030, pane: 0x2a1212, paneRim: 0xc8a050 },
  roster(ctx) {
    const { scene, into, mons, sel } = ctx;
    const m = mons[sel]!;
    const big = scene.add.container(56, 84);
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.4).fillRoundedRect(4, 6, 250, 366, 14).fillStyle(typeColor(m), 1).fillRoundedRect(0, 0, 250, 366, 14).lineStyle(5, 0xf0d060, 1).strokeRoundedRect(0, 0, 250, 366, 14);
    g.fillStyle(0x14102a, 1).fillRoundedRect(12, 34, 226, 150, 8).fillStyle(0xfff8e0, 0.95).fillRoundedRect(12, 194, 226, 160, 6);
    big.add(g);
    text(big, 14, 8, m.name, 18, '#ffffff', { w: 150, extra: { stroke: '#2a1408', strokeThickness: 3 } });
    text(big, 236, 10, `HP ${m.maxHp}`, 14, '#ff3030', { origin: [1, 0] });
    sprite(big, m, 125, 176, 1.7, ctx);
    m.moves.slice(0, 4).forEach((mv, i) => {
      text(big, 20, 202 + i * 26, mv.name, 13, '#2a1c10', { w: 150 });
      text(big, 230, 202 + i * 26, mv.power, 13, '#2a1c10', { origin: [1, 0] });
    });
    text(big, 20, 314, `${m.types.join('/')} · Lv${m.level} · ${m.hp}/${m.maxHp} HP`, 11, '#5a4a30', { w: 210 });
    into.add(big);
    mons.forEach((o, i) => {
      if (i === sel) return;
      const k = i < sel ? i : i - 1;
      const x = 330 + (k % 3) * 198;
      const y = 84 + Math.floor(k / 3) * 190;
      const c = scene.add.container(x, y);
      const cg = scene.add.graphics();
      cg.fillStyle(0x000000, 0.35).fillRoundedRect(3, 5, 176, 176, 10).fillStyle(o.state === 'down' ? 0x6a6a72 : typeColor(o), 1).fillRoundedRect(0, 0, 176, 176, 10).lineStyle(3, 0xf0d060, 1).strokeRoundedRect(0, 0, 176, 176, 10);
      cg.fillStyle(0xfff8e0, 0.55).fillRoundedRect(8, 28, 160, 110, 6);
      c.add(cg);
      text(c, 10, 6, o.name, 14, '#ffffff', { w: 96, extra: { stroke: '#2a1408', strokeThickness: 3 } });
      text(c, 168, 8, `Lv${o.level}`, 12, '#ffffff', { origin: [1, 0] });
      sprite(c, o, 88, 130, 1.1);
      bar(c, 12, 152, 152, 8, frac(o), 0x2a1c10);
      into.add(c);
      pop(ctx, c, i);
      hit(ctx, x, y, 176, 176, i);
    });
  },
  chrome(scene, root) {
    windowFace(scene, root, { fill: 0x2a1410, rim: 0xc8a050, band: 0x5a2420, bandRim: 0xc8a050, radius: 14 });
    const g = scene.add.graphics();
    for (let y = 110; y < GAME_HEIGHT - 80; y += 84) {
      g.fillStyle(0x000000, 0.6).fillCircle(318, y, 7);
      g.fillStyle(0xc8c8d0, 1).fillRect(310, y - 2, 16, 4);
    }
    g.lineStyle(2, 0xc8a050, 0.35).lineBetween(312, 78, 312, GAME_HEIGHT - 82);
    root.add(g);
  },
};
