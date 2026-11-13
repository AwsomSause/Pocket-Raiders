// Beta 0.6 B9: Evolution Encounters are on (Risky Evolutions stay off).

import { describe, expect, it } from 'vitest';
import { applyEffect, conditionMet, eligibleEvents } from '../../src/core/events';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const IDS = ['evo-eevee-couldnt-choose', 'evo-pokemon-that-wouldnt-evolve', 'evo-pidgeys-resolve'];
const run = (on: boolean): RunState => chooseStarter(content, createRun(content, { runId: 'evo', seed: 'evo', archetypeId: 'red', ...(on ? { expansion: { evolutionEncounters: true } } : {}) }), 0);
const rng = () => new Rng(hashSeed('evo'));

describe('Evolution Encounters (B9)', () => {
  it('the three events exist, are all about evolution, and need the setting on', () => {
    for (const id of IDS) {
      const e = content.events.get(id);
      expect(e, id).toBeDefined();
      expect(e!.requires.some((r) => r.kind === 'evoEncounters')).toBe(true);
      expect(e!.group).toBe('Evolution Encounters');
    }
  });

  it('the Eevee event is offered only in a run that has Evolution Encounters on', () => {
    const on = run(true);
    on.party = [createPokemon(content, 'eevee', 20, 'e1')];
    const off = run(false);
    off.party = [createPokemon(content, 'eevee', 20, 'e1')];
    const offered = (r: RunState) => eligibleEvents(content, r).some((e) => e.id === 'evo-eevee-couldnt-choose');
    expect(offered(off)).toBe(false);
    expect(conditionMet(content, on, { kind: 'partySpecies', species: 'eevee' })).toBe(true);
    expect(conditionMet(content, on, { kind: 'evoEncounters' })).toBe(true);
  });

  it('with the setting off the condition is false and the effects do nothing', () => {
    const r = run(false);
    r.party = [createPokemon(content, 'pidgey', 20, 'p1')];
    expect(conditionMet(content, r, { kind: 'evoEncounters' })).toBe(false);
    expect(applyEffect(content, r, { kind: 'evoEncounter', mode: 'nudge', within: 8 }, rng())).toBe('');
    expect(r.party[0]!.speciesId).toBe('pidgey');
  });

  it('nudge evolves a Pokémon that is close to its level evolution, once', () => {
    const r = run(true);
    r.party = [createPokemon(content, 'pidgey', 12, 'p1')];
    expect(conditionMet(content, r, { kind: 'evoEncounters', nearEvolution: 8 })).toBe(true);
    expect(applyEffect(content, r, { kind: 'evoEncounter', mode: 'nudge', species: 'pidgey', within: 8 }, rng())).toContain('evolves into');
    expect(r.party[0]!.speciesId).toBe('pidgeotto');
    // Pidgeotto (Lv 12) is nowhere near 36, so a second nudge does nothing.
    expect(applyEffect(content, r, { kind: 'evoEncounter', mode: 'nudge', species: 'pidgey', within: 8 }, rng())).toBe('');
    expect(conditionMet(content, r, { kind: 'evoEncounters', nearEvolution: 8 })).toBe(false);
  });

  it('a Pokémon far from its evolution is not nudged', () => {
    const r = run(true);
    r.party = [createPokemon(content, 'pidgey', 5, 'p1')];
    expect(applyEffect(content, r, { kind: 'evoEncounter', mode: 'nudge', within: 8 }, rng())).toBe('');
    expect(r.party[0]!.speciesId).toBe('pidgey');
  });

  it('stone gives the chosen evolution stone to a Pokémon that uses it, and never a Risky Evolution', () => {
    const r = run(true);
    r.party = [createPokemon(content, 'eevee', 20, 'e1')];
    const before = r.inventory['water-stone'] ?? 0;
    expect(applyEffect(content, r, { kind: 'evoEncounter', mode: 'stone', item: 'water-stone', species: 'eevee', within: 8 }, rng())).toContain('Water Stone');
    expect(r.inventory['water-stone']).toBe(before + 1);
    expect(r.party[0]!.speciesId).toBe('eevee');
    // No effect or event here is a Risky Evolution (an early evolution with a flaw): nothing in the data mentions one.
    for (const id of IDS) expect(JSON.stringify(content.events.get(id)).toLowerCase()).not.toContain('risky');
  });
});
