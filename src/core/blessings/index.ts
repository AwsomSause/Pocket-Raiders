// Legendary Blessings (Beta 0.7, workstream 5: INSTRUMENTALITY L1 + L2). One blessing per run, rolled once at run start
// from its own hashed stream (`::blessing-tier::` / `::blessing-pick::`), so no existing roll changes. In-run only: nothing here
// is saved to the profile. Pure rules + Zod, no Phaser. Data: src/data/blessings.json (hand-written; status per entry).

import { z } from 'zod';
import raw from '../../data/blessings.json';
import type { Content } from '../contentSchema';
import { hashSeed, Rng } from '../rng';
import { maxHp } from '../pokemon';
import type { RunState } from '../state';

export const BLESSING_TIERS = ['lesser', 'greater', 'divine', 'primordial', 'origin'] as const;
export type BlessingTier = (typeof BLESSING_TIERS)[number];

const BlessingDefSchema = z.object({
  id: z.string().min(1), name: z.string().min(1), legendary: z.string().min(1), speciesId: z.string().min(1),
  tier: z.enum(BLESSING_TIERS), item: z.string().min(1), objectText: z.string().min(1), passage: z.string().min(1),
  headline: z.string().min(1), summary: z.string().min(1),
  effect: z.object({ kind: z.enum(['none', 'healMostHurt', 'shopDiscount', 'sacredAsh']) }),
  status: z.enum(['supported', 'limited', 'disabled']), limits: z.string(),
});
export type BlessingDef = z.infer<typeof BlessingDefSchema>;

const FileSchema = z.object({
  tiers: z.record(z.enum(BLESSING_TIERS), z.object({ chance: z.number().positive(), influence: z.number().int().min(0) })),
  balance: z.object({ lele: z.object({ healPercent: z.number() }), fezandipiti: z.object({ discountPercent: z.number() }) }),
  blessings: z.array(BlessingDefSchema).min(1),
});
const data = FileSchema.parse(raw);
export const BLESSINGS: readonly BlessingDef[] = data.blessings;
export const BLESSING_TIER_ODDS = data.tiers;

/** The run's blessing. Optional on the run (old saves have none; no save-version bump). */
export const BlessingStateSchema = z.object({
  id: z.string(),
  tier: z.enum(BLESSING_TIERS),
  /** Hidden "attention" score. Starts at the tier's value; Signs, Echoes and the Trial are not built yet, so nothing raises it. */
  influence: z.number().int().min(0),
  /** The opening has been shown (so resuming a saved run does not replay it). */
  seen: z.boolean().default(false),
  /** Regions where Sacred Ash has already been used. */
  ashRegions: z.array(z.number().int()).default([]),
});
export type BlessingState = z.infer<typeof BlessingStateSchema>;

export const getBlessing = (id: string): BlessingDef | undefined => BLESSINGS.find((b) => b.id === id);
const playable = (b: BlessingDef): boolean => b.status !== 'disabled';

/**
 * Rolls the tier (45/30/17/6.5/1.5), then a blessing inside it. A tier with no playable blessing falls to the next lower tier
 * that has one, then upward, so a run always gets one while the roster is still growing. Pure: same seed, same answer.
 */
export function rollBlessing(seed: string): BlessingState | null {
  const pool = BLESSINGS.filter(playable);
  if (pool.length === 0) return null;
  const tierRng = new Rng(hashSeed(`${seed}::blessing-tier`));
  const total = BLESSING_TIERS.reduce((s, t) => s + data.tiers[t]!.chance, 0);
  let roll = tierRng.float() * total;
  let tier: BlessingTier = BLESSING_TIERS[BLESSING_TIERS.length - 1]!;
  for (const t of BLESSING_TIERS) {
    roll -= data.tiers[t]!.chance;
    if (roll < 0) { tier = t; break; }
  }
  const at = BLESSING_TIERS.indexOf(tier);
  const order = [...BLESSING_TIERS.slice(0, at + 1).reverse(), ...BLESSING_TIERS.slice(at + 1)];
  const useTier = order.find((t) => pool.some((b) => b.tier === t))!;
  const inTier = pool.filter((b) => b.tier === useTier);
  const pick = inTier[new Rng(hashSeed(`${seed}::blessing-pick`)).int(0, inTier.length - 1)]!;
  return { id: pick.id, tier: pick.tier, influence: data.tiers[pick.tier]!.influence, seen: false, ashRegions: [] };
}

/** Run start: gives the run its blessing when the setting was on (stored once; never changes). */
export function assignBlessing(run: RunState): void {
  const b = rollBlessing(run.seed);
  if (b) run.expansion = { ...run.expansion, blessing: b };
}

/** The run's blessing definition, or undefined (setting off, old save, or disabled entry). */
export function runBlessing(run: RunState): BlessingDef | undefined {
  const id = run.expansion?.blessing?.id;
  const def = id ? getBlessing(id) : undefined;
  return def && playable(def) ? def : undefined;
}

/** Price factor for shops (Fezandipiti): 0.9 with the blessing, otherwise 1. */
export function blessingShopFactor(run: RunState): number {
  return runBlessing(run)?.effect.kind === 'shopDiscount' ? 1 - data.balance.fezandipiti.discountPercent / 100 : 1;
}

/**
 * After a fight that was not lost (mutates `run`, runs before a Nuzlocke burial):
 * Sacred Ash revives every fainted Pokémon once per region; Tapu Lele heals the most hurt living Pokémon 10%.
 * Returns the names' uids it touched (for tests and the journal).
 */
export function blessingAfterBattle(content: Content, run: RunState): string[] {
  const def = runBlessing(run);
  const state = run.expansion?.blessing;
  if (!def || !state) return [];
  const touched: string[] = [];
  if (def.effect.kind === 'sacredAsh' && !state.ashRegions.includes(run.regionIndex)) {
    const fallen = run.party.filter((m) => m.hp <= 0 && m.uid !== run.battle?.loaner);
    if (fallen.length > 0) {
      for (const m of fallen) { m.hp = maxHp(content, m); m.status = null; touched.push(m.uid); }
      state.ashRegions = [...state.ashRegions, run.regionIndex];
    }
  }
  if (def.effect.kind === 'healMostHurt') {
    let worst: { uid: string; missing: number } | null = null;
    for (const m of run.party) {
      if (m.hp <= 0 || m.uid === run.battle?.loaner) continue;
      const missing = maxHp(content, m) - m.hp;
      if (missing > 0 && (!worst || missing > worst.missing)) worst = { uid: m.uid, missing };
    }
    if (worst) {
      const m = run.party.find((p) => p.uid === worst!.uid)!;
      m.hp = Math.min(maxHp(content, m), m.hp + Math.max(1, Math.ceil(maxHp(content, m) * data.balance.lele.healPercent / 100)));
      touched.push(m.uid);
    }
  }
  return touched;
}
