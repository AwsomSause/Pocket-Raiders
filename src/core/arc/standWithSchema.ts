// Stand With Them (Beta 0.6 slice E8): the Inside Man route. Pure data + Zod, no Phaser.

import { z } from 'zod';

export const VERDICTS = ['rise', 'throne', 'turn'] as const;
export type Verdict = (typeof VERDICTS)[number];

/** `run.expansion.standWith`. Present once the player has joined a team at Ignition. */
export const StandWithStateSchema = z.object({
  /** The team joined (an `evilTeams.json` id) and the region it was joined in. */
  team: z.string(),
  region: z.string(),
  /** Team reputation, -100 to 100. Access and information only; never statistics. */
  rep: z.number().int().min(-100).max(100),
  /** Small mercies done (a noticed mercy still counts). 3 or more: the runner steps forward first. */
  mercies: z.number().int().min(0).default(0),
  /** The team was betrayed (a Heat-80 hunt): the climax choice is gone. */
  betrayed: z.boolean().default(false),
  /** Climax losses on this route (Second Shot: the first retries, the second gives the worst ending, never ends the run). */
  lost: z.number().int().min(0).max(2).default(0),
  /** The Stand-with climax battles were won and the verdict is waiting. */
  climaxWon: z.boolean().default(false),
  /** The verdict chosen, when there was one. */
  verdict: z.enum(VERDICTS).nullable().default(null),
  /** The Turn ending was used in this run: later regions' teams remember it. */
  turned: z.boolean().default(false),
  /** The Apex ledger entry the verdict left (`taken` or `freed`), or null. */
  apex: z.enum(['taken', 'freed']).nullable().default(null),
  /** A rival "handed over" to the team: held by the team until the run's end, then freed (decision B1); never held in the Region of Doom. */
  rivalHandedOver: z.boolean().default(false),
  /** The Doom Ledger lines this route has written (`allied-defeat`, `taken`, `freed`, ...). */
  ledger: z.array(z.string()).default([]),
});
export type StandWithState = z.infer<typeof StandWithStateSchema>;
