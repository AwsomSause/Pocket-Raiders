// Evil Mode slice 9, "a region" (build plan section 3): Kanto played whole. The Arrival, six districts, the Road and an
// Officer left behind, drift, the tally, a soft Reckoning; Kanto's rule on one hook; the Look, Patron and first-region
// pages; every way it can go wrong has its way forward; a whole region replays from a list of actions.

import { describe, expect, it } from 'vitest';
import { foundForPlay, playRegion, policyJobs, replay } from '../../src/core/evilMode/autoplay';
import { layDistrict, lookMood } from '../../src/core/evilMode/board';
import { EVIL_DATA, type EvilData } from '../../src/core/evilMode/data';
import { BEAT_END, step, type EvilAction } from '../../src/core/evilMode/day';
import { jobProblem, squadLimit } from '../../src/core/evilMode/dispatch';
import { gymDoors } from '../../src/core/evilMode/gym';
import { oddsFor } from '../../src/core/evilMode/odds';
import { dayIn, drift, goOn, mayStay, morningNotes, pastPays, stageKind, waysForward } from '../../src/core/evilMode/region';
import { activeMods, allows, modify, PATRON_ID } from '../../src/core/evilMode/regionRule';
import { EvilModeBlockSchema, type EvilModeBlock, type JobMethod } from '../../src/core/evilMode/schema';
import { foundingModel, lookOf, newDraft, pageReady, regionChips, turnLook, type FoundingDraft } from '../../src/core/evilMode/screens';
import { foundTeam, type FoundingChoice } from '../../src/core/evilMode/start';
import { teamLoyalty } from '../../src/core/evilMode/people';

const choice = (over: Partial<FoundingChoice> = {}): FoundingChoice => ({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm', patron: 'executive', region: 'kanto', ...over });
const found = (over: Partial<FoundingChoice> = {}, seed = 'region-1') => foundForPlay(seed, choice(over));
const act = (b: EvilModeBlock, a: EvilAction): EvilModeBlock => {
  const r = step(b, a);
  if (!r.ok) throw new Error(`${a.type}: ${JSON.stringify(r.cues)}`);
  return r.block;
};
const toBeat = (b0: EvilModeBlock, beat: string): EvilModeBlock => {
  let b = b0;
  for (let i = 0; i < 12 && b.here.beat !== beat; i++) b = act(b, { type: BEAT_END[b.here.beat] });
  return b;
};
const OFF: EvilData = { ...EVIL_DATA, region: { ...EVIL_DATA.region, on: false } };

describe('founding: the Arrival, the Look, the Patron, the first region', () => {
  it('a new team begins at the Arrival in Pewter (stage 1, n 0), with the region state and the Patron on the Roster', () => {
    const b = found();
    expect(b.v).toBe(14);
    expect(b.here).toMatchObject({ region: 0, stage: 1, day: 1, beat: 'morning' });
    expect(b.district).toMatchObject({ region: 0, n: 0 });
    expect(b.district!.holdings.find((h) => h.kind === 'town')!.ref).toBe('Pewter City');
    expect(b.region).toMatchObject({ id: 'kanto', phase: 'day', past: [], tallies: [] });
    expect([3, 4]).toContain(b.region.badgeDay);
    expect(b.crew.find((c) => c.id === PATRON_ID)).toMatchObject({ name: 'Carrow', rank: 'officer', where: 'in' });
    expect(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(b)))).toEqual(b);
  });
  it('Kanto\'s own locals live in their own districts, and the first Gym hasn\'t heard of you', () => {
    const b = found();
    expect(b.district!.holdings.some((h) => h.ref === 'k1-finch')).toBe(true);
    for (let n = 1; n <= 6; n++) {
      const d = layDistrict('s', 0, n, { regard: 0, dread: 0 });
      const own = EVIL_DATA.district.locals.filter((l) => l.region === 0 && l.home === n).map((l) => l.id);
      for (const id of own) expect(d.holdings.some((h) => h.ref === id), `${id} in ${n}`).toBe(true);
    }
    const doors = gymDoors(b);
    expect(doors.every((d) => !d.open)).toBe(true);
  });
  it('a district met already this region isn\'t drawn again while the deck lasts', () => {
    const one = layDistrict('s', 0, 1, { regard: 0, dread: 0 });
    const used = one.holdings.filter((h) => h.kind === 'local').map((h) => h.ref);
    const two = layDistrict('s', 0, 2, { regard: 0, dread: 0 }, EVIL_DATA, { used });
    const generic = two.holdings.filter((h) => h.kind === 'local' && !h.ref.startsWith('k'));
    expect(generic.some((h) => used.includes(h.ref))).toBe(false);
  });
  it('the Look: black and red, one colder; "whatever they came in", one warmer', () => {
    const L = EVIL_DATA.region.look;
    const hex = (list: [string, string][], n: string) => list.find(([x]) => x === n)![1];
    expect(lookMood({ a: hex(L.a, 'Black'), b: hex(L.b, 'Red') })).toBe(-1);
    expect(lookMood({ a: hex(L.a, 'Black'), b: hex(L.b, 'Gold'), cut: L.warm.cut })).toBe(1);
    const cold = layDistrict('s', 0, 1, { regard: 0, dread: 0, look: { a: hex(L.a, 'Black'), b: hex(L.b, 'Red') } });
    const plain = layDistrict('s', 0, 1, { regard: 0, dread: 0 });
    const order = ['shut', 'sullen', 'wary', 'easy', 'warm'];
    plain.holdings.forEach((h, i) => {
      if (h.kind !== 'local' || h.mood === 'shut') return;
      expect(order.indexOf(cold.holdings[i]!.mood!)).toBe(Math.max(0, order.indexOf(h.mood!) - 1));
    });
  });
  it('the founding pages: Look rows turn and wrap; nine tickets, only Kanto open; Nobody gives +50% Funds', () => {
    let d: FoundingDraft = { ...newDraft(), page: 'look' };
    d = turnLook(d, 'a', -1);
    expect(lookOf(d).a).toBe(EVIL_DATA.region.look.a[10]![1]);
    const m = foundingModel({ ...d, doctrine: 'tricksters', page: 'region' }, { bossName: 'Red', bossFile: null, starter: 'Bulbasaur', starterFile: null, oldLook: false, length: 'three' });
    expect(m.regions).toHaveLength(9);
    expect(m.regions.filter((r) => r.open).map((r) => r.id)).toEqual(['kanto']);
    expect(m.regions[0]!.ticket[2]).toBe('Your Doctrine: at home in 2 of six.');
    expect(pageReady({ ...d, page: 'region', region: 'johto' })).toBe(false);
    expect(foundTeam(choice({ region: 'johto' }), { boss: 'red', length: 'three' }).ok).toBe(false);
    const nobody = foundTeam(choice({ patron: 'nobody' }), { boss: 'red', length: 'three' });
    const creed = EVIL_DATA.creeds.find((c) => c.id === 'profit')!;
    expect(nobody.ok && nobody.block.team.funds).toBe(Math.floor(creed.start.funds * 1.5));
    expect(nobody.ok && nobody.block.crew.some((c) => c.id === PATRON_ID)).toBe(false);
  });
});

describe('the Arrival (Part 2 section 2.1)', () => {
  it('Persuade, Pay, Outplay and scouting only; one squad (two with a former Executive)', () => {
    let b = toBeat(found({ line: 'whatever' }), 'dispatch');
    expect(allows(b, 'lean').ok).toBe(false);
    const h = b.district!.holdings.find((x) => x.kind === 'local')!;
    const ids = b.crew.filter((c) => c.where === 'in' && !c.minor).map((c) => c.id);
    expect(jobProblem(b, { holdingId: h.id, method: 'lean', squad: ids.slice(0, 3) })).toContain('got off the boat');
    expect(squadLimit(b)).toBe(2);
    expect(squadLimit({ ...b, team: { ...b.team, patron: 'nobody' } })).toBe(1);
    const free = b.district!.holdings.filter((x) => x.kind !== 'gym' && x.kind !== 'town').slice(0, 3);
    b = act(b, { type: 'queueJob', job: { holdingId: free[0]!.id, method: 'scout', squad: [ids[0]!] } });
    b = act(b, { type: 'queueJob', job: { holdingId: free[1]!.id, method: 'scout', squad: [ids[1]!] } });
    expect(step(b, { type: 'queueJob', job: { holdingId: free[2]!.id, method: 'scout', squad: [ids[2]!] } }).ok).toBe(false);
  });
  it('the Hero\'s home on day 1, away on day 2, and the first Badge on day 3 or 4 ends the Arrival', () => {
    let b = found();
    b = toBeat(b, 'hero');
    b = act(b, { type: 'watchRoad' });
    expect(b.hero!.today[0]).toContain('at home');
    while (!b.district!.end) b = act(b, { type: BEAT_END[b.here.beat] });
    expect(b.district!.end!.how).toBe('arrival');
    expect(b.district!.end!.day).toBe(b.region.badgeDay);
    expect(b.hero!.badges).toHaveLength(1);
    expect(b.region.phase).toBe('tally');
    expect(b.region.tallies[0]!.rows.map(([k]) => k)).toEqual(['Holdings', 'The Gym', 'The numbers', 'People', 'The Hero', 'The Log']);
  });
  it('the lessons: the Patron teaches one beat a day; with Nobody, notes on the door', () => {
    expect(morningNotes(found())[0]).toMatch(/^Carrow: The Board/);
    expect(morningNotes(found({ patron: 'nobody' }))[0]).toMatch(/^A note on the door/);
  });
});

describe('Kanto\'s rule on the one hook: Pay +10%, a deeded Take Heat +1, and nothing else changed', () => {
  it('every holding, every method: only Pay\'s odds (when not certain) differ, by exactly +10 before clamping', () => {
    const b = { ...found({ patron: 'nobody' }), here: { region: 0, stage: 3, day: 9, beat: 'dispatch' as const } };
    const district = layDistrict('rule', 0, 2, b.team, EVIL_DATA);
    const block: EvilModeBlock = { ...b, district: { ...district, holdings: district.holdings.map((h) => ({ ...h, scouted: 2 })) } };
    const ids = block.crew.filter((c) => c.where === 'in').map((c) => c.id).slice(0, 3);
    let pays = 0;
    for (const h of block.district!.holdings) {
      for (const method of ['scout', 'persuade', 'pay', 'outplay', 'lean', 'take', 'expose'] as JobMethod[]) {
        for (const offer of method === 'pay' ? [100, 75, 50] : [undefined]) {
          const job = { holdingId: h.id, method, squad: ids, ...(offer ? { offer } : {}), ...(method === 'take' ? { thing: 'stock' as const } : {}) };
          const on = oddsFor(block, job, EVIL_DATA);
          const off = oddsFor(block, job, OFF);
          if (method === 'pay' && !on.certain) {
            pays++;
            expect(on.terms.length).toBe(off.terms.length + 1);
            expect(on.terms.at(-1)).toEqual({ label: "Kanto: everything's owned", value: 10 });
            expect(on.odds).toBe(Math.min(95, off.odds + 10));
          } else expect(on, `${h.kind} ${method}`).toEqual(off);
        }
        const heatOn = modify(block, 'heat', { method, tags: h.tags }, 3, EVIL_DATA);
        expect(heatOn).toBe(method === 'take' && h.tags?.includes('deeded') ? 4 : 3);
        expect(modify(block, 'heat', { method, tags: h.tags }, 3, OFF)).toBe(3);
      }
    }
    expect(pays).toBeGreaterThan(0);
    expect(block.district!.holdings.some((h) => h.tags?.includes('deeded'))).toBe(true);
    expect(activeMods(block).filter((m) => m.from === 'Kanto').map((m) => m.mod.kind)).toEqual(['odds', 'heat']);
  });
  it('the rule is on the frame all region', () => {
    expect(regionChips(found())).toContain("Kanto: Everything's owned");
  });
});

describe('Kanto\'s own holding: a floor (Part 26a section 2.3) and a canon face\'s locks', () => {
  it('floors are held from the bottom: a floor can\'t be worked till the one below is held or its tenant Warm', () => {
    const b0 = found({ patron: 'nobody' });
    const d = layDistrict('tower', 0, 3, b0.team);
    const block: EvilModeBlock = { ...b0, here: { region: 0, stage: 4, day: 20, beat: 'dispatch' }, district: { ...d, from: 20 } };
    const floors = block.district!.holdings.filter((h) => h.kind === 'floor').sort((a, c) => a.floor! - c.floor!);
    expect(floors).toHaveLength(5);
    expect(floors[0]!.step).toBeLessThan(floors[4]!.step);
    const ids = block.crew.filter((c) => c.where === 'in').map((c) => c.id).slice(0, 2);
    expect(jobProblem(block, { holdingId: floors[1]!.id, method: 'persuade', squad: ids })).toContain('held from the bottom');
    expect(jobProblem(block, { holdingId: floors[1]!.id, method: 'scout', squad: [ids[0]!] })).toBeNull();
    const held = { ...block, district: { ...block.district!, holdings: block.district!.holdings.map((h) => (h.id === floors[0]!.id ? { ...h, owner: 'team' as const, holds: true } : h)) } };
    expect(jobProblem(held, { holdingId: floors[1]!.id, method: 'persuade', squad: ids })).toBeNull();
  });
  it('Mr. Fuji can\'t be Leaned on or Taken from, by anyone', () => {
    const b0 = found({ patron: 'nobody', line: 'whatever' });
    const d = layDistrict('fuji', 0, 5, b0.team);
    const block: EvilModeBlock = { ...b0, here: { region: 0, stage: 6, day: 30, beat: 'dispatch' }, district: { ...d, from: 30 } };
    const fuji = block.district!.holdings.find((h) => h.ref === 'k5-fuji')!;
    const ids = block.crew.filter((c) => c.where === 'in' && !c.minor).map((c) => c.id).slice(0, 3);
    expect(jobProblem(block, { holdingId: fuji.id, method: 'lean', squad: ids })).toContain('Otis');
    expect(jobProblem(block, { holdingId: fuji.id, method: 'take', squad: ids, thing: 'stock' })).toContain('Otis');
  });
});

describe('the Road, an Officer left behind, drift and the double-back (Part 2 sections 4.1 and 5)', () => {
  const ended = (stay: boolean) => {
    let b = found();
    while (b.region.phase === 'day') {
      if (b.here.beat === 'dispatch' && !b.queue.length) for (const job of policyJobs(b, 'persuade')) b = act(b, { type: 'queueJob', job });
      b = act(b, { type: BEAT_END[b.here.beat] });
    }
    // Give the Arrival a few holdings that hold, so what it pays from the Road can be told apart.
    const locals = b.district!.holdings.filter((h) => h.kind === 'local').slice(0, 2).map((h) => h.id);
    b = { ...b, district: { ...b.district!, holdings: b.district!.holdings.map((h) => (locals.includes(h.id) ? { ...h, owner: 'team' as const, holds: true } : h)) } };
    b = act(b, { type: 'toRoad' });
    expect(b.region.phase).toBe('road');
    const officer = mayStay(b)[0]!;
    expect(officer.id).toBe(PATRON_ID);
    return act(b, { type: 'goOn', stay: stay ? officer.id : null });
  };
  it('going on lays the next district from the next day; the Officer left is Away and the district pays in full less their wage', () => {
    const b = ended(true);
    expect(b.here).toMatchObject({ stage: 2, beat: 'morning' });
    expect(b.district).toMatchObject({ n: 1, from: b.here.day });
    expect(dayIn(b)).toBe(1);
    expect(b.hero!.at).toBe(1);
    expect(b.crew.find((c) => c.id === PATRON_ID)!.where).toBe('away');
    expect(b.region.past[0]!.leftWith).toBe(PATRON_ID);
    const p = b.region.past[0]!;
    const full = p.district.holdings.filter((h) => h.owner === 'team' && h.holds).length;
    expect(full).toBeGreaterThan(0);
    expect(pastPays(b, p)).toBeGreaterThan(pastPays(b, { ...p, leftWith: null }));
  });
  it('with nobody left it pays half, and drifts one-in-six an Evening on its own stream (a reload drifts the same)', () => {
    const b = ended(false);
    expect(b.region.past[0]!.leftWith).toBeNull();
    const a1 = drift(b);
    const a2 = drift(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(b))));
    expect(a1.block.region).toEqual(a2.block.region);
    const owned = b.region.past[0]!.district.holdings.filter((h) => h.owner === 'team' && h.kind !== 'gym' && h.kind !== 'town').length;
    expect(a1.block.draws['evil-drift']).toBe(owned);
    expect(a1.block.draws['evil-dispatch']).toBe(b.draws['evil-dispatch']);
  });
  it('the double-back happens once a region, to a district nobody held, and is a note at the next Morning', () => {
    let b = ended(false);
    b = { ...b, district: { ...b.district!, end: { how: 'held', day: b.here.day, count: 11 } }, region: { ...b.region, phase: 'road' } };
    const r = goOn(b, null);
    expect(r.problem).toBeNull();
    expect(r.block.region.doubledBack).toBe(true);
    expect(r.block.region.notes.some((n) => n.includes('came back through'))).toBe(true);
    expect(morningNotes(r.block).some((n) => n.includes('came back through'))).toBe(true);
  });
  it('only an Officer can be left; a Grunt is refused', () => {
    let b = found();
    b = { ...b, district: { ...b.district!, end: { how: 'held', day: 3, count: 11 } }, region: { ...b.region, phase: 'road' } };
    const grunt = b.crew.find((c) => c.rank === 'grunt')!;
    expect(goOn(b, grunt.id).problem).not.toBeNull();
  });
});

describe('a whole Kanto, played and replayed (the simulator\'s autoplayer)', () => {
  it('a region plays from the first Morning to the Reckoning\'s end, and replays from its list of actions to the same block', () => {
    for (const policy of ['persuade', 'richest', 'mix'] as const) {
      const b0 = found({}, `replay-${policy}`);
      const r = playRegion(b0, policy);
      expect(r.finished, policy).toBe(true);
      expect(r.block.region.phase).toBe('over');
      expect(r.districts.map((d) => d.n)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      expect(r.districts[0]!.how).toBe('arrival');
      expect(r.districts.at(-1)!.how).toBe('reckoning');
      expect(r.block.hero!.badges.length).toBe(8);
      expect(replay(b0, r.actions)).toEqual(r.block);
      // A save at the end reloads to the same block.
      expect(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(r.block)))).toEqual(r.block);
    }
  });
  it('the Reckoning is three days, ends the region, and never the run: after it, nothing moves but leaving', () => {
    const r = playRegion(found({}, 'reckon'), 'persuade');
    const t = r.block.region.tallies.at(-1)!;
    expect(t.title).toContain('The Reckoning');
    const reck = r.districts.at(-1)!;
    expect(stageKind(8)).toBe('reckoning');
    expect(reck.day - r.districts.at(-2)!.day).toBe(3);
    expect(step(r.block, { type: 'dismissOvernight' }).ok).toBe(false);
    expect(step(r.block, { type: 'goOn', stay: null }).ok).toBe(false);
  });
  it('twenty seeded Kantos all finish, and the same seed plays the same', () => {
    for (let i = 0; i < 20; i++) expect(playRegion(found({ creed: EVIL_DATA.creeds[i % 6]!.id, patron: EVIL_DATA.region.patrons[i % 6]!.id }, `twenty-${i}`), 'mix').finished, `seed ${i}`).toBe(true);
    const a = playRegion(found({}, 'same'), 'richest');
    const b = playRegion(found({}, 'same'), 'richest');
    expect(a.block).toEqual(b.block);
  });
});

describe('every way it can go wrong has its way forward (Part 2 section 6)', () => {
  it('every row is written, with a status, and a row not built names the slice it waits for', () => {
    expect(EVIL_DATA.region.waysForward).toHaveLength(12);
    for (const w of EVIL_DATA.region.waysForward) {
      expect(w.way.length, w.id).toBeGreaterThan(10);
      if (w.status !== 'supported') expect(w.waits, w.id).toBeTruthy();
    }
  });
  it('the reachable rows show on the Board at Morning when their state holds', () => {
    const b = found();
    const nobody = { ...b, crew: b.crew.map((c) => ({ ...c, where: 'left' as const })) };
    expect(waysForward(nobody).map((w) => w.id)).toContain('nobody');
    const broke = { ...b, crew: b.crew.map((c, i) => (i === 0 ? { ...c, unpaid: 2 } : c)) };
    expect(waysForward(broke).map((w) => w.id)).toContain('bankrupt');
    const ahead = { ...b, hero: { ...b.hero!, badges: [{ region: 0, district: 0, how: 'full' as const, day: 3 }] } };
    expect(waysForward(ahead).map((w) => w.id)).toContain('heroAhead');
    expect(waysForward(b)).toEqual([]);
  });
});

describe('the Patrons on the hook', () => {
  it('a Grunt who\'s seen three Bosses keeps team Loyalty at 2 or more, and draws a ₽200 pension', () => {
    const b = found({ patron: 'grunt' });
    const low = { ...b, crew: b.crew.map((c) => ({ ...c, loyalty: 0 })) };
    expect(teamLoyalty(low)).toBe(2);
    expect(teamLoyalty({ ...low, team: { ...low.team, patron: 'nobody' } })).toBe(0);
  });
  it('the disgraced Leader adds Outplay +10% only while on the Roster; the Champion shows the Hero\'s next Gym', () => {
    const b = found({ patron: 'leader' });
    expect(modify(b, 'odds', { method: 'outplay' }, 50)).toBe(60);
    expect(modify({ ...b, crew: b.crew.map((c) => (c.id === PATRON_ID ? { ...c, where: 'left' as const } : c)) }, 'odds', { method: 'outplay' }, 50)).toBe(50);
    expect(regionChips(found({ patron: 'champion' })).some((c) => c.startsWith("The kid's next Gym: Pewter"))).toBe(true);
  });
});

describe('saves: block v8', () => {
  it('v7 -> v8: a run founded before slice 9 was in District 1: stage 2, nothing behind, and it plays on', () => {
    const r = foundTeam(choice(), { boss: 'red', length: 'three', seed: 'old', stage: 2 });
    if (!r.ok) throw new Error(r.problem);
    const { region: _r, ...rest } = r.block;
    const v7 = { ...rest, v: 7, here: { ...rest.here, stage: 1 }, district: (() => { const { from: _f, ...d } = rest.district!; return d; })() };
    const v8 = EvilModeBlockSchema.parse(v7);
    expect(v8.v).toBe(14);
    expect(v8.here.stage).toBe(2);
    expect(v8.region).toMatchObject({ id: 'kanto', phase: 'day', past: [], tallies: [] });
    expect(dayIn(v8)).toBe(v8.here.day);
    expect(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(v8)))).toEqual(v8);
    expect(step(v8, { type: 'dismissOvernight' }).ok).toBe(true);
  });
  it('a block mid-region (on the Road, an Officer away) saves and reloads the same; a damaged phase is refused', () => {
    let b = found();
    b = { ...b, district: { ...b.district!, end: { how: 'held', day: 3, count: 11 } }, region: { ...b.region, phase: 'road' } };
    b = goOn(b, PATRON_ID).block;
    expect(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(b)))).toEqual(b);
    expect(EvilModeBlockSchema.safeParse({ ...b, region: { ...b.region, phase: 'lost' } }).success).toBe(false);
  });
});
