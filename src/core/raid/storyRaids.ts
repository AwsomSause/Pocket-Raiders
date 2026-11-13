// Story raids of the evil teams (Beta 0.6 E5b): the result of each raid, its lever, and what a lost raid costs.
// Pure rules, no Phaser. State lives in run.expansion.raids (keys n1..n6) plus the lever flags in siege / apex / cast / cut
// (a raid may write nothing else, design 6.6). No random stream: the one roll (how many Pokémon are impounded) is hashed from seed + region + label.

import { z } from 'zod';
import raidData from '../../data/storyRaids.json';
import { Rng, hashSeed } from '../rng';
import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { impound, RESCUE, type Hold } from '../evil/rescue';
import { lastQuietNodeOfRegion, rescueNode } from '../evil/rescueGlue';

export const RAID_RESULTS = ['triumph', 'success', 'partial', 'failure', 'declined'] as const;
export type RaidResult = (typeof RAID_RESULTS)[number];
export const LEVER_STATES = ['broken', 'weakened', 'dented', 'strengthened', 'unchanged'] as const;

const ResultEffectSchema = z.object({
  os: z.number().int(),
  lever: z.enum(LEVER_STATES),
  phase: z.record(z.string(), z.number().int()).optional(),
  siege: z.record(z.string(), z.boolean()).optional(),
  apex: z.record(z.string(), z.boolean()).optional(),
  cast: z.record(z.string(), z.string()).optional(),
});
const RaidDefSchema = z.object({
  n: z.number().int().min(1).max(6),
  id: z.string(),
  team: z.string(),
  leverId: z.string(),
  gate: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('open') }),
    z.object({ kind: z.literal('after'), raid: z.number().int() }),
    z.object({ kind: z.literal('afterOrTrack'), raid: z.number().int(), trackStep: z.number().int() }),
  ]),
  failure: z.array(z.string()),
  results: z.object({ triumph: ResultEffectSchema, success: ResultEffectSchema, partial: ResultEffectSchema, failure: ResultEffectSchema, declined: ResultEffectSchema }),
});
const RaidDataSchema = z.object({
  bounds: z.object({ os: z.number().int(), phase: z.number().int(), gauntlet: z.number().int() }),
  impoundCount: z.object({ min: z.number().int(), max: z.number().int() }),
  raids: z.array(RaidDefSchema),
});
export const STORY_RAIDS = RaidDataSchema.parse(raidData);
export type StoryRaidDef = z.infer<typeof RaidDefSchema>;

/** What run.expansion.raids["n2"] holds. */
export const RaidRecordSchema = z.object({
  id: z.string(), result: z.enum(RAID_RESULTS), node: z.number().int(), os: z.number().int(),
  phase: z.record(z.string(), z.number().int()).default({}),
  impounded: z.number().int().min(0).default(0),
});
export type RaidRecord = z.infer<typeof RaidRecordSchema>;

export const raidDefByN = (n: number): StoryRaidDef | undefined => STORY_RAIDS.raids.find((r) => r.n === n);
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const keyOf = (n: number) => `n${n}`;

/** The recorded result of raid n, or null when it has not been resolved. */
export function raidRecord(run: RunState, n: number): RaidRecord | null {
  const raw = run.expansion?.raids?.[keyOf(n)];
  const parsed = RaidRecordSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Raid 4 opens after Raid 2 is resolved; Raid 5 after Raid 3, or at track step 4 or more. */
export function raidOffered(run: RunState, n: number): boolean {
  const def = raidDefByN(n);
  if (!def || raidRecord(run, n)) return false;
  const g = def.gate;
  if (g.kind === 'open') return true;
  if (raidRecord(run, g.raid)) return true;
  if (g.kind === 'afterOrTrack') return Number(run.expansion?.track?.step ?? 0) >= g.trackStep;
  return false;
}

/** The sum of every raid's Operational Strength change, held inside the design's bound (±2). */
export function osChange(run: RunState): number {
  const sum = STORY_RAIDS.raids.reduce((t, d) => t + (raidRecord(run, d.n)?.os ?? 0), 0);
  return clamp(sum, -STORY_RAIDS.bounds.os, STORY_RAIDS.bounds.os);
}

/** The climax changes the raids made (siege/phase flags), each clamped to the design bounds: a lost run of raids is harder, never impossible. */
export function climaxMods(run: RunState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of STORY_RAIDS.raids) for (const [k, v] of Object.entries(raidRecord(run, d.n)?.phase ?? {})) out[k] = (out[k] ?? 0) + v;
  for (const k of Object.keys(out)) {
    const bound = k === 'gauntlet' ? STORY_RAIDS.bounds.gauntlet : STORY_RAIDS.bounds.phase;
    out[k] = clamp(out[k]!, -bound, bound);
  }
  return out;
}

const block = (run: RunState) => (run.expansion ??= {});
const rec = (o: Record<string, unknown> | undefined) => o ?? {};

export interface ResolvedRaid { record: RaidRecord; hold: Hold | null; alreadyResolved: boolean }

/**
 * Records a raid result once and applies it. A result never applies twice (a second call returns the first).
 * A lost raid whose failure list has C1 impounds 1–3 Pokémon through the Rescue Plan clock; levers write only siege / apex / cast / cut.
 */
export function resolveStoryRaid(content: Content, run: RunState, n: number, result: RaidResult): ResolvedRaid {
  const def = raidDefByN(n);
  if (!def) throw new Error(`Unknown story raid ${n}`);
  const done = raidRecord(run, n);
  if (done) return { record: done, hold: null, alreadyResolved: true };
  const fx = def.results[result];
  const b = block(run);
  const node = rescueNode(content, run);
  let hold: Hold | null = null;
  if (result === 'failure' && def.failure.includes('C1')) hold = impoundFor(content, run, def.team, `raid-${n}`);
  const record: RaidRecord = { id: def.id, result, node, os: fx.os, phase: { ...(fx.phase ?? {}) }, impounded: hold ? hold.pokemon.length : 0 };
  b.raids = { ...rec(b.raids), [keyOf(n)]: record };
  // Levers write only these four blocks.
  const siege = rec(b.siege);
  b.siege = { ...siege, levers: { ...(siege.levers as Record<string, string> | undefined), [def.leverId]: fx.lever }, flags: { ...(siege.flags as Record<string, boolean> | undefined), ...(fx.siege ?? {}) } };
  if (fx.apex) b.apex = { ...rec(b.apex), ...fx.apex };
  if (fx.cast) b.cast = { ...rec(b.cast), ...fx.cast };
  b.cut = { ...rec(b.cut), mods: climaxMods(run) };
  return { record, hold, alreadyResolved: false };
}

/** C1 Impound for a team that has a holding site: how many (1–3) is hashed from seed + region + label, so it never moves another roll. */
export function impoundFor(content: Content, run: RunState, teamId: string, label: string): Hold | null {
  if (!RESCUE.sites.some((s) => s.team === teamId)) return null;
  const regionId = run.regionOrder[run.regionIndex] ?? 'region';
  const { min, max } = STORY_RAIDS.impoundCount;
  const count = min + Math.floor(new Rng(hashSeed(`${run.seed}::${regionId}::impound-${label}`)).float() * (max - min + 1));
  return impound(run, { teamId, regionId, node: rescueNode(content, run), lastQuietNode: lastQuietNodeOfRegion(content, run), count });
}
