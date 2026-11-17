// Evil Mode on a run: founding writes `run.expansion.evilMode`, each beat steps it. Pure: a new run is returned and the
// input is never changed. The game session saves after each (design Part 30 section 6.3: saved at the end of every beat).

import type { RunState } from '../state';
import { step, type EvilAction, type EvilCue } from './day';
import { layDistrict } from './board';
import { foundTeam, type FoundingChoice } from './start';
import type { EvilModeBlock, RunLength } from './schema';

/** The Run Setup mode id (src/data/runRules.json). */
export const EVIL_MODE_ID = 'evil-mode';

export const isEvilRun = (run: RunState | null | undefined): boolean => run?.rules.modeId === EVIL_MODE_ID;
export const evilBlock = (run: RunState | null | undefined): EvilModeBlock | undefined => run?.expansion?.evilMode;

/** Founds the team once. A run that already has a team keeps it (a double press, a replayed action: nothing twice). */
export function foundInRun(run: RunState, choice: FoundingChoice, length: RunLength): { run: RunState; problem: string | null } {
  if (!isEvilRun(run)) return { run, problem: 'This run is not an Evil Mode run.' };
  if (run.expansion?.evilMode) return { run, problem: null };
  const out = foundTeam(choice, { boss: run.archetypeId, length, seed: run.seed });
  if (!out.ok) return { run, problem: out.problem };
  return { run: { ...run, expansion: { ...(run.expansion ?? {}), evilMode: out.block } }, problem: null };
}

/** A block migrated from v1 has no district yet: lay it from the run's seed (the same seed lays the same district). */
export function ensureDistrict(run: RunState): RunState {
  const block = run.expansion?.evilMode;
  if (!block || block.district) return run;
  const district = layDistrict(run.seed, block.here.region, block.here.stage, block.team);
  return { ...run, expansion: { ...(run.expansion ?? {}), evilMode: { ...block, district } } };
}

/** One action on the day. Without a team, nothing happens. */
export function stepInRun(run0: RunState, action: EvilAction): { run: RunState; cues: EvilCue[]; ok: boolean } {
  const run = ensureDistrict(run0);
  const block = run.expansion?.evilMode;
  if (!block) return { run: run0, cues: [], ok: false };
  const r = step(block, action);
  if (!r.ok) return { run: run0, cues: r.cues, ok: false };
  return { run: { ...run, expansion: { ...(run.expansion ?? {}), evilMode: r.block } }, cues: r.cues, ok: true };
}
