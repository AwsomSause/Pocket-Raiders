// The Phantom UI's one-press presets (Settings home): Showtime, Standard and Calm. Each sets the same handful of
// motion, flash and reading settings together; keys, sound and saves are never touched. Pure.
// Presentation only: none of these settings changes a rule or an outcome.

import type { Settings } from '../state';

export const PHANTOM_PRESET_IDS = ['showtime', 'standard', 'calm'] as const;
export type PhantomPresetId = (typeof PHANTOM_PRESET_IDS)[number];

/** `meters` fills the three little gauges on a preset's card: Motion, Flashes, Reading time (0 to 3). */
export const PHANTOM_PRESETS: readonly { id: PhantomPresetId; n: string; about: string; meters: readonly [number, number, number] }[] = [
  { id: 'showtime', n: 'Showtime', about: 'Every cut-in, full motion, big flashes.', meters: [3, 3, 2] },
  { id: 'standard', n: 'Standard', about: 'The game as it ships.', meters: [2, 2, 2] },
  { id: 'calm', n: 'Calm', about: 'Short animations, no flashes, text waits.', meters: [1, 0, 3] },
];

type Keys = 'disableAllAnimations' | 'battleAnimations' | 'animationIntensity' | 'effectIntensity' | 'shakeIntensity' | 'shakeHits' | 'shakeStory' | 'reducedFlash' | 'reduceParticles'
  | 'menuAnimations' | 'transformAnimations' | 'battleScreenEffects' | 'hyperAnimations' | 'fastZMove' | 'fastDynamax' | 'fastTera' | 'fastMega' | 'autoAdvance' | 'messageDelay';
const KEYS: readonly Keys[] = ['disableAllAnimations', 'battleAnimations', 'animationIntensity', 'effectIntensity', 'shakeIntensity', 'shakeHits', 'shakeStory', 'reducedFlash', 'reduceParticles',
  'menuAnimations', 'transformAnimations', 'battleScreenEffects', 'hyperAnimations', 'fastZMove', 'fastDynamax', 'fastTera', 'fastMega', 'autoAdvance', 'messageDelay'];

function values(id: PhantomPresetId, defaults: Settings): Pick<Settings, Keys> {
  if (id === 'showtime') return { disableAllAnimations: false, battleAnimations: 'full', animationIntensity: 'enhanced', effectIntensity: 1, shakeIntensity: 1, shakeHits: 1, shakeStory: 1, reducedFlash: false, reduceParticles: false,
    menuAnimations: true, transformAnimations: true, battleScreenEffects: true, hyperAnimations: true, fastZMove: false, fastDynamax: false, fastTera: false, fastMega: false, autoAdvance: false, messageDelay: 'normal' };
  if (id === 'calm') return { disableAllAnimations: false, battleAnimations: 'reduced', animationIntensity: 'reduced', effectIntensity: 0, shakeIntensity: 0, shakeHits: 0, shakeStory: 0, reducedFlash: true, reduceParticles: true,
    menuAnimations: false, transformAnimations: true, battleScreenEffects: false, hyperAnimations: false, fastZMove: true, fastDynamax: true, fastTera: true, fastMega: true, autoAdvance: false, messageDelay: 'long' };
  return Object.fromEntries(KEYS.map((k) => [k, defaults[k]])) as Pick<Settings, Keys>;
}

/** The settings with one preset applied. Everything a preset does not name stays as it is. */
export const applyPhantomPreset = (s: Settings, id: PhantomPresetId, defaults: Settings): Settings => ({ ...s, ...values(id, defaults), accessibilityProfile: 'custom' });

/** The preset the settings match right now, or null when the player has changed one of its settings by hand. */
export function phantomPresetOf(s: Settings, defaults: Settings): PhantomPresetId | null {
  return PHANTOM_PRESET_IDS.find((id) => { const v = values(id, defaults); return KEYS.every((k) => s[k] === v[k]); }) ?? null;
}
