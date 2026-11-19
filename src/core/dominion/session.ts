// DOMINION on a run: the setup writes `run.expansion.dominion`, each clock step updates it. Pure: a new run is returned
// and the caller (GameSession.dominionApply) saves it.

import type { Content } from '../contentSchema';
import { healParty, newMon } from '../run';
import type { RunState } from '../state';
import { step, type StepOut } from './clock';
import { act, buy, settle } from './field';
import { beginDominionFight } from './fight';
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
export function stepInRun(content: Content, run: RunState, action: DominionAction): StepOut & { run: RunState; fight?: boolean } {
  const block = run.expansion?.dominion;
  if (!block) return { ok: false, block: block as never, notice: null, heal: false, run };
  if (action.t === 'act') {
    // D2: a Boss action (field.ts). A Pokémon lifted in a Ball (Thieve, a big success) joins the team or the box.
    const work = structuredClone(run);
    const out = act(content, work, action);
    if (!out.ok) return { ok: false, block, notice: out.notice, heal: false, run };
    if (out.mon && content.species.has(out.mon.species)) {
      const mon = newMon(content, work, out.mon.species, out.mon.level, 'p');
      if (work.party.length < 6) work.party.push(mon);
      else work.box = [...(work.box ?? []), mon];
    }
    const next = withBlock(work, DominionBlockSchema.parse(out.block));
    return { ok: true, block: next.expansion!.dominion!, notice: out.notice, heal: false, run: next, fight: out.fight };
  }
  if (action.t === 'buy') {
    const out = buy(block, action.vehicle);
    return { ok: out.ok, block: out.block, notice: out.notice, heal: false, run: out.ok ? withBlock(run, DominionBlockSchema.parse(out.block)) : run };
  }
  const out = step(block, action, run.seed);
  if (!out.ok) return { ...out, run };
  let next = withBlock(run, DominionBlockSchema.parse(out.block));
  if (out.heal) {
    next = structuredClone(next);
    healParty(content, next);
  }
  return { ...out, run: next };
}

/** D2: starts the battle the block is waiting on (an action's, or Looker's or the raid's at the door). Null if none. */
export function fightInRun(content: Content, run: RunState): RunState | null {
  return beginDominionFight(content, run);
}

/**
 * D2: a begun fight with no battle left (the battle was slipped out of, or the game closed mid-way and the battle was
 * lost with it) is settled as fled, so the day can go on. Returns the lines, or null when there was nothing to settle.
 */
export function settleStaleFight(content: Content, run: RunState): { run: RunState; lines: string[] } | null {
  const block = run.expansion?.dominion;
  if (!block?.field.fight?.begun || run.battle) return null;
  const out = structuredClone(run);
  const b = structuredClone(block);
  const lines = settle(content, b, out, 'fled', null);
  return { run: withBlock(out, DominionBlockSchema.parse(b)), lines };
}
