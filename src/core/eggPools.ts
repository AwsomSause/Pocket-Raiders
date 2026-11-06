// Egg species pools (Overhaul slice 14). A Mystery Egg's tier is known before its species, so higher tiers draw from
// sturdier families (and, for Rare and up, special forms); region-native families are likelier; a family you already
// laid an egg for turns up less. Eligibility (wild-eligible, legendary caps) is checked first. No save changes:
// the per-family count lives in `run.itemCounters` (`egg-fam:<family>`).

import { z } from 'zod';
import eggsJson from '../data/eggs.json';
import type { Content, Species } from './contentSchema';
import { eggTier, EGGS } from './eggs';
import { familyId } from './mastery';
import { eggRarityWeight } from './rarity';
import { hashSeed, Rng } from './rng';
import type { RunState } from './state';
import { baseStatTotal, isNative, isWildEligible } from './themes';

export const EggPoolsSchema = z.object({
  note: z.string(),
  repeatPenalty: z.number().gt(0).lt(1),
  minWeight: z.number().gt(0).lte(1),
  tiers: z.record(z.string(), z.object({ minFinalBst: z.number().min(0), nativeWeight: z.number().gte(1), allowSpecialForms: z.boolean() })),
});
export const EGG_POOLS = EggPoolsSchema.parse((eggsJson as { pools: unknown }).pools);

const finalBst = new WeakMap<Content, Map<string, number>>();
/** The highest base stat total in a species' family (what the Egg grows into). */
export function familyTopBst(content: Content, family: string): number {
  let m = finalBst.get(content);
  if (!m) {
    m = new Map();
    for (const s of content.species.values()) {
      const f = familyId(content, s.id);
      m.set(f, Math.max(m.get(f) ?? 0, baseStatTotal(s)));
    }
    finalBst.set(content, m);
  }
  return m.get(family) ?? 0;
}

/** The tier the next Egg will be (mirrors the roll inside layEgg, which hashes the seed and the egg count). */
export function nextEggTier(run: Pick<RunState, 'seed' | 'itemCounters'>, origin: string): string {
  const o = EGGS.origins[origin];
  if (!o) return 'ordinary';
  const n = (run.itemCounters?.['eggs-laid'] ?? 0) + 1;
  const rng = new Rng(hashSeed(`${run.seed}::egg-tier::${n}`));
  const entries = Object.entries(o.weights);
  let roll = rng.float() * entries.reduce((a, [, w]) => a + w, 0);
  for (const [id, w] of entries) {
    roll -= w;
    if (roll < 0) return id;
  }
  return entries[entries.length - 1]![0];
}

/** Candidate first-stage species with weights for an Egg of this tier. Never empty (falls back to every wild-eligible first stage). */
export function eggPool(content: Content, run: Pick<RunState, 'itemCounters' | 'regionOrder' | 'regionIndex'>, tierId: string): { speciesId: string; weight: number }[] {
  const rule = EGG_POOLS.tiers[eggTier(tierId).id] ?? EGG_POOLS.tiers.ordinary!;
  const region = run.regionOrder?.[run.regionIndex ?? 0];
  const ok = (s: Species) => s.evolutionStage === 1 && isWildEligible(content, s, rule.allowSpecialForms);
  const all = [...content.species.values()].filter(ok).sort((a, b) => a.id.localeCompare(b.id));
  const strong = all.filter((s) => familyTopBst(content, familyId(content, s.id)) >= rule.minFinalBst);
  return (strong.length > 0 ? strong : all).map((s) => {
    const seen = run.itemCounters?.[`egg-fam:${familyId(content, s.id)}`] ?? 0;
    return { speciesId: s.id, weight: (isNative(content, s, region) ? rule.nativeWeight : 1) * Math.max(EGG_POOLS.minWeight, EGG_POOLS.repeatPenalty ** seen) * eggRarityWeight(content, s.id) };
  });
}

/** Picks the species of the next Mystery-style Egg from its tier's pool. */
export function pickEggFamily(content: Content, run: Pick<RunState, 'seed' | 'itemCounters' | 'regionOrder' | 'regionIndex'>, origin: string, rng: Rng): string {
  const pool = eggPool(content, run, nextEggTier(run, origin));
  const live = pool.filter((p) => p.weight > 0);
  return rng.weighted((live.length > 0 ? live : pool.map((p) => ({ ...p, weight: 1 }))).map((p) => ({ item: p.speciesId, weight: p.weight })));
}
