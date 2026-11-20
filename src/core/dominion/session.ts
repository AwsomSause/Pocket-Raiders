// DOMINION on a run: the setup writes `run.expansion.dominion`, each clock step updates it. Pure: a new run is returned
// and the caller (GameSession.dominionApply) saves it.

import type { Content } from '../contentSchema';
import { addLevels } from '../pokemon';
import { healParty, newMon } from '../run';
import type { RunState } from '../state';
import { step, type StepOut } from './clock';
import { addMorale, freshCrewState, withCrew } from './crew';
import { ask as deskAsk, inspect as deskInspect, rollQueue, stamp as deskStamp } from './desk';
import { fillCards } from './personality';
import { admit, approach, hire } from './recruit';
import { answer, eveningTalk } from './talk';
import { act, buy, settle } from './field';
import { beginDominionFight } from './fight';
import { DOMINION_DATA } from './data';
import { fill } from './worldTurn';
import { DominionBlockSchema, type DominionAction, type DominionBlock, type DominionSetup } from './schema';
import { newBlock, typesProblem } from './start';
import { afterStep, lineFor, weekSum } from './empire';
import { courtFightEnd } from './chair';
import { found, foundingOpen } from './founding';
import { afterStand, answerMeet, ensureHero, heroMember, heroTeam, startLegend } from './hero';
import { escapeHero } from './field';
import { hashSeed, Rng } from '../rng';
import { autoFill, book, placeMon, reserveInRun, seedStart, withReserve } from './reserve';
import { build, letGo, loan, rebuild, repay, sell, storageCap, tierUp, upgrade, launder, type HqOut } from './hq';
import { withHq } from './hqFx';
import { levelCap } from '../regions';
import { hatchEggs, settleDojo, settleLesson } from './school';
import './voices';
import { noteJob, type Roll } from './moments';
import { answerCard, breakTruce, maybeStreet, noteTop, ransom, startTruce, withRivals, type RivalOut } from './rivals';
import { answerMeet as answerTownMeet, maybeMeet } from './town';
import { accuse, askSpy, dropTalk, startConfront, type SpyOut } from './spies';
import { argue, chooseDeal, closeDebate, walkOut, type DebateOut } from './debate';
import { answerQ, noteAct, releasedSeen, releaseQ, returnHeld } from './police';
import './growth';

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
  const fresh = withCrew(newBlock(content, out, setup));
  // D4: Day 1's Reserve (one Pokémon of each Team Type; the first member holds the first).
  seedStart(content, out, fresh);
  // D5: the starting money is clean (A21). D19: every member gets their personality card.
  // D11: the region's Hero.
  const block = DominionBlockSchema.parse(ensureHero(fillCards(withRivals(withHq(withReserve(content, fresh), fresh.funds)), run.seed), run.archetypeId, run.seed));
  noteTop(block, out);
  out = { ...withBlock(out, block), inventory: { ...DOMINION_DATA.start.start.inventory } };
  return { run: out, problem: null };
}

/**
 * One clock step on the run. Rest heals the Boss's team for free (Part 1 §2.1). Anyone new gets their card (D19).
 * D6: the money it moved goes on the Ledger's line for it (the World Turn books its own),
 * the district the Boss worked in counts as this week's visit, and a new Notoriety step is announced.
 */
export function stepInRun(content: Content, run0: RunState, action: DominionAction): StepOut & { run: RunState; fight?: boolean; roll?: Roll | null } {
  // D11: a save from before the Hero gets theirs on the first step (picked by the Boss's trainer, Q5).
  const b0 = run0.expansion?.dominion;
  const run = b0 && !b0.hero ? withBlock(run0, ensureHero(b0, run0.archetypeId, run0.seed)) : run0;
  const before = run.expansion?.dominion;
  const out = stepInner(content, run, action);
  if (!out.ok) return out;
  // D9: the rival tier reads the Boss's best level; a night ambush (rival action 135) hurts the Boss's team.
  const next = structuredClone(out.run);
  let b = next.expansion!.dominion!;
  noteTop(b, next);
  if (b.flags.includes('ambushed')) {
    b.flags = b.flags.filter((f) => f !== 'ambushed');
    for (const m of next.party) m.hp = Math.max(1, Math.round(m.hp * 0.75));
  }
  // D24: Pokémon the police held as evidence come back on their day.
  const back = returnHeld(content, next);
  if (back.length) b.report = [...b.report, ...back];
  // D21: the Day's applicants queue at the desk the first time the Day is seen (their own stream, so nothing else moves).
  rollQueue(content, b, run.seed);
  // D19: anyone new gets their personality card.
  fillCards(b, run.seed);
  // D6: the Ledger books what the step did to the money, the Boss's visit, and a new Notoriety step.
  const turned = !!before && b.day !== before.day;
  const lines = before ? afterStep(b, turned ? b.funds : before.funds, turned ? weekSum(b) : weekSum(before), lineFor(action), visitOf(action)) : [];
  // D7: the step that opens the Founding says so (once: it stays open until the sign goes up).
  if (before && !foundingOpen(before) && foundingOpen(b)) lines.push(DOMINION_DATA.founding.lines.ready);
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
function stepInner(content: Content, run: RunState, action: DominionAction): StepOut & { run: RunState; fight?: boolean; roll?: Roll | null } {
  const block = run.expansion?.dominion;
  if (!block) return { ok: false, block: block as never, notice: null, heal: false, run };
  // D24: while the police question someone, only answers go through.
  const polOut = policeInRun(content, run, action);
  if (polOut) return polOut;
  if (action.t === 'found') {
    const out = found(block, action.team);
    return { ok: out.ok, block: out.block, notice: out.notice, heal: false, run: out.ok ? withBlock(run, DominionBlockSchema.parse(out.block)) : run };
  }
  const crewOut = crewInRun(content, run, action);
  if (crewOut) return crewOut;
  const resOut = reserveInRun(content, run, action);
  if (resOut) {
    if (!resOut.ok) return { ok: false, block, notice: resOut.notice, heal: false, run };
    const next = withBlock(resOut.run, DominionBlockSchema.parse(resOut.run.expansion!.dominion!));
    return { ok: true, block: next.expansion!.dominion!, notice: resOut.notice, heal: false, run: next };
  }
  const hqOut = hqInRun(content, run, action);
  if (hqOut) return hqOut;
  const rivalOut = rivalInRun(run, action);
  if (rivalOut) return rivalOut;
  const debateOut = debateInRun(content, run, action);
  if (debateOut) return debateOut;
  const heroOut = heroInRun(content, run, action);
  if (heroOut) return heroOut;
  const deskOut = deskInRun(content, run, action);
  if (deskOut) return deskOut;
  if (action.t === 'act') {
    // D2: a Boss action (field.ts). A Pokémon lifted in a Ball (Thieve, a big success) joins the team or the box.
    const work = structuredClone(run);
    const heatWas = block.field.districts[action.district]?.heat ?? 0;
    const out = act(content, work, action);
    if (!out.ok) return { ok: false, block, notice: out.notice, heal: false, run };
    // D24: someone may have seen it (the police's evidence log).
    noteAct(out.block, run.seed, action.district, action.target, (out.block.field.districts[action.district]?.heat ?? 0) - heatWas, run.party[0]?.speciesId ?? null);
    // D30: a note for tomorrow's morning paper.
    noteJob(out.block, block, action, out.roll ?? null, out.fight);
    if (out.mon && out.mon.trust !== undefined) {
      // D4: a rescued or tamed Pokémon joins the Reserve, not the Boss's team.
      const line = placeMon(content, work, withReserve(content, out.block), { species: out.mon.species, level: out.mon.level, src: 'rescued', trust: out.mon.trust });
      if (line && out.notice) out.notice = `${out.notice} ${line}`;
    } else if (out.mon && content.species.has(out.mon.species)) {
      const mon = newMon(content, work, out.mon.species, out.mon.level, 'p');
      if (work.party.length < 6) work.party.push(mon);
      else work.box = [...(work.box ?? []), mon];
    }
    // D9: a rival street meeting may come up where the rival team has a stake (once per row per run).
    let blk = out.block, notice = out.notice;
    if (!out.fight) {
      const met = maybeStreet(blk, action.district, run.seed, blk.phase === 'night');
      blk = met.block;
      if (met.line) notice = [notice, met.line].filter(Boolean).join(' ');
      // D6b: or someone from the town (outside.json sections A and J), answered on the Region Map.
      else {
        const town = maybeMeet(blk, action.district, run.seed, blk.phase === 'night');
        blk = town.block;
        if (town.line) notice = [notice, town.line].filter(Boolean).join(' ');
      }
    }
    // D10: Pokémon an action took (Kidnap, a lab's rare one, the Swap Meet) wait in the crew's pending list: place them now.
    const next = settleCrew(content, withBlock(work, DominionBlockSchema.parse(blk)));
    return { ok: true, block: next.expansion!.dominion!, notice, heal: false, run: next, fight: out.fight, roll: out.roll ?? null };
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

/** D13: a turn at the Leader's Table, the deal a Convinced Boss makes, walking out, and reading the result (debate.ts). */
function debateInRun(content: Content, run: RunState, action: DominionAction): (StepOut & { run: RunState }) | null {
  let out: DebateOut;
  switch (action.t) {
    case 'argue': out = argue(content, run, action.line); break;
    case 'deal': out = chooseDeal(content, run, action.kind); break;
    case 'walkOut': out = walkOut(run); break;
    case 'debateDone': out = closeDebate(run); break;
    default: return null;
  }
  const b = run.expansion!.dominion!;
  if (!out.ok) return { ok: false, block: b, notice: out.notice, heal: false, run };
  const block = DominionBlockSchema.parse(out.run.expansion!.dominion!);
  return { ok: true, block, notice: out.notice, heal: false, run: withBlock(out.run, block) };
}

/** D24: answers in the interview room, and the release page read (police.ts). Null for any other action with no case open. */
function policeInRun(content: Content, run: RunState, action: DominionAction): (StepOut & { run: RunState; fight?: boolean }) | null {
  const block = run.expansion!.dominion!;
  const no = (notice: string | null) => ({ ok: false, block, notice, heal: false, run });
  if (action.t === 'released') {
    const b = releasedSeen(block);
    return b ? { ok: true, block: b, notice: null, heal: false, run: withBlock(run, DominionBlockSchema.parse(b)) } : no(null);
  }
  // The Boss in the interview room holds the clock; a member's questioning waits on its screen without stopping the day.
  if (action.t !== 'answer') return block.police?.q?.who === 'boss' ? no(DOMINION_DATA.police.lines.busy) : null;
  const out = answerQ(block, action, run.seed);
  if (!out.ok) return no(out.notice);
  const next = withBlock(structuredClone(run), out.block);
  if (out.over) releaseQ(content, next, run.seed);
  const b = DominionBlockSchema.parse(next.expansion!.dominion!);
  return { ok: true, block: b, notice: null, heal: false, run: withBlock(next, b) };
}

/** D9: the Rival File's answers (rivals.ts). A fight answered leaves `field.fight` for the scene to start. */
function rivalInRun(run: RunState, action: DominionAction): (StepOut & { run: RunState; fight?: boolean }) | null {
  const b = run.expansion!.dominion!;
  let out: RivalOut;
  switch (action.t) {
    case 'truce': out = startTruce(b, action.team); break;
    case 'breakTruce': out = breakTruce(b, action.team); break;
    case 'card': out = answerCard(b, action.index, action.choice, run.seed); break;
    case 'townMeet': out = answerTownMeet(b, action.choice, run.seed); break;
    case 'ransom': out = ransom(b, action.member); break;
    // D22: the Confront talk (spies.ts). An accused spy who fights leaves `field.fight` waiting.
    case 'spyStart': out = startConfront(b, action.member) as SpyOut; break;
    case 'spyAsk': out = askSpy(b, action.q, run.seed, action.text); break;
    case 'spyAccuse': out = accuse(b, run.seed); break;
    case 'spyDrop': out = dropTalk(b); break;
    default: return null;
  }
  if (!out.ok) return { ok: false, block: b, notice: out.notice, heal: false, run };
  const next = withBlock(run, DominionBlockSchema.parse(out.block));
  return { ok: true, block: next.expansion!.dominion!, notice: out.notice, heal: false, run: next, fight: out.fight };
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
    // D4: new members' Pokémon and hired off-type ones get their Reserve records.
    const next = withBlock(r.run, DominionBlockSchema.parse(withReserve(content, structuredClone(b))));
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

/** D11: the Hero's choices (m11 interrupt, encounter cards, a Legendary fight, after the final stand). */
function heroInRun(content: Content, run: RunState, action: DominionAction): (StepOut & { run: RunState; fight?: boolean }) | null {
  const block = run.expansion!.dominion!;
  const H = DOMINION_DATA.hero;
  const res = (ok: boolean, next: RunState, notice: string | null, fight = false): StepOut & { run: RunState; fight?: boolean } => {
    if (!ok) return { ok: false, block, notice, heal: false, run };
    const out = withBlock(next, DominionBlockSchema.parse(next.expansion!.dominion!));
    return { ok: true, block: out.expansion!.dominion!, notice, heal: false, run: out, fight };
  };
  switch (action.t) {
    case 'interrupt': {
      const f = block.field.fight;
      if (!f || f.why !== 'hero' || f.begun) return res(false, run, null);
      if (action.how === 'fight') return res(true, run, null, true);
      const out = structuredClone(run);
      const b = out.expansion!.dominion!;
      const hero = H.heroes.find((h) => h.id === b.hero?.id)?.name ?? 'The Hero';
      if (action.how === 'run') return res(true, out, escapeHero(content, b, out, false, H.foil.runHeat, fill(H.lines.run!, { heat: H.foil.runHeat })).join(' '));
      const item = H.foil.smokeItem;
      if ((out.inventory[item] ?? 0) < 1) return res(false, run, H.lines.noSmoke!);
      out.inventory[item] = (out.inventory[item] ?? 0) - 1;
      if (!out.inventory[item]) delete out.inventory[item];
      const clean = new Rng(hashSeed(`${run.seed}::dominion-hero-smoke::${b.field.rolls}`)).int(1, 100) <= H.foil.smokeChance;
      if (clean) return res(true, out, escapeHero(content, b, out, true, 0, H.lines.smokeClean!).join(' '));
      return res(true, out, fill(H.lines.smokeFail!, { hero }), true);
    }
    case 'meet': {
      const r = answerMeet(block, action.choice);
      if (!r.ok) return res(false, run, r.notice);
      const out = withBlock(structuredClone(run), r.block);
      if (r.item) out.inventory[r.item] = (out.inventory[r.item] ?? 0) + 1;
      return res(true, out, r.notice, r.fight);
    }
    case 'legend': {
      const r = startLegend(block, action.legend);
      return res(r.ok, r.ok ? withBlock(run, r.block) : run, r.notice, r.ok);
    }
    case 'after': {
      const r = afterStand(block, action.how, run.seed);
      if (!r.ok) return res(false, run, r.notice);
      let out = withBlock(structuredClone(run), withCrew(r.block));
      if (r.joined) {
        // They join as an Executive (Part 8) and bring their own six.
        const b = out.expansion!.dominion!;
        const m = heroMember(b, `m${b.crew!.next++}`);
        m.team = heroTeam(b, out, 'hero', 'stand').team.filter((x) => content.species.has(x.species)).slice(0, 6).map((x) => newMon(content, out, x.species, x.level, 'p'));
        b.members.push(m);
        out = withBlock(out, withCrew(b));
      }
      return res(true, out, r.notice);
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

/**
 * Finishes what the night left pending: caught Pokémon (kept "for themselves" or into the Reserve, D4), levels, items
 * into the Bag. Runs once per step; also keeps the Reserve's records up to date and runs Auto-fill when it's on.
 */
export function settleCrew(content: Content, run: RunState): RunState {
  const blk = run.expansion?.dominion;
  if (!blk) return run;
  const out = structuredClone(run);
  const b = withReserve(content, out.expansion!.dominion!);
  const st = b.crew;
  // D4b: eggs due this morning hatch into the Reserve.
  const hatched = hatchEggs(content, out, b);
  if (hatched.length) b.report = [...b.report, ...hatched];
  if (!st?.pending.length) {
    if (book(b).auto) autoFill(b);
    return out;
  }
  const lines: string[] = [];
  for (const p of st.pending) {
    if (p.k === 'mon') {
      const line = placeMon(content, out, b, p);
      if (line) lines.push(line);
    } else if (p.k === 'level') {
      // A member's Pokémon, or (Nurturer) one in the Reserve.
      const mon = b.members.find((m) => m.id === p.member)?.team.find((x) => x.uid === p.uid) ?? b.reserve?.box.find((x) => x.uid === p.uid);
      if (mon && p.level > mon.level) addLevels(content, mon, p.level - mon.level, p.level);
    } else if (p.k === 'move') lines.push(...settleLesson(content, b, p));
    else if (p.k === 'dojo') lines.push(...settleDojo(content, out, b, p));
    else out.inventory[p.id] = (out.inventory[p.id] ?? 0) + p.n;
  }
  st.pending = [];
  if (lines.length) b.report = [...b.report, ...lines];
  if (book(b).auto) autoFill(b);
  // D5: the stores hold 20 Pokémon, more with Pokémon Storage; the newest over the cap are let go, and the report says so.
  const cap = storageCap(b);
  if (st.stores.length > cap) {
    const n = st.stores.length - cap;
    st.stores = st.stores.slice(0, cap);
    b.report = [...b.report, DOMINION_DATA.hq.lines.storageFull!.replace('{cap}', String(cap)).replace('{n}', String(n))];
  }
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
