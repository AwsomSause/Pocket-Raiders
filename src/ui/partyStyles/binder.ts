// 04 Card Binder: a leather binder page with ring holes; each Pokémon is a gold-rimmed trading card.
import { GAME_HEIGHT } from '../theme';
import { windowFace } from './common';
import type { PartySkin } from './types';

export const binder: PartySkin = {
  shape: 'round',
  palette: { row: 0x3a1c1c, rowAlpha: 0.92, rowFocus: 0x7a3030, rowRim: 0xc8a050, focusRim: 0xffe080, tab: 0x3a1c1c, tabActive: 0x7a3030, pane: 0x2a1212, paneRim: 0xc8a050 },
  chrome(scene, root) {
    windowFace(scene, root, { fill: 0x2a1410, rim: 0xc8a050, band: 0x5a2420, bandRim: 0xc8a050, radius: 14 });
    const g = scene.add.graphics();
    for (let y = 110; y < GAME_HEIGHT - 80; y += 84) {
      g.fillStyle(0x000000, 0.6).fillCircle(318, y, 7);
      g.fillStyle(0xc8c8d0, 1).fillRect(310, y - 2, 16, 4);
    }
    g.lineStyle(2, 0xc8a050, 0.35).lineBetween(312, 78, 312, GAME_HEIGHT - 82);
    root.add(g);
  },
};
