// 10 Manga Roster: a black page with white ink frames, screentone dots and slanted character panels.
import { windowFace, dots } from './common';
import type { PartySkin } from './types';
import { panelOverview, bodyFrames } from './overviews';
import { bar, frac, hit, icon, moves, pop, sprite, stats, text, typeColor } from './kit';

export const manga: PartySkin = {
  shape: 'slant',
  frame: bodyFrames.manga,
  overview: panelOverview({ panel: 0xf4f4f0, rim: 0x111111, ink: '#111111', label: '#555555', gauge: 0x111111 }),
  tabs: { shape: 'slant', gap: 4, upper: true },
  palette: { row: 0x1a1a1a, rowAlpha: 0.95, rowFocus: 0x3a3a3a, rowRim: 0xe8e8e8, focusRim: 0xffffff, tab: 0x161616, tabActive: 0x484848, pane: 0x111111, paneRim: 0xf0f0f0 },
  roster(ctx) {
    const { scene, into, mons, sel } = ctx;
    const colors = [0xf08a2a, 0xf8d838, 0xf86aa0, 0xd83030, 0x9aa0a8, 0xc8c0a0];
    const w = Math.floor(888 / mons.length);
    mons.forEach((m, i) => {
      const x = 36 + i * w;
      const on = i === sel;
      const c = scene.add.container(x, 76);
      const g = scene.add.graphics();
      g.fillStyle(colors[i % colors.length]!, 1).fillRect(0, 0, w, 300);
      g.fillStyle(0xffffff, 0.12);
      for (let yy = 8; yy < 300; yy += 12) for (let xx = 6 + ((yy / 12) % 2) * 6; xx < w; xx += 12) g.fillCircle(xx, yy, 1.6);
      g.fillStyle(0x000000, 1).fillRect(0, 0, 4, 300);
      c.add(g);
      sprite(c, m, w / 2, 285, on ? 1.9 : 1.6, ctx);
      text(c, w / 2, 288, m.name.toUpperCase(), 12, '#ffffff', { origin: [0.5, 0], w: w - 8, extra: { stroke: '#101010', strokeThickness: 4 } });
      text(c, w / 2, 304, `Lv${m.level}`, 11, '#101010', { origin: [0.5, 0] });
      if (on) {
        const f = scene.add.graphics();
        f.lineStyle(6, 0x101010, 1).strokeRect(2, 2, w - 4, 296).lineStyle(2, 0xffffff, 1).strokeRect(7, 7, w - 14, 286);
        c.add(f);
      }
      into.add(c);
      pop(ctx, c, i);
      hit(ctx, x, 76, w, 320, i);
    });
    const m = mons[sel]!;
    const b = scene.add.graphics();
    b.fillStyle(0xffffff, 1).fillRect(36, 396, 888, 58).lineStyle(4, 0x101010, 1).strokeRect(36, 396, 888, 58);
    into.add(b);
    text(into, 50, 402, `${m.name.toUpperCase()}!`, 20, '#101010');
    text(into, 50, 428, `${m.nature} · ${m.hp}/${m.maxHp} HP · ${m.moves.map((x) => x.name).join(' · ')}`, 13, '#303030', { w: 860 });
  },
  chrome(scene, root) {
    windowFace(scene, root, { fill: 0x0a0a0a, rim: 0xffffff, band: 0x202020, bandRim: 0xffffff, radius: 3 });
    dots(scene, root, 0xffffff, 0.07, 14, 2.2);
    const g = scene.add.graphics();
    g.fillStyle(0xe83040, 1).fillTriangle(44, 70, 120, 70, 44, 96);
    root.add(g);
  },
};
