// Catalog Overhaul Pack (Alphas, QUESTLINES_ALPHAS_AND_ANOMALIES.md "The rules of an Alpha"): the Calm bar.
// An Alpha is calmed, not beaten: survive while landing balms (a thrown Calming Balm, a sound or scent it likes) until the bar is full.
// State lives on `battle.calm`; the engine calls these pure functions at its hook points. No Phaser, no RNG.

import type { EventRule } from '../contentSchema';
import type { BattleState } from '../state';

export type CalmRule = NonNullable<EventRule['calm']>;
export type CalmState = NonNullable<BattleState['calm']>;

/** Moves that count as a scent an Alpha may like. */
export const SCENT_MOVES: readonly string[] = ['sweet-scent', 'aromatherapy', 'aromatic-mist'];
/** One thrown balm with the Warden sash (Ine's reward: balms +20% on every Alpha). */
export const SASH_BALM = 1.2;

/** The bar as a calm fight opens. `sash`: the run holds Ine's Warden sash. */
export const startCalm = (rule: CalmRule, sash: boolean): CalmState => ({ bar: Math.min(rule.need, rule.start), need: rule.need, balm: sash ? SASH_BALM : 1, done: rule.start >= rule.need });

/** True when the bar is full (with a hair of tolerance for the sash's 1.2 steps). */
const full = (c: CalmState): boolean => c.bar >= c.need - 1e-6;

/** Adds to the bar. Returns the line to show, and marks the fight calmed (`done`) when the bar fills. Does nothing once calmed. */
export function addCalm(calm: CalmState, amount: number, why: string): string | null {
  if (calm.done || amount <= 0) return null;
  calm.bar = Math.min(calm.need, Math.round((calm.bar + amount) * 100) / 100);
  if (full(calm)) {
    calm.bar = calm.need;
    calm.done = true;
    return `${why} The Calm bar is full. The red goes out of its eyes.`;
  }
  return `${why} Calm ${calmText(calm)}.`;
}

/** "3 of 8" (whole steps shown; the sash's fifths round down). */
export const calmText = (c: CalmState): string => `${Math.floor(c.bar + 1e-6)} of ${c.need}`;

/** What a move of the player's adds: 1 when it carries a liked flag. */
export function likedMove(rule: CalmRule, moveId: string | null | undefined, flags: readonly string[]): boolean {
  if (!moveId) return false;
  return (rule.likes.includes('sound') && flags.includes('sound')) || (rule.likes.includes('scent') && SCENT_MOVES.includes(moveId));
}
