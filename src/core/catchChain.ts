// Catch Chains (S218) and Shiny Charm tiers (S225). No Phaser, no gameplay RNG beyond a named seed.
// State lives in `run.itemCounters` (`chain:<speciesId>` = links, `shinyCharm` = tiers earned), so no save version changes.
import type { Content } from './contentSchema';
import type { RunState } from './state';
import { Rng, hashSeed } from './rng';

/** How many Shiny Charm tiers the dex size reaches (0 = none). */
export function shinyCharmTiers(content: Content, dexCaught: number): number {
  return content.balance.shinyCharm.tiers.filter((t) => dexCaught >= t.dex).length;
}

/** The shiny multiplier the run's charm gives (1 = none). */
export function shinyCharmMultiplier(content: Content, run: Pick<RunState, 'itemCounters'>): number {
  const n = run.itemCounters?.shinyCharm ?? 0;
  return n > 0 ? (content.balance.shinyCharm.tiers[n - 1]?.multiplier ?? 1) : 1;
}

/** Links in the current chain for a species (0 when the last catch was another species). */
export function chainLinks(run: Pick<RunState, 'itemCounters'>, speciesId: string): number {
  return run.itemCounters?.[`chain:${speciesId}`] ?? 0;
}

/** A catch: the caught species' chain grows by one and every other chain breaks. Returns the new length. */
export function extendChain(run: RunState, speciesId: string): number {
  const counters = (run.itemCounters ??= {});
  const next = (counters[`chain:${speciesId}`] ?? 0) + 1;
  for (const key of Object.keys(counters)) if (key.startsWith('chain:')) delete counters[key];
  counters[`chain:${speciesId}`] = next;
  return next;
}

/** Extra shiny roll for a wild Pokémon of the chained species; own seeded stream, so no existing roll changes. */
export function chainShiny(content: Content, run: RunState, speciesId: string, nodeId: string, multiplier: number): boolean {
  const links = Math.min(chainLinks(run, speciesId), content.balance.catchChain.maxLinks);
  if (links <= 0) return false;
  const rng = new Rng(hashSeed(`${run.seed}:chain-shiny:${run.encountersCompleted}:${nodeId}`));
  return rng.chance(Math.min(1, content.balance.shinyChance * multiplier * links * content.balance.catchChain.shinyPerLink));
}

/** Whether a chain this long gives the caught Pokémon a talent ("perfect" odds: the game has no IVs, the talent is its mark). */
export function chainGivesTalent(content: Content, links: number): boolean {
  return links >= content.balance.catchChain.talentAt;
}
