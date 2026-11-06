import { describe, expect, it } from 'vitest';
import { applyFormShift, FORM_SHIFT, formShiftProblem, formShiftTargets } from '../../src/core/formShift';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

function runWith(id: string) {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'fs', seed: 'fs', archetypeId: 'red' }), 0));
  const mon = createPokemon(content, id, 30, 'x1');
  run.party = [mon];
  return { run, mon };
}

describe('Regional Form Shifts (S52)', () => {
  it('lists the regional variant of a base form and the base of a variant', () => {
    expect(formShiftTargets(content, createPokemon(content, 'arcanine', 30, 'a'))).toContain('arcanine-hisui');
    expect(formShiftTargets(content, createPokemon(content, 'arcanine-hisui', 30, 'b'))).toEqual(['arcanine']);
    expect(formShiftTargets(content, createPokemon(content, 'pikachu', 30, 'c'))).toEqual([]);
  });
  it('needs a Moon Stone, keeps level and HP share, and swaps back', () => {
    const { run, mon } = runWith('arcanine');
    expect(formShiftProblem(content, run, mon, 'arcanine-hisui')).toMatch(/needs/);
    run.inventory[FORM_SHIFT.item] = 2;
    mon.hp = Math.floor(maxHp(content, mon) / 2);
    applyFormShift(content, run, mon.uid, 'arcanine-hisui');
    expect(run.party[0]!.speciesId).toBe('arcanine-hisui');
    expect(run.party[0]!.level).toBe(30);
    expect(run.inventory[FORM_SHIFT.item]).toBe(1);
    expect(run.party[0]!.hp / maxHp(content, run.party[0]!)).toBeGreaterThan(0.4);
    expect(run.party[0]!.hp / maxHp(content, run.party[0]!)).toBeLessThan(0.6);
    applyFormShift(content, run, mon.uid, 'arcanine');
    expect(run.party[0]!.speciesId).toBe('arcanine');
    expect(run.inventory[FORM_SHIFT.item] ?? 0).toBe(0);
  });
  it('a fainted Pokémon cannot take part', () => {
    const { run, mon } = runWith('arcanine');
    run.inventory[FORM_SHIFT.item] = 1;
    mon.hp = 0;
    expect(() => applyFormShift(content, run, mon.uid, 'arcanine-hisui')).toThrow(/fainted/);
  });
});
