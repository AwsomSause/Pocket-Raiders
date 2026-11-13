// Beta 0.6 slice E1: variant lines as battle hooks (data: src/data/expansion/variantLines.json). A variant line is a small
// rule carried by special Pokémon. State lives in `battle.extra.variants` (saved with the battle, keyed by Pokémon uid), and the
// engine calls these pure functions at its hook points: entry, hit taken, forced switch, status, miss roll, end of turn, item moves.
// No RNG, no Phaser. A line's damage effect is at most 20% (VARIANT_DAMAGE_CAP) and counts in the +30% cap.
//
// Wired so far (5 of 14): Tagged (Kanto), Dark Ball (Johto), Tidebound and Cinderborn (Hoenn), Preserved (Alola).
// The other nine are listed in UNWIRED_LINES and are added by the next E1 PR; assigning one throws, so none can silently do nothing.

import { z } from 'zod';

export const VARIANT_DAMAGE_CAP = 0.2;
export const WIRED_LINES = ['tagged', 'dark-ball', 'tidebound', 'cinderborn', 'preserved'] as const;
export const UNWIRED_LINES = ['patchwork', 'snagged', 'spiritless', 'overclocked', 'couture', 'tagged-up', 'overcharged', 'loud', 'tuned'] as const;
export type VariantLineId = (typeof WIRED_LINES)[number];

/** One Pokémon's line and its counters ("firstHit" 1 once the first hit is taken, "tag" 1 while the tag is on, ...). */
export const VariantStateSchema = z.object({ line: z.enum(WIRED_LINES), flags: z.record(z.string(), z.number()).default({}) });
export type VariantState = z.infer<typeof VariantStateSchema>;
export const VariantsSchema = z.record(z.string(), VariantStateSchema).default({});
export type Variants = z.infer<typeof VariantsSchema>;

export type Weather = 'rain' | 'sun' | 'sand' | 'snow' | 'hail' | null;
export type StageKey = 'atk' | 'def' | 'spa' | 'spd' | 'spe';

/** Gives a Pokémon a line for this battle. Throws for a line that is not wired yet. */
export function assignVariant(variants: Variants, uid: string, line: string): void {
  if (!(WIRED_LINES as readonly string[]).includes(line)) throw new Error(`variant line "${line}" is not wired into battles yet`);
  variants[uid] = { line: line as VariantLineId, flags: line === 'tagged' ? { tag: 1 } : {} };
}

const lineOf = (variants: Variants, uid: string): VariantLineId | null => variants[uid]?.line ?? null;
const flags = (variants: Variants, uid: string): Record<string, number> => variants[uid]?.flags ?? {};

export interface EntryEffect { stages: Partial<Record<StageKey, number>>; message: string | null }

/** When it comes in. Dark Ball +1 Attack and Special Attack; Preserved -1 Speed; Tidebound/Cinderborn (+1 Special Defense in sun, director decision) read the weather. */
export function variantOnEntry(variants: Variants, uid: string, weather: Weather): EntryEffect {
  const line = lineOf(variants, uid);
  const f = flags(variants, uid);
  f.sinceEntry = 0; // Preserved's "first hit after it enters" counts from each entry.
  if (line === 'dark-ball') return { stages: { atk: 1, spa: 1 }, message: null };
  if (line === 'preserved') { f.guard = 1; return { stages: { spe: -1 }, message: 'It was kept very carefully.' }; }
  if (line === 'tidebound') {
    f.tide = weather === 'rain' ? 1 : 0;
    if (weather === 'rain') return { stages: { spe: 1 }, message: 'The tide is with it.' };
    if (weather === 'sun') return { stages: {}, message: 'The tide is out.' };
  }
  if (line === 'cinderborn') {
    f.warm = weather === 'sun' ? 1 : 0;
    if (weather === 'sun') return { stages: { spd: 1 }, message: 'The ground is warm.' };
    if (weather === 'rain') return { stages: {}, message: 'The ground is cold.' };
  }
  return { stages: {}, message: null };
}

/** The hit it takes: a damage multiplier (and an announcement once). Tagged: first hit of the battle -20%. Preserved: first hit after entering -20% (the script says 25%; the plan's 20% cap wins). */
export function variantIncoming(variants: Variants, uid: string): { multiplier: number; message: string | null } {
  const line = lineOf(variants, uid);
  const f = flags(variants, uid);
  if (line === 'tagged' && f.tag === 1 && !f.firstHit) {
    f.firstHit = 1;
    return { multiplier: 1 - VARIANT_DAMAGE_CAP, message: 'The tag holds it in place.' };
  }
  if (line === 'preserved' && f.guard === 1) {
    f.guard = 0;
    return { multiplier: 1 - VARIANT_DAMAGE_CAP, message: 'It was kept very carefully.' };
  }
  return { multiplier: 1, message: null };
}

/** Tagged cannot be forced to switch out. */
export const variantBlocksForcedSwitch = (variants: Variants, uid: string): boolean => lineOf(variants, uid) === 'tagged' && flags(variants, uid).tag === 1;

/** Preserved cannot be given a status condition. */
export const variantBlocksStatus = (variants: Variants, uid: string): boolean => lineOf(variants, uid) === 'preserved';

/** Tidebound's Water moves and Cinderborn's Fire and Ground moves cannot miss under their weather. */
export function variantNeverMisses(variants: Variants, uid: string, weather: Weather, moveType: string): boolean {
  const line = lineOf(variants, uid);
  if (line === 'tidebound') return weather === 'rain' && moveType === 'water';
  if (line === 'cinderborn') return weather === 'sun' && (moveType === 'fire' || moveType === 'ground');
  return false;
}

/** End of turn: Dark Ball loses 1/16 of its HP. Returns the loss (0 for other lines) and the announcement. */
export function variantEndTurnLoss(variants: Variants, uid: string, maxHp: number): { loss: number; message: string | null } {
  if (lineOf(variants, uid) !== 'dark-ball' || flags(variants, uid).ended) return { loss: 0, message: null };
  return { loss: Math.max(1, Math.floor(maxHp / 16)), message: 'The Ball burns.' };
}

/** Knock Off or Thief tears the tag off. Returns the announcement the first time. */
export function variantItemMove(variants: Variants, uid: string, moveId: string): string | null {
  if (lineOf(variants, uid) !== 'tagged' || flags(variants, uid).tag !== 1) return null;
  if (moveId !== 'knock-off' && moveId !== 'thief') return null;
  flags(variants, uid).tag = 0;
  return 'The tag is torn off!';
}

/** The battle is won (Tagged) or its trainer is beaten (Dark Ball): the rule ends. Catching or freeing it ends it too. */
export function variantEnd(variants: Variants, uid: string): void {
  const f = variants[uid]?.flags;
  if (!f) return;
  f.tag = 0;
  f.ended = 1;
  f.guard = 0;
}
