// Greenneedle gn.29, the Psyduck Migration: what the walk leaves behind, applied once when the game ends (core/minigame/flow.ts settle),
// and the set-up when it starts. Kept apart from snake.ts so the minigame registry never loads the event rules.

import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import type { SnakeState } from './snake';

const setFlag = (run: RunState, key: string, n: number): void => {
  run.story.flags[`ev:${key}`] = n;
};

/** A Golduck in the party walks at the back and stops the tail from wandering. */
export function psyduckBegin(run: RunState, s: SnakeState): void {
  s.golduck = run.party.some((m) => m.speciesId === 'golduck' && m.hp > 0);
}

/** The rounds walked and the things knocked over become flags, and the lake opens beside the node (gn-29-lake). */
export function psyduckFinish(content: Content, run: RunState, s: SnakeState): string[] {
  setFlag(run, 'psyduck-rounds', s.rounds);
  setFlag(run, 'psyduck-knocked', s.knocked.length);
  setFlag(run, 'psyduck-cake', s.knocked.includes('a wedding cake') ? 1 : 0);
  setFlag(run, 'psyduck-mayor', s.knocked.includes('the mayor') ? 1 : 0);
  const here = run.stage?.map.nodes.find((n) => n.id === run.stage!.current);
  if (here && content.events.has('gn-29-lake')) here.sides.push({ id: `event-room-${here.sides.length + 1}-${here.id}`, kind: 'event', used: false, eventId: 'gn-29-lake' });
  const lines = [`Rounds walked: ${s.rounds} of 3.`];
  if (s.knocked.length > 0) lines.push(`Knocked over: ${s.knocked.join(', ')}.`);
  return lines;
}
