import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { createProfile } from '../../src/core/profile';
import { BOOKS, bookProgress, booksProblems, claimAll, claimAllProfile, claimBooks, trackPoints, trackTier } from '../../src/core/collectionBooks';
import { ProfileSchema } from '../../src/core/state';

const fresh = () => createProfile(content, 'p');

describe('collection books', () => {
  it('only names real species and keeps tiers in order', () => {
    expect(booksProblems(content)).toEqual([]);
    const pts = BOOKS.track.tiers.map((t) => t.points);
    expect([...pts].sort((a, b) => a - b)).toEqual(pts);
  });
  it('reports progress and missing species', () => {
    const p = { ...fresh(), speciesCaught: ['bulbasaur'] };
    expect(bookProgress(p, BOOKS.books[0]!)).toMatchObject({ have: 1, total: 3 });
  });
  it('pays a finished book once, never twice', () => {
    const p = { ...fresh(), speciesCaught: ['bulbasaur', 'charmander', 'squirtle'] };
    const before = p.bankCredits;
    expect(claimBooks(p, 'now')).toEqual(['Kanto Starters']);
    expect(p.bankCredits).toBe(before + BOOKS.books[0]!.reward.credits);
    expect(claimBooks(p, 'later')).toEqual([]);
    expect(p.bankCredits).toBe(before + BOOKS.books[0]!.reward.credits);
  });
  it('does not pay an unfinished book', () => {
    const p = { ...fresh(), speciesCaught: ['bulbasaur', 'charmander'] };
    expect(claimBooks(p, 'now')).toEqual([]);
    expect(() => claimAllProfile(p, 'now')).toThrow(/Nothing/);
  });
  it('pays Track tiers once and keeps the profile valid', () => {
    const p = { ...fresh(), speciesCaught: BOOKS.books.flatMap((b) => b.species), speciesShiny: ['eevee'] };
    expect(trackPoints(p)).toBeGreaterThan(100);
    const r = claimAllProfile(p, 'now');
    expect(trackTier(r.profile)).toBeGreaterThan(2);
    expect(r.profile.titles).toContain('Eevee Fancier');
    ProfileSchema.parse(r.profile);
    expect(claimAll(structuredClone(r.profile), 'again')).toBeNull();
    expect(() => claimAllProfile(r.profile, 'again')).toThrow(/Nothing/);
    expect(p.bankCredits).toBe(fresh().bankCredits);
  });
});
