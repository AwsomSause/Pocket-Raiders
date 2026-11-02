import type Phaser from 'phaser';
// 09 Prize Reels: a slot-machine window; the prize spins by before each reel stops.
import { fillGradient, face } from './common';
import type { RewardSkin } from './types';

export const reels: RewardSkin = {
  backdrop(scene) {
    fillGradient(scene, 0x4a0a1a, 0x1a0408);
    const g = scene.add.graphics().setDepth(-79);
    for (let x = 0; x < 960; x += 24) g.fillStyle(x % 48 === 0 ? 0xffd040 : 0xff5040, 0.5).fillCircle(x + 12, 90, 4);
  },
  card(g, c) {
    face(g, c, 0x2a0e18, 0xffd040, { gloss: 0.1 });
    // The reel window around the icon.
    g.fillStyle(0xfff4d8, 1).fillRoundedRect(-c.w / 2 + 10, -131, c.w - 20, 84, 10);
    g.lineStyle(3, c.rim, 1).strokeRoundedRect(-c.w / 2 + 10, -131, c.w - 20, 84, 10);
  },
  decorate(scene, card, icon, c) {
    if (c.motion === 'off') return;
    const img = icon as Phaser.GameObjects.Image;
    const home = img.y;
    if (c.motion !== 'full') return;
    // Spin: the picture rolls through the window a few times, then lands with a bounce.
    img.setAlpha(0.6).y = home - 70;
    scene.tweens.add({ targets: img, y: home + 70, duration: 130, repeat: 3 + c.index, delay: 150, onComplete: () => {
      img.setAlpha(1).y = home - 60;
      scene.tweens.add({ targets: img, y: home, duration: 380, ease: 'Bounce.easeOut' });
    } });
    // Reel lines streak past while it spins.
    const streak = scene.add.rectangle(0, home, c.w - 30, 8, 0xffffff, 0.35);
    card.add(streak);
    scene.tweens.add({ targets: streak, alpha: 0, duration: 300, delay: 300 + (3 + c.index) * 130 });
  },
};
