// DOMINION on a run: the setup writes `run.expansion.dominion`, each clock step updates it. Pure: a new run is returned
// and the caller (GameSession.dominionApply) saves it.

import type { Content } from '../contentSchema';
import { addLevels } from '../pokemon';
import { healParty, newMon } from '../run';
import type { RunState } from '../state';
import { step, type StepOut } from './clock';
import { addMorale, freshCrewState, withCrew } from './crew';
import { admit, approach, hire } from './recruit';
import { answer, eveningTalk } from './talk';
import { act, buy, settle } from './field';
import { beginDominionFight } from './fight';
import { DOMINION_DATA } from './data';
import { DominionBlockSchema, type DominionAction, type DominionBlock, type DominionSetup } from './schema';
import { newBlock, typesProblem } from './start';
import { afterStep, lineFor, weekSum } from './empire';
import { courtFightEnd } from './chair';

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

/**
 * One clock step on the run. D6: the money it moved goes on the Ledger's line for it (the World Turn books its own),
 * the district the Boss worked in counts as this week's visit, and a new Notoriety step is announced.
 */
export function stepInRun(content: Content, run: RunState, action: DominionAction): StepOut & { run: RunState; fight?: boolean } {
  const before = run.expansion?.dominion;
  const out = stepInner(content, run, action);
  if (!out.ok || !before) return out;
  const next = structuredClone(out.run);
  const b = next.expansion!.dominion!;
  const turned = b.day !== before.day;
  const lines = afterStep(b, turned ? b.funds : before.funds, turned ? weekSum(b) : weekSum(before), lineFor(action), visitOf(action));
  const block = DominionBlockSchema.parse(b);
  if (lines.length && turned) block.report = [...block.report, ...lines];
  const notice = lines.length && !turned ? [out.notice, ...lines].filter(Boolean).join(' ') : out.notice;
  return { ...out, block, notice, run: withBlock(next, block) };
}

/** The town the Boss worked in (a Holder's visit): Day and Night actions only; Evening ones are done from the HQ. */
function visitOf(a: DominionAction): string | null {
  if (a.t !== 'act' || DOMINION_DATA.actions.actions.find((x) => x.id === a.action)?.slot === 'evening') return null;
  return DOMINION_DATA.field.play[a.action]?.where === 'hq' ? DOMINION_DATA.field.hq : a.district;
}

/** Rest heals the Boss's team for free (Part 1 §2.1). */
function stepInner(content: Content, run: RunState, action: DominionAction): StepOut & { run: RunState; fight?: boolean } {
  const block = run.expansion?.dominion;
  if (!block) return { ok: false, block: block as never, notice: null, heal: false, run };
  const crewOut = crewInRun(content, run, action);
  if (crewOut) return crewOut;
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
  next = settleChair(content, next);
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

/** D12: what a Chair answer gave that needs the run: Pokémon (Stores or a member's team), Bag and held items, levels. */
export function settleChair(content: Content, run: RunState): RunState {
  const give = run.expansion?.dominion?.chair?.give;
  if (!give?.length) return run;
  const out = structuredClone(run);
  const b = out.expansion!.dominion!;
  const st = (b.crew ??= freshCrewState());
  for (const g of b.chair!.give) {
    if (g.k === 'mon') {
      if (!content.species.has(g.species)) continue;
      const mon = newMon(content, out, g.species, g.level, 'p');
      const m = b.members.find((x) => x.id === g.member);
      if (m && m.team.length < 6) m.team.push(mon);
      else st.stores.push(mon);
    } else if (g.k === 'levels') {
      for (const m of b.members) for (const mon of m.team) {
        const to = Math.min(b.levelCap, mon.level + g.n);
        if (to > mon.level) addLevels(content, mon, to - mon.level, to);
      }
    } else if (g.id === '*') {
      // A Bag item lost (the Vault): one of the most plentiful.
      const id = Object.keys(out.inventory).filter((k) => (out.inventory[k] ?? 0) > 0).sort((x, y) => (out.inventory[y] ?? 0) - (out.inventory[x] ?? 0) || x.localeCompare(y))[0];
      if (id) out.inventory[id] = Math.max(0, (out.inventory[id] ?? 0) + g.n);
    } else if (g.held) out.looseHeld = { ...(out.looseHeld ?? {}), [g.id]: (out.looseHeld?.[g.id] ?? 0) + g.n };
    else out.inventory[g.id] = (out.inventory[g.id] ?? 0) + g.n;
  }
  b.chair!.give = [];
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
  const funds = b.funds, sum = weekSum(b), why = block.field.fight.why;
  const lines = settle(content, b, out, 'fled', null);
  if (why === 'court') lines.push(...courtFightEnd(b, 'fled', run.seed));
  lines.push(...afterStep(b, funds, sum, DOMINION_DATA.empire.ledger.byFight[why] ?? 'jobs', null));
  return { run: withBlock(out, DominionBlockSchema.parse(b)), lines };
}
