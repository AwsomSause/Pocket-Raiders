// DOMINION redesign R3 (pass 50, The Day): simple real rules for the six pages that had none (theDay.ts): the weather,
// the ways to travel, the flooded Underground Path, the Scrapbook and the press interview. Normal, boundary and failure.
import { describe, expect, it } from 'vitest';
import { endNight } from '../../src/core/dominion/clock';
import { card } from '../../src/core/dominion/field';
import { DOMINION_MODE_ID, startInRun } from '../../src/core/dominion/session';
import { DominionBlockSchema, type DominionBlock } from '../../src/core/dominion/schema';
import { dayStep, interviewDue, pathOf, skyOf, SKIES, THE_DAY, waysTo, weatherOn } from '../../src/core/dominion/theDay';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { r5Flood, r5Forecast, r5Papers, r5Scrap, r5Timetable, r5Travel } from '../../src/ui/redux/screens/dominion/r50/day4';
import { r5RunOf } from '../../src/ui/redux/screens/dominion/r50/run';
import { content } from './helpers';

const start = (seed = 'r3d'): { run: RunState; b: DominionBlock } => {
  const run0 = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
  const out = startInRun(content, run0, { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return { run: out.run, b: structuredClone(out.run.expansion!.dominion!) };
};
const day = (b: DominionBlock): DominionBlock => ({ ...structuredClone(b), phase: 'day', actions: 3 });

describe('R3 weather', () => {
  it('Day 1 is Sunny; later days come from the seed and never change', () => {
    expect(weatherOn('x', 1)).toBe('sunny');
    expect(weatherOn('x', 0)).toBe('sunny');
    const a = Array.from({ length: 200 }, (_, i) => weatherOn('x', i + 2));
    expect(Array.from({ length: 200 }, (_, i) => weatherOn('x', i + 2))).toEqual(a);
    for (const k of SKIES) expect(a).toContain(k);
    expect(a).not.toEqual(Array.from({ length: 200 }, (_, i) => weatherOn('y', i + 2)));
  });
  it('the World Turn saves the new day’s sky; a block without one is Sunny', () => {
    const { b } = start();
    expect(skyOf(b)).toBe('sunny');
    const n = endNight(b, 'r3d', true);
    expect(n.field.sky).toBe(weatherOn('r3d', n.day));
    expect(DominionBlockSchema.parse(n).field.sky).toBe(n.field.sky);
  });
  it('rain puts stealth jobs up and Heat down on the Card; Sunny changes nothing', () => {
    const { run, b } = start();
    const at = b.field.at;
    const sunny = card(day(b), run, 'thieve', null, at)!;
    const rain = card(day({ ...b, field: { ...b.field, sky: 'rain' } }), run, 'thieve', null, at)!;
    expect(rain.parts).toContainEqual(['Rain today', 5]);
    expect(sunny.parts.some(([l]) => l.endsWith('today'))).toBe(false);
    expect(rain.heat).toBe(Math.max(0, sunny.heat - 1));
    const hot = card(day({ ...b, field: { ...b.field, sky: 'hot' } }), run, 'thieve', null, at)!;
    expect(hot.heat).toBe(sunny.heat + 1);
  });
});

describe('R3 ways to travel', () => {
  it('main road pays a rival toll for each of their districts it passes through; back streets cost one more action', () => {
    const { run, b } = start();
    const w = day(b);
    w.field.at = 'pewter';
    w.field.districts.cerulean = { ...w.field.districts.cerulean!, rival: 90, control: 0 };
    expect(pathOf(w, 'pewter', 'saffron')).toEqual(['pewter', 'cerulean', 'saffron']);
    const road = card(w, run, 'thieve', null, 'saffron')!;
    const plain = card(day(b), run, 'thieve', null, 'saffron')!;
    expect(road.money - plain.money).toBe(THE_DAY.travel.ways.road.toll);
    const back = card({ ...w, field: { ...w.field, route: 'back' } }, run, 'thieve', null, 'saffron')!;
    expect(back.cost).toBe(road.cost + 1);
    expect(back.money).toBe(plain.money);
    // boundary: the destination itself is not a toll
    expect(card(w, run, 'thieve', null, 'cerulean')!.money).toBe(plain.money);
  });
  it('the Magnet Line takes no actions and a fare; a storm cancels it (the road instead)', () => {
    const { run, b } = start();
    const w = day({ ...b, field: { ...b.field, at: 'pewter', route: 'train' } });
    const road = card(day({ ...b, field: { ...b.field, at: 'pewter' } }), run, 'thieve', null, 'vermilion')!;
    const back = card(day({ ...b, field: { ...b.field, at: 'pewter', route: 'back' } }), run, 'thieve', null, 'vermilion')!;
    const train = card(w, run, 'thieve', null, 'vermilion')!;
    expect(train.cost).toBe(1);
    expect(road.cost).toBeGreaterThan(1);
    expect(train.money - back.money).toBe(THE_DAY.travel.ways.train.fare);
    const storm = card({ ...w, field: { ...w.field, sky: 'storm', wet: 'wade' } }, run, 'thieve', null, 'vermilion')!;
    expect(storm.cost).toBe(road.cost);
    expect(waysTo({ ...w, field: { ...w.field, sky: 'storm' } }, run, 'vermilion', 3)[2]!.why).toBe(THE_DAY.travel.lines2.cancelled);
    // failure: no station in Pallet
    expect(waysTo({ ...w, field: { ...w.field, at: 'pallet' } }, run, 'vermilion', 3)[2]!.why).toBe(THE_DAY.travel.lines2.noStation);
  });
  it('a police check on the train when the place is hot', () => {
    const { run, b } = start();
    const w = day({ ...b, field: { ...b.field, at: 'pewter', route: 'train' } });
    w.field.districts.vermilion = { ...w.field.districts.vermilion!, heat: 50 };
    const cool = card(day({ ...b, field: { ...b.field, at: 'pewter', route: 'train' } }), run, 'thieve', null, 'vermilion')!;
    const hot = card(w, run, 'thieve', null, 'vermilion')!;
    expect(hot.failHeat).toBe(cool.failHeat + THE_DAY.travel.ways.train.policeHeat!);
  });
  it('the route action sets the way; a bad way is refused', () => {
    const { run, b } = start();
    const out = dayStep(b, run, { t: 'day', op: 'route', how: 'back' });
    expect(out.ok).toBe(true);
    expect(out.block.field.route).toBe('back');
    expect(b.field.route).toBeUndefined();
    expect(dayStep(b, run, { t: 'day', op: 'route', how: 'jetpack' }).ok).toBe(false);
  });
});

describe('R3 the flooded tunnel', () => {
  it('on a storm day the walk through the Underground Path asks how; going round is the default', () => {
    const { run, b } = start();
    const dry = day({ ...b, field: { ...b.field, at: 'cerulean' } });
    const wet = day({ ...b, field: { ...b.field, at: 'cerulean', sky: 'storm' } });
    const c0 = card(dry, run, 'thieve', null, 'vermilion')!;
    const round = card(wet, run, 'thieve', null, 'vermilion')!;
    expect(round.cost).toBe(c0.cost + 1);
    const wade = card({ ...wet, field: { ...wet.field, wet: 'wade' } }, run, 'thieve', null, 'vermilion')!;
    expect(wade.cost).toBe(c0.cost);
    expect(wade.parts).toContainEqual([THE_DAY.travel.lines2.soaked, -5]);
    // boundary: a road that misses the tunnel stays dry
    expect(card(wet, run, 'thieve', null, 'pewter')!.cost).toBe(card(dry, run, 'thieve', null, 'pewter')!.cost);
  });
  it('riding needs a Pokémon that knows Surf; no flood, no choice', () => {
    const { run, b } = start();
    const storm = { ...b, field: { ...b.field, sky: 'storm' as const } };
    const noSurf = { ...run, party: run.party.map((m) => ({ ...m, moves: m.moves.filter((x) => x.id !== 'surf') })) };
    expect(dayStep(storm, noSurf, { t: 'day', op: 'flood', how: 'ride' })).toMatchObject({ ok: false, notice: THE_DAY.travel.lines2.noSurf });
    const surfer = { ...run, party: run.party.map((m, i) => (i ? m : { ...m, moves: [...m.moves.slice(0, 3), { ...m.moves[0]!, id: 'surf' }] })) };
    expect(dayStep(storm, surfer, { t: 'day', op: 'flood', how: 'ride' }).block.field.wet).toBe('ride');
    expect(dayStep(b, run, { t: 'day', op: 'flood', how: 'wade' }).ok).toBe(false);
    // the choice lasts the day
    expect(endNight({ ...storm, field: { ...storm.field, wet: 'wade' } }, 'r3d', true).field.wet).toBeUndefined();
  });
});

describe('R3 the papers', () => {
  it('a job makes the Scrapbook the next morning; a quiet day does not; the book keeps the last 30', () => {
    const { b } = start();
    const quiet = endNight(b, 'r3d', true);
    expect(quiet.paper?.book ?? []).toHaveLength(0);
    const w = structuredClone(b);
    w.paper = { jobs: [{ d: w.day, a: 'thieve', t: null, at: w.field.at, res: 'done', pay: 120, heat: 2, who: null }], prev: null, snap: null };
    const n = endNight(w, 'r3d', true);
    expect(n.paper!.book).toHaveLength(1);
    expect(n.paper!.book![0]!.d).toBe(n.day);
    w.paper.book = Array.from({ length: 30 }, (_, i) => ({ d: i + 1, head: `H${i}`, deck: 'd' }));
    const full = endNight(w, 'r3d', true).paper!.book!;
    expect(full).toHaveLength(30);
    expect(full[0]!.head).toBe('H1');
    expect(DominionBlockSchema.parse(n).paper!.book).toHaveLength(1);
  });
  it('the press interview costs an action, moves Dread or Regard, and waits a week', () => {
    const { run, b } = start();
    const w = day(b);
    const out = dayStep(w, run, { t: 'day', op: 'interview', how: 'fear' });
    expect(out.ok).toBe(true);
    expect(out.block.actions).toBe(2);
    const hq = Object.keys(out.block.field.districts).find((id) => out.block.field.districts[id]!.dread !== w.field.districts[id]!.dread)!;
    expect(out.block.field.districts[hq]!.dread - w.field.districts[hq]!.dread).toBe(THE_DAY.papers.interview.fear.dread);
    expect(interviewDue(out.block)).toBe(w.day + THE_DAY.papers.interview.every);
    expect(dayStep(out.block, run, { t: 'day', op: 'interview', how: 'kind' }).ok).toBe(false);
    // boundary: a week later it can be given again
    expect(interviewDue({ ...out.block, day: w.day + 7 })).toBeNull();
    // failure: not in the morning, not without an action
    expect(dayStep(b, run, { t: 'day', op: 'interview', how: 'kind' }).ok).toBe(false);
    expect(dayStep({ ...w, actions: 0 }, run, { t: 'day', op: 'interview', how: 'kind' }).ok).toBe(false);
  });
});

describe('R3 the six pages draw from their models', () => {
  it('Forecast, Travel, Timetable, Flooded tunnel, Newsstand and Scrapbook keep their test ids', () => {
    const { b } = start();
    const r = r5RunOf(b, [], {});
    const f = r5Forecast({ region: 'Kanto', days: [{ d: 1, icon: 'wx-sun', word: 'Sunny' }, { d: 2, icon: 'wx-rain', word: 'Rain' }], at: 1, head: 'Day 2 · Rain', fx: [{ cls: 'up', label: 'Stealth jobs +5%', line: 'Rain' }], line: 'Bzzt!' }, r);
    expect(f).toContain('data-testid="r5-weather"');
    expect(f.match(/class="dy15/g)).toHaveLength(2);
    expect(f).toContain('dy15 on" style="--d:70ms"');
    const t = r5Travel({ from: 'Pewter', to: 'Saffron', stops: [{ name: 'Pewter', colour: '#000', toll: false }, { name: 'Cerulean', colour: '#000', toll: true }, { name: 'Saffron', colour: '#000', toll: false }], walker: '', ways: [{ name: 'Main road', what: '', big: '2 actions', small: 'toll', icon: 'g-bicycle', why: null }], at: 0, now: 0, who: null, line: '', flooded: true }, r);
    for (const id of ['r5-travel', 'dom-tv-toll', 'dom-tv-way-0', 'dom-tv-flood', 'dom-tv-go']) expect(t).toContain(`data-testid="${id}"`);
    const tt = r5Timetable({ stations: [{ id: 'pewter', name: 'Pewter', x: 90, y: 60, o: 'own', here: true }], lines: [], rows: [], at: 0, sub: '', legend: ['A', 'B', 'C'], who: null, line: '' }, r);
    expect(tt).toContain('No station here');
    expect(tt).not.toContain('dom-tt-board"');
    const fl = r5Flood({ sub: '', people: [], rider: null, ways: [{ name: 'Wade through', what: '', cost: '', cls: 'mid', why: null }], at: 0, now: 0, who: null, line: '' }, r);
    expect(fl).toContain('data-testid="dom-fl-way-0"');
    const p = r5Papers({ day: 3, papers: [{ mast: 'M', head: 'H', deck: 'D', pic: '', fx: 'Dread 3', cls: 'fear' }], at: 0, who: null, line: '', ask: { who: { name: 'Reporter' }, line: 'Boss?', choices: ['a', 'b', 'c'] }, press: null }, r);
    expect(p).toContain('data-testid="dom-press-2"');
    const s = r5Scrap({ sub: '', clips: [{ d: 2, head: 'NEW GANG', deck: 'd' }], who: null, line: '' }, r);
    expect(s.match(/class="cl18"/g)).toHaveLength(1);
  });
});
