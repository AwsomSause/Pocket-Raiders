// 12 Region Panorama: the stage is a wide landscape in coloured biome bands; stops are glowing orbs on a pale route.
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../theme';
import type { MapSkin } from './types';

const BANDS: [number, number, number][] = [
  [0x7fc8ff, 0x4f9a48, 0x2e6a30],
  [0x9cb8e8, 0x6a7a98, 0x3a4660],
  [0xf0b878, 0xc07838, 0x6a3a20],
];

export const panorama: MapSkin = {
  chrome: { header: { fill: 0x101820, border: 0xffffff, alpha: 0.6, ink: '#ffffff', sub: '#d8e8f8' }, bottom: { fill: 0x101820, border: 0xffffff, alpha: 0.66, ink: '#ffffff', sub: '#ffe9a0' }, button: { tint: 0x101820, rim: 0xffffff, ink: '#ffffff', radius: 14, alpha: 0.8 } },
  frame(scene, _motion, { types }) {
    // Each band is named like a biome on the route.
    const w = GAME_WIDTH / BANDS.length;
    const names = [0, 1, 2].map((i) => `${(types[i % Math.max(1, types.length)] ?? 'wild').replace(/^./, (c) => c.toUpperCase())} ${['Fields', 'Wilds', 'Heights'][i]}`);
    names.forEach((n, i) => scene.add.text(i * w + 14, 80, n, textStyle(15, '#ffffff', { stroke: '#101820', strokeThickness: 4 })).setDepth(-52));
  },
  backdrop(scene, motion) {
    const w = GAME_WIDTH / BANDS.length;
    const g = scene.add.graphics().setDepth(-53);
    BANDS.forEach(([sky, hill, ground], i) => {
      g.fillStyle(sky, 0.32).fillRect(i * w, 0, w + 1, GAME_HEIGHT);
      g.fillStyle(hill, 0.3).fillEllipse(i * w + w / 2, 300, w * 1.3, 140);
      g.fillStyle(ground, 0.34).fillRect(i * w, 320, w + 1, GAME_HEIGHT - 320);
      g.fillStyle(0xffffff, 0.12).fillRect(i * w, 0, 2, GAME_HEIGHT);
    });
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
