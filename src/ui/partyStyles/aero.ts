// 01 Aero Glass: deep glass window with bright aqua rims and slowly rising bubbles.
import { windowFace } from './common';
import type { PartySkin } from './types';

export const aero: PartySkin = {
  shape: 'round',
  palette: { row: 0x0a3a5a, rowAlpha: 0.7, rowFocus: 0x2a8ac8, rowRim: 0x7ff3ff, focusRim: 0xffffff, tab: 0x0a3a5a, tabActive: 0x2a8ac8, pane: 0x062a44, paneRim: 0x7ff3ff },
  chrome(scene, root, motion) {
    windowFace(scene, root, { fill: 0x0b3d63, rim: 0x9fefff, band: 0x2a9ad8, bandRim: 0xe8ffff });
    for (let i = 0; i < 9; i++) {
      const b = scene.add.circle(340 + ((i * 71) % 570), 460, 6 + (i % 3) * 5, 0xffffff, 0.14).setStrokeStyle(1, 0xffffff, 0.4);
      root.add(b);
      if (motion === 'full') scene.tweens.add({ targets: b, y: 90, alpha: 0, duration: 7000 + i * 600, delay: i * 800, repeat: -1 });
    }
  },
};
