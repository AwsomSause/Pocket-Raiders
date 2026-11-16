// Catalog Overhaul Pack (legends): Whole Run Events (expanded_notes/WHOLE_RUN_EVENTS.md section 1).
// One story across the whole run, from Stage 2 to just before the Champion. At most one per run; 35% of runs draw one.
// The draw is made once, when the run starts, on its own named stream (`whole-run-event`), so it never moves an older roll.
// The beats are ordinary placed events (tools/events/co/legends-11.ts, legends-12.ts) that read the mirror flags set here:
// `wre-on`, `wre-<id>`. Their Threads are run flags too. Same-run only: the pack's "shuffled bag across runs" is a plain
// draw per run (the run-memory rule), so a player may see one twice before seeing all five.
import { hashSeed, Rng } from '../rng';
import type { RunState } from '../state';

export const WHOLE_RUN_EVENTS = ['giratina', 'weather', 'made', 'seven', 'flower'] as const;
export type WholeRunEventId = (typeof WHOLE_RUN_EVENTS)[number];
export const WHOLE_RUN_CHANCE = 0.35;

/** Which Whole Run Event this run seed draws, or null (65% of seeds). Pure: same seed, same answer. */
export function wholeRunFor(seed: string): WholeRunEventId | null {
  const rng = new Rng(hashSeed(`${seed}::whole-run-event`));
  if (!rng.chance(WHOLE_RUN_CHANCE)) return null;
  return WHOLE_RUN_EVENTS[rng.int(0, WHOLE_RUN_EVENTS.length - 1)]!;
}

/** Called once when a run starts with the setting on: marks the drawn story on the run's flags. */
export function drawWholeRun(run: Pick<RunState, 'seed' | 'story'>): WholeRunEventId | null {
  const id = wholeRunFor(run.seed);
  if (!id) return null;
  run.story.flags['ev:wre-on'] = 1;
  run.story.flags[`ev:wre-${id}`] = 1;
  return id;
}

/** The Whole Run Event this run is playing, if any. */
export const wholeRunOf = (run: Pick<RunState, 'story'>): WholeRunEventId | null =>
  WHOLE_RUN_EVENTS.find((id) => Number(run.story.flags[`ev:wre-${id}`] ?? 0) > 0) ?? null;
