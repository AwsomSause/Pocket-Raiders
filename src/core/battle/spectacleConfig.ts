// Tuning for Battle Drama spectacle (APPROVED section 7): Last Stand, Momentum,
// Revenge Moment, boss phases and the Boss Revenge Rematch. Values live in balance.json
// (`spectacle`); rules are in spectacle.ts. Off (`enabled: false`) = none of it runs (old-seed checks).

import { z } from 'zod';

const Stat = z.enum(['atk', 'def', 'spa', 'spd', 'spe']);
const Boost = z.partialRecord(Stat, z.number().int().min(1).max(3));

export const BossPhaseCfgSchema = z.object({
  atHp: z.number().min(0.05).max(0.95),
  text: z.string().min(1),
  boost: Boost.optional(),
  cleanse: z.boolean().optional(),
  clearPlayerStages: z.boolean().optional(),
});

export const SpectacleConfigSchema = z.object({
  enabled: z.boolean(),
  momentum: z.object({
    max: z.number().int().min(10),
    superEffective: z.number().int().min(0),
    streak: z.number().int().min(0),
    knockout: z.number().int().min(0),
    /** Share of the meter kept when one of your Pokémon faints. */
    faintKeeps: z.number().min(0).max(1),
    ralliesPerBattle: z.number().int().min(0),
    /** Damage multiplier of the Rally (Surge Strike). */
    rallyDamage: z.number().min(1),
  }),
  lastStand: z.object({
    chance: z.number().min(0).max(1),
    /** Bond score (average of trust and affection) needed; the last Pokémon standing needs this many points less. */
    minBond: z.number().int().min(0).max(100),
    lastMonBonus: z.number().int().min(0).max(100),
    perBattle: z.number().int().min(0),
    boost: Boost,
  }),
  revenge: z.object({
    chance: z.number().min(0).max(1),
    minBond: z.number().int().min(0).max(100),
    boost: Boost,
  }),
  /** Berserk Mode (S385): rage-prone Pokémon lose control at low HP for a few turns of bigger hits. */
  berserk: z
    .object({
      species: z.array(z.string()),
      /** Goes berserk once its HP share falls to this. */
      hpBelow: z.number().min(0.05).max(0.9),
      turns: z.number().int().min(1),
      damage: z.number().min(1),
      /** Share of max HP it hurts itself each berserk turn (never knocks it out). */
      recoil: z.number().min(0).max(0.5),
    })
    .default({ species: ['primeape', 'annihilape', 'tyranitar', 'pangoro', 'vigoroth'], hpBelow: 0.34, turns: 3, damage: 1.5, recoil: 0.0625 }),
  /** Phases at HP lines for a boss's last Pokémon, per trainer class (a final boss also gets `final`). */
  phases: z.object({
    classes: z.record(z.string(), z.array(BossPhaseCfgSchema)),
    final: z.array(BossPhaseCfgSchema),
  }),
  rematch: z.object({
    enabled: z.boolean(),
    chance: z.number().min(0).max(1),
    levelBonus: z.number().int().min(0),
    ai: z.number().min(0).max(1),
  }),
});
export type SpectacleConfig = z.infer<typeof SpectacleConfigSchema>;
