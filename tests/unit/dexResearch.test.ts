// Species research (S497): levels from thresholds, Research Points for new levels, a Perfect bonus once, old saves load.

import { describe, expect, it } from 'vitest';
import { applyDexTallies, DEX_RESEARCH, maxResearchLevel, nextResearchGoal, researchLevelOf, tallyOf } from '../../src/core/dexResearch';
import { dexPage } from '../../src/core/presentation/dexInfo';
import { discover } from '../../src/core/progress';
import { createProfile } from '../../src/core/profile';
import { chooseStarter, createRun } from '../../src/core/run';
import { ProfileSchema } from '../../src/core/state';
import { content } from './helpers';

describe('species research', () => {
  it('level counts every threshold reached across both tasks', () => {
    expect(researchLevelOf({ seen: 0, caught: 0 })).toBe(0);
    expect(researchLevelOf({ seen: 1, caught: 0 })).toBe(1);
    expect(researchLevelOf({ seen: 3, caught: 1 })).toBe(3);
    expect(researchLevelOf({ seen: 999, caught: 999 })).toBe(maxResearchLevel());
  });
  it('the next goal names the nearest unmet threshold, and is null at the top', () => {
    expect(nextResearchGoal({ seen: 0, caught: 0 })).toMatch(/of 1$/);
    expect(nextResearchGoal({ seen: 999, caught: 999 })).toBeNull();
  });
  it('a run pays one point per new level, and the Perfect bonus exactly once', () => {
    const profile = createProfile(content, 'p');
    expect(applyDexTallies(profile, { pikachu: { seen: 3, caught: 1 } })).toBe(3 * DEX_RESEARCH.pointsPerLevel);
    expect(applyDexTallies(profile, { pikachu: { seen: 0, caught: 0 } })).toBe(0);
    const rest = applyDexTallies(profile, { pikachu: { seen: 100, caught: 100 } });
    expect(rest).toBe((maxResearchLevel() - 3) * DEX_RESEARCH.pointsPerLevel + DEX_RESEARCH.perfectBonus);
    expect(applyDexTallies(profile, { pikachu: { seen: 50, caught: 50 } })).toBe(0);
    expect(tallyOf(profile, 'pikachu').caught).toBe(151);
  });
  it('a run counts each meeting and each catch', () => {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'dr', seed: 'dr', archetypeId: 'red' }), 0));
    discover(run, 'pidgey', false);
    discover(run, 'pidgey', false);
    discover(run, 'pidgey', true);
    expect(run.log.dexTally.pidgey).toEqual({ seen: 2, caught: 1 });
  });
  it('an old profile without research loads, and the Pokédex page shows the level', () => {
    const { dexResearch: _drop, ...old } = createProfile(content, 'p');
    const loaded = ProfileSchema.parse(old);
    expect(loaded.dexResearch).toEqual({});
    loaded.speciesSeen.push('pikachu');
    expect(dexPage(content, loaded, 'pikachu').research).toMatch(/^Research level 0 of /);
    expect(dexPage(content, loaded, 'mew').research).toBe('');
  });
});
