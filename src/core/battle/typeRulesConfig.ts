// Tuning for Battle/AI batch 1 type rules (S156, S161, S162, S169, S170). Values: balance.json `typeRules`
// (defaults below); rules: typeRules.ts. Types are checked against the type list by the content gate's schema load.

import { z } from 'zod';

const TypeName = z.enum(['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy']);

const ReactionSchema = z.object({
  /** The two move types that react (either order). */
  types: z.tuple([TypeName, TypeName]),
  name: z.string().min(1),
  /** chip: the target loses `amount` of its max HP; burn: it is burned; stat: its `stat` changes by `amount` stages; heal: the attacker heals `amount` of its max HP. */
  effect: z.enum(['chip', 'burn', 'stat', 'heal']),
  amount: z.number(),
  stat: z.enum(['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva']).optional(),
});
export type Reaction = z.infer<typeof ReactionSchema>;

const RegionRuleSchema = z.object({ attack: TypeName, defend: TypeName, mult: z.number().min(0).max(2), note: z.string().min(1) });
export type RegionRule = z.infer<typeof RegionRuleSchema>;

export const CounterClassSchema = z.enum(['song', 'aura', 'trap']);
export type CounterClass = z.infer<typeof CounterClassSchema>;

export const TypeRulesSchema = z.object({
  /** S169: rare moves that ignore one type's immunity (move id -> the immune type it hits anyway, at 1x). */
  immunityBreakers: z.record(z.string(), TypeName),
  /** S156: region id -> type chart tweaks used for every battle in that region. */
  regions: z.record(z.string(), z.array(RegionRuleSchema)),
  /** S161: burn and poison stack up to `maxStacks`; each stack past the first adds `perStack` to the residual damage. */
  statusStacks: z.object({ maxStacks: z.number().int().min(1), perStack: z.number().min(0) }),
  /** S162: a damaging move of one type that lands on a target last hit by the other type sets off a reaction. */
  reactions: z.array(ReactionSchema),
  /** S170: Song beats Aura, Aura beats Trap, Trap beats Song: `bonus` extra damage against a foe whose last move lost. */
  counterBonus: z.number().min(0),
});
export type TypeRules = z.infer<typeof TypeRulesSchema>;

export const DEFAULT_TYPE_RULES: TypeRules = {
  immunityBreakers: {
    'thousand-arrows': 'flying',
    'plasma-fists': 'ground',
    'bolt-strike': 'ground',
    'sacred-sword': 'ghost',
    'photon-geyser': 'dark',
    psystrike: 'dark',
    'moongeist-beam': 'normal',
    'spectral-thief': 'normal',
    'dragon-ascent': 'fairy',
    'roar-of-time': 'fairy',
    'gunk-shot': 'steel',
  },
  regions: {
    kanto: [
      { attack: 'ghost', defend: 'psychic', mult: 0, note: 'Ghost moves do not affect Psychic types' },
      { attack: 'bug', defend: 'poison', mult: 2, note: 'Bug moves are super effective on Poison types' },
      { attack: 'poison', defend: 'bug', mult: 2, note: 'Poison moves are super effective on Bug types' },
      { attack: 'ice', defend: 'fire', mult: 1, note: 'Fire types do not resist Ice' },
    ],
    johto: [
      { attack: 'ghost', defend: 'steel', mult: 0.5, note: 'Steel types resist Ghost' },
      { attack: 'dark', defend: 'steel', mult: 0.5, note: 'Steel types resist Dark' },
    ],
  },
  statusStacks: { maxStacks: 3, perStack: 0.5 },
  reactions: [
    { types: ['water', 'electric'], name: 'Electro-charged', effect: 'chip', amount: 0.125 },
    { types: ['fire', 'ice'], name: 'Melt', effect: 'chip', amount: 0.125 },
    { types: ['fire', 'grass'], name: 'Wildfire', effect: 'burn', amount: 0 },
    { types: ['fire', 'water'], name: 'Steam', effect: 'stat', stat: 'acc', amount: -1 },
    { types: ['water', 'ice'], name: 'Frostbite', effect: 'stat', stat: 'spe', amount: -1 },
    { types: ['grass', 'water'], name: 'Bloom', effect: 'heal', amount: 0.0625 },
    { types: ['electric', 'steel'], name: 'Overload', effect: 'stat', stat: 'def', amount: -1 },
  ],
  counterBonus: 0.2,
};

