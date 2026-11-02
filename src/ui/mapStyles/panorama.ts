// 12 Region Panorama: the stage is a wide landscape in coloured biome bands; stops are glowing orbs on a pale route.
import { GAME_HEIGHT, GAME_WIDTH } from '../theme';
import { gradient } from './common';
import type { MapSkin } from './types';

const BANDS: [number, number, number][] = [
  [0x7fc8ff, 0x4f9a48, 0x2e6a30],
  [0x9cb8e8, 0x6a7a98, 0x3a4660],
  [0xf0b878, 0xc07838, 0x6a3a20],
];

export const panorama: MapSkin = {
  backdrop(scene, motion) {
    gradient(scene, 0x8ccaff, 0x2a4a2a);
    const w = GAME_WIDTH / BANDS.length;
    const g = scene.add.graphics().setDepth(-53);
    BANDS.forEach(([sky, hill, ground], i) => {
      g.fillStyle(sky, 0.9).fillRect(i * w, 0, w + 1, 250);
      g.fillStyle(hill, 1).fillEllipse(i * w + w / 2, 290, w * 1.4, 150);
      g.fillStyle(ground, 1).fillRect(i * w, 300, w + 1, GAME_HEIGHT - 300);
      g.fillStyle(0xffffff, 0.12).fillRect(i * w, 0, 2, GAME_HEIGHT);
    });
    g.fillStyle(0x000000, 0.28).fillRect(0, 74, GAME_WIDTH, 346);
    if (motion === 'full') {
      const cloud = scene.add.ellipse(120, 110, 150, 34, 0xffffff, 0.35).setDepth(-52);
      scene.tweens.add({ targets: cloud, x: GAME_WIDTH - 80, duration: 30_000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  },
  edge(g, a, b, { open, walked }) {
    g.lineStyle(open ? 9 : 6, 0xffffff, 0.2).lineBetween(a.x, a.y, b.x, b.y);
    g.lineStyle(open ? 4 : 2, walked ? 0xffe060 : 0xffffff, open || walked ? 0.95 : 0.6).lineBetween(a.x, a.y, b.x, b.y);
  },
  token(g, x, y, r, { color, alpha, boss }) {
    const s = r * (boss ? 1.05 : 0.88);
    g.fillStyle(color, 0.28 * alpha).fillCircle(x, y, s + 9);
    g.fillStyle(0x101820, alpha).fillCircle(x, y, s + 3);
    g.fillStyle(color, alpha).fillCircle(x, y, s);
    g.fillStyle(0xffffff, 0.45 * alpha).fillEllipse(x, y - s * 0.45, s * 1.1, s * 0.5);
  },
};
