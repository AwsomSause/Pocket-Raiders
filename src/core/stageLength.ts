// Stage length scaling. Every per-stage, per-region and per-run limit in the game was tuned for a 20-node stage.
// A run now plays 20 to 50 nodes per stage (the `stageLength` setting, 30 by default), so those limits stretch with it.
// Pure: no random numbers, so scaling a limit never moves a roll. A run saved before this keeps its 20 and its old limits.

/** The stage length every limit was written for. */
export const BASE_STAGE_COLUMNS = 20;

type LengthRun = { expansion?: { stageCols?: number | undefined } | undefined };

/** How much longer (or shorter) than the old 20 this run's stages are: 1 for an old run, 1.5 by default. */
export function stageLengthFactor(run: LengthRun): number {
  return (run.expansion?.stageCols ?? BASE_STAGE_COLUMNS) / BASE_STAGE_COLUMNS;
}

/** A limit that counts things per stage, region or run, stretched to the run's stage length. Zero stays zero; a real limit never drops under 1. */
export function scaledCap(limit: number, run: LengthRun): number {
  if (limit <= 0) return limit;
  const f = stageLengthFactor(run);
  return f === 1 ? limit : Math.max(1, Math.round(limit * f));
}

/** A rate of "one per N nodes" kept steady on a longer stage: the chance of one event per stage, grown to match, never above 1. */
export function scaledChance(chance: number, run: LengthRun): number {
  return Math.min(1, chance * stageLengthFactor(run));
}
