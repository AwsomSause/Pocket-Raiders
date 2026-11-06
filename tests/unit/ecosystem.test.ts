// Habitat Ecosystem (S219).
import { describe, expect, it } from 'vitest';
import { ECOSYSTEM, EcosystemSchema, ecosystemWeight, removePredator } from '../../src/core/ecosystem';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const fresh = (): RunState => structuredClone(chooseStarter(content, createRun(content, { runId: 'eco', seed: 'eco', archetypeId: 'red' }), 0));
const off = { ...content, balance: { ...content.balance, ecosystem: { enabled: false } } } as typeof content;

describe('ecosystem data', () => {
  it('validates and names real species', () => {
    expect(EcosystemSchema.safeParse(ECOSYSTEM).success).toBe(true);
    for (const c of ECOSYSTEM.chains) for (const id of [...c.predators, ...c.prey]) expect(content.species.has(id), id).toBe(true);
  });
});

describe('removing a predator', () => {
  it('raises its prey for the rest of the stage, evolutions count, others unaffected', () => {
    const run = fresh();
    expect(ecosystemWeight(content, run, 'rattata')).toBe(1);
    expect(removePredator(content, run, 'arbok')).toEqual(['snakes']);
    expect(ecosystemWeight(content, run, 'rattata')).toBe(ECOSYSTEM.factor);
    expect(ecosystemWeight(content, run, 'raticate')).toBe(ECOSYSTEM.factor);
    expect(ecosystemWeight(content, run, 'pikachu')).toBe(1);
  });
  it('does nothing for a non-predator, when off, or in another stage; survives a save round trip', () => {
    const run = fresh();
    expect(removePredator(content, run, 'pikachu')).toEqual([]);
    removePredator(content, run, 'ekans');
    expect(ecosystemWeight(off, run, 'rattata')).toBe(1);
    const saved = JSON.parse(JSON.stringify(run)) as RunState;
    expect(ecosystemWeight(content, saved, 'rattata')).toBe(ECOSYSTEM.factor);
    saved.stage!.index += 1;
    expect(ecosystemWeight(content, saved, 'rattata')).toBe(1);
  });
});
