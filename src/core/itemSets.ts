import { z } from 'zod';
import setsJson from '../data/itemSets.json';
import type { Content, HeldHook } from './contentSchema';

// Item Sets (S79) and Item Combos (S431): hold every item of a set on one Pokémon and it gets the set's bonus.
// A bonus is made of ordinary passive held hooks (stats, type power, crits, accuracy), so the battle needs nothing new.

const SetHookSchema = z.discriminatedUnion('hook', [
  z.object({ hook: z.literal('stat'), stat: z.enum(['atk', 'def', 'spa', 'spd', 'spe', 'all']), multiplier: z.number().positive() }),
  z.object({ hook: z.literal('typePower'), types: z.array(z.string()).min(1), percent: z.number().positive() }),
  z.object({ hook: z.literal('categoryPower'), category: z.enum(['physical', 'special']), percent: z.number().positive() }),
  z.object({ hook: z.literal('crit'), stages: z.number().int().min(0) }),
  z.object({ hook: z.literal('accuracy'), percent: z.number().positive() }),
]);
const SetsSchema = z.object({
  sets: z.array(z.object({ id: z.string().min(1), name: z.string().min(1), items: z.array(z.string()).min(2).max(4), hooks: z.array(SetHookSchema).min(1) })).min(1),
});
export const ITEM_SETS = SetsSchema.parse(setsJson).sets;
export type ItemSet = (typeof ITEM_SETS)[number];

/** Sets a Pokémon holds in full (every item at least once). Items that are not supported or are suppressed in battle are the caller's business. */
export function completeSets(held: Record<string, number> | undefined): ItemSet[] {
  if (!held) return [];
  return ITEM_SETS.filter((s) => s.items.every((id) => (held[id] ?? 0) > 0));
}

/** The set bonuses as held hooks, tagged `set:<id>` so they never match a real catalog item. */
export function setHooks(held: Record<string, number> | undefined): { itemId: string; hook: HeldHook; copies: number }[] {
  return completeSets(held).flatMap((s) => s.hooks.map((hook) => ({ itemId: `set:${s.id}`, hook: hook as HeldHook, copies: 1 })));
}

/** Problems with the data: unknown or non-held items, repeated sets (checked by the unit test). */
export function itemSetProblems(content: Content): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of ITEM_SETS) {
    if (seen.has(s.id)) out.push(`duplicate set ${s.id}`);
    seen.add(s.id);
    for (const id of s.items) {
      const e = content.catalog.get(id);
      if (!e) out.push(`${s.id}: unknown item ${id}`);
      else if (e.effect?.kind !== 'held') out.push(`${s.id}: ${id} is not a held item`);
      else if (e.stacksOn === 'team') out.push(`${s.id}: ${id} is a team item`);
    }
  }
  return out;
}
