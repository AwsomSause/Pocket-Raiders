// DOMINION on a run: the setup writes `run.expansion.dominion`, each clock step updates it. Pure: a new run is returned
// and the caller (GameSession.dominionApply) saves it.

import type { Content } from '../contentSchema';
import { addLevels } from '../pokemon';
import { healParty, newMon } from '../run';
import type { RunState } from '../state';
import { step, type StepOut } from './clock';
import { addMorale, withCrew } from './crew';
import { ask as deskAsk, inspect as deskInspect, rollQueue, stamp as deskStamp } from './desk';
import { fillCards } from './personality';
import { admit, approach, hire } from './recruit';
import { answer, eveningTalk } from './talk';
import { act, buy, settle } from './field';
import { beginDominionFight } from './fight';
import { DOMINION_DATA } from './data';
import { DominionBlockSchema, type DominionAction, type DominionBlock, type DominionSetup } from './schema';
import { newBlock, typesProblem } from './start';
import { build, letGo, loan, rebuild, repay, sell, storageCap, tierUp, upgrade, launder, type HqOut } from './hq';
import { withHq } from './hqFx';
import { levelCap } from '../regions';

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
  const fresh = newBlock(content, out, setup);
  // D5: the starting money is clean (A21). D19: every member gets their personality card.
  const block = DominionBlockSchema.parse(fillCards(withHq(withCrew(fresh), fresh.funds), run.seed));
  out = { ...withBlock(out, block), inventory: { ...DOMINION_DATA.start.start.inventory } };
  return { run: out, problem: null };
}

/** One clock step on the run. Rest heals the Boss's team for free (Part 1 §2.1). Anyone new gets their card (D19). */
export function stepInRun(content: Content, run: RunState, action: DominionAction): StepOut & { run: RunState; fight?: boolean } {
  let out = stepOnce(content, run, action);
  // D21: the Day's applicants queue at the desk the first time the Day is seen (their own stream, so nothing else moves).
  const queued = out.ok && out.run.expansion?.dominion ? structuredClone(out.run.expansion.dominion) : null;
  if (queued && rollQueue(content, queued, run.seed)) {
    const next = withBlock(out.run, DominionBlockSchema.parse(queued));
    out = { ...out, block: next.expansion!.dominion!, run: next };
  }
  const b = out.run.expansion?.dominion;
  if (!out.ok || !b || b.members.every((m) => !m.crew || m.crew.card)) return out;
  const next = withBlock(out.run, fillCards(structuredClone(b), run.seed));
  return { ...out, block: next.expansion!.dominion!, run: next };
}
function stepOnce(content: Content, run: RunState, action: DominionAction): StepOut & { run: RunState; fight?: boolean } {
  const block = run.expansion?.dominion;
  if (!block) return { ok: false, block: block as never, notice: null, heal: false, run };
  const crewOut = crewInRun(content, run, action);
  if (crewOut) return crewOut;
  const hqOut = hqInRun(content, run, action);
  if (hqOut) return hqOut;
  const deskOut = deskInRun(content, run, action);
  if (deskOut) return deskOut;
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
  next = settleCrew(content, next);
  return { ...out, block: next.expansion!.dominion!, run: next };
}

/** D5: the HQ menu (hq.ts). The upgrade needs the run for the region's level cap (the Citadel's). */
function hqInRun(content: Content, run: RunState, action: DominionAction): (StepOut & { run: RunState }) | null {
  const b = run.expansion!.dominion!;
  let out: HqOut;
  switch (action.t) {
    case 'upgrade': out = upgrade(b, levelCap(content, run.regionIndex)); break;
    case 'build': out = build(b, action.building, action.district); break;
    case 'tierUp': out = tierUp(b, action.room); break;
    case 'sell': out = sell(b, action.room); break;
    case 'rebuild': out = rebuild(b, action.room); break;
    case 'launder': out = launder(b, action.amount); break;
    case 'loan': out = loan(b, action.amount); break;
    case 'repay': out = repay(b, action.amount); break;
    case 'letGo': out = letGo(b, action.member); break;
    default: return null;
  }
  if (!out.ok) return { ok: false, block: b, notice: out.notice, heal: false, run };
  const next = withBlock(run, DominionBlockSchema.parse(out.block));
  return { ok: true, block: next.expansion!.dominion!, notice: out.notice, heal: false, run: next };
}

/** D21: the applications desk. `desk` only opens it (the queue is rolled by stepInRun). */
function deskInRun(content: Content, run: RunState, action: DominionAction): (StepOut & { run: RunState }) | null {
  const block = run.expansion!.dominion!;
  const put = (ok: boolean, b: DominionBlock, notice: string | null): StepOut & { run: RunState } => {
    if (!ok) return { ok: false, block, notice, heal: false, run };
    const next = withBlock(run, DominionBlockSchema.parse(b));
    return { ok: true, block: next.expansion!.dominion!, notice, heal: false, run: next };
  };
  switch (action.t) {
    case 'desk':
      return put(true, block, null);
    case 'deskAsk': {
      const o = deskAsk(block, run.seed, action.q, action.text);
      return put(o.ok, o.block, o.notice);
    }
    case 'deskInspect': {
      const o = deskInspect(block, action.field);
      return put(o.ok, o.block, o.notice);
    }
    case 'deskStamp': {
      const o = deskStamp(content, run, action.stamp);
      if (!o.ok) return { ok: false, block, notice: o.notice, heal: false, run };
      const next = withBlock(o.run, DominionBlockSchema.parse(o.run.expansion!.dominion!));
      return { ok: true, block: next.expansion!.dominion!, notice: o.notice, heal: false, run: next };
    }
    default:
      return null;
  }
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
  // D5: the stores hold 20 Pokémon, more with Pokémon Storage; the newest over the cap are let go, and the report says so.
  const cap = storageCap(b);
  if (st.stores.length > cap) {
    const n = st.stores.length - cap;
    st.stores = st.stores.slice(0, cap);
    b.report = [...b.report, DOMINION_DATA.hq.lines.storageFull!.replace('{cap}', String(cap)).replace('{n}', String(n))];
  }
  return out;
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
