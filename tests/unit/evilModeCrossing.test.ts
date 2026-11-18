// Evil Mode slice 16, "the Crossing" (build plan section 3; design Part 2 section 9, Part 26a sections 1, 3 and 4). Proves:
// a full three-region run plays to an ending and replays from its action list; a three-region save's under the 300 KB
// budget; the rule hook stacks in order (region, then Patron) with Johto's Persuade +10% and Take −20%; Hoenn's tide and
// hot holdings; Hoenn's letters stop tick 3; the second clock appears only if nobody stopped them, counts three days and
// never ends a run; what carries and what halves at the Crossing; who stays; tickets; the v14 -> v15 migration.

import { describe, expect, it } from 'vitest';
import { foundForPlay, playRegion, playRun, replay } from '../../src/core/evilMode/autoplay';
import { EVIL_DATA } from '../../src/core/evilMode/data';
import { step } from '../../src/core/evilMode/day';
import { beginCrossing, carryLetter, clockActs, clockMet, crossActOf, crossingModel, clockMorning, cross, lastRun, openRegions, stopClock, ticketLines, ticketsFor, whoStays } from '../../src/core/evilMode/crossing';
import { ensureNeighbour, neighbourDef, sideFor } from '../../src/core/evilMode/neighbour';
import { absStage, goOn, lapses, regionText, runIndex } from '../../src/core/evilMode/region';
import { activeMods, modify, ruleTerms } from '../../src/core/evilMode/regionRule';
import { jobProblem } from '../../src/core/evilMode/dispatch';
import { EvilModeBlockSchema, type EvilModeBlock, type Holding } from '../../src/core/evilMode/schema';
import type { FoundingChoice } from '../../src/core/evilMode/start';

const choice = (over: Partial<FoundingChoice> = {}): FoundingChoice => ({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm', patron: 'executive', region: 'kanto', ...over });
const fresh = (seed = 'cross-1', over: Partial<FoundingChoice> = {}): EvilModeBlock => foundForPlay(seed, choice(over));
const overRegion = (seed = 'cross-1', over: Partial<FoundingChoice> = {}): EvilModeBlock => playRegion(fresh(seed, over), 'mix').block;

describe('a Standard run: three regions', () => {
  const b0 = fresh('cross-run');
  const run = playRun(b0, 'mix');

  it('plays Kanto and two more regions, never one twice, to an ending', () => {
    expect(run.finished).toBe(true);
    expect(run.block.region.crossed).toHaveLength(2);
    const all = [...run.block.region.crossed, run.block.region.id];
    expect(new Set(all).size).toBe(3);
    expect(all[0]).toBe('kanto');
    expect(run.block.ending?.done).toBe(true);
    expect(runIndex(run.block)).toBe(lastRun(run.block));
  });

  it('a full run replays from its action list to the same block', () => {
    expect(JSON.stringify(replay(b0, run.actions))).toBe(JSON.stringify(run.block));
  });

  it('a three-region save is under the 300 KB budget, and reloads whole', () => {
    const json = JSON.stringify(run.block);
    expect(json.length).toBeLessThan(300_000);
    expect(EvilModeBlockSchema.parse(JSON.parse(json))).toEqual(JSON.parse(json));
  });

  it('levels go by the absolute stage: A = (R − 1) × 8 + S', () => {
    expect(absStage(run.block)).toBe(16 + run.block.here.stage);
  });
});

describe('the Crossing', () => {
  const over = overRegion();

  it('begins when the region is over and it isn\'t the last; two tickets from regions not played', () => {
    expect(over.region.phase).toBe('over');
    expect(over.ending).toBeNull();
    const x = over.region.crossing!;
    expect(x.step).toBe('tickets');
    expect(x.offer).toHaveLength(2);
    expect(x.offer).not.toContain('kanto');
    expect(ticketsFor(over)).toEqual(x.offer);
    for (const id of x.offer) expect(ticketLines(over, id)).toHaveLength(4);
    expect(openRegions(over)).toEqual(expect.arrayContaining(['johto', 'hoenn']));
  });

  it('a third of the Roster stays, by name; "We need you." works at Loyalty 8 or more, once', () => {
    let b = step(over, { type: 'cross', what: 'ticket', id: 'johto' }).block;
    const staying = whoStays(b);
    expect(staying.length).toBe(Math.floor(b.crew.filter((c) => c.where === 'in').length / 3));
    expect(b.region.crossing!.staying).toEqual(staying.map((c) => c.id));
    if (staying.length) {
      const id = staying[0]!.id;
      const loyal = { ...b, crew: b.crew.map((c) => (c.id === id ? { ...c, loyalty: 8 } : c)) };
      const r = step(loyal, { type: 'cross', what: 'ask', id });
      expect(r.ok).toBe(true);
      expect(r.block.region.crossing!.staying).not.toContain(id);
      expect(step(r.block, { type: 'cross', what: 'ask', id }).ok).toBe(false);
      const low = step({ ...b, crew: b.crew.map((c) => (c.id === id ? { ...c, loyalty: 7 } : c)) }, { type: 'cross', what: 'ask', id });
      expect(low.block.region.crossing!.staying).toContain(id);
    }
    b = step(b, { type: 'cross', what: 'next' }).block;
    expect(['base', 'forms']).toContain(b.region.crossing!.step);
  });

  it('Heat halves; Regard and Dread halve (Regard whole if the base was handed over); Funds carry; a new region and a new neighbour', () => {
    let b: EvilModeBlock = { ...over, team: { ...over.team, heat: 7, regard: 5, dread: 3, funds: 4321 } };
    b = beginCrossing({ ...b, region: { ...b.region, crossing: null } });
    // Slice 19: six regions are open now, so the seed may offer others; this test crosses to Hoenn, offered beside Johto.
    b = { ...b, region: { ...b.region, crossing: { ...b.region.crossing!, offer: ['hoenn', 'johto'] } } };
    b = step(b, { type: 'cross', what: 'ticket', id: 'hoenn' }).block;
    b = step(b, { type: 'cross', what: 'next' }).block;
    const hand = b.region.crossing!.step === 'base';
    if (hand) b = step(b, { type: 'cross', what: 'base', choice: 'hand' }).block;
    b = step(b, { type: 'cross', what: 'forms', yes: true }).block;
    expect(step(b, { type: 'cross', what: 'ticket', id: 'johto' }).ok).toBe(false);
    const r = step(b, { type: 'cross', what: 'go' });
    expect(r.ok).toBe(true);
    const n = r.block;
    expect(n.team.heat).toBe(3);
    expect(n.team.regard).toBe(hand ? 5 : 2);
    expect(n.team.dread).toBe(1);
    expect(n.team.funds).toBe(4321);
    expect(n.region.id).toBe('hoenn');
    expect(n.region.crossed).toEqual(['kanto']);
    expect(n.region.forms).toBe(true);
    expect(n.here).toMatchObject({ region: 2, stage: 1, beat: 'morning' });
    expect(runIndex(n)).toBe(1);
    expect(n.base).toBeNull();
    expect(n.district!.region).toBe(2);
    expect(n.crew.filter((c) => c.left?.how === 'stayed').map((c) => c.id).sort()).toEqual([...b.region.crossing!.staying].sort());
    // The boats leave once.
    expect(step(n, { type: 'cross', what: 'go' }).ok).toBe(false);
    // A new neighbour, Hoenn's: Aqua or Magma by the side.
    const m = ensureNeighbour(n);
    expect(['archie', 'maxie']).toContain(m.neighbour!.id);
    expect(m.neighbour!.id).toBe(neighbourDef(2, EVIL_DATA, sideFor(n.district!.seed, n.team.doctrine))!.id);
  });

  it('the Hero lands by how the last room went', () => {
    const won = beginCrossing({ ...over, region: { ...over.region, crossing: null }, reck: over.reck ? { ...over.reck, room: over.reck.room ? { ...over.reck.room, outcome: 'heroWon' } : null } : null });
    expect(['ahead', 'beside']).toContain(won.region.crossing!.boats);
  });

  it('the last region has no Crossing', () => {
    const last = { ...over, region: { ...over.region, crossed: ['johto', 'hoenn'], crossing: null } };
    expect(beginCrossing(last).region.crossing).toBeNull();
    expect(cross(last, { what: 'go' }).problem).toBeTruthy();
  });
});

describe('the Crossing screen: one step at a time, every choice a code the scene sends back', () => {
  const over = overRegion();

  it('walks tickets, who comes, the quay and the boats by the first choice of each step', () => {
    let b = over;
    const seen: string[] = [];
    for (let i = 0; i < 6 && b.region.crossing; i++) {
      const m = crossingModel(b)!;
      seen.push(m.step);
      expect(m.choices.length).toBeGreaterThan(0);
      const first = m.choices.find((c) => !c.off)!;
      const r = cross(b, crossActOf(first.code)!);
      expect(r.problem).toBeNull();
      b = r.block;
    }
    expect(seen[0]).toBe('tickets');
    expect(seen.at(-1)).toBe('boats');
    expect(b.region.crossed).toEqual(['kanto']);
    expect(crossingModel(b)).toBeNull();
  });

  it('a ticket names its region and its four lines; a bad code is refused', () => {
    const m = crossingModel(over)!;
    expect(m.choices.map((c) => c.code)).toEqual(over.region.crossing!.offer.map((id) => `ticket:${id}`));
    expect(m.intro).toContain('Kanto');
    expect(crossActOf('nonsense')).toBeNull();
    expect(crossActOf('base:explode')).toBeNull();
  });

  it('region texts name each region\'s own Leaders and towns', () => {
    const R = EVIL_DATA.region;
    expect(regionText(R.reckoning.badge, { here: { ...over.here, region: 0 } })).toContain('Giovanni');
    expect(regionText(R.reckoning.badge, { here: { ...over.here, region: 1 } })).toContain('Clair');
    expect(regionText(R.arrival.badge, { here: { ...over.here, region: 2 } })).toContain('Roxanne');
    expect(regionText(R.reckoning.over, { here: { ...over.here, region: 2 } })).toContain('Hoenn');
  });
});

describe('Johto and Hoenn: rules and holdings', () => {
  it('the rule hook stacks in order: the region\'s, then the Patron\'s; Johto Persuade +10, Take −20', () => {
    const j = fresh('johto-1', { region: 'johto' });
    expect(j.here.region).toBe(1);
    const mods = activeMods(j);
    expect(mods[0]!.from).toBe('Johto');
    expect(mods.findIndex((m) => m.from === 'Johto')).toBeLessThan(mods.findIndex((m) => m.from !== 'Johto' && m.from !== 'The base'));
    expect(ruleTerms(j, 'odds', { method: 'persuade' })).toEqual([{ label: 'Johto: somebody\'s aunt will say a good word', value: 10 }]);
    expect(modify(j, 'odds', { method: 'take' }, 50)).toBe(30);
    expect(modify(j, 'odds', { method: 'pay' }, 50)).toBe(50);
    const k = fresh('kanto-1');
    expect(modify(k, 'odds', { method: 'persuade' }, 50)).toBe(50);
  });

  it('Hoenn: a Tide kit +10 on tide holdings, anyone else −10; an Ember kit at home on hot ones', () => {
    const tide = fresh('hoenn-1', { region: 'hoenn', doctrine: 'tide' });
    const swarm = fresh('hoenn-1', { region: 'hoenn', doctrine: 'swarm' });
    const ember = fresh('hoenn-1', { region: 'hoenn', doctrine: 'ember' });
    expect(modify(tide, 'odds', { method: 'persuade', tags: ['tide'] }, 50)).toBe(60);
    expect(modify(swarm, 'odds', { method: 'persuade', tags: ['tide'] }, 50)).toBe(40);
    expect(modify(ember, 'odds', { method: 'persuade', tags: ['hot'] }, 50)).toBe(60);
    expect(modify(ember, 'odds', { method: 'persuade', tags: ['tide'] }, 50)).toBe(40);
    expect(modify(swarm, 'odds', { method: 'persuade' }, 50)).toBe(50);
    // Half the holdings are tide or hot.
    const tagged = swarm.district!.holdings.filter((h) => h.tags?.some((t) => t === 'tide' || t === 'hot'));
    expect(tagged.length).toBeGreaterThan(0);
  });

  it('a water route can\'t be held by an Ember team; it lapses when left with nobody unless the kit is Tide; a kept place always lapses', () => {
    const water: Holding = { id: 'w', step: 3, kind: 'water', ref: 'Route 104', mood: null, scouted: 1, owner: 'team', holds: true, tried: [] };
    const kept: Holding = { ...water, id: 'k', kind: 'kept', ref: 'Sprout Tower' };
    const h = fresh('hoenn-2', { region: 'hoenn', doctrine: 'ember' });
    expect(lapses(h, water)).toBe(true);
    expect(lapses(fresh('hoenn-2', { region: 'hoenn', doctrine: 'tide' }), water)).toBe(false);
    expect(lapses(h, kept)).toBe(true);
    const route = h.district!.holdings.find((x) => x.kind === 'water');
    if (route) {
      const atDispatch = { ...h, here: { ...h.here, beat: 'dispatch' as const }, district: { ...h.district!, holdings: h.district!.holdings.map((x) => (x.id === route.id ? { ...x, scouted: 2 } : x)) } };
      expect(jobProblem(atDispatch, { holdingId: route.id, method: 'outplay', squad: [atDispatch.crew[0]!.id] } as never)).toBe(EVIL_DATA.region.crossing.emberBoat);
    }
  });

  it('minors among the locals are locked: Wally is a minor, and Bugsy and Tate and Liza can\'t be bought', () => {
    expect(EVIL_DATA.district.locals.find((l) => l.id === 'h5-wally')?.minor).toBe(true);
    for (const id of ['bugsy', 'tate-liza']) {
      const l = EVIL_DATA.gym.leaders.find((x) => x.id === id)!;
      expect(l.minor).toBe(true);
      expect(l.buy?.price ?? null).toBeNull();
      expect(l.replace).toBeNull();
    }
  });

  it('every region written has eight stages, eight Leaders and eight locals of its own', () => {
    for (const idx of [1, 2]) {
      expect(EVIL_DATA.district.districts.filter((d) => d.region === idx)).toHaveLength(8);
      expect(EVIL_DATA.gym.leaders.filter((l) => l.region === idx && l.role !== 'heir')).toHaveLength(8);
      expect(EVIL_DATA.district.locals.filter((l) => l.region === idx)).toHaveLength(8);
    }
  });
});

describe('Hoenn: the letters and the second clock', () => {
  const hoenn = (seed = 'clock-1'): EvilModeBlock => ensureNeighbour(fresh(seed, { region: 'hoenn' }));
  const reckoning = (b: EvilModeBlock): EvilModeBlock => ({ ...b, here: { ...b.here, stage: 8, beat: 'morning' }, district: { ...b.district!, from: b.here.day } });

  it('three letters carried stop tick 3 (one a day, In person)', () => {
    let b = hoenn();
    const at = (x: EvilModeBlock, day: number): EvilModeBlock => ({ ...x, here: { ...x.here, day, beat: 'inPerson' } });
    expect(carryLetter(b).problem).toBeTruthy();
    for (let i = 1; i <= 3; i++) {
      const r = carryLetter(at(b, i));
      expect(r.problem).toBeNull();
      expect(carryLetter(r.block).problem).toBeTruthy();
      b = r.block;
    }
    expect(b.region.letters).toBe(3);
    expect(b.neighbour!.ticks.find((t) => t.n === 3)!.state).toBe('stopped');
    expect(carryLetter(at(b, 4)).problem).toBe(EVIL_DATA.region.clock.letterDone);
    expect(clockActs(at(b, 4))).toEqual([]);
    expect(clockActs(at(hoenn(), 1)).map((c) => c.code)).toEqual(['letter']);
    expect(clockActs(at(fresh('clock-k'), 1))).toEqual([]);
    // With the letters carried, there's no second clock.
    const r = clockMorning(reckoning(b));
    expect(r.region.clock?.stopped).toBe('letters');
  });

  it('nowhere but Hoenn', () => {
    const k = ensureNeighbour(fresh('clock-k'));
    expect(carryLetter({ ...k, here: { ...k.here, beat: 'inPerson' } }).problem).toBe(EVIL_DATA.region.clock.notRegion);
    expect(clockMorning(reckoning(k)).region.clock).toBeNull();
  });

  it('never before the Reckoning\'s first morning; counts three days; at nought it costs holdings and never ends the run', () => {
    const b = hoenn();
    expect(clockMorning(b).region.clock).toBeNull();
    let r = clockMorning(reckoning(b));
    expect(r.region.clock).toMatchObject({ left: 3, stopped: null });
    r = clockMorning({ ...r, here: { ...r.here, day: r.here.day + 1 } });
    expect(r.region.clock!.left).toBe(2);
    r = clockMorning({ ...r, here: { ...r.here, day: r.here.day + 1 } });
    expect(r.region.clock!.left).toBe(1);
    const tagged = r.district!.holdings.map((h) => (h.tags?.includes('tide') || h.tags?.includes('hot') ? { ...h, owner: 'team' as const, holds: true } : h));
    const ended = { ...r, district: { ...r.district!, holdings: tagged, end: { how: 'reckoning' as const, day: r.here.day, count: 0 } } };
    const met = clockMet(ended);
    expect(met.region.clock).toMatchObject({ left: 0, stopped: 'met' });
    const ours = (x: EvilModeBlock) => x.district!.holdings.filter((h) => h.owner === 'team').length;
    expect(ours(met)).toBe(Math.floor(ours(ended) / 2));
    expect(met.ending).toBeNull();
    expect(clockMet(met)).toBe(met);
  });

  it('stopped by the Boss (In person) or by the Hero (temper by one)', () => {
    const r = clockMorning(reckoning(hoenn()));
    expect(stopClock(r, 'boss').problem).toBe(EVIL_DATA.region.clock.bossWhy);
    const boss = stopClock({ ...r, here: { ...r.here, beat: 'inPerson' } }, 'boss');
    expect(boss.block.region.clock!.stopped).toBe('boss');
    const hero = stopClock(r, 'hero');
    expect(hero.block.region.clock!.stopped).toBe('hero');
    expect(Math.abs(hero.block.hero!.temper - r.hero!.temper)).toBeLessThanOrEqual(1);
    expect(stopClock(hero.block, 'boss').problem).toBeTruthy();
  });
});

describe('the Road, and saves: block v15', () => {
  it('a kept place left with nobody lapses on the Road', () => {
    const j = fresh('kept-1', { region: 'johto' });
    const d = { ...j.district!, holdings: j.district!.holdings.map((h, i) => (i === 0 ? { ...h, kind: 'kept' as const, owner: 'team' as const, holds: true } : h)), end: { how: 'held' as const, day: 3, count: 0 } };
    const b = { ...j, district: d, region: { ...j.region, phase: 'road' as const } };
    const r = goOn(b, null);
    expect(r.problem).toBeNull();
    expect(r.block.region.past.at(-1)!.district.holdings[0]!.owner).toBe('nobody');
  });

  it('v14 -> v15: nothing crossed, no Crossing, no clock', () => {
    const b = fresh();
    const { crossed: _c, crossing: _x, abroad: _a, forms: _f, letters: _l, clock: _k, ...region } = b.region;
    const out = EvilModeBlockSchema.parse(JSON.parse(JSON.stringify({ ...b, v: 14, region })));
    expect(out).toMatchObject({ v: 16, region: { crossed: [], crossing: null, abroad: 0, forms: null, letters: 0, clock: null } });
  });

  it('a save made mid-Crossing reloads at the same step', () => {
    const b = step(overRegion('cross-save'), { type: 'cross', what: 'ticket', id: 'hoenn' }).block;
    const again = EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(b)));
    expect(again.region.crossing).toEqual(b.region.crossing);
  });
});
