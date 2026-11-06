// Leaderboard by Seed (idea S201): ranks the runs played on one seed. Local rows come from the run history (no save
// change); friends' scores come from the ghosts and challenge cards the player already keeps for that seed, so the
// "shared board" is built from codes passed by hand. Runs that used the debug tools never rank. Pure.

import type { RunRecord } from '../state';

export interface BoardScore { name: string; victory: boolean; regionsCleared: number; badges: number; encounters: number; mine: boolean }

/** Wins first, then more regions, then more badges, then fewer encounters (a faster win). */
export function rankScores(scores: BoardScore[]): BoardScore[] {
  return [...scores].sort((a, b) => Number(b.victory) - Number(a.victory) || b.regionsCleared - a.regionsCleared || b.badges - a.badges || a.encounters - b.encounters || a.name.localeCompare(b.name));
}

export function localScores(history: readonly RunRecord[], seed: string): BoardScore[] {
  return history.filter((r) => r.seed === seed && !r.assisted).map((r) => ({ name: 'You', victory: r.victory, regionsCleared: r.regionsCleared, badges: r.badges, encounters: r.encounters, mine: true }));
}

/** Seeds with at least one counted run, most-played first. */
export function playedSeeds(history: readonly RunRecord[]): { seed: string; runs: number }[] {
  const n = new Map<string, number>();
  for (const r of history) if (!r.assisted) n.set(r.seed, (n.get(r.seed) ?? 0) + 1);
  return [...n].map(([seed, runs]) => ({ seed, runs })).sort((a, b) => b.runs - a.runs || a.seed.localeCompare(b.seed));
}

export interface FriendScore { from: string; victory: boolean; badges: number; encounters: number }

/** The board for one seed: your runs plus an optional friend's ghost, ranked. Friends have no region count, so it is 0. */
export function seedLeaderboard(history: readonly RunRecord[], seed: string, friend: FriendScore | null, top = 10): BoardScore[] {
  const rows = localScores(history, seed);
  if (friend) rows.push({ name: friend.from, victory: friend.victory, regionsCleared: 0, badges: friend.badges, encounters: friend.encounters, mine: false });
  return rankScores(rows).slice(0, top);
}

export const scoreLine = (s: BoardScore, place: number): string => `${place}. ${s.name}: ${s.victory ? 'won' : 'lost'}, ${s.badges} badges, ${s.encounters} encounters${s.regionsCleared ? `, ${s.regionsCleared} regions` : ''}`;
