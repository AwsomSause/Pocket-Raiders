// S254: the foe trainer's portrait chip in a trainer battle, with an emote that changes as the fight goes on.
// Presentation only; a failure here never touches the battle.

import type Phaser from 'phaser';
import { EXPRESSIONS, type Expression } from '../../core/presentation/expressions';
import { trainerVisual } from '../sprites';
import { GAME_WIDTH, textStyle } from '../theme';
import type { MotionLevel } from '../aero';

export interface PortraitChip {
  set(expr: Expression): void;
  destroy(): void;
}

export function portraitChip(scene: Phaser.Scene, assetId: string, label: string, motion: MotionLevel): PortraitChip {
  const x = GAME_WIDTH - 52;
  const y = 84;
  const back = scene.add.rectangle(x, y, 76, 76, 0x101830, 0.72).setStrokeStyle(2, 0x9fe8ff).setDepth(7);
  const art = trainerVisual(scene, assetId, label, x, y + 34, 0.9) as Phaser.GameObjects.Sprite;
  art.setDepth(7.1);
  const emote = scene.add.text(x - 30, y - 30, '', textStyle(20, '#ffe060', { stroke: '#181818', strokeThickness: 4 })).setOrigin(0.5).setDepth(7.2);
  let current: Expression = 'calm';
  return {
    set(expr) {
      if (expr === current || !art.active) return;
      current = expr;
      const look = EXPRESSIONS[expr];
      (art as unknown as { setTint?: (c: number) => void; clearTint?: () => void })[look.tint === 0xffffff ? 'clearTint' : 'setTint']?.(look.tint);
      emote.setText(look.emote);
      if (motion === 'full') scene.tweens.add({ targets: [art, emote], y: '-=5', duration: 90, yoyo: true, ease: 'Quad.easeOut' });
    },
    destroy() {
      for (const o of [back, art, emote]) o.destroy();
    },
  };
}
