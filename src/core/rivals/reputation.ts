// Reputation (Story Overhaul W1, design 14.9): seven counters in run.story.flags as `rep:<category>`, a second, finer
// layer under the protagonist title that decides what an NPC comments on. Dialogue only, never a gameplay bonus.
// Each source is capped per region (the category's `cap`) so nothing can be farmed. No save change (flags).

import { z } from 'zod';
import json from '../../data/rivalReputation.json';
import { fnv1a } from '../story/moments';
import type { RunState } from '../state';

const Level = z.enum(['noted', 'known', 'renowned']);
export const ReputationSchema = z.object({
  note: z.string(),
  categories: z.record(z.string(), z.object({ cap: z.number().int().min(1), levels: z.object({ noted: z.number(), known: z.number(), renowned: z.number() }) })),
  gains: z.record(z.string(), z.number().int().min(1)),
  npcChance: z.number().min(0).max(1),
  lines: z.array(z.object({ id: z.number().int(), category: z.string(), level: Level, who: z.string(), text: z.string() })).length(20),
});
export const REP = ReputationSchema.parse(json);
export type RepCategory = 'champion' | 'rival' | 'bond' | 'villain' | 'strategy' | 'exploration' | 'legendary';
export type RepLevel = z.infer<typeof Level> | 'none';
const ORDER: RepLevel[] = ['none', 'noted', 'known', 'renowned'];

const key = (c: string) => `rep:${c}`;
const regionKey = (c: string, region: number) => `rep-gain:${c}:${region}`;

export const repValue = (run: Pick<RunState, 'story'>, c: RepCategory): number => Number(run.story.flags[key(c)] ?? 0);

/** Adds a gain (a name from REP.gains) to a category. Capped per region and category; returns the points added. */
export function addReputation(run: Pick<RunState, 'story' | 'regionIndex'>, c: RepCategory, gain: keyof typeof REP.gains | string): number {
  const cat = REP.categories[c];
  const want = REP.gains[gain];
  if (!cat || !want) return 0;
  const regionSoFar = Number(run.story.flags[regionKey(c, run.regionIndex)] ?? 0);
  const room = cat.cap - regionSoFar;
  const add = Math.max(0, Math.min(want, room));
  if (add === 0) return 0;
  run.story.flags[key(c)] = repValue(run, c) + add;
  run.story.flags[regionKey(c, run.regionIndex)] = regionSoFar + add;
  return add;
}

export function repLevel(run: Pick<RunState, 'story'>, c: RepCategory): RepLevel {
  const cat = REP.categories[c];
  const v = repValue(run, c);
  if (!cat) return 'none';
  return v >= cat.levels.renowned ? 'renowned' : v >= cat.levels.known ? 'known' : v >= cat.levels.noted ? 'noted' : 'none';
}

/**
 * The line an NPC says about your reputation at a trainer opening, or null. The NPC picks your highest category at Known
 * or above (a tie goes to the later category in file order, a stand-in for "gained most recently"); I3 and I4 trainers
 * always check. Hashed on seed + trainer, so asking twice gives the same answer. A line is used once per trainer per run.
 */
export function recognitionLine(run: Pick<RunState, 'story' | 'seed' | 'regionIndex'>, trainerId: string, who: string, importance: 'I1' | 'I2' | 'I3' | 'I4', names: Record<string, string> = {}): { id: number; text: string } | null {
  const checks = importance === 'I3' || importance === 'I4' || (fnv1a(`${run.seed}::rep:${trainerId}`) % 1000) / 1000 < REP.npcChance;
  if (!checks) return null;
  const cats = (Object.keys(REP.categories) as RepCategory[]).filter((c) => ORDER.indexOf(repLevel(run, c)) >= ORDER.indexOf('known'));
  const best = [...cats].sort((a, b) => repValue(run, b) - repValue(run, a))[0];
  if (!best) return null;
  const level = repLevel(run, best);
  const line = REP.lines.find((l) => l.category === best && l.level === level && (l.who === who || l.who === 'any'))
    ?? REP.lines.find((l) => l.category === best && l.level === level && l.who === 'any');
  if (!line) return null;
  const used = `rep-line:${trainerId}:${best}`;
  if (run.story.flags[used]) return null;
  run.story.flags[used] = 1;
  return { id: line.id, text: line.text.replace(/\{(\w+)\}/g, (_, k: string) => names[k] ?? k) };
}
