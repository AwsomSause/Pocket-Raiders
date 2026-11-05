import { describe, expect, it } from 'vitest';
import { createProfile } from '../../src/core/profile';
import { defaultPrep } from '../../src/core/runPrep';
import { applyOption, NONE, optionsFor, type OptionRow, type PrepState } from '../../src/core/runPrepOptions';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { content } from './helpers';

const profile = createProfile(content, 'opts');
const state = (): PrepState => ({ archetypeId: [...content.archetypes.keys()][0]!, prep: defaultPrep(content), rules: STANDARD_CHOICE });
const ROWS: OptionRow[] = ['trainer', 'token', 'directive', 'license', 'loan', 'vault', 'mentor', 'mode', 'region', 'difficulty', 'heat', 'campaign', 'weeks'];

describe('Run Prep options', () => {
  it('every row lists options and marks the one in effect', () => {
    for (const row of ROWS) {
      const o = optionsFor(row, content, profile, state(), true);
      expect(o.options.length, row).toBeGreaterThan(0);
      expect(o.options.some((x) => x.id === o.chosen), row).toBe(true);
    }
  });
  it('picking an option changes the state, and picking it again changes nothing more', () => {
    const s = state();
    const a = applyOption('directive', 'fire', s, content, profile);
    expect(a.prep.directive).toBe('fire');
    expect(applyOption('directive', NONE, a, content, profile).prep.directive).toBeNull();
    expect(applyOption('weeks', 'off', s, content, profile).rules.weeks).toBe(false);
    expect(applyOption('heat', '3', s, content, profile).rules.heat).toBe(3);
    expect(applyOption('difficulty', s.rules.difficultyId, s, content, profile).rules.difficultyId).toBe(s.rules.difficultyId);
  });
  it('locked or unknown options and a disabled row change nothing', () => {
    const s = state();
    expect(applyOption('directive', 'not-a-type', s, content, profile)).toBe(s);
    expect(applyOption('region', NONE, s, content, profile)).toBe(s); // Standard mode: the region row is off
    expect(optionsFor('region', content, profile, s).enabled).toBe(false);
    const loan = optionsFor('loan', content, profile, s).options.find((o) => o.id === 'on')!;
    expect(loan.ok).toBe(false); // Bank tier 3 needed
    expect(applyOption('loan', 'on', s, content, profile)).toBe(s);
  });
});
