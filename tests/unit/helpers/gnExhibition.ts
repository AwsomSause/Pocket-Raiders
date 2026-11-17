// Test helper for gn.47, the Exhibition's watched match: plays the fight the way the battle screen does (the moments when they are
// due, otherwise the next turn by the exhibition AI). `rig` holds one side at 1 HP so the test decides who wins, not the dice.
import { EX_MOMENT_CHOICES, exMomentAnswer, exMomentDue, exWatchAction } from '../../../src/core/greenneedle/exhibition';
import { takeTurn, type TurnResult } from '../../../src/core/run';
import type { RunState } from '../../../src/core/state';
import { content } from '../helpers';

export interface Watched { run: RunState; lines: string[]; said: string[][]; turns: number; calls: string[] }

/** One turn of the watched match, as the screen plays it. */
export function watchTurn(run: RunState): TurnResult {
  let last: unknown;
  for (const action of exWatchAction(content, run)) {
    try {
      return takeTurn(content, run, action, 'normal');
    } catch (err) {
      last = err;
    }
  }
  throw last instanceof Error ? last : new Error('no action for the watched match');
}

/** Watches the match to its end. `moments`: the three answers by label ("Cheer.", "Watch closely.", "Look at the crowd."). */
export function watchMatch(start: RunState, moments: readonly string[], rig?: 'a' | 'b'): Watched {
  let run = structuredClone(start);
  const said: string[][] = [];
  const calls: string[] = [];
  let turns = 0;
  for (let guard = 0; guard < 2000 && run.battle; guard += 1) {
    const due = exMomentDue(run);
    if (due) {
      const key = EX_MOMENT_CHOICES.find((c) => c.label === moments[due - 1])?.key ?? 'cheer';
      said.push(exMomentAnswer(content, run, key));
      continue;
    }
    if (rig) for (const mon of rig === 'a' ? run.battle.enemyTeam : run.party) if (mon.hp > 0) mon.hp = 1;
    const result = watchTurn(run);
    turns += 1;
    for (const e of result.events) if (e.type === 'spectacle' && typeof e.text === 'string' && e.text.startsWith('Commentary:')) calls.push(e.text);
    run = result.run;
    if (result.spectated) return { run, lines: result.spectated.lines, said, turns, calls };
  }
  throw new Error('the watched match never ended');
}
