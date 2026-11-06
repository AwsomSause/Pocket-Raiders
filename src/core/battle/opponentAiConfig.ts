// Tuning for Battle/AI batch 2 (opponent AI: S269 taunts, S272 team roles, S273 fatigue, S280 trap setting).
// Values: balance.json `opponentAi` (defaults below); rules: opponentAi.ts and intent.ts.

import { z } from 'zod';

export const OpponentAiSchema = z.object({
  /** S280: a trainer at least this smart (battle ai 0-1) lays one entry hazard on your side before the battle when its team knows one (above 1 = off). */
  trapMinAi: z.number().min(0),
  /** S273: from this turn on, the foe's AI smartness falls by `perTurn` each turn, down to `floor` times what it started at. */
  fatigue: z.object({ fromTurn: z.number().int().min(1), perTurn: z.number().min(0).max(1), floor: z.number().min(0).max(1) }),
  /** S272: ordinary trainers put a lead (hazard setter or fastest) first and their ace (strongest) last. */
  teamRoles: z.boolean(),
  /** S269: ordinary trainers at least this smart say out loud what they plan when it is a super-effective hit or a set-up move. */
  tauntMinAi: z.number().min(0).max(1),
  /** S159: ordinary trainer classes give their team one passive trait (battle/classPassives.ts). */
  classPassives: z.boolean(),
});
export type OpponentAi = z.infer<typeof OpponentAiSchema>;

export const DEFAULT_OPPONENT_AI: OpponentAi = { trapMinAi: 0.3, fatigue: { fromTurn: 10, perTurn: 0.05, floor: 0.5 }, teamRoles: true, tauntMinAi: 0.3, classPassives: true };
