// Shonen Roster: radiating speed lines and fiery orange slashes behind a bold roster.
import { GAME_HEIGHT } from '../theme';
import { windowFace } from './common';
import type { PartySkin } from './types';

export const shonen: PartySkin = {
  shape: 'slant',
  palette: { row: 0x2a1408, rowAlpha: 0.95, rowFocus: 0xc85a10, rowRim: 0xf0a030, focusRim: 0xfff060, tab: 0x2a1408, tabActive: 0xc85a10, pane: 0x1c0e06, paneRim: 0xf0a030 },
  chrome(scene, root, motion) {
    windowFace(scene, root, { fill: 0x160a04, rim: 0xf0a030, band: 0x8a3008, bandRim: 0xffd060, radius: 4 });
    const g = scene.add.graphics();
    g.lineStyle(2, 0xffb040, 0.12);
    for (let i = 0; i < 36; i++) g.lineBetween(640, 270, 640 + Math.cos(i * 0.1745) * 700, 270 + Math.sin(i * 0.1745) * 700);
    g.fillStyle(0xf0a030, 0.9).fillTriangle(36, GAME_HEIGHT - 76, 96, GAME_HEIGHT - 76, 36, GAME_HEIGHT - 100);
    root.add(g);
    if (motion === 'full') scene.tweens.add({ targets: g, alpha: 0.55, duration: 700, yoyo: true, repeat: -1 });
  },
};
