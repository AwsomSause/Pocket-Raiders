// Beta 0.6 Balance A: type retag (B1), wild dampeners (B2), trainer pool rules (B3).
import { describe, expect, it } from 'vitest';
import { availabilityOf } from '../../src/core/availability';
import { reservedTrainerSpecies } from '../../src/core/rivals/home';
import { regionTrainerCap, rememberRegionTrainer } from '../../src/core/trainerPools';
import { wildMetWeight } from '../../src/core/wildDampers';
import { rememberPick } from '../../src/core/variety';
import { content } from './helpers';

const rarity = (id: string) => availabilityOf(content, id)?.rarity;

describe('B1 type retag', () => {
  it('Steel/Ghost/Psychic commons are uncommon, Ice/Fairy/Dragon commons are rare, the rarest type wins', () => {
    expect(rarity('abra')).toBe('uncommon');
    expect(rarity('gastly')).toBe('uncommon');
    expect(rarity('swinub')).toBe('rare');
    expect(rarity('jigglypuff')).toBe('rare');
    expect(rarity('ralts')).toBe('rare'); // Psychic/Fairy
    expect(rarity('pidgey')).toBe('common'); // untouched
  });
  it('no common species is left in those six types', () => {
    const six = ['steel', 'ghost', 'psychic', 'ice', 'fairy', 'dragon'];
    const left = [...content.species.values()].filter((s) => !s.form && rarity(s.id) === 'common' && s.types.some((t) => six.includes(t)));
    expect(left.map((s) => s.id)).toEqual([]);
  });
});

describe('B2 wild dampeners', () => {
  const run = () => ({ history: {} as Record<string, string[]> });
  it('an empty history changes nothing (normal)', () => {
    expect(wildMetWeight(content, run())('rattata')).toBe(1);
  });
  it('each meet multiplies by 0.6, each relative by 0.8 (boundary: after the no-repeat window)', () => {
    const r = run();
    for (let i = 0; i < 6; i++) rememberPick(content, r, 'wildMet', i === 0 ? 'rattata' : i === 1 ? 'rattata' : i === 2 ? 'raticate' : 'pidgey');
    const w = wildMetWeight(content, r);
    expect(w('rattata')).toBeCloseTo(0.6 ** 2 * 0.8, 6);
    expect(w('zubat')).toBe(1);
  });
  it('no species repeats in the first six fights (failure path: weight is tiny but never zero)', () => {
    const r = run();
    rememberPick(content, r, 'wildMet', 'rattata');
    const w = wildMetWeight(content, r)('rattata');
    expect(w).toBeGreaterThan(0);
    expect(w).toBeLessThan(0.001);
  });
});

describe('B3 trainer pools', () => {
  it('starters and rival signatures are reserved', () => {
    expect(reservedTrainerSpecies.has('bulbasaur')).toBe(true);
    expect(reservedTrainerSpecies.has('rattata')).toBe(false);
  });
  it('a species line is capped at 2 trainers per region and resets in a new region', () => {
    const r = { history: {} as Record<string, string[]>, regionIndex: 0 };
    rememberRegionTrainer(content, r, ['geodude', 'geodude']);
    expect(regionTrainerCap(content, r)('geodude')).toBe(1);
    rememberRegionTrainer(content, r, ['geodude']);
    expect(regionTrainerCap(content, r)('geodude')).toBe(0);
    expect(regionTrainerCap(content, { ...r, regionIndex: 1 })('geodude')).toBe(1);
  });
});
