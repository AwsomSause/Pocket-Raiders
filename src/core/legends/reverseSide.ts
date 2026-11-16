// Catalog Overhaul Pack (legends, batch 5 row B): The Renegade's blessing, The Reverse Side (expanded_notes/LEGENDARY_BLESSINGS.md
// "The Renegade — Giratina"). Once per stage, step out of any battle that is not a boss's; the node opens again "from the other side",
// and what waits there is different: the ledger's rule for the Giratina pseudo-stages ("with The Renegade blessing they are the Reverse
// Side"). So the node gets the gate of Distortion Incident, then Distortion World the next time (the gate still offers Leave: rule P2).
// Pure rules, no RNG: which world opens alternates by a count. Pseudo-stage caps (P3) still hold; past them the step-out alone happens.
import { runBlessing } from '../blessings';
import { isBossClass } from '../trainerPerks';
import { PSEUDO } from '../dungeon/pseudo';
import type { RunState } from '../state';

/** Run flags (same run only): the stage the Reverse Side was last used in (`region * 100 + stage + 1`), and how often it opened a world. */
export const REVERSE_USED = 'ev:reverse-side-stage';
export const REVERSE_WORLDS = 'ev:reverse-side-worlds';
export const REVERSE_GATES = ['ps-distortion-incident-gate', 'ps-distortion-world-gate'] as const;

const stageKey = (run: Pick<RunState, 'regionIndex' | 'stage'>): number => run.regionIndex * 100 + (run.stage?.index ?? 0) + 1;

/** Why the Reverse Side can't be used in this battle right now, or null when it can. */
export function reverseSideProblem(run: RunState): string | null {
  const b = run.battle;
  if (run.phase !== 'battle' || !b) return 'Not in a battle.';
  if (runBlessing(run)?.effect.kind !== 'reverseSide') return 'Only The Renegade\'s blessing opens the Reverse Side.';
  if (Number(run.story.flags[REVERSE_USED] ?? 0) === stageKey(run)) return 'Once per stage.';
  if (b.outcome) return 'The battle is already over.';
  // A boss's battle, and fights whose result a story is waiting on (event battles, rivals, raids, totems, the finale), stay where they are.
  if (b.trainer && isBossClass(b.trainer.classId)) return 'Not in a boss\'s battle.';
  if (run.stage?.kind === 'league') return 'Not in a boss\'s battle.';
  if (b.event || b.rival || b.raid || b.totem || b.narrative || b.spectate || b.stepIn || b.finaleAssist) return 'This fight has to be finished.';
  return null;
}

/** Whether a world may open here: not already inside a pseudo-stage, not a blocked campaign, and inside the 1-per-region / 2-per-run caps. */
function worldMayOpen(run: RunState): boolean {
  if (!run.stage || run.stage.pseudo || PSEUDO.rules.blockedCampaigns.includes(run.campaignId)) return false;
  const counters = run.itemCounters ?? {};
  const inRun = Object.entries(counters).filter(([k]) => k.startsWith('pseudo-seen:')).reduce((sum, [, n]) => sum + n, 0);
  return (counters[`pseudo-seen:${run.regionIndex}`] ?? 0) < PSEUDO.rules.perRegion && inRun < PSEUDO.rules.perRun;
}

/**
 * Marks the stage's use and picks the gate the node opens on its other side (or null: caps reached, or inside a pseudo-stage already).
 * Counts the world toward the pseudo-stage caps. Mutates `run`; the caller ends the battle and places the gate.
 */
export function useReverseSide(run: RunState): string | null {
  run.story.flags[REVERSE_USED] = stageKey(run);
  if (!worldMayOpen(run)) return null;
  const n = Number(run.story.flags[REVERSE_WORLDS] ?? 0);
  run.story.flags[REVERSE_WORLDS] = n + 1;
  const key = `pseudo-seen:${run.regionIndex}`;
  run.itemCounters = { ...run.itemCounters, [key]: (run.itemCounters?.[key] ?? 0) + 1 };
  return REVERSE_GATES[n % REVERSE_GATES.length]!;
}
