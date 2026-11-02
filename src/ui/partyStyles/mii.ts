// 03 Mii Plaza Lineup: a grassy floor and sky behind the team; rows are soft pills.
import { GAME_HEIGHT, GAME_WIDTH } from '../theme';
import { windowFace } from './common';
import type { PartySkin } from './types';
import { bar, frac, hit, icon, moves, pop, sprite, stats, text, typeColor } from './kit';

export const mii: PartySkin = {
  shape: 'pill',
  tabs: { shape: 'pill', gap: 8 },
  palette: { row: 0x24543a, rowAlpha: 0.85, rowFocus: 0x3a9a58, rowRim: 0xc8f0a8, focusRim: 0xffffff, tab: 0x24543a, tabActive: 0x3a9a58, pane: 0x123a28, paneRim: 0xc8f0a8 },
  roster(ctx) {
    const { scene, into, mons, sel } = ctx;
    const g = scene.add.graphics();
    g.fillStyle(0xa8e0ff, 1).fillRect(36, 76, 888, 190).fillStyle(0x7fcf60, 1).fillRect(36, 266, 888, 190).fillStyle(0x62b84c, 1).fillEllipse(480, 266, 1100, 60);
    into.add(g);
    const step = Math.min(148, 860 / mons.length);
    mons.forEach((m, i) => {
      const x = 480 + (i - (mons.length - 1) / 2) * step;
      const on = i === sel;
      const c = scene.add.container(x, 0);
      into.add(c);
      scene.add.ellipse(0, 330, 90, 16, 0x000000, 0.2);
      c.add(scene.add.ellipse(0, 332, 90, 16, 0x000000, 0.22));
      sprite(c, m, 0, 330, on ? 1.9 : 1.5, ctx);
      const plate = scene.add.graphics();
      plate.fillStyle(0xffffff, 0.95).fillRoundedRect(-64, 376, 128, 48, 22).lineStyle(on ? 4 : 2, on ? 0x2aa8f0 : 0xb0c8d8, 1).strokeRoundedRect(-64, 376, 128, 48, 22);
      c.add(plate);
      text(c, 0, 382, `${m.name}  Lv${m.level}`, 13, '#1a3a50', { origin: [0.5, 0], w: 116 });
      bar(c, -50, 404, 100, 8, frac(m), 0xb0c0cc);
      pop(ctx, c, i);
      hit(ctx, x - step / 2, 120, step, 310, i);
    });
    // The summary strip above, for the one under the cursor.
    const m = mons[sel]!;
    const s = scene.add.graphics();
    s.fillStyle(0xffffff, 0.92).fillRoundedRect(300, 84, 600, 52, 14).lineStyle(2, 0xb0c8d8, 1).strokeRoundedRect(300, 84, 600, 52, 14);
    into.add(s);
    text(into, 316, 90, `${m.name} · ${m.types.join('/')} · ${m.nature}`, 14, '#1a3a50', { w: 570 });
    text(into, 316, 112, m.moves.map((x) => x.name).join(' · '), 13, '#3a5a70', { w: 570 });
    text(into, 52, 88, 'Your Team', 22, '#1a3a50');
  },
  chrome(scene, root, motion) {
    windowFace(scene, root, { fill: 0x1c4a6a, rim: 0xe8ffd8, band: 0x3a8a58, bandRim: 0xe8ffd8 });
    const g = scene.add.graphics();
    g.fillStyle(0x4aa04a, 0.5).fillRoundedRect(36, GAME_HEIGHT - 190, GAME_WIDTH - 72, 112, 14);
    g.fillStyle(0x6fc86a, 0.35).fillEllipse(GAME_WIDTH / 2 + 130, GAME_HEIGHT - 120, 560, 70);
    root.add(g);
    for (let i = 0; i < 4; i++) {
      const c = scene.add.ellipse(360 + i * 150, 108 + (i % 2) * 14, 90, 24, 0xffffff, 0.2);
      root.add(c);
      if (motion === 'full') scene.tweens.add({ targets: c, x: c.x + 36, duration: 6000 + i * 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  },
};
