// Growth paths batch 9: Fast Learner and Dojo Student, read from the per-move use counts a run keeps.
import { describe, expect, it } from 'vitest';
import { DEFAULT_GROWTH_CONFIG as CFG, assignGrowthPaths, growthAccuracyMultiplier, masteriesOf, masteryCredit, pathFor, topFightingMove } from '../../src/core/overhaul/growth';
import { recordMoveMastery } from '../../src/core/moveMastery';
import { chooseStarter, createRun } from '../../src/core/run';
import { STANDARD_CHOICE } from '../../src/core/rules';
import type { Profile } from '../../src/core/state';
import { content } from './helpers';

const fighting = (id: string) => id === 'karate-chop' || id === 'low-kick';
const hist = (uid: string, moves: Record<string, number>) => ({ uid, knockoutsDealt: 0, closeCalls: 0, moves });
const profile = () => ({ claims: {}, researchPoints: 0 }) as unknown as Profile;

describe('Fast Learner', () => {
  it('counts moves used 10 or more times and needs the single top count (2+)', () => {
    expect(masteriesOf(hist('a', { x: 10, y: 12, z: 9 }))).toBe(2);
    const a = hist('a', { x: 10, y: 10 });
    const b = hist('b', { x: 10 });
    expect(pathFor(CFG, a, ['normal'], [a, b], false, fighting)).toBe('fast-learner');
    const tie = hist('c', { x: 10, y: 10 });
    expect(pathFor(CFG, a, ['normal'], [a, tie], false, fighting)).toBeNull();
    expect(pathFor(CFG, b, ['normal'], [a, b], false, fighting)).toBeNull();
  });
  it('its moves rank up with 5% fewer uses at the end of a run', () => {
    const credit = (path?: string) => masteryCredit(CFG, path ? { growthPath: path } : undefined, 29);
    expect(credit()).toBe(29);
    expect(credit('fast-learner')).toBe(31);
    const run = chooseStarter(content, createRun(content, { runId: 'fl', seed: 'fl', archetypeId: 'red', rules: STANDARD_CHOICE }), 0);
    const h = Object.values(run.story.histories)[0]!;
    const move = run.party[0]!.moves[0]!.id;
    h.moves = { [move]: 29 };
    expect(recordMoveMastery(content, profile(), run, 't').map((u) => u.rank)).toEqual(['bronze']);
    run.party[0]!.growthPath = 'fast-learner';
    expect(recordMoveMastery(content, profile(), run, 't').map((u) => u.rank)).toEqual(['bronze', 'silver']);
  });
});

describe('Dojo Student', () => {
  it('a Fighting type with 15+ uses of one Fighting move, most in the party', () => {
    const a = hist('a', { 'karate-chop': 15, tackle: 9 });
    const b = hist('b', { 'karate-chop': 5 });
    expect(topFightingMove(a, fighting)).toEqual({ id: 'karate-chop', uses: 15 });
    expect(pathFor(CFG, a, ['fighting'], [a, b], false, fighting)).toBe('dojo-student');
    expect(pathFor(CFG, a, ['normal'], [a, b], false, fighting)).toBeNull();
    expect(pathFor(CFG, hist('a', { 'karate-chop': 14 }), ['fighting'], [b], false, fighting)).toBeNull();
  });
  it('+3% accuracy with that one move only', () => {
    const acc = (id: string) => growthAccuracyMultiplier(CFG, { growthPath: 'dojo-student' }, 90, 'physical', null, 'fighting', false, { moveId: id, growthMove: 'karate-chop' });
    expect(acc('karate-chop')).toBeCloseTo(1.03);
    expect(acc('low-kick')).toBe(1);
  });
  it('assigning the path remembers the move', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'ds', seed: 'ds', archetypeId: 'red', rules: STANDARD_CHOICE }), 0);
    const mon = run.party[0]!;
    const fightMove = [...content.moves.values()].find((m) => m.type === 'fighting' && m.category !== 'status')!.id;
    const h = Object.values(run.story.histories)[0]!;
    h.moves = { [fightMove]: 20 };
    const species = content.species.get(mon.speciesId)!;
    const saved = species.types;
    (species as { types: string[] }).types = ['fighting'];
    try {
      assignGrowthPaths(content, [mon], { [mon.uid]: h });
    } finally {
      (species as { types: string[] }).types = saved;
    }
    expect(mon.growthPath).toBe('dojo-student');
    expect(mon.growthMove).toBe(fightMove);
  });
});
