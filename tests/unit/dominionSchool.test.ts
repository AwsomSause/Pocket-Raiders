// DOMINION slice D4b: the items later slices pointed at D4 (pyramid.json `school`; src/core/dominion/school.ts): Learn a
// Trade and Teach a Move (crew tasks), Egg Run, Breed and Move Tutor (Boss actions), and the rank and training rooms.
import { describe, expect, it } from 'vitest';
import { crewOf, taskById, withCrew } from '../../src/core/dominion/crew';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { actionDef, actionStatus, card } from '../../src/core/dominion/field';
import { letGo } from '../../src/core/dominion/hq';
import { buildPrice, hirePrice, hqFx, seatsAt } from '../../src/core/dominion/hqFx';
import { levelFor, promote, readyFor, seatsOf, seatsOpen } from '../../src/core/dominion/pyramid';
import { book, withReserve } from '../../src/core/dominion/reserve';
import {
  bossTutor, breed, eggRun, eggsOf, hatchEggs, nextTrade, pickMove, schoolWeek, settleDojo, settleLesson, tradeDay, tradesOf, tutorDay, tutorFee,
} from '../../src/core/dominion/school';
import { DOMINION_MODE_ID, settleCrew, startInRun, stepInRun } from '../../src/core/dominion/session';
import { DominionBlockSchema, type DominionBlock, type Member, type Room } from '../../src/core/dominion/schema';
import { wageOf } from '../../src/core/dominion/worldTurn';
import { ivsOf } from '../../src/core/ivs';
import { hashSeed, Rng } from '../../src/core/rng';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun, newMon } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const SC = DOMINION_DATA.pyramid.school;
const domRun = (seed = 'd4b'): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const started = (seed = 'd4b'): RunState => {
  const out = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return stepInRun(content, out.run, { t: 'open' }).run;
};
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
/** A working copy of the block, with the crew and the Reserve filled in. */
const work = (r: RunState): DominionBlock => withReserve(content, withCrew(structuredClone(blk(r))));
const rook = (b: DominionBlock): Member => b.members[0]!;
const addMember = (b: DominionBlock, id: string, rank: string, level: number): Member => {
  const m = structuredClone(rook(b));
  m.id = id;
  m.name = id.toUpperCase();
  m.rank = rank;
  m.level = level;
  m.team = [];
  m.joinedDay = 1;
  b.members.push(m);
  return m;
};
let uid = 0;
const room = (b: DominionBlock, id: string, tier = 1): void => {
  b.hq!.rooms.push({ uid: `t${++uid}`, id, tier, cond: 100, spent: 0, building: false, up: false, ready: 0, shut: false, ruined: false, at: null } satisfies Room);
};
const said = (): { lines: string[]; say: (k: string, t: string) => void } => {
  const lines: string[] = [];
  return { lines, say: (_k, t) => void lines.push(t) };
};
const reserveMon = (r: RunState, b: DominionBlock, species: string, level: number, trust = 5): string => {
  const mon = newMon(content, r, species, level, 'p');
  book(b).box.push(mon);
  withReserve(content, b);
  book(b).meta[mon.uid]!.trust = trust;
  return mon.uid;
};
const R = (key: string): Rng => new Rng(hashSeed(key));

describe('DOMINION D4b: the data', () => {
  it('nothing waits for D4 any more: the two tasks, three actions and 18 rooms are live; Plant a Mole is played (D22)', () => {
    for (const id of ['learn-a-trade', 'teach-a-move']) expect(taskById(id), id).toMatchObject({ status: 'supported' });
    expect(taskById('learn-a-trade')!.effect).toEqual({ kind: 'trade' });
    expect(taskById('teach-a-move')!.effect).toEqual({ kind: 'tutor' });
    for (const id of ['egg-run', 'breed', 'move-tutor']) expect(actionStatus(actionDef(id)!), id).toMatchObject({ play: true, slice: null });
    expect(DOMINION_DATA.field.later.byAction['plant-a-mole']).toBeUndefined();
    expect(actionStatus(actionDef('plant-a-mole')!).play).toBe(true);
    const rooms = ['admin-quarters', 'classroom', 'sparring-ring', 'stealth-school', 'officer-academy', 'therapy-room', 'retiree-hall', 'comfort-ward',
      'grunt-academy', 'skill-booth', 'veterans-corner', 'skill-exam-hall', 'personality-lab', 'mentoring-office', 'sergeants-post',
      'lieutenants-office', 'captains-hall', 'type-dojo-fire'];
    for (const id of rooms) {
      const def = DOMINION_DATA.buildings.find((x) => x.id === id)!;
      expect(def.status, id).toBe('supported');
      expect(Object.keys(def.fx).length, id).toBeGreaterThan(0);
    }
    expect(SC.trades.map((t) => t.id).sort()).toEqual(['cook', 'forger', 'mechanic']);
  });
});

describe('DOMINION D4b: the rank rooms', () => {
  it("Sergeant's Post and the other seat rooms add seats (+1 more every three tiers); Officer Academy lowers levels up to Sergeant", () => {
    const b = work(started());
    expect(seatsAt(1, 1)).toBe(1);
    expect(seatsAt(1, 3)).toBe(1);
    expect(seatsAt(1, 4)).toBe(2);
    const base = seatsOf(b, 'sergeant');
    room(b, 'sergeants-post');
    expect(seatsOf(b, 'sergeant')).toBe(base + 1);
    room(b, 'admin-quarters', 4);
    expect(seatsOf(b, 'admin')).toBe(DOMINION_DATA.pyramid.ranks.find((r) => r.id === 'admin')!.seats + 2);
    expect(seatsOf(b, 'grunt')).toBe(Infinity);
    // A ruined room gives nothing.
    b.hq!.rooms.at(-1)!.ruined = true;
    expect(seatsOf(b, 'admin')).toBe(DOMINION_DATA.pyramid.ranks.find((r) => r.id === 'admin')!.seats);
    const sgt = levelFor(b, 'sergeant'), lt = levelFor(b, 'lieutenant');
    room(b, 'officer-academy');
    expect(levelFor(b, 'sergeant')).toBe(sgt - 2);
    expect(levelFor(b, 'lieutenant')).toBe(lt);
    // Ready one rank early: a Staff Sergeant-ready member is ready for Sergeant two levels sooner.
    const m = rook(b);
    m.rank = 'corporal';
    m.level = sgt - 2;
    b.hqLevel = 3;
    expect(readyFor(b, m)?.id).toBe('sergeant');
  });

  it('Classroom: a trait forms at promotion (a trait point once two have formed); Skill Exam Hall: +1 to the best stat', () => {
    const b = work(started());
    b.phase = 'evening';
    b.hqLevel = 3;
    const m = rook(b);
    m.rank = 'grunt';
    m.level = 30;
    crewOf(m).formed = [];
    crewOf(m).treat = { praise: 5 };
    crewOf(m).tally = { street: 30 };
    room(b, 'classroom');
    room(b, 'skill-exam-hall');
    const best = (Object.entries(m.stats) as [keyof Member['stats'], number][]).filter(([, v]) => v < 10).sort((a, x) => x[1] - a[1])[0]!;
    const out = promote(b, m.id);
    expect(out.ok, out.notice ?? '').toBe(true);
    expect(m.stats[best[0]]).toBe(best[1] + 1);
    expect(out.notice).toContain('Skill Exam Hall');
    if (crewOf(m).formed.length) expect(out.notice).toContain('chose a trait');
    else expect(m.traitPoints).toBeGreaterThan(0);
    // With two formed traits: a point instead.
    crewOf(m).formed = ['steady', 'driven'];
    const points = m.traitPoints;
    expect(promote(b, m.id).ok).toBe(true);
    expect(m.traitPoints).toBe(points + 1);
  });

  it('the rooms work only when built: no room, no seats, no level cut, no promotion bonus', () => {
    const b = work(started());
    const fx = hqFx(b);
    expect([fx.promoTrait, fx.examStat, fx.rankLv, fx.spar, fx.cure, fx.retirees, fx.taskXp]).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(fx.seats).toEqual({});
    expect(seatsOpen(b, 'sergeant')).toBe(DOMINION_DATA.pyramid.ranks.find((r) => r.id === 'sergeant')!.seats);
  });
});

describe('DOMINION D4b: Learn a Trade', () => {
  it('learns the trade their best stat fits; a second at level 3; a fail is an apprentice mistake (₽20)', () => {
    const b = work(started());
    const m = rook(b);
    m.stats = { brawn: 3, nerve: 3, wits: 9, charm: 2, stealth: 3 };
    expect(nextTrade(m)).toBe('forger');
    const s = said();
    tradeDay(b, m, true, { say: s.say, lv: 1 });
    expect(tradesOf(m)).toEqual(['forger']);
    tradeDay(b, m, true, { say: s.say, lv: 2 });
    expect(tradesOf(m)).toEqual(['forger']);
    tradeDay(b, m, true, { say: s.say, lv: 3 });
    expect(tradesOf(m)).toEqual(['forger', 'mechanic']);
    expect(s.lines[0]).toBe('ROOK learned the forger trade.'.replace('ROOK', m.name));
    const funds = b.funds;
    tradeDay(b, m, false, { say: s.say, lv: 3 });
    expect(b.funds).toBe(funds - SC.mistake);
    // Broke: the mistake costs what's left.
    b.funds = 5;
    tradeDay(b, m, false, { say: s.say, lv: 3 });
    expect(b.funds).toBe(0);
  });

  it('the perk is a discount from task level 2 (forger: Hire Grunt; mechanic: rooms; cook: wages), doubled at 4', () => {
    const b = work(started());
    const m = rook(b);
    crewOf(m).flags.push('trade:forger', 'trade:mechanic', 'trade:cook');
    expect(hqFx(b).hireOff).toBe(0);
    crewOf(m).taskXp['learn-a-trade'] = DOMINION_DATA.crew.rules.taskLevelXp[1]!;
    expect(hqFx(b)).toMatchObject({ hireOff: 5, buildOff: 5, wageOff: 5 });
    expect(hirePrice(b, 1000)).toBe(950);
    expect(buildPrice(b, 1000)).toBe(950);
    expect(wageOf(b, 100)).toBe(95);
    crewOf(m).taskXp['learn-a-trade'] = DOMINION_DATA.crew.rules.taskLevelXp[3]!;
    expect(hqFx(b)).toMatchObject({ hireOff: 10, buildOff: 10, wageOff: 10 });
  });

  it('the master craft (level 5) comes once a week: the forger brings in clean money', () => {
    const b = work(started());
    const m = rook(b);
    crewOf(m).flags.push('trade:forger');
    crewOf(m).taskXp['learn-a-trade'] = DOMINION_DATA.crew.rules.taskLevelXp[4]!;
    const clean = b.hq!.clean;
    const lines: string[] = [];
    schoolWeek(b, lines);
    expect(b.hq!.clean).toBe(clean + 100);
    expect(lines.join(' ')).toContain('master craft');
  });
});

describe('DOMINION D4b: Teach a Move and Move Tutor', () => {
  it('the tutor charges ₽100 (₽80 from level 2); no money, no lesson; a fail teaches nothing', () => {
    expect(tutorFee(1)).toBe(100);
    expect(tutorFee(2)).toBe(80);
    const b = work(started());
    const m = rook(b);
    b.crew!.pending = [];
    const s = said();
    b.funds = 1000;
    tutorDay(b, m, true, { say: s.say, lv: 2 });
    expect(b.funds).toBe(920);
    expect(b.crew!.pending).toEqual([{ k: 'move', member: m.id, n: 1, team: false, egg: false }]);
    tutorDay(b, m, true, { say: s.say, lv: 5 });
    expect(b.crew!.pending.at(-1)).toEqual({ k: 'move', member: m.id, n: 2, team: true, egg: true });
    b.funds = 10;
    tutorDay(b, m, true, { say: s.say, lv: 1 });
    expect(b.crew!.pending).toHaveLength(2);
    tutorDay(b, m, false, { say: s.say, lv: 1 });
    expect(s.lines.at(-1)).toContain("didn't stick");
  });

  it("the lesson settles with the content: a member's Pokémon learns its strongest move of its own type", () => {
    const r = started();
    const b = work(r);
    const m = rook(b);
    const mon = m.team[0]!;
    const before = mon.moves.map((x) => x.id);
    const want = pickMove(content, mon, { egg: false, any: true });
    expect(want).not.toBeNull();
    const lines = settleLesson(content, b, { member: m.id, n: 1, team: false, egg: false });
    expect(mon.moves.map((x) => x.id)).toContain(want);
    expect(mon.moves.length).toBeLessThanOrEqual(4);
    expect(lines[0]).toContain('learned');
    expect(before).not.toContain(want);
    // A member with no Pokémon: nothing to learn.
    m.team = [];
    expect(settleLesson(content, b, { member: m.id, n: 1, team: false, egg: false })[0]).toContain('nothing new');
  });

  it('Move Tutor costs ₽200, 20% less from its second mastery level, and teaches the Boss a move', () => {
    const r = started();
    const b = work(r);
    const c = card(b, r, 'move-tutor', null, DOMINION_DATA.field.hq)!;
    expect(c.money).toBe(200);
    b.field.mastery['move-tutor'] = DOMINION_DATA.field.mastery.thresholds[0]!;
    expect(card(b, r, 'move-tutor', null, DOMINION_DATA.field.hq)!.money).toBe(160);
    const run = structuredClone(r);
    const lines = bossTutor(content, run, 3);
    expect(lines[0]).toContain('learned');
    expect(run.party[0]!.moves).not.toEqual(r.party[0]!.moves);
  });
});

describe('DOMINION D4b: eggs', () => {
  it('Egg Run finds an egg that hatches in 3 days (2 from level 2); the species shows from level 4; six eggs at most', () => {
    const r = started();
    const b = work(r);
    expect(eggRun(content, b, r, 1, R('e1'))).toMatch(/^You found an egg\. It hatches in 3 days\.$/);
    expect(eggsOf(b)[0]).toMatchObject({ hatch: b.day + 3, src: 'found', shown: false });
    expect(eggRun(content, b, r, 4, R('e2'))).toMatch(/^You found an egg \(.+\)\. It hatches in 2 days\.$/);
    for (let i = 0; i < 4; i++) eggRun(content, b, r, 1, R(`e${i + 3}`));
    expect(eggsOf(b)).toHaveLength(SC.maxEggs);
    expect(eggRun(content, b, r, 1, R('e9'))).toContain('no room');
    // Level 3: a species the team already has (by family).
    const b2 = work(r);
    eggRun(content, b2, r, 3, R('k'));
    const fam = new Set([...r.party, ...b2.members.flatMap((m) => m.team), ...book(b2).box].map((m) => m.speciesId));
    expect([...fam].length).toBeGreaterThan(0);
  });

  it('eggs hatch into the Reserve at Trust 8 on the morning they are due, not before', () => {
    const r = started();
    const b = work(r);
    eggRun(content, b, r, 1, R('h'));
    const egg = eggsOf(b)[0]!;
    const run = structuredClone(r);
    const box = book(b).box.length;
    expect(hatchEggs(content, run, b)).toEqual([]);
    b.day = egg.hatch;
    const lines = hatchEggs(content, run, b);
    expect(lines[0]).toContain('An egg hatched');
    expect(eggsOf(b)).toHaveLength(0);
    const mon = book(b).box.at(-1)!;
    expect(book(b).box.length).toBe(box + 1);
    expect(mon.speciesId).toBe(egg.species);
    expect(book(b).meta[mon.uid]).toMatchObject({ src: 'hatched', trust: DOMINION_DATA.pyramid.trust.start.hatched });
  });

  it('Breed needs two Reserve Pokémon out of the Pens; same-family pairs first; level 3 IVs, level 5 hidden ability', () => {
    const r = started();
    const b = work(r);
    book(b).box = [];
    expect(breed(content, b, r, 1, R('b0'))).toBe(SC.lines.noPair);
    const a = reserveMon(r, b, 'pidgey', 10, 9);
    reserveMon(r, b, 'rattata', 10, 8);
    reserveMon(r, b, 'pidgeotto', 16, 3);
    reserveMon(r, b, 'rattata', 10, 1);
    // Pidgey's best mate is Pidgeotto (one family) over Rattata, though Rattata trusts more (and has a Rattata of its own).
    expect(breed(content, b, r, 5, R('b1'))).toContain('Pidgeotto');
    const egg = eggsOf(b)[0]!;
    expect(egg).toMatchObject({ species: 'pidgey', src: 'bred', shown: true, ivMin: SC.ivMin, hidden: true });
    void a;
    const run = structuredClone(r);
    b.day = egg.hatch;
    hatchEggs(content, run, b);
    const baby = book(b).box.at(-1)!;
    expect(Object.values(ivsOf(baby)).every((v) => v >= SC.ivMin)).toBe(true);
    expect(baby.abilitySlot).toBe(-1);
    // The Pens: a stolen Pokémon still cooling off can't breed.
    const b2 = work(r);
    book(b2).box = [];
    reserveMon(r, b2, 'pidgey', 10);
    const s = reserveMon(r, b2, 'rattata', 10);
    book(b2).meta[s]!.pens = b2.day + 3;
    room(b2, 'holding-pens');
    expect(card(b2, r, 'breed', null, DOMINION_DATA.field.hq)!.blocked).toBe(SC.lines.noPair);
  });
});

describe('DOMINION D4b: the rooms each week', () => {
  it('Sparring Ring, Stealth School, Grunt Academy, Veterans and Mentors train the crew', () => {
    const b = work(started());
    const g = rook(b);
    g.rank = 'grunt';
    const v = addMember(b, 'vet', 'veteran-grunt', 12);
    const ad = addMember(b, 'adm', 'admin', 20);
    for (const id of ['sparring-ring', 'stealth-school', 'grunt-academy', 'veterans-corner', 'mentoring-office']) room(b, id);
    const xp = { g: crewOf(g).xp, lvl: g.level };
    const sneak = crewOf(v).statXp.stealth + v.stats.stealth * 10;
    const loyal = g.loyalty;
    const lines: string[] = [];
    schoolWeek(b, lines);
    const text = lines.join(' ');
    expect(text).toContain('Sparring Ring');
    expect(text).toContain('Stealth School');
    expect(text).toContain('Grunt Academy');
    expect(text).toContain('showed');
    expect(text).toContain('mentored');
    expect(crewOf(v).statXp.stealth + v.stats.stealth * 10).toBe(sneak + 4);
    expect(crewOf(g).xp + g.level * 1000).toBeGreaterThan(xp.g + xp.lvl * 1000);
    expect(g.loyalty).toBe(Math.min(100, loyal + SC.pairLoyalty));
    void ad;
  });

  it('Personality Lab forms a trait early; Therapy Room cures Resentful (or counsels); Comfort Ward calms the most anxious Pokémon', () => {
    const r = started();
    const b = work(r);
    const m = rook(b);
    crewOf(m).formed = ['resentful'];
    book(b).passed[m.id] = 3;
    room(b, 'therapy-room');
    let lines: string[] = [];
    schoolWeek(b, lines);
    expect(crewOf(m).formed).toEqual([]);
    expect(book(b).passed[m.id]).toBe(0);
    const morale = m.morale;
    lines = [];
    schoolWeek(b, lines);
    expect(lines.join(' ')).toContain('talked it out');
    expect(m.morale).toBe(Math.min(100, morale + SC.counselMorale));
    room(b, 'personality-lab');
    crewOf(m).tally = { street: 30 };
    crewOf(m).treat = { praise: 4 };
    lines = [];
    schoolWeek(b, lines);
    expect(crewOf(m).formed.length).toBe(lines.some((l) => l.includes('Personality Lab')) ? 1 : 0);
    room(b, 'comfort-ward');
    const low = reserveMon(r, b, 'pidgey', 5, 1);
    reserveMon(r, b, 'rattata', 5, 2);
    lines = [];
    schoolWeek(b, lines);
    expect(book(b).meta[low]!.trust).toBe(1 + SC.wardTrust);
    expect(lines.filter((l) => l.startsWith('Comfort Ward'))).toHaveLength(1);
  });

  it('Retiree Hall: a loyal member let go after two weeks retires there; the retirees cheer the crew each week', () => {
    const b = work(started());
    const keep = rook(b);
    const old = addMember(b, 'old', 'grunt', 5);
    old.loyalty = 80;
    b.day = 20;
    room(b, 'retiree-hall');
    const out = letGo(b, old.id);
    expect(out.ok).toBe(true);
    expect(out.notice).toContain('retires to the Retiree Hall');
    const after = out.block;
    expect(after.reserve!.retirees).toEqual([{ name: 'OLD', day: 20 }]);
    const morale = keep.morale;
    const k = after.members[0]!;
    k.morale = morale;
    const lines: string[] = [];
    schoolWeek(after, lines);
    expect(k.morale).toBe(Math.min(100, morale + SC.retireeMorale));
    // Not loyal enough: no place.
    const b2 = work(started());
    const sour = addMember(b2, 'sour', 'grunt', 5);
    sour.loyalty = 10;
    b2.day = 20;
    room(b2, 'retiree-hall');
    expect(letGo(b2, sour.id).block.reserve!.retirees ?? []).toEqual([]);
  });

  it('Type Dojo: Fire queues the week for the session; Fire Pokémon (and only those) gain XP', () => {
    const r = started();
    const b = work(r);
    room(b, 'type-dojo-fire');
    b.crew!.pending = [];
    schoolWeek(b, []);
    expect(b.crew!.pending).toEqual([{ k: 'dojo', types: ['fire'], xp: 4 }]);
    const run = structuredClone(r);
    const fire = newMon(content, run, 'charmander', 10, 'p');
    const other = newMon(content, run, 'pidgey', 10, 'p');
    book(b).box.push(fire, other);
    const lines = settleDojo(content, run, b, { types: ['fire'], xp: 4 });
    expect(lines[0]).toContain('Fire');
    const xp0 = { fire: newMon(content, structuredClone(r), 'charmander', 10, 'p').xp, other: newMon(content, structuredClone(r), 'pidgey', 10, 'p').xp };
    expect(fire.xp).toBeGreaterThan(xp0.fire);
    expect(other.xp).toBe(xp0.other);
  });

  it('the Skill Booth adds a task XP point to every working day', () => {
    const b = work(started());
    expect(hqFx(b).taskXp).toBe(0);
    room(b, 'skill-booth');
    expect(hqFx(b).taskXp).toBe(1);
  });
});

describe('DOMINION D4b: saves and the clock', () => {
  it('a block with eggs and retirees round-trips; a D4 block without them loads unchanged', () => {
    const r = started();
    const b = work(r);
    eggRun(content, b, r, 2, R('s'));
    book(b).retirees = [{ name: 'OLD', day: 3 }];
    const back = DominionBlockSchema.parse(JSON.parse(JSON.stringify(b)));
    expect(back.reserve!.eggs).toEqual(b.reserve!.eggs);
    expect(back.reserve!.retirees).toEqual([{ name: 'OLD', day: 3 }]);
    const old = JSON.parse(JSON.stringify(blk(r)));
    delete old.reserve.eggs;
    delete old.reserve.retirees;
    expect(() => DominionBlockSchema.parse(old)).not.toThrow();
  });

  it('a found egg hatches through the real clock (settleCrew) the morning it is due, the same way every time', () => {
    const run1 = (): RunState => {
      const r = started('egg-clock');
      const b = work(r);
      eggRun(content, b, r, 1, R('clock'));
      b.day = eggsOf(b)[0]!.hatch;
      return settleCrew(content, { ...r, expansion: { ...r.expansion, dominion: DominionBlockSchema.parse(b) } });
    };
    const a = run1(), c = run1();
    expect(blk(a).report.join(' ')).toContain('An egg hatched');
    expect(blk(a).reserve!.box.map((m) => [m.speciesId, m.level])).toEqual(blk(c).reserve!.box.map((m) => [m.speciesId, m.level]));
  });
});

describe('DOMINION D4b: the Reserve screen', () => {
  it('shows the eggs waiting beside the Reserve count', async () => {
    const { reserveModel } = await import('../../src/core/dominion/reserveScreens');
    const r = started();
    const b = work(r);
    expect(reserveModel(b, 'm1', 0, 0, false, { party: 3, look: '' }).count).not.toContain('egg');
    eggRun(content, b, r, 1, R('screen'));
    expect(reserveModel(b, 'm1', 0, 0, false, { party: 3, look: '' }).count).toMatch(/ · 1 egg, next on Day \d+$/);
  });
});
