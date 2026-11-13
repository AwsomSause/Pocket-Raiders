// Beta 0.6 slice E1: variant lines as battle hooks (data: src/data/expansion/variantLines.json). A variant line is a small
// rule carried by special Pokémon. State lives in `battle.extra.variants` (saved with the battle, keyed by Pokémon uid), and the
// engine calls these pure functions at its hook points: entry, hit taken, forced switch, status, miss roll, end of turn, item moves.
// No Phaser, and no gameplay RNG stream: the few random picks (Patchwork's gadget, Snagged's refusal) come from a throwaway generator seeded by the Pokémon's uid and a salt the engine passes in, so they replay the same and never move another roll. A line's damage effect is at most 20% (VARIANT_DAMAGE_CAP) and counts in the +30% cap.
//
// Wired so far (11 of 14): Tagged (Kanto), Dark Ball (Johto), Tidebound and Cinderborn (Hoenn), Spiritless (Sinnoh),
// Overclocked (Unova), Tagged-Up and Preserved (Alola), Patchwork (Rocket Remnants), Snagged (Team Snag'em), Loud (Team Yell). The rest are listed in UNWIRED_LINES and are added by the next E1 PRs;
// assigning one throws, so none can silently do nothing.

import { z } from 'zod';
import { Rng, hashSeed } from '../rng';

export const VARIANT_DAMAGE_CAP = 0.2;
export const WIRED_LINES = ['tagged', 'dark-ball', 'tidebound', 'cinderborn', 'preserved', 'spiritless', 'overclocked', 'tagged-up', 'patchwork', 'snagged', 'loud'] as const;
export const UNWIRED_LINES = ['couture', 'overcharged', 'tuned'] as const;
export type VariantLineId = (typeof WIRED_LINES)[number];

/** One Pokémon's line and its counters ("firstHit" 1 once the first hit is taken, "tag" 1 while the tag is on, ...). */
export const VariantStateSchema = z.object({ line: z.enum(WIRED_LINES), flags: z.record(z.string(), z.number()).default({}) });
export type VariantState = z.infer<typeof VariantStateSchema>;
export const VariantsSchema = z.record(z.string(), VariantStateSchema).default({});
export type Variants = z.infer<typeof VariantsSchema>;

export type Weather = 'rain' | 'sun' | 'sand' | 'snow' | 'hail' | null;
export type StageKey = 'atk' | 'def' | 'spa' | 'spd' | 'spe';

/** Gives a Pokémon a line for this battle. Throws for a line that is not wired yet. */
export interface AssignOptions {
  /** Loud: a Yell Grunt is watching from the stands (the event or track that builds the battle says so). */
  crowd?: boolean;
  /** Loud: the player holds Marnie's League Card. */
  marnie?: boolean;
}
export function assignVariant(variants: Variants, uid: string, line: string, opts: AssignOptions = {}): void {
  if (!(WIRED_LINES as readonly string[]).includes(line)) throw new Error(`variant line "${line}" is not wired into battles yet`);
  const f: Record<string, number> = line === 'tagged' ? { tag: 1 } : {};
  if (line === 'loud') { f.crowd = opts.crowd ? 1 : 0; f.shame = opts.marnie ? 1 : 0; }
  variants[uid] = { line: line as VariantLineId, flags: f };
}

/** A stat change that wears off: Patchwork's net (Speed -2) and smoke ball (accuracy -1) last 2 turns. Saved in `battle.extra.variantTimed`. */
export const TimedStageSchema = z.object({ uid: z.string(), stat: z.enum(['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva']), amount: z.number(), left: z.number() });
export type TimedStage = z.infer<typeof TimedStageSchema>;

/** A random number in [0,1) that depends only on the text: the same uid and salt always give the same roll, and no stream moves. */
const roll = (key: string): number => new Rng(hashSeed(key)).float();

const lineOf = (variants: Variants, uid: string): VariantLineId | null => variants[uid]?.line ?? null;
const flags = (variants: Variants, uid: string): Record<string, number> => variants[uid]?.flags ?? {};

export interface EntryEffect { stages: Partial<Record<StageKey, number>>; message: string | null }

/** When it comes in. Dark Ball +1 Attack and Special Attack; Preserved -1 Speed; Tidebound/Cinderborn (+1 Special Defense in sun, director decision) read the weather. */
export function variantOnEntry(variants: Variants, uid: string, weather: Weather): EntryEffect {
  const line = lineOf(variants, uid);
  const f = flags(variants, uid);
  f.sinceEntry = 0; // Preserved's "first hit after it enters" counts from each entry.
  if (line === 'dark-ball') return { stages: { atk: 1, spa: 1 }, message: null };
  if (line === 'overclocked') { f.fresh = 1; f.turns = 0; return { stages: {}, message: null }; }
  if (line === 'tagged-up') { f.sprayed = 1; return { stages: {}, message: 'It sprays a tag on the field.' }; }
  if (line === 'patchwork') {
    const gadget = Math.floor(roll(`patchwork:${uid}`) * 3);
    f.gadget = gadget + 1;
    f.armed = 1;
    return { stages: {}, message: `It carries ${['a net', 'a smoke ball', 'a spring'][gadget]}.` };
  }
  if (line === 'snagged') { f.refusals = 0; f.skip = 0; return { stages: {}, message: null }; }
  if (line === 'loud') return { stages: {}, message: null };
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

/** Overclocked: its first move each time it enters has +1 priority. */
export const variantPriorityBonus = (variants: Variants, uid: string): number => (lineOf(variants, uid) === 'overclocked' && flags(variants, uid).fresh === 1 ? 1 : 0);

/** Spiritless: stats cannot be lowered by the foe or raised by anyone. `fromFoe` is true when a foe's move or ability does it. */
export const variantBlocksStage = (variants: Variants, uid: string, stages: number, fromFoe: boolean): boolean =>
  lineOf(variants, uid) === 'spiritless' && (stages > 0 || (stages < 0 && fromFoe));
/** Spiritless cannot flinch, be taunted or be infatuated. */
export const variantBlocksMind = (variants: Variants, uid: string): boolean => lineOf(variants, uid) === 'spiritless';
export const SPIRITLESS_MESSAGE = 'It feels nothing about that.';

/** Tagged-Up: a foe entering while the sprayer lives loses 1/16 of its HP the first time it comes in, and is called out. */
export function variantTagCall(variants: Variants, sprayerUid: string, foeUid: string, foeMaxHp: number): { loss: number; message: string | null } {
  if (lineOf(variants, sprayerUid) !== 'tagged-up') return { loss: 0, message: null };
  const f = flags(variants, sprayerUid);
  if (f.sprayed !== 1 || f[`called:${foeUid}`]) return { loss: 0, message: null };
  f[`called:${foeUid}`] = 1;
  return { loss: Math.max(1, Math.floor(foeMaxHp / 16)), message: 'called out' };
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

/** End of each of its turns: Overclocked loses its priority bonus, and overheats at the end of its third consecutive turn (-1 Speed; the script says every stat, which measured 12% in the sim, so it was cut to Speed by decision). */
export function variantEndTurnStages(variants: Variants, uid: string): { stages: Partial<Record<StageKey, number>>; message: string | null } {
  if (lineOf(variants, uid) !== 'overclocked') return { stages: {}, message: null };
  const f = flags(variants, uid);
  f.fresh = 0;
  f.turns = (f.turns ?? 0) + 1;
  if (f.turns === 3) return { stages: { spe: -1 }, message: 'The machine has asked too much.' };
  return { stages: {}, message: null };
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

/** Patchwork: the turn it would first be hit, its gadget goes off once. */
export function variantGadget(variants: Variants, uid: string): { gadget: 'net' | 'smoke' | 'spring'; message: string } | null {
  if (lineOf(variants, uid) !== 'patchwork') return null;
  const f = flags(variants, uid);
  if (f.armed !== 1) return null;
  f.armed = 0;
  return { gadget: (['net', 'smoke', 'spring'] as const)[(f.gadget ?? 1) - 1] ?? 'net', message: 'Something goes sproing.' };
}

/** Snagged: at the end of each turn it may refuse its snagger and skip its next turn: 20% the first turn, +10% each turn after. `salt` comes from the battle (its turn and RNG position), so a later battle rolls differently. */
export function variantSnagRefuses(variants: Variants, uid: string, salt: string): string | null {
  if (lineOf(variants, uid) !== 'snagged') return null;
  const f = flags(variants, uid);
  if (f.ended || f.skip === 1) return null;
  const chance = 0.2 + 0.1 * (f.refusals ?? 0);
  if (roll(`snagged:${uid}:${salt}`) >= chance) { f.refusals = (f.refusals ?? 0) + 1; return null; }
  f.refusals = 0;
  f.skip = 1;
  return "It is looking for someone who isn't here.";
}

/** Loud: sound-based moves have +20% power. */
export const variantOutgoing = (variants: Variants, uid: string, moveFlags: readonly string[]): number =>
  lineOf(variants, uid) === 'loud' && moveFlags.includes('sound') ? 1 + VARIANT_DAMAGE_CAP : 1;

/** Loud: +1 Speed at the end of a turn when a Yell Grunt is watching, up to +1 in all (uncapped or capped at +3 it measured 61.5% in the sim, so the cap is a balance decision on top of the script). */
export const LOUD_CHEER_CAP = 1;
export function variantCheer(variants: Variants, uid: string): number {
  if (lineOf(variants, uid) !== 'loud') return 0;
  const f = flags(variants, uid);
  if (f.crowd !== 1 || (f.cheers ?? 0) >= LOUD_CHEER_CAP) return 0;
  f.cheers = (f.cheers ?? 0) + 1;
  return 1;
}

/** Before it acts: Snagged skips the turn it refused; Loud loses its first turn when the player holds Marnie's League Card. Returns the announcement when the turn is lost. */
export function variantLosesTurn(variants: Variants, uid: string): string | null {
  const line = lineOf(variants, uid);
  const f = flags(variants, uid);
  if (line === 'snagged' && f.skip === 1) { f.skip = 0; return 'It refuses to move.'; }
  if (line === 'loud' && f.shame === 1) { f.shame = 0; return 'It has remembered who it is cheering for.'; }
  return null;
}
