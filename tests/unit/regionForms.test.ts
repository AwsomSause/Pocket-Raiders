import { describe, expect, it } from 'vitest';
import { answerRegionForm, regionFormOffers, regionFormPrompt } from '../../src/core/regionForms';
import { createPokemon } from '../../src/core/pokemon';
import { content } from './helpers';

describe('regional form offers', () => {
  const mk = (speciesId: string, region: string) => {
    const mon: any = createPokemon(content, speciesId, 20, 'u1');
    return { party: [mon], regionOrder: [region], regionIndex: 0, story: { flags: {} }, log: { speciesSeen: [], speciesCaught: [], counters: {} }, inventory: {} } as any;
  };
  it('offers a form only in its home region', () => {
    expect(regionFormOffers(content, mk('raichu', 'alola'))[0]?.targets).toEqual(['raichu-alola']);
    expect(regionFormOffers(content, mk('raichu', 'kanto'))).toEqual([]);
    expect(regionFormOffers(content, mk('raichu-alola', 'alola'))).toEqual([]);
  });
  it('shows the prompt text and asks only once', () => {
    const run = mk('raichu', 'alola');
    const offer = regionFormOffers(content, run)[0]!;
    expect(regionFormPrompt(content, run, offer)).toContain('Raichu is loving the beaches of Alola');
    answerRegionForm(content, run, 'u1', null);
    expect(run.party[0].speciesId).toBe('raichu');
    expect(regionFormOffers(content, run)).toEqual([]);
  });
  it('switches form for free and keeps level', () => {
    const run = mk('raichu', 'alola');
    answerRegionForm(content, run, 'u1', 'raichu-alola');
    expect(run.party[0].speciesId).toBe('raichu-alola');
    expect(run.party[0].level).toBe(20);
    expect(() => answerRegionForm(content, run, 'u1', 'raichu-alola')).toThrow();
  });
  it('offers each Tauros breed in Paldea', () => {
    expect(regionFormOffers(content, mk('tauros', 'paldea'))[0]?.targets.length).toBe(3);
  });
});
