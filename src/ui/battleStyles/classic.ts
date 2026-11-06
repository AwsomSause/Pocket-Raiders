// 04 Enhanced Classic: the Essentials / Enhanced Battle UI look, polished. Real Essentials databoxes,
// the Poké Ball line-up over the foe, and the white-and-red command bar with four bold buttons.
import { mixColor } from '../theme';
import { menuOf } from './common';
import type { BattleSkin } from './types';

const ART = 1.4;

/** The 2x2 command buttons on the red half of the bar (three columns when there are extras). */
const buttons = (size: number) => (n: number) => {
  const cols = n <= 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const w = (434 - (cols - 1) * 10) / cols;
  const h = Math.min(38, (84 - (rows - 1) * 4) / rows);
  return menuOf(Math.min(size, h - 14), w, h, (i) => [500 + (i % cols) * (w + 10), 452 + Math.floor(i / cols) * (h + 4)], { columns: cols, align: 'center', bare: true });
};

export const classic: BattleSkin = {
  text: '#384050',
  buttonText: '#ffffff',
  layout: {
    foe: { x: 20, y: 40, panel: [0, 0, 330, 87], name: [24, 14, 22], upper: true, level: [306, 14, 20], hp: [168, 56, 134, 8], status: [24, 92], team: [10, -36, 34] },
    player: { x: 560, y: 290, panel: [40, 0, 326, 118], name: [56, 14, 22], upper: true, level: [326, 14, 20], hp: [192, 55, 130, 8], hpText: { at: [322, 68, 18] }, xp: [56, 107, 270], status: [56, 124] },
    bar: [0, 444, 960, 96],
    message: { x: 30, y: 474, w: 360, size: 24 },
    command: null,
    tabs: { x: 500, y: 424 },
    moveInfo: { x: 30, y: 456 },
    root: (n) => ({ ...buttons(22)(n), upper: true }),
    moves: buttons(20),
  },
  databox: (scene, isPlayer, [x, y, w, h]) => {
    const key = isPlayer ? 'pack.memories.battle.databox' : 'pack.memories.battle.databoxFoe';
    if (scene.textures.exists(key)) return scene.add.image(isPlayer ? x - 40 : x, y, key).setOrigin(0).setScale(ART);
    const g = scene.add.graphics();
    g.fillStyle(0xf8f8f8, 1).fillRect(x, y, w, h).fillStyle(0xe03848, 1).fillRect(x, y + h * 0.55, w, h * 0.45);
    g.lineStyle(3, 0x404040, 1).strokeRect(x, y, w, h);
    return g;
  },
  messageBar: (scene, [x, y, w, h]) => {
    if (scene.textures.exists('pack.memories.battle.command')) return scene.add.image(x, y, 'pack.memories.battle.command').setOrigin(0).setScale(w / 512);
    const g = scene.add.graphics();
    g.fillStyle(0x283038, 1).fillRect(x, y, w, 6).fillStyle(0xf8f8f8, 1).fillRect(x, y + 6, w * 0.5, h).fillStyle(0xe03848, 1).fillRect(x + w * 0.5, y + 6, w * 0.5, h);
    return g;
  },
  pill: (g, x, y, w, h, s) => {
    const body = s.disabled ? 0x8a8a8a : s.tint;
    g.fillStyle(mixColor(body, 0x000000, 0.35), 1).fillRoundedRect(x, y + 2, w, h, 6);
    g.fillGradientStyle(mixColor(body, 0xffffff, 0.12), mixColor(body, 0xffffff, 0.12), body, body, 1).fillRoundedRect(x, y, w, h, 6);
    g.lineStyle(2, s.on ? 0xffffff : 0x000000, s.on ? 1 : 0.4).strokeRoundedRect(x, y, w, h, 6);
  },
  rootTints: [0xe8483a, 0xe8a83a, 0x4aa84a, 0x3a7ae8, 0x9a50d8, 0x30a8b8, 0xc89020, 0x707880],
};
