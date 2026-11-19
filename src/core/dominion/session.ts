// DOMINION on a run: the setup writes `run.expansion.dominion`, each clock step updates it. Pure: a new run is returned
// and the caller (GameSession.dominionApply) saves it.

import type { Content } from '../contentSchema';
import { healParty, newMon } from '../run';
import type { RunState } from '../state';
import { step, type StepOut } from './clock';
import { DOMINION_DATA } from './data';
import { DominionBlockSchema, type DominionAction, type DominionBlock, type DominionSetup } from './schema';
import { newBlock, typesProblem } from './start';

export const DOMINION_MODE_ID = 'dominion';
export const isDominionRun = (run: RunState | null | undefined): boolean => run?.rules.modeId === DOMINION_MODE_ID;
export const dominionBlock = (run: RunState | null | undefined): DominionBlock | undefined => run?.expansion?.dominion;

const withBlock = (run: RunState, block: DominionBlock): RunState => ({ ...run, expansion: { ...(run.expansion ?? {}), dominion: block } });

/**
 * The Boss's three starters (Part 1 §1.1): the one picked on the starter screen, then the other two offered, at the
 * same level. Runs once, while the party is just the first pick.
 */
export function bossTeam(content: Content, run: RunState): RunState {
  const first = run.party[0];
  if (!first || run.party.length !== 1) return run;
  const out = structuredClone(run);
  for (const id of run.starterChoices) {
    if (id === first.speciesId || out.party.length >= 3) continue;
    const mon = newMon(content, out, id, first.level, 'p');
    mon.friendship = first.friendship;
    out.party.push(mon);
  }
  return out;
}

/** Starts the Dominion on the run: the block, the Boss's three starters, the Day 1 bag. Returns why it couldn't, or the new run. */
export function startInRun(content: Content, run: RunState, setup: DominionSetup): { run: RunState; problem: string | null } {
  if (run.expansion?.dominion) return { run, problem: null };
  const problem = typesProblem(setup.types);
  if (problem) return { run, problem };
  let out = bossTeam(content, structuredClone(run));
  const block = DominionBlockSchema.parse(newBlock(content, out, setup));
  out = { ...withBlock(out, block), inventory: { ...DOMINION_DATA.start.start.inventory } };
  return { run: out, problem: null };
}

/** One clock step on the run. Rest heals the Boss's team for free (Part 1 §2.1). */
export function stepInRun(content: Content, run: RunState, action: DominionAction): StepOut & { run: RunState } {
  const block = run.expansion?.dominion;
  if (!block) return { ok: false, block: block as never, notice: null, heal: false, run };
  const out = step(block, action, run.seed);
  if (!out.ok) return { ...out, run };
  let next = withBlock(run, DominionBlockSchema.parse(out.block));
  if (out.heal) {
    next = structuredClone(next);
    healParty(content, next);
  }
  return { ...out, run: next };
}
