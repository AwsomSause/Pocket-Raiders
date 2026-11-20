// DOMINION slice D27: the run rules from Settings · Dominion (mockup m2). Pure: no Phaser, no RNG. A run keeps the rules
// it was started with (`block.rules`); a block without them (every run before D27) plays at Normal, so old saves and
// old seeds decide exactly what they did.

import { z } from 'zod';
import settingsRaw from '../../data/dominion/settings.json';
import { RUN_RULES_DEFAULT, type DominionBlock, type DominionPrefs, type RunRules } from './schema';

const Factor = z.number().min(0).max(3);
export const SettingsFileSchema = z.object({
  _source: z.string(),
  pace: z.object({ calm: Factor, normal: z.literal(1), ruthless: Factor }).strict(),
  hero: z.object({ low: Factor, normal: z.literal(1), high: Factor }).strict(),
  betrayals: z.object({ off: z.literal(0), rare: Factor, normal: z.literal(1) }).strict(),
  quotes: z.array(z.string().min(1)).min(1),
}).strict();
export const SETTINGS_DATA = SettingsFileSchema.parse(settingsRaw);

/** Six regions open with the Crossing (D16); until then the run is Kanto's. */
export const SIX_OPEN = false;

export const rulesOf = (b: DominionBlock): RunRules => b.rules ?? RUN_RULES_DEFAULT;
/** Day pace: rises in Heat and the rivals' Tension are multiplied by this. */
export const paceFactor = (b: DominionBlock): number => SETTINGS_DATA.pace[rulesOf(b).pace];
/** Hero pressure: the Hero's Threat is multiplied by this. */
export const heroFactor = (b: DominionBlock): number => SETTINGS_DATA.hero[rulesOf(b).hero];
/** Betrayals: a Holder's betrayal chance is multiplied by this (D15 rolls it; 0 = never). */
export const betrayalFactor = (b: DominionBlock): number => SETTINGS_DATA.betrayals[rulesOf(b).betrayals];

/** A rise scaled by the run's pace (falls are never scaled). Normal returns `n` untouched. */
export function paced(b: DominionBlock, n: number): number {
  const k = paceFactor(b);
  return n > 0 && k !== 1 ? Math.round(n * k) : n;
}

/** The rules a new run gets from the settings (Six falls back to Three while it can't be played). */
export function rulesFromPrefs(p: DominionPrefs): RunRules {
  return { ...p.run, length: SIX_OPEN ? p.run.length : 'three' };
}

/** The Boss Menu's quote for the day (by day number, not a roll). */
export const quoteFor = (day: number): string => SETTINGS_DATA.quotes[(Math.max(1, day) - 1) % SETTINGS_DATA.quotes.length]!;
