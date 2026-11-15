// Mentor lessons for the run (Fenwick, Juno, Tobias): the perk readers and the rules that need no map or shop
// code. The map (mapItems.ts hiddenItemNode / visibleHiddenItemNode), shop (run.ts shopPrice / shopDealItem) and
// evolution (run.ts after a battle) hooks call these. Nothing here rolls a gameplay random number: the shop deal
// is picked from its own hash of the seed.

import type { Perks } from './archetypes';
import { blocksEvolution } from './battle/held';
import type { Content } from './contentSchema';
import { evolutionTarget } from './evolution';
import { itemUseProblem } from './items';
import { hashSeed, Rng } from './rng';
import type { PokemonInstance, RunState } from './state';

type Kind<K extends string> = Extract<Perks[number], { kind: K }>;
const of = <K extends Perks[number]['kind']>(perks: Perks | undefined, kind: K): Kind<K>[] => (perks ?? []).filter((m): m is Kind<K> => m.kind === kind);

// ---------- Fenwick: declining an evolution ----------

/** Fenwick's lesson: percent per declined evolution and the cap (steps add up; the highest cap counts), or null. */
export function declinedEvolutionBoostPerk(perks: Perks | undefined): { step: number; max: number } | null {
  const all = of(perks, 'declinedEvolutionBoost');
  if (all.length === 0) return null;
  return { step: all.reduce((n, m) => n + m.step, 0), max: Math.max(...all.map((m) => m.max)) };
}

/** Whether this Pokémon was ready to evolve after a battle but the player held it back (Hold evolution). */
export function declinedEvolution(content: Content, mon: PokemonInstance, regionId: string | undefined, levelOffset: number, bondReady: boolean): boolean {
  if (!mon.care?.holdEvolve || mon.hp <= 0 || blocksEvolution(content, mon)) return false;
  return evolutionTarget(content, { ...mon, care: { ...mon.care, holdEvolve: false } }, regionId, levelOffset, bondReady) !== null;
}

/**
 * Fenwick's lesson, after a battle: a Pokémon held back from an evolution it was ready for gains `step`% to every
 * stat, up to `max`% (cleared by evolution.ts `evolve`). Once per battle per Pokémon. Returns true when it grew.
 */
export function noteDeclinedEvolution(content: Content, perks: Perks | undefined, mon: PokemonInstance, regionId: string | undefined, levelOffset: number, bondReady: boolean): boolean {
  const boost = declinedEvolutionBoostPerk(perks);
  if (!boost || !declinedEvolution(content, mon, regionId, levelOffset, bondReady)) return false;
  const now = mon.evoDeclineBoost ?? 0;
  const next = Math.min(boost.max, now + boost.step);
  if (next === now) return false;
  mon.evoDeclineBoost = next;
  return true;
}

// ---------- Juno: seeing hidden items ----------

/** Juno's lesson: how many steps away a hidden item shows on the map (0: no lesson). */
export function hiddenItemSightPerk(perks: Perks | undefined): number {
  return Math.max(0, ...of(perks, 'hiddenItemSight').map((m) => m.nodes));
}

// ---------- Tobias: worth it, and the deal ----------

export const shopWorthItPerk = (perks: Perks | undefined): boolean => of(perks, 'shopWorthIt').length > 0;

/** Tobias's lesson: the deal item's price factor (several multiply), or null. */
export function shopDealPerk(perks: Perks | undefined): number | null {
  const all = of(perks, 'shopDeal');
  return all.length === 0 ? null : all.reduce((v, m) => v * m.value, 1);
}

/**
 * Tobias's lesson: is this shop item worth it for the current team? The rule, so the player can follow it:
 * - Evolution and form items: when a party Pokémon can use it right now.
 * - A type-boosting held item (a `typePower` hook: Charcoal, Plates as held items...): when a party Pokémon
 *   (of the item's species, if it names any) knows a damaging move of one of its types.
 * - Any other held item (Choice items, Life Orb, Leftovers...): when a party Pokémon holds nothing yet.
 * - Everything else (balls, medicine, training items): never marked.
 */
export function shopWorthIt(content: Content, run: Pick<RunState, 'party' | 'regionOrder' | 'regionIndex'>, itemId: string): boolean {
  const item = content.items.get(itemId);
  if (item && (item.category === 'evolution' || item.category === 'transformation')) {
    const regionId = run.regionOrder[run.regionIndex];
    return run.party.some((mon) => itemUseProblem(content, item, mon, regionId) === null);
  }
  const effect = content.catalog.get(itemId)?.effect;
  if (effect?.kind !== 'held') return false;
  const typed = effect.hooks.filter((h) => h.hook === 'typePower');
  if (typed.length === 0) return run.party.some((mon) => Object.keys(mon.held ?? {}).length === 0);
  return typed.some((h) =>
    run.party.some(
      (mon) =>
        (!h.species || h.species.length === 0 || h.species.includes(mon.speciesId)) &&
        mon.moves.some((slot) => {
          const move = content.moves.get(slot.id);
          return !!move && move.category !== 'status' && (move.power ?? 0) > 0 && h.types.includes(move.type);
        }),
    ),
  );
}

/** Tobias's lesson: this shop's deal item, picked from the run seed, region, stage and shop (the node and kind of shop). Uses its own hash, never a gameplay roll. */
export function pickShopDeal(run: Pick<RunState, 'seed' | 'regionIndex' | 'stage' | 'shop'>, stock: readonly { item: string }[]): string | null {
  if (stock.length === 0) return null;
  const shopId = `${run.stage?.current ?? 'start'}:${run.shop?.type ?? 'mart'}:${run.shop?.place ?? ''}`;
  return new Rng(hashSeed(`${run.seed}::shop-deal::${run.regionIndex}::${run.stage?.index ?? -1}::${shopId}`)).pick(stock).item;
}
