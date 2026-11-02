// 07 Card Hand: your moves are a hand of cards in their type's colour; the focused card glows gold.
import { mixColor } from '../theme';
import type { BattleSkin } from './types';

const GOLD = 0xffd040;

export const cards: BattleSkin = {
  text: '#f4f6ff',
  buttonText: '#ffffff',
  databox: (scene, isPlayer) => {
    const g = scene.add.graphics();
    const [x, y, w, h] = isPlayer ? [16, 2, 366, 128] : [6, 4, 360, 100];
    g.fillStyle(0x000000, 0.3).fillRoundedRect(x + 3, y + 5, w, h, 12);
    g.fillStyle(0x1c2240, 0.92).fillRoundedRect(x, y, w, h, 12);
    g.lineStyle(3, isPlayer ? 0x6ad0ff : 0xff7aa8, 1).strokeRoundedRect(x, y, w, h, 12);
    g.lineStyle(1, 0xffffff, 0.35).strokeRoundedRect(x + 5, y + 5, w - 10, h - 10, 8);
    return g;
  },
  messageBar: (scene, x, y, w, h) => {
    const g = scene.add.graphics();
    g.fillStyle(0x121630, 0.9).fillRoundedRect(x, y, w, h, 16);
    g.lineStyle(2, 0x6a78c8, 1).strokeRoundedRect(x, y, w, h, 16);
    return g;
  },
  commandWindow: (scene, x, y, w, h) => scene.add.graphics().fillStyle(0x1c2240, 0.95).fillRoundedRect(x, y, w, h, 14),
  pill: (g, x, y, w, h, s) => {
    const body = s.disabled ? 0x505060 : s.tint;
    if (s.on) g.fillStyle(GOLD, 0.35).fillRoundedRect(x - 5, y - 5, w + 10, h + 10, 14);
    g.fillStyle(0x000000, 0.35).fillRoundedRect(x + 3, y + 4, w, h, 10);
    g.fillStyle(mixColor(body, 0x000000, 0.25), 1).fillRoundedRect(x, y, w, h, 10);
    // Card face: a bright header band, then the art window.
    g.fillStyle(mixColor(body, 0xffffff, 0.25), 1).fillRoundedRect(x + 4, y + 4, w - 8, 30, 7);
    if (h > 60) g.fillStyle(mixColor(body, 0xffffff, 0.55), 0.35).fillRoundedRect(x + 10, y + 40, w - 20, h - 50, 6);
    g.lineStyle(s.on ? 3 : 2, s.on ? GOLD : 0xffffff, s.on ? 1 : 0.8).strokeRoundedRect(x, y, w, h, 10);
  },
  rootTints: [0xd83848, 0xd09020, 0x30a860, 0x8a40d0, 0x3080d8, 0x30b8c0, 0xd0a020],
  // Four cards in a gentle fan across the bar: outer cards sit a little lower.
  moveMenu: { columns: 4, itemWidth: 136, itemHeight: 104, fontSize: 18, place: (i, n) => ({ x: i * 136, y: Math.abs(i - (n - 1) / 2) > 1 ? 8 : 0 }) },
};
