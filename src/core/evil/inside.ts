// Evil Teams Volume III: the story from inside (catalog overhaul row 8; rows 9 and 10 reuse it for their teams).
// A team makes the Offer once; a player who says yes walks the inside route instead of the team's outside steps:
// five Acts, Operations between them, the Final Choice and one of four endings. Two meters are kept as run flags so
// no save changes: Standing (0 to 10; the rank rises at 2, 4, 6, 8 and 10, never past the Leader) and Suspicion
// (0 to 10; a loyalty test at 7, found out at 10). The Inside Man (yes, and report it) gathers Suspicion faster.
// Everything here is cleared when the region's story closes, so a team that is home in two regions starts fresh.

import type { RunState } from '../state';
import type { EvilTeam } from './schema';

const mem = (key: string): string => `ev:${key}`;
const key = (teamId: string, name: string): string => mem(`team-${teamId}-${name}`);
const read = (run: RunState, k: string): number => Number(run.story.flags[k] ?? 0);

/** The engine's own marks, cleared with the region's story. Events write `inside`, `inside-man`, `third` and the rest with `mark`. */
export const INSIDE_MARKS = ['inside', 'inside-man', 'standing', 'suspicion', 'rank', 'found-out', 'loyalty-test', 'third', 'confided', 'careful'] as const;

export const insideOn = (run: RunState, teamId: string): boolean => read(run, key(teamId, 'inside')) > 0;
export const standingOf = (run: RunState, teamId: string): number => read(run, key(teamId, 'standing'));
export const suspicionOf = (run: RunState, teamId: string): number => read(run, key(teamId, 'suspicion'));
/** Rank 1 on the day of the Offer; Standing 2, 4, 6, 8 and 10 raise it; Act scenes may raise it further. Never above 6. */
export const rankOf = (run: RunState, teamId: string): number => Math.min(6, Math.max(1 + Math.floor(standingOf(run, teamId) / 2), read(run, key(teamId, 'rank'))));

/** The rank titles for the team in this region (evilTeams.json `routes`), or numbers when the team has none written. */
export function rankTitle(team: EvilTeam, region: string | undefined, rank: number): string {
  return team.routes.find((r) => r.region === region)?.ranks[rank - 1] ?? `Rank ${rank}`;
}

/** Applies the inside route's meters. Returns the change in words. */
export function applyInside(run: RunState, team: EvilTeam, region: string | undefined, e: { standing?: number; suspicion?: number; rank?: number }): string[] {
  const words: string[] = [];
  const before = rankOf(run, team.id);
  if (e.standing) {
    const now = Math.max(0, Math.min(10, standingOf(run, team.id) + e.standing));
    run.story.flags[key(team.id, 'standing')] = now;
    words.push(`Standing ${e.standing > 0 ? '+' : ''}${e.standing} (${now}/10)`);
  }
  if (e.suspicion) {
    // The Inside Man meets a handler: every rise is one more.
    // A careful recruit (said nothing at the first question) starts one lower: the first rise is one less.
    let by = e.suspicion > 0 && read(run, key(team.id, 'inside-man')) > 0 ? e.suspicion + 1 : e.suspicion;
    if (by > 0 && read(run, key(team.id, 'careful')) > 0) { by -= 1; delete run.story.flags[key(team.id, 'careful')]; }
    const now = Math.max(0, Math.min(10, suspicionOf(run, team.id) + by));
    run.story.flags[key(team.id, 'suspicion')] = now;
    if (by !== 0) words.push(`Suspicion ${by > 0 ? '+' : ''}${by} (${now}/10)${now >= 10 ? ': you have been found out' : now >= 7 ? ': they mean to test you' : ''}`);
  }
  if (e.rank) run.story.flags[key(team.id, 'rank')] = Math.max(read(run, key(team.id, 'rank')), e.rank);
  const after = rankOf(run, team.id);
  if (after > before) words.push(`you are ${rankTitle(team, region, after)} now (Rank ${after})`);
  return words;
}

/** The Story screen's line for the inside route. */
export function insideLine(run: RunState, team: EvilTeam, region: string | undefined): string | null {
  if (!insideOn(run, team.id)) return null;
  const rank = rankOf(run, team.id);
  const man = read(run, key(team.id, 'inside-man')) > 0 ? ' You report to a handler outside.' : '';
  return `Inside ${team.name}: ${rankTitle(team, region, rank)} (Rank ${rank}). Standing ${standingOf(run, team.id)}/10, Suspicion ${suspicionOf(run, team.id)}/10.${man}`;
}

/** The region's story is over: the inside route's meters and marks go with it. */
export function clearInside(run: RunState, teamId: string): void {
  for (const m of INSIDE_MARKS) delete run.story.flags[key(teamId, m)];
}

/**
 * The inside route replaces the outside story. With `inside` held, the team's steps from the third on (beat 2 and later),
 * its Operations, ambushes and the scenes that wait on the story are hidden unless they ask for the inside route themselves.
 * With a third option founded (`third`), the Hideout gives way to that team's own climax.
 */
export function replacedByInside(run: RunState, teamId: string, c: { beat?: number; after?: number; op?: string; heat?: number; inside?: boolean; anyRoute?: boolean }): boolean {
  if (c.inside !== undefined || c.anyRoute) return false;
  if (insideOn(run, teamId)) return (c.beat !== undefined && c.beat >= 2) || c.after !== undefined || c.op !== undefined || c.heat !== undefined;
  return c.beat === 6 && read(run, key(teamId, 'third')) > 0;
}

/** The inside route's conditions (all must hold). */
export function insideMet(run: RunState, teamId: string, c: { inside?: boolean; rank?: number; standing?: number; suspicion?: number; suspicionBelow?: number }): boolean {
  if (c.inside !== undefined && insideOn(run, teamId) !== c.inside) return false;
  if (c.rank !== undefined && rankOf(run, teamId) < c.rank) return false;
  if (c.standing !== undefined && standingOf(run, teamId) < c.standing) return false;
  if (c.suspicion !== undefined && suspicionOf(run, teamId) < c.suspicion) return false;
  if (c.suspicionBelow !== undefined && suspicionOf(run, teamId) >= c.suspicionBelow) return false;
  return true;
}
