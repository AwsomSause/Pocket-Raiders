// Greenneedle gn.new.14, the Arcade Cabinet: what the three games leave behind, applied once when the cabinet's game ends
// (core/minigame/flow.ts settle) or is left half-way. Kept apart from arcade.ts so the minigame registry never loads event rules.

import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { ARCADE_GAMES, ARCADE_WALKED, type ArcadeState } from './arcade';

/** The room where the bird steps out of the screen. */
export const ARCADE_CLEAR_ROOM = 'gn-new-14-clear';

const setFlag = (run: RunState, key: string, n: number): void => {
  run.story.flags[`ev:${key}`] = n;
};

/** All three cleared: the room where it steps out opens beside the node. Anything less: the player walked away from the glass. */
export function arcadeFinish(content: Content, run: RunState, s: ArcadeState): string[] {
  setFlag(run, 'arcade-cleared-games', s.cleared);
  setFlag(run, 'arcade-score', s.score);
  if (s.cleared < ARCADE_GAMES.length) {
    setFlag(run, 'arcade-walked', 1);
    return [`Games cleared: ${s.cleared} of ${ARCADE_GAMES.length}.`, ARCADE_WALKED];
  }
  const here = run.stage?.map.nodes.find((n) => n.id === run.stage!.current);
  if (here && content.events.has(ARCADE_CLEAR_ROOM)) here.sides.push({ id: `event-room-${here.sides.length + 1}-${here.id}`, kind: 'event', used: false, eventId: ARCADE_CLEAR_ROOM });
  return ['All three games cleared.', 'The last square falls. The screen goes white, and then, for the first time in years, it goes quiet. Something on the other side of the glass takes a step toward you.'];
}

/** Leaving with a game still running is walking away from the glass. */
export function arcadeLeave(run: RunState, s: ArcadeState): void {
  setFlag(run, 'arcade-cleared-games', s.cleared);
  setFlag(run, 'arcade-walked', 1);
}
