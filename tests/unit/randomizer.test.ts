import { describe, expect, it } from 'vitest';
import { createPokemon } from '../../src/core/pokemon';
import { chooseStarter, createRun } from '../../src/core/run';
import { makeRules, randomizeMoves, randomSpecies, rulesProblem, lockSpecies, STANDARD_CHOICE } from '../../src/core/rules';
import { content } from './helpers';

const enc = { ...STANDARD_CHOICE, modifierIds: ['random-encounters'] };
const mov = { ...STANDARD_CHOICE, modifierIds: ['random-moves'] };

describe('Randomizer (S298)', () => {
  it('both options can be picked, alone or together', () => {
    expect(rulesProblem(enc)).toBeNull();
    expect(rulesProblem(mov)).toBeNull();
    expect(rulesProblem({ ...STANDARD_CHOICE, modifierIds: ['random-encounters', 'random-moves'] })).toBeNull();
  });
  it('encounters are seeded and deterministic', () => {
    const run = { rules: makeRules(enc), seed: 'rz' };
    expect(randomSpecies(content, run, 'k1')).toBe(randomSpecies(content, run, 'k1'));
    const picks = new Set(Array.from({ length: 30 }, (_, i) => lockSpecies(content, run, 'rattata', `k${i}`)));
    expect(picks.size).toBeGreaterThan(10);
    expect(lockSpecies(content, { rules: makeRules(STANDARD_CHOICE), seed: 'rz' }, 'rattata', 'k1')).toBe('rattata');
  });
  it('moves are replaced the same way every time, and left alone when off', () => {
    const run = { rules: makeRules(mov), seed: 'rz' };
    const a = createPokemon(content, 'rattata', 10, 'e1');
    const b = createPokemon(content, 'rattata', 10, 'e1');
    randomizeMoves(content, run, a);
    randomizeMoves(content, run, b);
    expect(a.moves).toEqual(b.moves);
    expect(a.moves.length).toBe(4);
    expect(new Set(a.moves.map((m) => m.id)).size).toBe(4);
    const c = createPokemon(content, 'rattata', 10, 'e1');
    randomizeMoves(content, { rules: makeRules(STANDARD_CHOICE), seed: 'rz' }, c);
    expect(c.moves).toEqual(createPokemon(content, 'rattata', 10, 'e1').moves);
  });
  it('a run starts with a randomized starter moveset', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'rz', archetypeId: 'red', rules: mov }), 0);
    expect(run.party[0]!.moves.length).toBe(4);
  });
});
