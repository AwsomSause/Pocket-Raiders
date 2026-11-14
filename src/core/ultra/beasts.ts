// Beta 0.7 U1 Ultra Beast Incursions: the 11 Beasts (plan: docs/plans/instrumentality/notes-pack/ULTRA_BEAST_INCURSIONS.md).
// Data only. Rules of the battle are in core/ultra/rules.ts; the run state machine is core/ultra/run.ts.
// Nothing here is cross-run: Faller rank, the Faller's Log and Souvenirs are cut (Kice, 2026-11-14).
import { z } from 'zod';

export const ULTRA_RULE_IDS = ['host', 'flex', 'untouchable', 'overload', 'slow-burn', 'paper-cut', 'devour', 'many-as-one', 'finale', 'cling', 'beast-boost-all'] as const;
export const UltraRuleIdSchema = z.enum(ULTRA_RULE_IDS);
export type UltraRuleId = z.infer<typeof UltraRuleIdSchema>;

export const APPETITES = ['dependence', 'strength', 'flawlessness', 'charge', 'patience', 'precision', 'consumption', 'formation', 'spectacle', 'longing'] as const;
export const AppetiteSchema = z.enum(APPETITES);
export type Appetite = z.infer<typeof AppetiteSchema>;

/** What lowers a held Beast's Homesickness (checked once per stage; see ultra/run.ts). */
export const HOMESICK_FALLS = ['holdsItem', 'bossWin', 'noDamage', 'rest', 'full', 'fed', 'oneHit', 'perform'] as const;

export const UltraBeastSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  /** Species ids the Beast can be (the first is the one met). */
  speciesId: z.string(),
  world: z.string(),
  /** Null for Naganadel (no Appetite of its own) and Poipole (Longing, but it follows instead of invading). */
  appetite: AppetiteSchema.nullable(),
  /** How many counted events the Appetite needs before contact begins. */
  threshold: z.number().int().min(1),
  ultraRule: UltraRuleIdSchema,
  ruleName: z.string(),
  ruleText: z.string(),
  /** The law of its home world, as far as the game applies it (home-world fights only). */
  lawText: z.string(),
  /** `noSwitch` and `double` are applied to the home-world fights; every other law is text only for now (documented limit). */
  law: z.enum(['none', 'double', 'noSwitch']).default('none'),
  homesickFalls: z.array(z.enum(HOMESICK_FALLS)),
  homesickText: z.string(),
  /** Hits the Beast at the Incursion / home world: level offset over the stage's wild level. */
  levelBonus: z.number().int().default(6),
});
export type UltraBeast = z.infer<typeof UltraBeastSchema>;

const B = (b: z.input<typeof UltraBeastSchema>) => UltraBeastSchema.parse(b);

export const ULTRA_BEASTS: readonly UltraBeast[] = [
  B({ id: 'ub-symbiont', code: 'UB-01', name: 'Symbiont', speciesId: 'nihilego', world: 'Ultra Deep Sea', appetite: 'dependence', threshold: 5, ultraRule: 'host', ruleName: 'Host', ruleText: 'Each side lead is possessed: +1 to all stats, loses 1/16 HP every turn. Switching out frees it.', lawText: 'Nothing fights alone: every home-world battle is a Double Battle.', law: 'double', homesickFalls: ['holdsItem'], homesickText: 'being carried: falls while it holds an item' }),
  B({ id: 'ub-absorption', code: 'UB-02', name: 'Absorption', speciesId: 'buzzwole', world: 'Ultra Jungle', appetite: 'strength', threshold: 4, ultraRule: 'flex', ruleName: 'Flex', ruleText: 'Contact moves heal the user for a quarter of the damage dealt. Special moves do 10% less.', lawText: 'The higher Attack acts first (not applied yet).', homesickFalls: ['bossWin'], homesickText: 'a worthy opponent: falls with every boss or rival battle won' }),
  B({ id: 'ub-beauty', code: 'UB-02', name: 'Beauty', speciesId: 'pheromosa', world: 'Ultra Desert', appetite: 'flawlessness', threshold: 6, ultraRule: 'untouchable', ruleName: 'Untouchable', ruleText: 'Every Pokémon enters battle with +1 Speed and -1 to both defenses.', lawText: 'The first hit of a battle raises critical chance (not applied yet).', homesickFalls: ['noDamage'], homesickText: 'cleanliness: falls after a battle with no damage taken' }),
  B({ id: 'ub-lighting', code: 'UB-03', name: 'Lighting', speciesId: 'xurkitree', world: 'Ultra Plant', appetite: 'charge', threshold: 10, ultraRule: 'overload', ruleName: 'Overload', ruleText: 'Every stat boost is doubled. A Pokémon with any boost loses 1/8 HP at the end of each turn.', lawText: 'Lightning strikes a random Pokémon each turn (not applied yet).', homesickFalls: [], homesickText: 'current: falls in storms and Electric Terrain (not tracked yet)' }),
  B({ id: 'ub-blaster', code: 'UB-04', name: 'Blaster', speciesId: 'celesteela', world: 'Ultra Crater', appetite: 'patience', threshold: 4, ultraRule: 'slow-burn', ruleName: 'Slow Burn', ruleText: 'On turns 1-2 no hit removes more than a quarter of a Pokémon\'s HP. From turn 6 all damage is +50%.', lawText: 'Gravity (not applied yet).', homesickFalls: ['rest'], homesickText: 'stillness: falls at every rest' }),
  B({ id: 'ub-blade', code: 'UB-04', name: 'Blade', speciesId: 'kartana', world: 'Ultra Forest', appetite: 'precision', threshold: 8, ultraRule: 'paper-cut', ruleName: 'Paper Cut', ruleText: 'Any hit on a Pokémon at full HP is a critical hit.', lawText: 'Half HP and no misses (not applied yet).', homesickFalls: ['oneHit'], homesickText: 'a clean cut: falls on a battle won in one hit' }),
  B({ id: 'ub-glutton', code: 'UB-05', name: 'Glutton', speciesId: 'guzzlord', world: 'Ultra Ruin', appetite: 'consumption', threshold: 10, ultraRule: 'devour', ruleName: 'Devour', ruleText: 'After each battle the winner loses one random bag item (eaten) and the party recovers 20% HP. Foes arrive with no held items.', lawText: 'Every node costs an item (not applied yet).', homesickFalls: ['fed'], homesickText: 'being full: falls only when fed an item' }),
  B({ id: 'ub-assembly', code: 'UB-06', name: 'Assembly', speciesId: 'stakataka', world: 'The Rampart', appetite: 'formation', threshold: 3, ultraRule: 'many-as-one', ruleName: 'Many as One', ruleText: 'Turn order is reversed: the slowest acts first. Each active Pokémon takes 5% less damage per healthy Pokémon behind it.', lawText: 'Nothing can switch out in the home world.', law: 'noSwitch', homesickFalls: ['full'], homesickText: 'company: falls while the party is full and healthy' }),
  B({ id: 'ub-burst', code: 'UB-07', name: 'Burst', speciesId: 'blacephalon', world: 'The Midway', appetite: 'spectacle', threshold: 3, ultraRule: 'finale', ruleName: 'Finale', ruleText: 'A Pokémon that faints bursts: what knocked it out loses 1/8 HP. Moves of 100+ power gain 20% and cost the user 10% recoil.', lawText: 'An audience meter (not applied yet).', homesickFalls: ['perform'], homesickText: 'applause: falls after a one-hit knockout' }),
  B({ id: 'ub-adhesive', code: 'UB-08', name: 'Adhesive', speciesId: 'poipole', world: 'Ultra Megalopolis', appetite: 'longing', threshold: 5, ultraRule: 'cling', ruleName: 'Cling', ruleText: 'No harm to anyone. It clings to one Pokémon of yours.', lawText: 'No light (not applied yet).', homesickFalls: ['rest'], homesickText: 'light: falls at every rest' }),
  B({ id: 'ub-stinger', code: 'UB-09', name: 'Stinger', speciesId: 'naganadel', world: 'Ultra Megalopolis', appetite: null, threshold: 1, ultraRule: 'beast-boost-all', ruleName: 'Beast Boost for All', ruleText: 'Every Pokémon on the field gains +1 to its highest stat whenever it knocks something out.', lawText: 'No light (not applied yet).', homesickFalls: [], homesickText: 'nothing, if it grew up with you' }),
];

export const BEAST_BY_ID: ReadonlyMap<string, UltraBeast> = new Map(ULTRA_BEASTS.map((b) => [b.id, b]));
export const BEAST_BY_SPECIES: ReadonlyMap<string, UltraBeast> = new Map(ULTRA_BEASTS.map((b) => [b.speciesId, b]));
/** Beasts that can come on their own (Appetite crossed). Naganadel never does; Poipole follows instead of invading and is skipped for now. */
export const INVADERS: readonly UltraBeast[] = ULTRA_BEASTS.filter((b) => b.appetite !== null && b.id !== 'ub-adhesive');
