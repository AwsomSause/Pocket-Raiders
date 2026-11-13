// Starts and ends the tier-5 rival AI's bookkeeping around one battle (Beta 0.6 R4): names the win condition from the
// rival's team, snapshots the scouting ledger onto the battle, and writes what was seen back afterwards.

import type { Content } from '../contentSchema';
import { abilityOf, calcStats } from '../pokemon';
import type { RunState } from '../state';
import { overhaulOf, pityFor } from './overhaul';
import { brainFor, chooseWinCondition, scout } from './tier5';

const WEATHER_ABILITIES = new Set(['drought', 'drizzle', 'sand-stream', 'snow-warning', 'orichalcum-pulse', 'desolate-land', 'primordial-sea', 'delta-stream']);

/** Sets run.battle.rivalBrain for a registered rival (tier 5). Does nothing for an unregistered rival or under pity (tier 3). */
export function beginRivalBrain(content: Content, run: RunState, rivalId: string): void {
  const battle = run.battle;
  const rec = overhaulOf(run, rivalId);
  if (!battle || !rec) return;
  const team = battle.enemyTeam.map((m) => {
    const st = calcStats(content, m);
    return { weatherSetter: WEATHER_ABILITIES.has(abilityOf(content, m) ?? ''), bulky: st.hp + st.def + st.spd > st.atk + st.spa + st.spe + st.hp * 0.2 };
  });
  const brain = brainFor(rec, rivalId, run.seed, chooseWinCondition(team), pityFor(run, rivalId).aiTier);
  if (brain) battle.rivalBrain = brain;
}

/** After the battle: the rival remembers the moves, species and switching it watched. */
export function endRivalBrain(run: RunState, rivalId: string): void {
  const battle = run.battle;
  const rec = overhaulOf(run, rivalId);
  if (!battle || !rec) return;
  scout(rec, {
    moves: Object.keys(battle.playerMovesSeen ?? {}),
    species: run.party.map((m) => m.speciesId),
    turns: Math.max(0, battle.turn - 1),
    switches: battle.playerSwitches ?? 0,
  });
}
