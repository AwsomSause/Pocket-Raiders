// 05 Cyber HUD: dark cut-corner panels, cyan neon lines, magenta for the target, faint scanlines.
import { cutRect } from './common';
import { mixColor } from '../theme';
import type { BattleSkin } from './types';

const CYAN = 0x2ef2ff;
const MAGENTA = 0xff3fd0;
const INK = 0x040c18;

export const cyber: BattleSkin = {
  text: '#c8faff',
  buttonText: '#c8faff',
  databox: (scene, isPlayer) => {
    const g = scene.add.graphics();
    const col = isPlayer ? CYAN : MAGENTA;
    const [x, y, w, h] = isPlayer ? [16, 2, 366, 128] : [6, 4, 360, 100];
    cutRect(g, x, y, w, h, 18, { color: INK, alpha: 0.86 }, { width: 2, color: col, alpha: 0.9 });
    g.lineStyle(1, col, 0.35).lineBetween(x + 10, y + h - 10, x + w - 30, y + h - 10);
    g.fillStyle(col, 1).fillRect(x + w - 60, y - 3, 40, 4);
    const tag = scene.add.text(x + 22, y - 14, isPlayer ? 'UNIT //' : 'TARGET //', { fontFamily: 'monospace', fontSize: '12px', color: isPlayer ? '#2ef2ff' : '#ff3fd0' });
    return scene.add.container(0, 0, [g, tag]);
  },
  messageBar: (scene, x, y, w, h) => {
    const g = scene.add.graphics();
    cutRect(g, x, y, w, h, 22, { color: INK, alpha: 0.9 }, { width: 2, color: CYAN, alpha: 0.8 });
    g.fillStyle(CYAN, 0.08);
    for (let yy = y + 4; yy < y + h - 4; yy += 4) g.fillRect(x + 8, yy, w - 16, 1);
    return g;
  },
  commandWindow: (scene, x, y, w, h) => {
    const g = scene.add.graphics();
    cutRect(g, x, y, w, h, 14, { color: 0x081a2c, alpha: 0.95 }, { width: 1, color: CYAN, alpha: 0.5 });
    return g;
  },
  pill: (g, x, y, w, h, s) => {
    const col = s.disabled ? 0x506070 : mixColor(s.tint, CYAN, 0.55);
    cutRect(g, x, y, w, h, 10, { color: s.on ? col : INK, alpha: s.on ? 0.3 : 0.85 }, { width: s.on ? 2 : 1, color: col, alpha: 1 });
    if (s.on) g.fillStyle(MAGENTA, 1).fillRect(x + w - 14, y + h - 4, 14, 4).fillRect(x, y, 4, 12);
  },
  rootTints: [0xff3f5a, 0xffc040, 0x40ff9a, 0xc060ff, 0x40a8ff, 0x40e8e8, 0xffd040],
  frame: (scene, info) => {
    const { width: W, height: H } = scene.scale;
    const g = scene.add.graphics().setDepth(5).setData('noJuice', true);
    // Faint scanlines and corner brackets over the arena.
    g.fillStyle(0x000000, 0.08);
    for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1);
    g.lineStyle(2, CYAN, 0.7);
    const b = 22;
    for (const [x, y, dx, dy] of [[8, 8, 1, 1], [W - 8, 8, -1, 1]] as const) g.lineBetween(x, y, x + b * dx, y).lineBetween(x, y, x, y + b * dy);
    scene.add.text(16, 372, `SYS://BATTLE  ${info.player.toUpperCase()} vs ${info.foe.toUpperCase()}`, { fontFamily: 'monospace', fontSize: '13px', color: '#2ef2ff' }).setAlpha(0.75).setDepth(5);
  },
};
