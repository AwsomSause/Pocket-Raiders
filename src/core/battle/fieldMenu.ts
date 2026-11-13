// What the battle screen offers in a double or triple battle, worked out without any layout (Beta 0.6 T2 prep).
//
// The screen asks these helpers, so a triple battle needs only positions and art once its style is picked:
// - commandPlan: which of your spots needs a command this turn (and which are skipped or forced), left to right.
// - targetChoices: who a move can be aimed at from a spot (foes in reach, partners for ally moves), with the best by type marked.
// - shiftOptionProblem: whether the Shift command is offered for a spot (only edges of a triple battle, one Shift a turn).
//
// They follow the same rules the turn checks (resolveDoublesTurn), so anything offered is accepted. Pure: no Phaser, no RNG.

import type { Content, Move } from '../contentSchema';
import type { BattleState, PokemonInstance } from '../state';
import { getSpecies } from '../pokemon';
import { typeEffectiveness } from './damage';
import { ALLY_AIMED, monAt, spotsOf, volAt, type Spot } from './doubles';
import { forcedMoveId, type SlotCommand } from './engine';
import { canReach, lanesOn, shiftProblem } from './triples';

type View = { battle: BattleState; party: PokemonInstance[] };

/** One of your spots this turn: ask the player, use a forced move (two-turn moves, Thrash), or skip (empty, fainted, waiting for a refill, inside Dondozo). */
export type SpotPlan = { spot: Spot; kind: 'ask' } | { spot: Spot; kind: 'forced'; index: number } | { spot: Spot; kind: 'skip' };

/** Your spots, left to right, and what each needs this turn. */
export function commandPlan(view: View): SpotPlan[] {
  const d = view.battle.doubles;
  if (!d) return [];
  return spotsOf(view.battle).map((spot): SpotPlan => {
    const mon = monAt(view, 'player', spot);
    if (!mon || mon.hp <= 0 || d.refill.includes(spot) || d.commanding.includes(mon.uid)) return { spot, kind: 'skip' };
    const forced = forcedMoveId(volAt(view, 'player', spot) ?? undefined);
    const index = forced ? mon.moves.findIndex((m) => m.id === forced) : -1;
    return index >= 0 ? { spot, kind: 'forced', index } : { spot, kind: 'ask' };
  });
}

export interface TargetChoice {
  target: NonNullable<SlotCommand['target']>;
  mon: PokemonInstance;
  /** A partner (moves meant for an ally), not a foe. */
  ally: boolean;
  /** The foe this move hits hardest by type, when that is better than the others (the screen marks it). */
  best: boolean;
}

/**
 * Who a single-target `move` used from your `spot` can be aimed at: foes in reach (left to right), then partners for moves meant
 * for an ally. In doubles every foe is in reach; in triples the far edge isn't, except for long-range moves. Without `content`
 * no foe is marked best.
 */
export function targetChoices(view: View, content: Content | null, spot: Spot, move: Pick<Move, 'id' | 'type' | 'power'>): TargetChoice[] {
  const { battle } = view;
  const d = battle.doubles;
  if (!d) return [];
  const spots = spotsOf(battle);
  const size = spots.length;
  const user = { side: 'player' as const, spot };
  // The lane rule (Front) binds only while the foe in your own lane still stands.
  const laneBound = lanesOn(battle) && (monAt(view, 'enemy', spot)?.hp ?? 0) > 0;
  const foes: TargetChoice[] = [];
  for (const s of spots) {
    const mon = monAt(view, 'enemy', s);
    if (!mon || mon.hp <= 0 || d.commanding.includes(mon.uid)) continue;
    if (!canReach(size, user, { side: 'enemy', spot: s }, move, laneBound)) continue;
    foes.push({ target: { side: 'enemy', spot: s }, mon, ally: false, best: false });
  }
  // Smart-target arrow (ideas W1): the foe this move hits hardest by type, if that beats the others.
  if (content && move.power && foes.length > 1) {
    const eff = (mon: PokemonInstance) => typeEffectiveness(content.typeChart, move.type, getSpecies(content, mon.speciesId).types);
    const scores = foes.map((f) => eff(f.mon));
    const top = Math.max(...scores);
    if (top > Math.min(...scores)) foes[scores.indexOf(top)]!.best = true;
  }
  const allies: TargetChoice[] = [];
  if (ALLY_AIMED.has(move.id)) {
    for (const s of spots) {
      const mon = monAt(view, 'player', s);
      if (!mon || mon.hp <= 0 || s === spot) continue;
      if (!canReach(size, user, { side: 'player', spot: s }, move, laneBound)) continue;
      allies.push({ target: { side: 'player', spot: s }, mon, ally: true, best: false });
    }
  }
  return [...foes, ...allies];
}

/** Why the Pokémon in your `spot` can't be told to Shift, or null. `chosen` are the commands already given this turn. */
export function shiftOptionProblem(battle: Pick<BattleState, 'doubles'>, spot: Spot, chosen: readonly (SlotCommand | null)[] = []): string | null {
  const problem = shiftProblem(spotsOf(battle).length, spot);
  if (problem || !battle.doubles) return problem ?? 'Shifting is only possible in a triple battle';
  if (chosen.some((c, i) => i !== spot && c?.action.kind === 'shift')) return 'Only one Pokémon can shift to the centre';
  return null;
}
