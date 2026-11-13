// Shadow II: does this Shadow Pokémon obey this turn? Decided at the START of the turn from its own seeded stream
// (never the battle's), so the player can be shown the result before choosing, and previewing never moves a roll.

import { Rng, hashSeed, type RngState } from '../rng';
import type { PokemonInstance } from '../state';
import { shadowTierOf } from './tiers';

export interface ShadowTurnPlan {
  /** 'obey' = acts as ordered; 'hesitate' = Veiled, loses the turn; 'replace' = Gripped or Fallen, uses `moveIndex` instead. */
  result: 'obey' | 'hesitate' | 'replace';
  /** The move slot it uses instead (only for 'replace'). */
  moveIndex: number;
}

/**
 * `battleState` is the battle stream's state at the start of the turn (read, never drawn from), so the same fight
 * always gives the same answer and two different fights differ. Pure: calling it twice gives the same plan.
 */
export function shadowTurnPlan(mon: Pick<PokemonInstance, 'uid' | 'shadow' | 'moves'>, turn: number, battleState: RngState): ShadowTurnPlan {
  const tier = shadowTierOf(mon);
  if (!tier) return { result: 'obey', moveIndex: 0 };
  const rng = new Rng(hashSeed(`shadow-obey-${mon.uid}-${turn}::${battleState.a}.${battleState.b}.${battleState.c}.${battleState.d}`));
  if (tier.hesitateChance > 0 && rng.chance(tier.hesitateChance)) return { result: 'hesitate', moveIndex: 0 };
  if (tier.disobeyChance > 0 && rng.chance(tier.disobeyChance)) {
    const usable = mon.moves.map((m, i) => ({ m, i })).filter((x) => x.m.pp > 0);
    if (usable.length > 0) return { result: 'replace', moveIndex: rng.pick(usable).i };
  }
  return { result: 'obey', moveIndex: 0 };
}

/** The line the player reads BEFORE choosing: the tier, and (never silently) what the shadow will do this turn. Null for a Clear Pokémon. */
export function shadowPreviewLine(moveName: (id: string) => string, mon: Pick<PokemonInstance, 'uid' | 'shadow' | 'moves'>, turn: number, battleState: RngState, heartStageName?: string): string | null {
  const tier = shadowTierOf(mon);
  if (!tier) return null;
  const plan = shadowTurnPlan(mon, turn, battleState);
  // One short line (tier + Heart Gauge): the command box fits only three lines at this size.
  const head = heartStageName ? `Shadow · ${tier.name} (tier ${tier.tier}) · ${heartStageName} ${mon.shadow!.heart}/100` : `Shadow · ${tier.name} (tier ${tier.tier}) · Corruption ${mon.shadow!.heart}/100`;
  if (plan.result === 'hesitate') return `${head}\nIt may hesitate this turn.`;
  if (plan.result === 'replace') return `${head}\nThe shadow tightens: it will use ${moveName(mon.moves[plan.moveIndex]!.id)}.`;
  return head;
}
