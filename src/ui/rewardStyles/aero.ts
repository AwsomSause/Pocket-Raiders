// 01 Aero Cards: bright sky, floating bubbles, pale glass cards.
import { paintLightGlass } from '../eventStyles/common';
import { drift, fillGradient } from './common';
import type { RewardSkin } from './types';

export const aero: RewardSkin = {
  strip: { tint: 0xdff0ff, rim: 0x9fc8e8, ink: '#12324f', hp: '#0f6a46', lead: '#b07000', btnTint: 0xf2faff, btnRim: 0x7fb4e0, btnInk: '#12324f', radius: 22 },
  light: true,
  backdrop(scene, motion) {
    fillGradient(scene, 0x7fd4ff, 0xdff6ff);
    drift(scene, motion, 0xffffff, '○', 14);
  },
  card(g, c) {
    paintLightGlass(g, -c.w / 2, -135, c.w, 270, { rim: c.rim, radius: 20 });
  },
};
