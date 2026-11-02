// 03 Mii Plaza Lineup: a grassy floor and sky behind the team; rows are soft pills.
import { GAME_HEIGHT, GAME_WIDTH } from '../theme';
import { windowFace } from './common';
import type { PartySkin } from './types';

export const mii: PartySkin = {
  shape: 'pill',
  palette: { row: 0x24543a, rowAlpha: 0.85, rowFocus: 0x3a9a58, rowRim: 0xc8f0a8, focusRim: 0xffffff, tab: 0x24543a, tabActive: 0x3a9a58, pane: 0x123a28, paneRim: 0xc8f0a8 },
  chrome(scene, root, motion) {
    windowFace(scene, root, { fill: 0x1c4a6a, rim: 0xe8ffd8, band: 0x3a8a58, bandRim: 0xe8ffd8 });
    const g = scene.add.graphics();
    g.fillStyle(0x4aa04a, 0.5).fillRoundedRect(36, GAME_HEIGHT - 190, GAME_WIDTH - 72, 112, 14);
    g.fillStyle(0x6fc86a, 0.35).fillEllipse(GAME_WIDTH / 2 + 130, GAME_HEIGHT - 120, 560, 70);
    root.add(g);
    for (let i = 0; i < 4; i++) {
      const c = scene.add.ellipse(360 + i * 150, 108 + (i % 2) * 14, 90, 24, 0xffffff, 0.2);
      root.add(c);
      if (motion === 'full') scene.tweens.add({ targets: c, x: c.x + 36, duration: 6000 + i * 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  },
};
