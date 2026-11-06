// Dungeons (Story Overhaul W6, design 14.16): authored node graphs, 3 to 9 nodes, compiled into room events (compile.ts).
// A dungeon is not a stage: no stage index, no badge, no level cap raise. Nothing here uses a gameplay RNG stream.

import { z } from 'zod';
import json from '../../data/dungeons.json';

/** Spec node types: Entrance = the first node, Boss Room = boss, Exit = exit, Rest Site, Mystery Room, Treasure Room = cache, etc. */
export const DUNGEON_NODE_KINDS = ['wild', 'trainer', 'cache', 'rest', 'mystery', 'puzzle', 'trap', 'den', 'rare', 'hidden', 'boss', 'exit'] as const;
export type DungeonNodeKind = (typeof DUNGEON_NODE_KINDS)[number];

const Id = z.string().regex(/^[a-z][a-z0-9_]*$/);
const Stack = z.object({ item: z.string().min(1), count: z.number().int().min(1).default(1) });

export const DungeonDefSchema = z.object({
  id: z.string().regex(/^dg_[a-z0-9_]+$/),
  name: z.string().min(1),
  kind: z.enum(['basic', 'themed']),
  tier: z.number().int().min(1).max(4),
  theme: z.string().min(1),
  types: z.array(z.string()).default([]),
  /** Species of the ordinary wild rooms; `rare` are the forced rare rolls (a `rare` room uses them, else the wild list). */
  wild: z.array(z.string()).min(2),
  rare: z.array(z.string()).optional(),
  nodes: z.array(z.object({ id: Id, kind: z.enum(DUNGEON_NODE_KINDS), next: z.array(Id) })).min(3).max(9),
  supply: Stack,
  reward: Stack,
  boss: z.object({ classId: z.string(), name: z.string(), size: z.number().int().min(1).max(6) }).optional(),
  intro: z.string(),
});
export type DungeonDef = z.infer<typeof DungeonDefSchema>;

export const DungeonsFileSchema = z.object({
  note: z.string(),
  config: z.object({
    levelBonus: z.array(z.number().int()).length(4),
    trapDamage: z.number().min(0).max(1),
    restHeal: z.number().min(0).max(1),
    mysteryHeal: z.number().min(0).max(1),
    trainerClasses: z.record(z.string(), z.array(z.string()).min(1)),
    potion: z.record(z.string(), z.string()),
    moneyPerTier: z.number().int().min(0),
  }),
  dungeons: z.array(DungeonDefSchema).min(1),
});
export const DUNGEONS = DungeonsFileSchema.parse(json);

const SIZE = { basic: [3, 5], themed: [6, 9] } as const;

/** Problems with one definition (empty = valid): size, kinds, branches, boss, hidden rooms. */
export function validateDungeon(def: DungeonDef): string[] {
  const problems: string[] = [];
  const [lo, hi] = SIZE[def.kind];
  if (def.nodes.length < lo || def.nodes.length > hi) problems.push(`${def.kind} dungeons have ${lo} to ${hi} nodes, this has ${def.nodes.length}`);
  const byId = new Map(def.nodes.map((n) => [n.id, n]));
  if (byId.size !== def.nodes.length) problems.push('duplicate node ids');
  const first = def.nodes[0]!;
  const exits = def.nodes.filter((n) => n.kind === 'exit');
  if (exits.length !== 1) problems.push('needs exactly one exit');
  if (exits[0] && exits[0].next.length > 0) problems.push('the exit has no way on');
  if (first.kind === 'exit' || first.kind === 'boss') problems.push('the entrance must be a room to enter, not the boss or exit');
  if (new Set(def.nodes.map((n) => n.kind)).size < 3) problems.push('needs at least 3 different node kinds');
  if (def.kind === 'themed' && !def.nodes.some((n) => n.kind === 'boss')) problems.push('a themed dungeon needs a boss');
  if (def.kind === 'themed' && !def.boss) problems.push('a themed dungeon needs a boss definition');
  if (def.nodes.filter((n) => n.kind === 'boss').length > 1) problems.push('at most one boss');
  for (const n of def.nodes) for (const t of n.next) if (!byId.has(t)) problems.push(`${n.id} leads to unknown ${t}`);
  // Every node is reachable from the entrance and reaches the exit (every branch ends at the exit); no cycles.
  const reach = new Set<string>();
  const stack = [first.id];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (reach.has(id)) continue;
    reach.add(id);
    for (const t of byId.get(id)?.next ?? []) stack.push(t);
  }
  for (const n of def.nodes) if (!reach.has(n.id)) problems.push(`${n.id} is unreachable`);
  const memo = new Map<string, boolean>();
  const visiting = new Set<string>();
  const toExit = (id: string): boolean => {
    if (memo.has(id)) return memo.get(id)!;
    if (visiting.has(id)) { problems.push(`a loop through ${id}`); return false; }
    visiting.add(id);
    const n = byId.get(id);
    const ok = !!n && (n.kind === 'exit' || (n.next.length > 0 && n.next.every(toExit)));
    visiting.delete(id);
    memo.set(id, ok);
    return ok;
  };
  for (const n of def.nodes) if (!toExit(n.id)) problems.push(`${n.id} does not lead to the exit`);
  // A hidden room is a side branch: its parent has another way on. Never 3 wild rooms in a row on any path.
  for (const n of def.nodes) if (n.next.some((t) => byId.get(t)?.kind === 'hidden') && n.next.length < 2) problems.push(`${n.id} only leads to a hidden room`);
  const run = (id: string, streak: number, seen: Set<string>): boolean => {
    const n = byId.get(id);
    if (!n) return false;
    const s = n.kind === 'wild' ? streak + 1 : 0;
    if (s >= 3) return true;
    return n.next.some((t) => !seen.has(t) && run(t, s, new Set([...seen, id])));
  };
  if (run(first.id, 0, new Set())) problems.push('3 wild rooms in a row');
  return problems;
}

/** Problems across the file: each definition, plus unique ids. */
export function validateAllDungeons(defs: readonly DungeonDef[] = DUNGEONS.dungeons): string[] {
  const out = defs.flatMap((d) => validateDungeon(d).map((p) => `${d.id}: ${p}`));
  const ids = defs.map((d) => d.id);
  if (new Set(ids).size !== ids.length) out.push('duplicate dungeon ids');
  return out;
}
