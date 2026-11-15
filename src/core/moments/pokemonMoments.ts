// Pokémon-specific moments (Beta 0.6): short rule changes tied to a species, evolution line, type, group or tag, such as
// "a Rotom may refuse to let the run end". Pure data and rules: no Phaser, no shared random stream.
//
// Rolls are stateless: every roll builds its own tiny generator from "run seed : moment : Pokémon : battle : turn", so a
// moment's roll can never move any other roll (a new moment never changes old results) and previews never roll anything.
// Limits are kept in plain saved state: "battle" in the battle's storyEffects, "run" in the run's story flags, so a reload
// or a replay can never apply a moment twice.
//
// Only moments with status "supported" do anything; "disabled" ones are designed (see the catalog) but not built yet.

import { z } from 'zod';
import raw from '../../data/pokemonMoments.json';
import { Rng, hashSeed } from '../rng';
import type { Content, Species } from '../contentSchema';
import type { PokemonInstance } from '../state';

export const MOMENT_TRIGGERS = ['runEnd', 'lethal', 'faint', 'ally', 'start', 'low', 'ko', 'enter', 'super', 'crit', 'weather', 'status', 'rest', 'catch', 'turn', 'allyLethal', 'evolve'] as const;
export type MomentTrigger = (typeof MOMENT_TRIGGERS)[number];

/** Triggers in priority order: when several moments could be the cinematic of one battle, the earlier one wins. */
export const MOMENT_PRIORITY: readonly MomentTrigger[] = MOMENT_TRIGGERS;

const Stat = z.enum(['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva']);
const Boosts = z.partialRecord(Stat, z.number().int().min(-6).max(6));

export const MomentEffectSchema = z.object({
  /** Stat stages on the Pokémon itself. */
  boost: Boosts.optional(),
  /** +N to whichever of Attack / Sp. Atk is higher. */
  boostBest: z.number().int().min(1).max(6).optional(),
  /** HP restored after it hangs on, as a percent of max HP. */
  healPct: z.number().int().min(1).max(100).optional(),
  /** Other living party members heal this percent of max HP. */
  partyHealPct: z.number().int().min(1).max(100).optional(),
  cure: z.boolean().optional(),
  /** Stat stages on the opposing Pokémon. */
  foeStage: Boosts.optional(),
  foeConfuse: z.boolean().optional(),
  /** The foe loses this percent of its max HP (never below 1). */
  foeHpPct: z.number().int().min(1).max(100).optional(),
  foeStatus: z.enum(['brn', 'psn', 'par', 'slp', 'frz']).optional(),
  foeStatusChance: z.number().int().min(1).max(100).default(100),
  /** Every move gets this many PP back. */
  ppRestore: z.number().int().min(1).max(30).optional(),
  /** Chance (percent) the foe is confused by `foeConfuse`. */
  foeConfuseChance: z.number().int().min(1).max(100).default(100),
  /** The Pokémon falls asleep for this many turns (Snorlax's nap). */
  sleepSelf: z.number().int().min(1).max(3).optional(),
  /** Critical-hit stages added for the battle (or for `boostTurns` turns). */
  critStage: z.number().int().min(1).max(3).optional(),
  /** Starts this weather for this many turns (never over a primal weather). */
  weather: z.object({ id: z.enum(['rain', 'sun', 'sand', 'snow', 'hail']), turns: z.number().int().min(1).max(8) }).optional(),
  /** Ditto's copy: it takes on the foe's types for the battle. */
  typeCopy: z.boolean().optional(),
  /** Smeargle's sketch: replaces its last move with one the foe knows, for the battle. */
  learnFoeMove: z.boolean().optional(),
  /** Mew's curiosity: replaces its last move with a random move it could learn by TM, for the battle (seeded). */
  learnTmMove: z.boolean().optional(),
  /** Flinch can't stop it for the battle. */
  noFlinch: z.boolean().optional(),
  /** Its first move goes with this much extra priority (turn 1 only). */
  firstPriority: z.number().int().min(1).max(2).optional(),
  /** While the foe is asleep it loses this percent of its max HP each turn. */
  foeNightmarePct: z.number().int().min(1).max(25).optional(),
  /** Friendship gained at once (0-255 scale). */
  friendship: z.number().int().min(1).max(10).optional(),
  /** A status with this many turns left (Poison Tolerance: it wears off after 1). */
  statusLeft: z.number().int().min(1).max(3).optional(),
  /** Rest and catch moments: every party member gains this much friendship. */
  teamFriendship: z.number().int().min(1).max(10).optional(),
  /** Rest moments: a free berry in the bag. */
  freeBerry: z.boolean().optional(),
  /** Rest moments: the Pokémon gains this percent of the experience between its level and the next. */
  xpPct: z.number().int().min(1).max(100).optional(),
  /** Rest moments: names the types that hit this stage's leader hardest. */
  weaknessHint: z.boolean().optional(),
  /** Catch moments: the whole party is healed fully. */
  healTeam: z.boolean().optional(),
  /** Catch moments: the Pokémon rolls a talent (once) if it has none. */
  talentRoll: z.boolean().optional(),
  /** Entry moments: HP restored now, as a percent of max HP (12.5 = an eighth). */
  healNowPct: z.number().min(1).max(100).optional(),
  /** Own stat boosts from `boost` / `boostBest` fade after this many turns (absent = last the battle). */
  boostTurns: z.number().int().min(1).max(5).optional(),
  /** The next move of this type does this much more damage (percent); spent when it lands. */
  nextBoost: z.object({ type: z.string(), pct: z.number().int().min(1).max(100) }).optional(),
  /** For the battle, this move does this much more damage (percent). */
  moveBoost: z.object({ move: z.string(), pct: z.number().int().min(1).max(100) }).optional(),
  /** For the rest of the battle, a foe that hits it with a contact move is poisoned. */
  contactPoison: z.boolean().optional(),
  /** Damage is halved for this many turns. */
  guard: z.number().int().min(1).max(5).optional(),
  /** Run-end revive: HP multiplier on max HP, and the Overcharged state. */
  reviveHpMult: z.number().min(1).max(3).optional(),
  overcharged: z.boolean().optional(),
  /** Rest moments: a scene with choices opens as a stop beside this one (an event built as a room, e.g. PA11 Not From Here). */
  openEvent: z.string().optional(),
  /** Run-end revive into one of the last-stand statuses (PA17 to PA31, the `revivalStatuses` table): full HP, the status until the battle ends. */
  revivalStatus: z.string().optional(),
  // Catalog Overhaul (POKEMON_MOMENTS.md, the pack's statuses and effects).
  /** Rest moments: Bond points gained (pack Bond, converted like the event effect). */
  bond: z.number().int().min(1).max(5).optional(),
  /** It survives the next hit that would knock it out, at 1 HP (once). */
  endure: z.boolean().optional(),
  /** Kindled: its moves of this type do `pct`% more for the rest of the battle. */
  kindle: z.object({ type: z.string(), pct: z.number().int().min(1).max(200) }).optional(),
  /** The next Pokémon of this type you send in is Kindled. */
  kindleNext: z.object({ type: z.string(), pct: z.number().int().min(1).max(200) }).optional(),
  /** Remembered: the next Pokémon you send in gets +10% to every stat but HP until the battle ends. */
  rememberedNext: z.boolean().optional(),
  /** It can't be switched out for this many turns. */
  rooted: z.number().int().min(1).max(5).optional(),
  /** Resolute: can't be flinched or confused, and its next move has +1 priority. */
  resolute: z.boolean().optional(),
  /** Its next move (from the next turn on) has this much extra priority. */
  nextPriority: z.number().int().min(1).max(2).optional(),
  /** The foe is badly poisoned. */
  foeBadPoison: z.boolean().optional(),
  /** Its first Ground move this battle hits Flying-types. */
  groundHitsFlying: z.boolean().optional(),
  /** Run-end revive: HP as a percent of max HP (instead of `reviveHpMult`). */
  reviveHpPct: z.number().int().min(1).max(100).optional(),
  /** Guarded (PA3): the next ally sent in is guarded by this Pokémon, which takes the next hit meant for it; that ally's Defence +1. */
  guardNext: z.boolean().optional(),
  /** Its first super-effective hit taken does this much less damage (percent). */
  firstSuperCut: z.number().int().min(1).max(100).optional(),
  /** The Pack: every matching party member gets +pct% to every stat but HP for each other matching member in the party. */
  packStat: z.number().int().min(1).max(25).optional(),
  /** Its Protosynthesis or Quark Drive is on without sun or terrain. */
  paradoxDrive: z.boolean().optional(),
  /** The Little Ones (PA4): if it lands a move this battle, it gains this much Bond afterwards, win or lose. */
  braveBond: z.number().int().min(1).max(5).optional(),
  /** Every stat's effort +N. */
  evAll: z.number().int().min(1).max(10).optional(),
  /** Rest moments: an item tied to the species (by species id). */
  giveItem: z.record(z.string(), z.string()).optional(),
  /** Names the opponent's ace (its strongest Pokémon) before it comes out. */
  revealAce: z.boolean().optional(),
  /** Haunting: after it faints it stays as a spirit for `turns` turns, striking with its best move at `pct`% power each turn; it can't be hit. */
  haunting: z.object({ turns: z.number().int().min(1).max(5), pct: z.number().int().min(1).max(100), foeAccDown: z.number().int().min(1).max(50).optional() }).optional(),
});
export type MomentEffect = z.infer<typeof MomentEffectSchema>;

const ScopeSchema = z.object({
  species: z.array(z.string()).optional(),
  /** Root species of an evolution line: the whole line matches. */
  lines: z.array(z.string()).optional(),
  types: z.array(z.string()).optional(),
  groups: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  /** A stat-shape role (wall, glass-cannon, support), worked out from base stats (see `roleOf`). */
  role: z.string().optional(),
});

export const PokemonMomentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  scope: ScopeSchema,
  trigger: z.enum(MOMENT_TRIGGERS),
  /** Extra condition: at least this many living party members must match the moment's own scope (Eevee's Bond). */
  requires: z
    .object({
      partyMatching: z.number().int().min(2).max(6).optional(),
      weather: z.enum(['rain', 'sun', 'sand', 'snow', 'hail']).optional(),
      /** The Pokémon has one of these statuses (or `confusion`). */
      status: z.array(z.enum(['brn', 'psn', 'par', 'slp', 'frz', 'confusion'])).optional(),
      /** The foe has this species tag (legendary, mythical, baby...). */
      foeTag: z.string().optional(),
      /** It is night on the run clock. */
      night: z.boolean().optional(),
      /** The foe has all of these types. */
      foeTypes: z.array(z.string()).optional(),
      /** Last Stand: it is the only one of your Pokémon still standing. */
      lastStanding: z.boolean().optional(),
      /** The hit came while it was at full HP. */
      fullHp: z.boolean().optional(),
      /** The foe in front is below this percent of its max HP. */
      foeHpBelow: z.number().int().min(1).max(99).optional(),
      /** Your side has a Tailwind, or strong winds blow. */
      tailwind: z.boolean().optional(),
      /** It was knocked out by a contact move. */
      contact: z.boolean().optional(),
      /** The foe in front has a type this Pokémon is weak to, and is not in the named group (a "modern" Pokémon). */
      foeWeakTo: z.boolean().optional(),
      foeNotGroup: z.string().optional(),
      /** The foe in front is this Pokémon's counterpart, as listed in the `counterparts` table. */
      foeCounterpart: z.boolean().optional(),
      /** Not when an opponent shares one of its trios or pairs (groups named `trio-*`). */
      notVsOwnTrio: z.boolean().optional(),
      /** Only the run's chosen starter. */
      starter: z.boolean().optional(),
      /** The foe in front is at least this many levels higher. */
      foeLevelAbove: z.number().int().min(1).max(100).optional(),
      /** A run flag (with `{uid}` standing for this Pokémon) is at least `n`. */
      flagAtLeast: z.object({ key: z.string(), n: z.number().int().min(1) }).optional(),
      /** The same kind of run flag is still below `n` (PA4: a baby that hasn't grown brave yet). */
      flagBelow: z.object({ key: z.string(), n: z.number().int().min(1) }).optional(),
      /** Evolution moments: it has reached the final form of its line. */
      finalForm: z.boolean().optional(),
      /** Evolution moments: it came out of a cocoon it had been in since an earlier stage. */
      fromCocoon: z.boolean().optional(),
      /** Its Mythical promise is kept. */
      promiseKept: z.boolean().optional(),
      /** A named opponent: a trainer battle, not a wild one. */
      named: z.boolean().optional(),
      /** The opponent's ace (its strongest Pokémon) has one of these types. */
      foeAceTypes: z.array(z.string()).optional(),
    })
    .optional(),
  /** Ally moments: `same` = the fallen Pokémon must match this moment's scope too; `any` = any ally falling counts. */
  allyScope: z.enum(['same', 'any']).default('same'),
  /** Low-HP moments: it can play once the Pokémon is below this percent of its max HP (checked at the end of each turn). */
  hpBelow: z.number().int().min(1).max(99).optional(),
  /** 0–1. */
  chance: z.number().min(0).max(1),
  /** The chance grows by `perStep` for each Bond level above `above`, up to `max` (PA1). */
  chanceBond: z.object({ above: z.number().int().min(0).max(5), perStep: z.number().min(0).max(1), max: z.number().min(0).max(1) }).optional(),
  /** These evolution lines (by root or member) get `plus` on top. */
  chancePlus: z.object({ species: z.array(z.string()), plus: z.number().min(0).max(1), /** Only these species, not their whole lines (the revivals' signature species). */ exact: z.boolean().optional() }).optional(),
  /** Run-end order (pack §0.3): individual, species, group, archetype, type. Lower goes first. */
  layer: z.enum(['individual', 'species', 'group', 'archetype', 'type']).optional(),
  /** `region`: once per region (rest moments). */
  limit: z.enum(['battle', 'run', 'region']),
  tier: z.enum(['minor', 'major', 'landmark']),
  status: z.enum(['supported', 'limited', 'disabled']),
  effectText: z.string(),
  presentation: z.string(),
  effect: MomentEffectSchema.optional(),
  /** A full-screen scene: black fade, static, then these lines one by one. */
  scene: z.object({
    fadeMs: z.number().int(), staticMs: z.number().int(), lines: z.array(z.string()).min(1), clips: z.array(z.string()).optional(), after: z.string(),
    /** Last-stand scenes (PA17 to PA31): the sound in the dark, the one voice clip under all the lines, the theme, and the colours. */
    sound: z.string().optional(), voice: z.string().optional(), theme: z.string().optional(),
    veil: z.string().regex(/^#[0-9a-f]{6}$/).optional(), glow: z.string().regex(/^#[0-9a-f]{6}$/).optional(), textColor: z.string().regex(/^#[0-9a-f]{6}$/).optional(),
    /** The last beat (step 3 of the pack's scene), shown after the voice. */
    rise: z.string().optional(),
  }).optional(),
  /** Remembered variants of a run-end scene: a run flag (`{uid}` = this Pokémon), species, or party count of a group changes a line, the chance, or adds an effect. */
  remembers: z.array(z.object({
    flag: z.string().optional(), species: z.array(z.string()).optional(), groupCount: z.object({ group: z.string(), n: z.number().int().min(1) }).optional(),
    line: z.tuple([z.number().int().min(0), z.string()]).optional(), add: z.string().optional(), chance: z.number().min(0).max(1).optional(),
    resolute: z.boolean().optional(), boost: z.record(z.string(), z.number().int()).optional(), feePct: z.number().int().min(0).max(100).optional(), allyDef: z.number().int().optional(),
  })).optional(),
});
export type PokemonMoment = z.infer<typeof PokemonMomentSchema>;

/**
 * The last-stand statuses (POKEMON_MOMENTS.md Part 2B): what each one pays and what it costs. Every number is data. The battle rules are in
 * core/battle/revivalStatus.ts; stat multipliers apply in calcStats so max HP changes too.
 */
const RevivalStatusSchema = z.object({
  name: z.string(),
  /** The honest line shown when it starts: the payoff and the cost. */
  chip: z.string(),
  stats: z.partialRecord(z.enum(['hp', 'atk', 'def', 'spa', 'spd', 'spe']), z.number().min(0.1).max(5)).default({}),
  movePower: z.number().min(0.1).max(5).optional(),
  typePower: z.record(z.string(), z.number().min(0.1).max(5)).optional(),
  taken: z.number().min(0.1).max(5).optional(),
  statusImmune: z.boolean().optional(), noHeal: z.boolean().optional(), noFlinch: z.boolean().optional(), noSwitch: z.boolean().optional(),
  noProtect: z.boolean().optional(), noPhysical: z.boolean().optional(), forceBest: z.boolean().optional(), everyOther: z.boolean().optional(),
  /** Percent of max HP at the end of each turn: negative loses, positive restores. */
  turnHpPct: z.number().min(-50).max(50).optional(),
  /** The foe in front loses this stage each turn. */
  foeStage: z.object({ stat: z.enum(['atk', 'def', 'spa', 'spd', 'spe']), n: z.number().int() }).optional(),
  /** An attacker that hits it loses a stage: Speed, or its highest stat. */
  onHit: z.enum(['spe', 'highest']).optional(),
  countdown: z.object({ turns: z.number().int().min(1), move: z.string() }).optional(),
  /** It can't fall below 1 HP for this many turns; at the end of the last one, if the battle isn't won, it faints. */
  oathTurns: z.number().int().min(1).optional(),
  /** Bodies: each hit removes one whatever the damage; at none it faints. Its moves hit twice at `twicePct` power. */
  bodies: z.number().int().min(2).optional(), twicePct: z.number().int().min(1).max(100).optional(),
  /** Protosynthesis on without sun: the bonus times this, on this many of its best stats. */
  primal: z.object({ mult: z.number().min(1), stats: z.number().int().min(1).max(5) }).optional(),
  weather: z.object({ id: z.enum(['rain', 'sun', 'sand', 'snow', 'hail']), turns: z.number().int().min(1) }).optional(),
  /** Every Pokémon on the field (itself too) loses this percent of max HP each turn. */
  fieldChipPct: z.number().min(0).max(50).optional(),
  freezePct: z.number().int().min(0).max(100).optional(),
  immuneTypes: z.array(z.string()).optional(), immuneContact: z.boolean().optional(),
  night: z.boolean().optional(),
  stages: z.partialRecord(z.enum(['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva']), z.number().int()).optional(),
  evasionCap: z.number().int().optional(),
  /** Percent of this battle's prize money the Collector takes (stated before the battle resumes). */
  feePct: z.number().int().min(0).max(100).optional(),
});
export type RevivalStatus = z.infer<typeof RevivalStatusSchema>;

const FileSchema = z.object({ status: z.string(), note: z.string(), groups: z.record(z.string(), z.array(z.string())), counterparts: z.record(z.string(), z.array(z.string())).default({}), revivalStatuses: z.record(z.string(), RevivalStatusSchema).default({}), moments: z.array(PokemonMomentSchema) });
const file = FileSchema.parse(raw);

export const MOMENT_GROUPS: Readonly<Record<string, readonly string[]>> = file.groups;
/** PA12: a Paradox Pokémon and the modern species it mirrors. */
/** PA17 to PA31: the last-stand statuses by id. */
export const REVIVAL_STATUSES: Readonly<Record<string, RevivalStatus>> = file.revivalStatuses;
export const MOMENT_COUNTERPARTS: Readonly<Record<string, readonly string[]>> = file.counterparts;
export const POKEMON_MOMENTS: readonly PokemonMoment[] = file.moments;
const BY_ID = new Map(POKEMON_MOMENTS.map((m) => [m.id, m]));
export const pokemonMoment = (id: string): PokemonMoment | undefined => BY_ID.get(id);

/** Every species in the evolution line of `speciesId`, from its root up. */
/** The Pokémon and everything it evolves from, so a line listed by its classic root still matches when a custom baby was added before it. */
function lineIds(content: Content, speciesId: string): string[] {
  const ids = [speciesId];
  let id = speciesId;
  for (let i = 0; i < 8; i++) {
    const from = content.species.get(id)?.evolvesFrom;
    if (!from) break;
    ids.push(from);
    id = from;
  }
  return ids;
}

export function momentMatches(content: Content, m: PokemonMoment, speciesId: string): boolean {
  const sp = content.species.get(speciesId);
  if (!sp) return false;
  const s = m.scope;
  if (s.species?.includes(speciesId)) return true;
  if (s.lines && lineIds(content, speciesId).some((id) => s.lines!.includes(id))) return true;
  if (s.types?.some((t) => sp.types.includes(t as never))) return true;
  if (s.groups?.some((g) => MOMENT_GROUPS[g]?.includes(speciesId))) return true;
  if (s.tags?.some((t) => sp.tags.includes(t as never))) return true;
  if (s.role && roleOf(sp) === s.role) return true;
  return false;
}

/** A rough stat-shape role from base stats: wall (bulk well over offence), glass-cannon (offence well over bulk), support (bulky HP, modest attacks). */
export function roleOf(sp: Pick<Species, 'baseStats'>): 'wall' | 'glass-cannon' | 'support' | null {
  const b = sp.baseStats;
  const bulk = b.def + b.spd;
  const off = b.atk + b.spa;
  if (bulk >= off * 1.25 && bulk >= 150) return 'wall';
  if (off >= bulk * 1.25 && off >= 170) return 'glass-cannon';
  if (b.hp >= 75 && Math.max(b.atk, b.spa) <= 90) return 'support';
  return null;
}

/** The supported moments for a trigger that apply to this Pokémon, most specific first (species, line, group, tag, type). */
export function momentsFor(content: Content, mon: Pick<PokemonInstance, 'speciesId'>, trigger: MomentTrigger): PokemonMoment[] {
  const specificity = (m: PokemonMoment): number => (m.scope.species ? 0 : m.scope.lines ? 1 : m.scope.groups ? 2 : m.scope.tags ? 3 : 4);
  return POKEMON_MOMENTS.filter((m) => m.status !== 'disabled' && m.trigger === trigger && momentMatches(content, m, mon.speciesId)).sort((a, b) => specificity(a) - specificity(b));
}

/** What the battle and the run hand the engine: a seed for rolls, the run's saved flags, and the cinematic budget. */
export interface MomentHooks {
  /** Run seed plus battle number: the same battle always rolls the same way. */
  seed: string;
  /** The run's story flags (saved): once-per-run claims live here. */
  flags: Record<string, boolean | number | string>;
  /** Asks the Moment Director whether a cinematic of this tier may play; a refused one is told as a plain line. */
  cinematic: (tier: PokemonMoment['tier']) => boolean;
  /** Called when a cinematic really plays. */
  noteCinematic: (tier: PokemonMoment['tier']) => void;
  /** True when the run would really end now (no checkpoint, Safety Net or recorder could still save it). */
  runWouldEnd: () => boolean;
  /** The run's chosen starter (PA10). */
  starterUid?: string | null;
}

/** One stateless roll: true with probability `chance`. Same inputs, same answer. */
export function momentRoll(seed: string, momentId: string, uid: string, turn: number, chance: number): boolean {
  if (chance >= 1) return true;
  if (chance <= 0) return false;
  return new Rng(hashSeed(`${seed}:pmoment:${momentId}:${uid}:${turn}`)).chance(chance);
}

/** The ledger key for a moment's limit. */
export const momentKey = (m: PokemonMoment, uid: string): string => `pm:${m.id}@${uid}`;
export const runClaimKey = (m: PokemonMoment): string => `pm:${m.id}`;
