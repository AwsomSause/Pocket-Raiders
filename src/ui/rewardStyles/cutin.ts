import Phaser from 'phaser';
// Anime extra 09 Cut-in Strips: five slanted full-width colour strips over radiating speed lines; the chosen strip slides forward.
import { fillGradient } from './common';
import { css, icon, label, popAway, rarityWord, zone } from './kit';
import type { RewardLayout, RewardSkin } from './types';

const STRIP = [0x8a3ad8, 0x8a96aa, 0x8a3ad8, 0x8a96aa, 0x3a8ad8];

const layout: RewardLayout = (ctx, hooks) => {
  const { scene, views } = ctx;
  const n = views.length;
  const root = scene.add.container(0, 0);
  const h = Math.min(50, Math.floor((250 - 6 * (n - 1)) / n));
  const strips = views.map((v, i) => {
    const y = 98 + i * (h + 6);
    const c = scene.add.container(0, y);
    const g = scene.add.graphics();
    c.add(g);
    icon(scene, c, v, 120, h / 2, 1.4);
    label(scene, c, 160, h / 2 - 12, v.name, 22, '#ffffff', { origin: [0, 0], w: 380, extra: { stroke: '#1a0a30', strokeThickness: 4, fontStyle: 'italic' } });
    label(scene, c, 580, h / 2 - 6, rarityWord(v), 12, css(v.rim), { origin: [0, 0] });
    root.add(c);
    if (ctx.motion !== 'off') {
      c.x = i % 2 ? 400 : -400;
      scene.tweens.add({ targets: c, x: 0, duration: ctx.motion === 'full' ? 360 : 120, delay: ctx.motion === 'full' ? i * 80 : 0, ease: 'Cubic.easeOut' });
    }
    zone(scene, root, 0, y, 960, h, i, hooks).setDepth(20);
    return { c, g, y };
  });
  const text = label(scene, root, 480, 352, '', 14, '#ffffff', { w: 900, extra: { stroke: '#1a0a30', strokeThickness: 4 } });
  return {
    focus(i) {
      if (i >= n) return;
      strips.forEach(({ g, c }, k) => {
        const on = k === i;
        g.clear();
        const col = STRIP[k % STRIP.length]!;
        g.fillStyle(col, on ? 1 : 0.75).fillPoints([new Phaser.Geom.Point(60, 0), new Phaser.Geom.Point(960, 0), new Phaser.Geom.Point(960, h), new Phaser.Geom.Point(30, h)], true);
        g.fillStyle(0xffffff, on ? 0.35 : 0.15).fillRect(60, 0, 900, 5);
        if (on) g.lineStyle(3, 0xffffff, 1).strokeRect(60, 0, 900, h);
        if (ctx.motion !== 'off') scene.tweens.add({ targets: c, x: on ? 24 : 0, duration: 140, ease: 'Back.easeOut' });
      });
      text.setText(`${views[i]!.desc}${views[i]!.notes.length ? '  ·  ' + views[i]!.notes.join('  ·  ') : ''}`);
    },
    picked(i) {
      return popAway(ctx, strips[i]!.c);
    },
  };
};

export const cutin: RewardSkin = {
  strip: { tint: 0x1a1a1a, rim: 0xffd020, ink: '#ffffff', hp: '#a0e0a0', lead: '#ffd020', btnTint: 0xc01818, btnRim: 0xffd020, btnInk: '#ffffff', radius: 3 },
  layout,
  title: () => 'Choose one reward',
  backdrop(scene, motion) {
    fillGradient(scene, 0x2a2060, 0x0a0820);
    const g = scene.add.graphics().setDepth(-79);
    g.lineStyle(2, 0xffffff, 0.08);
    for (let i = 0; i < 36; i++) g.lineBetween(480, 240, 480 + Math.cos(i * 0.1745) * 800, 240 + Math.sin(i * 0.1745) * 800);
    if (motion === 'full') scene.tweens.add({ targets: g, alpha: 0.5, duration: 1500, yoyo: true, repeat: -1 });
  },
};
