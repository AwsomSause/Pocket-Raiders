// The shared generator (Overhaul slice 3, THE OVERHAUL.md rule 1: controlled randomness).
// Every random pick follows the same two steps: first eligibility (the caller's pool, with its own
// weights), then diversity (anything picked recently in the same pool is down-weighted, never
// removed, so a pool can't run dry). What was picked is remembered per pool on the run
// (run.history, run save v39); the window and penalty live in balance.json `variety`.
//
// Pools are keyed by name ('wild' today; eggs, trades and trainer teams join in their own slices).
// A pool with no window in balance.json keeps no history and changes no weight.
// It never draws from an RNG itself, so it adds no stream and moves no other roll.

import type { Content } from './contentSchema';
import type { Rng } from './rng';
import type { RunState } from './state';

export type VarietyPool = string;

/** How many recent picks a pool remembers (0 when it keeps none). */
export function varietyWindow(content: Content, pool: VarietyPool): number {
  return content.balance.variety.window[pool] ?? 0;
}

/** The recent picks of a pool, oldest first. */
export function recentPicks(run: Pick<RunState, 'history'>, pool: VarietyPool): readonly string[] {
  return run.history[pool] ?? [];
}

/** The weight multiplier for `key` in a pool: the penalty if it was picked within the window, else 1. */
export function varietyWeight(content: Content, run: Pick<RunState, 'history'>, pool: VarietyPool): (key: string) => number {
  const window = varietyWindow(content, pool);
  if (window <= 0) return () => 1;
  const recent = new Set(recentPicks(run, pool).slice(-window));
  const { penalty } = content.balance.variety;
  return (key) => (recent.has(key) ? penalty : 1);
}

export interface Candidate<T> {
  item: T;
  /** What the history remembers (a species family, an event id...). */
  key: string;
  weight: number;
}

/**
 * Eligibility, then diversity: picks one candidate with weight > 0, its weight multiplied by
 * varietyWeight. Throws only when nothing is eligible (the caller's pool is empty).
 */
export function pickVaried<T>(content: Content, run: Pick<RunState, 'history'>, pool: VarietyPool, candidates: readonly Candidate<T>[], rng: Rng): T {
  const eligible = candidates.filter((c) => c.weight > 0);
  if (eligible.length === 0) throw new Error(`Nothing eligible in the "${pool}" pool`);
  const w = varietyWeight(content, run, pool);
  return rng.weighted(eligible.map((c) => ({ item: c.item, weight: c.weight * w(c.key) })));
}

/** Remembers a pick, keeping only the window's worth. Does nothing for a pool with no window. */
export function rememberPick(content: Content, run: Pick<RunState, 'history'>, pool: VarietyPool, key: string): void {
  const window = varietyWindow(content, pool);
  if (window <= 0) return;
  run.history = { ...run.history, [pool]: [...recentPicks(run, pool), key].slice(-window) };
}
