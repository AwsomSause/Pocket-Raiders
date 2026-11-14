// Beta 0.7: "Pidgey's Resolve", the Rivalry of the Sky. Its whole state lives in one optional block, `run.expansion.sky`
// (no save bump: older runs simply have none). Pure data and a Zod schema; the rules are in story.ts, the CPU fight in sim.ts.

import { z } from 'zod';

export const SkySideSchema = z.enum(['pidgey', 'spearow']);
export type SkySide = z.infer<typeof SkySideSchema>;

/** How the story ended (or `null` while it runs). Each value has its own afterstory in text.ts. */
export const SkyEndingSchema = z.enum([
  /** Pidgey was backed and won the opening: a Flying HM, and the story ends here. */
  'hm',
  /** Pidgeot won after the player cheered it: it asked to join. */
  'pidgeot-joined',
  /** Pidgeot won after the player cheered it and the player let it fly free. */
  'pidgeot-free',
  /** Pidgeot won and nobody was ever asked to cheer (it never dropped low enough): it flies on alone. */
  'pidgeot-alone',
  /** Pidgeot won after the player cheered Fearow: it leaves without looking back. Met again next region. */
  'pidgeot-left',
  /** Pidgeot was beaten in the rematch (or the player won it): the rivalry is over. */
  'rematch-done',
  /** Fearow won after the player cheered it: it landed and was recruited. */
  'fearow-joined',
  /** Fearow won after the player cheered it and the player let it go. */
  'fearow-free',
  /** Fearow won and Pidgeot had been cheered, or nobody was: neither bird stays. */
  'fearow-alone',
]);
export type SkyEnding = z.infer<typeof SkyEndingSchema>;

export const SkyFinaleSchema = z.object({
  /** Pidgeot fell below 35% HP: the player was asked who to cheer for. */
  asked: z.boolean().default(false),
  cheer: z.enum(['pidgeot', 'fearow']).optional(),
  winner: z.enum(['pidgeot', 'fearow']).optional(),
});

export const SkyStateSchema = z.object({
  /** The region index the story began in (the finale is in the same region; the afterstory in the next). */
  region: z.number().int().min(0),
  backed: SkySideSchema,
  /** Who won the opening duel. */
  duelWinner: SkySideSchema,
  /** `rivalry`: Pidgey vowed to get stronger and the story runs; `done`: it has ended (see `ending`). */
  phase: z.enum(['rivalry', 'done']),
  /** Stage keys that already had a meeting, so there is at most one per stage. */
  metStages: z.array(z.string()).default([]),
  /** Meetings (sparring, boosting or watching it alone): Fearow learns one move per meeting. */
  meets: z.number().int().min(0).default(0),
  spars: z.number().int().min(0).default(0),
  boosts: z.number().int().min(0).default(0),
  /** Times it was found training alone. */
  alone: z.number().int().min(0).default(0),
  /** Everything the player gave it (item ids), kept to the end. */
  gifts: z.array(z.string()).default([]),
  /** Move ids it carries as answers to what beat it. */
  answers: z.array(z.string()).default([]),
  finale: SkyFinaleSchema.default({ asked: false }),
  ending: SkyEndingSchema.optional(),
  /** The afterstory beat (the bird overhead, or the rematch) has been played. */
  afterDone: z.boolean().default(false),
  /** A Pidgeot or Fearow that joined: its uid, so a second join can never happen. */
  joinedUid: z.string().optional(),
});
export type SkyState = z.infer<typeof SkyStateSchema>;

export const freshSky = (region: number, backed: SkySide, duelWinner: SkySide): SkyState =>
  SkyStateSchema.parse({ region, backed, duelWinner, phase: backed === 'pidgey' && duelWinner === 'pidgey' ? 'done' : 'rivalry', ...(backed === 'pidgey' && duelWinner === 'pidgey' ? { ending: 'hm' } : {}) });
