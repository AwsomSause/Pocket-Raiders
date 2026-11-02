// 06 Arcade Versus: fighting-game bars, slanted gold-and-violet command strips and a VS splash.
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, mixColor } from '../theme';
import { wait } from './common';
import type { BattleSkin } from './types';

const GOLD = 0xffc030;
const VIOLET = 0x6a3ad0;
const P = (x: number, y: number) => new Phaser.Geom.Point(x, y);
const skew = (x: number, y: number, w: number, h: number, k: number) => [P(x + k, y), P(x + w, y), P(x + w - k, y + h), P(x, y + h)];

export const arcade: BattleSkin = {
  text: '#fff4d8',
  buttonText: '#fff8e8',
  databox: (scene, isPlayer) => {
    const g = scene.add.graphics();
    const [x, y, w, h] = isPlayer ? [16, 2, 366, 128] : [6, 4, 360, 100];
    g.fillStyle(0x000000, 0.35).fillPoints(skew(x + 4, y + 5, w, h, 18), true);
    g.fillStyle(0x140a28, 0.92).fillPoints(skew(x, y, w, h, 18), true);
    g.lineStyle(3, GOLD, 1).strokePoints(skew(x, y, w, h, 18), true);
    g.fillStyle(isPlayer ? GOLD : 0xe03050, 1).fillPoints(skew(x + 18, y + h - 10, w * 0.5, 6, 6), true);
    return g;
  },
  messageBar: (scene, x, y, w, h) => {
    const g = scene.add.graphics();
    g.fillStyle(0x0c0618, 0.92).fillPoints(skew(x, y, w, h, 24), true);
    g.lineStyle(3, VIOLET, 1).strokePoints(skew(x, y, w, h, 24), true);
    g.fillStyle(GOLD, 1).fillRect(x + 30, y + 4, 120, 4);
    return g;
  },
  commandWindow: (scene, x, y, w, h) => scene.add.graphics().fillStyle(0x1a0c34, 0.9).fillPoints(skew(x, y, w, h, 16), true),
  pill: (g, x, y, w, h, s) => {
    const body = s.disabled ? 0x403850 : s.on ? GOLD : mixColor(s.tint, VIOLET, 0.5);
    g.fillStyle(0x000000, 0.4).fillPoints(skew(x + 4, y + 4, w, h, 14), true);
    g.fillStyle(body, 1).fillPoints(skew(x, y, w, h, 14), true);
    g.fillStyle(0xffffff, s.on ? 0.35 : 0.15).fillPoints(skew(x + 6, y + 3, w - 12, h * 0.35, 6), true);
    if (s.on) g.lineStyle(2, 0xffffff, 1).strokePoints(skew(x, y, w, h, 14), true);
  },
  rootTints: [0xe03050, 0xe09020, 0x30b060, 0x9040e0, 0x3080e0, 0x30c0c0, 0xe0b020],
  intro: async (scene, info) => {
    if (info.motion === 'off') return;
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;
    const left = scene.add.graphics().fillStyle(0xe03050, 0.95).fillPoints([P(0, 150), P(W * 0.56, 150), P(W * 0.44, 330), P(0, 330)], true);
    const right = scene.add.graphics().fillStyle(0x3060e0, 0.95).fillPoints([P(W * 0.56, 150), P(W, 150), P(W, 330), P(W * 0.44, 330)], true);
    const you = scene.add.text(40, 210, info.player.toUpperCase(), { fontFamily: 'Arial Black, sans-serif', fontSize: '34px', color: '#ffffff', stroke: '#000000', strokeThickness: 6 });
    const foe = scene.add.text(W - 40, 250, (info.trainer ?? info.foe).toUpperCase(), { fontFamily: 'Arial Black, sans-serif', fontSize: '34px', color: '#ffffff', stroke: '#000000', strokeThickness: 6 }).setOrigin(1, 0);
    const vs = scene.add.text(W / 2, H * 0.44, 'VS', { fontFamily: 'Arial Black, sans-serif', fontSize: '96px', color: '#ffc030', stroke: '#1a0c34', strokeThickness: 10, fontStyle: 'italic' }).setOrigin(0.5).setScale(3).setAlpha(0);
    const all = [left, right, you, foe, vs];
    all.forEach((o) => o.setDepth(150));
    left.setX(-W);
    right.setX(W);
    you.setX(-400);
    foe.setX(W + 400);
    scene.tweens.add({ targets: [left, right], x: 0, duration: 260, ease: 'Cubic.easeOut' });
    scene.tweens.add({ targets: you, x: 40, duration: 320, delay: 80, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: foe, x: W - 40, duration: 320, delay: 80, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: vs, scale: 1, alpha: 1, duration: 260, delay: 260, ease: 'Back.easeOut' });
    if (info.motion === 'full') scene.time.delayedCall(520, () => scene.cameras.main.shake(160, 0.006));
    await wait(scene, 1250);
    scene.tweens.add({ targets: all, alpha: 0, duration: 220, onComplete: () => all.forEach((o) => o.destroy()) });
    await wait(scene, 220);
  },
};
