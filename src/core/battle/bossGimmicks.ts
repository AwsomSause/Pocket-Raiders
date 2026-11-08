// Boss gimmicks: every Gym Leader, Elite Four member and Champion has a fixed order of battle gimmicks (Mega, Tera,
// Z-Move, Dynamax) and, for each, a designated Pokémon (src/data/bossGimmicks.json, built by tools/build-boss-gimmicks.ts).
// How many they may use grows with the run: none up to Stage 5 of Region 1, then one; one more after Stage 5 of every
// later region, up to all four. Pure: no gameplay RNG, so the same team always gets the same plan.

import { z } from 'zod';
import type { Content, TransformKind } from '../contentSchema';
import type { PokemonInstance } from '../state';
import raw from '../../data/bossGimmicks.json';
import { bossZMove, stoneForms } from './transform';

export type BossGimmick = Exclude<TransformKind, 'primal' | 'gigantamax' | 'ability'>;
export const BOSS_GIMMICKS = ['mega', 'tera', 'zmove', 'dynamax'] as const satisfies readonly BossGimmick[];
const KindSchema = z.enum(BOSS_GIMMICKS);

/** bossGimmicks.json: per boss, the gimmicks in the order it earns them and the species each is designated to. */
export const BossGimmicksFileSchema = z.record(
  z.string(),
  z.object({ order: z.array(KindSchema).min(1).max(4), mons: z.partialRecord(KindSchema, z.string()) }),
);
export type BossGimmickEntry = z.infer<typeof BossGimmicksFileSchema>[string];
export const bossGimmickData = BossGimmicksFileSchema.parse(raw);

/**
 * How many gimmicks a boss may use. `stageInRegion` is the 1-based stage of the region (null for the Elite Four and the
 * Champion, who come after every stage). Region 1 (index 0): none until past `afterStage`, then 1; each later region adds one.
 */
export function gimmickSlots(regionIndex: number, stageInRegion: number | null, afterStage: number): number {
  const past = stageInRegion === null || stageInRegion > afterStage;
  return Math.max(0, Math.min(BOSS_GIMMICKS.length, regionIndex + (past ? 1 : 0)));
}

/** Can this Pokémon carry the gimmick in this battle? */
export function canCarry(content: Content, mon: PokemonInstance, kind: BossGimmick): boolean {
  if (kind === 'mega') return stoneForms(content, mon.speciesId, false).length > 0;
  if (kind === 'zmove') return bossZMove(content, mon) !== null;
  return true;
}

/**
 * The plan for one battle: uid -> gimmick. Each kind goes to its designated species if it is on the team (and can carry it),
 * otherwise to the best other member (the ace first). One gimmick per Pokémon; kinds nobody can carry are skipped.
 */
export function planBossGimmicks(
  content: Content, bossId: string | null | undefined, team: readonly PokemonInstance[], slots: number, disabled: readonly TransformKind[] = [],
): Record<string, BossGimmick> {
  const entry = bossId ? bossGimmickData[bossId] : undefined;
  const plan: Record<string, BossGimmick> = {};
  if (!entry || slots <= 0) return plan;
  let given = 0;
  for (const kind of entry.order) {
    if (given >= slots) break;
    if (disabled.includes(kind)) continue;
    const free = team.filter((m) => !plan[m.uid] && canCarry(content, m, kind));
    const target = free.find((m) => m.speciesId === entry.mons[kind]) ?? free[free.length - 1];
    if (!target) continue;
    plan[target.uid] = kind;
    given += 1;
  }
  return plan;
}
