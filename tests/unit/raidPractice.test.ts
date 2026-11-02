// S400 Boss Training Mode: no cost, no rewards, the den stays, the party is restored.
import { describe, expect, it } from 'vitest';
import { chooseStarter, createRun, enterRaid, raidPreview, takeTurn } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

function mapRun(seed: string, raidId = 'sleeping-snorlax'): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'rd', seed, archetypeId: 'red' }), 0));
  const node = run.stage!.map.nodes.find((n) => n.column === 1)!;
  node.sides.push({ id: 'raid-test', kind: 'raid', raidId, used: false });
  run.stage!.current = node.id;
  return run;
}

describe('raid practice', () => {
  it('costs nothing, leaves the den unused, and a win pays nothing', () => {
    const start = mapRun('pr-1');
    const before = structuredClone(start.party);
    const run = enterRaid(content, start, 'raid-test', 'practice');
    expect(run.money).toBe(start.money);
    expect(run.raids.entered).toBe(start.raids.entered);
    expect(run.stage!.map.nodes.flatMap((n) => n.sides).find((s) => s.id === 'raid-test')!.used).toBe(false);
    run.battle!.enemyTeam[0]!.hp = 1;
    run.battle!.raid!.pendingShields = [];
    run.party[0]!.moves = [{ id: 'tackle', pp: 35 }];
    run.party[0]!.level = 60;
    const res = takeTurn(content, run, { kind: 'move', index: 0 });
    expect(res.run.phase).toBe('map');
    expect(res.run.battle).toBeNull();
    expect(res.run.money).toBe(start.money);
    expect(res.run.raids.won).toBe(0);
    expect(res.run.party).toEqual(before);
  });
  it('a loss changes nothing and the den can still be fought for real', () => {
    const start = mapRun('pr-2');
    const run = enterRaid(content, start, 'raid-test', 'practice');
    run.battle!.raid!.timerLeft = 1;
    run.party[0]!.moves = [{ id: 'growl', pp: 40 }];
    const res = takeTurn(content, run, { kind: 'move', index: 0 });
    expect(res.raidFailed).toBe(true);
    expect(res.run.raids.lost).toBe(0);
    expect(res.run.raids.escaped).toEqual([]);
    expect(enterRaid(content, res.run, 'raid-test').phase).toBe('battle');
  });
  it('story raids have no practice', () => {
    const grand = content.raids.raids.find((r) => r.grand)!;
    const run = mapRun('pr-3', grand.id);
    expect(raidPreview(content, run, 'raid-test').noPractice).toBe(true);
    expect(() => enterRaid(content, run, 'raid-test', 'practice')).toThrow();
  });
});
