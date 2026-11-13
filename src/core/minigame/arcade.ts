// Rocket Row Arcade (Kice's Arcade pick): an arcade stop lets the player choose one of three cabinets before the difficulty.
// The stop is rolled as any arcade game; choosing a cabinet swaps the stop's game. Choosing is a player action stored in the
// run (no randomness), allowed only before the first attempt at the stop.

import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { requireStage } from '../run';

/** The three cabinets on offer (the picked Pinball, Whack-a-Diglett and Claw Machine). */
export const ARCADE_CABINETS = ['pinball-bonus', 'arcade-whack-a-diglett', 'arcade-claw-machine'] as const;
/** Every game that is an arcade stop (the cabinets plus the earlier extra cabinets). */
export const ARCADE_GAMES: readonly string[] = [...ARCADE_CABINETS, 'arcade-ball-breaker', 'arcade-snowball-shooter', 'arcade-berry-stacker'];

export interface Cabinet {
  id: string;
  name: string;
  blurb: string;
  best: string;
}

function findArcadeStop(run: RunState, sideId: string) {
  const stage = requireStage(run);
  if (stage.current === null) return null;
  const node = stage.map.nodes.find((n) => n.id === stage.current);
  const side = node?.sides.find((s) => s.id === sideId && s.kind === 'minigame' && s.minigameId);
  return side && ARCADE_GAMES.includes(side.minigameId!) ? side : null;
}

/** True while this stop is an arcade stop that has not been played yet, so the cabinet can still be chosen. */
export function canChooseCabinet(run: RunState, sideId: string): boolean {
  return findArcadeStop(run, sideId) !== null && (run.minigames.attempts[sideId] ?? 0) === 0;
}

export function arcadeCabinets(content: Content, run: RunState): Cabinet[] {
  return ARCADE_CABINETS.flatMap((id) => {
    const def = content.minigames.games.find((g) => g.id === id);
    return def ? [{ id, name: def.name, blurb: def.blurb, best: run.minigames.best[id] ?? 'none' }] : [];
  });
}

/** Swaps the stop's game for the chosen cabinet. */
export function chooseCabinet(content: Content, current: RunState, sideId: string, cabinetId: string): RunState {
  if (!canChooseCabinet(current, sideId)) throw new Error('This stop has no cabinet to choose');
  if (!(ARCADE_CABINETS as readonly string[]).includes(cabinetId) || !content.minigames.games.some((g) => g.id === cabinetId)) throw new Error(`No cabinet "${cabinetId}"`);
  const run = structuredClone(current);
  findArcadeStop(run, sideId)!.minigameId = cabinetId;
  return run;
}
