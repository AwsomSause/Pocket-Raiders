// PS-RESCUE guard fights (Beta 0.6 R9): the Door and Cage battles of Quiet Extraction and Loud Grab.
// Quiet: always at least one fight, at most two. A guard at the Door if that beat was not played well, and one at the Cage if that beat
// was not played well or no guard has fought yet (so clean play meets exactly one, at the Cage; poor choices meet two).
// Loud: a guard fight after every beat (a three-battle gauntlet), with the rival's first Pokémon fighting beside you when it has one.
// The Inside Job, the Deal and the Exchange have no fights. Losing a fight resolves the plan as a Fail (the party is patched up
// by the pseudo-stage rule and nobody's run ends). Nothing here rolls a gameplay stream: the foes are hashed from seed + hold + spot.

import { Rng, hashSeed } from '../rng';
import type { Content } from '../contentSchema';
import { EventBattleSchema } from '../contentSchema';
import { startEventBattle } from '../events';
import { featuredRival, rivalFightTeam } from '../rivals/living';
import type { RunState } from '../state';
import { BEATS, gruntSpecies, holdOf, rescueOf, siteOf, type PlanRun } from './rescue';

export type FightSpot = 'approach' | 'door' | 'cage';

/** Called right after a beat is answered: marks the guard fight that beat leads to, and returns its spot (or null for none). */
export function fightAfterAnswer(run: RunState): FightSpot | null {
  const pr = rescueOf(run).active;
  if (!pr) return null;
  if (pr.fightNow) return pr.fightNow;
  const idx = pr.beats.length - 1;
  const spot = BEATS[pr.plan]![idx] as FightSpot | undefined;
  const rating = pr.beats[idx];
  if (!spot || !rating) return null;
  const due = pr.plan === 'loud' ? true : pr.plan === 'quiet' ? (spot === 'door' ? rating !== 'good' : spot === 'cage' ? rating !== 'good' || pr.fights.length === 0 : false) : false;
  if (!due) return null;
  pr.fightNow = spot;
  return spot;
}

/** The fight waiting for the player, if a guard is in the way. */
export const pendingFight = (run: RunState): FightSpot | null => rescueOf(run).active?.fightNow ?? null;

/** Starts the waiting guard fight as a pseudo trainer battle (run.phase becomes 'battle'). */
export function startRescueFight(content: Content, run: RunState): FightSpot {
  const pr = rescueOf(run).active;
  const spot = pr?.fightNow;
  if (!pr || !spot) throw new Error('No guard fight is waiting');
  const h = holdOf(rescueOf(run), pr.holdId);
  const team = siteOf(h.teamId);
  const stage = run.stage;
  if (!stage) throw new Error('PS-RESCUE needs a stage');
  const node = stage.map.nodes.find((n) => n.id === stage.current) ?? stage.map.nodes[0]!;
  const species = gruntSpecies(h.teamId).filter((id) => content.species.has(id));
  const rival = featuredRival(run);
  const assist = pr.plan === 'loud' && rival ? rivalFightTeam(content, rival).find((id) => content.species.has(id)) : undefined;
  const size = spot === 'cage' ? 3 : 2;
  const b = EventBattleSchema.parse({ kind: 'trainer', name: `${team.name} guard`, size: assist ? Math.max(2, size) : size, species, levelBonus: 0, chain: 1, pseudo: true, ally: assist });
  const rng = new Rng(hashSeed(`${run.seed}::rescue-fight::${h.id}::${spot}::${pr.fights.length}`));
  startEventBattle(content, run, node, b, rng, { eventId: `rescue:${spot}`, choiceIndex: 0, sideId: 'rescue', success: true });
  return spot;
}

/** The battle ended (core/run.ts calls this for `rescue:` fights): a win opens the way, a loss wipes the plan. */
export function rescueFightEnded(run: RunState, won: boolean): PlanRun | null {
  const pr = rescueOf(run).active;
  if (!pr) return null;
  pr.fights.push(won ? 'won' : 'lost');
  pr.fightNow = null;
  if (!won) pr.wiped = true;
  return pr;
}
