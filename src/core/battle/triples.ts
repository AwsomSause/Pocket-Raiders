// Triple battles: three Pokémon on each side (Beta 0.6, plan T1).
//
// A triple battle runs through the same turn code as a double battle
// (doubles.ts: resolveDoublesTurn / startDoubles), which reads the number of
// spots from the battle. This file holds what is new with three spots:
//
// - Where everyone stands. Spots are 0 left, 1 centre, 2 right as seen on the
//   screen, for both sides, so spot n of the player faces spot n of the foe.
// - Who can reach whom. A Pokémon reaches the foes in its own lane and the
//   lanes next to it, so the two edges can't hit the far edge with an ordinary
//   single-target move. Long-range moves (flying and pulse moves) reach anyone.
//   Allies next to each other are adjacent; the two edges are not.
// - Spread moves hit only adjacent Pokémon (still 0.75× when they hit more
//   than one, as in doubles).
// - Shift: an edge Pokémon trades places with the centre one; it uses the turn
//   and happens before any move, like a switch.
// - When each side has one Pokémon left and they stand on opposite edges, both
//   move to the centre so the battle can go on.
//
// Pure rules: no Phaser, no random numbers of its own.

import type { Move } from '../contentSchema';
import { freshStages, freshVolatile, type BattleState, type PokemonInstance } from '../state';
import type { Side } from './engine';

export type TripleSpot = 0 | 1 | 2;
export const TRIPLE_SPOTS: readonly TripleSpot[] = [0, 1, 2];

/**
 * Single-target moves that reach any Pokémon in a triple battle, not only adjacent ones
 * (the series' "any Pokémon" moves: flying moves and pulse moves).
 */
export const LONG_RANGE = new Set([
  'acrobatics', 'aerial-ace', 'aeroblast', 'air-slash', 'aura-sphere', 'bounce', 'brave-bird', 'chatter', 'dark-pulse',
  'dragon-pulse', 'drill-peck', 'dual-wingbeat', 'fly', 'flying-press', 'heal-pulse', 'hurricane', 'oblivion-wing', 'peck',
  'pluck', 'sky-attack', 'sky-drop', 'water-pulse', 'wing-attack',
]);

/** True when the move reaches any Pokémon on the field (only matters in a triple battle). */
export function isLongRange(move: Pick<Move, 'id'>): boolean {
  return LONG_RANGE.has(move.id);
}

/** Foe in spot `b` is next to (or facing) a Pokémon in spot `a`. In doubles every foe is. */
export function foesAdjacent(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1;
}

/** Allies in spots `a` and `b` stand next to each other (the two edges of a triple battle don't). */
export function alliesAdjacent(a: number, b: number): boolean {
  return Math.abs(a - b) === 1;
}

/**
 * Whether a single-target move from `user` can be aimed at `target` (spots and sides).
 * `size` is the number of spots per side (2 doubles, 3 triples); in doubles anything on the field can be aimed at.
 */
export function canReach(size: number, user: { side: Side; spot: number }, target: { side: Side; spot: number }, move: Pick<Move, 'id'>): boolean {
  if (user.side === target.side && user.spot === target.spot) return false;
  if (size < 3 || isLongRange(move)) return true;
  return user.side === target.side ? alliesAdjacent(user.spot, target.spot) : foesAdjacent(user.spot, target.spot);
}

/** The spots a spread move from `spot` reaches on the foe's side (and on the user's own side for "everyone" moves). */
export function spreadSpots(size: number, spot: number): { foes: number[]; allies: number[] } {
  const all = Array.from({ length: size }, (_, i) => i);
  return { foes: all.filter((s) => foesAdjacent(spot, s)), allies: all.filter((s) => s !== spot && (size < 3 || alliesAdjacent(spot, s))) };
}

/** Why the Pokémon in `spot` can't Shift, or null. Only edge Pokémon of a triple battle can. */
export function shiftProblem(size: number, spot: number): string | null {
  if (size < 3) return 'Shifting is only possible in a triple battle';
  if (spot === 1) return 'The Pokémon in the centre can\'t shift';
  return null;
}

/**
 * The centring rule: with one Pokémon left on each side, standing on opposite edges (out of each other's reach),
 * both move to the centre. Returns the spot each side moves from, or null when nobody needs to move.
 */
export function centringMoves(size: number, last: Record<Side, number | null>): Partial<Record<Side, number>> | null {
  if (size < 3 || last.player === null || last.enemy === null) return null;
  if (foesAdjacent(last.player, last.enemy)) return null;
  const out: Partial<Record<Side, number>> = {};
  if (last.player !== 1) out.player = last.player;
  if (last.enemy !== 1) out.enemy = last.enemy;
  return out;
}

const emptySlot = () => ({ index: -1, stages: freshStages(), vol: freshVolatile() });

/**
 * Turns a new battle into a triple battle: the lead takes the left spot and the next two healthy Pokémon
 * on each side take the centre and the right (a spot stays empty if there aren't enough).
 */
export function makeTriples(battle: BattleState, party: PokemonInstance[]): void {
  const next = (team: PokemonInstance[], lead: number): number[] => team.map((m, i) => ({ m, i })).filter(({ m, i }) => i !== lead && m.hp > 0).slice(0, 2).map(({ i }) => i);
  const mine = next(party, battle.activeIndex);
  const theirs = next(battle.enemyTeam, battle.enemyIndex);
  const row = (rest: number[]) => [emptySlot(), { ...emptySlot(), index: rest[0] ?? -1 }, { ...emptySlot(), index: rest[1] ?? -1 }];
  battle.doubles = {
    player: emptySlot(),
    enemy: emptySlot(),
    swapped: { player: false, enemy: false },
    refill: [],
    commanding: [],
    aims: {},
    trio: { at: { player: 0, enemy: 0 }, player: row(mine), enemy: row(theirs) },
  };
  for (const i of mine) if (!battle.participants.includes(party[i]!.uid)) battle.participants.push(party[i]!.uid);
}

/** True when both sides have three Pokémon able to fight. */
export function canBeTriples(party: PokemonInstance[], enemyTeam: PokemonInstance[]): boolean {
  return party.filter((m) => m.hp > 0).length >= 3 && enemyTeam.filter((m) => m.hp > 0).length >= 3;
}

/** True when the battle is a triple battle. */
export function isTriples(battle: Pick<BattleState, 'doubles'>): boolean {
  return Boolean(battle.doubles?.trio);
}

/** Spots per side: 1 (singles), 2 (doubles) or 3 (triples). */
export function spotCount(battle: Pick<BattleState, 'doubles'>): 1 | 2 | 3 {
  return battle.doubles ? (battle.doubles.trio ? 3 : 2) : 1;
}

/**
 * The party (or team) indexes of every Pokémon on one side's field, main fields first: one in singles, two in doubles, up to three
 * in triples. For run-level helpers that don't run a turn (companion support, story counters).
 */
export function fieldIndexes(battle: Pick<BattleState, 'doubles' | 'activeIndex' | 'enemyIndex'>, side: Side): number[] {
  const main = side === 'player' ? battle.activeIndex : battle.enemyIndex;
  const d = battle.doubles;
  const others = !d ? [] : d.trio ? d.trio[side].map((s) => s.index) : [d[side].index];
  return [main, ...others].filter((i) => i >= 0);
}

type SlotState = NonNullable<BattleState['doubles']>['player'];

/**
 * A triple battle's three spots on one side, left to right, with the main fields standing in for the focused spot
 * (index -1 = empty). For engine code outside the turn loop (ally abilities, field-wide abilities). Empty array if not triples.
 */
export function trioSpots(battle: Pick<BattleState, 'doubles' | 'activeIndex' | 'enemyIndex' | 'playerStages' | 'enemyStages' | 'playerVolatile' | 'enemyVolatile'>, side: Side): SlotState[] {
  const t = battle.doubles?.trio;
  if (!t) return [];
  const main: SlotState = side === 'player' ? { index: battle.activeIndex, stages: battle.playerStages, vol: battle.playerVolatile } : { index: battle.enemyIndex, stages: battle.enemyStages, vol: battle.enemyVolatile };
  return t[side].map((s, spot) => (spot === t.at[side] ? main : s));
}
