// Catalog Overhaul Pack, STORY_FAMILIES_13 Parts B, C and D: each team's own lines, as written in the doc.
// Used by evil-story-1.ts (the storyline) and evil-story-2.ts (the Operations). `place`, `lair`, `sight` and `why` are
// staging written for the game (the doc gives a shape and asks for the catalog description); everything else is the doc's text.
import type { Json } from '../dsl.ts';

export interface TeamOp {
  id: string;
  name: string;
  /** What the player walks in on (the catalog description, expanded). */
  opening: string;
  /** Who leads it, and their one line. */
  lead: string;
  line: string;
  /** "Another way": the button, what happens, what it needs and what it costs. */
  way: { label: string; text: string; requires?: Json[]; effects?: Json[]; prompt?: string; fail?: string };
  /** What the player is told happens if they let it be (the lasting effect, stated before they decide). */
  stated: string;
}

export interface TeamStory {
  id: string;
  name: string;
  grunt: string;
  front: string;
  /** Step 1 staging: where the two Grunts stand. */
  place: string;
  whisper: string;
  file: string;
  known: string;
  ambush: string;
  plan: string;
  note: string;
  boss: string;
  bossOpen: string;
  bossRealise: string;
  bossLast: string;
  whatNow: string;
  /** "Why?": the boss explains, in their own voice (from the team's plan). */
  why: string;
  /** Step 7 staging: what the base is. */
  lair: string;
  /** A Legend Stirs. `original` Legendaries and Mythicals give no Sign. */
  legend: { species: string[]; name: string; sight: string; original?: boolean; mythical?: boolean };
  lt: { name: string; reason: string; hint: string; first: string; second: string; last: string; letGo: string; ally: string };
  col: { name: string; role: string; ltGrievance: string; grievance: string; defects: string; freeOp: number; half?: boolean };
  ops: [TeamOp, TeamOp, TeamOp, TeamOp];
}
