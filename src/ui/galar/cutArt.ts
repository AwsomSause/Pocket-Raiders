// Galar stadium camera-cut art: drawn in code (silhouettes, spotlight, broadcast lower-third), no image files.
// Presentation only. Uses its own seeded Rng so a cut always looks the same and never touches gameplay rolls.
import type Phaser from 'phaser';
import { hashSeed, Rng } from '../../core/rng';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../theme';

const SIL = 0x2a3a5c;
const SKIN = 0x3a4a6c;

function person(g: Phaser.GameObjects.Graphics, x: number, y: number, s: number, opts: { arms?: boolean; cap?: boolean; headset?: boolean; color?: number } = {}): void {
  g.fillStyle(opts.color ?? SIL, 1);
  g.fillCircle(x, y - 26 * s, 9 * s);
  g.fillRoundedRect(x - 13 * s, y - 16 * s, 26 * s, 34 * s, 8 * s);
  if (opts.arms) {
    g.lineStyle(5 * s, opts.color ?? SIL, 1);
    g.lineBetween(x - 11 * s, y - 10 * s, x - 20 * s, y - 36 * s);
    g.lineBetween(x + 11 * s, y - 10 * s, x + 20 * s, y - 36 * s);
  }
  if (opts.cap) g.fillRect(x - 10 * s, y - 36 * s, 20 * s, 4 * s);
  if (opts.headset) {
    g.lineStyle(2 * s, 0x9aa4b0, 1);
    g.strokeCircle(x, y - 26 * s, 11 * s);
  }
}

/** Draws one cut's art and fades it out after `durationMs`. Returns the container so the caller can clean up early. */
export function drawCutArt(scene: Phaser.Scene, cutId: string, seed: string, durationMs: number, animate: boolean): Phaser.GameObjects.Container {
  const rng = new Rng(hashSeed(`galar-cutart:${seed}:${cutId}`));
  const layer = scene.add.container(0, 0).setDepth(1795).setScrollFactor(0).setAlpha(0);
  const back = scene.add.graphics();
  back.fillStyle(0x0a1020, 0.8);
  back.fillRect(0, 40, GAME_WIDTH, GAME_HEIGHT - 80);
  layer.add(back);
  const g = scene.add.graphics();
  layer.add(g);
  const bob: Phaser.GameObjects.Graphics[] = [];

  const crowd = (rows: number, arms: boolean, cap: boolean, hot: boolean): void => {
    for (let r = 0; r < rows; r++) {
      const row = scene.add.graphics();
      const y = 310 + r * 50;
      const s = 1 + r * 0.18;
      for (let x = -10 + rng.int(0, 20); x < GAME_WIDTH + 20; x += 54 * s) {
        const color = hot && rng.float() < 0.15 ? 0xe05a3c : SIL;
        person(row, x, y, s, { arms: arms && rng.float() < 0.7, cap: cap && rng.float() < 0.5, color });
      }
      layer.add(row);
      bob.push(row);
    }
  };

  switch (cutId) {
    case 'crowd-cheer':
      crowd(3, true, false, false);
      break;
    case 'fan-group':
      crowd(3, true, false, true);
      g.fillStyle(0xffd040, 0.9);
      for (let i = 0; i < 6; i++) g.fillTriangle(120 + i * 140, 250, 108 + i * 140, 285, 132 + i * 140, 285); // foam fingers / banners
      break;
    case 'trainers-watching':
      crowd(2, false, true, false);
      break;
    case 'private-box': {
      g.fillStyle(0x141a2b, 1);
      g.fillRoundedRect(250, 190, 460, 230, 14);
      g.lineStyle(4, 0xd9b45a, 1);
      g.strokeRoundedRect(250, 190, 460, 230, 14);
      for (let i = 0; i < 4; i++) person(g, 310 + i * 110, 360, 1.5, { cap: i === 1 });
      break;
    }
    case 'commentator': {
      g.fillStyle(0x1a2234, 1);
      g.fillRect(240, 340, 480, 70);
      g.lineStyle(3, 0x78b8e8, 1);
      g.strokeRect(240, 340, 480, 70);
      person(g, 360, 350, 1.8, { headset: true });
      person(g, 600, 350, 1.8, { headset: true });
      break;
    }
    case 'opponent-closeup':
      g.fillStyle(SKIN, 1);
      g.fillCircle(GAME_WIDTH / 2, 280, 85);
      g.fillRoundedRect(GAME_WIDTH / 2 - 150, 350, 300, 160, 40);
      g.fillStyle(SIL, 1);
      g.fillRect(GAME_WIDTH / 2 - 95, 210, 190, 34); // cap brim
      break;
    case 'champion-silhouette': {
      g.fillStyle(0xfff0b0, 0.18);
      g.fillTriangle(GAME_WIDTH / 2 - 30, 60, GAME_WIDTH / 2 + 30, 60, GAME_WIDTH / 2 + 180, 470); // spotlight cone
      g.fillTriangle(GAME_WIDTH / 2 - 30, 60, GAME_WIDTH / 2 - 180, 470, GAME_WIDTH / 2 + 180, 470);
      person(g, GAME_WIDTH / 2, 400, 3.2);
      g.fillStyle(SIL, 1);
      g.fillTriangle(GAME_WIDTH / 2 - 50, 340, GAME_WIDTH / 2 + 50, 340, GAME_WIDTH / 2, 470); // cape
      break;
    }
    case 'rival-silhouette':
      g.lineStyle(6, 0x3a4660, 1);
      g.lineBetween(0, 400, GAME_WIDTH, 400); // rail
      person(g, 640, 380, 2.4, { color: 0x151b2c });
      break;
    default:
      crowd(2, true, false, false);
  }

  // Broadcast-style frame: corner marks, LIVE tag and a lower-third.
  g.lineStyle(3, 0xffffff, 0.5);
  for (const [x, y, dx, dy] of [[24, 56, 1, 1], [GAME_WIDTH - 24, 56, -1, 1], [24, GAME_HEIGHT - 56, 1, -1], [GAME_WIDTH - 24, GAME_HEIGHT - 56, -1, -1]] as const) {
    g.lineBetween(x, y, x + 30 * dx, y);
    g.lineBetween(x, y, x, y + 30 * dy);
  }
  g.fillStyle(0xd02828, 1);
  g.fillRoundedRect(36, 66, 62, 24, 6);
  layer.add(scene.add.text(67, 78, 'LIVE', textStyle(14, '#ffffff')).setOrigin(0.5));
  g.fillStyle(0x10203a, 0.92);
  g.fillRect(0, GAME_HEIGHT - 96, GAME_WIDTH * 0.62, 30);
  g.fillStyle(0xffd040, 1);
  g.fillRect(0, GAME_HEIGHT - 96, 8, 30);
  layer.add(scene.add.text(22, GAME_HEIGHT - 81, 'GALAR CHAMPIONSHIP  ·  STADIUM CAM', textStyle(14, '#ffffff')).setOrigin(0, 0.5));

  scene.tweens.add({ targets: layer, alpha: 1, duration: 180 });
  if (animate) for (const row of bob) scene.tweens.add({ targets: row, y: -6, duration: 260 + rng.int(0, 120), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  scene.time.delayedCall(Math.max(300, durationMs - 200), () => {
    scene.tweens.add({ targets: layer, alpha: 0, duration: 200, onComplete: () => layer.destroy() });
  });
  return layer;
}
