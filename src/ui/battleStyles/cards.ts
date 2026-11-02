// 07 Card Hand: moves are trading cards fanned at the bottom; the chosen card lifts and glows.
// The command choices are a smaller hand of cards too.
import { mixColor } from '../theme';
import { menuOf, up, vivid } from './common';
import type { BattleSkin } from './types';

const GOLD = 0xffe14a;

/** A fanned hand: cards spread around the middle, tilted, the outer ones lower. */
const hand = (size: number, w: number, h: number, y: number, maxStep: number, tilt: number, inset?: number) => (n: number) => {
  const step = Math.min(maxStep, (700 - w) / Math.max(1, n - 1));
  const x0 = 506 - ((n - 1) * step + w) / 2;
  const rot = (i: number) => (i - (n - 1) / 2) * tilt;
  return menuOf(size, w, h, (i) => [x0 + i * step, y + Math.abs(rot(i)) * 2], { columns: n, align: inset ? 'left' : 'center', angle: rot, lift: 30, bare: true, inset });
};

export const cards: BattleSkin = {
  text: '#e8f0ff',
  buttonText: '#ffffff',
  layout: {
    foe: { x: 20, y: 20, panel: [0, 0, 280, 58], name: [14, 7, 20], level: [266, 7, 18], hp: [14, 42, 250, 8], status: [4, 64] },
    player: { x: 470, y: 248, panel: [0, 0, 280, 90], name: [14, 7, 20], level: [266, 7, 18], hp: [14, 42, 250, 8], hpText: { at: [266, 54, 16] }, xp: [14, 82, 250], status: [4, 96] },
    bar: [12, 392, 226, 136],
    message: { x: 24, y: 404, w: 204, size: 18 },
    command: null,
    tabs: { x: 16, y: 366 },
    moveInfo: { x: 24, y: 404 },
    root: hand(20, 112, 148, 400, 124, 7),
    moves: hand(18, 140, 196, 336, 128, 8, 14),
  },
  databox: (scene, _isPlayer, [x, y, w, h]) => {
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.25).fillRoundedRect(x + 2, y + 4, w, h, 12);
    g.fillStyle(0x0c1428, 0.78).fillRoundedRect(x, y, w, h, 12);
    g.lineStyle(2, 0xffffff, 0.35).strokeRoundedRect(x, y, w, h, 12);
    return g;
  },
  messageBar: (scene, [x, y, w, h]) => {
    const g = scene.add.graphics();
    g.fillStyle(0x0c1428, 0.8).fillRoundedRect(x, y, w, h, 12);
    g.lineStyle(2, 0xffffff, 0.3).strokeRoundedRect(x, y, w, h, 12);
    return g;
  },
  pill: (g, x, y, w, h, s) => {
    const col = vivid(s.disabled ? 0x707080 : s.tint, 0.75, 0.4);
    if (s.on) g.fillStyle(GOLD, 0.5).fillRoundedRect(x - 8, y - 8, w + 16, h + 16, 18);
    g.fillStyle(0x000000, 0.45).fillRoundedRect(x + 3, y + 8, w, h, 12);
    // White frame, then the card face: a deep type-coloured body, a white corner flash and an art window.
    g.fillStyle(0xffffff, 1).fillRoundedRect(x, y, w, h, 12);
    g.fillGradientStyle(mixColor(col, 0xffffff, 0.12), mixColor(col, 0xffffff, 0.12), mixColor(col, 0x000000, 0.25), mixColor(col, 0x000000, 0.25), 1).fillRoundedRect(x + 5, y + 5, w - 10, h - 10, 8);
    g.fillStyle(0xffffff, 0.9).fillTriangle(x + 5, y + 5, x + 22, y + 5, x + 5, y + 20);
    const art = h > 170 ? { y: y + 50, h: h - 106 } : { y: y + h * 0.42, h: h * 0.32 };
    g.fillStyle(0xffffff, 0.22).fillRoundedRect(x + 12, art.y, w - 24, art.h, 8);
    g.lineStyle(2, 0xffffff, 0.55).strokeRoundedRect(x + 12, art.y, w - 24, art.h, 8);
    g.lineStyle(2, 0xffffff, 0.6).strokeCircle(x + w / 2, art.y + art.h / 2, Math.min(art.h, w) * 0.28);
  },
  rootTints: [0xd83848, 0xd09020, 0x30a860, 0x8a40d0, 0x3080d8, 0x30b8c0, 0xd0a020, 0x707890],
  moveText: (m) => ({ label: m.name, detail: `${up(m.type)}\n\n\n\n\nPWR ${m.power} ACC ${m.accuracy}\nPP ${m.pp}/${m.maxPp}` }),
  backdrop: (scene, field) => {
    const g = scene.add.graphics();
    g.fillGradientStyle(0x0a1428, 0x0a1428, 0x0a1428, 0x0a1428, 0, 0, 0.85, 0.85).fillRect(0, 297, 960, 243);
    field.add(g);
  },
};
