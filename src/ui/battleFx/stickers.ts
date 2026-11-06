// S256: a small row of emote stickers in battle. Tap one and it pops over your Pokémon. Presentation only: it reads
// nothing from the battle, uses no gameplay RNG and saves nothing. A failure here never matters to the fight.

import type Phaser from 'phaser';
import { STICKERS, canSendSticker } from '../../core/presentation/stickers';
import { GAME_WIDTH, textStyle } from '../theme';
import type { MotionLevel } from '../aero';

export function addStickerRow(scene: Phaser.Scene, at: () => { x: number; y: number }, motion: MotionLevel): Phaser.GameObjects.Container {
  const row = scene.add.container(0, 0).setDepth(60);
  let last: number | null = null;
  let live = 0;
  STICKERS.forEach((s, i) => {
    const chip = scene.add.text(GAME_WIDTH - 30 - (STICKERS.length - 1 - i) * 36, 640, s.glyph, textStyle(22, '#ffffff', { backgroundColor: '#14304f', padding: { x: 4, y: 2 } })).setOrigin(0.5).setAlpha(0.7).setInteractive({ useHandCursor: true });
    chip.setName(`sticker-${s.id}`);
    chip.on('pointerover', () => chip.setAlpha(1));
    chip.on('pointerout', () => chip.setAlpha(0.7));
    chip.on('pointerdown', () => {
      const now = scene.time.now;
      if (!canSendSticker(now, last, live)) return;
      last = now;
      live++;
      const p = at();
      const pop = scene.add.text(p.x, p.y - 90, s.glyph, textStyle(48, '#ffffff')).setOrigin(0.5).setDepth(950).setName('sticker-pop');
      const end = () => { live--; pop.destroy(); };
      if (motion === 'off') scene.time.delayedCall(900, end);
      else scene.tweens.add({ targets: pop, y: p.y - 150, alpha: 0, scale: motion === 'full' ? 1.4 : 1, duration: 1000, ease: 'Cubic.easeOut', onComplete: end });
    });
    row.add(chip);
  });
  return row;
}
