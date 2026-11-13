// Rival overhaul core (Beta 0.6 R1-R3, R10): role/id lock, Lead -3..+3, Marks (max 5), six feelings (0-10) and
// first-stage pity. Pure and deterministic: no random numbers. State lives in run.expansion.rival[id], per run only
// (no cross-run rival memory). Nothing here changes a level except the pity helper's returned delta.

import { z } from 'zod';
import json from '../../data/rivalOverhaul.json';
import { fnv1a } from '../story/moments';
import type { Rival } from '../story/schema';
import type { RunState } from '../state';
import { FEELING_KEYS, type FeelingKey, type RivalOverhaulState } from './overhaulSchema';

export { FEELING_KEYS };
export type { FeelingKey, RivalOverhaulState };

const FeelingMap = z.partialRecord(z.enum(FEELING_KEYS), z.number().int());
export const RivalOverhaulDataSchema = z.object({
  note: z.string(),
  roles: z.array(z.enum(['main', 'friend'])).min(1),
  personalities: z.record(z.string(), z.string()).refine((m) => Object.keys(m).length === 8, 'eight personalities'),
  styles: z.array(z.string()).length(8),
  arcs: z.array(z.string()).length(8),
  lead: z.object({ min: z.number().int(), max: z.number().int(), rivalWon: z.number().int(), rivalLost: z.number().int() }),
  marks: z.object({ max: z.number().int().min(1), names: z.array(z.string()).min(1) }),
  feelings: z.object({ min: z.number().int(), max: z.number().int(), start: z.object({ friendship: z.number().int(), respect: z.number().int(), trust: z.number().int(), rivalry: z.number().int(), resentment: z.number().int(), admiration: z.number().int() }), changes: z.record(z.string(), FeelingMap) }),
  pity: z.object({ afterLosses: z.number().int().min(1), levelDelta: z.number().int(), aiTier: z.number().int(), firstStageMax: z.number().int().min(0) }),
});
export const OVERHAUL = RivalOverhaulDataSchema.parse(json);

export type RivalRole = 'main' | 'friend';
export type FeelingEvent = keyof typeof OVERHAUL.feelings.changes;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export const overhaulOn = (run: RunState): boolean => run.expansion?.rival !== undefined;

/** The rival's overhaul record, if it was registered. */
export const overhaulOf = (run: RunState, id: string): RivalOverhaulState | undefined => run.expansion?.rival?.[id];

export interface RegisterInput {
  id: string;
  role: RivalRole;
  /** A pack personality key ("bitter-challenger"). Unknown keys fall back by stable index. */
  personality: string;
  style: string;
  arc: string;
}

/**
 * R1: registers a rival with its locked id, role, personality, style and arc. Registering again with the same id
 * returns the existing record untouched; the same id with another role is refused.
 */
export function registerRival(run: RunState, input: RegisterInput): RivalOverhaulState {
  const block = (run.expansion ??= {});
  const all = (block.rival ??= {});
  const have = all[input.id];
  if (have) {
    if (have.role !== input.role) throw new Error(`Rival ${input.id} is locked as ${have.role}, not ${input.role}`);
    return have;
  }
  if (!(input.personality in OVERHAUL.personalities)) throw new Error(`Unknown rival personality ${input.personality}`);
  if (!OVERHAUL.styles.includes(input.style)) throw new Error(`Unknown rival style ${input.style}`);
  if (!OVERHAUL.arcs.includes(input.arc)) throw new Error(`Unknown rival arc ${input.arc}`);
  // One main and one friend at most.
  for (const [id, r] of Object.entries(all)) if (r.role === input.role && id !== input.id) throw new Error(`The ${input.role} slot is already taken by ${id}`);
  const rec: RivalOverhaulState = { role: input.role, personality: input.personality, style: input.style, arc: input.arc, lead: 0, marks: [], feelings: { ...OVERHAUL.feelings.start }, pityLosses: 0 };
  all[input.id] = rec;
  return rec;
}

/** R1: the check run at battle start. Throws when the rival's id or role differs from what was locked. */
export function assertRivalLock(run: RunState, id: string, role: RivalRole): void {
  const have = overhaulOf(run, id);
  if (!have) return;
  if (have.role !== role) throw new Error(`Rival ${id} is locked as ${have.role} but entered battle as ${role}`);
}

/** The existing personality profile id a pack personality maps to (data: personalities). */
export const profileIdFor = (personality: string): string | undefined => OVERHAUL.personalities[personality];

/** R2: Lead after a result, kept in -3..+3. Lead never touches levels. */
export function leadAfter(lead: number, rivalWon: boolean): number {
  return clamp(lead + (rivalWon ? OVERHAUL.lead.rivalWon : OVERHAUL.lead.rivalLost), OVERHAUL.lead.min, OVERHAUL.lead.max);
}

/** R3: adds a mark (no duplicates, max 5, oldest dropped). Unknown names are refused. */
export function addMark(rec: RivalOverhaulState, mark: string): void {
  if (!OVERHAUL.marks.names.includes(mark)) throw new Error(`Unknown rival mark ${mark}`);
  if (rec.marks.includes(mark)) return;
  rec.marks.push(mark);
  if (rec.marks.length > OVERHAUL.marks.max) rec.marks.splice(0, rec.marks.length - OVERHAUL.marks.max);
}

/** R3: applies one row of the feelings change table, each feeling kept in 0..10. */
export function changeFeelings(rec: RivalOverhaulState, event: FeelingEvent): void {
  const row = OVERHAUL.feelings.changes[event];
  if (!row) throw new Error(`Unknown feeling event ${event}`);
  const { min, max } = OVERHAUL.feelings;
  for (const k of FEELING_KEYS) if (row[k]) rec.feelings[k] = clamp(rec.feelings[k] + row[k]!, min, max);
}

export interface RivalBattleResult {
  /** True when the rival won. */
  rivalWon: boolean;
  /** The stage index of the fight within its region (0-based). */
  stageIndex: number;
  /** Player hp left share 0..1 (for close/flawless feelings); optional. */
  playerHpShare?: number;
}

/** True for a fight that counts toward first-stage pity. */
export const isFirstStage = (stageIndex: number): boolean => stageIndex <= OVERHAUL.pity.firstStageMax;

/**
 * Records one finished rival battle: Lead, feelings, the first-stage pity counter. Returns false (and does nothing)
 * for a rival that was never registered, so the base game is untouched when the overhaul is off.
 */
export function recordRivalBattle(run: RunState, id: string, r: RivalBattleResult): boolean {
  const rec = overhaulOf(run, id);
  if (!rec) return false;
  rec.lead = leadAfter(rec.lead, r.rivalWon);
  changeFeelings(rec, r.rivalWon ? 'rivalWon' : 'rivalLost');
  if (r.rivalWon) addMark(rec, 'beat-you');
  else addMark(rec, 'beaten-by-you');
  if (r.playerHpShare !== undefined) {
    if (!r.rivalWon && r.playerHpShare <= 0.25) changeFeelings(rec, 'closeFight');
    if (!r.rivalWon && r.playerHpShare >= 1) changeFeelings(rec, 'flawlessWin');
  }
  if (r.rivalWon) rec.pityLosses = 0;
  else if (isFirstStage(r.stageIndex)) rec.pityLosses += 1;
  return true;
}

export interface Pity {
  active: boolean;
  /** Added to the rival's level. */
  levelDelta: number;
  /** AI tier to use instead of the normal one (null: unchanged). */
  aiTier: number | null;
  /** The rival gives advice (first-stage pity line). */
  advice: boolean;
}

/** R10: after 5 straight first-stage losses the rival is -2 levels, AI tier 3, and gives advice. */
export function pityFor(run: RunState, id: string): Pity {
  const rec = overhaulOf(run, id);
  const active = !!rec && rec.pityLosses >= OVERHAUL.pity.afterLosses;
  return active ? { active, levelDelta: OVERHAUL.pity.levelDelta, aiTier: OVERHAUL.pity.aiTier, advice: true } : { active: false, levelDelta: 0, aiTier: null, advice: false };
}

const pickBy = (list: readonly string[], seed: string): string => list[fnv1a(seed) % list.length]!;

/**
 * Registers an existing story rival (hash-stable, no random draw): its pack personality is the one whose profile id
 * matches its archetype, else chosen by its id; style and arc keep the rival's own when they are in the overhaul's lists.
 */
export function registerFromRival(run: RunState, rival: Pick<Rival, 'id' | 'archetype' | 'style' | 'arc'>, role: RivalRole): RivalOverhaulState {
  const keys = Object.keys(OVERHAUL.personalities);
  const personality = keys.find((k) => OVERHAUL.personalities[k] === rival.archetype) ?? pickBy(keys, `${rival.id}:personality`);
  const style = OVERHAUL.styles.includes(rival.style) ? rival.style : pickBy(OVERHAUL.styles, `${rival.id}:style`);
  const arc = rival.arc && OVERHAUL.arcs.includes(rival.arc.id) ? rival.arc.id : pickBy(OVERHAUL.arcs, `${rival.id}:arc`);
  return registerRival(run, { id: rival.id, role, personality, style, arc });
}
