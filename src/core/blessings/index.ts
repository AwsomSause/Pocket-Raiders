// Legendary Blessings (Beta 0.7, workstream 5: INSTRUMENTALITY L1 + L2). One blessing per run, rolled once at run start
// from its own hashed stream (`::blessing-tier::` / `::blessing-pick::`), so no existing roll changes. In-run only: nothing here
// is saved to the profile. Pure rules + Zod, no Phaser. Data: src/data/blessings.json (hand-written; status per entry).

import { z } from 'zod';
import raw from '../../data/blessings.json';
import { ArchetypeModifierSchema, type Content } from '../contentSchema';
import type { Perks } from '../archetypes';
import { isBossClass } from '../trainerPerks';
import { hashSeed, Rng } from '../rng';
import { maxHp } from '../pokemon';
import { grantRewinds, jsonCopy, rewindStage, stageRewindReady } from '../rewind';
import type { RunState } from '../state';

import { BLESSING_TIERS, BlessingStateSchema, type BlessingState, type BlessingTier } from './schema';
export { BLESSING_TIERS, type BlessingTier };

const BlessingDefSchema = z.object({
  id: z.string().min(1), name: z.string().min(1), legendary: z.string().min(1), speciesId: z.string().min(1),
  tier: z.enum(BLESSING_TIERS), item: z.string().min(1), objectText: z.string().min(1), passage: z.string().min(1),
  headline: z.string().min(1), summary: z.string().min(1),
  effect: z.object({ kind: z.enum(['none', 'healMostHurt', 'shopDiscount', 'sacredAsh', 'perks', 'rewinds']) }),
  /** Battle perks (the same rules trainers use) that this blessing adds. */
  perks: z.array(ArchetypeModifierSchema).default([]),
  /** The perks apply only to the first battle of each stage. */
  firstBattleOfStage: z.boolean().default(false),
  status: z.enum(['supported', 'limited', 'disabled']), limits: z.string(),
});
export type BlessingDef = z.infer<typeof BlessingDefSchema>;

const FileSchema = z.object({
  tiers: z.record(z.enum(BLESSING_TIERS), z.object({ chance: z.number().positive(), influence: z.number().int().min(0) })),
  balance: z.object({ lele: z.object({ healPercent: z.number(), communionPartyPercent: z.number() }), fezandipiti: z.object({ discountPercent: z.number(), communionDiscountPercent: z.number() }) }),
  blessings: z.array(BlessingDefSchema).min(1),
});
const data = FileSchema.parse(raw);
export const BLESSINGS: readonly BlessingDef[] = data.blessings;
export const BLESSING_TIER_ODDS = data.tiers;

export { BlessingStateSchema, type BlessingState };

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
  return { id: pick.id, tier: pick.tier, influence: data.tiers[pick.tier]!.influence, seen: false, ashRegions: [], communion: false, riteUsed: false, stagesDone: [] };
}

/** Run start: gives the run its blessing when the setting was on (stored once; never changes). */
export function assignBlessing(run: RunState): void {
  const b = rollBlessing(run.seed);
  if (b) run.expansion = { ...run.expansion, blessing: b };
  // Dialga's blessing is the Rewinds system, switched on for this run.
  if (b && getBlessing(b.id)?.effect.kind === 'rewinds') grantRewinds(run, 'blessing');
}

/** The run's blessing definition, or undefined (setting off, old save, or disabled entry). */
export function runBlessing(run: RunState): BlessingDef | undefined {
  const id = run.expansion?.blessing?.id;
  const def = id ? getBlessing(id) : undefined;
  return def && playable(def) ? def : undefined;
}

/** Price factor for shops (Fezandipiti): 0.9 with the blessing, otherwise 1. */
export function blessingShopFactor(run: RunState): number {
  if (runBlessing(run)?.effect.kind !== 'shopDiscount') return 1;
  const pct = run.expansion?.blessing?.communion ? data.balance.fezandipiti.communionDiscountPercent : data.balance.fezandipiti.discountPercent;
  return 1 - pct / 100;
}

/** Battle perks this blessing adds right now (empty for most). First-battle blessings drop out once the stage's first battle is done. */
export function blessingPerks(run: RunState): Perks {
  const def = runBlessing(run);
  if (!def || def.perks.length === 0) return [];
  if (def.firstBattleOfStage && run.stage && run.expansion?.blessing?.stagesDone.includes(`${run.regionIndex}:${run.stage.index}`)) return [];
  return def.perks;
}

/** Communion: obtaining the blessing's own Legendary (party or PC) turns the blessing into its stronger form. Returns true the moment it happens. */
export function syncCommunion(run: RunState): boolean {
  const state = run.expansion?.blessing;
  const def = runBlessing(run);
  if (!state || !def || state.communion) return false;
  if (![...run.party, ...run.box].some((m) => m.speciesId === def.speciesId)) return false;
  state.communion = true;
  run.journal = [...(run.journal ?? []), `${def.legendary} answered: the ${def.name} blessing is now in Communion.`];
  return true;
}

/** The Rite (once per run, after Communion): what it is and whether it can be used. Tapu Lele's heals the party; Dialga's goes back a stage. */
export function blessingRite(run: RunState): { label: string; hint: string; ready: boolean } | null {
  const def = runBlessing(run);
  const state = run.expansion?.blessing;
  if (!def || !state?.communion) return null;
  if (def.effect.kind === 'healMostHurt') return { label: 'Rite of Healing', hint: 'Restore the whole party fully, once this run.', ready: !state.riteUsed };
  if (def.effect.kind === 'rewinds') return { label: 'Rite of Time', hint: 'Go back to the start of this stage. Levels, moves and species are kept; items and events of the stage are not. Once this run, from the map.', ready: !state.riteUsed && run.phase === 'map' && stageRewindReady(run) };
  return null;
}

/** Uses the Rite. Returns the run to carry on with (Dialga's is a rebuilt run, Lele's the same one, mutated) and a message, or null when it can't be used. */
export function useBlessingRite(content: Content, run: RunState): { run: RunState; message: string } | null {
  const rite = blessingRite(run);
  if (!rite?.ready) return null;
  const kind = runBlessing(run)!.effect.kind;
  if (kind === 'rewinds') {
    const back = rewindStage(content, run, { keepTeam: true });
    if (!back) return null;
    // The blessing's own state is live, not the stage-start copy: no second Rite, no second Sacred Ash.
    back.expansion = { ...back.expansion, blessing: { ...jsonCopy(run.expansion!.blessing!), riteUsed: true } };
    return { run: back, message: 'Dialga turns the hourglass: the stage begins again.' };
  }
  for (const m of run.party) { m.hp = maxHp(content, m); m.status = null; }
  run.expansion!.blessing!.riteUsed = true;
  return { run, message: 'Tapu Lele scatters its petals: the whole party is restored.' };
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
  syncCommunion(run);
  if (def.firstBattleOfStage && run.stage) {
    const key = `${run.regionIndex}:${run.stage.index}`;
    if (!state.stagesDone.includes(key)) state.stagesDone = [...state.stagesDone, key];
  }
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
    // Communion: the rest of the party recovers a little too.
    if (state.communion) {
      for (const m of run.party) {
        if (m.hp <= 0 || m.uid === run.battle?.loaner || m.uid === worst?.uid) continue;
        m.hp = Math.min(maxHp(content, m), m.hp + Math.ceil(maxHp(content, m) * data.balance.lele.communionPartyPercent / 100));
      }
    }
  }
  // Ho-Oh in Communion: after a boss battle the first fainted Pokémon (party order) rises at half HP.
  if (def.effect.kind === 'sacredAsh' && state.communion && run.battle && isBossClass(run.battle.trainer?.classId)) {
    const m = run.party.find((p) => p.hp <= 0 && p.uid !== run.battle?.loaner);
    if (m) { m.hp = Math.max(1, Math.floor(maxHp(content, m) / 2)); touched.push(m.uid); }
  }
  return touched;
}
