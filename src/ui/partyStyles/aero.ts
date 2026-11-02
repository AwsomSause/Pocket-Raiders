// 01 Aero Glass: deep glass window with bright aqua rims and slowly rising bubbles.
import { windowFace } from './common';
import type { PartySkin } from './types';
import { bubbleOverview, bodyFrames } from './overviews';
import { bar, frac, hit, icon, moves, pop, sprite, stats, text, typeColor } from './kit';

export const aero: PartySkin = {
  shape: 'round',
  frame: bodyFrames.aero,
  overview: bubbleOverview,
  palette: { row: 0x0a3a5a, rowAlpha: 0.7, rowFocus: 0x2a8ac8, rowRim: 0x7ff3ff, focusRim: 0xffffff, tab: 0x0a3a5a, tabActive: 0x2a8ac8, pane: 0x062a44, paneRim: 0x7ff3ff },
  roster(ctx) {
    const { scene, into, mons, sel } = ctx;
    mons.forEach((m, i) => {
      const y = 82 + i * 62;
      const on = i === sel;
      const row = scene.add.container(48, y);
      const g = scene.add.graphics();
      g.fillStyle(on ? 0xdff6ff : 0x6ec8f0, on ? 0.95 : 0.55).fillRoundedRect(0, 0, 330, 56, 18).lineStyle(on ? 3 : 2, on ? 0xffffff : 0xa8e8ff, 1).strokeRoundedRect(0, 0, 330, 56, 18);
      g.fillStyle(0xffffff, 0.35).fillRoundedRect(6, 3, 318, 18, 14);
      row.add(g);
      icon(row, m, 30, 28, 1.2);
      text(row, 58, 6, `${m.name}  Lv${m.level}`, 15, on ? '#103a5a' : '#ffffff', { w: 170 });
      text(row, 320, 8, m.tag, 11, on ? '#a04010' : '#fff2b0', { origin: [1, 0] });
      bar(row, 58, 34, 220, 9, frac(m));
      text(row, 320, 31, `${m.hp}/${m.maxHp}`, 11, on ? '#103a5a' : '#e8f6ff', { origin: [1, 0] });
      into.add(row);
      pop(ctx, row, i);
      hit(ctx, 48, y, 330, 56, i);
    });
    const m = mons[sel]!;
    const g = scene.add.graphics();
    g.fillStyle(0xc8f0ff, 0.9).fillRoundedRect(396, 82, 516, 372, 26).lineStyle(3, 0xffffff, 1).strokeRoundedRect(396, 82, 516, 372, 26);
    g.fillStyle(0xffffff, 0.4).fillCircle(490, 170, 74);
    into.add(g);
    sprite(into, m, 490, 220, 2.6, ctx);
    text(into, 600, 96, m.name, 26, '#103a5a');
    text(into, 600, 130, `Lv${m.level} · ${m.types.join(' / ')}`, 14, '#2a6a90');
    text(into, 600, 152, `Ability ${m.ability}`, 13, '#1a4a70', { w: 300 });
    text(into, 600, 172, `Nature ${m.nature}`, 13, '#1a4a70', { w: 300 });
    stats(into, m, 416, 250, 230, '#103a5a', 17);
    moves(into, m, 670, 250, 226, '#103a5a', 24);
  },
  chrome(scene, root, motion) {
    windowFace(scene, root, { fill: 0x0b3d63, rim: 0x9fefff, band: 0x2a9ad8, bandRim: 0xe8ffff });
    for (let i = 0; i < 9; i++) {
      const b = scene.add.circle(340 + ((i * 71) % 570), 460, 6 + (i % 3) * 5, 0xffffff, 0.14).setStrokeStyle(1, 0xffffff, 0.4);
      root.add(b);
      if (motion === 'full') scene.tweens.add({ targets: b, y: 90, alpha: 0, duration: 7000 + i * 600, delay: i * 800, repeat: -1 });
    }
  },
};
