// 12 Spotlight Stage: a dark stage with a light cone on the detail area; the waiting Pokémon fade into the shadows.
import { GAME_HEIGHT } from '../theme';
import { windowFace } from './common';
import type { PartySkin } from './types';

export const spotlight: PartySkin = {
  shape: 'pill',
  dimRows: true,
  palette: { row: 0x14141c, rowAlpha: 0.7, rowFocus: 0x40407a, rowRim: 0x5a5a7a, focusRim: 0xfff2b0, tab: 0x14141c, tabActive: 0x40407a, pane: 0x0c0c14, paneRim: 0x6a6a8a },
  chrome(scene, root, motion) {
    windowFace(scene, root, { fill: 0x08080e, rim: 0x6a6a8a, band: 0x181828, bandRim: 0x8a8aaa });
    const g = scene.add.graphics().setBlendMode('ADD');
    g.fillStyle(0xfff0c0, 0.09).fillTriangle(640, 70, 330, GAME_HEIGHT - 80, 930, GAME_HEIGHT - 80);
    g.fillStyle(0xfff0c0, 0.08).fillEllipse(630, GAME_HEIGHT - 88, 560, 46);
    root.add(g);
    if (motion === 'full') scene.tweens.add({ targets: g, alpha: 0.65, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  },
};
