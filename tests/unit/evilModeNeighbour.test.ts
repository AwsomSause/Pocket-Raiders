// Evil Mode slice 13, "a neighbour" (build plan section 3; design Part 15a sections 1 to 7): Giovanni. The seven stances,
// five ticks on fixed days, his messages, the Sit-Down, the Chair, the Betrayal and the Legend, what's left of a team
// that falls, and stream `evil-neighbour`.

import { describe, expect, it } from 'vitest';
import { foundForPlay, playRegion } from '../../src/core/evilMode/autoplay';
import { layDistrict } from '../../src/core/evilMode/board';
import { cardFor } from '../../src/core/evilMode/card';
import { EVIL_DATA, type EvilData } from '../../src/core/evilMode/data';
import { BEAT_END, step, type EvilAction } from '../../src/core/evilMode/day';
import { beginEvilFight, stageLevel } from '../../src/core/evilMode/fight';
import { endEvilFight } from '../../src/core/evilMode/fightEnd';
import { acrossLine, chairProblem, counts, defOf, fallToTeam, isTheirs, neighbourEvening, putOnTable, sitChoices, stepStance, summary, tableThings } from '../../src/core/evilMode/neighbour';
import { neighbourModel } from '../../src/core/evilMode/neighbourScreens';
import { hire } from '../../src/core/evilMode/roster';
import { EvilModeBlockSchema, firstCrew, type Crew, type EvilModeBlock } from '../../src/core/evilMode/schema';
import { EVIL_MODE_ID, foundInRun, stepInRun } from '../../src/core/evilMode/session';
import { foundTeam } from '../../src/core/evilMode/start';
import { GYM_LEADER_CLASS } from '../../src/core/encounters';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun, healParty } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const found = (stage = 4, seed = 'nb1', line: 'clean' | 'grey' | 'whatever' = 'grey'): EvilModeBlock => {
  const r = foundTeam({ name: 'Kettle', creed: 'profit', line, doctrine: 'swarm' }, { boss: 'red', length: 'three', seed, stage });
  if (!r.ok) throw new Error(r.problem);
  return { ...r.block, crew: firstCrew(6, 6), applicants: [] };
};
const go = (b: EvilModeBlock, a: EvilAction): EvilModeBlock => {
  const r = step(b, a);
  if (!r.ok) throw new Error(`${a.type}: ${JSON.stringify(r.cues)}`);
  return r.block;
};
const toBeat = (b: EvilModeBlock, beat: EvilModeBlock['here']['beat']): EvilModeBlock => {
  for (let i = 0; i < 12 && b.here.beat !== beat; i++) b = go(b, { type: BEAT_END[b.here.beat] });
  return b;
};
const nextDay = (b: EvilModeBlock) => toBeat(go(b, { type: BEAT_END[b.here.beat] }), 'morning');
const nb = (b: EvilModeBlock) => b.neighbour!;
const reload = (b: EvilModeBlock) => EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(b)));
/** A Sit-Down from its start to the table, answering each exchange with the first open choice. */
const sitToTable = (b0: EvilModeBlock): EvilModeBlock => {
  let b = go(toBeat(b0, 'inPerson'), { type: 'sitDown' });
  for (let i = 0; i < 6 && nb(b).sitting!.ex < 3; i++) b = go(b, { type: 'sitAnswer', i: sitChoices(b).findIndex((c) => c.open) });
  return b;
};
const minor: Crew = { ...firstCrew(1)[0]!, id: 'kid', name: 'Tobi', age: 15, minor: true };

describe('the neighbour (Part 15a sections 1 and 7.1)', () => {
  it('Giovanni is Kanto\'s neighbour, at Wary, with Dread 6 and a Pen of twenty, and Rocket holds ground in every district', () => {
    const b = found(1);
    expect(nb(b)).toMatchObject({ id: 'giovanni', stance: 'wary', dread: 6, pen: 20, fallen: null });
    expect(summary(nb(b))).toBe('Rivals');
    const def = defOf(nb(b));
    for (let n = 1; n <= 6; n++) {
      const d = layDistrict('s', 0, n, { regard: 0, dread: 0 });
      expect(d.holdings.filter((h) => h.tags?.includes('rocket')).length, `district ${n}`).toBe(def.holds[String(n)]);
      expect(d.holdings.filter((h) => h.tags?.includes('rocket')).every((h) => def.kinds.includes(h.kind))).toBe(true);
    }
  });
  it('their turf has its own generator: with the neighbour off, every other roll and tag is the same', () => {
    const OFF: EvilData = { ...EVIL_DATA, neighbour: { ...EVIL_DATA.neighbour, on: false } };
    for (let n = 0; n <= 7; n++) {
      const on = layDistrict('t', 0, n, { regard: 0, dread: 0 });
      const off = layDistrict('t', 0, n, { regard: 0, dread: 0 }, OFF);
      const strip = (d: typeof on) => d.holdings.map((h) => ({ ...h, tags: (h.tags ?? []).filter((t) => t !== 'rocket') })).map(({ tags, ...h }) => ({ ...h, tags: tags.length ? tags : undefined }));
      expect(strip(on)).toEqual(strip(off));
      expect(off.holdings.some((h) => h.tags?.includes('rocket'))).toBe(false);
    }
  });
  it('the undo: with it off there is no neighbour and nothing of theirs on the Board', () => {
    const OFF: EvilData = { ...EVIL_DATA, neighbour: { ...EVIL_DATA.neighbour, on: false } };
    const r = foundTeam({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm' }, { boss: 'red', length: 'three', seed: 'off', stage: 4 }, OFF);
    expect(r.ok && r.block.neighbour).toBe(null);
  });
  it('the ladder: a step toward War, and back toward Wary but never past it', () => {
    expect(stepStance('wary', 'war')).toBe('rivals');
    expect(stepStance('rivals', 'war')).toBe('war');
    expect(stepStance('war', 'war')).toBe('war');
    expect(stepStance('truce', 'war')).toBe('wary');
    expect(stepStance('war', 'wary')).toBe('rivals');
    expect(stepStance('rivals', 'wary')).toBe('wary');
    expect(stepStance('wary', 'wary')).toBe('wary');
    expect(stepStance('truce', 'wary')).toBe('truce');
  });
});

describe('the clock: five ticks on fixed days (Part 15a section 3)', () => {
  it('ticks fire on their days whatever the player does', () => {
    const plain = found(4, 'clock');
    // One team only ends its beats; the other sits down with him on day 1, eats the basket, makes promises.
    let a = plain;
    let b = plain;
    for (let d = 0; d < 3; d++) {
      a = nextDay(a);
      b = toBeat(b, 'inPerson');
      if (d === 0) {
        b = sitToTable(b);
        b = go(b, { type: 'table', thing: 'promise' });
        b = go(b, { type: 'rise' });
      }
      b = nextDay(b);
    }
    expect(a.here.day).toBe(b.here.day);
    expect(nb(a).ticks[1]).toMatchObject({ state: 'fired', day: 3 });
    expect(nb(b).ticks[1]).toMatchObject({ state: 'fired', day: 3 });
    expect(nb(a).pen).toBe(43);
    expect(nb(a).dread).toBe(8);
  });
  it('tick 1 (before this stage) counts as happened at founding; nothing fires twice across a reload', () => {
    let b = found(4, 'twice');
    expect(nb(b).ticks[0]).toMatchObject({ state: 'fired', day: null });
    b = nextDay(nextDay(b));
    const fired = nb(b).ticks[1]!;
    expect(fired.state).toBe('fired');
    const posts = nb(b).posts.length;
    b = reload(b);
    // The morning's already been: stepping a beat doesn't fire it again.
    b = go(b, { type: BEAT_END[b.here.beat] });
    expect(nb(b).ticks[1]).toEqual(fired);
    expect(nb(b).posts.length).toBe(posts);
  });
  it('a stopped tick never fires, and the next comes two days late (a job not done, on the table)', () => {
    let b = found(4, 'stop');
    b = sitToTable(b);
    expect(nb(b).opinion).toBeGreaterThanOrEqual(0);
    b = go(b, { type: 'table', thing: 'job' });
    b = go(b, { type: 'rise' });
    expect(nb(b).ticks[1]!.state).toBe('stopped');
    expect(nb(b).ticks[2]!.late).toBe(2);
    for (let i = 0; i < 6; i++) b = nextDay(b);
    expect(nb(b).ticks[1]!.state).toBe('stopped');
    expect(nb(b).pen).toBe(20);
  });
  it('a region played whole: every tick fires once, on or after its day, and the Hero brings Rocket down at tick 5', () => {
    const r = playRegion(foundForPlay('whole', { name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm', patron: 'executive', region: 'kanto' }), 'mix');
    expect(r.finished).toBe(true);
    const n = nb(r.block);
    expect(n.ticks.map((t) => t.state)).toEqual(['fired', 'fired', 'fired', 'fired', 'fired']);
    const days = n.ticks.map((t) => t.day!);
    expect([...days].sort((x, y) => x - y)).toEqual(days);
    expect(n.fallen).toBe('hero');
    // Nobody sat down: the stance never reached Truce, Front or Merger.
    expect(n.sitDowns).toHaveLength(0);
    expect(['truce', 'front', 'merger']).not.toContain(n.stance);
  });
});

describe('his messages: the fruit basket (Part 15a section 7.3)', () => {
  it('arrives on day 2 of the Arrival; sending it back: opinion down a step, "Wasteful."; answered once', () => {
    let b = found(1, 'basket');
    expect(nb(b).posts).toHaveLength(0);
    b = nextDay(b);
    const p = nb(b).posts.find((x) => x.kind === 'basket')!;
    expect(p.text).toContain('Welcome to Kanto. — G.');
    expect(p.choices).toHaveLength(4);
    const r = step(b, { type: 'answerPost', id: p.id, i: 1 });
    expect(r.ok).toBe(true);
    expect(nb(r.block).opinion).toBe(-1);
    expect(JSON.stringify(r.cues)).toContain('Wasteful');
    expect(step(r.block, { type: 'answerPost', id: p.id, i: 2 }).ok).toBe(false);
  });
});

describe('the Sit-Down (Part 15a sections 4 and 7.4)', () => {
  it('the first exchange quotes a Ledger entry that exists; with no Lean, the warmer opening', () => {
    const plain = go(toBeat(found(4, 'sd1'), 'inPerson'), { type: 'sitDown' });
    expect(nb(plain).sitting!.lines.join(' ')).toContain('You haven\'t made any');
    const b0 = found(4, 'sd2');
    const h = b0.district!.holdings.find((x) => x.kind === 'local')!;
    const withLean = { ...b0, log: [...b0.log, { id: 'L99', day: 1, region: 0, district: b0.district!.n, kind: 'job' as const, who: ['g1'], to: h.id, method: 'lean' as const, result: 'went' as const, text: 'Day 1. Leaned.' }] };
    const b = go(toBeat(withLean, 'inPerson'), { type: 'sitDown' });
    const said = nb(b).sitting!.lines.join(' ');
    expect(said).toContain('untidy');
    expect(said).toContain(EVIL_DATA.district.locals.find((l) => l.id === h.ref)!.who.replace(/,.*$/, ''));
  });
  it('once a district; In person only; the Boss\'s outing; nothing else moves while it goes on', () => {
    const b0 = found(4, 'sd3');
    expect(step(b0, { type: 'sitDown' }).ok).toBe(false);
    let b = go(toBeat(b0, 'inPerson'), { type: 'sitDown' });
    expect(step(b, { type: 'stayIn' }).ok).toBe(false);
    expect(step(b, { type: 'chair' }).ok).toBe(false);
    b = sitToTable(b0);
    b = go(b, { type: 'rise' });
    expect(nb(b).sitDowns).toHaveLength(1);
    b = toBeat(nextDay(b), 'inPerson');
    expect(step(b, { type: 'sitDown' }).ok).toBe(false);
  });
  it('the stance reaches Truce only at the table, and Front only by his Card', () => {
    let b = sitToTable(found(4, 'sd4'));
    expect(nb(b).stance).toBe('front');
    let t = sitToTable(found(4, 'sd5'));
    void t;
    // Say no to the Front, then draw the line.
    b = go(toBeat(found(4, 'sd6'), 'inPerson'), { type: 'sitDown' });
    b = go(b, { type: 'sitAnswer', i: 0 });
    expect(nb(b).stance).toBe('wary');
    b = go(b, { type: 'sitAnswer', i: 1 });
    expect(nb(b).stance).toBe('wary');
    b = go(b, { type: 'sitAnswer', i: 2 });
    expect(nb(b).kept).toBe(EVIL_DATA.neighbour.neighbours[0]!.sitDown.first.dontKnow);
    b = go(b, { type: 'table', thing: 'line' });
    expect(nb(b).stance).toBe('truce');
    expect(summary(nb(b))).toBe('Allies');
    t = go(b, { type: 'rise' });
    expect(nb(t).sitDowns[0]!.table).toEqual(['line']);
  });
  it('a minor\'s card can\'t be put on the table: the slot refuses them', () => {
    let b = sitToTable(found(4, 'sd7'));
    b = { ...b, crew: [...b.crew, minor] };
    const r = putOnTable(b, 'person', 'kid');
    expect(r.problem).toBe(EVIL_DATA.neighbour.neighbours[0]!.sitDown.table.minor);
    expect(step(b, { type: 'table', thing: 'person', personId: 'kid' }).ok).toBe(false);
    expect(b.crew.find((c) => c.id === 'kid')!.where).toBe('in');
    // An adult can be.
    const ok = putOnTable(b, 'person', 'g3');
    expect(ok.problem).toBeNull();
    expect(ok.block.crew.find((c) => c.id === 'g3')!.where).toBe('left');
  });
  it('three things on the table at most', () => {
    let b = sitToTable(found(4, 'sd8'));
    for (const thing of ['promise', 'job', 'money'] as const) b = go(b, { type: 'table', thing });
    expect(tableThings(b).every((t) => !t.open)).toBe(true);
  });
  it('a war job across the Truce\'s line: the Card reads "Broke our word.", and the stance breaks to Rivals', () => {
    let b = sitToTable(found(4, 'sd9'));
    b = { ...b, neighbour: { ...nb(b), stance: 'truce' } };
    b = go(b, { type: 'rise' });
    const theirs = b.district!.holdings.find((h) => isTheirs(h, nb(b)))!;
    expect(acrossLine(b, theirs.id)).toBe(true);
    const card = cardFor(b, { holdingId: theirs.id, method: 'scout', squad: ['g1'] });
    expect(card.fields[11]!.text).toContain('Broke our word.');
    const day = b.here.day;
    const war = { ...b, log: [...b.log, { id: 'Lx', day, region: 0, district: b.district!.n, kind: 'job' as const, who: ['g1'], to: theirs.id, method: 'scout' as const, result: 'went' as const, text: 'x' }] };
    const after = neighbourEvening(war);
    expect(nb(after)).toMatchObject({ stance: 'rivals', broke: 'player' });
    expect(after.log.at(-1)!.text).toContain('Broke our word.');
    expect(summary(nb(after))).toBe('Rivals');
  });
});

describe('the second Sit-Down: the forty-three, and his son (Part 15a sections 7.5 and 7.7)', () => {
  it('his call the day after tick 2; "Open your Pen": he opens eleven', () => {
    let b = found(4, 'sd10');
    b = sitToTable(b);
    b = go(b, { type: 'rise' });
    b = nextDay(nextDay(b));
    expect(nb(b).pen).toBe(43);
    expect(nb(b).invited).toBe(b.here.day + 1);
    b = toBeat(nextDay(b), 'inPerson');
    b = go(b, { type: 'sitDown' });
    expect(nb(b).sitting!.caller).toBe('them');
    expect(nb(b).sitting!.n).toBe(2);
    while (nb(b).sitting!.ex < 3) b = go(b, { type: 'sitAnswer', i: 0 });
    b = go(b, { type: 'table', thing: 'pen' });
    expect(nb(b).pen).toBe(32);
  });
  it('the Understanding is only on the list when every held local is known by name', () => {
    let b = found(4, 'sd11');
    b = go(sitToTable(b), { type: 'rise' });
    const h = b.district!.holdings.find((x) => x.kind === 'local' && !isTheirs(x, nb(b)))!;
    const held = (scouted: number) => ({ ...b, district: { ...b.district!, holdings: b.district!.holdings.map((x) => (x.id === h.id ? { ...x, owner: 'team' as const, holds: true, since: 1, scouted } : x)) } });
    const sit = (x: EvilModeBlock) => go(toBeat(nextDay({ ...x, neighbour: { ...nb(x), invited: x.here.day + 1 } }), 'inPerson'), { type: 'sitDown' });
    expect(sitChoices(sit(held(0))).map((c) => c.text)).toEqual(['Go on.']);
    let s = sit(held(1));
    expect(sitChoices(s).map((c) => c.text)).toContain('"You\'ve a son."');
    s = go(s, { type: 'sitAnswer', i: 1 });
    s = go(s, { type: 'sitAnswer', i: 2 });
    expect(nb(s)).toMatchObject({ stance: 'understanding', understanding: 'none' });
    expect(s.log.some((e) => e.kind === 'neighbour' && e.text.includes('Understanding'))).toBe(true);
  });
});

describe('the Chair (Part 15a section 5)', () => {
  it('never before District 3; never without a Sit-Down or a winning War; never a team marked minors', () => {
    const early = toBeat(found(3, 'ch1'), 'inPerson');
    expect(chairProblem({ ...early, neighbour: { ...nb(early), sitDowns: [{ n: 1, stage: 3, day: 1, caller: 'player', chair: null, said: [], table: [] }] } })).toBe(EVIL_DATA.neighbour.lines.chairEarly);
    const b = toBeat(found(4, 'ch2'), 'inPerson');
    expect(chairProblem(b)).toBe(EVIL_DATA.neighbour.lines.chairShut);
    const MINORS: EvilData = { ...EVIL_DATA, neighbour: { ...EVIL_DATA.neighbour, neighbours: EVIL_DATA.neighbour.neighbours.map((n) => ({ ...n, minors: true })) } };
    expect(chairProblem(b, MINORS)).toBe(EVIL_DATA.neighbour.lines.chairMinors);
    const sat = go(sitToTable(found(4, 'ch3')), { type: 'rise' });
    expect(chairProblem(toBeat(nextDay(sat), 'inPerson'))).toBeNull();
  });
});

describe('the Chair in the battle engine, the fall, the Betrayal and the Legend (Part 15a sections 5, 6 and 7.9)', () => {
  const evilRun = (seed: string): RunState => {
    const r = foundInRun(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: EVIL_MODE_ID } }), 0), { name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm' }, 'three', 4);
    if (r.problem) throw new Error(r.problem);
    return r.run;
  };
  const B = (r: RunState) => r.expansion!.evilMode!;
  const goR = (r: RunState, a: EvilAction): RunState => {
    const o = stepInRun(r, a);
    if (!o.ok) throw new Error(`${a.type}: ${JSON.stringify(o.cues)}`);
    return o.run;
  };
  const toIP = (r: RunState) => { for (let i = 0; i < 12 && B(r).here.beat !== 'inPerson'; i++) r = goR(r, { type: BEAT_END[B(r).here.beat] }); return r; };
  const nextIP = (r: RunState) => toIP(goR(r, { type: BEAT_END[B(r).here.beat] }));
  /** Sit down once (so the Chair opens), then the next day's In person. */
  const ready = (seed: string): RunState => {
    let r = goR(toIP(evilRun(seed)), { type: 'sitDown' });
    for (let i = 0; i < 6 && B(r).neighbour!.sitting!.ex < 3; i++) r = goR(r, { type: 'sitAnswer', i: 1 });
    return nextIP(goR(r, { type: 'rise' }));
  };
  it('Giovanni\'s own Gym team at A+2, a Gym Leader\'s class; lost: a soft loss, the team kept, and it\'s his', () => {
    let r = goR(ready('cb1'), { type: 'chair' });
    const A = stageLevel(content, r, B(r));
    const started = beginEvilFight(content, r)!;
    expect(started.battle!.trainer).toMatchObject({ classId: GYM_LEADER_CLASS, name: 'Giovanni', leaderId: 'giovanni' });
    expect(started.battle!.enemyTeam.every((m) => m.level === A + 2 + started.rules.enemyLevelBonus || m.level === A + 2)).toBe(true);
    const crew = B(started).crew.map((c) => c.id);
    const lines = endEvilFight(content, started, false, healParty);
    expect(lines.join(' ')).toContain('Soft loss');
    expect(started.phase).toBe('map');
    expect(B(started).crew.map((c) => c.id)).toEqual(crew);
    expect(B(started).neighbour).toMatchObject({ stance: 'merger', whose: 'theirs', fallen: null, chair: { tries: 1, lostStage: 4 } });
    // It plays on; the Chair waits for the next district.
    r = goR(started, { type: 'stayIn' });
    expect(chairProblem(toBeat(nextDay(B(r)), 'inPerson'))).toBe(EVIL_DATA.neighbour.lines.chairDone);
  });
  it('won: Rocket falls to the team; Proton can\'t join by any path; the Scheme is stamped four times not clean; the Legend once', () => {
    const r = beginEvilFight(content, goR(ready('cb2'), { type: 'chair' }))!;
    const lines = endEvilFight(content, r, true, healParty);
    expect(lines.join(' ')).toContain('Proton');
    const b = B(r);
    const n = b.neighbour!;
    expect(n).toMatchObject({ fallen: 'team', stance: 'merger', whose: 'team', legend: 'waiting' });
    expect(n.scheme!.parts).toHaveLength(4);
    expect(n.scheme!.parts.every((p) => p.clean === false)).toBe(true);
    expect(n.scheme!.other).toBe('Don\'t. It was never a good idea.');
    expect(n.ticks.filter((t) => t.state === 'waiting')).toHaveLength(0);
    expect(b.crew.some((c) => /proton/i.test(c.id) || c.name === 'Proton')).toBe(false);
    expect(b.crew.find((c) => c.name === 'Ariana')).toMatchObject({ rank: 'officer', where: 'in' });
    expect(b.crew.filter((c) => c.where === 'in').length).toBeLessThanOrEqual(EVIL_DATA.people.rules.rosterCap);
    expect(hire({ ...b, applicants: [{ ref: 'proton', day: b.here.day, q: null }] }, 'proton').problem).toContain('refuses');
    expect(counts(b).theirs).toBe(0);
    expect(b.district!.holdings.filter((h) => h.tags?.includes('rocket')).every((h) => h.owner === 'team' && h.mood === 'wary')).toBe(true);
    // The Legend: the cave, the next In person, at A+3, wild (a ball can be thrown); once a region.
    let r2 = nextIP(goR(r, { type: 'stayIn' }));
    r2 = goR(r2, { type: 'legend' });
    const A = stageLevel(content, r2, B(r2));
    const cave = beginEvilFight(content, r2)!;
    expect(cave.battle!.kind).toBe('wild');
    expect(cave.battle!.enemyTeam[0]).toMatchObject({ speciesId: 'mewtwo' });
    expect([A + 3, A + 3 + cave.rules.enemyLevelBonus]).toContain(cave.battle!.enemyTeam[0]!.level);
    cave.battle!.outcome = 'caught';
    const before = cave.party.length + (cave.box ?? []).length;
    endEvilFight(content, cave, true, healParty);
    expect(cave.party.length + (cave.box ?? []).length).toBe(before + 1);
    let kept = reload(B(cave));
    expect(kept.neighbour!.legend).toBe('caught');
    const vault = kept.neighbour!.posts.find((p) => p.kind === 'vault')!;
    const again = toBeat(nextDay(kept), 'inPerson');
    expect(step(again, { type: 'legend' }).ok).toBe(false);
    // Open the ball: it goes, out of the party, once.
    const run3 = { ...cave, expansion: { ...cave.expansion, evilMode: kept } };
    const freed = goR(run3, { type: 'answerPost', id: vault.id, i: 1 });
    expect([...freed.party, ...(freed.box ?? [])].some((m) => m.speciesId === 'mewtwo')).toBe(false);
    expect(B(freed).neighbour).toMatchObject({ legend: 'freed', legendUid: null });
    expect(stepInRun(freed, { type: 'answerPost', id: vault.id, i: 0 }).ok).toBe(false);
    kept = B(freed);
    expect(kept.team.regard).toBe(Math.min(10, B(cave).team.regard + 3));
  });
  it('Clean hands: their Pen\'s doors are opened that night and the game doesn\'t ask', () => {
    const b = found(4, 'pen', 'clean');
    const out = fallToTeam(b);
    expect(nb(out.block).pen).toBe(0);
    expect(nb(out.block).posts.some((p) => p.kind === 'pen')).toBe(false);
    const grey = fallToTeam(found(4, 'pen2'));
    expect(nb(grey.block).posts.some((p) => p.kind === 'pen')).toBe(true);
  });
});

describe('the page and the save (block v9)', () => {
  it('the page shows the stance, the count, the five ticks, and rows the step checks again', () => {
    const b = toBeat(found(4, 'pg'), 'inPerson');
    const m = neighbourModel(b, 0)!;
    expect(m.title).toBe('Team Rocket · Giovanni');
    expect(m.stance.word).toBe('Wary');
    expect(m.ticks).toHaveLength(5);
    expect(m.facts[0]).toMatch(/^Yours \d+\. Theirs \d+\.$/);
    expect(m.rows.find((r) => r.testid === 'evil-nb-sit')!.open).toBe(true);
    expect(m.rows.find((r) => r.testid === 'evil-nb-chair')!.open).toBe(false);
  });
  it('v9 (slice 10) and v10 (slice 11) -> v11: no neighbour until the next step; then Giovanni at Wary, ticks already past counted as happened', () => {
    const b = toBeat(found(6, 'mig'), 'dispatch');
    const { neighbour, ...rest } = b;
    void neighbour;
    for (const v of [9, 10]) expect(EvilModeBlockSchema.parse({ ...rest, v })).toMatchObject({ v: 12, neighbour: null, base: rest.base });
    const v11 = EvilModeBlockSchema.parse({ ...rest, v: 9 });
    const after = go(v11, { type: 'send' });
    expect(nb(after).stance).toBe('wary');
    expect(nb(after).ticks.slice(0, 2).map((t) => t.state)).toEqual(['fired', 'fired']);
    expect(nb(after).ticks.slice(2).map((t) => t.state)).toEqual(['waiting', 'waiting', 'waiting']);
    expect(reload(after)).toEqual(after);
  });
  it('v8 -> v11 in one load: a base nobody picked, and no neighbour yet', () => {
    const b = toBeat(found(6, 'mig8'), 'dispatch');
    const { neighbour: _n, base: _b, raid: _r, law: _l, ...rest } = b;
    expect(EvilModeBlockSchema.parse({ ...rest, v: 8 })).toMatchObject({ v: 12, base: null, raid: null, neighbour: null });
  });
  it('a v13 block (a newer save) is refused, not cut down', () => {
    expect(() => EvilModeBlockSchema.parse({ ...toBeat(found(6, 'mig'), 'dispatch'), v: 13 })).toThrow();
  });
  it('a block with a Sit-Down going on and a fight waiting saves and reloads the same; a damaged neighbour is refused', () => {
    const b = go(toBeat(found(4, 'sv'), 'inPerson'), { type: 'sitDown' });
    expect(reload(b)).toEqual(b);
    expect(() => EvilModeBlockSchema.parse({ ...JSON.parse(JSON.stringify(b)), neighbour: { ...nb(b), stance: 'friends' } })).toThrow();
    expect(() => EvilModeBlockSchema.parse({ ...JSON.parse(JSON.stringify(b)), neighbour: { ...nb(b), ticks: nb(b).ticks.slice(0, 4) } })).toThrow();
  });
});
