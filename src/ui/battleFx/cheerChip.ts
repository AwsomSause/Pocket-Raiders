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

/** The mockup's `.pill`: round letters (M PLUS Rounded 1c, 800), 4 x 10 px padding (or `pad`), fully rounded, a 2 px ring. */
export function pill(scene: Phaser.Scene, key: string, word: string, look: { fill: string; ink: string; ring: string; size: number; pad?: { x: number; y: number } }): string | null {
  if (scene.textures.exists(key)) return key;
  try {
    const font = `800 ${look.size * HI}px "M PLUS Rounded 1c", ${FONT_FAMILY}`;
    const probe = document.createElement('canvas').getContext('2d');
    if (!probe) return null;
    probe.font = font;
    const border = 2 * HI;
    const pad = look.pad ?? { x: 10, y: 4 };
    const w = Math.ceil(probe.measureText(word).width) + pad.x * 2 * HI + border * 2;
    const h = look.size * HI + pad.y * 2 * HI + border * 2;
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

/**
 * The mockup's `.stamp`: Jersey 15 at 30 px, 5 x 14 px padding, 10 px corners, a 3 px dark ring. `fill` is the stamp's
 * colour (`.stamp.y` is yellow with dark letters).
 */
export function stampPicture(scene: Phaser.Scene, word: string, fill = '#ffcb05', ink = '#131c36'): string | null {
  const key = `stamp.${word}.${fill}`;
  if (scene.textures.exists(key)) return key;
  try {
    const font = `400 ${30 * HI}px "Jersey 15", ${FONT_FAMILY}`;
    const probe = document.createElement('canvas').getContext('2d');
    if (!probe) return null;
    probe.font = font;
    const border = 3 * HI;
    const w = Math.ceil(probe.measureText(word).width + word.length * 0.05 * 30 * HI) + 28 * HI + border * 2;
    const h = 30 * HI + 11 * HI + border * 2;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.beginPath();
    ctx.roundRect(border / 2, border / 2, w - border, h - border, 10 * HI);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = border;
    ctx.strokeStyle = '#131c36';
    ctx.stroke();
    ctx.font = font;
    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // The mockup's letter-spacing (.05em) where the browser has it.
    try {
      (ctx as unknown as { letterSpacing: string }).letterSpacing = `${1.5 * HI}px`;
    } catch {
      /* older browsers draw it without */
    }
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

/**
 * The heal's plus-sign: the mockup's `.dmg` letters (Jersey 15) in green with the dark outline, at `HEAL_PLUS_SIZE`.
 */
export function plusPicture(scene: Phaser.Scene, size: number): string | null {
  const key = `fx.plus.${size}`;
  if (scene.textures.exists(key)) return key;
  try {
    const z = size * HI;
    const c = document.createElement('canvas');
    c.width = c.height = Math.ceil(z * 1.2);
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.font = `400 ${z}px "Jersey 15", ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const mx = c.width / 2;
    const my = c.height / 2;
    ctx.fillStyle = '#131c36';
    for (const [ox, oy] of [[3, 3], [-2, -2], [2, -2], [-2, 2]] as const) ctx.fillText('+', mx + ox * HI, my + oy * HI);
    ctx.fillStyle = '#7dffa0';
    ctx.fillText('+', mx, my);
    scene.textures.addCanvas(key, c);
    return key;
  } catch {
    return null;
  }
}

/** The size of `glowPicture` (px across). */
export const GLOW_SIZE = 256;

/**
 * A round light, as the mockup's `lgt()`: full at the middle, about half at 35% out, gone at the edge. White, so it
 * takes a tint (a move's type colour). Drawn once.
 */
export function glowPicture(scene: Phaser.Scene): string | null {
  const key = 'fx.glow';
  if (scene.textures.exists(key)) return key;
  try {
    const z = GLOW_SIZE;
    const c = document.createElement('canvas');
    c.width = c.height = z;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    const g = ctx.createRadialGradient(z / 2, z / 2, 0, z / 2, z / 2, z / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.53)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, z, z);
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
