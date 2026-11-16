import { describe, expect, it } from 'vitest';
import { dexCard, dexDataPage, dexPage, dexState } from '../../src/core/presentation/dexInfo';
import { content } from './helpers';

const profile = { speciesSeen: ['pikachu', 'bulbasaur'], speciesCaught: ['bulbasaur'] };

describe('Pokédex species page', () => {
  it('knows unknown, seen and caught species', () => {
    expect(dexState(profile, 'charmander')).toBe('unknown');
    expect(dexState(profile, 'pikachu')).toBe('seen');
    expect(dexState(profile, 'bulbasaur')).toBe('caught');
  });
  it('hides what is not met, and shows types and stats once met', () => {
    const hidden = dexPage(content, profile, 'charmander');
    expect(hidden.title).toContain('???');
    expect(hidden.stats).toEqual([]);
    const page = dexPage(content, profile, 'bulbasaur');
    expect(page.title).toContain('Bulbasaur');
    expect(page.types).toBe('Grass / Poison');
    expect(page.stats).toHaveLength(7);
    expect(page.note).toContain('caught');
  });
  it('rejects an unknown species id', () => {
    expect(() => dexPage(content, profile, 'nope')).toThrow(/Unknown species/);
  });
  it('the data page hides unmet species and the hidden ability until caught', () => {
    expect(dexDataPage(content, profile, 'charmander')).toMatchObject({ facts: [], moves: [] });
    const seen = dexDataPage(content, profile, 'pikachu');
    expect(seen.facts.find((f) => f.startsWith('Hidden ability'))).toBe('Hidden ability: ???');
    const caught = dexDataPage(content, profile, 'bulbasaur');
    expect(caught.facts.find((f) => f.startsWith('Hidden ability'))).not.toContain('???');
    expect(caught.evolutions[0]).toContain('Ivysaur');
    expect(caught.moves[0]).toContain('Tackle');
    expect(caught.moves.length).toBeGreaterThan(5);
  });
});

describe('Pokédex species card (New UI)', () => {
  const p = { ...profile, dexResearch: { bulbasaur: { seen: 9, caught: 2 } } };
  it('a met species has its name, types, four facts, six stats and its evolution line', () => {
    const card = dexCard(content, p, 'bulbasaur');
    expect(card).toMatchObject({ state: 'caught', no: 'No. 0001', name: 'Bulbasaur', types: ['grass', 'poison'] });
    expect(card.facts).toEqual([['Height', '0.7 m'], ['Weight', '6.9 kg'], ['Caught', '2'], ['Battles', '9']]);
    expect(card.stats.map((s) => s.label)).toEqual(['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe']);
    expect(card.stats[0]!.value).toBe(45);
    // First form first; forms the player has not met are marked so they are drawn as shadows.
    expect(card.line).toEqual([{ id: 'bulbasaur', here: true, met: true }, { id: 'ivysaur', here: false, met: false }, { id: 'venusaur', here: false, met: false }]);
    expect(card.next).toContain('Ivysaur');
    expect(card.note).toContain('caught');
    expect(card.note).toContain('Research level');
  });
  it('a last form starts its line at the first form and says it is final', () => {
    const card = dexCard(content, { speciesSeen: ['charizard'], speciesCaught: [] }, 'charizard');
    expect(card.line.map((e) => e.id)).toEqual(['charmander', 'charmeleon', 'charizard']);
    expect(card.line.map((e) => e.here)).toEqual([false, false, true]);
    expect(card.next).toBe('Final form');
    // No tally yet: the counts read zero, never undefined.
    expect(card.facts.slice(2)).toEqual([['Caught', '0'], ['Battles', '0']]);
  });
  it('a species with several ways on shows them, and the line never runs past five pictures', () => {
    const card = dexCard(content, { speciesSeen: ['eevee'], speciesCaught: [] }, 'eevee');
    expect(card.line.find((e) => e.here)).toMatchObject({ id: 'eevee', met: true });
    expect(card.line.length).toBeGreaterThan(2);
    expect(card.line.length).toBeLessThanOrEqual(5);
    expect(new Set(card.line.map((e) => e.id)).size).toBe(card.line.length);
  });
  it('the gender shares on the data page add up to 100', () => {
    const all = { speciesSeen: ['charizard', 'pikachu'], speciesCaught: [] };
    expect(dexDataPage(content, all, 'charizard').facts).toContain('Gender: 87.5% male, 12.5% female');
    expect(dexDataPage(content, all, 'pikachu').facts).toContain('Gender: 50% male, 50% female');
  });
  it('an unmet species gives nothing away', () => {
    expect(dexCard(content, p, 'charmander')).toEqual({ state: 'unknown', no: 'No. 0004', name: '???', types: [], facts: [], note: 'Not met yet. Meet it in a run to fill this page.', stats: [], line: [], next: '' });
  });
  it('rejects an unknown species id', () => {
    expect(() => dexCard(content, p, 'nope')).toThrow(/Unknown species/);
  });
  it('every species builds a card whose line holds it exactly once', () => {
    const all = { speciesSeen: [...content.species.keys()], speciesCaught: [] };
    for (const id of content.species.keys()) {
      const card = dexCard(content, all, id);
      expect(card.line.filter((e) => e.here), id).toHaveLength(1);
      expect(card.line.length, id).toBeLessThanOrEqual(5);
    }
  });
});
