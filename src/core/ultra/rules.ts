// Beta 0.7 U1: the eleven Ultra Rules as pure numbers. The battle engine calls these from its hooks (battle/engine.ts "ultra*"),
// so every rule applies to both sides alike and nothing here rolls a random number.
import type { BoostStat } from '../contentSchema';
import type { UltraRuleId } from './beasts';

export type RuleSet = readonly UltraRuleId[];
const has = (rules: RuleSet | undefined, id: UltraRuleId): boolean => !!rules && rules.includes(id);

/** Stage changes a Pokémon gets on entering the field. */
/** `lead`: the Pokémon is a side's first of the battle (Host only possesses leads). */
export function entryStages(rules: RuleSet | undefined, lead: boolean): Partial<Record<BoostStat, number>> {
  const out: Partial<Record<BoostStat, number>> = {};
  if (lead && has(rules, 'host')) for (const s of ['atk', 'def', 'spa', 'spd', 'spe'] as const) out[s] = (out[s] ?? 0) + 1;
  if (has(rules, 'untouchable')) { out.spe = (out.spe ?? 0) + 1; out.def = (out.def ?? 0) - 1; out.spd = (out.spd ?? 0) - 1; }
  return out;
}

export interface HitFacts {
  special: boolean;
  /** Move power (0 for fixed or status). */
  power: number;
  /** 1-based turn of the battle. */
  turn: number;
  /** Healthy Pokémon behind the target on its side. */
  healthyBehind: number;
}

/** Multiplier on the damage of one hit. */
export function damageMultiplier(rules: RuleSet | undefined, f: HitFacts): number {
  if (!rules?.length) return 1;
  let m = 1;
  if (has(rules, 'flex') && f.special) m *= 0.9;
  if (has(rules, 'slow-burn') && f.turn >= 6) m *= 1.5;
  if (has(rules, 'finale') && f.power >= 100) m *= 1.2;
  if (has(rules, 'many-as-one')) m /= 1 + 0.05 * Math.max(0, f.healthyBehind);
  return m;
}

/** The most one hit may remove, or null for no cap (Slow Burn, turns 1-2: a quarter of the target's max HP). */
export function damageCap(rules: RuleSet | undefined, turn: number, targetMaxHp: number): number | null {
  return has(rules, 'slow-burn') && turn <= 2 ? Math.max(1, Math.floor(targetMaxHp / 4)) : null;
}

/** Paper Cut: a hit on a Pokémon at full HP is a critical hit. */
export const forcesCrit = (rules: RuleSet | undefined, targetAtFullHp: boolean): boolean => has(rules, 'paper-cut') && targetAtFullHp;

/** Flex: a contact move heals the user for this share of the damage dealt. */
export function contactHeal(rules: RuleSet | undefined, contact: boolean, dealt: number): number {
  return has(rules, 'flex') && contact && dealt > 0 ? Math.max(1, Math.floor(dealt / 4)) : 0;
}

/** HP share lost at the end of a turn: Host (the possessed lead, 1/16) and Overload (anyone with a boost, 1/8). */
export function endOfTurnLoss(rules: RuleSet | undefined, f: { possessed: boolean; boosted: boolean }): number {
  let share = 0;
  if (has(rules, 'host') && f.possessed) share += 1 / 16;
  if (has(rules, 'overload') && f.boosted) share += 1 / 8;
  return share;
}

/** Finale: a 100+ power move costs the user this share of the damage it dealt. */
export const finaleRecoil = (rules: RuleSet | undefined, power: number, dealt: number): number => (has(rules, 'finale') && power >= 100 && dealt > 0 ? Math.max(1, Math.floor(dealt / 10)) : 0);
/** Finale: what knocked a Pokémon out loses this share of its max HP when that Pokémon faints. */
export const faintBurstShare = (rules: RuleSet | undefined): number => (has(rules, 'finale') ? 1 / 8 : 0);
/** Beast Boost for All: a Pokémon that scores a knockout gains +1 to its highest stat. */
export const boostsOnKo = (rules: RuleSet | undefined): boolean => has(rules, 'beast-boost-all');
/** Many as One: the slowest acts first. */
export const reversesOrder = (rules: RuleSet | undefined): boolean => has(rules, 'many-as-one');
/** Overload: stat changes are doubled. */
export const stageScale = (rules: RuleSet | undefined): number => (has(rules, 'overload') ? 2 : 1);
/** Devour: foes arrive with no held items; the winner's bag loses one item and the party heals this share. */
export const devours = (rules: RuleSet | undefined): boolean => has(rules, 'devour');
export const DEVOUR_HEAL = 0.2;
