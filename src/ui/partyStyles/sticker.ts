// Sticker Team: a deep purple sticker-book page with confetti; each row is a thick-outlined die-cut sticker.
import { windowFace, dots } from './common';
import type { PartySkin } from './types';

export const sticker: PartySkin = {
  shape: 'pill',
  palette: { row: 0x5a2a8a, rowAlpha: 0.95, rowFocus: 0xc83a9a, rowRim: 0xffffff, focusRim: 0xfff060, tab: 0x4a2478, tabActive: 0xc83a9a, pane: 0x32184e, paneRim: 0xffffff },
  chrome(scene, root, motion) {
    windowFace(scene, root, { fill: 0x2a1444, rim: 0xffffff, band: 0x7a34b8, bandRim: 0xffffff, radius: 26 });
    dots(scene, root, 0xff80d0, 0.18, 34, 4);
    const star = scene.add.text(900, 52, '★', { fontSize: '30px', color: '#fff060' }).setOrigin(0.5);
    root.add(star);
    if (motion === 'full') scene.tweens.add({ targets: star, angle: 20, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  },
};
