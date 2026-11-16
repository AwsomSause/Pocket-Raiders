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
type Route = EvilTeam['routes'][number];
const STEPS = [2, 4, 6, 8, 10];
/** The team's inside route in this region (its rank titles, Standing steps and Suspicion marks), if one is written. */
export const routeOf = (team: EvilTeam | undefined, region: string | undefined): Route | undefined => team?.routes.find((r) => r.region === region);
/** Rank 1 on the day of the Offer; each Standing step (2, 4, 6, 8 and 10 unless the route says otherwise) raises it; Act scenes may raise it further. Never above 6. */
export const rankOf = (run: RunState, teamId: string, route?: Route): number => {
  const standing = standingOf(run, teamId);
  return Math.min(6, Math.max(1 + (route?.steps ?? STEPS).filter((n) => standing >= n).length, read(run, key(teamId, 'rank'))));
};

/** The rank titles for the team in this region (evilTeams.json `routes`), or numbers when the team has none written. */
export function rankTitle(team: EvilTeam, region: string | undefined, rank: number): string {
  return routeOf(team, region)?.ranks[rank - 1] ?? `Rank ${rank}`;
}

/** Applies the inside route's meters. Returns the change in words. */
export function applyInside(run: RunState, team: EvilTeam, region: string | undefined, e: { standing?: number; suspicion?: number; rank?: number }): string[] {
  const words: string[] = [];
  const route = routeOf(team, region);
  const max = route?.max ?? 10;
  const test = route?.test ?? 7;
  const out = route?.out ?? 10;
  const before = rankOf(run, team.id, route);
  if (e.standing) {
    const now = Math.max(0, Math.min(max, standingOf(run, team.id) + e.standing));
    run.story.flags[key(team.id, 'standing')] = now;
    words.push(`Standing ${e.standing > 0 ? '+' : ''}${e.standing} (${now}/${max})`);
  }
  if (e.suspicion) {
    // The Inside Man meets a handler: every rise is one more.
    // A careful recruit (said nothing at the first question) starts one lower: the first rise is one less.
    let by = e.suspicion > 0 && read(run, key(team.id, 'inside-man')) > 0 ? e.suspicion + 1 : e.suspicion;
    if (by > 0 && read(run, key(team.id, 'careful')) > 0) { by -= 1; delete run.story.flags[key(team.id, 'careful')]; }
    const now = Math.max(0, Math.min(10, suspicionOf(run, team.id) + by));
    run.story.flags[key(team.id, 'suspicion')] = now;
    if (by !== 0) words.push(`Suspicion ${by > 0 ? '+' : ''}${by} (${now}/10)${now >= out ? ': you have been found out' : now >= test ? ': they mean to test you' : ''}`);
  }
  if (e.rank) run.story.flags[key(team.id, 'rank')] = Math.max(read(run, key(team.id, 'rank')), e.rank);
  const after = rankOf(run, team.id, route);
  if (after > before) words.push(`you are ${rankTitle(team, region, after)} now (Rank ${after})`);
  return words;
}

/** The Story screen's line for the inside route. */
export function insideLine(run: RunState, team: EvilTeam, region: string | undefined): string | null {
  if (!insideOn(run, team.id)) return null;
  const route = routeOf(team, region);
  const rank = rankOf(run, team.id, route);
  const man = read(run, key(team.id, 'inside-man')) > 0 ? ' You report to a handler outside.' : '';
  return `Inside ${team.name}: ${rankTitle(team, region, rank)} (Rank ${rank}). Standing ${standingOf(run, team.id)}/${route?.max ?? 10}, Suspicion ${suspicionOf(run, team.id)}/10.${man}`;
}

/**
 * Hoenn (HOENN_TEAMS 1.1, 3.9): the player joins the region's other team. At the Offer nothing is carried; at the
 * Counter-Offer (`demote`) the inside route crosses with them one rank lower, with Standing at that rank's step and no
 * Suspicion yet. The old team's marks are cleared.
 */
export function crossInside(run: RunState, from: EvilTeam, to: EvilTeam, region: string | undefined, demote: boolean): void {
  if (demote && insideOn(run, from.id)) {
    const rank = Math.max(1, rankOf(run, from.id, routeOf(from, region)) - 1);
    const steps = routeOf(to, region)?.steps ?? STEPS;
    run.story.flags[key(to.id, 'inside')] = 1;
    run.story.flags[key(to.id, 'rank')] = rank;
    run.story.flags[key(to.id, 'standing')] = rank > 1 ? steps[rank - 2]! : 0;
    for (const m of ['third', 'confided'] as const) if (read(run, key(from.id, m)) > 0) run.story.flags[key(to.id, m)] = 1;
  }
  clearInside(run, from.id);
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
export function insideMet(run: RunState, teamId: string, c: { inside?: boolean; rank?: number; standing?: number; suspicion?: number; suspicionBelow?: number }, route?: Route): boolean {
  if (c.inside !== undefined && insideOn(run, teamId) !== c.inside) return false;
  if (c.rank !== undefined && rankOf(run, teamId, route) < c.rank) return false;
  if (c.standing !== undefined && standingOf(run, teamId) < c.standing) return false;
  if (c.suspicion !== undefined && suspicionOf(run, teamId) < c.suspicion) return false;
  if (c.suspicionBelow !== undefined && suspicionOf(run, teamId) >= c.suspicionBelow) return false;
  return true;
}
