// Anime extra 03 Ink Duel: rice-paper panels, rough brush outlines, a red seal, and a brush-stroke opening.
import type Phaser from 'phaser';
import { GAME_WIDTH } from '../theme';
import { wait } from './common';
import type { BattleSkin } from './types';

const PAPER = 0xf3ecdc;
const SUMI = 0x1c1814;
const SEAL = 0xc8302a;

/** A rough brush outline: a few offset strokes that wobble (deterministic). */
function brush(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, weight = 3): void {
  for (let pass = 0; pass < 2; pass++) {
    g.lineStyle(weight - pass, SUMI, pass ? 0.45 : 0.9);
    const j = (i: number) => Math.sin(i * 12.9898 + pass * 4.1) * 1.6;
    g.beginPath();
    g.moveTo(x + j(1), y + j(2));
    g.lineTo(x + w + j(3), y + j(4));
    g.lineTo(x + w + j(5), y + h + j(6));
    g.lineTo(x + j(7), y + h + j(8));
    g.closePath();
    g.strokePath();
  }
}

function paper(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
  g.fillStyle(0x000000, 0.18).fillRect(x + 3, y + 4, w, h);
  g.fillStyle(PAPER, 0.97).fillRect(x, y, w, h);
  brush(g, x, y, w, h);
}

export const ink: BattleSkin = {
  text: '#1c1814',
  buttonText: '#1c1814',
  databox: (scene, isPlayer) => {
    const g = scene.add.graphics();
    const [x, y, w, h] = isPlayer ? [16, 2, 366, 128] : [6, 4, 360, 100];
    paper(g, x, y, w, h);
    g.fillStyle(SEAL, 0.9).fillRect(x + w - 26, y + h - 26, 16, 16);
    return g;
  },
  messageBar: (scene, x, y, w, h) => {
    const g = scene.add.graphics();
    paper(g, x, y, w, h);
    return g;
  },
  commandWindow: (scene, x, y, w, h) => scene.add.graphics().fillStyle(0xe8dfca, 1).fillRect(x, y, w, h),
  pill: (g, x, y, w, h, s) => {
    if (s.on) {
      // A thick brush swipe under the focused option, with a red seal.
      g.fillStyle(SUMI, 0.85).fillRect(x + 4, y + h - 7, w - 18, 5);
      g.fillStyle(SUMI, 0.5).fillRect(x + 10, y + h - 3, w - 40, 2);
      g.fillStyle(SEAL, 1).fillRect(x + w - 12, y + 6, 10, 10);
    } else if (!s.disabled) g.fillStyle(SUMI, 0.15).fillRect(x + 4, y + h - 4, w - 30, 2);
  },
  intro: async (scene, info) => {
    if (info.motion === 'off') return;
    const W = GAME_WIDTH;
    const stroke = scene.add.graphics().setDepth(150);
    const words = scene.add.text(W / 2, 220, `${info.player}  —  ${info.trainer ?? info.foe}`, { fontFamily: 'serif', fontSize: '34px', color: '#f3ecdc', fontStyle: 'italic' }).setOrigin(0.5).setDepth(151).setAlpha(0);
    const seal = scene.add.rectangle(W / 2 + words.width / 2 + 40, 220, 34, 34, SEAL).setDepth(151).setScale(0);
    const sweep = { t: 0 };
    scene.tweens.add({
      targets: sweep,
      t: 1,
      duration: 420,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        stroke.clear();
        const w = W * sweep.t;
        for (let i = 0; i < 6; i++) stroke.fillStyle(SUMI, 0.75 - i * 0.08).fillRect(0, 180 + i * 12 + Math.sin(i * 3) * 4, w * (1 - i * 0.04), 14);
      },
    });
    scene.tweens.add({ targets: words, alpha: 1, duration: 300, delay: 300 });
    scene.tweens.add({ targets: seal, scale: 1, angle: 8, duration: 220, delay: 600, ease: 'Back.easeOut' });
    await wait(scene, 1350);
    const all = [stroke, words, seal];
    scene.tweens.add({ targets: all, alpha: 0, duration: 260, onComplete: () => all.forEach((o) => o.destroy()) });
    await wait(scene, 260);
  },
};
