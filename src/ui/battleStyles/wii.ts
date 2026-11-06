// 03 Wii Channel: clean white Wii Menu tiles with a blue glow cursor; a grey-white floor fades up from the bottom.
// Moves sit on a row of channel tiles; battle text runs along a white channel strip below them.
import { mixColor } from '../theme';
import { menuOf, plastic } from './common';
import type { BattleSkin } from './types';

const SKY = 0x34bef0;
const FLOOR = 0xf0f4f8;

/** One row of channel tiles across the bottom (two rows when there are many options). */
const tiles = (size: number) => (n: number) => {
  const perRow = n <= 4 ? 4 : Math.min(5, Math.ceil(n / 2));
  const w = (912 - (perRow - 1) * 16) / perRow;
  return menuOf(size, w, 48, (i) => [24 + (i % perRow) * (w + 16), 408 + Math.floor(i / perRow) * 62], { columns: perRow });
};

/** The channel grid: the moves on the top row, the other commands on the row below (as in the mock-up). */
const grid = (size: number) => (n: number, moves: number) => {
  if (moves === 0) return tiles(size)(n);
  const rest = n - moves;
  const per = Math.max(4, moves, rest);
  const w = (912 - (per - 1) * 16) / per;
  return menuOf(size, w, 48, (i) => (i < moves ? [24 + i * (w + 16), 408] : [24 + (i - moves) * (w + 16), 470]), { columns: per });
};

export const wii: BattleSkin = {
  text: '#3c4650',
  buttonText: '#3c4650',
  layout: {
    foe: { x: 20, y: 20, panel: [0, 0, 290, 58], name: [14, 7, 20], level: [276, 7, 18], hp: [14, 42, 262, 10], status: [4, 66] },
    player: { x: 620, y: 250, panel: [0, 0, 310, 92], name: [14, 7, 20], level: [296, 7, 18], hp: [14, 42, 282, 10], hpText: { at: [296, 54, 18] }, xp: [14, 84, 282], status: [4, 100] },
    bar: [24, 362, 640, 36],
    message: { x: 40, y: 370, w: 610, size: 18 },
    command: null,
    tabs: { x: 668, y: 368 },
    moveInfo: { x: 40, y: 370, inline: true },
    combined: true,
    root: grid(18),
    moves: (n) => ({ ...tiles(20)(n), bare: false }),
  },
  databox: (scene, _isPlayer, [x, y, w, h]) => {
    const g = scene.add.graphics();
    plastic(g, x, y, w, h, 16, 0xfbfcfd, 0xc4ccd6);
    return g;
  },
  messageBar: (scene, [x, y, w, h]) => {
    const g = scene.add.graphics();
    plastic(g, x, y, w, h, 14, 0xffffff, 0xc8d0d8, 2);
    return g;
  },
  pill: (g, x, y, w, h, s) => {
    const r = 12;
    if (s.on) {
      g.fillStyle(SKY, 0.18).fillRoundedRect(x - 6, y - 6, w + 12, h + 12, r + 6);
      g.fillStyle(SKY, 0.3).fillRoundedRect(x - 3, y - 3, w + 6, h + 6, r + 3);
    }
    g.fillStyle(0x000000, 0.1).fillRoundedRect(x + 1, y + 3, w, h, r);
    g.fillStyle(s.disabled ? 0xe4e8ec : 0xffffff, 1).fillRoundedRect(x, y, w, h, r);
    g.fillStyle(0xf3f6f9, 1).fillRoundedRect(x + 3, y + h / 2, w - 6, h / 2 - 3, { tl: 0, tr: 0, bl: r - 3, br: r - 3 });
    g.lineStyle(s.on ? 3 : 2, s.on ? SKY : 0xc8d0d8, 1).strokeRoundedRect(x, y, w, h, r);
    // The channel dot in the option's colour (a move's type).
    g.fillStyle(mixColor(s.tint, 0xffffff, 0.1), s.disabled ? 0.4 : 1).fillCircle(x + 18, y + h / 2, 7);
  },
  rootTints: [0xe0504a, 0xe0a020, 0x3ab060, 0x9a50d8, 0x3a90e0, 0x30b8c8, 0xd8a020, 0x8a96a0],
  moveText: (m) => ({ label: `${m.name}  ${m.pp}/${m.maxPp}` }),
  backdrop: (scene, field) => {
    // The floor: clear at the middle of the screen, Wii white by the tiles.
    const g = scene.add.graphics();
    g.fillGradientStyle(FLOOR, FLOOR, FLOOR, FLOOR, 0, 0, 1, 1).fillRect(0, 324, 960, 76);
    g.fillStyle(FLOOR, 1).fillRect(0, 400, 960, 140);
    field.add(g);
  },
};
