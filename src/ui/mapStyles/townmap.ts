// 01 Town Map: the route is drawn on a Pokégear-style region map: sea, land, a red path and square pins.
import { GAME_HEIGHT, GAME_WIDTH } from '../theme';
import { gradient, scenery } from './common';
import type { MapSkin } from './types';

export const townmap: MapSkin = {
  chrome: { header: { fill: 0x1a2a78, border: 0xffffff, alpha: 0.96, ink: '#ffffff', sub: '#bcd0ff' }, bottom: { fill: 0x1a2a78, border: 0xffffff, alpha: 0.96, ink: '#ffffff', sub: '#ffe9a0' }, button: { tint: 0x2f60c0, rim: 0xffffff, ink: '#ffffff', radius: 5, alpha: 1 } },
  frame(scene) {
    // The Pokégear-style bordered map window.
    const g = scene.add.graphics().setDepth(-52);
    g.lineStyle(8, 0x1a2a78, 1).strokeRoundedRect(10, 78, GAME_WIDTH - 20, 338, 10);
    g.lineStyle(2, 0xffffff, 0.9).strokeRoundedRect(14, 82, GAME_WIDTH - 28, 330, 8);
  },
  backdrop(scene) {
    gradient(scene, 0x2f86e0, 0x1c5ca8);
    const g = scene.add.graphics().setDepth(-53);
    g.lineStyle(1, 0xffffff, 0.12);
    for (let x = 0; x < GAME_WIDTH; x += 48) g.lineBetween(x, 0, x, GAME_HEIGHT);
    for (let y = 0; y < GAME_HEIGHT; y += 48) g.lineBetween(0, y, GAME_WIDTH, y);
    const rnd = scenery(7);
    // Land: overlapping tan and green blobs with a darker coast.
    for (let i = 0; i < 9; i++) {
      const x = 60 + rnd() * (GAME_WIDTH - 120);
      const y = 110 + rnd() * 290;
      const w = 160 + rnd() * 200;
      const h = 70 + rnd() * 70;
      g.fillStyle(0x6b4f2a, 0.55).fillEllipse(x, y + 4, w + 10, h + 8);
      g.fillStyle(i % 3 === 0 ? 0x5fa850 : 0xd8c48a, 0.95).fillEllipse(x, y, w, h);
      g.fillStyle(i % 3 === 0 ? 0x4a8c3e : 0xb89c62, 0.8).fillEllipse(x + w * 0.1, y + h * 0.15, w * 0.5, h * 0.4);
    }
  },
  edge(g, a, b, { open, walked }) {
    g.lineStyle(open ? 9 : 7, 0x5a1010, 0.9).lineBetween(a.x, a.y, b.x, b.y);
    g.lineStyle(open ? 5 : 3, walked ? 0xffe060 : open ? 0xff5040 : 0xd02818, 1).lineBetween(a.x, a.y, b.x, b.y);
  },
  token(g, x, y, r, { color, alpha, boss }) {
    const s = r * (boss ? 1.05 : 0.9);
    g.fillStyle(0x101830, alpha).fillRect(x - s - 3, y - s - 1, s * 2 + 6, s * 2 + 6);
    g.fillStyle(0xffffff, alpha).fillRect(x - s - 1, y - s - 1, s * 2 + 2, s * 2 + 2);
    g.fillStyle(color, alpha).fillRect(x - s + 2, y - s + 2, s * 2 - 4, s * 2 - 4);
    g.fillStyle(0xffffff, alpha * 0.4).fillRect(x - s + 2, y - s + 2, s * 2 - 4, 6);
  },
};
