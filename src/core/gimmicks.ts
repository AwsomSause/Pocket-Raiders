// Gimmick progression (S479 Mega Stone levels, S480 Dynamax Band levels, S482 Z-Ring attunement).
// Levels come from use: each Mega Stone and the Dynamax Band level up as you use them; a Z-Crystal's type attunes after
// enough hits with that type's moves (counted in the story histories). Effects: a Mega heals 10% per stone level, a
// Dynamax lasts one more turn per band level, and an unattuned Z-Crystal cannot be used yet.

import type { Content } from './contentSchema';
import type { RunState } from './state';

export interface GimmickContext {
  uses: Record<string, number>;
  /** Hits with moves of each type this run (all your Pokémon). */
  typeUses: Record<string, number>;
}

/** 0 to 3 for a number of uses. */
export function gimmickLevel(content: Content, uses: number): number {
  return content.balance.transformations.gimmick.levels.filter((n) => uses >= n).length;
}

export const stoneKey = (itemId: string) => `mega:${itemId}`;

/** What the battle needs to know about the run's gimmick use. */
export function gimmickContext(content: Content, run: Pick<RunState, 'gimmicks' | 'story'>): GimmickContext {
  const typeUses: Record<string, number> = {};
  for (const h of Object.values(run.story?.histories ?? {})) {
    for (const [id, n] of Object.entries(h.moves)) {
      const move = content.moves.get(id);
      if (move && move.category !== 'status') typeUses[move.type] = (typeUses[move.type] ?? 0) + n;
    }
  }
  return { uses: run.gimmicks?.uses ?? {}, typeUses };
}

/** Counts a player transformation (called from the story hook). */
export function noteGimmickUse(run: Pick<RunState, 'gimmicks'>, kind: string, itemId: string | null): void {
  const key = kind === 'mega' && itemId ? stoneKey(itemId) : kind;
  run.gimmicks.uses[key] = (run.gimmicks.uses[key] ?? 0) + 1;
}
