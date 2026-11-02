// 10 Manga Roster: a black page with white ink frames, screentone dots and slanted character panels.
import { windowFace, dots } from './common';
import type { PartySkin } from './types';

export const manga: PartySkin = {
  shape: 'slant',
  palette: { row: 0x1a1a1a, rowAlpha: 0.95, rowFocus: 0x3a3a3a, rowRim: 0xe8e8e8, focusRim: 0xffffff, tab: 0x161616, tabActive: 0x484848, pane: 0x111111, paneRim: 0xf0f0f0 },
  chrome(scene, root) {
    windowFace(scene, root, { fill: 0x0a0a0a, rim: 0xffffff, band: 0x202020, bandRim: 0xffffff, radius: 3 });
    dots(scene, root, 0xffffff, 0.07, 14, 2.2);
    const g = scene.add.graphics();
    g.fillStyle(0xe83040, 1).fillTriangle(44, 70, 120, 70, 44, 96);
    root.add(g);
  },
};
