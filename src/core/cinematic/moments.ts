// Cinematic moments (Beta 0.5 section 4, M6): one pure planner for every "big moment" scene (transformations, boss and raid
// intros, ace entrances, rival and evil-team scenes, stadium cuts). It decides WHAT plays and for how long; the UI player
// (ui/cinematic/momentPlayer.ts) draws it. No Phaser, no random numbers: the same spec and settings give the same plan, and
// the battle result never waits on a moment.
//
// Every moment has five beats: anticipation -> buildup -> reveal -> impact -> aftermath.
// Rules: mandatory moments cannot be skipped; others can be skipped, and a repeatable one is shortened after the first time.
// `disableAnimations` leaves only the title card; reduced motion halves the beats.

import { z } from 'zod';

export const MOMENT_PHASES = ['anticipation', 'buildup', 'reveal', 'impact', 'aftermath'] as const;
export type MomentPhase = (typeof MOMENT_PHASES)[number];

export const TRANSFORM_MOMENTS = ['mega', 'primal', 'dynamax', 'gigantamax', 'zmove', 'tera', 'evolve', 'hyper', 'overdrive'] as const;
export const MOMENT_KINDS = [
  ...TRANSFORM_MOMENTS,
  'gymIntro', 'e4Intro', 'championIntro', 'aceEntrance', 'raidIntro', 'raidDefeat', 'bossDefeat',
  'rivalFirst', 'rivalRematch', 'rivalRevenge', 'rivalReunion', 'evilTeam', 'stadiumCut',
] as const;
export type MomentKind = (typeof MOMENT_KINDS)[number];

const Phases = z.object({
  anticipation: z.number().int().min(0).default(300),
  buildup: z.number().int().min(0).default(500),
  reveal: z.number().int().min(0).default(700),
  impact: z.number().int().min(0).default(400),
  aftermath: z.number().int().min(0).default(300),
});

export const MomentSpecSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(MOMENT_KINDS),
  /** Whose Pokémon or trainer the moment is about. Enemy Pokémon get the same scenes as the player's. */
  side: z.enum(['player', 'enemy']).default('player'),
  tier: z.enum(['S', 'A', 'B']).default('B'),
  /** Mandatory moments (story beats, tutorials) cannot be skipped. */
  mandatory: z.boolean().default(false),
  /** Repeatable moments (transformations) are shortened after the player has seen them once. */
  repeatable: z.boolean().default(false),
  titleKey: z.string().optional(),
  subtitleKey: z.string().optional(),
  phases: Phases.default({ anticipation: 300, buildup: 500, reveal: 700, impact: 400, aftermath: 300 }),
});
export type MomentSpec = z.infer<typeof MomentSpecSchema>;

export interface MomentSettings {
  reduceMotion: boolean;
  disableAnimations: boolean;
  /** Moment ids the player has already watched (saved in settings or profile by the caller). */
  seen: ReadonlySet<string>;
}

export interface MomentPlan {
  /** False when nothing is drawn at all (the caller just continues). */
  play: boolean;
  skippable: boolean;
  /** Only the title card, no camera or effects. */
  cardOnly: boolean;
  ms: Record<MomentPhase, number>;
  totalMs: number;
}

export function planMoment(spec: MomentSpec, s: MomentSettings): MomentPlan {
  const base = { ...spec.phases };
  const again = spec.repeatable && s.seen.has(spec.id) && !spec.mandatory;
  const scale = s.disableAnimations ? 0 : s.reduceMotion ? 0.5 : again ? 0.45 : 1;
  const ms = Object.fromEntries(MOMENT_PHASES.map((p) => [p, Math.round(base[p] * scale)])) as Record<MomentPhase, number>;
  const totalMs = MOMENT_PHASES.reduce((n, p) => n + ms[p], 0);
  // A mandatory moment always shows its card, even with animations off; other moments vanish when animations are off.
  const play = spec.mandatory || !s.disableAnimations;
  return { play, skippable: !spec.mandatory, cardOnly: s.disableAnimations, ms, totalMs };
}

/** What the skip control does: nothing for mandatory moments. */
export const canSkip = (spec: MomentSpec): boolean => !spec.mandatory;

// ---------- Encounter-history scenes (rivals and returning characters) ----------

export interface EncounterHistory {
  /** Times the player has fought this character. */
  fights: number;
  /** Result of the most recent fight, if any. */
  lastResult?: 'playerWon' | 'playerLost' | 'draw';
  /** Player wins in a row against this character (0 if the last fight was lost). */
  playerStreak: number;
  /** Runs since the last meeting (0 = same run). */
  runsSince?: number;
}

/** Which rival scene to play. Deterministic: depends only on the shared history. */
export function rivalMoment(h: EncounterHistory): MomentKind {
  if (h.fights === 0) return 'rivalFirst';
  if ((h.runsSince ?? 0) >= 2) return 'rivalReunion';
  if (h.lastResult === 'playerLost') return 'rivalRevenge';
  return 'rivalRematch';
}

export interface BossContext {
  role: 'gym' | 'e4' | 'champion' | 'rival' | 'evil' | 'raid';
  /** The enemy sent out its last Pokémon. */
  isAce?: boolean;
}

export function bossIntroMoment(c: BossContext): MomentKind {
  if (c.isAce) return 'aceEntrance';
  switch (c.role) {
    case 'gym': return 'gymIntro';
    case 'e4': return 'e4Intro';
    case 'champion': return 'championIntro';
    case 'raid': return 'raidIntro';
    case 'evil': return 'evilTeam';
    case 'rival': return 'rivalFirst';
  }
}

/** Defaults per kind so scene authors only override what differs. */
export function defaultMoment(kind: MomentKind, id: string, side: 'player' | 'enemy' = 'player'): MomentSpec {
  const transform = (TRANSFORM_MOMENTS as readonly string[]).includes(kind);
  const big = kind === 'championIntro' || kind === 'raidIntro' || kind === 'gigantamax';
  return MomentSpecSchema.parse({
    id, kind, side,
    tier: big ? 'S' : transform || kind === 'aceEntrance' ? 'A' : 'B',
    repeatable: transform,
    phases: big ? { anticipation: 500, buildup: 800, reveal: 1000, impact: 600, aftermath: 400 } : undefined,
  });
}
