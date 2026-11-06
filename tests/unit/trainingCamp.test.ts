import { describe, expect, it } from 'vitest';
import { campers, campProblem, CAMP_RULES, toggleCamp, trainCampers } from '../../src/core/trainingCamp';
import { createPokemon } from '../../src/core/pokemon';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

function runWithBox(n: number) {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'tc', seed: 'tc', archetypeId: 'red' }), 0));
  for (let i = 0; i < n; i += 1) run.box.push(createPokemon(content, 'rattata', 5, `b${i}`));
  return run;
}

describe('Training Camps (S46)', () => {
  it('only Box Pokémon can go, up to the slot limit, and can be called back', () => {
    const run = runWithBox(3);
    expect(campProblem(run, run.party[0]!.uid)).not.toBeNull();
    toggleCamp(run, 'b0');
    toggleCamp(run, 'b1');
    expect(campers(run).map((m) => m.uid)).toEqual(['b0', 'b1']);
    expect(campers(run)).toHaveLength(CAMP_RULES.slots);
    expect(() => toggleCamp(run, 'b2')).toThrow(/places/);
    toggleCamp(run, 'b0');
    expect(campers(run).map((m) => m.uid)).toEqual(['b1']);
  });
  it('campers gain experience after a win; the rest of the Box does not', () => {
    const run = runWithBox(2);
    toggleCamp(run, 'b0');
    const before = [run.box[0]!.xp, run.box[1]!.xp];
    trainCampers(content, run);
    expect(run.box[0]!.xp).toBeGreaterThan(before[0]!);
    expect(run.box[1]!.xp).toBe(before[1]);
  });
});
