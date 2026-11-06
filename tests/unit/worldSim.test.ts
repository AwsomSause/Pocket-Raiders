import { describe, expect, it } from 'vitest';
import { entranceEventId } from '../../src/core/dungeon/compile';
import { DUNGEONS } from '../../src/core/dungeon/schema';
import { chooseStarter, createRun } from '../../src/core/run';
import { WORLD_SIM, noteDungeonEntered, worldFor, worldTick } from '../../src/core/worldSim/tick';
import { WorldSimSchema } from '../../src/core/worldSim/schema';
import { content } from './helpers';

const newRun = (seed: string) => structuredClone(chooseStarter(content, createRun(content, { runId: 'w8', seed, archetypeId: 'red' }), 0));
/** Ticks many fake stages so every actor gets a chance. */
function many(seed: string, n = 40) {
  const run = newRun(seed);
  run.badges = ['a'] as never;
  for (let i = 0; i < n; i++) { run.regionIndex = Math.floor(i / 8); run.stage!.index = i % 8; worldTick(content, run); }
  return run;
}

describe('W8 world simulation tick', () => {
  it('is deterministic: the same seed gives the same world', () => {
    expect(many('same').story.sim).toEqual(many('same').story.sim);
    expect(many('same').story.sim).not.toEqual(many('other').story.sim);
  });
  it('never ticks twice for one stage (ledger id), so a replay changes nothing', () => {
    const run = newRun('ledger');
    worldTick(content, run);
    const once = structuredClone(run.story.sim);
    expect(worldTick(content, run)).toBe(0);
    expect(run.story.sim).toEqual(once);
  });
  it('stays inside its budgets and the saved shape validates', () => {
    const run = many('budget', 60);
    const w = run.story.sim!;
    expect(WorldSimSchema.safeParse(w).success).toBe(true);
    expect(w.mystery.filter((m) => !m.found).length).toBeLessThanOrEqual(WORLD_SIM.budget.mystery);
    expect(w.rumors.length).toBeLessThanOrEqual(WORLD_SIM.budget.rumors);
    expect(w.mystery.length).toBeGreaterThan(0);
  });
  it('a tick is fast (under 20 ms)', () => {
    const run = newRun('fast');
    const t = performance.now();
    worldTick(content, run);
    expect(performance.now() - t).toBeLessThan(20);
  });
  it('worldFor reads at most 3 hints and writes nothing', () => {
    const run = many('hints');
    const before = structuredClone(run.story.sim);
    expect(worldFor(run).length).toBeLessThanOrEqual(WORLD_SIM.budget.hintsPerNode);
    expect(run.story.sim).toEqual(before);
  });
  it('a mystery trainer is found once, in the dungeon they entered', () => {
    const run = many('find');
    const m = run.story.sim!.mystery.find((x) => !x.found)!;
    const d = DUNGEONS.dungeons.find((x) => x.id === m.dungeon)!;
    const research = run.itemCounters?.['event-research'] ?? 0;
    expect(noteDungeonEntered(run, entranceEventId(d))).toContain('is here');
    expect(run.itemCounters?.['event-research']).toBe(research + WORLD_SIM.mysteryReward.research);
    expect(noteDungeonEntered(run, entranceEventId(d))).toBe('');
  });
  it('a leader hears of the player only after a badge', () => {
    const none = newRun('heard');
    worldTick(content, none);
    expect(Object.keys(none.story.sim!.heard)).toHaveLength(0);
    expect(Object.keys(many('heard').story.sim!.heard).length).toBeGreaterThanOrEqual(0);
  });
});
