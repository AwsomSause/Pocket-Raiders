// 02 Enhanced Classic: flat navy panels with crisp white borders and square rows, like the Essentials party screen.
import { windowFace } from './common';
import type { PartySkin } from './types';

export const classic: PartySkin = {
  shape: 'square',
  palette: { row: 0x1c2c58, rowAlpha: 0.95, rowFocus: 0x3a58a8, rowRim: 0xa8c0f0, focusRim: 0xfff2b0, tab: 0x1c2c58, tabActive: 0x3a58a8, pane: 0x101c3c, paneRim: 0xa8c0f0 },
  chrome(scene, root) {
    windowFace(scene, root, { fill: 0x0c1430, rim: 0xf0f4ff, band: 0x20386c, bandRim: 0xf0f4ff, radius: 6 });
  },
};
