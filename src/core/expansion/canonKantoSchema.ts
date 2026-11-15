// Kanto Canon Spaces rebuild: the `kc` event effect and condition shapes (rules in canonKantoRules.ts). Zod only, so contentSchema can import it.
import { z } from 'zod';

const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;

export const KC_ACTS = ['statUp', 'museumRegister', 'fossilFragment', 'daycareLeave', 'daycareReturn', 'reviveOne', 'partingGift', 'bond'] as const;
export const KcEffectSchema = z.object({
  kind: z.literal('kc'),
  act: z.enum(KC_ACTS),
  /** statUp: which stat ('random', 'best', or a stat). */
  stat: z.enum(['random', 'best', ...STATS]).optional(),
  /** statUp: copies; daycareLeave: how many Pokémon (1 or 2). */
  count: z.number().int().min(1).max(6).optional(),
  ids: z.array(z.string()).optional(),
  /** statUp, bond: the Pokémon a pick named (default), or the one that just joined. */
  who: z.enum(['picked', 'newest']).optional(),
});
export type KcEffect = z.infer<typeof KcEffectSchema>;

export const KC_CHECKS = ['holdsAny', 'holdsNone', 'fainted', 'daycare', 'giftLeft'] as const;
export const KcConditionSchema = z.object({ kind: z.literal('kc'), act: z.enum(KC_CHECKS), ids: z.array(z.string()).default([]) });
export type KcCondition = z.infer<typeof KcConditionSchema>;

