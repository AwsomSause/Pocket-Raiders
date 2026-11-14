// Beta 0.7 E9 (workstream 10 follow-up): Galar's world-state track, the Dynamax steps of "The Forecast".
//  - Step 2 Tremors: once per stage a wild Pokémon Dynamaxes by itself for one turn, with no Power Spot. It is the Overcharged
//    line (variantLines.ts) put on that wild foe: it fires on its second turn out and pays on the next, no random numbers.
//  - Step 3 Red Cloud: that Dynamax lasts one extra turn (flag `long`, read in battle/transform.ts).
// Never raises a level or changes a team; a run without the world tracks is untouched.

import type { Content } from '../contentSchema';
import { currentRegion } from '../regions';
import type { RunState } from '../state';
import { assignVariant } from './variantLines';
import { trackStep } from './trackRun';

export const TREMOR_MIN_STEP = 2;
export const RED_CLOUD_STEP = 3;

/** The key of the stage the player is in, for "once per stage". */
const stageKey = (run: RunState): string => `${run.regionIndex}:${run.stage?.index ?? 0}`;

/** Whether the next wild fight of this stage is the one that trembles. Pure: reads the run only. */
export function tremorDue(content: Content, run: RunState): boolean {
  if (!run.expansion?.tracks || !run.stage || run.stage.kind !== 'stage') return false;
  if (currentRegion(content, run).id !== 'galar') return false;
  return trackStep(run, 'galar') >= TREMOR_MIN_STEP && !run.expansion.tremors?.includes(stageKey(run));
}

/** A wild battle has just been built: if this stage's tremor is due, the wild foe gets the Overcharged line. Returns true when it did. */
export function applyTremor(content: Content, run: RunState): boolean {
  const battle = run.battle;
  const foe = battle?.enemyTeam[0];
  if (!battle || battle.kind !== 'wild' || !foe || !tremorDue(content, run)) return false;
  assignVariant(battle.extra.variants, foe.uid, 'overcharged');
  if (trackStep(run, 'galar') >= RED_CLOUD_STEP) battle.extra.variants[foe.uid]!.flags.long = 1;
  run.expansion = { ...run.expansion, tremors: [...(run.expansion?.tremors ?? []), stageKey(run)].slice(-24) };
  return true;
}
