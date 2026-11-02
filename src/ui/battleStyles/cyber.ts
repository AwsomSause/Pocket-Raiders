// 05 Cyber HUD: Cyber-Maximalism. Neon target readouts, angled panels, a scanline sheen and a live
// readout terminal (battle text and the focused move) at the bottom left.
import Phaser from 'phaser';
import { mixColor } from '../theme';
import { cutRect, menuOf, up } from './common';
import type { BattleSkin } from './types';

const CYAN = 0x26f0ff;
const MAGENTA = 0xff5ad8;
const P = (x: number, y: number) => new Phaser.Geom.Point(x, y);

const grid = (size: number) => (n: number) => {
  const cols = n <= 4 ? 2 : 3;
  const w = cols === 2 ? 226 : 148;
  const h = n <= 4 ? 66 : 40;
  return menuOf(size, w, h, (i) => [470 + (i % cols) * (w + 12), 384 + Math.floor(i / cols) * (h + 10)], { columns: cols, bare: true });
};

export const cyber: BattleSkin = {
  text: '#bfffff',
  buttonText: '#dfffff',
  layout: {
    foe: { x: 20, y: 20, panel: [0, 0, 310, 76], name: [14, 8, 18], namePrefix: 'TARGET // ', upper: true, level: [270, 8, 18], hp: [14, 36, 250, 8], types: [14, 50, 16], status: [0, 84] },
    player: { x: 600, y: 260, panel: [0, 0, 340, 78], name: [34, 8, 18], namePrefix: 'UNIT // ', upper: true, level: [326, 8, 18], hp: [34, 36, 290, 8], hpText: { at: [34, 48, 16], align: 'left', prefix: 'HP ' }, xp: [34, 70, 290], status: [0, 86] },
    bar: [12, 388, 446, 140],
    message: { x: 24, y: 400, w: 420, size: 18 },
    command: null,
    tabs: { x: 470, y: 360 },
    moveInfo: { x: 24, y: 400 },
    root: (n) => ({ ...grid(20)(n), upper: true }),
    moves: (n) => grid(18)(n),
  },
  databox: (scene, isPlayer, [x, y, w, h]) => {
    const g = scene.add.graphics();
    // The foe's panel leans out on the right, yours on the left.
    const pts = isPlayer ? [P(x + w * 0.08, y), P(x + w, y), P(x + w, y + h), P(x, y + h)] : [P(x, y), P(x + w, y), P(x + w * 0.92, y + h), P(x, y + h)];
    g.fillStyle(CYAN, 0.12).fillPoints(pts.map((p) => P(p.x + (p.x > x + w / 2 ? 4 : -4), p.y + (p.y > y ? 4 : -4))), true);
    g.fillStyle(0x020a1c, 0.88).fillPoints(pts, true);
    g.lineStyle(2, CYAN, 1).strokePoints(pts, true);
    return g;
  },
  messageBar: (scene, [x, y, w, h]) => {
    const g = scene.add.graphics();
    cutRect(g, x, y, w, h, 16, { color: 0x020a1c, alpha: 0.6 }, { width: 1, color: CYAN, alpha: 0.5 });
    return g;
  },
  pill: (g, x, y, w, h, s) => {
    const col = s.disabled ? 0x4a5a6a : s.tint;
    if (s.on) cutRect(g, x - 5, y - 5, w + 10, h + 10, 14, { color: col, alpha: 0.25 });
    cutRect(g, x, y, w, h, 10, { color: 0x040c1e, alpha: 0.88 }, { width: 2, color: col, alpha: 1 });
    if (s.on) g.fillStyle(MAGENTA, 1).fillRect(x + w - 16, y + h - 3, 16, 3);
  },
  rootTints: [0xff4a5a, 0xffc040, 0x40ff9a, 0xc060ff, 0x40a8ff, 0x40e8e8, 0xffd040, 0x8ab0c0],
  moveText: (m) => ({ label: up(m.name), detail: `${up(m.type)} · ${up(m.category).slice(0, 4)} · ${m.power} · PP${m.pp}` }),
  backdrop: (scene, field) => field.add(scene.add.rectangle(0, 0, 960, 540, 0x000a28, 0.45).setOrigin(0)),
  frame: (scene) => {
    // The scanline sheen over the whole screen.
    const g = scene.add.graphics().setDepth(150).setData('noJuice', true);
    g.fillStyle(CYAN, 0.05);
    for (let y = 0; y < 540; y += 4) g.fillRect(0, y, 960, 1);
    g.lineStyle(2, mixColor(CYAN, 0xffffff, 0.2), 0.7);
    for (const [x, y, dx, dy] of [[6, 6, 1, 1], [954, 6, -1, 1], [6, 534, 1, -1], [954, 534, -1, -1]] as const) g.lineBetween(x, y, x + 22 * dx, y).lineBetween(x, y, x, y + 22 * dy);
  },
};
