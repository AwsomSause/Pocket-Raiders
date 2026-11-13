// Rocket Row Arcade: choosing a cabinet at an arcade stop.

import { describe, expect, it } from 'vitest';
import { arcadeCabinets, canChooseCabinet, chooseCabinet, ARCADE_CABINETS } from '../../src/core/minigame/arcade';
import { beginMinigame } from '../../src/core/minigame/flow';
import { content } from './helpers';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';

function stopRun(seed: string, gameId: string): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'mg', seed, archetypeId: 'red' }), 0));
  const node = run.stage!.map.nodes.find((n) => n.column === 1)!;
  node.sides = [{ id: 'mg-test', kind: 'minigame', minigameId: gameId, used: false }];
  run.stage!.current = node.id;
  return run;
}

describe('arcade cabinet choice', () => {
  it('lists the three picked cabinets and swaps the stop game', () => {
    const run = stopRun('arc-pick', 'arcade-ball-breaker');
    expect(canChooseCabinet(run, 'mg-test')).toBe(true);
    expect(arcadeCabinets(content, run).map((c) => c.id)).toEqual([...ARCADE_CABINETS]);
    const next = chooseCabinet(content, run, 'mg-test', 'arcade-claw-machine');
    expect(beginMinigame(content, next, 'mg-test', 0).minigame!.id).toBe('arcade-claw-machine');
    // The original run is untouched.
    expect(beginMinigame(content, run, 'mg-test', 0).minigame!.id).toBe('arcade-ball-breaker');
  });
  it('refuses a non-arcade stop, an unknown cabinet and a stop already played', () => {
    expect(canChooseCabinet(stopRun('arc-no', 'pokemon-memory'), 'mg-test')).toBe(false);
    const run = stopRun('arc-bad', 'pinball-bonus');
    expect(() => chooseCabinet(content, run, 'mg-test', 'pokemon-memory')).toThrow();
    const played = beginMinigame(content, run, 'mg-test', 0);
    expect(canChooseCabinet({ ...played, phase: 'map' } as never, 'mg-test')).toBe(false);
  });
});
