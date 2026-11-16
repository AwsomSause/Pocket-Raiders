// Team Sky, run by the player (HOENN_TEAMS parts 6 and 7.9-7.13; catalog overhaul row 9). Zod only (no other core
// imports) so the run's expansion block can embed it at `run.expansion.teamSky`. Optional: older runs and runs that
// never found Team Sky have none, so no save bump. Rules in teamSky.ts; data in src/data/catalogOverhaul/sky.json.

import { z } from 'zod';

export const SKY_HOWS = ['quiet', 'bold', 'kind'] as const;
export type SkyHow = (typeof SKY_HOWS)[number];
export const SKY_MISSION_TYPES = ['rescue', 'sabotage', 'watch', 'supply', 'raid', 'parley'] as const;
export type SkyMissionType = (typeof SKY_MISSION_TYPES)[number];

const PersonSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  origin: z.string().min(1),
  trait: z.string().min(1),
  flaw: z.string().min(1),
  skill: z.number().int().min(1).max(5),
  loyalty: z.number().int().min(0).max(10),
});

export const SkyGruntSchema = PersonSchema.extend({
  /** 0 Fledgling, 1 Flyer, 2 Wingleader, 3 Admin. */
  rank: z.number().int().min(0).max(3).default(0),
  missions: z.number().int().min(0).default(0),
  /** Stage ticks since hired or last promoted (Glory-Hound). */
  since: z.number().int().min(0).default(0),
  nick: z.string().optional(),
  ace: z.string().optional(),
  /** A Pokémon the player gave (a saved Pokémon instance; checked again when it's given back). */
  gift: z.record(z.string(), z.unknown()).optional(),
  orders: z.enum(['safe', 'pressure', 'judgement']).optional(),
  /** Hurt until this stage tick (their Pokémon rest a stage). */
  hurt: z.number().int().min(0).default(0),
  captured: z.boolean().default(false),
  /** Shown a cracked feather (Loyalty 2 or less) at this stage tick; still that low next stage and they go. */
  cracked: z.number().int().min(0).default(0),
  /** The stage tick they were last talked to (once a stage). */
  talked: z.number().int().min(-1).default(-1),
  away: z.boolean().default(false),
});
export type SkyGrunt = z.infer<typeof SkyGruntSchema>;

export const SkyCandidateSchema = PersonSchema.extend({
  fee: z.number().int().min(0),
  why: z.string(),
  /** The one interview answer, once asked. */
  answer: z.string().optional(),
});
export type SkyCandidate = z.infer<typeof SkyCandidateSchema>;

export const SkyMissionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(SKY_MISSION_TYPES),
  at: z.string(),
  text: z.string(),
  tags: z.array(z.string()).default([]),
  /** The team it works against ('' for none). */
  against: z.string().default(''),
  need: z.number().int().min(1).max(5),
  nodes: z.number().int().min(1).max(3),
  /** A rescue for a captured grunt. */
  free: z.string().optional(),
});
export type SkyMission = z.infer<typeof SkyMissionSchema>;

export const TeamSkyStateSchema = z.object({
  /** Stage ticks since the founding. */
  tick: z.number().int().min(0).default(0),
  region: z.number().int().min(0).default(0),
  /** Renown earned by missions (the story's `sky-renown` flag adds to it). */
  renown: z.number().int().default(0),
  funds: z.number().int().min(0).default(0),
  heat: z.object({ magma: z.number().int().min(0).default(0), aqua: z.number().int().min(0).default(0) }).default({ magma: 0, aqua: 0 }),
  grunts: z.array(SkyGruntSchema).default([]),
  candidates: z.array(SkyCandidateSchema).default([]),
  missions: z.array(SkyMissionSchema).default([]),
  away: z.array(z.object({ mission: SkyMissionSchema, squad: z.array(z.string()), how: z.enum(SKY_HOWS), chance: z.number().int(), left: z.number().int().min(0) })).default([]),
  reports: z.array(z.object({ who: z.string(), text: z.string(), win: z.boolean(), tick: z.number().int() })).default([]),
  doctrine: z.object({ mode: z.enum(['types', 'arch']).default('types'), types: z.array(z.string()).default([]), arch: z.string().default(''), set: z.boolean().default(false) }).default({ mode: 'types', types: [], arch: '', set: false }),
  rooms: z.array(z.string()).default([]),
  gadgets: z.array(z.string()).default([]),
  /** Region index the Mess Hall last fed everyone (-1 none). */
  mess: z.number().int().default(-1),
  /** The `sky-loyalty` story flag already handed out to the roster. */
  loyaltyFlag: z.number().int().default(0),
  /** Recruits the story sent (`sky-recruits`) already turned into candidates. */
  recruitsFlag: z.number().int().default(0),
  /** What the player last did (Zinnia at the Long Window answers it). */
  last: z.string().default('none'),
  /** What Watch missions found (the other teams' next Operation). */
  intel: z.array(z.string()).default([]),
  /** Ids handed out so far (new people get the next number). */
  next: z.number().int().min(0).default(0),
});
export type TeamSkyState = z.infer<typeof TeamSkyStateSchema>;
