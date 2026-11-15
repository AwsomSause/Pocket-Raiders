// Node Event Menus P5: the special entries' data (src/data/nodeMenuSpecial.json), validated with Zod at load.
// Rewards are ordinary event effects, applied with the events system's applyEffect.

import { z } from 'zod';
import json from '../../../data/nodeMenuSpecial.json';
import { EventEffectSchema } from '../../contentSchema';

const Text = z.string().min(1);
const Effects = z.array(EventEffectSchema);
const Id = z.string().regex(/^[a-z][a-z0-9-]*$/);

const BranchSchema = z.object({ label: Text, text: Text, now: Effects, later: Effects });

export const NodeMenuSpecialDataSchema = z.object({
  rules: z.object({
    rivalTakes: z.object({
      chance: z.number().min(0).max(1),
      maxPerStage: z.number().int().min(0),
      levelsPerSpoil: z.number().int().min(0),
      maxLevels: z.number().int().min(0),
      rivalStates: z.array(z.string()).min(1),
    }),
    forkChance: z.number().min(0).max(1),
    linkChance: z.number().min(0).max(1),
    escortChance: z.number().min(0).max(1),
    linkWindow: z.tuple([z.number().int().min(1), z.number().int().min(1)]),
    escortNerve: z.number().int().min(1),
    maxSpecialPerMenu: z.number().int().min(0),
  }),
  forks: z.array(z.object({ id: Id, label: Text, text: Text, a: BranchSchema, b: BranchSchema })).min(1),
  links: z.array(z.object({ id: Id, start: z.object({ label: Text, text: Text, effects: Effects }), end: z.object({ label: Text, text: Text, effects: Effects }) })).min(1),
  escorts: z.array(z.object({ id: Id, label: Text, text: Text, nodes: z.number().int().min(1), done: Text, fail: Text, reward: Effects })).min(1),
  rivalLines: z.array(Text.includes('{rival}')).min(1),
});
export type NodeMenuSpecialData = z.infer<typeof NodeMenuSpecialDataSchema>;

export const SPECIAL = NodeMenuSpecialDataSchema.parse(json);
