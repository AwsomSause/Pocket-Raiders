// 07 Wii Menu Grid: each stop is a white channel tile on a clean pale background.
import { GAME_HEIGHT, GAME_WIDTH } from '../theme';
import { gradient } from './common';
import type { MapSkin } from './types';

export const wiigrid: MapSkin = {
  backdrop(scene) {
    gradient(scene, 0xf4f8fc, 0xd2dde8);
    const g = scene.add.graphics().setDepth(-53);
    g.fillStyle(0xffffff, 0.5).fillRect(0, GAME_HEIGHT - 128, GAME_WIDTH, 128);
    g.lineStyle(1, 0xb8c6d6, 0.5);
    for (let x = 0; x < GAME_WIDTH; x += 96) g.lineBetween(x, 78, x, GAME_HEIGHT - 124);
  },
  edge(g, a, b, { open, walked }) {
    g.lineStyle(open ? 5 : 3, walked ? 0x6fc2f0 : open ? 0x2aa8f0 : 0xaebccc, open || walked ? 0.9 : 0.55).lineBetween(a.x, a.y, b.x, b.y);
  },
  token(g, x, y, r, { color, alpha, boss, reachable }) {
    const s = r * (boss ? 1.1 : 0.95);
    g.fillStyle(0x6a7a8c, 0.2 * alpha).fillRoundedRect(x - s + 2, y - s + 5, s * 2, s * 2, 12);
    g.fillStyle(0xffffff, alpha).fillRoundedRect(x - s, y - s, s * 2, s * 2, 12);
    g.lineStyle(reachable ? 3 : 2, reachable ? 0x2aa8f0 : 0xaebccc, alpha).strokeRoundedRect(x - s, y - s, s * 2, s * 2, 12);
    g.fillStyle(color, alpha).fillCircle(x, y, s * 0.72);
    g.fillStyle(0xffffff, 0.35 * alpha).fillEllipse(x, y - s * 0.35, s * 1.0, s * 0.45);
  },
};
