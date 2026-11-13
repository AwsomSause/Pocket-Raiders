// Evolution (director decision D15 and GAME_DESIGN.md §5c). Level evolutions
// happen after battles and level-up rewards; every other method (stones,
// trades, friendship, ...) is an item used from the Bag. Friendship
// evolutions also happen on their own once friendship is high enough.

import { genderOf } from './gender';
import type { Content, Evolution } from './contentSchema';
import { blocksEvolution } from './battle/held';
import { stoneRouteTargets } from './conditionEvolution';
import { friendshipReady } from './friendship';
import { calcStats, createPokemon, getSpecies, isUsableMove, maxHp } from './pokemon';
import type { PokemonInstance, RunState } from './state';

/** A stable number from a Pokémon's id, so a branching evolution always goes the same way for that Pokémon. */
function uidHash(uid: string): number {
  let h = 2166136261;
  for (let i = 0; i < uid.length; i++) h = Math.imul(h ^ uid.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Narrows the branches that apply right now: a branch for the current region
 * wins (Alolan Raichu in Alola); otherwise branches without a region; then
 * Tyrogue's Attack/Defense condition.
 */
export function applicableBranches(content: Content, mon: PokemonInstance, branches: Evolution[], regionId?: string): Evolution[] {
  const local = branches.filter((e) => e.region && e.region === regionId);
  let list = local.length > 0 ? local : branches.filter((e) => !e.region);
  if (list.some((e) => e.condition)) {
    const { atk, def } = calcStats(content, mon);
    const holds = (c: Evolution['condition']) => (c === 'atkGtDef' ? atk > def : c === 'atkLtDef' ? atk < def : c === 'atkEqDef' ? atk === def : true);
    list = list.filter((e) => holds(e.condition));
  }
  // Gender-bound branches (Gallade, Froslass, Mothim, Meowstic's forms ...).
  if (list.some((e) => e.gender)) {
    const gender = genderOf(content, mon);
    list = list.filter((e) => !e.gender || e.gender === gender);
  }
  return list;
}

/** Held-item evolution path: holding the evolution item from the set level on is enough (the item is used up on evolving). */
function heldReady(content: Content, mon: PokemonInstance, e: Evolution): boolean {
  const cfg = content.balance.heldEvolution;
  return cfg.enabled && e.item !== undefined && e.item !== content.balance.friendship.evolutionItem && mon.level >= cfg.level && (mon.held?.[e.item] ?? 0) > 0;
}

/**
 * The species this Pokémon would evolve into on its own right now (by level,
 * or by friendship once it is high enough), if any.
 * Fainted Pokémon don't evolve. When several branches apply (Wurmple, Burmy,
 * Rockruff, ...) one is picked from the Pokémon's id, so it is always the same.
 */
export function evolutionTarget(content: Content, mon: PokemonInstance, regionId?: string, levelOffset = 0, bondReady = false): string | null {
  if (mon.hp <= 0 || mon.care?.holdEvolve) return null;
  const species = getSpecies(content, mon.speciesId);
  // A devoted bond (Bond Engine) can stand in for the last part of the friendship climb.
  const byFriendship = friendshipReady(content, mon) || bondReady;
  const friendshipItem = content.balance.friendship.evolutionItem;
  const ready = species.evolutions.filter((e) => (e.level !== undefined && mon.level >= e.level + levelOffset) || (byFriendship && e.item === friendshipItem) || heldReady(content, mon, e));
  const branches = applicableBranches(content, mon, ready, regionId).filter((b) => !(mon.evoBlock ?? []).includes(b.to));
  if (branches.length === 0) return null;
  return branches[uidHash(mon.uid) % branches.length]!.to;
}

/** The species an evolution item would turn this Pokémon into (several when the player can choose, e.g. Eevee). */
export function itemEvolutionTargets(content: Content, mon: PokemonInstance, itemId: string, regionId?: string): string[] {
  const species = getSpecies(content, mon.speciesId);
  const matching = species.evolutions.filter((e) => e.item === itemId);
  const direct = applicableBranches(content, mon, matching, regionId).map((e) => e.to);
  // A stone also stands in for a time-of-day or weather route.
  return [...new Set([...direct, ...stoneRouteTargets(content, mon, itemId)])];
}

export interface EvolutionResult {
  from: string;
  to: string;
  /** Moves the new form learns at its current level. */
  learnedMoves: string[];
  /** Moves it wanted to learn but already knows four. */
  wantsToLearn: string[];
}

/**
 * Evolves the Pokémon in place. Keeps its level, XP, moves, status and damage
 * taken (max HP gained is added to current HP). Then teaches any moves the new
 * species learns at exactly its current level.
 */
export function evolve(content: Content, mon: PokemonInstance, to: string): EvolutionResult {
  const from = mon.speciesId;
  const target = getSpecies(content, to);
  const oldMax = maxHp(content, mon);
  mon.speciesId = to;
  mon.hp = Math.min(maxHp(content, mon), mon.hp + (maxHp(content, mon) - oldMax));
  const learnedMoves: string[] = [];
  const wantsToLearn: string[] = [];
  for (const entry of target.learnset.filter((e) => e.level === mon.level && isUsableMove(content, e.move))) {
    if (mon.moves.some((m) => m.id === entry.move)) continue;
    if (mon.moves.length < 4) {
      mon.moves.push({ id: entry.move, pp: content.moves.get(entry.move)!.pp });
      learnedMoves.push(entry.move);
    } else {
      wantsToLearn.push(entry.move);
    }
  }
  return { from, to, learnedMoves, wantsToLearn };
}

/** Repeats level and friendship evolution while possible (e.g. a Rare Candy past two thresholds). */
export function evolveFully(content: Content, mon: PokemonInstance, regionId?: string, levelOffset = 0, bondReady = false): EvolutionResult[] {
  const results: EvolutionResult[] = [];
  // An Everstone stops evolution.
  if (blocksEvolution(content, mon)) return results;
  for (let guard = 0; guard < 3; guard++) {
    const to = evolutionTarget(content, mon, regionId, levelOffset, bondReady);
    if (!to) break;
    // Evolving through a held item uses that item up (a level or friendship evolution keeps it).
    const heldItem = getSpecies(content, mon.speciesId).evolutions.find((e) => e.to === to && heldReady(content, mon, e) && !(e.level !== undefined && mon.level >= e.level + levelOffset))?.item;
    results.push(evolve(content, mon, to));
    if (heldItem && mon.held) {
      const left = (mon.held[heldItem] ?? 0) - 1;
      if (left > 0) mon.held[heldItem] = left;
      else delete mon.held[heldItem];
    }
  }
  return results;
}

/**
 * A second Pokémon an evolution also gives (Nincada to Ninjask leaves a Shedinja behind), when the
 * player has the item it needs (a Poké Ball, used up). Same level and moves as the evolved Pokémon,
 * as in the main games. Its ability comes from the run seed and its uid, so no gameplay RNG is used.
 * The caller offers it to the player as a "caught" decision (join, box or release).
 */
export function evolutionGift(content: Content, run: RunState, mon: PokemonInstance, evo: Pick<EvolutionResult, 'from' | 'to'>): PokemonInstance | null {
  const gives = getSpecies(content, evo.from).evolutions.find((e) => e.to === evo.to)?.gives;
  const have = run.inventory[gives?.needsItem ?? ''] ?? 0;
  if (!gives || have <= 0) return null;
  if (have === 1) delete run.inventory[gives.needsItem];
  else run.inventory[gives.needsItem] = have - 1;
  const uid = `p${run.nextUid}`;
  run.nextUid += 1;
  const gift = createPokemon(content, gives.species, mon.level, uid, `${run.seed}:${uid}`);
  gift.moves = mon.moves.map((m) => ({ id: m.id, pp: content.moves.get(m.id)?.pp ?? m.pp }));
  return gift;
}
