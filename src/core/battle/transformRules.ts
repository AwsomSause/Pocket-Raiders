// The one table of transformation rules (Overhaul slice 11, THE OVERHAUL.md 3.5): which mechanics coexist, which
// exclude each other, what they cost, when they revert. The engine (transform.ts) is the authority; this table is
// the written record, and tests/unit/transformCheck.test.ts fails if the engine and the table drift apart.

import { z } from 'zod';
import rulesJson from '../../data/transformRules.json';
import { TransformKindSchema } from '../contentSchema';

const RuleSchema = z.object({
  name: z.string(),
  keyItem: z.string(),
  unlockedBy: z.string(),
  trigger: z.string(),
  limit: z.string(),
  perPokemon: z.string(),
  consumesResource: z.boolean(),
  excludes: z.array(TransformKindSchema),
  reverts: z.string(),
  persistsThroughRun: z.string(),
});
export const TransformRulesSchema = z.object({
  status: z.literal('supported'),
  source: z.string(),
  mechanics: z.object({ mega: RuleSchema, tera: RuleSchema, zmove: RuleSchema, dynamax: RuleSchema }),
});
export const TRANSFORM_RULES = TransformRulesSchema.parse(rulesJson);
