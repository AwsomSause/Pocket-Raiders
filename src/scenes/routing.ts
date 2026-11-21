import { parkWaiting } from '../core/minigame/flow';
import type { RunState } from '../core/state';
import { DOMINION_MODE_ID } from '../core/dominion/session';

/** Which screen shows a run in its current phase. */
export function sceneForRun(run: RunState): string {
  switch (run.phase) {
    case 'starter':
      return 'StarterSelect';
    case 'map':
      // DOMINION (Evil Mode rework): the whole run is played on its own screen (setup first, while there's no block).
      if (run.rules.modeId === DOMINION_MODE_ID) return 'Dominion';
      // gn.18: an event inside Safari Land has closed; the visit picks up where it stepped out.
      return parkWaiting(run) ? 'Minigame' : 'Map';
    case 'shop':
      return 'Shop';
    case 'battle':
      return 'Battle';
    case 'decision':
      return 'Decision';
    case 'reward':
      return 'Reward';
    case 'expedition':
      return 'Expedition';
    case 'minigame':
      return 'Minigame';
    case 'over':
      return 'GameOver';
  }
}
