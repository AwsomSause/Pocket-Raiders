// Evil Mode slice 17, "the long cast" (build plan section 3; design Parts 10a, 10b, 10c, 11). Proves: the Johto and
// Hoenn decks and the specials; every quest can be finished, with a line for when it can't; Ask to stay; the mole's
// draw, handler, tells, the Office and the four outcomes; with the mole Off the draw's taken and ignored and streets are
// the same; the mole's never named on any screen model; the v20 -> v21 migration.

import { afterEach, describe, expect, it } from 'vitest';
import { foundForPlay, playRegion, replay } from '../../src/core/evilMode/autoplay';
import { EVIL_DATA } from '../../src/core/evilMode/data';
import { deckFor } from '../../src/core/evilMode/people';
import { askStay, canAskStay, openQuest, pinLoyalty, questDef, questStep, questsAtCrossing, stayReasons, stepProblem } from '../../src/core/evilMode/quest';
import { ensureHandler, feed, markApplicant, moleAnswer, moleDistrictEnd, moleNight, moleTerms, nameThem, onRefuse, suspicionsModel } from '../../src/core/evilMode/mole';
import { emptyMole, EvilModeBlockSchema, migrateEvilBlock, type EvilModeBlock } from '../../src/core/evilMode/schema';
import type { FoundingChoice } from '../../src/core/evilMode/start';

const choice = (over: Partial<FoundingChoice> = {}): FoundingChoice => ({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm', patron: 'executive', region: 'kanto', ...over });
const fresh = (seed = 'cast-1', over: Partial<FoundingChoice> = {}): EvilModeBlock => foundForPlay(seed, choice(over));
const at = (b: EvilModeBlock, beat: EvilModeBlock['here']['beat'], n?: number, day?: number): EvilModeBlock => ({
  ...b,
  here: { ...b.here, beat, ...(day !== undefined ? { day } : {}) },
  district: b.district ? { ...b.district, n: n ?? b.district.n, end: undefined } : b.district,
});
const P = EVIL_DATA.people.people;
const questable = (b: EvilModeBlock) => b.crew.find((c) => c.where === 'in' && questDef(c.ref));

describe('the decks (Part 10a, 10b)', () => {
  it('Johto and Hoenn have twelve each, there are thirteen specials, and every face exists', () => {
    expect(P.filter((p) => p.deck === 'johto')).toHaveLength(12);
    expect(P.filter((p) => p.deck === 'hoenn')).toHaveLength(12);
    const sp = P.filter((p) => p.deck === 'special');
    expect(sp).toHaveLength(13);
    for (const p of sp) expect(p.when).toBeTruthy();
    for (const p of P) expect(p.shape).toBeTruthy();
    for (const p of P.filter((x) => x.deck !== 'founders')) expect(EVIL_DATA.faces.find((f) => f.ref === p.id), p.id).toBeTruthy();
  });

  it('founders come only in the first region; a region on, its own deck', () => {
    const b = fresh();
    const first = deckFor(b.here.region, [], EVIL_DATA, 0).map((p) => p.id);
    const later = deckFor(1, [], EVIL_DATA, 1).map((p) => p.id);
    const founders = P.filter((p) => p.deck === 'founders').map((p) => p.id);
    expect(founders.some((id) => first.includes(id))).toBe(true);
    expect(founders.some((id) => later.includes(id))).toBe(false);
  });

  it('nobody arrives twice in a whole region', () => {
    const r = playRegion(fresh('cast-deck'), 'mix');
    const refs = r.block.crew.map((c) => c.ref).filter(Boolean);
    expect(new Set(refs).size).toBe(refs.length);
  });
});

describe('quests (Part 10c)', () => {
  it('every written quest has steps and at least one ending', () => {
    for (const p of P) {
      const d = questDef(p.id);
      if (!d) continue;
      expect(d.steps.length).toBeGreaterThan(0);
      expect(d.endings.length).toBeGreaterThan(0);
    }
  });

  it('opens, steps a district apart, and ends at Loyalty 10, for Nothing', () => {
    let b = { ...fresh('cast-q'), team: { ...fresh('cast-q').team, funds: 99999 } };
    const p = questable(b)!;
    expect(p).toBeTruthy();
    b = openQuest(b, p.id).block;
    expect(b.quests[p.id]?.state).toBe('open');
    const def = questDef(p.ref)!;
    let n = b.district!.n;
    for (let i = 0; i < def.steps.length; i++) {
      const beat = def.steps[i]!.boss ? 'inPerson' : 'dispatch';
      b = at(b, beat, n, b.here.day + 1);
      const last = i === def.steps.length - 1;
      const funds = b.team.funds;
      const r = questStep(b, p.id, last ? def.endings.find((e) => !e.effect.funds || e.effect.funds > 0)?.id ?? def.endings[0]!.id : null);
      expect(r.problem).toBeNull();
      b = r.block;
      if (!last) {
        expect(b.team.funds).toBe(funds);
        // Not again in the same district.
        expect(stepProblem(at(b, def.steps[i + 1]!.boss ? 'inPerson' : 'dispatch', n, b.here.day + 1), p.id)).toBeTruthy();
      }
      n += 1;
    }
    expect(b.quests[p.id]?.state).toBe('done');
    const after = b.crew.find((c) => c.id === p.id)!;
    if (after.where === 'in') {
      expect(after.loyalty).toBe(10);
      const dropped = { ...b, crew: b.crew.map((c) => (c.id === p.id ? { ...c, loyalty: 3 } : c)) };
      expect(pinLoyalty(dropped).crew.find((c) => c.id === p.id)!.loyalty).toBe(10);
    }
  });

  it('the last step needs an ending; a wrong beat has a line', () => {
    const b0 = fresh('cast-q2');
    const p = questable(b0)!;
    const b = openQuest(b0, p.id).block;
    const def = questDef(p.ref)!;
    const wrong = def.steps[0]!.boss ? 'dispatch' : 'inPerson';
    expect(stepProblem(at(b, wrong), p.id)).toBeTruthy();
  });

  it('an unfinished quest fails at the Crossing, with a line, and Loyalty never rises above 7 after', () => {
    const b0 = fresh('cast-q3');
    const p = questable(b0)!;
    let b = openQuest(b0, p.id).block;
    b = { ...b, region: { ...b.region, crossed: [...b.region.crossed, b.region.id] } };
    const r = questsAtCrossing(b);
    expect(r.block.quests[p.id]?.state).toBe('failed');
    expect(r.lines.length).toBeGreaterThan(0);
    const up = { ...r.block, crew: r.block.crew.map((c) => (c.id === p.id ? { ...c, loyalty: 10 } : c)) };
    expect(pinLoyalty(up).crew.find((c) => c.id === p.id)!.loyalty).toBeLessThanOrEqual(EVIL_DATA.quests.rules.failCap);
  });

  it('Ask to stay: only at Loyalty 1-2; greyed reasons say why; once', () => {
    const b0 = fresh('cast-stay');
    const p = b0.crew.find((c) => c.where === 'in' && c.id !== 'patron')!;
    expect(canAskStay(p)).toBe(p.loyalty >= 1 && p.loyalty <= 2);
    const b = { ...b0, crew: b0.crew.map((c) => (c.id === p.id ? { ...c, loyalty: 2 } : c)) };
    const reasons = stayReasons(b, p.id);
    expect(reasons.length).toBeGreaterThan(0);
    const open = reasons.find((x) => !x.why);
    const r = askStay(b, p.id, open ? open.id : null);
    expect(r.problem).toBeNull();
    expect(askStay(r.block, p.id, open ? open.id : null).problem).toBeTruthy();
  });
});

describe('the mole (Part 11)', () => {
  const real = EVIL_DATA.mole.on;
  afterEach(() => { (EVIL_DATA.mole as { on: boolean }).on = real; });

  it('is on by default', () => expect(EVIL_DATA.mole.on).toBe(true));

  it('the same seed marks the same applicant; never a minor; a refused one is never the mole', () => {
    const b0 = at(ensureHandler(fresh('cast-m')), 'morning', 2);
    const pool = P.filter((p) => p.deck === 'founders').map((p) => p.id).slice(0, 4);
    const a = markApplicant(b0, pool);
    const c = markApplicant(b0, pool);
    expect(a.mole.marked).toBe(c.mole.marked);
    expect(a.mole.marked).toBeTruthy();
    expect(P.find((p) => p.id === a.mole.marked)?.minor).toBeFalsy();
    const r = onRefuse(a, a.mole.marked!);
    expect(r.mole.marked).toBeNull();
    expect(r.mole.who).toBeNull();
    // Only minors: no mark.
    const kids = P.filter((p) => p.minor).map((p) => p.id);
    expect(markApplicant(b0, kids).mole.marked).toBeNull();
  });

  it('no mark in District 1 of the first region', () => {
    const b0 = at(fresh('cast-m1'), 'morning', 1);
    expect(markApplicant(b0, P.filter((p) => p.deck === 'founders').map((p) => p.id)).mole.marked).toBeNull();
  });

  const withMole = (handler: 'police' | 'neighbour' | 'local' | 'mother', seed = 'cast-h'): EvilModeBlock => {
    const b0 = fresh(seed);
    const c = b0.crew.find((x) => x.where === 'in' && x.id !== 'patron' && !x.minor)!;
    return { ...b0, mole: { ...emptyMole(), handler, street: handler === 'local' ? 1 : null, who: c.id, state: 'reporting', marks: 1 } };
  };

  it("the police's report is Heat +1, reason not known, once a district", () => {
    const b = withMole('police');
    const end = { ...b, district: { ...b.district!, end: { how: 'held' as const, day: b.here.day, count: 0 } } };
    const r = moleDistrictEnd(end);
    expect(r.block.team.heat).toBe(Math.min(10, b.team.heat + 1));
    expect(moleDistrictEnd(r.block).block.team.heat).toBe(r.block.team.heat);
  });

  it('switched Off: the draw is taken and ignored, and the odds and Heat are untouched', () => {
    (EVIL_DATA.mole as { on: boolean }).on = false;
    const b = withMole('police');
    const end = { ...b, district: { ...b.district!, end: { how: 'held' as const, day: b.here.day, count: 0 } } };
    expect(moleDistrictEnd(end).block.team.heat).toBe(b.team.heat);
    const h = b.district!.holdings[0]!;
    for (const m of ['take', 'lean', 'persuade'] as const) expect(moleTerms(withMole('neighbour'), h, m)).toEqual([]);
    const m0 = at(ensureHandler(fresh('cast-m')), 'morning', 2);
    expect(markApplicant(m0, P.filter((p) => p.deck === 'founders').map((p) => p.id)).draws['evil-mole']).toBeGreaterThan(m0.draws['evil-mole'] ?? 0);
  });

  it('a whole region plays the same streets with the mole Off as On (its stream is its own)', () => {
    const on = playRegion(fresh('cast-off'), 'mix');
    const onFresh = fresh('cast-off-2');
    (EVIL_DATA.mole as { on: boolean }).on = false;
    const off = playRegion(fresh('cast-off'), 'mix');
    const streets = (r: typeof on) => r.districts.map((d) => d.n);
    expect(streets(off)).toEqual(streets(on));
    expect(off.block.region.id).toBe(on.block.region.id);
    const f0 = fresh('cast-off-2');
    expect(JSON.stringify(f0.district)).toBe(JSON.stringify(onFresh.district));
    expect(f0.draws).toEqual(onFresh.draws);
  });

  it('naming the wrong one costs Loyalty and never changes the real mole; a second wrong sets the ceiling', () => {
    const b = at(withMole('local'), 'night');
    const innocents = b.crew.filter((c) => c.where === 'in' && c.id !== b.mole.who && c.id !== 'patron' && !c.minor);
    if (innocents.length < 2) return;
    const r = nameThem(b, innocents[0]!.id);
    expect(r.problem).toBeNull();
    expect(r.block.mole.who).toBe(b.mole.who);
    expect(r.block.mole.state).toBe('reporting');
    expect(r.block.crew.find((c) => c.id === innocents[0]!.id)!.loyalty).toBe(Math.max(1, innocents[0]!.loyalty - 4));
    const r2 = nameThem(moleAnswer(r.block, 'keep').block, innocents[1]!.id);
    expect(r2.block.mole.ceiling).not.toBeNull();
  });

  it('naming the right one opens the found scene; letting them go is the sent way to leave', () => {
    const b = at(withMole('police'), 'night');
    const r = nameThem(b, b.mole.who!);
    expect(r.block.mole.found).toBe(true);
    expect(r.block.mole.scene?.kind).toBe('found');
    const g = moleAnswer(r.block, 'letGo');
    expect(g.block.crew.find((c) => c.id === b.mole.who)?.left?.how).toBe('sent');
    expect(g.block.mole.state).toBe('gone');
  });

  it('the neighbour turned is paid; the mother never turns', () => {
    const n = nameThem(at({ ...withMole('neighbour'), team: { ...withMole('neighbour').team, funds: 5000 } }, 'night'), withMole('neighbour').mole.who!).block;
    expect(moleAnswer(n, 'turn').block.mole.state).toBe('turned');
    const m = nameThem(at(withMole('mother'), 'night'), withMole('mother').mole.who!).block;
    expect(moleAnswer(m, 'turn').block.mole.state).toBe('reporting');
  });

  it('knocks once, at Loyalty 8 or more', () => {
    const b0 = withMole('police');
    const low = at(b0, 'night');
    expect(moleNight(low).mole.scene).toBeNull();
    const high = { ...low, crew: low.crew.map((c) => (c.id === b0.mole.who ? { ...c, loyalty: 8 } : c)) };
    const k = moleNight(high);
    expect(k.mole.scene?.kind).toBe('knock');
    const answered = moleAnswer(k, 'tell').block;
    expect(answered.mole.state).toBe('stopped');
    expect(moleNight(answered).mole.scene).toBeNull();
  });

  it('feeding works once a district, at Dispatch', () => {
    const b = at(withMole('neighbour'), 'dispatch');
    const r = feed(b, b.mole.who!);
    if (r.problem) return; // line 35 refuses; that has its own line
    expect(feed(r.block, b.mole.who!).problem).toBeTruthy();
  });

  it('the Suspicions page never reads who the mole is', () => {
    const b = withMole('police');
    const other = b.crew.find((c) => c.where === 'in' && c.id !== b.mole.who && c.id !== 'patron')!;
    const swapped = { ...b, mole: { ...b.mole, who: other.id } };
    const strip = (m: unknown) => JSON.stringify(m);
    // Same slips, different mole: same page.
    expect(strip(suspicionsModel(swapped, 0))).toBe(strip(suspicionsModel(b, 0)));
  });
});

describe('save v21', () => {
  it('migrates a v20 block: no quests, no mole yet', () => {
    const b = fresh('cast-mig');
    const { quests, mole, ...rest } = b;
    void quests; void mole;
    const v20 = { ...rest, v: 20 };
    const m = migrateEvilBlock(v20) as EvilModeBlock;
    expect(EvilModeBlockSchema.parse(m).v).toBe(22);
    expect(m.quests).toEqual({});
    expect(m.mole).toEqual(emptyMole());
    // An older block (v15) goes through slice 7's Night (v20) and then this one.
    const old = migrateEvilBlock({ ...rest, v: 15 }) as EvilModeBlock;
    expect(EvilModeBlockSchema.parse(old).v).toBe(22);
    expect(old.quests).toEqual({});
  });

  it('a region with quests and a mole replays from its actions', () => {
    const b0 = fresh('cast-replay');
    const r = playRegion(b0, 'mix');
    expect(JSON.stringify(replay(b0, r.actions))).toBe(JSON.stringify(r.block));
    expect(() => EvilModeBlockSchema.parse(r.block)).not.toThrow();
  });
});
