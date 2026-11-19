// DOMINION on a run: the setup writes `run.expansion.dominion`, each clock step updates it. Pure: a new run is returned
// and the caller (GameSession.dominionApply) saves it.

import type { Content } from '../contentSchema';
import { addLevels } from '../pokemon';
import { healParty, newMon } from '../run';
import type { RunState } from '../state';
import { step, type StepOut } from './clock';
import { addMorale, withCrew } from './crew';
import { admit, approach, hire } from './recruit';
import { answer, eveningTalk } from './talk';
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
  const block = DominionBlockSchema.parse(withCrew(newBlock(content, out, setup)));
  out = { ...withBlock(out, block), inventory: { ...DOMINION_DATA.start.start.inventory } };
  return { run: out, problem: null };
}

/** One clock step on the run. Rest heals the Boss's team for free (Part 1 §2.1). */
export function stepInRun(content: Content, run: RunState, action: DominionAction): StepOut & { run: RunState } {
  const block = run.expansion?.dominion;
  if (!block) return { ok: false, block: block as never, notice: null, heal: false, run };
  const crewOut = crewInRun(content, run, action);
  if (crewOut) return crewOut;
  const out = step(block, action, run.seed);
  if (!out.ok) return { ...out, run };
  let next = withBlock(run, DominionBlockSchema.parse(out.block));
  if (out.heal) {
    next = structuredClone(next);
    healParty(content, next);
  }
  next = settleCrew(content, next);
  return { ...out, block: next.expansion!.dominion!, run: next };
}

/** D3 actions that need the run (new members' Pokémon, the Bag): hire, approach, admit, gifts, talks that give an item. */
function crewInRun(content: Content, run: RunState, action: DominionAction): (StepOut & { run: RunState }) | null {
  const done = (r: { ok: boolean; run: RunState; notice: string | null }): StepOut & { run: RunState } => {
    const b = r.run.expansion!.dominion!;
    if (!r.ok) return { ok: false, block: b, notice: r.notice, heal: false, run };
    const next = withBlock(r.run, DominionBlockSchema.parse(b));
    return { ok: true, block: next.expansion!.dominion!, notice: r.notice, heal: false, run: next };
  };
  const block = run.expansion!.dominion!;
  switch (action.t) {
    case 'hire':
      return done(hire(content, run, action.index));
    case 'approach':
      return done(approach(content, run, action.lead, action.pitch));
    case 'admit':
      return done(admit(content, run, action.lead));
    case 'gift':
      return done(gift(run, action.member, action.item));
    case 'evTalk': {
      const out = eveningTalk(block, action.member, run.seed, { held: Object.values(run.looseHeld ?? {}).some((n) => n > 0) });
      return done({ ok: out.ok, notice: out.notice, run: out.ok ? withBlock(run, out.block) : run });
    }
    case 'talk': {
      const out = answer(block, action.choice, run.seed);
      if (!out.ok) return done({ ok: false, notice: null, run });
      let next = withBlock(run, out.block);
      if (out.gift) {
        const item = Object.keys(next.looseHeld ?? {}).sort().find((k) => (next.looseHeld![k] ?? 0) > 0);
        if (item) next = gift(next, out.gift, item).run;
      }
      return done({ ok: true, notice: out.notice, run: next });
    }
    default:
      return null;
  }
}

/**
 * Gifts (Part 2 §3): a Rare Candy is +1 member level; a held item goes on their first Pokémon and lifts Morale.
 * (A Pokémon as a gift is D4's, with the Reserve.)
 */
export function gift(run: RunState, memberId: string, item: string): { ok: boolean; run: RunState; notice: string | null } {
  const out = structuredClone(run);
  const b = withCrew(out.expansion!.dominion!);
  const m = b.members.find((x) => x.id === memberId);
  if (!m) return { ok: false, run, notice: null };
  if (item === 'rare-candy') {
    if ((out.inventory['rare-candy'] ?? 0) < 1) return { ok: false, run, notice: 'You have no Rare Candy.' };
    if (m.level >= DOMINION_DATA.crew.rules.maxLevel) return { ok: false, run, notice: `${m.name} is at the top level.` };
    out.inventory['rare-candy'] = (out.inventory['rare-candy'] ?? 0) - 1;
    m.level += 1;
    m.crew!.memory.push({ day: b.day, line: 'The Boss gave me a Rare Candy.' });
    return { ok: true, run: withBlock(out, b), notice: `${m.name} reached member Lv ${m.level}.` };
  }
  const loose = out.looseHeld?.[item] ?? 0;
  const mon = m.team[0];
  if (loose < 1 || !mon) return { ok: false, run, notice: 'Nothing to give.' };
  if (loose > 1) out.looseHeld![item] = loose - 1;
  else delete out.looseHeld![item];
  mon.held = { ...mon.held, [item]: (mon.held?.[item] ?? 0) + 1 };
  addMorale(m, DOMINION_DATA.crew.rules.giftMorale);
  return { ok: true, run: withBlock(out, b), notice: `${m.name}'s Pokémon holds it now. Morale +${DOMINION_DATA.crew.rules.giftMorale}.` };
}

/** Finishes what the night left pending: caught Pokémon into the stores, levels, items into the Bag. Runs once per step. */
export function settleCrew(content: Content, run: RunState): RunState {
  const pending = run.expansion?.dominion?.crew?.pending;
  if (!pending?.length) return run;
  const out = structuredClone(run);
  const b = out.expansion!.dominion!;
  const st = b.crew!;
  for (const p of st.pending) {
    if (p.k === 'mon') {
      if (content.species.has(p.species)) st.stores.push(newMon(content, out, p.species, p.level, 'p'));
    } else if (p.k === 'level') {
      const mon = b.members.find((m) => m.id === p.member)?.team.find((x) => x.uid === p.uid);
      if (mon && p.level > mon.level) addLevels(content, mon, p.level - mon.level, p.level);
    } else out.inventory[p.id] = (out.inventory[p.id] ?? 0) + p.n;
  }
  st.pending = [];
  return out;
}
