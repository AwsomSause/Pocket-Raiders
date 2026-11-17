// Evil Mode on a run: founding writes `run.expansion.evilMode`, each beat steps it. Pure: a new run is returned and the
// input is never changed. The game session saves after each (design Part 30 section 6.3: saved at the end of every beat).

import type { RunState } from '../state';
import { step, type EvilAction, type EvilCue } from './day';
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
  const out = foundTeam(choice, { boss: run.archetypeId, length });
  if (!out.ok) return { run, problem: out.problem };
  return { run: { ...run, expansion: { ...(run.expansion ?? {}), evilMode: out.block } }, problem: null };
}

/** One action on the day. Without a team, nothing happens. */
export function stepInRun(run: RunState, action: EvilAction): { run: RunState; cues: EvilCue[]; ok: boolean } {
  const block = run.expansion?.evilMode;
  if (!block) return { run, cues: [], ok: false };
  const r = step(block, action);
  if (!r.ok) return { run, cues: r.cues, ok: false };
  return { run: { ...run, expansion: { ...(run.expansion ?? {}), evilMode: r.block } }, cues: r.cues, ok: true };
}
