// 04 Star Chart: a night-sky map; stops are stars and routes are constellation lines.
import { GAME_HEIGHT, GAME_WIDTH } from '../theme';
import { gradient, scenery } from './common';
import type { MapSkin } from './types';

export const starchart: MapSkin = {
  backdrop(scene, motion) {
    gradient(scene, 0x050a24, 0x16123a);
    const rnd = scenery(11);
    for (let i = 0; i < 90; i++) {
      const star = scene.add.circle(rnd() * GAME_WIDTH, rnd() * GAME_HEIGHT, 0.8 + rnd() * 1.4, 0xdfe8ff, 0.4 + rnd() * 0.5).setDepth(-53);
      if (motion === 'full' && i % 3 === 0) scene.tweens.add({ targets: star, alpha: 0.1, duration: 900 + rnd() * 1800, yoyo: true, repeat: -1, delay: rnd() * 1500, ease: 'Sine.easeInOut' });
    }
  },
  edge(g, a, b, { open, walked }) {
    g.lineStyle(open ? 3 : 1.5, walked ? 0xffd860 : open ? 0xffffff : 0x7a90d0, walked || open ? 0.95 : 0.55).lineBetween(a.x, a.y, b.x, b.y);
  },
  token(g, x, y, r, { color, alpha, boss }) {
    const s = r * (boss ? 1.1 : 0.85);
    g.fillStyle(color, 0.16 * alpha).fillCircle(x, y, s + 12);
    g.fillStyle(color, 0.3 * alpha).fillCircle(x, y, s + 5);
    g.lineStyle(2, 0xffffff, 0.75 * alpha);
    g.lineBetween(x - s - 8, y, x + s + 8, y).lineBetween(x, y - s - 8, x, y + s + 8);
    g.fillStyle(color, alpha).fillCircle(x, y, s);
    g.fillStyle(0xffffff, 0.7 * alpha).fillCircle(x - s * 0.25, y - s * 0.3, s * 0.35);
  },
};
