import { parkWaiting } from '../core/minigame/flow';
import type { RunState } from '../core/state';
import { EVIL_MODE_ID } from '../core/evilMode/session';

/** Which screen shows a run in its current phase. */
export function sceneForRun(run: RunState): string {
  switch (run.phase) {
    case 'starter':
      return 'StarterSelect';
    case 'map':
      // Evil Mode: the run's day is played on its own screen (founding first, while the team has no block).
      if (run.rules.modeId === EVIL_MODE_ID) return 'Evil';
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
