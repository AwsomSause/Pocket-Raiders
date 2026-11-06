// How a Poké Ball looks when thrown (Story Overhaul P3). Pure data and a hash: no RNG, no Phaser.
import { BALL_EXIT_FX } from '../assets/storyIcons.ts';

export type BallExitFx = (typeof BALL_EXIT_FX)[number];

/** The ball an uncaught Pokémon (starters, gifts, eggs) is sent out from. */
export const DEFAULT_BALL = 'poke-ball';

const FX_BY_BALL: Record<string, BallExitFx> = {
  'poke-ball': 'ring_pulse', 'great-ball': 'ring_pulse', 'premier-ball': 'ring_pulse', 'blessing-ball': 'ring_pulse',
  'ultra-ball': 'star_swirl', 'luxury-ball': 'star_swirl', 'master-ball': 'sparkle_burst', 'dream-ball': 'sparkle_burst', 'beast-ball': 'star_swirl',
  'snag-ball': 'shadow_smoke', 'dusk-ball': 'shadow_smoke', 'leaden-ball': 'shadow_smoke', 'moon-ball': 'shadow_smoke',
  'fast-ball': 'electric_spark', 'quick-ball': 'electric_spark', 'timer-ball': 'electric_spark', 'jet-ball': 'electric_spark',
  'net-ball': 'water_splash', 'dive-ball': 'water_splash', 'lure-ball': 'water_splash',
  'nest-ball': 'leaf_swirl', 'friend-ball': 'leaf_swirl', 'safari-ball': 'leaf_swirl', 'feather-ball': 'leaf_swirl', 'wing-ball': 'leaf_swirl',
  'repeat-ball': 'flame_burst', 'heal-ball': 'sparkle_burst', 'level-ball': 'flame_burst', 'love-ball': 'sparkle_burst', 'heavy-ball': 'flame_burst', 'gigaton-ball': 'flame_burst', 'sport-ball': 'flame_burst',
};

const hash = (s: string): number => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

/** The pack's ball-opening effect for a ball; balls we have not mapped get a stable pick by name. */
export const ballExitFx = (itemId: string): BallExitFx => FX_BY_BALL[itemId] ?? BALL_EXIT_FX[hash(itemId) % BALL_EXIT_FX.length]!;

const TINTS = [0xff8a8a, 0x8ac8ff, 0xffe27a, 0xa6f0a0, 0xd7a6ff, 0xffb27a, 0x9af0e6, 0xf5a6d8] as const;
/** The tint that stands in for a ball with no picture of its own (drawn on the plain Poké Ball): the same ball always gets the same one. */
export const ballFallbackTint = (itemId: string): number => TINTS[hash(itemId) % TINTS.length]!;

