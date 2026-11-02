// 11 Next-Stop Cards: a warm, dim table with a dotted road; every stop is a little card with a coloured header.
import { GAME_HEIGHT, GAME_WIDTH } from '../theme';
import { dashed, gradient } from './common';
import type { MapSkin } from './types';

export const nextstop: MapSkin = {
  cards: true,
  backdrop(scene) {
    gradient(scene, 0x3a2c22, 0x1a1410);
    const g = scene.add.graphics().setDepth(-53);
    for (let i = 0; i < 6; i++) g.fillStyle(0xffe0a0, 0.025 + i * 0.004).fillEllipse(GAME_WIDTH / 2, 240, GAME_WIDTH - i * 110, 340 - i * 40);
    g.lineStyle(2, 0xffe0a0, 0.08).strokeRoundedRect(14, 78, GAME_WIDTH - 28, GAME_HEIGHT - 204, 18);
  },
  edge(g, a, b, { open, walked }) {
    g.lineStyle(open ? 4 : 3, walked ? 0xf8c030 : open ? 0xfff0c0 : 0x8a7a68, open || walked ? 1 : 0.6);
    dashed(g, a, b, open ? 10 : 6, 7);
  },
  token(g, x, y, r, { color, alpha, boss, reachable }) {
    const w = r * (boss ? 1.9 : 1.7);
    const h = r * (boss ? 2.4 : 2.2);
    g.fillStyle(0x000000, 0.4 * alpha).fillRoundedRect(x - w / 2 + 2, y - h / 2 + 4, w, h, 8);
    g.fillStyle(0xf6ecd8, alpha).fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    g.fillStyle(color, alpha).fillRoundedRect(x - w / 2, y - h / 2, w, h * 0.5, { tl: 8, tr: 8, bl: 0, br: 0 });
    g.lineStyle(reachable ? 3 : 2, reachable ? 0xffe070 : 0x2a1c10, alpha).strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
  },
};
