// Anime extra 01 Shonen Versus: bold black-outlined panels, orange heat, speed lines and a VS clash.
import Phaser from 'phaser';
import { GAME_WIDTH, mixColor } from '../theme';
import { wait } from './common';
import type { BattleSkin } from './types';

const HEAT = 0xff7a18;
const P = (x: number, y: number) => new Phaser.Geom.Point(x, y);
const slant = (x: number, y: number, w: number, h: number) => [P(x + 10, y), P(x + w, y + 3), P(x + w - 8, y + h), P(x, y + h - 3)];

function panel(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, fill: number, shadow: number): void {
  g.fillStyle(shadow, 1).fillPoints(slant(x + 6, y + 6, w, h), true);
  g.fillStyle(fill, 1).fillPoints(slant(x, y, w, h), true);
  g.lineStyle(4, 0x101010, 1).strokePoints(slant(x, y, w, h), true);
}

/** Speed lines bursting from a point (deterministic: no randomness). */
function speedLines(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r0: number, r1: number, n: number, color: number, alpha: number): void {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.sin(i * 7.3) * 0.04;
    const w = 2 + (i % 3) * 2;
    g.fillStyle(color, alpha);
    g.fillTriangle(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1 - Math.sin(a) * w, cy + Math.sin(a) * r1 + Math.cos(a) * w, cx + Math.cos(a) * r1 + Math.sin(a) * w, cy + Math.sin(a) * r1 - Math.cos(a) * w);
  }
}

export const shonen: BattleSkin = {
  text: '#101010',
  buttonText: '#101010',
  databox: (scene, isPlayer) => {
    const g = scene.add.graphics();
    if (isPlayer) panel(g, 16, 2, 366, 128, 0xfffaf0, HEAT);
    else panel(g, 6, 4, 360, 100, 0xfffaf0, 0xd02020);
    return g;
  },
  messageBar: (scene, x, y, w, h) => {
    const g = scene.add.graphics();
    panel(g, x, y, w, h, 0xfffaf0, 0x101010);
    return g;
  },
  commandWindow: (scene, x, y, w, h) => scene.add.graphics().fillStyle(0xffe8c8, 1).fillRect(x, y, w, h),
  pill: (g, x, y, w, h, s) => {
    const fill = s.disabled ? 0xd0d0d0 : s.on ? 0xffd040 : mixColor(s.tint, 0xffffff, 0.7);
    panel(g, x, y, w, h, fill, s.on ? 0xd02020 : 0x101010);
  },
  rootTints: [0xff3030, 0xffa020, 0x30c060, 0xa040ff, 0x3090ff, 0x30d0d0, 0xffc020],
  frame: (scene, info) => {
    // Faint speed lines from the foe, for a sense of pressure.
    const g = scene.add.graphics().setDepth(-1);
    speedLines(g, GAME_WIDTH * 0.7, 150, 160, 900, 48, 0xffffff, 0.06);
    if (info.motion === 'full') scene.tweens.add({ targets: g, alpha: 0.5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  },
  intro: async (scene, info) => {
    if (info.motion === 'off') return;
    const W = GAME_WIDTH;
    const burst = scene.add.graphics().setDepth(150);
    burst.fillStyle(0xfff4e0, 0.96).fillRect(0, 120, W, 230);
    speedLines(burst, W / 2, 235, 60, 700, 70, 0x101010, info.reducedFlash ? 0.25 : 0.55);
    burst.lineStyle(5, 0x101010, 1).lineBetween(0, 120, W, 120).lineBetween(0, 350, W, 350);
    const style = { fontFamily: 'Arial Black, sans-serif', fontSize: '38px', color: '#101010', stroke: '#ffffff', strokeThickness: 8, fontStyle: 'italic' };
    const you = scene.add.text(W * 0.25, 235, info.player.toUpperCase(), style).setOrigin(0.5).setDepth(151).setScale(0);
    const foe = scene.add.text(W * 0.75, 235, (info.trainer ?? info.foe).toUpperCase(), style).setOrigin(0.5).setDepth(151).setScale(0);
    const vs = scene.add.text(W / 2, 235, 'VS!!', { ...style, fontSize: '80px', color: '#ff3020' }).setOrigin(0.5).setDepth(152).setScale(4).setAlpha(0);
    burst.setAlpha(0);
    scene.tweens.add({ targets: burst, alpha: 1, duration: 120 });
    scene.tweens.add({ targets: [you, foe], scale: 1, duration: 260, delay: 100, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: vs, scale: 1, alpha: 1, angle: -8, duration: 240, delay: 320, ease: 'Back.easeOut' });
    if (info.motion === 'full') scene.time.delayedCall(560, () => scene.cameras.main.shake(200, 0.01));
    await wait(scene, 1300);
    const all = [burst, you, foe, vs];
    scene.tweens.add({ targets: all, alpha: 0, duration: 200, onComplete: () => all.forEach((o) => o.destroy()) });
    await wait(scene, 200);
  },
};
