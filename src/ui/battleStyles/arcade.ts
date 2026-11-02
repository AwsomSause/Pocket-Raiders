// 06 Arcade Versus: fighting-game energy. Slanted HP bars with portraits across the top, a VS badge
// and turn counter, moves stacked as slashes on the right, your team's portraits along the bottom.
import Phaser from 'phaser';
import { getSpecies } from '../../core/pokemon';
import { services } from '../../game/services';
import { GAME_HEIGHT, GAME_WIDTH } from '../theme';
import { pokemonIcon } from '../sprites';
import { menuOf, wait } from './common';
import type { BattleSkin } from './types';

const GOLD = 0xffd23a;
/** Fighting-game HP: gold on a dark red track. */
const HP_LOOK = { track: 0x5a0a0a, rim: 0xffffff, fill: [0xfff08a, 0xffd23a, 0xd89a10] } as const;
const P = (x: number, y: number) => new Phaser.Geom.Point(x, y);
const skew = (x: number, y: number, w: number, h: number, k: number) => [P(x + k, y), P(x + w + k, y), P(x + w, y + h), P(x, y + h)];

/** Moves fly in as stacked slashes, each a little further right. */
const slashes = (size: number) => (n: number) => {
  const h = n <= 4 ? 46 : Math.max(24, (230 - (n - 1) * 6) / n);
  return menuOf(Math.min(size, h - 16), 340, h, (i) => [520 + i * (n <= 4 ? 22 : 10), (n <= 4 ? 300 : 290) + i * (h + 6)], { bare: true });
};

export const arcade: BattleSkin = {
  text: '#ffffff',
  buttonText: '#ffffff',
  layout: {
    player: { x: 20, y: 16, panel: [0, 0, 430, 80], portrait: [36, 36, 1.4], name: [86, 38, 20], upper: true, level: 'inline', hp: [86, 13, 340, 20], hpLook: HP_LOOK, hpText: { at: [426, 38, 16] }, xp: [86, 30, 340], status: [86, 62] },
    foe: { x: 510, y: 16, panel: [0, 0, 430, 80], portrait: [394, 36, 1.4], name: [8, 38, 20], upper: true, level: 'inline', hp: [8, 13, 340, 20], hpLook: HP_LOOK, status: [8, 62] },
    bar: [16, 404, 470, 64],
    message: { x: 40, y: 414, w: 420, size: 18 },
    command: null,
    tabs: { x: 540, y: 272 },
    moveInfo: { x: 40, y: 416, inline: true },
    root: slashes(22),
    moves: slashes(20),
    header: { x: 940, y: 100 },
  },
  databox: (scene, isPlayer, [x, y, w]) => {
    const g = scene.add.graphics();
    const cx = isPlayer ? x + 36 : x + w - 36;
    // The portrait ring and the slanted bar frame.
    g.fillStyle(0xffffff, 1).fillCircle(cx, y + 36, 36);
    g.lineStyle(4, GOLD, 1).strokeCircle(cx, y + 36, 36);
    const bx = isPlayer ? x + 82 : x + 4;
    g.fillStyle(0x400000, 1).fillPoints(skew(bx, y + 1, 348, 26, isPlayer ? -9 : 9), true);
    g.lineStyle(3, 0xffffff, 1).strokePoints(skew(bx, y + 1, 348, 26, isPlayer ? -9 : 9), true);
    return g;
  },
  messageBar: (scene, [x, y, w, h]) => {
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.6).fillPoints(skew(x, y, w, h, 14), true);
    g.fillStyle(GOLD, 1).fillRect(x + 14, y, 6, h);
    return g;
  },
  pill: (g, x, y, w, h, s) => {
    const col = s.disabled ? 0x505060 : s.tint;
    g.fillStyle(0x000000, 0.35).fillPoints(skew(x + 4, y + 4, w, h, 12), true);
    g.fillGradientStyle(col, col, col, col, 1, 0.55, 1, 0.55).fillPoints(skew(x, y, w, h, 12), true);
    g.fillStyle(0xffffff, 1).fillPoints(skew(x, y, 8, h, 12), true);
    if (s.on) g.lineStyle(3, GOLD, 1).strokePoints(skew(x - 2, y - 2, w + 4, h + 4, 12), true);
  },
  rootTints: [0xe03050, 0xe09020, 0x30b060, 0x9040e0, 0x3080e0, 0x30c0c0, 0xe0b020, 0x707890],
  moveText: (m) => ({ label: `${m.name}   PP ${m.pp}` }),
  backdrop: (scene, field) => {
    const g = scene.add.graphics();
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.4, 0.4, 0, 0).fillRect(0, 0, 960, 135);
    field.add(g);
  },
  frame: (scene, info) => {
    const vs = scene.add.text(480, 22, 'VS', { fontFamily: 'Arial Black, sans-serif', fontSize: '44px', color: '#ffffff', fontStyle: 'italic', stroke: '#000000', strokeThickness: 4, shadow: { offsetX: 3, offsetY: 3, color: '#cc0000', fill: true } }).setOrigin(0.5, 0);
    const turn = scene.add.text(480, 84, '', { fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5, 0);
    if (info.motion === 'full') scene.tweens.add({ targets: vs, scale: 1.08, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // Your team's portraits along the bottom.
    const row = scene.add.container(20, 480);
    const draw = (party: typeof info.party) => {
      row.removeAll(true);
      party.forEach((p, i) => {
        const x = 23 + i * 54;
        const ring = scene.add.graphics().fillStyle(p.fainted ? 0x555555 : 0xffffff, 1).fillCircle(x, 23, 23).lineStyle(3, GOLD, 1).strokeCircle(x, 23, 23);
        row.add(ring);
        const icon = pokemonIcon(scene, getSpecies(services().session.content, p.speciesId), x, 22, 0.75) as Phaser.GameObjects.Sprite;
        if (p.fainted) icon.setAlpha?.(0.4);
        row.add(icon);
      });
    };
    const update = (i: typeof info) => {
      turn.setText(`TURN ${i.turn}`);
      draw(i.party);
    };
    update(info);
    return { update };
  },
  intro: async (scene, info) => {
    if (info.motion === 'off') return;
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;
    const left = scene.add.graphics().fillStyle(0xe03050, 0.95).fillPoints([P(0, 150), P(W * 0.56, 150), P(W * 0.44, 330), P(0, 330)], true);
    const right = scene.add.graphics().fillStyle(0x3060e0, 0.95).fillPoints([P(W * 0.56, 150), P(W, 150), P(W, 330), P(W * 0.44, 330)], true);
    const big = { fontFamily: 'Arial Black, sans-serif', fontSize: '34px', color: '#ffffff', stroke: '#000000', strokeThickness: 6 };
    const you = scene.add.text(40, 210, info.player.toUpperCase(), big);
    const foe = scene.add.text(W - 40, 250, (info.trainer ?? info.foe).toUpperCase(), big).setOrigin(1, 0);
    const vs = scene.add.text(W / 2, H * 0.44, 'VS', { fontFamily: 'Arial Black, sans-serif', fontSize: '96px', color: '#ffd23a', stroke: '#1a0c34', strokeThickness: 10, fontStyle: 'italic' }).setOrigin(0.5).setScale(3).setAlpha(0);
    const all = [left, right, you, foe, vs];
    all.forEach((o) => o.setDepth(160));
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
