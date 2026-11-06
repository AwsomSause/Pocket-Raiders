// Co-op Draft Mode (idea S202): two players on one device alternate picks from a shared, seeded pool and end with one
// team of six, shared as a team code. Uses its own seeded shuffle (never a gameplay stream). Pure.

import { hashSeed, Rng } from '../rng';
import { encodeTeamCode, type TeamMember } from '../shareCodes';

export const COOP_SIZE = 6;
export const COOP_POOL = 14;

export interface CoopDraft {
  names: [string, string];
  pool: string[];
  picks: { speciesId: string; by: 0 | 1 }[];
}

/** A pool of `COOP_POOL` different species from `ids`, shuffled by the seed. Fewer ids than a full draft need is refused. */
export function startCoop(ids: readonly string[], seed: string, names: [string, string]): CoopDraft | { problem: string } {
  const unique = [...new Set(ids)].sort();
  if (unique.length < COOP_SIZE) return { problem: 'Not enough Pokémon to draft from.' };
  const rng = new Rng(hashSeed(`${seed}#coop`));
  const pool = rng.shuffle(unique).slice(0, Math.min(COOP_POOL, unique.length));
  const clean = (n: string, fallback: string) => n.trim().slice(0, 16) || fallback;
  return { names: [clean(names[0], 'Player 1'), clean(names[1], 'Player 2')], pool, picks: [] };
}

export const draftDone = (d: CoopDraft): boolean => d.picks.length >= COOP_SIZE;
/** 0 picks first, then 1, then back (a plain alternate). */
export const whoseTurn = (d: CoopDraft): 0 | 1 => (d.picks.length % 2) as 0 | 1;
export const remaining = (d: CoopDraft): string[] => d.pool.filter((id) => !d.picks.some((p) => p.speciesId === id));

export function pick(d: CoopDraft, speciesId: string): CoopDraft | { problem: string } {
  if (draftDone(d)) return { problem: 'The team is full.' };
  if (!d.pool.includes(speciesId)) return { problem: 'That Pokémon is not in the pool.' };
  if (d.picks.some((p) => p.speciesId === speciesId)) return { problem: 'Already picked.' };
  return { ...d, picks: [...d.picks, { speciesId, by: whoseTurn(d) }] };
}

/** The finished team (empty until the draft is done) and its share code. */
export function coopTeam(d: CoopDraft, level = 5): { team: TeamMember[]; code: string | null } {
  const team = draftDone(d) ? d.picks.map((p) => ({ speciesId: p.speciesId, level, shiny: false })) : [];
  return { team, code: team.length ? encodeTeamCode(team) : null };
}
