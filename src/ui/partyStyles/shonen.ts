// Shonen Roster: radiating speed lines and fiery orange slashes behind a bold roster.
import { GAME_HEIGHT } from '../theme';
import { windowFace } from './common';
import type { PartySkin } from './types';
import Phaser from 'phaser';
import { bar, frac, hit, icon, moves, pop, sprite, stats, text, typeColor } from './kit';

export const shonen: PartySkin = {
  shape: 'slant',
  palette: { row: 0x2a1408, rowAlpha: 0.95, rowFocus: 0xc85a10, rowRim: 0xf0a030, focusRim: 0xfff060, tab: 0x2a1408, tabActive: 0xc85a10, pane: 0x1c0e06, paneRim: 0xf0a030 },
  roster(ctx) {
    const { scene, into, mons, sel } = ctx;
    const g = scene.add.graphics();
    g.fillStyle(0xf8c820, 1).fillTriangle(420, 76, 924, 76, 924, 456).fillStyle(0x1a48c8, 1).fillTriangle(36, 76, 420, 76, 36, 456).fillStyle(0x1a48c8, 1).fillTriangle(36, 456, 924, 456, 924, 76).fillStyle(0xf8c820, 0.9).fillTriangle(500, 456, 924, 456, 924, 160);
    into.add(g);
    mons.forEach((m, i) => {
      const y = 84 + i * 62;
      const on = i === sel;
      const c = scene.add.container(on ? 56 : 44, y);
      const rg = scene.add.graphics();
      const pts = [new Phaser.Geom.Point(16, 0), new Phaser.Geom.Point(360, 0), new Phaser.Geom.Point(344, 54), new Phaser.Geom.Point(0, 54)];
      rg.fillStyle(on ? 0xffffff : 0x0c2a8a, 1).fillPoints(pts, true).lineStyle(3, on ? 0xe03030 : 0x6a8aff, 1).strokePoints(pts, true);
      c.add(rg);
      icon(c, m, 36, 27, 1.1);
      text(c, 62, 6, `${m.name.toUpperCase()}  Lv${m.level}`, 15, on ? '#0c2a8a' : '#ffffff', { w: 230 });
      bar(c, 62, 34, 220, 9, frac(m));
      into.add(c);
      pop(ctx, c, i);
      hit(ctx, 44, y, 360, 54, i);
    });
    const m = mons[sel]!;
    text(into, 904, 84, `${m.name.toUpperCase()}!`, 34, '#c82020', { origin: [1, 0], extra: { stroke: '#ffffff', strokeThickness: 5, fontStyle: 'italic' } });
    sprite(into, m, 700, 430, 3.2, ctx);
    text(into, 420, 430, m.moves.map((x) => x.name).join(' · '), 13, '#ffffff', { w: 300, extra: { stroke: '#0c2a8a', strokeThickness: 3 } });
  },
  chrome(scene, root, motion) {
    windowFace(scene, root, { fill: 0x160a04, rim: 0xf0a030, band: 0x8a3008, bandRim: 0xffd060, radius: 4 });
    const g = scene.add.graphics();
    g.lineStyle(2, 0xffb040, 0.12);
    for (let i = 0; i < 36; i++) g.lineBetween(640, 270, 640 + Math.cos(i * 0.1745) * 700, 270 + Math.sin(i * 0.1745) * 700);
    g.fillStyle(0xf0a030, 0.9).fillTriangle(36, GAME_HEIGHT - 76, 96, GAME_HEIGHT - 76, 36, GAME_HEIGHT - 100);
    root.add(g);
    if (motion === 'full') scene.tweens.add({ targets: g, alpha: 0.55, duration: 700, yoyo: true, repeat: -1 });
  },
};
