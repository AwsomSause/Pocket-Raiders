// Battle/AI batch 1 (approved ideas S156, S161, S162, S169, S170). Pure type rules the engine
// asks about at fixed points; numbers live in balance.json (`typeRules`). No random numbers.

import type { Content, Move, TypeChart, TypeName } from '../contentSchema';
import { typeEffectiveness } from './damage';
import type { CounterClass, Reaction, RegionRule, TypeRules } from './typeRulesConfig';

export type { CounterClass, Reaction, RegionRule, TypeRules };

export const typeRulesOf = (content: Content): TypeRules => content.balance.typeRules;

// ---------- S169 immunity breakers ----------

/** The defending types a move actually checks: an immunity breaker skips the one type it is named for (only where that type is immune). */
export function breakImmunity(content: Content, chart: TypeChart, moveId: string, moveType: TypeName, defTypes: readonly TypeName[]): { types: TypeName[]; broke: TypeName | null } {
  const t = typeRulesOf(content).immunityBreakers[moveId] as TypeName | undefined;
  if (!t || !defTypes.includes(t) || typeEffectiveness(chart, moveType, [t]) !== 0) return { types: [...defTypes], broke: null };
  return { types: defTypes.filter((d) => d !== t), broke: t };
}

// ---------- S156 regional type charts ----------

export function regionRules(content: Content, regionId: string | null | undefined): RegionRule[] {
  return regionId ? ((typeRulesOf(content).regions[regionId] ?? []) as RegionRule[]) : [];
}

/** The type chart with a region's tweaks on top (a fresh object; the input is not changed). */
export function regionalChart(chart: TypeChart, rules: readonly RegionRule[]): TypeChart {
  if (rules.length === 0) return chart;
  const out: TypeChart = {};
  for (const [atk, row] of Object.entries(chart)) out[atk as TypeName] = { ...row };
  for (const r of rules) {
    const row = (out[r.attack] ??= {});
    if (r.mult === 1) delete row[r.defend];
    else row[r.defend] = r.mult;
  }
  return out;
}

// ---------- S161 status stacking ----------

/** Burn and plain poison stack; Toxic, sleep, paralysis and freeze do not. */
export const stackableStatus = (status: { id: string; bad?: boolean } | null | undefined, incoming: string): boolean => Boolean(status && status.id === incoming && (incoming === 'brn' || incoming === 'psn') && !status.bad);

/** Residual damage multiplier for a stacked status (1 stack = 1x). */
export const stackMultiplier = (content: Content, stacks: number | undefined): number => 1 + typeRulesOf(content).statusStacks.perStack * Math.max(0, (stacks ?? 1) - 1);

// ---------- S162 elemental reactions ----------

/** The reaction set off by a `second`-type hit on a target marked by a `first`-type hit, or null. */
export function reactionFor(content: Content, first: string | undefined, second: TypeName): Reaction | null {
  if (!first || first === second) return null;
  return (typeRulesOf(content).reactions as Reaction[]).find((r) => (r.types[0] === first && r.types[1] === second) || (r.types[1] === first && r.types[0] === second)) ?? null;
}

// ---------- S170 counter types ----------

const HAZARDS = new Set(['spikes', 'stealth-rock', 'toxic-spikes', 'sticky-web']);

/** A move's counter class: sound moves are Songs, pulse moves Auras, binding moves and entry hazards Traps. */
export function counterClassOf(move: Pick<Move, 'id' | 'flags' | 'effects'>): CounterClass | null {
  if (move.flags.includes('sound')) return 'song';
  if (move.flags.includes('pulse')) return 'aura';
  if (move.effects.bind || HAZARDS.has(move.id)) return 'trap';
  return null;
}

const BEATS: Record<CounterClass, CounterClass> = { song: 'aura', aura: 'trap', trap: 'song' };
export const COUNTER_NAMES: Record<CounterClass, string> = { song: 'Song', aura: 'Aura', trap: 'Trap' };

/** True when the attacking class beats the defending one. */
export const counterBeats = (attack: CounterClass | null, defend: CounterClass | null): boolean => Boolean(attack && defend && BEATS[attack] === defend);

/** One line for the move info panel ("Song: beats Aura, loses to Trap"), or null. */
export function counterLine(move: Pick<Move, 'id' | 'flags' | 'effects'>): string | null {
  const c = counterClassOf(move);
  if (!c) return null;
  const loses = (Object.keys(BEATS) as CounterClass[]).find((k) => BEATS[k] === c)!;
  return `${COUNTER_NAMES[c]}: beats ${COUNTER_NAMES[BEATS[c]]}, loses to ${COUNTER_NAMES[loses]}`;
}
