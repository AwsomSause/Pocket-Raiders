// Tuning for Battle/AI batch 4 (S26 combo moves, S167 ability pairs, S32 crowd, S44 arena interactions,
// S264 boss phase moves, S265 wild behaviour effects, S278 adaptive shop, S281 sabotage).
// Values: balance.json `battleFlair` (defaults below); rules: battleFlair.ts.

import { z } from 'zod';

export const BattleFlairSchema = z.object({
  /** S26: in doubles, two allies using damaging moves of a named type pair (Water + Electric, ...) fire a named combo (same bonus as the same-type combo). */
  namedCombos: z.boolean(),
  /** S167: in doubles, two allies whose abilities pair up (Plus + Minus, Drizzle + Swift Swim, ...) both get a boost, once a battle. */
  abilityPairs: z.boolean(),
  /** S32: in trainer battles the crowd cheers when you have used this many different move types (each count once); empty = off. */
  crowd: z.object({ cheerAt: z.array(z.number().int().min(2)) }),
  /** S44: a Water hit floods the floor for `floodTurns` turns; an Electric hit then shocks the water for +`shockBonus` power. A Fire hit on Grassy Terrain burns the grass away. 0 turns = off. */
  environment: z.object({ floodTurns: z.number().int().min(0), shockBonus: z.number().min(0) }),
  /** S264: a boss's phase (gym leaders, finals) also swaps its weakest move for its best same-type move it could know. */
  phaseMoves: z.boolean(),
  /** S265: wild behaviours change the fight: territorial ones ambush (+Attack), guarding ones brace (+Defense), timid ones are ready to bolt (+Speed), sick ones start hurt. */
  wildEffects: z.boolean(),
  /** S278: shops knock this share off items your team can use (evolution items one of them evolves with). 0 = off. */
  adaptiveShop: z.object({ discount: z.number().min(0).max(0.9) }),
  /** S281: chance per map step that a rival filches one item from a stack of 2+ healing or catching items. 0 = off. */
  sabotage: z.object({ chance: z.number().min(0).max(1) }),
});
export type BattleFlair = z.infer<typeof BattleFlairSchema>;

export const DEFAULT_BATTLE_FLAIR: BattleFlair = {
  namedCombos: true,
  abilityPairs: true,
  crowd: { cheerAt: [3, 5] },
  environment: { floodTurns: 3, shockBonus: 0.3 },
  phaseMoves: true,
  wildEffects: true,
  adaptiveShop: { discount: 0.2 },
  sabotage: { chance: 0.05 },
};

/** Everything off (old seeds play as before). */
export const BATTLE_FLAIR_OFF: BattleFlair = {
  namedCombos: false,
  abilityPairs: false,
  crowd: { cheerAt: [] },
  environment: { floodTurns: 0, shockBonus: 0 },
  phaseMoves: false,
  wildEffects: false,
  adaptiveShop: { discount: 0 },
  sabotage: { chance: 0 },
};
