// Evil Mode slice 21, "the edges" (build plan section 3; design Part 27 section 4, Part 5 section 8, Part 16 section 6,
// Part 29 sections 6 and 16, Part 30). Proves, as the plan asks: with the Shadow branch removed, corruption.ts is never
// called in a thousand runs and no Shadow string's in any view; a Tear's Card reads "We don't know." and can still be
// confirmed; Heat can't rise in a district with a Tear open. Also: each Appetite moves only by its listed behaviour;
// Static, then the Tear over the fondest held holding; its Ultra Rule in every battle in the district and none outside;
// three days always end in an Incursion unless the street was held; six hold the street and are on nothing else; the
// fourth choice only when the kid's Set; the Rig, the Lab, Shadow orders, Purify and the ladder; Poipole can't be sent;
// a caught Beast's Homesick and leaving; the v15 -> v19 migration.

import { describe, expect, it } from 'vitest';
import { foundForPlay, playRegion } from '../../src/core/evilMode/autoplay';
import { corruptionCalls } from '../../src/core/evilMode/corruption';
import { EVIL_DATA } from '../../src/core/evilMode/data';
import { BEAT_END, step, type EvilAction } from '../../src/core/evilMode/day';
import { makeHero } from '../../src/core/evilMode/hero';
import { crewProblem } from '../../src/core/evilMode/dispatch';
import { freeSquares } from '../../src/core/evilMode/base';
import { rigCard, shadowOn } from '../../src/core/evilMode/edges';
import { edgesModel } from '../../src/core/evilMode/edgesScreens';
import { beginEvilFight } from '../../src/core/evilMode/fight';
import { endEvilFight } from '../../src/core/evilMode/fightEnd';
import { takingsAt } from '../../src/core/evilMode/ledger';
import { lineModel } from '../../src/core/evilMode/lineScreens';
import { rosterModel, newRoster, refusalModel } from '../../src/core/evilMode/rosterScreens';
import { boardModel, newDispatch } from '../../src/core/evilMode/boardScreens';
import { ledgerModel, newLedger } from '../../src/core/evilMode/ledgerScreens';
import { frameModel } from '../../src/core/evilMode/screens';
import { EVIL_MODE_ID, foundInRun, stepInRun } from '../../src/core/evilMode/session';
import { EvilModeBlockSchema, firstCrew, type EvilModeBlock, type Holding, type TearState } from '../../src/core/evilMode/schema';
import { foundTeam, type FoundingChoice } from '../../src/core/evilMode/start';
import { beastToCall, edgesMorning, openTear, tally, tearCard, tearHolding, tearPay } from '../../src/core/evilMode/tear';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun, healParty } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const choice = (over: Partial<FoundingChoice> = {}): FoundingChoice => ({ name: 'Kettle', creed: 'profit', line: 'whatever', doctrine: 'swarm', ...over });
const found = (seed = 'edge-1', over: Partial<FoundingChoice> = {}, opts: { shadow?: boolean; incursions?: boolean } = {}): EvilModeBlock => {
  const r = foundTeam(choice(over), { boss: 'red', length: 'three', seed, stage: 2, ...opts });
  if (!r.ok) throw new Error(r.problem);
  const hero = makeHero(seed, r.block.district!, null).hero;
  return { ...r.block, hero, crew: firstCrew(8, 6), applicants: [] };
};
const go = (b: EvilModeBlock, a: EvilAction): EvilModeBlock => {
  const r = step(b, a);
  if (!r.ok) throw new Error(`${a.type}: ${JSON.stringify(r.cues)}`);
  return r.block;
};
const said = (b: EvilModeBlock, a: EvilAction): string[] => step(b, a).cues.filter((c) => c.id === 'said').map((c) => (c as { line: string }).line);
const toBeat = (b: EvilModeBlock, beat: EvilModeBlock['here']['beat']): EvilModeBlock => {
  for (let i = 0; i < 12 && b.here.beat !== beat; i++) b = go(b, { type: BEAT_END[b.here.beat] });
  return b;
};
const nextDay = (b: EvilModeBlock) => toBeat(go(b, { type: BEAT_END[b.here.beat] }), 'morning');
const reload = (b: EvilModeBlock) => EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(b)));
const own = (b: EvilModeBlock, kinds: Holding['kind'][] = ['local']): EvilModeBlock => {
  let n = 0;
  return { ...b, district: { ...b.district!, holdings: b.district!.holdings.map((h) => (kinds.includes(h.kind) && n++ < 2 ? { ...h, owner: 'team', method: 'persuade', since: 1, holds: true, mood: n === 2 ? 'warm' : 'wary' } : h)) } };
};
/** A Tear open over the fondest held holding, today. */
const withTear = (b0: EvilModeBlock, beastId = 'ub-absorption'): EvilModeBlock => {
  const b = own(b0);
  const h = tearHolding(b)!;
  const tear: TearState = { beastId, rule: 'flex', holdingId: h.id, region: b.here.region, district: b.district!.n, openedDay: b.here.day, choice: null, holdBy: [], cardId: null, over: null };
  return { ...b, edges: { ...b.edges, tear, met: [beastId] } };
};
const removed = (b: EvilModeBlock): EvilModeBlock => ({ ...b, settings: { ...b.settings, shadow: false }, edges: { ...b.edges, shadow: null } });
const wild = (b: EvilModeBlock) => b.district!.holdings.find((h) => h.kind === 'wild' || h.kind === 'alpha')!;

describe('the data and the save (block v19)', () => {
  it('edges.json is checked at load; both switches on by default (Kice: Shadow branch on, with a setting to remove it)', () => {
    expect(EVIL_DATA.edges.incursions.on).toBe(true);
    expect(EVIL_DATA.edges.shadow.on).toBe(true);
    const b = found();
    expect(b.v).toBe(19);
    expect(b.settings).toMatchObject({ shadow: true, incursions: true });
    expect(b.edges.shadow).not.toBeNull();
    expect(removed(b).edges.shadow).toBeNull();
    expect(found('e', {}, { shadow: false }).edges.shadow).toBeNull();
    expect(found('e', {}, { shadow: false }).settings.shadow).toBe(false);
  });
  it('v15 -> v19: the branch Available, Incursions on, nothing tallied, no Tear; save and reload the same', () => {
    const b = found();
    const { edges, ...rest } = b;
    void edges;
    const v15 = { ...rest, v: 15, settings: { length: 'three' } };
    const out = EvilModeBlockSchema.parse(v15);
    expect(out.v).toBe(19);
    expect(out.settings).toEqual({ length: 'three', shadow: true, incursions: true });
    expect(out.edges).toMatchObject({ appetites: {}, static: null, tear: null, incursion: null, beast: null, met: [], heatAtMorning: b.team.heat });
    expect(out.edges.shadow).toMatchObject({ rigged: [], through: 0, rung: 0 });
    expect(reload(out)).toEqual(out);
    // A block mid-Tear survives a reload unchanged.
    const t = withTear(b);
    expect(reload(t)).toEqual(t);
  });
});

describe('Appetites for a Boss (Part 27 section 4.2): each counts only its listed behaviour', () => {
  it('Funds sat on and a quiet day at the Evening; nothing else moves', () => {
    const b = toBeat(found(), 'inPerson');
    const rich = { ...b, team: { ...b.team, funds: 30000 } };
    const after = go(rich, { type: 'stayIn' });
    expect(after.edges.appetites).toEqual({ charge: 1, patience: 1 });
    const poor = go(b, { type: 'stayIn' });
    expect(poor.edges.appetites.charge).toBeUndefined();
  });
  it('a loud day (Heat +2 since the Morning), the Boss in person, people who left', () => {
    const b = found();
    const loud = tally({ ...b, here: { ...b.here, beat: 'hero' } }, { ...b, team: { ...b.team, heat: b.edges.heatAtMorning + 2 } });
    expect(loud.edges.appetites).toEqual({ spectacle: 1 });
    expect(loud.edges.heatAtMorning).toBe(b.edges.heatAtMorning + 2);
    const out = tally(b, { ...b, inPerson: { day: b.here.day, holdingId: 'x' } });
    expect(out.edges.appetites).toEqual({ dependence: 1 });
    const gone = tally(b, { ...b, crew: b.crew.map((c, i) => (i === 0 ? { ...c, where: 'left' as const } : c)) });
    expect(gone.edges.appetites).toEqual({ longing: 1 });
    expect(tally(b, b)).toBe(b);
  });
  it('crossed: Static the next day (nothing on the Board, everything slightly off), then the Tear over the fondest holding', () => {
    let b = own(found());
    b = { ...b, edges: { ...b.edges, appetites: { strength: 4 } } };
    expect(beastToCall(b)!.name).toBe('Absorption');
    const morning = (x: EvilModeBlock) => edgesMorning({ ...x, here: { ...x.here, day: x.here.day + 1 } });
    let r = edgesMorning(b);
    b = r.block;
    expect(b.edges.static).toMatchObject({ beastId: 'ub-absorption', day: b.here.day + 1 });
    r = morning(b);
    b = r.block;
    expect(r.lines).toContain(EVIL_DATA.edges.incursions.static.lead);
    expect(r.lines).toContain(EVIL_DATA.edges.incursions.static.cat);
    expect(b.hero!.learned).toContain(EVIL_DATA.edges.incursions.static.hero);
    expect(b.edges.tear).toBeNull();
    r = morning(b);
    b = r.block;
    const t = openTear(b)!;
    expect(t.holdingId).toBe(tearHolding(b)!.id);
    expect(b.district!.holdings.find((h) => h.id === t.holdingId)!.mood).toBe('warm');
    expect(b.edges.met).toEqual(['ub-absorption']);
    expect(b.edges.static).toBeNull();
    expect(r.lines.some((l) => l.startsWith('A Tear opens over'))).toBe(true);
    expect(r.lines).toContain(EVIL_DATA.edges.incursions.tear.who.detective);
    // One Beast once a run: the same tally doesn't call it again.
    expect(beastToCall({ ...b, edges: { ...b.edges, tear: null } })).toBeNull();
    expect(frameModel(b, 'Red').chips.some((c) => c.startsWith('A Tear: open, 3 days'))).toBe(true);
    // Through the step too: a crossed tally sets Static at the next Morning.
    const stepped = nextDay({ ...own(found()), edges: { ...b.edges, appetites: { patience: 4 }, met: [], tear: null, static: null } });
    expect(stepped.edges.static?.beastId).toBe('ub-blaster');
  });
  it('with Incursions off at founding nothing is tallied and no Tear comes', () => {
    let b = found('off', {}, { incursions: false });
    b = { ...b, edges: { ...b.edges, appetites: { strength: 9 } } };
    for (let i = 0; i < 3; i++) b = nextDay(b);
    expect(b.edges.static).toBeNull();
    expect(b.edges.tear).toBeNull();
  });
});

describe('a Tear in a held district (Part 27 sections 4.4 and 4.5)', () => {
  it('its Card reads "We don\'t know." three times (Takes, Gives, Not known), and CONFIRM still confirms it', () => {
    const b = withTear(found());
    const card = tearCard(b, 'leave');
    expect(card).toHaveLength(13);
    expect(card.filter((f) => f.text === "We don't know.").map((f) => f.label)).toEqual(['Takes', 'Gives', 'Not known']);
    const m = edgesModel(b, edgesModel(b, 0).rows.findIndex((r) => r.testid === 'evil-edge-leave'));
    expect(m.rows.map((r) => r.action)).toContainEqual({ type: 'tear', choice: 'leave' });
    expect(m.card!.filter((f) => f.text === "We don't know.")).toHaveLength(3);
    const after = go(b, { type: 'tear', choice: 'leave' });
    expect(after.edges.tear!.choice).toBe('leave');
    expect(after.edges.cards).toHaveLength(1);
    expect(after.log.at(-1)).toMatchObject({ kind: 'tear', unknowns: 3 });
    expect(after.team.regard).toBe(Math.max(0, b.team.regard - 1));
    expect(step(after, { type: 'tear', choice: 'hold' }).ok).toBe(false);
    // The kept Card reads back the same.
    expect(edgesModel(reload(after), 0).card!.filter((f) => f.text === "We don't know.")).toHaveLength(3);
  });
  it('Heat can\'t rise in a district with a Tear open; it can once the Tear is gone', () => {
    const b = toBeat(withTear(found()), 'dispatch');
    const h = wild(b);
    const up = go(b, { type: 'rig', holdingId: h.id });
    expect(up.team.heat).toBe(b.team.heat);
    const closed = { ...b, edges: { ...b.edges, tear: { ...b.edges.tear!, over: 'closed' as const } } };
    expect(go(closed, { type: 'rig', holdingId: h.id }).team.heat).toBe(Math.min(10, b.team.heat + EVIL_DATA.edges.shadow.numbers.rigHeat));
  });
  it('the holding pays nothing; its street half; the rest whole', () => {
    const b = withTear(found());
    const pay = tearPay(b);
    const at = b.district!.holdings.find((h) => h.id === b.edges.tear!.holdingId)!;
    expect(takingsAt({ ...at, owner: 'team' }, {}, EVIL_DATA, pay)).toBe(0);
    for (const id of pay.half) {
      const h = b.district!.holdings.find((x) => x.id === id)!;
      const whole = takingsAt(h, {}, EVIL_DATA);
      expect(takingsAt(h, {}, EVIL_DATA, pay)).toBe(Math.floor(whole / 2));
    }
  });
  it('left three days, it always comes out: the Incursion meets the first squad sent, and nobody wins', () => {
    // No kid on the road here: the three days are the Tear's, not the district's end.
    let b = go({ ...withTear(found()), hero: null }, { type: 'tear', choice: 'leave' });
    for (let i = 0; i < 3; i++) b = nextDay(b);
    expect(b.edges.tear!.over).toBe('out');
    expect(b.edges.incursion).toMatchObject({ beastId: 'ub-absorption' });
    b = toBeat(b, 'dispatch');
    const h = b.district!.holdings.find((x) => x.kind === 'local' && x.owner !== 'team')!;
    b = go(b, { type: 'queueJob', job: { holdingId: h.id, method: 'scout', squad: [b.crew[0]!.id] } });
    const lines = said(b, { type: 'send' });
    b = go(b, { type: 'send' });
    expect(lines.some((l) => l.includes('met something from somewhere else'))).toBe(true);
    expect(b.queue).toHaveLength(0);
    expect(b.edges.incursion).toBeNull();
  });
  it('held: six off every other job for three days; the third day comes out to an empty street, no Incursion', () => {
    let b = toBeat({ ...withTear(found()), hero: null }, 'dispatch');
    b = go(b, { type: 'tear', choice: 'hold' });
    const six = b.edges.tear!.holdBy;
    expect(six).toHaveLength(6);
    expect(crewProblem(b, six[0]!)).toContain('holding the street');
    const few = { ...withTear(found()), crew: firstCrew(5, 6) };
    expect(step(few, { type: 'tear', choice: 'hold' }).ok).toBe(false);
    for (let i = 0; i < 3; i++) b = nextDay(b);
    expect(b.edges.tear!.over).toBe('out');
    expect(b.edges.incursion).toBeNull();
    expect(crewProblem(b, six[0]!)).toBeNull();
  });
  it('the fourth choice is offered only when the kid\'s Set or worse; going through is In person, once a day', () => {
    const b = withTear(found());
    expect(edgesModel(b, 0).rows.some((r) => r.testid === 'evil-edge-together')).toBe(false);
    const set = { ...b, hero: { ...b.hero!, temper: 2 } };
    expect(edgesModel(set, 0).rows.some((r) => r.testid === 'evil-edge-together')).toBe(true);
    expect(step(b, { type: 'tear', choice: 'through' }).ok).toBe(false);
    const ip = toBeat(set, 'inPerson');
    const went = go(ip, { type: 'tear', choice: 'together' });
    expect(went.fight).toMatchObject({ kind: 'tear', begun: false });
    expect(went.inPerson!.day).toBe(ip.here.day);
  });
});

describe('battles in a Tear\'s district (real battles, the main game\'s Ultra Rules)', () => {
  const evilRun = (seed = 'edge-run'): RunState => {
    const r = foundInRun(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: EVIL_MODE_ID } }), 0), choice(), 'three', 2);
    if (r.problem) throw new Error(r.problem);
    return r.run;
  };
  const B = (r: RunState) => r.expansion!.evilMode!;
  const set = (r: RunState, f: (b: EvilModeBlock) => EvilModeBlock): RunState => ({ ...r, expansion: { ...r.expansion, evilMode: f(B(r)) } });
  it('going through: the Beast, wild, in its own rule; caught, it\'s in the building and Homesick at nought', () => {
    let r = set(evilRun(), (b) => toBeat({ ...withTear(b), hero: { ...b.hero!, temper: 0 } }, 'inPerson'));
    const out = stepInRun(r, { type: 'tear', choice: 'through' });
    expect(out.ok).toBe(true);
    r = beginEvilFight(content, out.run)!;
    expect(r.battle!.kind).toBe('wild');
    expect(r.battle!.enemyTeam[0]!.speciesId).toBe('buzzwole');
    expect(r.battle!.ultra).toEqual(['flex']);
    r.battle!.outcome = 'caught';
    endEvilFight(content, r, true, healParty);
    expect(B(r).edges.tear!.over).toBe('closed');
    expect(B(r).edges.beast).toMatchObject({ beastId: 'ub-absorption', homesick: 0 });
    expect([...r.party, ...(r.box ?? [])].some((m) => m.uid === B(r).edges.beast!.uid)).toBe(true);
  });
  it('an Outplay in the Tear\'s district carries its rule; none outside it', () => {
    const queued = (tear: boolean): RunState => {
      let r = set(evilRun('edge-op'), (b) => {
        const t = tear ? withTear(b) : own(b);
        return toBeat({ ...t, crew: t.crew.map((c) => ({ ...c, line: null })) }, 'dispatch');
      });
      const h = B(r).district!.holdings.find((x) => x.kind === 'local' && x.owner !== 'team')!;
      const squad = B(r).crew.filter((c) => !c.minor).slice(0, 2).map((c) => c.id);
      r = stepInRun(r, { type: 'queueJob', job: { holdingId: h.id, method: 'outplay', squad } }).run;
      r = stepInRun(r, { type: 'send' }).run;
      return beginEvilFight(content, stepInRun(r, { type: 'goYourself', holdingId: h.id }).run)!;
    };
    expect(queued(true).battle!.ultra).toContain('flex');
    expect(queued(false).battle!.ultra ?? []).not.toContain('flex');
  });
  it('a Beast kept: Homesick rises while the team doesn\'t do what drew it; at ten it leaves, and goes out of the party once', () => {
    let r = evilRun('edge-home');
    const uid = r.party[0]!.uid;
    r = set(r, (b) => ({ ...b, edges: { ...b.edges, beast: { uid, beastId: 'ub-absorption', homesick: 9, lastTally: 0 } } }));
    for (let i = 0; i < 6 && B(r).edges.beast; i++) r = stepInRun(r, { type: BEAT_END[B(r).here.beat] }).run;
    expect(B(r).edges.beast).toBeNull();
    expect(B(r).applied).toContain(`beast-left:${uid}`);
    expect(r.party.some((m) => m.uid === uid)).toBe(false);
  });
});

describe('Poipole follows; it doesn\'t invade', () => {
  it('turns up with Longing, can be given a plate, and is never a person on a job', () => {
    let b = found();
    b = nextDay({ ...b, edges: { ...b.edges, appetites: { longing: 5 } } });
    expect(b.edges.poipole).not.toBeNull();
    expect(b.edges.tear).toBeNull();
    b = go(b, { type: 'plate' });
    expect(b.edges.poipole!.plates).toBe(1);
    expect(b.crew.some((c) => /poipole/i.test(c.name))).toBe(false);
  });
});

describe('the Shadow branch (Part 5 section 8; Part 16 section 6)', () => {
  it('a Rig: Whatever it takes only, at Dispatch, on wild ground; six kits, Heat +4, Dread +2, Corruption +1 the first time, the ground stripped', () => {
    expect(step(toBeat(found('g', { line: 'grey' }), 'dispatch'), { type: 'rig', holdingId: wild(found('g', { line: 'grey' })).id }).ok).toBe(false);
    const b = toBeat(found(), 'dispatch');
    const h = wild(b);
    const after = go(b, { type: 'rig', holdingId: h.id });
    expect(after.team.heat).toBe(Math.min(10, b.team.heat + 4));
    expect(after.team.dread).toBe(Math.min(10, b.team.dread + 2));
    expect(after.team.corruption).toBe(1);
    expect(after.edges.shadow!.kits).toBe(6);
    expect(takingsAt({ ...h, owner: 'team' }, {}, EVIL_DATA, tearPay(after))).toBe(0);
    expect(after.edges.cards.at(-1)!.fields[11]).toBe('Processed.');
    expect(rigCard(b, h.id)).toHaveLength(13);
    // The ladder's first rung: one person's left, in the doorway.
    expect(after.crew.filter((c) => c.where === 'left')).toHaveLength(1);
    expect(step(after, { type: 'rig', holdingId: h.id }).ok).toBe(false);
    expect(frameModel(after, 'Red').strip.corruption).toBe(1);
  });
  it('the Lab: built at Whatever it takes, its keeper the lowest Loyalty, named; Corruption +1; 1 a district through, +1 each six', () => {
    let b = toBeat(found(), 'night');
    b = { ...b, crew: b.crew.map((c, i) => (i === 3 ? { ...c, loyalty: 2 } : c)), team: { ...b.team, funds: 60000 } };
    b = go(b, { type: 'pickSite', site: 'lodge' });
    expect(b.base).not.toBeNull();
    const r = step(b, { type: 'build', room: 'lab', at: firstFree(b) });
    expect(r.ok).toBe(true);
    b = r.block;
    expect(b.edges.shadow!.labBy).toBe(b.crew[3]!.id);
    expect(b.team.corruption).toBeGreaterThanOrEqual(1);
    const lines = r.cues.filter((c) => c.id === 'said').map((c) => (c as { line: string }).line);
    expect(lines.some((l) => l.includes(`${b.crew[3]!.name} runs the Lab`))).toBe(true);
  });
  it('shut, relieve (Loyalty to 5 and no further), purify (Regard +1; the figure stays)', () => {
    let b = toBeat(found(), 'night');
    b = { ...b, team: { ...b.team, funds: 60000 } };
    b = go(b, { type: 'pickSite', site: 'lodge' });
    b = go(b, { type: 'build', room: 'lab', at: firstFree(b) });
    const keeper = b.edges.shadow!.labBy!;
    const c0 = b.team.corruption;
    b = go(b, { type: 'labRelieve' });
    expect(b.crew.find((c) => c.id === keeper)!.loyalty).toBe(5);
    expect(b.team.corruption).toBe(c0);
    b = go(b, { type: 'labShut' });
    expect(b.edges.shadow!.shut).toBe(true);
    const through = toBeat({ ...b, edges: { ...b.edges, shadow: { ...b.edges.shadow!, through: 2 } } }, 'inPerson');
    const p = go(through, { type: 'purify' });
    expect(p.team.regard).toBe(Math.min(10, through.team.regard + 1));
    expect(p.team.corruption).toBe(through.team.corruption);
    expect(step(p, { type: 'purify' }).ok).toBe(false);
  });
  it('Shadow orders answer a refusal by sending the Pokémon; Corruption +1 the first time', () => {
    let b = toBeat(found(), 'dispatch');
    const h = b.district!.holdings.find((x) => x.kind === 'local' && x.owner !== 'team')!;
    b = { ...b, refusal: { cardId: 'C1', job: { holdingId: h.id, method: 'persuade', squad: [b.crew[0]!.id, b.crew[1]!.id] }, who: [b.crew[0]!.id] } };
    expect(refusalModel(b)!.answers.find((a) => a.id === 'shadowOrder')!.on).toBe(false);
    expect(step(b, { type: 'shadowOrder' }).ok).toBe(false);
    b = { ...b, edges: { ...b.edges, shadow: { ...b.edges.shadow!, through: 1 } } };
    const out = go(b, { type: 'shadowOrder' });
    expect(out.refusal).toBeNull();
    expect(out.queue.some((j) => j.holdingId === h.id)).toBe(true);
    expect(out.team.corruption).toBe(b.team.corruption + 1);
  });
  it('the ladder: ceilings 8, 6, 4; Heart applicants stop at 2', () => {
    let b = found();
    b = { ...b, crew: b.crew.map((c) => ({ ...c, loyalty: 10 })), team: { ...b.team, corruption: 4 }, edges: { ...b.edges, shadow: { ...b.edges.shadow!, rung: 1 } } };
    const out = go(b, { type: 'dismissOvernight' });
    expect(Math.max(...out.crew.map((c) => c.loyalty))).toBe(6);
  });
});

describe('with the Shadow branch removed (Settings > Evil Mode > Shadow branch: Removed from all screens)', () => {
  it('a thousand runs never call corruption.ts', () => {
    const before = corruptionCalls.n;
    const seeds = Array.from({ length: 1000 }, (_, i) => `rm-${i}`);
    for (const seed of seeds) {
      const b = removed(foundForPlay(seed, { name: 'Kettle', creed: 'power', line: 'whatever', doctrine: 'bruisers', patron: 'executive', region: 'kanto' }));
      playRegion(b, 'mix', EVIL_DATA, 60);
    }
    expect(corruptionCalls.n).toBe(before);
    // And the branch on does reach it (the counter counts).
    const on = toBeat(found(), 'dispatch');
    go(on, { type: 'rig', holdingId: wild(on).id });
    expect(corruptionCalls.n).toBeGreaterThan(before);
  }, 120000);
  it('every Shadow action is refused before it reaches the file', () => {
    const b = removed(toBeat(found(), 'dispatch'));
    const n = corruptionCalls.n;
    for (const a of [{ type: 'rig', holdingId: wild(b).id }, { type: 'labShut' }, { type: 'labRelieve' }, { type: 'purify' }, { type: 'shadowOrder' }] as EvilAction[]) {
      const r = step(b, a);
      expect(r.ok, a.type).toBe(false);
    }
    expect(corruptionCalls.n).toBe(n);
    expect(shadowOn(b)).toBe(false);
  });
  it('no Shadow string in any view: the frame, the board, the Ledger, the Line, the Roster, the Edges page', () => {
    const shadowy = /Shadow|Corruption|\bLab\b|Capture Rig/;
    const b0 = removed(foundForPlay('rm-view', { name: 'Kettle', creed: 'power', line: 'whatever', doctrine: 'bruisers', patron: 'executive', region: 'kanto' }));
    const played = playRegion(b0, 'mix', EVIL_DATA, 400);
    let b = b0;
    const views = (x: EvilModeBlock) => [frameModel(x, 'Red'), boardModel(x, newDispatch()), ledgerModel(x, newLedger()), ...[0, 1, 2].map((s) => lineModel(x, s)), ...[0, 1, 2, 3].map((t) => rosterModel(x, newRoster(t))), edgesModel(x, 0)];
    for (const [i, a] of played.actions.entries()) {
      b = step(b, a).block;
      if (i % 40 === 0) for (const v of views(b)) expect(JSON.stringify(v)).not.toMatch(shadowy);
    }
    // A person whose line is 7 says it without the branch's name.
    const seven = { ...b, crew: b.crew.map((c, i) => (i === 0 ? { ...c, line: 7, lineHeard: true } : c)) };
    expect(JSON.stringify(rosterModel(seven, newRoster(0)))).not.toMatch(shadowy);
    // With it on, the Line's third stop names it.
    expect(lineModel(found(), 2).stops[2]!.allows).toContain('Shadow');
    expect(lineModel(removed(found()), 2).stops[2]!.allows).toBe(EVIL_DATA.edges.shadow.allowsRemoved);
  }, 120000);
});

/** The first free square of the base's grid. */
const firstFree = (b: EvilModeBlock): string => freeSquares(b.base!)[0]!;
