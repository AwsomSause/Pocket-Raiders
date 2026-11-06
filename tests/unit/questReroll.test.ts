import { describe, expect, it } from 'vitest';
import { questRerollCost, rerollRunQuest, runQuestOf } from '../../src/core/quests';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const fresh = (seed = 'reroll') => chooseStarter(content, createRun(content, { runId: 'r', seed, archetypeId: 'red' }), 0);

describe('Reroll Points (S322)', () => {
  it('swaps the quest, charges the cost, and the cost rises', () => {
    const run = fresh();
    run.money = 1000;
    const before = runQuestOf(content, run)!.id;
    const r = rerollRunQuest(content, run);
    expect(r.ok).toBe(true);
    expect(runQuestOf(content, run)!.id).not.toBe(before);
    expect(run.money).toBe(900);
    expect(questRerollCost(run)).toBe(200);
  });
  it('is the same for the same seed and does nothing when broke', () => {
    const a = fresh();
    const b = fresh();
    a.money = 500;
    b.money = 500;
    rerollRunQuest(content, a);
    rerollRunQuest(content, b);
    expect(a.runQuest).toBe(b.runQuest);
    const poor = fresh();
    poor.money = 50;
    const q = poor.runQuest;
    expect(rerollRunQuest(content, poor).ok).toBe(false);
    expect(poor.runQuest).toBe(q);
    expect(poor.money).toBe(50);
  });
});
