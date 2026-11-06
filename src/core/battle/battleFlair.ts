// Battle/AI batch 4 (rundown §9): combo moves (S26), ability pairs (S167), the crowd (S32), arena interactions (S44),
// boss phase moves (S264), wild behaviour effects (S265), the adaptive shop (S278) and rival sabotage (S281).
// None of these use gameplay RNG; sabotage rolls on its own seeded stream. Tuning: balance.json `battleFlair`.

import type { Content, Move, Species } from '../contentSchema';
import { getSpecies, usableLearnset } from '../pokemon';
import { hashSeed, Rng } from '../rng';
import type { BattleState, PokemonInstance, RunState } from '../state';
import type { WildBehaviorId } from '../wildBehavior';

type Stat = 'atk' | 'def' | 'spa' | 'spd' | 'spe';

export const flairOf = (content: Content) => content.balance.battleFlair;

/** The battle's batch-4 counters, made on first use. */
export function flairState(battle: BattleState): NonNullable<BattleState['flair']> {
  return (battle.flair ??= { crowdTypes: [], cheers: 0, floodUntil: -1, paired: false });
}

// ---------- S26 Combo Moves ----------

/** Named type pairs: two allies hitting with these types in one doubles turn fire a named combo. */
export const COMBO_PAIRS: { types: [string, string]; name: string }[] = [
  { types: ['water', 'electric'], name: 'Thunderstorm' },
  { types: ['fire', 'grass'], name: 'Wildfire' },
  { types: ['fire', 'flying'], name: 'Firestorm' },
  { types: ['water', 'ice'], name: 'Frozen Tide' },
  { types: ['ground', 'rock'], name: 'Landslide' },
  { types: ['psychic', 'fairy'], name: 'Starlight' },
  { types: ['dark', 'ghost'], name: 'Nightfall' },
  { types: ['fighting', 'steel'], name: 'Iron Fist' },
  { types: ['bug', 'poison'], name: 'Swarm Sting' },
  { types: ['dragon', 'flying'], name: 'Sky Dragon' },
];

/** The named combo for two move types (either order), or null. */
export function comboName(content: Content, a: string, b: string): string | null {
  if (!flairOf(content).namedCombos || a === b) return null;
  return COMBO_PAIRS.find((p) => (p.types[0] === a && p.types[1] === b) || (p.types[0] === b && p.types[1] === a))?.name ?? null;
}

// ---------- S167 Combo Ability Pairs ----------

export const ABILITY_PAIRS: { abilities: [string, string]; boost: Stat; text: string }[] = [
  { abilities: ['plus', 'minus'], boost: 'spa', text: 'Plus and Minus spark off each other!' },
  { abilities: ['drizzle', 'swift-swim'], boost: 'spe', text: 'The rain sets the swimmer racing!' },
  { abilities: ['drought', 'chlorophyll'], boost: 'spe', text: 'The sun wakes the leaves up!' },
  { abilities: ['sand-stream', 'sand-rush'], boost: 'spe', text: 'The sandstorm whips the runner along!' },
  { abilities: ['snow-warning', 'slush-rush'], boost: 'spe', text: 'The snow sends the skater gliding!' },
  { abilities: ['drought', 'flash-fire'], boost: 'spa', text: 'The sun stokes the flames!' },
  { abilities: ['intimidate', 'defiant'], boost: 'atk', text: 'One glares, the other refuses to back down!' },
  { abilities: ['intimidate', 'competitive'], boost: 'spa', text: 'One glares, the other rises to the challenge!' },
  { abilities: ['electric-surge', 'surge-surfer'], boost: 'spe', text: 'The terrain hums and the surfer rides it!' },
  { abilities: ['friend-guard', 'friend-guard'], boost: 'def', text: 'The two friends guard each other!' },
];

/** The pair two allies' abilities make (either order), or null. */
export function abilityPair(content: Content, a: string | null, b: string | null) {
  if (!flairOf(content).abilityPairs || !a || !b) return null;
  return ABILITY_PAIRS.find((p) => (p.abilities[0] === a && p.abilities[1] === b) || (p.abilities[0] === b && p.abilities[1] === a)) ?? null;
}

// ---------- S32 Spectator Crowd ----------

/** A player's damaging move of this type was used in a trainer battle; returns true when the crowd cheers (a new count of different types reached). */
export function crowdSees(content: Content, battle: BattleState, move: Pick<Move, 'type' | 'category'>): boolean {
  const at = flairOf(content).crowd.cheerAt;
  if (at.length === 0 || battle.kind !== 'trainer' || move.category === 'status') return false;
  const f = flairState(battle);
  if (f.crowdTypes.includes(move.type)) return false;
  f.crowdTypes.push(move.type);
  if (!at.includes(f.crowdTypes.length)) return false;
  f.cheers += 1;
  return true;
}

// ---------- S44 Environmental Interactables ----------

export type ArenaReaction = { kind: 'flood'; text: string } | { kind: 'scorch'; text: string };

/** What a landed hit of this type does to the arena (before damage bonuses for the next one). */
export function arenaReaction(content: Content, battle: BattleState, moveType: string): ArenaReaction | null {
  const env = flairOf(content).environment;
  if (env.floodTurns <= 0) return null;
  const f = flairState(battle);
  if (moveType === 'water' && f.floodUntil < battle.turn) {
    f.floodUntil = battle.turn + env.floodTurns;
    return { kind: 'flood', text: 'Water pools across the floor! Electric moves will spread through it.' };
  }
  if (moveType === 'fire' && battle.terrain?.id === 'grassy') {
    battle.terrain = null;
    return { kind: 'scorch', text: 'The fire sets the grass ablaze! The Grassy Terrain burns away.' };
  }
  return null;
}

/** Power multiplier for an Electric move while the floor is flooded (it drains the water). */
export function shockWater(content: Content, battle: BattleState, moveType: string): number {
  const env = flairOf(content).environment;
  const f = battle.flair;
  if (env.floodTurns <= 0 || moveType !== 'electric' || !f || f.floodUntil < battle.turn) return 1;
  f.floodUntil = -1;
  return 1 + env.shockBonus;
}

// ---------- S264 Boss Phase Scripts ----------

/** The boss's new move for a phase: its best same-type damaging move it could know at its level and doesn't, swapped for its weakest. */
export function phaseMoveSwap(content: Content, mon: PokemonInstance): { out: string; in: string } | null {
  if (!flairOf(content).phaseMoves || mon.moves.length === 0) return null;
  const species: Species = getSpecies(content, mon.speciesId);
  const power = (id: string) => content.moves.get(id)?.power ?? 0;
  const known = new Set(mon.moves.map((m) => m.id));
  const best = usableLearnset(content, species)
    .filter((e) => e.level <= mon.level && !known.has(e.move))
    .map((e) => content.moves.get(e.move)!)
    .filter((m) => m && m.category !== 'status' && (m.power ?? 0) > 0 && species.types.includes(m.type))
    .sort((a, b) => (b.power ?? 0) - (a.power ?? 0) || a.id.localeCompare(b.id))[0];
  if (!best) return null;
  const weakest = [...mon.moves].sort((a, b) => power(a.id) - power(b.id) || a.id.localeCompare(b.id))[0]!;
  if (power(weakest.id) >= (best.power ?? 0)) return null;
  const slot = mon.moves.findIndex((m) => m.id === weakest.id);
  mon.moves[slot] = { id: best.id, pp: best.pp };
  return { out: weakest.id, in: best.id };
}

// ---------- S265 Wild Behaviour Types ----------

/** The battle effect of a wild behaviour: stat stages for the foe, or a share of HP it starts without. */
export function wildEffect(content: Content, id: WildBehaviorId): { boost?: Partial<Record<Stat, number>>; hurt?: number; text: string } | null {
  if (!flairOf(content).wildEffects) return null;
  switch (id) {
    case 'territorial': return { boost: { atk: 1 }, text: 'It ambushes you! Its Attack rose.' };
    case 'guarding': return { boost: { def: 1 }, text: 'It braces to guard its spot! Its Defense rose.' };
    case 'timid': return { boost: { spe: 1 }, text: 'It is ready to bolt! Its Speed rose.' };
    case 'sick': return { hurt: 0.25, text: 'It is already worn down.' };
    default: return null;
  }
}

// ---------- S278 Adaptive Shop AI ----------

/** Price factor for an item: a discount when one of your party evolves with it. */
export function buildPriceFactor(content: Content, party: readonly Pick<PokemonInstance, 'speciesId'>[], itemId: string): number {
  const d = flairOf(content).adaptiveShop.discount;
  if (d <= 0 || content.items.get(itemId)?.effect.kind !== 'evolve') return 1;
  return fitsTeam(content, party, itemId) ? 1 - d : 1;
}

/** True when one of the party evolves with this item. */
export function fitsTeam(content: Content, party: readonly Pick<PokemonInstance, 'speciesId'>[], itemId: string): boolean {
  return party.some((p) => content.species.get(p.speciesId)?.evolutions.some((e) => e.item === itemId));
}

// ---------- S281 Sabotage Events ----------

/** A rival may filch one item from a stack of 2+ heals or balls on the way to a node. Returns the note, or null. Own seeded stream. */
export function sabotageStep(content: Content, run: RunState): string | null {
  const chance = flairOf(content).sabotage.chance;
  if (chance <= 0) return null;
  const step = run.stage ? `${run.regionIndex}:${run.stage.index}:${run.stage.visited.length}` : 'none';
  const rng = new Rng(hashSeed(`${run.seed}:sabotage:${step}`));
  if (!rng.chance(chance)) return null;
  const targets = Object.entries(run.inventory)
    .filter(([id, n]) => n >= 2 && ['healHp', 'cureStatus', 'catch'].includes(content.items.get(id)?.effect.kind ?? ''))
    .map(([id]) => id)
    .sort();
  if (targets.length === 0) return null;
  const id = targets[rng.int(0, targets.length - 1)]!;
  run.inventory[id] = run.inventory[id]! - 1;
  const who = 'Your rival';
  return `${who} bumps into you on the path and slips off. One ${content.items.get(id)?.name ?? id} is missing from your bag!`;
}
