// The throw a trainer archetype gets on the battle field (Story Overhaul P8). Pure data, no Phaser.
// 19 trainer pictures have their own throwing back sprite ("own"); every other archetype uses the player's generic throwing pose
// dressed in a soft tint taken from the trainer's own picture ("fallback", src/data/archetypeTints.json from tools/mc/build-archetype-tints.py).
import tintsJson from '../data/archetypeTints.json';
import { bossBackId } from '../assets/catalog';

const TINTS = tintsJson as Record<string, string>;
const DEFAULT_TINT = 0xffffff;
/** How far the pose moves from its own colours towards the trainer's colour (0 = untouched, 1 = flat colour). */
const STRENGTH = 0.45;

export type ThrowKind = 'own' | 'fallback';
export const throwKind = (spriteAssetId: string | null | undefined): ThrowKind => (spriteAssetId && bossBackId(spriteAssetId) ? 'own' : 'fallback');

const mix = (rgb: number): number => {
  const ch = (shift: number): number => Math.round(255 + (((rgb >> shift) & 255) - 255) * STRENGTH);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
};

/** The tint for the generic throwing pose of an archetype's trainer picture (white when the picture has no colour on record). */
export function throwTint(spriteAssetId: string | null | undefined): number {
  const hex = spriteAssetId ? TINTS[spriteAssetId] : undefined;
  return hex ? mix(Number.parseInt(hex.slice(1), 16)) : DEFAULT_TINT;
}

/** True when the archetype has a tint on record (the content test checks every fallback archetype has one). */
export const hasThrowTint = (spriteAssetId: string): boolean => spriteAssetId in TINTS;
