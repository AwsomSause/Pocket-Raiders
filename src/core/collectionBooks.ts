// Collection Books and the Reward Track (W15). Pure rules, no RNG. Everything is derived from what the profile
// already stores (species caught, shinies, achievements, runs ended) and paid once through the claim ledger,
// so there is no new saved state and no save version bump.

import { z } from 'zod';
import booksJson from '../data/collectionBooks.json';
import type { Content } from './contentSchema';
import { claim } from './quests';
import type { Profile } from './state';

const Reward = z.object({ credits: z.number().int().min(0), rp: z.number().int().min(0), title: z.string().optional() });
export type BookReward = z.infer<typeof Reward>;

export const BOOKS = z.object({
  note: z.string(),
  books: z.array(z.object({ id: z.string(), name: z.string(), blurb: z.string(), species: z.array(z.string()).min(1), reward: Reward })).min(1),
  track: z.object({
    weights: z.object({ caught: z.number(), shiny: z.number(), achievement: z.number(), runEnded: z.number(), book: z.number() }),
    tiers: z.array(Reward.extend({ points: z.number().int().positive() })).min(1),
  }),
}).parse(booksJson);
export type Book = (typeof BOOKS)['books'][number];

export const bookKey = (id: string) => `book:${id}`;
export const trackKey = (n: number) => `track:${n}`;

export const bookProgress = (p: Pick<Profile, 'speciesCaught'>, b: Book): { have: number; total: number; missing: string[] } => {
  const caught = new Set(p.speciesCaught);
  const missing = b.species.filter((s) => !caught.has(s));
  return { have: b.species.length - missing.length, total: b.species.length, missing };
};
export const bookComplete = (p: Pick<Profile, 'speciesCaught'>, b: Book): boolean => bookProgress(p, b).missing.length === 0;

function pay(p: Profile, r: BookReward): void {
  p.bankCredits += r.credits;
  p.lifetimeBankCredits += r.credits;
  p.researchPoints += r.rp;
  if (r.title && !p.titles.includes(r.title)) p.titles = [...p.titles, r.title];
}

/** Pays every finished book not yet paid (mutates `profile`). Returns the names of the books paid. */
export function claimBooks(profile: Profile, now: string): string[] {
  const paid: string[] = [];
  for (const b of BOOKS.books) {
    if (!bookComplete(profile, b) || !claim(profile, bookKey(b.id), now)) continue;
    pay(profile, b.reward);
    paid.push(b.name);
  }
  return paid;
}

/** Track points from what the account has done. Finished books count whether or not they were paid yet. */
export function trackPoints(p: Profile): number {
  const w = BOOKS.track.weights;
  const books = BOOKS.books.filter((b) => bookComplete(p, b)).length;
  return Math.floor(p.speciesCaught.length * w.caught + p.speciesShiny.length * w.shiny + Object.keys(p.achievements).length * w.achievement + p.stats.runsEnded * w.runEnded + books * w.book);
}

export const trackTier = (p: Profile): number => BOOKS.track.tiers.filter((t) => trackPoints(p) >= t.points).length;

/** Pays every Track tier reached and not yet paid (mutates `profile`). Returns the number of tiers paid. */
export function claimTrack(profile: Profile, now: string): number {
  let paid = 0;
  BOOKS.track.tiers.forEach((t, i) => {
    if (trackPoints(profile) < t.points || !claim(profile, trackKey(i + 1), now)) return;
    pay(profile, t);
    paid += 1;
  });
  return paid;
}

/** Pays books first (they add Track points), then the Track. Returns a one-line message, or null if nothing was due. */
export function claimAll(profile: Profile, now: string): string | null {
  const books = claimBooks(profile, now);
  const tiers = claimTrack(profile, now);
  if (!books.length && !tiers) return null;
  return [books.length ? `Finished: ${books.join(', ')}.` : '', tiers ? `${tiers} Track tier${tiers > 1 ? 's' : ''} paid.` : ''].filter(Boolean).join(' ');
}

/** Returns a new profile after claiming. Throws when there is nothing to claim. */
export function claimAllProfile(current: Profile, now: string): { profile: Profile; message: string } {
  const profile = structuredClone(current);
  const message = claimAll(profile, now);
  if (!message) throw new Error('Nothing to claim yet.');
  return { profile, message };
}

export function booksProblems(content: Content): string[] {
  const out: string[] = [];
  for (const b of BOOKS.books) for (const s of b.species) if (!content.species.has(s)) out.push(`${b.id}: unknown species ${s}`);
  return out;
}
