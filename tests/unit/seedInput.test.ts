import { describe, expect, it } from 'vitest';
import { readSeedInput, type SeedInputEnv } from '../../src/core/seedInput';
import { encodeSeedCode } from '../../src/core/seedCode';
import { STANDARD_CHOICE } from '../../src/core/rules';

const env: SeedInputEnv = { hasArchetype: (id) => id === 'youngster', hasSpecies: () => true, speciesName: (id) => id, archetypeId: 'current' };

describe('Seed & Codes input', () => {
  it('a plain seed is trimmed; empty means random', () => {
    expect(readSeedInput('  abc.1  ', env)).toEqual({ kind: 'seed', seed: 'abc.1' });
    expect(readSeedInput('   ', env)).toEqual({ kind: 'seed', seed: null });
  });
  it('a seed code sets seed, trainer and rules', () => {
    const code = encodeSeedCode({ seed: 'abc.1', archetypeId: 'youngster', rules: STANDARD_CHOICE });
    const r = readSeedInput(code, env);
    expect(r.kind).toBe('code');
    if (r.kind === 'code') {
      expect(r.seed).toBe('abc.1');
      expect(r.archetypeId).toBe('youngster');
    }
  });
  it('keeps the current trainer when the code names one that is missing', () => {
    const code = encodeSeedCode({ seed: 's', archetypeId: 'nobody', rules: STANDARD_CHOICE });
    const r = readSeedInput(code, env);
    expect(r.kind === 'code' && r.archetypeId).toBe('current');
  });
  it('bad codes are errors, not seeds', () => {
    for (const bad of ['PR1.zzz', 'GH1.zzz', 'CC1.zzz', 'TM1.zzz']) expect(readSeedInput(bad, env).kind, bad).toBe('error');
  });
});
