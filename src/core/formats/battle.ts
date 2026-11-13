// Launches one ordinary trainer battle for a wide format. The format keeps its own state; the battle is a normal event
// fight tagged `format:<id>`, so the existing battle screen runs it and `run.ts` tells the format how it ended
// (`battleEnded`). A lost format fight is a story loss: the party is healed and the run goes on.

import type { Content, EventBattle } from '../contentSchema';
import { EventBattleSchema } from '../contentSchema';
import { startEventBattle } from '../events';
import { hashSeed, Rng } from '../rng';
import type { RunState } from '../state';
import type { FormatId } from './types';

export type FormatBattleSpec = Pick<Extract<EventBattle, { kind: 'trainer' }>, 'name' | 'size' | 'rule'> &
  Partial<Pick<Extract<EventBattle, { kind: 'trainer' }>, 'classId' | 'types' | 'species' | 'levelBonus' | 'weather' | 'terrain'>> & {
    /** Which part of the format this fight is (an anchor id, a lane...). Part of the battle's seed. */
    key: string;
  };

/** Starts the battle. False when the run has no stage, is already in a battle, or has nobody standing (nothing is changed then). */
export function launchFormatBattle(content: Content, run: RunState, id: FormatId, spec: FormatBattleSpec): boolean {
  const stage = run.stage;
  // The node only sets the foe's level: the current stop, or (before the first stop) the first node.
  const node = stage?.map.nodes.find((n) => n.id === stage.current) ?? stage?.map.nodes[0];
  if (!stage || !node || run.battle || !run.party.some((p) => p.hp > 0)) return false;
  const { key, ...rest } = spec;
  const b = EventBattleSchema.parse({ kind: 'trainer', ...rest });
  const rng = new Rng(hashSeed(`${run.seed}::format-battle::${id}::${key}::${run.encountersCompleted}`));
  startEventBattle(content, run, node, b, rng, { eventId: `format:${id}`, choiceIndex: 0, sideId: key, success: false });
  return true;
}
