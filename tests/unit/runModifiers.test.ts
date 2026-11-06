import { describe, expect, it } from 'vitest';
import { RUN_MODIFIERS, modifierFor, modifierWildWeight, stageModifier } from '../../src/core/runModifiers';
import { chooseStarter, createRun } from '../../src/core/run';
import { content, toBattle } from './helpers';

describe('run modifiers', () => {
  it('only uses real types, is repeatable, and is rarer than every stage', () => {
    const seen = new Set<string>();
    let hits = 0;
    for (let i = 0; i < 400; i++) {
      const m = modifierFor(`s${i}`, i % 4, 3);
      expect(modifierFor(`s${i}`, i % 4, 3)).toBe(m);
      if (m) { hits++; seen.add(m.id); }
    }
    expect(hits).toBeGreaterThan(60);
    expect(hits).toBeLessThan(200);
    expect(seen.size).toBe(RUN_MODIFIERS.modifiers.length);
    expect(modifierFor('x', 0, RUN_MODIFIERS.firstStage - 1)).toBeNull();
  });
  it('boosts only matching types, touches no random stream, is 1 outside a stage', () => {
    for (let i = 0; i < 200; i++) {
      const run = structuredClone(toBattle(chooseStarter(content, createRun(content, { runId: `m${i}`, seed: `m${i}`, archetypeId: 'red' }), 0)));
      run.stage = { ...run.stage!, index: 3 };
      const mod = stageModifier(run);
      if (!mod) continue;
      const before = JSON.stringify(run.rng);
      for (const s of content.species.values()) {
        const w = modifierWildWeight(content, run, s.id);
        expect(w).toBe(s.types.some((t) => (mod.types as string[]).includes(t)) ? mod.factor : 1);
      }
      expect(JSON.stringify(run.rng)).toBe(before);
      expect(modifierWildWeight(content, { ...run, stage: null }, 'pikachu')).toBe(1);
      return;
    }
    throw new Error('no stage with a modifier found in 200 seeds');
  });
});
