// Extended Cut climax director (Beta 0.6 E5): the one reader of the climax cut, the phase list for a region, and Second Shot.
// State lives in `run.expansion.cut` (a loose record, so no save bump). Pure rules, no Phaser, no gameplay RNG.

import { expansionData as EXPANSION } from '../../data/expansion';
import { FORMATS, startFormat } from '../formats/registry';
import { beginCut, cutOf, markCheckpoint } from '../formats/store';
import type { FormatId } from '../formats/types';
import type { Content } from '../contentSchema';
import type { RunState } from '../state';

export type ClimaxCut = 'standard' | 'extended';

/** Second Shot (decision A): two tries, then the run goes on. */
export const SECOND_SHOT_TRIES = 2;

/** The one reader of the climax cut. Reads `cut.climaxCut`; older runs only carry `expansion.climaxCut`. */
export function climaxCutOf(run: Pick<RunState, 'expansion'>): ClimaxCut {
  return run.expansion?.cut?.climaxCut === 'extended' || (run.expansion?.cut?.climaxCut === undefined && run.expansion?.climaxCut === 'extended') ? 'extended' : 'standard';
}

/** Run start: records the chosen cut. Standard runs write nothing, so their saves stay as they were. */
export function setClimaxCut(run: RunState, cut: ClimaxCut | undefined): void {
  if (cut !== 'extended') return;
  run.expansion = run.expansion ?? {};
  run.expansion.cut = { ...run.expansion.cut, climaxCut: 'extended' };
}

/** How a phase is played: a wide format, or ordinary battles the campaign director launches. */
export type PhaseKind = { kind: 'format'; id: FormatId } | { kind: 'battles' } | { kind: 'story' };

const FORMAT_BY_LABEL: Record<string, FormatId> = {
  'Siege Map': 'siege', Blackout: 'blackout', Convoy: 'convoy', Rest: 'breather', Colossus: 'colossus', Front: 'front', Debate: 'debate',
};

export interface ClimaxStep { phase: string; name: string; kind: PhaseKind; }

/** The phases of this region's Extended Cut, in order. Front and Debate stay in the list; `nextStep` skips them while their format is not built. */
export function climaxPhases(region: string): ClimaxStep[] {
  const rec = EXPANSION.climax_extended.find((c) => c.region === region) ?? EXPANSION.climax_extended.find((c) => c.region === 'any');
  return (rec?.phases ?? []).map((p): ClimaxStep => {
    const id = FORMAT_BY_LABEL[p.format];
    const kind: PhaseKind = id ? { kind: 'format', id } : p.battles === '0' ? { kind: 'story' } : { kind: 'battles' };
    return { phase: p.phase, name: p.name, kind };
  });
}

/** The region of the running climax (Kanto only for now; other regions pass theirs to `beginClimax`). */
const regionOf = (run: RunState): string => (typeof run.expansion?.cut?.region === 'string' ? run.expansion.cut.region : 'kanto');

interface Dir { idx: number; shots: number; }
const dirOf = (run: RunState): Dir => {
  const d = cutOf(run).director as Partial<Dir> | undefined;
  return { idx: Math.max(0, Number(d?.idx) || 0), shots: Math.max(0, Number(d?.shots) || 0) };
};
const save = (run: RunState, d: Dir): void => { cutOf(run).director = d; };

/** The climax begins: forgets the last climax's formats and starts at phase 0. Standard-cut runs do nothing. */
export function beginClimax(run: RunState, region = 'kanto'): boolean {
  if (climaxCutOf(run) !== 'extended') return false;
  beginCut(run);
  cutOf(run).region = region;
  save(run, { idx: 0, shots: dirOf(run).shots });
  return true;
}

/** The step to play now, skipping a format that is not built yet (Front, Debate). Null when the climax is over. */
export function nextStep(run: RunState): ClimaxStep | null {
  const d = dirOf(run);
  const steps = climaxPhases(regionOf(run));
  while (d.idx < steps.length) {
    const s = steps[d.idx]!;
    if (s.kind.kind !== 'format' || FORMATS[s.kind.id]) { save(run, d); return s; }
    d.idx += 1;
  }
  save(run, d);
  return null;
}

/** Starts the current step's wide format (false when it is not a format step or cannot start). */
export function startStep(content: Content, run: RunState): boolean {
  const s = nextStep(run);
  return !!s && s.kind.kind === 'format' && startFormat(s.kind.id, { content, run });
}

/** The current phase is finished. Breather and the phase after Giovanni's roof are the two save points. */
export function finishStep(run: RunState): ClimaxStep | null {
  const s = nextStep(run);
  if (!s) return null;
  const d = dirOf(run);
  d.idx += 1;
  save(run, d);
  if (s.kind.kind === 'format' && (s.kind.id === 'breather' || s.kind.id === 'colossus')) markCheckpoint(run, s.phase);
  return nextStep(run);
}

/** A climax battle was lost. The first loss retries from the last save point; the second ends the climax (worst resolution) and the run goes on. */
export function climaxLost(run: RunState): 'retry' | 'worst' {
  const d = dirOf(run);
  d.shots += 1;
  if (d.shots >= SECOND_SHOT_TRIES) { d.idx = climaxPhases(regionOf(run)).length; save(run, d); return 'worst'; }
  const steps = climaxPhases(regionOf(run));
  const cp = cutOf(run).checkpoint;
  const at = typeof cp === 'string' ? steps.findIndex((s) => s.phase === cp) : -1;
  d.idx = at >= 0 ? at + 1 : 0;
  save(run, d);
  return 'retry';
}
