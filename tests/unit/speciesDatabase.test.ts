// The Overhaul P0 (section 6): the Pokémon database is consistent, the hand-checked fixes apply,
// and the special evolutions and TM lists they add work.
import { describe, expect, it } from 'vitest';
import { applySpeciesFixes, buildContent } from '../../src/data/index';
import speciesJson from '../../src/data/species.json';
import { auditSpecies } from '../../src/quality/speciesAudit';
import { evolutionGift } from '../../src/core/evolution';
import { createPokemon } from '../../src/core/pokemon';
import { applyReward } from '../../src/core/rewards';
import { createRun } from '../../src/core/run';
import { content } from './helpers';

const fixes = { learnsets: {}, replaceMoves: {}, evolutionGifts: [] };

function runWith(inventory: Record<string, number>) {
  const run = createRun(content, { runId: 'db-test', seed: 'db-test', archetypeId: 'red', campaignId: 'full' });
  run.inventory = { ...inventory };
  return run;
}

describe('Pokémon database audit', () => {
  it('finds no problem in any species or form', () => {
    expect(auditSpecies(content)).toEqual([]);
  });

  it('reports a broken species', () => {
    const c = buildContent();
    const bulbasaur = c.species.get('bulbasaur')!;
    bulbasaur.types = ['grass', 'grass'];
    bulbasaur.baseStats = { ...bulbasaur.baseStats, spe: 0 };
    bulbasaur.learnset = [...bulbasaur.learnset, bulbasaur.learnset[0]!];
    c.species.get('ivysaur')!.evolvesFrom = 'oddish';
    const checks = auditSpecies(c).filter((p) => p.speciesId === 'bulbasaur').map((p) => p.check);
    expect(checks).toEqual(expect.arrayContaining(['types', 'stats', 'learnset', 'evolution']));
  });
});

describe('species fixes', () => {
  it('Tympole has its own learnset, not Timburr’s', () => {
    const tympole = content.species.get('tympole')!;
    expect(tympole.learnset.map((e) => e.move)).toContain('bubble-beam');
    expect(tympole.learnset.map((e) => e.move)).not.toContain('hammer-arm');
  });

  it('wrong moves are swapped for the right ones at the same level', () => {
    const at = (id: string, level: number) => content.species.get(id)!.learnset.filter((e) => e.level === level).map((e) => e.move);
    expect(at('crabominable', 45)).toEqual(['dynamic-punch']);
    expect(at('moltres-galar', 45)).toEqual(['fiery-wrath']);
    expect(at('appletun', 28)).toContain('apple-acid');
    expect(content.species.get('torkoal')!.learnset.map((e) => e.move)).not.toContain('infernal-parade');
  });

  it('a fix that no longer matches the data fails loudly', () => {
    expect(() => applySpeciesFixes(speciesJson, { ...fixes, replaceMoves: { bulbasaur: { 'hydro-pump': 'tackle' } } })).toThrow(/does not learn/);
    expect(() => applySpeciesFixes(speciesJson, { ...fixes, learnsets: { 'no-such-mon': [] } })).toThrow(/unknown species/);
    expect(() => applySpeciesFixes(speciesJson, { ...fixes, evolutionGifts: [{ from: 'nincada', to: 'pikachu', species: 'shedinja', needsItem: 'poke-ball' }] })).toThrow(/does not evolve/);
  });

  it('custom evolutions can use TMs: Bruticate borrows Raticate’s list', () => {
    expect(content.learnables.get('bruticate')).toEqual(content.learnables.get('raticate'));
    expect(content.learnables.get('alphayena')?.length).toBeGreaterThan(0);
  });
});

describe('Nincada leaves a Shedinja behind', () => {
  it('gives a Shedinja with the same level and moves, using one Poké Ball', () => {
    const run = runWith({ 'poke-ball': 2 });
    const ninjask = createPokemon(content, 'ninjask', 20, 'p99');
    const gift = evolutionGift(content, run, ninjask, { from: 'nincada', to: 'ninjask' })!;
    expect(gift.speciesId).toBe('shedinja');
    expect(gift.level).toBe(20);
    expect(gift.moves.map((m) => m.id)).toEqual(ninjask.moves.map((m) => m.id));
    expect(gift.uid).not.toBe(ninjask.uid);
    expect(run.inventory['poke-ball']).toBe(1);
  });

  it('gives nothing without a Poké Ball, or for any other evolution', () => {
    const empty = runWith({});
    const mon = createPokemon(content, 'ninjask', 20, 'p1');
    expect(evolutionGift(content, empty, mon, { from: 'nincada', to: 'ninjask' })).toBeNull();
    const run = runWith({ 'poke-ball': 1 });
    expect(evolutionGift(content, run, createPokemon(content, 'ivysaur', 16, 'p2'), { from: 'bulbasaur', to: 'ivysaur' })).toBeNull();
    expect(run.inventory['poke-ball']).toBe(1);
  });

  it('is the same Shedinja for the same seed', () => {
    const a = evolutionGift(content, runWith({ 'poke-ball': 1 }), createPokemon(content, 'ninjask', 20, 'p1'), { from: 'nincada', to: 'ninjask' });
    const b = evolutionGift(content, runWith({ 'poke-ball': 1 }), createPokemon(content, 'ninjask', 20, 'p1'), { from: 'nincada', to: 'ninjask' });
    expect(a).toEqual(b);
  });

  it('a Rare Candy evolution offers the Shedinja as a caught Pokémon', () => {
    const run = runWith({ 'poke-ball': 1 });
    run.party = [createPokemon(content, 'nincada', 19, 'p1')];
    const result = applyReward(content, run, content.archetypes.get('red')!, 'rare-candy', 0);
    expect(run.party[0]!.speciesId).toBe('ninjask');
    const caught = result.pending.find((d) => d.kind === 'caught');
    expect(caught?.kind === 'caught' && caught.mon.speciesId).toBe('shedinja');
    expect(run.inventory['poke-ball']).toBeUndefined();
  });
});
