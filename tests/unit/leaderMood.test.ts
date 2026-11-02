import { describe, expect, it } from 'vitest';
import { applyLeaderMood, leaderMood } from '../../src/core/story/leaderMood';
import type { TrainerPlan } from '../../src/core/encounters';

const plan = (): TrainerPlan => ({
  classId: 'gym-leader', name: 'Brock', leaderId: 'brock', ai: 0.5,
  members: [{ speciesId: 'geodude', level: 10 }, { speciesId: 'onix', level: 12 }, { speciesId: 'steelix', level: 15 }] as TrainerPlan['members'],
  levelInfo: [{ level: 10 }, { level: 12 }, { level: 15 }] as TrainerPlan['levelInfo'],
});
const mood = (order: 'keep' | 'ace-first' | 'swap-lead', levelLead = 0) => ({ id: 't', weight: 1, order, levelLead, note: '{name} test.' });

describe('Gym Leader moods (S126)', () => {
  it('is deterministic per run, leader and stage', () => {
    expect(leaderMood('s1', 'brock', '0:0')).toEqual(leaderMood('s1', 'brock', '0:0'));
  });
  it('ace-first moves the ace to the lead, with levelInfo in step', () => {
    const p = applyLeaderMood(plan(), mood('ace-first'));
    expect(p.members.map((m) => m.speciesId)).toEqual(['steelix', 'onix', 'geodude']);
    expect(p.levelInfo.map((l) => l.level)).toEqual([15, 12, 10]);
    expect(p.memoryNote).toBe('Brock test.');
  });
  it('swap-lead swaps the first two; a single Pokémon is left alone', () => {
    expect(applyLeaderMood(plan(), mood('swap-lead')).members[0]!.speciesId).toBe('onix');
    const one = { ...plan(), members: plan().members.slice(0, 1), levelInfo: plan().levelInfo.slice(0, 1) };
    expect(applyLeaderMood(one, mood('ace-first')).members).toHaveLength(1);
  });
  it('lead level boost and existing notes are kept', () => {
    const p = applyLeaderMood({ ...plan(), memoryNote: 'Hi.' }, mood('keep', 2));
    expect(p.members[0]!.level).toBe(12);
    expect(p.memoryNote).toBe('Hi. Brock test.');
  });
});
