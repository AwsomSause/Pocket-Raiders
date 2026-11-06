// Mining Spots (S231): a map stop where you dig for gems, evolution stones and fossils. One roll per dig from a generator
// of its own (seeded by run seed, stop and dig), so no existing roll changes and reloading the stop gives the same find.

import { z } from 'zod';
import json from '../data/mining.json';
import type { Content } from './contentSchema';
import { addItem } from './items';
import { hashSeed, Rng } from './rng';
import type { RunState } from './state';

const Find = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('money'), amount: z.number().int().positive(), label: z.string(), weight: z.number().positive() }),
  z.object({ kind: z.literal('item'), id: z.string(), weight: z.number().positive() }),
  z.object({ kind: z.literal('nothing'), weight: z.number().positive() }),
]);
export const MiningSchema = z.object({
  note: z.string(),
  digs: z.array(z.object({ id: z.string(), name: z.string(), cost: z.number().int().min(0), blurb: z.string(), table: z.array(Find).min(1) })).min(1),
});
export const MINING = MiningSchema.parse(json);

export const itemName = (content: Content, id: string): string => content.items.get(id)?.name ?? content.catalog.get(id)?.name ?? id;

/** Digs on offer at a stop: id, name, cost, blurb. */
export const digOptions = () => MINING.digs.map(({ id, name, cost, blurb }) => ({ id, name, cost, blurb }));

/** Digs once (mutates `run`: the find goes in the Bag or the purse; the caller charged the cost). Returns what happened. */
export function dig(content: Content, run: RunState, sideId: string, digId: string): string {
  const d = MINING.digs.find((x) => x.id === digId);
  if (!d) throw new Error(`No such dig "${digId}"`);
  const rng = new Rng(hashSeed(`${run.seed}::mine::${sideId}:${digId}:${run.encountersCompleted}`));
  const find = rng.weighted(d.table.map((f) => ({ item: f, weight: f.weight })));
  if (find.kind === 'money') {
    run.money += find.amount;
    return `You unearth ${find.label}, worth ₽${find.amount}.`;
  }
  if (find.kind === 'item') {
    addItem(run.inventory, find.id, 1);
    return `You dig up a ${itemName(content, find.id)}!`;
  }
  return 'Only rubble. Better luck at the next spot.';
}
