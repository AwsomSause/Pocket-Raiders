import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { priceOf, storeOf, STORES } from '../../src/ui/redux/storeFloors';

// The department store page of the New UI: which event rooms are floors of which store, and how a priced choice reads.

describe('department store floors (storeOf)', () => {
  it('a floor room belongs to the store, with only its own floor lit', () => {
    const s = storeOf('cs-kanto-celadon-mart-f3')!;
    expect(s.title).toBe('Celadon Dept. Store');
    expect(s.clerk).toBe('Clerk');
    expect(s.floors.filter((f) => f.on).map((f) => f.tag)).toEqual(['3F']);
    expect(s.floors.map((f) => f.tag)).toEqual(['RF', '5F', '4F', '3F', '2F', '1F']);
  });
  it('both stone trays are the fifth floor; the lift and the entrance are the first', () => {
    for (const id of ['cs-kanto-celadon-mart-f5', 'cs-kanto-celadon-mart-f5b']) expect(storeOf(id)!.floors.find((f) => f.on)!.tag).toBe('5F');
    for (const id of ['cs-kanto-celadon-mart', 'cs-kanto-celadon-mart-lift', 'cs-kanto-celadon-mart-shops']) expect(storeOf(id)!.floors.find((f) => f.on)!.tag).toBe('1F');
  });
  it('the hidden half floor is on the directory only while the player stands on it', () => {
    expect(storeOf('cs-kanto-celadon-mart-f4')!.floors.some((f) => f.tag === '4½')).toBe(false);
    const s = storeOf('cs-kanto-celadon-mart-dolls')!;
    expect(s.floors.map((f) => f.tag)).toEqual(['RF', '5F', '4½', '4F', '3F', '2F', '1F']);
    expect(s.floors.find((f) => f.on)!.name).toBe('The Doll Floor');
  });
  it('any other event is not a store', () => {
    expect(storeOf('pokemon-center')).toBeNull();
    expect(storeOf('')).toBeNull();
    expect(storeOf('cs-kanto-celadon-mart-f9')).toBeNull();
  });
  it('every room a store names is a real event, and no room is on two floors', () => {
    const seen = new Set<string>();
    for (const s of STORES) for (const f of s.floors) for (const id of f.events) {
      expect(content.events.has(id), id).toBe(true);
      expect(seen.has(id), id).toBe(false);
      seen.add(id);
    }
  });
});

describe('a priced choice (priceOf)', () => {
  it('splits the good from its price', () => {
    expect(priceOf('Great Ball ×3 (₽1,800)')).toEqual({ name: 'Great Ball ×3', price: '₽ 1,800' });
    expect(priceOf('Fire Stone (₽3,000)')).toEqual({ name: 'Fire Stone', price: '₽ 3,000' });
    expect(priceOf('A Poké Doll (₽600)')).toEqual({ name: 'A Poké Doll', price: '₽ 600' });
  });
  it('a choice with no price, or with the price in the middle, has none', () => {
    expect(priceOf('Back to the lift.')).toBeNull();
    expect(priceOf('Pay (₽500) and leave')).toBeNull();
    expect(priceOf('')).toBeNull();
    expect(priceOf('(₽500)')).toBeNull();
  });
});
