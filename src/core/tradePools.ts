// Generated trades (Overhaul slice 15). The Trade Post offer for one of your Pokémon comes from one of five pools:
// fair, regional, rare, themed (shares a type) and risky (much stronger base stats, but arrives lower-level).
// Eligibility first (the caller passes each pool's eligible species), then a weighted pick of the pool and of the species.
// Everything is rolled from a hash of the seed, stop and Pokémon, so previews and reloads never change an offer. No save changes.

import { z } from 'zod';
import json from '../data/trades.json';
import type { Rng } from './rng';

export const TRADE_POOL_IDS = ['fair', 'regional', 'rare', 'themed', 'risky'] as const;
export type TradePoolId = (typeof TRADE_POOL_IDS)[number];

export const TradesSchema = z.object({
  note: z.string(),
  riskySpread: z.number().gt(0),
  pools: z.object(Object.fromEntries(TRADE_POOL_IDS.map((id) => [id, z.object({ name: z.string(), weight: z.number().gt(0), levelOffset: z.number().int().max(0), line: z.string() })])) as Record<TradePoolId, z.ZodObject<{ name: z.ZodString; weight: z.ZodNumber; levelOffset: z.ZodNumber; line: z.ZodString }>>),
});
export const TRADES = TradesSchema.parse(json);

export interface GeneratedTrade {
  speciesId: string;
  pool: TradePoolId;
  /** Added to your Pokémon's level for the one you receive (never below level 1 where used). */
  levelOffset: number;
}

/** Picks a pool by weight among those with candidates, then a species inside it; null when no pool has a candidate. */
export function pickTrade(rng: Rng, candidates: Partial<Record<TradePoolId, readonly string[]>>): GeneratedTrade | null {
  const live = TRADE_POOL_IDS.filter((id) => (candidates[id]?.length ?? 0) > 0);
  if (live.length === 0) return null;
  const pool = rng.weighted(live.map((id) => ({ item: id, weight: TRADES.pools[id].weight })));
  const list = candidates[pool]!;
  return { speciesId: list[rng.int(0, list.length - 1)]!, pool, levelOffset: TRADES.pools[pool].levelOffset };
}
