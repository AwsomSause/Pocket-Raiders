// gn.60 The Pokémon That Followed You Home: the scenery cues. Small shapes in a battle background; no text, no prompt, never interactive.
// What shows comes from core/greenneedle/followed.ts (`followedCue`): 1 a shape in the far layer, 2 a tail leaving, 4 a second line of
// footprints, 5 a shadow beside the player's, 6 a sleeper at the edge of the firelight. Pure decoration: a failure here never touches the battle.
import type Phaser from 'phaser';
import type { MotionLevel } from '../aero';
import { GAME_HEIGHT, GAME_WIDTH } from '../theme';

const DARK = 0x14121c;

export function addFollowedCue(scene: Phaser.Scene, field: Phaser.GameObjects.Container, cue: number, motion: MotionLevel, player: { x: number; y: number }): void {
  if (cue <= 0) return;
  try {
    const g = scene.add.graphics();
    g.setAlpha(0.5).setDepth(-1);
    if (cue === 1) {
      // A shape at the edge of the far layer. It could be a rock.
      g.fillStyle(DARK, 1).fillEllipse(96, GAME_HEIGHT * 0.36, 34, 20).fillEllipse(88, GAME_HEIGHT * 0.36 - 11, 14, 12);
    } else if (cue === 2) {
      // A tail, leaving the frame.
      g.lineStyle(7, DARK, 1).beginPath().moveTo(GAME_WIDTH - 40, GAME_HEIGHT * 0.5).lineTo(GAME_WIDTH - 22, GAME_HEIGHT * 0.5 - 14).lineTo(GAME_WIDTH - 6, GAME_HEIGHT * 0.5 - 6).strokePath();
      if (motion !== 'off') scene.tweens.add({ targets: g, x: 40, alpha: 0, duration: 1400, ease: 'Sine.easeIn' });
    } else if (cue === 4) {
      // Footprints beside the player's own: a second, smaller line, that stops where theirs do.
      for (let i = 0; i < 6; i++) {
        const x = 70 + i * 34;
        g.fillStyle(DARK, 1).fillEllipse(x, GAME_HEIGHT - 52 + (i % 2) * 8, 9, 5);
        g.fillStyle(DARK, 0.8).fillEllipse(x + 6, GAME_HEIGHT - 38 + (i % 2) * 6, 5, 3);
      }
      g.setAlpha(0.35);
    } else if (cue === 5) {
      // Its shadow, next to the player's.
      g.fillStyle(DARK, 1).fillEllipse(player.x + 96, player.y + 34, 46, 12);
      g.setAlpha(0.4);
    } else if (cue === 6) {
      // Asleep at the edge of the firelight.
      g.fillStyle(0xffb866, 0.25).fillEllipse(76, GAME_HEIGHT * 0.4, 90, 40);
      g.fillStyle(DARK, 1).fillEllipse(76, GAME_HEIGHT * 0.4 + 4, 28, 14);
    }
    field.add(g);
  } catch {
    // Decoration only.
  }
}
