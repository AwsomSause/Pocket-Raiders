// Anime extra 03 Ink Duel: rice paper, a 勝負 ("match") seal, the fighters as white ink silhouettes on
// one black brush stroke (colour returns when a move flashes them), and a ruled list of moves.
import Phaser from 'phaser';
import { GAME_WIDTH } from '../theme';
import { menuOf, wait } from './common';
import type { BattleSkin } from './types';

const PAPER = 0xf2ead8;
const SUMI = 0x111111;
const SEAL = 0xc02020;
const P = (x: number, y: number) => new Phaser.Geom.Point(x, y);
const CJK = '"Yu Mincho", "Hiragino Mincho ProN", "Noto Serif CJK JP", "IPAMincho", "MS Mincho", serif';

/** A ruled list on the paper at the bottom right, clear of your trainer and the brush stroke. */
const list = (size: number) => (n: number) => {
  const step = n <= 4 ? 34 : Math.max(24, 144 / n);
  return menuOf(size, 240, step - 2, (i) => [680, 392 + i * step], { bare: true, focusColor: '#c02020' });
};

export const ink: BattleSkin = {
  text: '#111111',
  buttonText: '#111111',
  layout: {
    foe: { x: 620, y: 12, panel: [0, 0, 300, 40], name: [0, 2, 18], level: [300, 2, 16], hp: [0, 30, 300, 6], status: [0, 40] },
    player: { x: 340, y: 434, panel: [0, 0, 300, 62], name: [0, 2, 18], level: [300, 2, 16], hp: [0, 30, 300, 6], hpText: { at: [300, 38, 16] }, xp: [0, 58, 300], status: [0, 66] },
    bar: null,
    message: { x: 40, y: 450, w: 270, size: 18 },
    command: null,
    tabs: { x: 560, y: 356 },
    moveInfo: { x: 40, y: 420 },
    root: list(18),
    moves: list(18),
    header: { x: 600, y: 22 },
  },
  databox: (scene, _isPlayer, [x, y, w, h]) => {
    // A brush rule under the name, like a scroll label.
    const g = scene.add.graphics();
    g.fillStyle(SUMI, 0.9).fillRect(x, y + 22, w, 2);
    g.fillStyle(SEAL, 1).fillRect(x + w - 10, y + h - 10, 10, 10);
    return g;
  },
  pill: (g, x, y, w, h, s) => {
    g.fillStyle(SUMI, s.disabled ? 0.3 : 1).fillRect(x, y + h - 4, w, 4);
    if (s.on) g.fillStyle(SEAL, 1).fillRect(x, y, 8, h - 4);
  },
  moveText: (m) => ({ label: `${m.name}  ·  ${m.pp}` }),
  backdrop: (scene, field) => {
    const g = scene.add.graphics();
    g.fillStyle(PAPER, 1).fillRect(0, 0, 960, 540);
    // One black brush stroke behind both fighters (your Pokémon too, so its white silhouette shows).
    g.fillStyle(SUMI, 1).fillPoints([P(270, 120), P(424, 60), P(920, 89), P(900, 330), P(580, 352), P(540, 420), P(200, 410)], true);
    field.add(g);
  },
  sprite: (visual) => {
    const v = visual as Phaser.GameObjects.Sprite;
    if (typeof v.setTintFill === 'function') v.setTintFill(0xffffff);
  },
  frame: (scene) => {
    scene.add.text(40, 22, '勝負', { fontFamily: CJK, fontSize: '80px', color: '#111111' });
  },
  intro: async (scene, info) => {
    if (info.motion === 'off') return;
    const W = GAME_WIDTH;
    const stroke = scene.add.graphics().setDepth(160);
    const words = scene.add.text(W / 2, 220, `${info.player}  —  ${info.trainer ?? info.foe}`, { fontFamily: 'serif', fontSize: '34px', color: '#f2ead8', fontStyle: 'italic' }).setOrigin(0.5).setDepth(161).setAlpha(0);
    const seal = scene.add.rectangle(W / 2 + words.width / 2 + 40, 220, 34, 34, SEAL).setDepth(161).setScale(0);
    const sweep = { t: 0 };
    scene.tweens.add({
      targets: sweep,
      t: 1,
      duration: 420,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        stroke.clear();
        const w = W * sweep.t;
        for (let i = 0; i < 6; i++) stroke.fillStyle(SUMI, 0.8 - i * 0.08).fillRect(0, 180 + i * 12 + Math.sin(i * 3) * 4, w * (1 - i * 0.04), 14);
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
