// Shadow II data (src/data/shadow2.json): tiers, heart scars and purification keys, checked with Zod.

import { z } from 'zod';
import raw from '../../data/shadow2.json';

const Tier = z.object({
  tier: z.number().int().min(1).max(4), name: z.string(), upTo: z.number().int(), damageBonus: z.number(), damageTaken: z.number(),
  disobeyChance: z.number().min(0).max(1), hesitateChance: z.number().min(0).max(1), countsAgainstCap: z.boolean(),
});
const KeyWhen = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('any') }),
  z.object({ kind: z.literal('heartBond') }),
  /** Win one battle outdoors with it leading (after `needs`, a story flag, is set). */
  z.object({ kind: z.literal('leadWinOutdoors'), needs: z.string().optional() }),
  z.object({ kind: z.literal('flag'), flag: z.string().regex(/^[a-z][a-z0-9-]*$/) }),
]);
export const ShadowKeySchema = z.object({
  shadow: z.string().regex(/^ss\.[a-z0-9-]+\.[a-z0-9-]+$/), type: z.enum(['person', 'place', 'object', 'act', 'story']),
  scar: z.string(), speciesId: z.string(), corruption: z.number().int().min(1).max(100), when: KeyWhen, hints: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1)]),
});
const Scar = z.object({ id: z.string(), name: z.string(), effect: z.string(), earnedBy: z.string() });
export const Shadow2DataSchema = z.object({
  slotCap: z.number().int().min(1), tiers: z.array(Tier).length(4), keyHalfStrength: z.number().min(0).max(1),
  keptPromiseFriendship: z.number(), softHeartedHeal: z.number(), steadfastTaken: z.number(),
  scars: z.array(Scar).min(1), keys: z.array(ShadowKeySchema),
});
export type ShadowKey = z.infer<typeof ShadowKeySchema>;
export type ShadowScar = z.infer<typeof Scar>;

export const shadow2Data = Shadow2DataSchema.parse(raw);

export const keyOf = (shadowId: string): ShadowKey | undefined => shadow2Data.keys.find((k) => k.shadow === shadowId);
