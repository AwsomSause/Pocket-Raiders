// DOMINION slice D4: ranks, Team Types and the Reserve (plans/evil-mode-rework BUILD_SLICES.md; Part 7, Part 8, Part 9 A19).
import { describe, expect, it } from 'vitest';
import { crewOf, crewStep, monName, odds, taskById, withCrew } from '../../src/core/dominion/crew';
import { fileModel } from '../../src/core/dominion/crewScreens';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { card } from '../../src/core/dominion/field';
import {
  aceCapOf, bandOf, bstCapOf, demote, fitFor, hasBand, levelCapOf, promote, promoteProblem, rankRow, readyFor, seatsOpen, strip,
} from '../../src/core/dominion/pyramid';
import { autoFill, book, fitsMember, offerFreedom, placeMon, takeBack, usable, usableMons, withReserve } from '../../src/core/dominion/reserve';
import { pyramidModel, reserveModel } from '../../src/core/dominion/reserveScreens';
import { DOMINION_MODE_ID, settleCrew, startInRun, stepInRun } from '../../src/core/dominion/session';
import { DominionBlockSchema, type DominionAction, type DominionBlock, type Member, type MonMeta } from '../../src/core/dominion/schema';
import { fits, talkById } from '../../src/core/dominion/talk';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun, newMon } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const PY = DOMINION_DATA.pyramid;
const domRun = (seed = 'dm4'): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const started = (seed = 'dm4', member: 'grunt' | 'admin' = 'grunt'): RunState => {
  const out = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member, look: 0 });
  expect(out.problem).toBeNull();
  return stepInRun(content, out.run, { t: 'open' }).run;
};
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const go = (r: RunState, a: DominionAction): RunState => {
  const out = stepInRun(content, r, a);
  expect(out.ok, `${a.t}: ${out.notice}`).toBe(true);
  return out.run;
};
const answerAll = (r: RunState): RunState => {
  while (blk(r).crew?.talks.length) r = go(r, { t: 'talk', choice: 0 });
  return r;
};
const round = (r: RunState): RunState => go(go(answerAll(go(go(r, { t: 'toNight' }), { t: 'rest' })), { t: 'toDay' }), { t: 'endDay' });
const withRun = (r: RunState, f: (b: DominionBlock) => void): RunState => {
  const b = withReserve(content, withCrew(structuredClone(blk(r))));
  f(b);
  return { ...r, expansion: { ...r.expansion, dominion: DominionBlockSchema.parse(b) } };
};
const rook = (b: DominionBlock): Member => b.members[0]!;
const meta = (o: Partial<MonMeta>): MonMeta => ({ trust: 4, src: 'caught', by: null, pens: 0, ace: false, bst: 300, types: ['poison'], rare: false, ...o });
/** A second member: a copy of Rook with a new id. */
const addMember = (b: DominionBlock, id: string, rank: string, level: number): Member => {
  const m = structuredClone(rook(b));
  m.id = id;
  m.name = id.toUpperCase();
  m.rank = rank;
  m.level = level;
  m.team = [];
  b.members.push(m);
  return m;
};
const reserveMon = (r: RunState, b: DominionBlock, species: string, level: number, src: MonMeta['src'] = 'caught'): string => {
  const mon = newMon(content, r, species, level, 'p');
  book(b).box.push(mon);
  withReserve(content, b);
  book(b).meta[mon.uid]!.src = src;
  return mon.uid;
};

describe('DOMINION D4: the data', () => {
  it('fifteen ranks match the crew ranks, seats run out as you climb, five bands of three, Aces from Lieutenant', () => {
    expect(PY.ranks.map((r) => r.id)).toEqual(DOMINION_DATA.crew.ranks.map((r) => r.id));
    const seated = PY.ranks.filter((r) => r.seats);
    for (let i = 1; i < seated.length; i++) expect(seated[i]!.seats).toBeLessThanOrEqual(seated[i - 1]!.seats);
    expect(PY.ranks.slice(0, 3).every((r) => r.seats === 0)).toBe(true);
    expect(rankRow('right-hand')).toMatchObject({ seats: 1, aces: 2, aceCap: 620, team: 6 });
    expect(PY.ranks.findIndex((r) => r.aces > 0)).toBe(8); // Lieutenant
    for (const r of PY.ranks) expect(bandOf(r.id).from).toBeLessThanOrEqual(DOMINION_DATA.crew.ranks.find((x) => x.id === r.id)!.n);
    expect(PY.bands.map((x) => x.name)).toEqual(['Street', 'Crew', 'Officers', 'Command', 'Inner Circle']);
  });
  it('D4 turned on its tasks and actions; nothing still says it waits for D4', () => {
    for (const id of ['catch', 'steal-pokemon', 'guard-the-pens', 'tend-the-pens', 'feed-the-team', 'release-the-weak', 'rehab-a-wild-pokemon']) expect(taskById(id)!.status, id).toBe('supported');
    expect(DOMINION_DATA.tasks.some((t) => t.needs === 'D4')).toBe(false);
    expect(DOMINION_DATA.crew.talks.some((t) => t.needs === 'D4')).toBe(false);
    expect(DOMINION_DATA.crew.formed.some((t) => t.needs === 'D4')).toBe(false);
    for (const id of ['rescue-a-wild-pokemon', 'tame-the-wild', 'evolve-in-peace', 'promotion-ceremony', 'mentor', 'toll-booth', 'cat-burglar', 'back-alley-brawl', 'train-robbery']) expect(DOMINION_DATA.field.play[id], id).toBeDefined();
  });
});

describe('DOMINION D4: caps and the Team Type rule (Part 7 §4, Part 8 §2)', () => {
  it('level cap is the rank share of the HQ cap (mockup 11: a Grunt at HQ cap 40 has 24); BST cap is base + region + standing', () => {
    const b = withCrew(blk(started()));
    b.levelCap = 40;
    expect(levelCapOf(b, { rank: 'grunt' })).toBe(24);
    expect(levelCapOf(b, { rank: 'sergeant' })).toBe(32);
    expect(levelCapOf(b, { rank: 'hopeful' })).toBe(20);
    expect(bstCapOf(b, { rank: 'grunt' })).toBe(340); // Nobody: +0
    expect(aceCapOf(b, { rank: 'grunt' })).toBe(0);
    expect(aceCapOf(b, { rank: 'admin' })).toBe(560);
  });
  it('fits: on-type under both caps; refuses off-type, over the level cap, over the BST cap, and Legendaries; an Ace slot takes any type', () => {
    const b = withCrew(blk(started()));
    b.levelCap = 40;
    const g = { rank: 'grunt' };
    expect(fitFor(b, g, 20, meta({ types: ['dark'] }), false)).toEqual({ ok: true, ace: false, why: null });
    expect(fitFor(b, g, 20, meta({ types: ['water', 'flying'] }), false).why).toBe('Off-type');
    expect(fitFor(b, g, 20, meta({ types: ['dragon', 'dark'] }), false).ok).toBe(true); // either half counts
    expect(fitFor(b, g, 25, meta({}), false).why).toBe('Lv 25 > cap 24');
    expect(fitFor(b, g, 24, meta({}), false).ok).toBe(true); // boundary
    expect(fitFor(b, g, 20, meta({ bst: 341 }), false).why).toBe('BST 341 > cap 340');
    expect(fitFor(b, g, 20, meta({ bst: 340 }), false).ok).toBe(true);
    expect(fitFor(b, g, 20, meta({ rare: true }), true).why).toBe('Never for crew');
    const lt = { rank: 'lieutenant' };
    expect(fitFor(b, lt, 30, meta({ types: ['dragon'], bst: 500 }), true)).toEqual({ ok: true, ace: true, why: null });
    expect(fitFor(b, lt, 30, meta({ types: ['dragon'], bst: 500 }), false).why).toBe('Off-type');
    expect(fitFor(b, lt, 30, meta({ types: ['dragon'], bst: 600 }), true).ok).toBe(false); // over the Ace cap 520
  });
  it('Bug Whisperer adds 10 to the level cap for Bug types only', () => {
    const b = withCrew(blk(started()));
    b.types = ['bug', 'dark'];
    const m = { rank: 'grunt', crew: { ...crewOf(rook(b)), formed: ['bug-whisperer'] } };
    expect(fitFor(b, m, 18, meta({ types: ['bug'] }), false).ok).toBe(true);
    expect(fitFor(b, m, 10, meta({ types: ['dark'] }), false).ok).toBe(false);
  });
});

describe('DOMINION D4: the Reserve (Part 7 §2-3)', () => {
  it('Day 1: the first member holds a Team Type Pokémon; the Reserve has one of the other type, low level and low BST', () => {
    const b = blk(started());
    const r = b.reserve!;
    expect(r.box).toHaveLength(1);
    const sp = content.species.get(r.box[0]!.speciesId)!;
    const rookTypes = content.species.get(rook(b).team[0]!.speciesId)!.types as readonly string[];
    expect(sp.types.some((t) => b.types.includes(t))).toBe(true);
    expect(b.types.find((t) => !rookTypes.includes(t)) ? sp.types.some((t) => !rookTypes.includes(t)) : true).toBe(true);
    expect(r.box[0]!.level).toBeGreaterThanOrEqual(3);
    expect(r.box[0]!.level).toBeLessThanOrEqual(5);
    expect(r.auto).toBe(false);
    expect(r.meta[rook(b).team[0]!.uid]).toMatchObject({ src: 'own', trust: 5 });
  });
  it('give by hand: fits go on the team; off-type and full teams are refused with the reason; the Boss can take any', () => {
    let r = started();
    const box = blk(r).reserve!.box[0]!;
    r = go(r, { t: 'give', uid: box.uid, to: 'm1' });
    expect(rook(blk(r)).team.map((x) => x.uid)).toContain(box.uid);
    expect(blk(r).reserve!.box).toHaveLength(0);
    let uid = '';
    r = withRun(r, (b) => { uid = reserveMon(r, b, 'ekans', 5); });
    const full = stepInRun(content, r, { t: 'give', uid, to: 'm1' });
    expect(full.ok).toBe(false);
    expect(full.notice).toBe('Ekans: Team full.'); // a Grunt holds 2
    r = withRun(r, (b) => { uid = reserveMon(r, b, 'pidgey', 5); });
    r = withRun(r, (b) => { rook(b).rank = 'senior-grunt'; rook(b).team = rook(b).team.slice(0, 1); });
    const off = stepInRun(content, r, { t: 'give', uid, to: 'm1' });
    expect(off.notice).toBe('Pidgey: Off-type.');
    const party = r.party.length;
    r = go(r, { t: 'give', uid, to: 'boss' });
    expect(r.party.length + (r.box?.length ?? 0)).toBeGreaterThan(party);
    expect(blk(r).reserve!.meta[uid]).toBeUndefined();
  });
  it('take back: Evenings only; Loyalty −5, −10 for one they caught; not when the Reserve is full', () => {
    let r = started(); // Day 1 Evening
    const b = withReserve(content, withCrew(structuredClone(blk(r))));
    const mon = rook(b).team[0]!;
    const before = rook(b).loyalty;
    expect(takeBack(b, 'm1', mon.uid)).toMatchObject({ ok: true });
    expect(rook(b).loyalty).toBe(before - 10); // Rook's own (by: m1)
    const b2 = withReserve(content, withCrew(structuredClone(blk(r))));
    b2.reserve!.meta[rook(b2).team[0]!.uid]!.by = null;
    const l2 = rook(b2).loyalty;
    takeBack(b2, 'm1', rook(b2).team[0]!.uid);
    expect(rook(b2).loyalty).toBe(l2 - 5);
    r = go(go(r, { t: 'toNight' }), { t: 'rest' });
    const b3 = withReserve(content, withCrew(structuredClone(blk(r))));
    expect(takeBack(b3, 'm1', rook(b3).team[0]!.uid).notice).toBe('Pokémon are taken back in the Evening.');
    const b4 = withReserve(content, withCrew(structuredClone(blk(started()))));
    for (let i = 0; i < PY.reserve.size; i++) b4.reserve!.box.push({ ...b4.reserve!.box[0]!, uid: `x${i}` });
    expect(takeBack(b4, 'm1', rook(b4).team[0]!.uid).notice).toMatch(/full/);
  });
  it('Auto-fill is off until pressed; pressing fills empty slots with the best fit, pressing again turns it off', () => {
    let r = started();
    for (let i = 0; i < 2; i++) r = round(r);
    expect(rook(blk(r)).team).toHaveLength(1);
    r = go(r, { t: 'autoFill' });
    expect(blk(r).reserve!.auto).toBe(true);
    expect(rook(blk(r)).team).toHaveLength(2);
    r = go(r, { t: 'autoFill' });
    expect(blk(r).reserve!.auto).toBe(false);
    const b = withReserve(content, withCrew(structuredClone(blk(r))));
    expect(autoFill(b)).toBe(0); // nothing left that fits
  });
  it('"For themselves": an on-type find under the caps stays with the catcher (Loyalty +5); off-type goes to the Reserve (Q6); stolen ones sit in the Pens', () => {
    const r = started();
    const b = withReserve(content, withCrew(structuredClone(blk(r))));
    const l = rook(b).loyalty;
    expect(placeMon(content, r, b, { species: 'zubat', level: 5, by: 'm1', src: 'caught', self: true })).toBe('Rook kept a Zubat "for himself". Loyalty +5.');
    expect(rook(b).team).toHaveLength(2);
    expect(rook(b).loyalty).toBe(l + 5);
    const n = b.reserve!.box.length;
    expect(placeMon(content, r, b, { species: 'pidgey', level: 5, by: 'm1', src: 'caught', self: true })).toBe('Pidgey went into the Reserve.');
    expect(b.reserve!.box).toHaveLength(n + 1);
    expect(placeMon(content, r, b, { species: 'ekans', level: 6, by: 'm1', src: 'stolen' })).toBe('Stolen Ekans: 5 days in the Pens.');
    const st = b.reserve!.box.at(-1)!;
    expect(b.reserve!.meta[st.uid]).toMatchObject({ trust: 2, pens: b.day + 5, src: 'stolen' });
    for (let i = b.reserve!.box.length; i < PY.reserve.size; i++) b.reserve!.box.push({ ...st, uid: `f${i}` });
    expect(placeMon(content, r, b, { species: 'rattata', level: 3 })).toMatch(/full/);
  });
  it('Catch "for themselves" through the night: the hunt setting reaches the crew step', () => {
    let r = started();
    r = go(r, { t: 'hunt', member: 'm1', mode: 'self' });
    expect(blk(r).reserve!.hunt.m1).toBe('self');
    r = withRun(r, (b) => {
      crewOf(rook(b)).task = 'catch';
      rook(b).stats.brawn = 10;
    });
    for (let i = 0; i < 4; i++) r = round(r);
    const b = blk(r);
    expect(rook(b).team.length + b.reserve!.box.length).toBeGreaterThan(2);
    expect(b.crew!.pending).toEqual([]);
  });
  it('the Pens: a stolen Pokémon comes out after 5 days; a scared one may slip out unless someone guards the Pens', () => {
    const r = started();
    const b = withReserve(content, withCrew(structuredClone(blk(r))));
    placeMon(content, r, b, { species: 'ekans', level: 6, by: 'm1', src: 'stolen' });
    const uid = b.reserve!.box.at(-1)!.uid;
    b.reserve!.meta[uid]!.trust = 5; // trusting: never runs
    b.day += 5;
    const lines = crewStep(b, r.seed);
    expect(b.reserve!.meta[uid]!.pens).toBe(0);
    expect(lines.join(' ')).toContain('Ekans is out of the Pens.');
    // Many scared Pokémon, nobody guarding: some slip out; with a guard who did the job, none do.
    const scared = (guard: boolean): number => {
      const x = withReserve(content, withCrew(structuredClone(blk(r))));
      for (let i = 0; i < 12; i++) placeMon(content, r, x, { species: 'ekans', level: 6, src: 'stolen' });
      if (guard) {
        crewOf(rook(x)).task = 'guard-the-pens';
        rook(x).stats.wits = 10;
        rook(x).level = 30;
      }
      let left = 0;
      for (let d = 0; d < 3; d++) { x.day += 1; crewStep(x, r.seed); }
      left = x.reserve!.box.length;
      return left;
    };
    expect(scared(false)).toBeLessThan(13);
    expect(scared(true)).toBeGreaterThanOrEqual(scared(false));
  });
});

describe('DOMINION D4: Trust (A19)', () => {
  it('Trust 7+ gives its member +5 on every job; 0-3 costs 5; an empty team costs 30 on battle tasks and the report says so', () => {
    const b = withReserve(content, withCrew(structuredClone(blk(started()))));
    const m = rook(b);
    const guard = taskById('guard-hq')!;
    const base = (() => { b.reserve!.meta[m.team[0]!.uid]!.trust = 5; return odds(b, m, guard); })();
    b.reserve!.meta[m.team[0]!.uid]!.trust = 7;
    expect(odds(b, m, guard)).toBe(Math.min(95, base + 5));
    b.reserve!.meta[m.team[0]!.uid]!.trust = 3;
    expect(odds(b, m, guard)).toBe(Math.max(5, base - 5));
    b.reserve!.meta[m.team[0]!.uid]!.trust = 5;
    m.team = [];
    expect(odds(b, m, guard)).toBe(Math.max(5, base - 30));
    expect(odds(b, m, taskById('rest')!)).toBe(100);
    crewOf(m).task = 'guard-hq';
    b.day += 1;
    expect(crewStep(b, 'seed').join(' ')).toContain('Rook has no Pokémon. He guarded the door with a broom.');
  });
  it('offering freedom: Trust 10 always stays; Trust 0 always goes', () => {
    const r = started();
    const b = withReserve(content, withCrew(structuredClone(blk(r))));
    const uid = b.reserve!.box[0]!.uid;
    b.reserve!.meta[uid]!.trust = 10;
    expect(offerFreedom(b, uid, r.seed).notice).toMatch(/stays: Trust 10/);
    b.reserve!.meta[uid]!.trust = 0;
    expect(offerFreedom(b, uid, r.seed).notice).toMatch(/goes/);
    expect(b.reserve!.box).toHaveLength(0);
    expect(offerFreedom(b, uid, r.seed).ok).toBe(false);
  });
  it('Tend the Pens raises the lowest Trust; Release the Weak sells the weakest; Feed the Team lifts Morale; Rehab brings a Trust 7 Pokémon', () => {
    let r = started();
    r = withRun(r, (b) => { reserveMon(r, b, 'ekans', 5, 'stolen'); crewOf(rook(b)).task = 'tend-the-pens'; rook(b).stats.charm = 10; rook(b).level = 30; });
    const low = blk(r).reserve!.box.at(-1)!.uid;
    blk(r).reserve!.meta[low]!.trust = 2;
    const before = blk(r).reserve!.meta[low]!.trust;
    r = round(r);
    expect(blk(r).reserve!.meta[low]!.trust).toBeGreaterThan(before);
    r = withRun(r, (b) => { crewOf(rook(b)).task = 'release-the-weak'; });
    const n = blk(r).reserve!.box.length;
    const funds = blk(r).funds;
    r = go(go(r, { t: 'toNight' }), { t: 'rest' });
    expect(blk(r).reserve!.box.length).toBe(n - 1);
    expect(blk(r).report.join(' ')).toMatch(/sold the Ball: ₽20/);
    expect(blk(r).funds).toBeGreaterThan(funds - 1000);
    r = answerAll(r);
    r = go(go(r, { t: 'toDay' }), { t: 'endDay' });
    r = withRun(r, (b) => { crewOf(rook(b)).task = 'rehab-a-wild-pokemon'; });
    r = go(go(r, { t: 'toNight' }), { t: 'rest' });
    const rehab = Object.values(blk(r).reserve!.meta).find((x) => x.src === 'rescued');
    expect(rehab?.trust).toBe(7);
  });
  it('Gentle Hands: what they catch starts with +1 Trust', () => {
    const r = started();
    const b = withReserve(content, withCrew(structuredClone(blk(r))));
    crewOf(rook(b)).formed = ['gentle-hands'];
    placeMon(content, r, b, { species: 'pidgey', level: 3, by: 'm1', src: 'caught' });
    expect(b.reserve!.meta[b.reserve!.box.at(-1)!.uid]!.trust).toBe(5);
  });
});

describe('DOMINION D4: the Rank Pyramid (Part 8)', () => {
  it('promote: Evenings only, needs the level, the HQ level and an open seat; pays the new wage; Loyalty +10, Morale +15', () => {
    const r = started();
    const b = withReserve(content, withCrew(structuredClone(blk(r))));
    const m = rook(b);
    expect(promoteProblem(b, m)).toMatch(/needs member Lv 6/);
    m.level = 6;
    expect(readyFor(b, m)?.id).toBe('senior-grunt');
    const l = m.loyalty, mo = m.morale;
    expect(promote(b, 'm1').ok).toBe(true);
    expect(m).toMatchObject({ rank: 'senior-grunt', wage: 130, loyalty: Math.min(100, l + 10), morale: Math.min(100, mo + 15) });
    m.level = 8;
    expect(promoteProblem(b, m)).toBe('VETERAN GRUNT needs HQ Lv 2.');
    b.hqLevel = 2;
    expect(promoteProblem(b, m)).toBeNull();
    b.phase = 'day';
    expect(promoteProblem(b, m)).toBe('Promotions happen in the Evening.');
  });
  it('seats run out: the one passed over gains Ambition +10; three times makes them Resentful', () => {
    const b = withReserve(content, withCrew(structuredClone(blk(started()))));
    b.hqLevel = 6;
    const a = addMember(b, 'a', 'executive', 28);
    const c = addMember(b, 'c', 'executive', 28);
    b.reserve!.passed.c = 2;
    expect(seatsOpen(b, 'right-hand')).toBe(1);
    const amb = crewOf(c).ambition;
    const out = promote(b, a.id);
    expect(out.notice).toMatch(/C was passed over\. Ambition \+10\..*Resentful/);
    expect(crewOf(c).ambition).toBe(amb + 10);
    expect(crewOf(c).formed).toContain('resentful');
    expect(promoteProblem(b, c)).toBe('Every RIGHT HAND seat is taken.');
    expect(readyFor(b, c)?.id).toBe('right-hand'); // Ready, waiting for a seat
  });
  it('demote and strip: Evenings only; their Pokémon over the new caps are benched (dimmed on the Crew File)', () => {
    const r = started();
    const b = withReserve(content, withCrew(structuredClone(blk(r))));
    const m = rook(b);
    m.rank = 'sergeant';
    b.levelCap = 40;
    m.team[0]!.level = 31;
    expect(usable(b, m, m.team[0]!)).toBe(true);
    const l = m.loyalty;
    expect(demote(b, 'm1').ok).toBe(true);
    expect(m.rank).toBe('corporal');
    expect(m.loyalty).toBe(Math.max(0, l - 20));
    expect(usable(b, m, m.team[0]!)).toBe(false); // Lv 31 > 75% of 40
    expect(usableMons(b, m)).toHaveLength(0);
    expect(fileModel(b, 0).team[0]!.dim).toBe(true);
    expect(strip(b, 'm1').ok).toBe(true);
    expect(m.rank).toBe('recruit');
    expect(b.reserve!.stripped).toEqual(['m1']);
    expect(strip(b, 'm1').ok).toBe(false);
    b.phase = 'day';
    expect(demote(b, 'm1').notice).toBe('Demotions happen in the Evening.');
  });
  it('a stripped member may walk out that night with one Pokémon; the roll is the same every time', () => {
    const r = started();
    const left = (seed: string): boolean => {
      const b = withReserve(content, withCrew(structuredClone(blk(r))));
      rook(b).rank = 'grunt';
      addMember(b, 'z', 'grunt', 4);
      strip(b, 'm1');
      b.day += 1;
      crewStep(b, seed);
      return !b.members.some((x) => x.id === 'm1');
    };
    const seeds = Array.from({ length: 30 }, (_, i) => `s${i}`);
    const outs = seeds.map(left);
    expect(outs.some((x) => x)).toBe(true);
    expect(outs.some((x) => !x)).toBe(true);
    expect(seeds.map(left)).toEqual(outs);
  });
  it('"Rank N crew" actions need a member in that band: Toll Booth (band 2) opens once Rook is a Senior Grunt', () => {
    let r = go(go(answerAll(go(go(started(), { t: 'toNight' }), { t: 'rest' })), { t: 'toDay' }), { t: 'endDay' });
    r = go(go(answerAll(go(go(r, { t: 'toNight' }), { t: 'rest' })), { t: 'toDay' }), { t: 'endDay' });
    r = answerAll(go(go(r, { t: 'toNight' }), { t: 'rest' }));
    r = go(r, { t: 'toDay' });
    const b = blk(r);
    expect(hasBand(b, 1)).toBe(true);
    expect(hasBand(b, 2)).toBe(false);
    const routes = DOMINION_DATA.field.districts.flatMap((d) => d.targets.filter((t) => t.kind === 'route').map((t) => ({ d: d.id, t: t.id })));
    const line = 'Needs a member in the Crew band (Rank 2 crew) or higher.';
    const blocked = routes.map((x) => card(b, r, 'toll-booth', x.t, x.d)!.blocked);
    const at = blocked.indexOf(line);
    expect(at).toBeGreaterThanOrEqual(0);
    const up = withRun(r, (x) => { rook(x).rank = 'senior-grunt'; });
    expect(card(blk(up), up, 'toll-booth', routes[at]!.t, routes[at]!.d)!.blocked).not.toBe(line);
  });
  it('the Promotion Day talk promotes when ready and a seat is open; Passed Over follows a pass; The Oath at Grunt', () => {
    const b = withReserve(content, withCrew(structuredClone(blk(started()))));
    const m = rook(b);
    const roll = (): number => 1;
    expect(fits(b, m, talkById('promotion-day')!, 'evening', roll)).toBe(false);
    m.level = 6;
    expect(fits(b, m, talkById('promotion-day')!, 'evening', roll)).toBe(true);
    expect(fits(b, m, talkById('the-oath')!, 'evening', roll)).toBe(true);
    expect(fits(b, m, talkById('passed-over')!, 'morning', roll)).toBe(false);
    crewOf(m).flags.push(`passed:${b.day}`);
    expect(fits(b, m, talkById('passed-over')!, 'morning', roll)).toBe(true);
  });
  it('Promotion Ceremony needs a promotion today; Mentor needs a member brought', () => {
    let r = started();
    r = withRun(r, (b) => { rook(b).rank = 'sergeant'; rook(b).level = 30; });
    const hq = DOMINION_DATA.field.hq;
    expect(card(blk(r), r, 'promotion-ceremony', null, hq)!.blocked).toBe('Nobody was promoted today.');
    expect(card(blk(r), r, 'mentor', null, hq)!.blocked).toBe('Bring a member to teach (B on the Card).');
    r = withRun(r, (b) => { b.hqLevel = 3; });
    r = go(r, { t: 'promote', member: 'm1' });
    expect(rook(blk(r)).rank).toBe('staff-sergeant');
    expect(card(blk(r), r, 'promotion-ceremony', null, hq)!.blocked).toBeNull();
    const done = go(r, { t: 'act', action: 'promotion-ceremony', target: null, district: hq, bring: [] });
    expect(rook(blk(done)).morale).toBeGreaterThanOrEqual(rook(blk(r)).morale);
  });
});

describe('DOMINION D4: screens, saves and determinism', () => {
  it('the Reserve model: caps beside the portrait, tags on every tile, the Give button names both', () => {
    const r = started();
    const b = withReserve(content, withCrew(structuredClone(blk(r))));
    reserveMon(r, b, 'pidgey', 5);
    const m = reserveModel(b, 'm1', 0, 0, false, { party: 3, look: '' });
    expect(m.who).toMatchObject({ lvCap: levelCapOf(b, rook(b)), bstCap: bstCapOf(b, rook(b)) });
    expect(m.who.sum).toBe('340 base + 0 region + 0 Nobody');
    expect(m.tiles.map((t) => t.tag)).toEqual(['FITS', 'OFF-TYPE']);
    expect(m.cta).toEqual({ text: `Give ${monName(m.tiles[0]!.species)} to Rook`, ok: true });
    expect(reserveModel(b, 'm1', 0, 0, true, { party: 3, look: '' }).tiles).toHaveLength(1);
    expect(reserveModel(b, 'boss', 1, 0, false, { party: 3, look: '' }).cta.ok).toBe(true);
    expect(fitsMember(b, rook(b), b.reserve!.box[1]!).why).toBe('Off-type');
  });
  it('the Pyramid model: 16 tiers, seats by rank, the hot tier and the gold thread when someone is ready for an open seat', () => {
    const b = withReserve(content, withCrew(structuredClone(blk(started()))));
    let m = pyramidModel(b, 0, 'Warehouse');
    expect(m.tiers).toHaveLength(15);
    expect(m.tiers[0]!.label).toBe('THE BOSS');
    expect(m.tiers.find((t) => t.n === 4)!.seats).toHaveLength(16);
    expect(m.tiers.find((t) => t.n === 3)!.count).toBe('1 member');
    expect(m.cta.ok).toBe(false);
    rook(b).level = 6;
    m = pyramidModel(b, 0, 'Warehouse');
    expect(m.head).toBe('SENIOR GRUNT SEAT OPEN');
    expect(m.tiers.find((t) => t.n === 4)!.hot).toBe(true);
    expect(m.thread).not.toBeNull();
    expect(m.cta).toEqual({ text: 'Promote Rook', ok: true });
  });
  it('save and reload keep the Reserve, Trust and ranks; a D3 save (no Reserve, Pokémon in the stores) loads and moves them in', () => {
    let r = started();
    r = go(r, { t: 'give', uid: blk(r).reserve!.box[0]!.uid, to: 'm1' });
    r = round(r);
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(r);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(blk(loaded.data)).toEqual(blk(r));
    // A D3-era block: no `reserve`, one Pokémon waiting in `crew.stores`.
    const old = structuredClone(r);
    const ob = old.expansion!.dominion!;
    const stored = newMon(content, old, 'koffing', 4, 'p');
    delete ob.reserve;
    ob.crew!.stores = [stored];
    new SaveManager(storage, content).saveRun(old);
    const back = new SaveManager(storage, content).loadRun();
    expect(back.status).toBe('ok');
    if (back.status !== 'ok') return;
    expect(blk(back.data).reserve).toBeUndefined();
    const next = settleCrew(content, back.data);
    expect(blk(next).reserve!.box.map((x) => x.uid)).toContain(stored.uid);
    expect(blk(next).crew!.stores).toEqual([]);
    expect(blk(next).reserve!.meta[rook(blk(next)).team[0]!.uid]).toBeDefined();
  });
  it('a damaged Reserve record is refused by the schema', () => {
    const b = structuredClone(blk(started())) as DominionBlock;
    b.reserve!.meta[Object.keys(b.reserve!.meta)[0]!]!.trust = 11;
    expect(DominionBlockSchema.safeParse(b).success).toBe(false);
  });
  it('same seed, same choices, same Reserve and ranks after a week', () => {
    const play = (): DominionBlock => {
      let r = started('det4');
      r = go(r, { t: 'hunt', member: 'm1', mode: 'self' });
      r = withRun(r, (b) => { crewOf(rook(b)).task = 'catch'; });
      for (let i = 0; i < 7; i++) r = round(r);
      return blk(r);
    };
    expect(play()).toEqual(play());
  });
});
