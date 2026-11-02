// 01 Aero Cards: bright sky, floating bubbles, pale glass cards.
import { paintLightGlass } from '../eventStyles/common';
import { drift, fillGradient } from './common';
import type { RewardSkin } from './types';

export const aero: RewardSkin = {
  light: true,
  backdrop(scene, motion) {
    fillGradient(scene, 0x7fd4ff, 0xdff6ff);
    drift(scene, motion, 0xffffff, '○', 14);
  },
  card(g, c) {
    paintLightGlass(g, -c.w / 2, -135, c.w, 270, { rim: c.rim, radius: 20 });
  },
};
