// Anime extra 01 Shonen Versus: split colour fields with speed lines, a giant VS between the fighters,
// slanted navy scoreboards and slashing move buttons, and a VS!! clash to open.
import Phaser from 'phaser';
import { GAME_WIDTH } from '../theme';
import { menuOf, wait } from './common';
import type { BattleSkin } from './types';

const NAVY = 0x001a60;
const RED = 0xe83a3a;
const BLUE = 0x2a6aff;
const YELLOW = 0xffd23a;
const P = (x: number, y: number) => new Phaser.Geom.Point(x, y);
const skew = (x: number, y: number, w: number, h: number, k: number) => [P(x + k, y), P(x + w + k, y), P(x + w, y + h), P(x, y + h)];

/** Speed lines bursting from a point (deterministic: no randomness). */
function speedLines(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r0: number, r1: number, n: number, color: number, alpha: number): void {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.sin(i * 7.3) * 0.04;
    const w = 2 + (i % 3) * 2;
    g.fillStyle(color, alpha);
    g.fillTriangle(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1 - Math.sin(a) * w, cy + Math.sin(a) * r1 + Math.cos(a) * w, cx + Math.cos(a) * r1 + Math.sin(a) * w, cy + Math.sin(a) * r1 - Math.cos(a) * w);
  }
}

/** Slashing buttons stacked down the right, each stepping right. */
const slashes = (size: number) => (n: number) => {
  const step = n <= 4 ? 38 : Math.max(26, 300 / n);
  return menuOf(size, 360, step - 6, (i) => [500 + i * (n <= 4 ? 14 : 6), 532 - (n - i) * step], { align: 'center', bare: true, focusColor: '#001a60' });
};

export const shonen: BattleSkin = {
  text: '#ffffff',
  buttonText: '#ffffff',
  layout: {
    player: { x: 20, y: 20, panel: [0, 0, 320, 68], name: [26, 8, 20], upper: true, level: 'inline', hp: [26, 38, 280, 10], hpText: { at: [26, 48, 16], align: 'left' }, xp: [26, 63, 280], status: [10, 76] },
    foe: { x: 600, y: 20, panel: [0, 0, 320, 54], name: [26, 8, 20], upper: true, level: 'inline', hp: [26, 38, 280, 10], status: [10, 62] },
    bar: [12, 452, 440, 76],
    message: { x: 40, y: 462, w: 396, size: 18 },
    command: null,
    tabs: { x: 520, y: 352 },
    moveInfo: { x: 40, y: 464, inline: true },
    root: slashes(20),
    moves: slashes(18),
    header: { x: 940, y: 80 },
  },
  databox: (scene, _isPlayer, [x, y, w, h]) => {
    const g = scene.add.graphics();
    g.fillStyle(NAVY, 0.91).fillPoints(skew(x, y, w, h, 7), true);
    g.fillStyle(RED, 1).fillPoints(skew(x, y, 10, h, 7), true);
    return g;
  },
  messageBar: (scene, [x, y, w, h]) => {
    const g = scene.add.graphics();
    g.fillStyle(NAVY, 0.88).fillPoints(skew(x, y, w, h, 9), true);
    g.fillStyle(RED, 1).fillPoints(skew(x, y, 10, h, 9), true);
    return g;
  },
  pill: (g, x, y, w, h, s) => {
    g.fillStyle(s.on ? 0xffffff : s.disabled ? 0x30406a : NAVY, 1).fillPoints(skew(x, y, w, h, 9), true);
    g.fillStyle(RED, 1).fillPoints(skew(x, y, 8, h, 9), true);
  },
  rootTints: [RED, YELLOW, 0x30c060, 0xa040ff, BLUE, 0x30d0d0, YELLOW, 0x8090a0],
  moveText: (m) => ({ label: `${m.name} · PP ${m.pp}` }),
  backdrop: (scene, field, info) => {
    // Split colour fields (blue for you, yellow for the foe) with speed lines, over the arena.
    const g = scene.add.graphics();
    g.fillStyle(YELLOW, 1).fillRect(0, 0, 960, 540);
    g.fillStyle(BLUE, 1).fillPoints([P(0, 0), P(600, 0), P(410, 540), P(0, 540)], true);
    speedLines(g, 480, 270, 30, 900, 90, 0xffffff, 0.3);
    field.add(g);
    if (info.motion === 'full') scene.tweens.add({ targets: g, alpha: 0.88, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  },
  frame: (scene) => {
    scene.add.text(470, 200, 'VS', { fontFamily: 'Arial Black, sans-serif', fontSize: '86px', color: '#ffffff', fontStyle: 'italic', stroke: '#001a60', strokeThickness: 6 }).setOrigin(0.5).setAngle(-6);
  },
  intro: async (scene, info) => {
    if (info.motion === 'off') return;
    const W = GAME_WIDTH;
    const burst = scene.add.graphics().setDepth(160);
    burst.fillStyle(0xfff4e0, 0.96).fillRect(0, 120, W, 230);
    speedLines(burst, W / 2, 235, 60, 700, 70, 0x101010, info.reducedFlash ? 0.25 : 0.55);
    burst.lineStyle(5, 0x101010, 1).lineBetween(0, 120, W, 120).lineBetween(0, 350, W, 350);
    const style = { fontFamily: 'Arial Black, sans-serif', fontSize: '38px', color: '#101010', stroke: '#ffffff', strokeThickness: 8, fontStyle: 'italic' };
    const you = scene.add.text(W * 0.25, 235, info.player.toUpperCase(), style).setOrigin(0.5).setDepth(161).setScale(0);
    const foe = scene.add.text(W * 0.75, 235, (info.trainer ?? info.foe).toUpperCase(), style).setOrigin(0.5).setDepth(161).setScale(0);
    const vs = scene.add.text(W / 2, 235, 'VS!!', { ...style, fontSize: '80px', color: '#ff3020' }).setOrigin(0.5).setDepth(162).setScale(4).setAlpha(0);
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
