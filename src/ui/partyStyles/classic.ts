// 02 Enhanced Classic: flat navy panels with crisp white borders and square rows, like the Essentials party screen.
import { windowFace } from './common';
import type { PartySkin } from './types';
import { bar, frac, hit, icon, moves, pop, sprite, stats, text, typeColor } from './kit';

export const classic: PartySkin = {
  shape: 'square',
  palette: { row: 0x1c2c58, rowAlpha: 0.95, rowFocus: 0x3a58a8, rowRim: 0xa8c0f0, focusRim: 0xfff2b0, tab: 0x1c2c58, tabActive: 0x3a58a8, pane: 0x101c3c, paneRim: 0xa8c0f0 },
  roster(ctx) {
    const { scene, into, mons, sel } = ctx;
    const colW = 436;
    mons.forEach((m, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 42 + col * (colW + 8);
      const y = 80 + row * 126;
      const on = i === sel;
      const c = scene.add.container(x, y);
      const g = scene.add.graphics();
      const base = m.state === 'down' ? 0xb82818 : 0x20883a;
      g.fillStyle(0x000000, 0.35).fillRect(3, 4, colW, 118).fillStyle(base, 1).fillRect(0, 0, colW, 118).fillStyle(0xffffff, 0.14).fillRect(0, 0, colW, 40);
      g.lineStyle(on ? 5 : 2, on ? 0xff4030 : 0x0a3a14, 1).strokeRect(0, 0, colW, 118);
      c.add(g);
      icon(c, m, 52, 60, 2);
      text(c, 104, 12, m.name, 22, '#ffffff', { w: 220, extra: { stroke: '#0a2a10', strokeThickness: 3 } });
      text(c, 104, 42, `Lv${m.level}`, 16, '#e8ffe8');
      text(c, colW - 14, 14, m.tag, 14, '#fff2b0', { origin: [1, 0] });
      bar(c, 104, 74, 250, 12, frac(m), 0x0a2a10);
      text(c, colW - 14, 70, `${m.hp}/${m.maxHp}`, 16, '#ffffff', { origin: [1, 0] });
      into.add(c);
      pop(ctx, c, i);
      hit(ctx, x, y, colW, 118, i);
    });
  },
  chrome(scene, root) {
    windowFace(scene, root, { fill: 0x0c1430, rim: 0xf0f4ff, band: 0x20386c, bandRim: 0xf0f4ff, radius: 6 });
  },
};
