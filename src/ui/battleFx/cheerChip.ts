// Trainer face chip (animation redesign pass 19): the round picture of your trainer's face and the word beside it.
// Both are drawn once onto small canvas pictures (twice the size, shown at half) and then moved by `cheerClip`.
// Presentation only: never touches battle state or gameplay RNG; missing art means no chip.

import Phaser from 'phaser';
import { FONT_FAMILY } from '../theme';
import { trainerVisual } from '../sprites';
import { drawnBox, firstSprite } from './gimmickStage';

/** The face is 64 px across on screen (the mockup's size). */
export const CHEER_FACE = 64;
const HI = 2;
/**
 * The ring colour of each player trainer's chip: the mockup's red for Red, and each other trainer's own colour
 * (Blue's blue, Green's green, Nate's sky blue, Hilda's pink). Others use their picture's tint.
 */
export const CHEER_RING: Record<string, number> = {
  'trainer.red': 0xe3350d,
  'trainer.blue': 0x2a75bb,
  'boss.green': 0x2fa36b,
  'boss.nate': 0x3fa9f5,
  'boss.hilda': 0xe0508c,
};

const css = (c: number): string => `#${c.toString(16).padStart(6, '0')}`;

/**
 * Your trainer's face in a white circle with a ring in the trainer's colour, as the mockup's `face()`: the picture is
 * scaled so the whole trainer is 1.85 circles tall, feet at 1.9, so the circle holds the head and shoulders.
 * Null when the trainer's art isn't ready.
 */
export function cheerFace(scene: Phaser.Scene, artId: string, color: number): string | null {
  const key = `cheer.face.${artId}.${color}`;
  if (scene.textures.exists(key)) return key;
  const v = trainerVisual(scene, artId, 'Trainer', -999, -999, 2);
  try {
    const spr = firstSprite(v);
    if (!spr) return null;
    const box = drawnBox(spr);
    const f = spr.frame;
    const z = CHEER_FACE * HI;
    const c = document.createElement('canvas');
    c.width = c.height = z;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    const ring = 4 * HI;
    ctx.save();
    ctx.beginPath();
    ctx.arc(z / 2, z / 2, z / 2 - ring / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.clip();
    ctx.imageSmoothingEnabled = false;
    const s = (z * 1.85) / Math.max(1, box.h);
    ctx.drawImage(f.source.image as CanvasImageSource, f.cutX + box.x, f.cutY + box.y, box.w, box.h, z * 0.46 - (box.w * s) / 2, z * 1.9 - box.h * s, box.w * s, box.h * s);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(z / 2, z / 2, z / 2 - ring / 2, 0, Math.PI * 2);
    ctx.lineWidth = ring;
    ctx.strokeStyle = css(color);
    ctx.stroke();
    scene.textures.addCanvas(key, c);
    return key;
  } catch {
    return null;
  } finally {
    v.destroy();
  }
}

/** The word as the mockup's pill: white, dark round letters, a thin ring in the trainer's colour. */
export function cheerWordPicture(scene: Phaser.Scene, word: string, color: number): string | null {
  return pill(scene, `cheer.word.${word}.${color}`, word, { fill: '#ffffff', ink: '#16203f', ring: css(color), size: 13 });
}

/** The shiny's chip (pass 11): "✦ SHINY" on the mockup's yellow pill with a white ring. */
export function shinyChipPicture(scene: Phaser.Scene): string | null {
  return pill(scene, 'cheer.shiny', '✦ SHINY', { fill: '#ffcb05', ink: '#16203f', ring: '#ffffff', size: 15 });
}

/** The mockup's `.pill`: round letters (M PLUS Rounded 1c, 800), 4 x 10 px padding, fully rounded, a 2 px ring. */
function pill(scene: Phaser.Scene, key: string, word: string, look: { fill: string; ink: string; ring: string; size: number }): string | null {
  if (scene.textures.exists(key)) return key;
  try {
    const font = `800 ${look.size * HI}px "M PLUS Rounded 1c", ${FONT_FAMILY}`;
    const probe = document.createElement('canvas').getContext('2d');
    if (!probe) return null;
    probe.font = font;
    const border = 2 * HI;
    const w = Math.ceil(probe.measureText(word).width) + 20 * HI + border * 2;
    const h = look.size * HI + 8 * HI + border * 2;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    const r = h / 2 - border / 2;
    ctx.beginPath();
    ctx.roundRect(border / 2, border / 2, w - border, h - border, r);
    ctx.fillStyle = look.fill;
    ctx.fill();
    ctx.lineWidth = border;
    ctx.strokeStyle = look.ring;
    ctx.stroke();
    ctx.font = font;
    ctx.fillStyle = look.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(word, w / 2, h / 2 + HI);
    scene.textures.addCanvas(key, c);
    return key;
  } catch {
    return null;
  }
}

/** The mockup's four-pointed white star (26 px), drawn once. */
export function starPicture(scene: Phaser.Scene): string | null {
  const key = 'cheer.star4';
  if (scene.textures.exists(key)) return key;
  try {
    const z = 26 * HI;
    const c = document.createElement('canvas');
    c.width = c.height = z;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    const pts: [number, number][] = [[0.5, 0], [0.6, 0.4], [1, 0.5], [0.6, 0.6], [0.5, 1], [0.4, 0.6], [0, 0.5], [0.4, 0.4]];
    ctx.beginPath();
    pts.forEach(([x, y], k) => (k ? ctx.lineTo(x * z, y * z) : ctx.moveTo(x * z, y * z)));
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    scene.textures.addCanvas(key, c);
    return key;
  } catch {
    return null;
  }
}

/** Pictures here are drawn at twice their size; this is the scale that shows them at their own. */
export const PICTURE_SCALE = 1 / HI;

/** Both pictures, placed at their rest spots and shrunk to nothing (the clip grows them). */
export function cheerParts(scene: Phaser.Scene, face: { x: number; y: number }, faceKey: string, wordKey: string, depth: number): { face: Phaser.GameObjects.Image; word: Phaser.GameObjects.Image } {
  const f = scene.add.image(face.x, face.y, faceKey).setScale(1 / HI).setDepth(depth + 1);
  const w = scene.add.image(face.x - 40, face.y, wordKey).setOrigin(1, 0.5).setScale(1 / HI).setDepth(depth);
  f.name = w.name = 'cheer-chip';
  return { face: f, word: w };
}
