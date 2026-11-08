// Rebalance (anti-sweep): Gym Leaders, Elite Four, Champions and Rivals get the same kinds of gear a player can:
// held items picked for what the Pokémon does, max-ish IVs, EV spreads and training stacks.
// No RNG: the same member and tier always give the same result.

import type { Content } from './contentSchema';
import type { PlannedMember } from './encounters';
import { STAT_NAMES, type StatName } from './contentSchema';
import { getSpecies } from './pokemon';

export type GearTier = 'gym' | 'elite' | 'champion' | 'rival';

const TIERS: Record<GearTier, { iv: number; ev: number; stacks: number }> = {
  gym: { iv: 20, ev: 128, stacks: 1 },
  elite: { iv: 26, ev: 192, stacks: 2 },
  champion: { iv: 31, ev: 252, stacks: 3 },
  rival: { iv: 31, ev: 252, stacks: 3 },
};

/** Items in order of preference for a Pokémon; the first `count` not already held are used. */
function itemPlan(content: Content, m: PlannedMember, isLead: boolean, isAce: boolean): string[] {
  const s = getSpecies(content, m.speciesId).baseStats;
  const physical = s.atk >= s.spa;
  const bulk = s.hp + s.def + s.spd;
  const damaging = (m.moves ?? []).filter((id) => content.moves.get(id)?.category !== 'status').length;
  const out: string[] = [];
  if (isAce) out.push('life-orb');
  if (isLead && s.spe >= 90 && !isAce) out.push('focus-sash');
  if (bulk >= 270) out.push('leftovers');
  if (s.spd >= 100 && damaging === (m.moves ?? []).length && !physical) out.push('assault-vest');
  out.push(physical ? 'muscle-band' : 'wise-glasses', 'sitrus-berry', 'expert-belt', 'leftovers', 'lum-berry');
  return [...new Set(out)];
}

export function gearMember(content: Content, m: PlannedMember, tier: GearTier, isLead: boolean, isAce: boolean, itemsPer: number): PlannedMember {
  const t = TIERS[tier];
  const s = getSpecies(content, m.speciesId).baseStats;
  const main: StatName = s.atk >= s.spa ? 'atk' : 'spa';
  const cap = content.balance.vitaminMaxStacks;
  const training: Partial<Record<StatName, number>> = { ...(m.training ?? {}) };
  const want: Partial<Record<StatName, number>> = { [main]: t.stacks, spe: t.stacks, hp: t.stacks, def: tier === 'gym' || tier === 'elite' ? Math.max(0, t.stacks - 1) : t.stacks, spd: tier === 'gym' || tier === 'elite' ? Math.max(0, t.stacks - 1) : t.stacks };
  for (const k of Object.keys(want) as StatName[]) training[k] = Math.min(cap, Math.max(training[k] ?? 0, want[k] ?? 0));
  // EVs: the full tier amount in the attacking stat and speed (or hp for slow ones), a little in hp.
  const fast = s.spe >= 80;
  const evs: Partial<Record<StatName, number>> = { [main]: t.ev, [fast ? 'spe' : 'hp']: t.ev, ...(fast ? { hp: Math.floor(t.ev / 42) } : {}) };
  const ivs = Object.fromEntries(STAT_NAMES.map((k) => [k, t.iv])) as Record<StatName, number>;
  const held = { ...(m.held ?? {}) };
  for (const id of itemPlan(content, m, isLead, isAce)) {
    if (Object.keys(held).length >= Math.max(1, itemsPer)) break;
    if (!(id in held)) held[id] = 1;
  }
  return { ...m, training, ivs, evs, held };
}

/** Gears a whole team in battle order (the first is the lead, the last the ace). `itemsPer` mirrors the player's items per Pokémon for Champions and Rivals. */
export function gearTeam(content: Content, members: PlannedMember[], tier: GearTier, itemsPer = 1): PlannedMember[] {
  return members.map((m, i) => gearMember(content, m, tier, i === 0, i === members.length - 1, tier === 'champion' || tier === 'rival' ? itemsPer : 1));
}

/** The player's average number of different held items per Pokémon, rounded, at least 1 and at most 3. */
export function playerItemsPer(party: readonly { held?: Record<string, number> }[]): number {
  if (party.length === 0) return 1;
  const total = party.reduce((n, p) => n + Object.keys(p.held ?? {}).length, 0);
  return Math.max(1, Math.min(3, Math.round(total / party.length)));
}
