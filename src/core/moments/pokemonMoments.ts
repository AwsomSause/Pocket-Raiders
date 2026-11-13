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

export const MOMENT_TRIGGERS = ['runEnd', 'lethal', 'faint', 'ally', 'start', 'low', 'ko', 'enter', 'super', 'crit', 'weather', 'status', 'rest', 'catch'] as const;
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
  /** Entry moments: HP restored now, as a percent of max HP. */
  healNowPct: z.number().int().min(1).max(100).optional(),
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
    })
    .optional(),
  /** Ally moments: `same` = the fallen Pokémon must match this moment's scope too; `any` = any ally falling counts. */
  allyScope: z.enum(['same', 'any']).default('same'),
  /** Low-HP moments: it can play once the Pokémon is below this percent of its max HP (checked at the end of each turn). */
  hpBelow: z.number().int().min(1).max(99).optional(),
  /** 0–1. */
  chance: z.number().min(0).max(1),
  limit: z.enum(['battle', 'run']),
  tier: z.enum(['minor', 'major', 'landmark']),
  status: z.enum(['supported', 'limited', 'disabled']),
  effectText: z.string(),
  presentation: z.string(),
  effect: MomentEffectSchema.optional(),
  /** A full-screen scene: black fade, static, then these lines one by one. */
  scene: z.object({ fadeMs: z.number().int(), staticMs: z.number().int(), lines: z.array(z.string()).min(1), clips: z.array(z.string()).optional(), after: z.string() }).optional(),
});
export type PokemonMoment = z.infer<typeof PokemonMomentSchema>;

const FileSchema = z.object({ status: z.string(), note: z.string(), groups: z.record(z.string(), z.array(z.string())), moments: z.array(PokemonMomentSchema) });
const file = FileSchema.parse(raw);

export const MOMENT_GROUPS: Readonly<Record<string, readonly string[]>> = file.groups;
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
