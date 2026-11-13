// Map glue for wide formats: is a format waiting for the player? The Extended Cut director (E5) starts formats with
// `startFormat`; the map shows the plain format screen whenever one is running at a quiet moment.

import type { RunState } from '../state';
import { currentFormat } from './store';

export function pendingFormat(run: RunState): boolean {
  return run.phase === 'map' && currentFormat(run) !== null;
}

/** Which screen shows the running format: the Siege Map has its own picked screen, the rest use the plain one. */
export function sceneForFormat(run: RunState): 'Siege' | 'Format' {
  return currentFormat(run)?.id === 'siege' ? 'Siege' : 'Format';
}
