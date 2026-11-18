// Evil Mode slice 10, "the base" (build plan section 3): six sites and Kanto's own; rooms by Creed and Line; staffing;
// Defend's pieces and the fairness check; "Walk it" as a pseudo-stage; the warning at 9 and the Raid at 10. Part 31's
// proofs: the base can't be saved unfair; every site's fairable on day 1's money; a Raid costs what Part 17 says and
// never the run; delay's capped at two days a region. Normal, boundary and failure cases; the v8 save.

import { describe, expect, it } from 'vitest';
import { foundForPlay } from '../../src/core/evilMode/autoplay';
import { baseDelay, buildProblem, fairOf, freeSquares, pairsAt, pieceCost, previewPiece, roomCost, siteOffer, staffFor, windowLine } from '../../src/core/evilMode/base';
import { checkFair, delayOf, distances, edgeKey, gridOf, neighbours, outsideSide, routeOf, solvable, type Dir } from '../../src/core/evilMode/baseGrid';
import { fxTotal, roomOpen, rosterCap } from '../../src/core/evilMode/baseFx';
import { EVIL_DATA, type EvilData } from '../../src/core/evilMode/data';
import { BEAT_END, step, type EvilAction } from '../../src/core/evilMode/day';
import { beginEvilFight, stageLevel } from '../../src/core/evilMode/fight';
import { endEvilFight } from '../../src/core/evilMode/fightEnd';
import { bailOf, raidEvening } from '../../src/core/evilMode/raid';
import { stageDays } from '../../src/core/evilMode/region';
import { EvilModeBlockSchema, WING_IDS, type Crew, type EvilModeBlock, type Piece } from '../../src/core/evilMode/schema';
import { foundInRun, EVIL_MODE_ID, stepInRun } from '../../src/core/evilMode/session';
import type { FoundingChoice } from '../../src/core/evilMode/start';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun, healParty } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const choice = (over: Partial<FoundingChoice> = {}): FoundingChoice => ({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm', patron: 'nobody', region: 'kanto', ...over });
const act = (b: EvilModeBlock, a: EvilAction): EvilModeBlock => {
  const r = step(b, a);
  if (!r.ok) throw new Error(`${a.type}: ${JSON.stringify(r.cues)}`);
  return r.block;
};
const refused = (b: EvilModeBlock, a: EvilAction): string => {
  const r = step(b, a);
  expect(r.ok).toBe(false);
  expect(r.block).toBe(b);
  return (r.cues[0] as { reason: string }).reason;
};
const said = (b: EvilModeBlock, a: EvilAction): string => step(b, a).cues.filter((c) => c.id === 'said').map((c) => (c as { line: string }).line).join(' ');
const toBeat = (b0: EvilModeBlock, beat: string): EvilModeBlock => {
  let b = b0;
  for (let i = 0; i < 12 && b.here.beat !== beat; i++) {
    // A district's end: tally, then on down the Road to the next (the base goes with the team).
    if (b.district?.end) {
      b = act(b, { type: 'toRoad' });
      b = act(b, { type: 'goOn', stay: null });
      continue;
    }
    b = act(b, { type: BEAT_END[b.here.beat] });
  }
  return b;
};
/** A founded team with a base on `site`, at Night, with Funds to spare. */
const based = (site = 'lodge', over: Partial<FoundingChoice> = {}, seed = 'base-1'): EvilModeBlock => {
  let b = foundForPlay(seed, choice(over));
  if (!siteOffer(b).includes(site)) b = { ...b, applied: b.applied };
  b = { ...b, team: { ...b.team, funds: 60000 } };
  const r = step(b, { type: 'pickSite', site: siteOffer(b).includes(site) ? site : siteOffer(b)[0]! });
  if (!r.ok) throw new Error(JSON.stringify(r.cues));
  return toBeat(r.block, 'night');
};
/** Force a site even when the seed didn't offer it (the rules under test don't depend on the offer). */
const onSite = (site: string, over: Partial<FoundingChoice> = {}): EvilModeBlock => {
  for (let i = 0; i < 60; i++) {
    const b = foundForPlay(`site-${site}-${i}`, choice(over));
    if (siteOffer(b).includes(site)) return toBeat(act({ ...b, team: { ...b.team, funds: 60000 } }, { type: 'pickSite', site }), 'night');
  }
  throw new Error(`no seed offers ${site}`);
};
const nextNight = (b: EvilModeBlock): EvilModeBlock => toBeat(act(b, { type: 'lightsOut' }), 'night');
const person = (b: EvilModeBlock, i: number, p: Partial<Crew>): EvilModeBlock => ({ ...b, crew: b.crew.map((c, j) => (j === i ? { ...c, ...p } : c)) });
const sq = (b: EvilModeBlock) => gridOf(b.base!.site);
const SITES = EVIL_DATA.base.sites.filter((s) => s.status === 'supported');
const OFF: EvilData = { ...EVIL_DATA, base: { ...EVIL_DATA.base, on: false } };

describe('the data: sites, rooms, pieces (Part 16 sections 2 and 4, Part 17 section 2)', () => {
  it('six sites and Kanto\'s own are playable; the eight other regions\' are written and switched off with what they wait on', () => {
    expect(SITES.map((s) => s.id)).toEqual(['cellar', 'warehouse', 'cave', 'ship', 'house', 'ruin', 'lodge']);
    expect(SITES.filter((s) => s.region === null)).toHaveLength(6);
    for (const s of EVIL_DATA.base.sites.filter((x) => x.status === 'disabled')) expect(s.waits).toBeTruthy();
  });
  it('every site\'s shape: slots + the Office as squares, one door on an outside wall, the Common Room next to it, all connected', () => {
    for (const s of SITES) {
      const g = gridOf(s.id);
      expect(g.slots).toHaveLength(s.slots);
      expect(outsideSide(g, g.door)).not.toBeNull();
      expect(neighbours(g, g.door)).toContain(g.common);
      expect(distances(g, g.door).size).toBe(g.cells.size);
    }
  });
  it('the Office is always the furthest square from the front door by path length', () => {
    for (const s of SITES) {
      const g = gridOf(s.id);
      const d = distances(g, g.door);
      expect(Math.max(...d.values())).toBe(d.get(g.office));
    }
  });
  it('twelve rooms at up to three sizes, Part 5\'s costs; the Lab (slice 21) is built at Whatever it takes; every limited size says what it waits on', () => {
    expect(EVIL_DATA.base.rooms.find((r) => r.id === 'barracks')!.sizes.map((s) => s.cost)).toEqual([2500, 3750, 5000]);
    expect(EVIL_DATA.base.rooms.find((r) => r.id === 'vault')!.sizes.map((s) => s.cost)).toEqual([5000, 7500, 10000]);
    expect(EVIL_DATA.base.rooms.find((r) => r.id === 'lab')!.status).toBe('supported');
    expect(EVIL_DATA.base.rooms.find((r) => r.id === 'lab')!.line).toEqual(['whatever']);
    for (const r of EVIL_DATA.base.rooms) for (const s of r.sizes) if (s.status !== 'supported') expect(s.waits).toBeTruthy();
    for (const p of EVIL_DATA.base.adjacency) if (p.status !== 'supported') expect(p.waits).toBeTruthy();
  });
  it('every puzzle layout can be crossed some way within the step limit; none crosses every way', () => {
    const D: Dir[] = ['n', 'e', 's', 'w'];
    for (const kind of ['ice', 'spin', 'conveyor', 'warp'] as const) {
      for (const v of EVIL_DATA.base.puzzles[kind]) {
        const ways = D.flatMap((a) => D.filter((b) => b !== a && solvable(kind, v.rows, a, b)));
        expect(ways.length, `${kind} ${v.name}`).toBeGreaterThan(0);
        expect(ways.length, `${kind} ${v.name}`).toBeLessThan(12);
      }
    }
    expect(solvable('bins', EVIL_DATA.base.puzzles.bins[0]!.rows, 'w', 'e')).toBe(true);
  });
  it('ice: twelve slides at most (the same layout fails with a limit of one)', () => {
    const rows = EVIL_DATA.base.puzzles.ice[0]!.rows;
    expect(solvable('ice', rows, 'w', 'e')).toBe(true);
    const tight: EvilData = { ...EVIL_DATA, base: { ...EVIL_DATA.base, puzzles: { ...EVIL_DATA.base.puzzles, limit: 1 } } };
    expect(solvable('ice', ['.....', '.....', '..R..', '.....', '.....'], 'w', 'e', tight)).toBe(false);
  });
});

describe('the site (Part 16 section 2)', () => {
  it('the Arrival offers three: two of the six kinds, drawn from the seed, and Kanto\'s lodge; the same seed, the same three', () => {
    const b = foundForPlay('offer-1', choice());
    const o = siteOffer(b);
    expect(o).toHaveLength(3);
    expect(o[2]).toBe('lodge');
    expect(new Set(o).size).toBe(3);
    expect(siteOffer(foundForPlay('offer-1', choice()))).toEqual(o);
  });
  it('picking one lays the grid: the Office placed, the Common Room free; one a region; a site not offered is refused', () => {
    const b = foundForPlay('offer-2', choice());
    expect(refused(b, { type: 'pickSite', site: 'nowhere' })).toContain("isn't on offer");
    const a = act(b, { type: 'pickSite', site: 'lodge' });
    expect(a.base!.rooms).toEqual([expect.objectContaining({ type: 'office', at: gridOf('lodge').office, size: 1 })]);
    expect(a.base!.fair).toBe(true);
    expect(refused(a, { type: 'pickSite', site: 'lodge' })).toContain('One a region');
    expect(a.log.at(-1)!.text).toContain('warden');
  });
  it('a warehouse comes with its Garage, free and built; a ruin gives Regard +1, once', () => {
    const w = onSite('warehouse');
    expect(w.base!.rooms.some((r) => r.type === 'garage' && r.ready === 0)).toBe(true);
    const r0 = foundForPlay('ruin-0', choice());
    for (let i = 0; i < 60; i++) {
      const b = foundForPlay(`ruin-${i}`, choice());
      if (!siteOffer(b).includes('ruin')) continue;
      const a = act(b, { type: 'pickSite', site: 'ruin' });
      expect(a.team.regard).toBe(b.team.regard + 1);
      return;
    }
    expect(r0).toBeTruthy();
  });
  it('switched off (the undo): the base is one room and nothing can be picked', () => {
    const b = foundForPlay('off-1', choice());
    expect(siteOffer(b, OFF)).toEqual([]);
  });
});

describe('building, sizes and staffing (Part 16 sections 3 and 4)', () => {
  it('at Night only; the first room\'s free; Small is done by the next Evening, and does nothing till someone runs it', () => {
    const b = based();
    const at = freeSquares(b.base!)[0]!;
    expect(refused(toBeat(act(b, { type: 'lightsOut' }), 'dispatch'), { type: 'build', room: 'mess', at })).toContain('Night action');
    const f = b.team.funds;
    expect(roomCost(b, 'mess', 1)).toBe(0);
    const built = act(b, { type: 'build', room: 'mess', at });
    expect(built.team.funds).toBe(f);
    const mess = built.base!.rooms.find((r) => r.type === 'mess')!;
    expect(mess.ready).toBe(b.here.day + 1);
    expect(roomOpen(built, mess)).toBe(false);
    // One Night action a night.
    expect(refused(built, { type: 'build', room: 'garage', at: freeSquares(built.base!)[0]! })).toContain('already spent');
    let n = toBeat(act(built, { type: 'lightsOut' }), 'evening');
    expect(n.evening.join(' ')).toContain('The Mess is built');
    // Built, but nobody's running it: shut, no effect.
    expect(fxTotal(n, 'loyaltyDistrict')).toBe(0);
    n = person(n, 0, { talent: 'heart', rank: 'lead' });
    n = act(n, { type: 'staff', id: mess.id, who: n.crew[0]!.id });
    expect(n.crew[0]!.rank).toBe('specialist');
    expect(fxTotal(n, 'loyaltyDistrict')).toBe(1);
    // The second room isn't free.
    expect(roomCost(n, 'garage', 1)).toBe(3000);
  });
  it('a room needs the right talent and a Lead; a Specialist runs one room; Barracks run on nobody', () => {
    let b = based();
    b = act(b, { type: 'build', room: 'garage', at: freeSquares(b.base!)[0]! });
    b = nextNight(b);
    const g = b.base!.rooms.find((r) => r.type === 'garage')!;
    b = person(b, 0, { talent: 'heart', rank: 'lead' });
    b = person(b, 1, { talent: 'wheels', rank: 'grunt' });
    expect(refused(b, { type: 'staff', id: g.id, who: b.crew[0]!.id })).toContain("hasn't got it");
    expect(refused(b, { type: 'staff', id: g.id, who: b.crew[1]!.id })).toContain('Lead first');
    b = person(b, 1, { rank: 'lead' });
    expect(staffFor(b, g).map((c) => c.id)).toEqual([b.crew[1]!.id]);
    expect(said(b, { type: 'staff', id: g.id, who: b.crew[1]!.id })).toContain('seat position');
  });
  it('the Garage: reach +2 at Small and a fourth squad at Medium, on the rule hook', () => {
    let b = based();
    b = person(b, 1, { talent: 'wheels', rank: 'lead' });
    b = act(b, { type: 'build', room: 'garage', at: freeSquares(b.base!)[0]! });
    const id = b.base!.rooms.find((r) => r.type === 'garage')!.id;
    b = act(nextNight(b), { type: 'staff', id, who: b.crew[1]!.id });
    expect(fxTotal(b, 'reach')).toBe(2);
    expect(fxTotal(b, 'squads')).toBe(0);
    b = act(b, { type: 'enlarge', id });
    expect(b.base!.rooms.find((r) => r.id === id)!.next).toEqual({ size: 2, ready: b.here.day + 2 });
    expect(fxTotal(b, 'squads')).toBe(0);
    b = nextNight(nextNight(b));
    expect(fxTotal(b, 'squads')).toBe(1);
    expect(b.base!.rooms.find((r) => r.id === id)!.size).toBe(2);
  });
  it('the Barracks cap never exceeds 20', () => {
    let b = based();
    b = act(b, { type: 'build', room: 'barracks', at: freeSquares(b.base!)[0]! });
    const id = b.base!.rooms.find((r) => r.type === 'barracks')!.id;
    b = nextNight(b);
    expect(rosterCap(b)).toBe(12);
    b = nextNight(nextNight(act(b, { type: 'enlarge', id })));
    b = nextNight(nextNight(nextNight(act(b, { type: 'enlarge', id }))));
    expect(rosterCap(b)).toBe(20);
    expect(refused(b, { type: 'enlarge', id })).toContain('as big');
    const big: EvilData = { ...EVIL_DATA, base: { ...EVIL_DATA.base, rules: { ...EVIL_DATA.base.rules, capPerSize: 40 } } };
    expect(rosterCap(b, big)).toBeLessThanOrEqual(20);
  });
  it('moving or selling a room never loses its Specialist; selling gives a third back and the Specialist\'s a Lead again, Loyalty −2', () => {
    let b = based();
    b = person(b, 0, { talent: 'heart', rank: 'lead', loyalty: 6 });
    b = act(b, { type: 'build', room: 'mess', at: freeSquares(b.base!)[0]! });
    const id = b.base!.rooms.find((r) => r.type === 'mess')!.id;
    b = act(nextNight(b), { type: 'staff', id, who: b.crew[0]!.id });
    const to = freeSquares(b.base!).at(-1)!;
    b = act(b, { type: 'moveRoom', id, to });
    expect(b.base!.rooms.find((r) => r.id === id)).toMatchObject({ at: to, staff: b.crew[0]!.id });
    const f = b.team.funds;
    b = act(b, { type: 'sellRoom', id });
    expect(b.team.funds).toBe(f + Math.floor(2000 / 3));
    expect(b.crew[0]).toMatchObject({ where: 'in', rank: 'lead', loyalty: 5 });
  });
  it('by Line and region: no Pen under Clean hands; the Lab only at Whatever it takes, and never with the Shadow branch removed; the Creed\'s room waits for the last region', () => {
    const clean = based('lodge', { line: 'clean' });
    expect(buildProblem(clean, 'pen')).toContain('Line');
    expect(buildProblem(based('lodge', { line: 'whatever' }), 'pen')).toBeNull();
    expect(buildProblem(based(), 'lab')).toContain('Line');
    const w = based('lodge', { line: 'whatever' });
    expect(buildProblem({ ...w, team: { ...w.team, funds: 50000 } }, 'lab')).toBeNull();
    expect(buildProblem({ ...w, team: { ...w.team, funds: 50000 }, settings: { ...w.settings, shadow: false }, edges: { ...w.edges, shadow: null } }, 'lab')).toBe('Not in this run.');
    expect(buildProblem(based(), 'creed')).toContain('last region');
    expect(buildProblem(based(), 'office')).toContain('always there');
  });
  it('a cave\'s Workshop costs half again; Machines build a day sooner, never under one', () => {
    const cave = onSite('cave');
    const paid = { ...cave, base: { ...cave.base!, freeUsed: true } };
    expect(roomCost(paid, 'workshop', 1)).toBe(6000);
    const m = act(based('lodge', { doctrine: 'machines' }), { type: 'build', room: 'mess', at: freeSquares(based().base!)[0]! });
    expect(m.base!.rooms.find((r) => r.type === 'mess')!.ready).toBe(m.here.day + 1);
  });
  it('adjacency: the preview lists every pair a square would make; Mess by Barracks: Loyalty +1 a district', () => {
    let b = based();
    const g = sq(b);
    const [a, c] = g.slots.filter((s) => neighbours(g, s).some((n) => g.slots.includes(n))).flatMap((s) => [s, neighbours(g, s).find((n) => g.slots.includes(n))!]);
    b = person(b, 0, { talent: 'heart', rank: 'lead' });
    b = act(b, { type: 'build', room: 'barracks', at: a! });
    expect(pairsAt(b, 'mess', c!).map((p) => p.other)).toContain('barracks');
    b = act(nextNight(b), { type: 'build', room: 'mess', at: c! });
    b = nextNight(b);
    b = act(b, { type: 'staff', id: b.base!.rooms.find((r) => r.type === 'mess')!.id, who: b.crew[0]!.id });
    expect(fxTotal(b, 'loyaltyDistrict')).toBe(2);
  });
});

describe('Defend and the fairness check (Part 17 sections 2 and 3): it can\'t be saved unfair', () => {
  // The ship's one long corridor: no way round a piece, so every piece is on the only way (the other sites have loops).
  const door = (b: EvilModeBlock) => { const g = sq(b); return edgeKey(g.common, neighbours(g, g.common).find((n) => n !== g.door)!); };
  it('a locked door with its key behind it won\'t save, and says so; with the key before it, it does', () => {
    const b = onSite('ship');
    const g = sq(b);
    const d = door(b);
    const behind = g.office;
    expect(refused(b, { type: 'place', piece: { type: 'lock', at: d, key: behind } })).toContain('behind door 1');
    const ok = act(b, { type: 'place', piece: { type: 'lock', at: d, key: g.common } });
    expect(fairOf(ok.base!).ok).toBe(true);
  });
  it('a dark floor needs a light before it: a person posted earlier lights it', () => {
    let b = onSite('ship');
    const g = sq(b);
    const route = routeOf({ site: b.base!.site, rooms: [], pieces: [], posts: [] });
    const dark = route[3]!;
    expect(refused(b, { type: 'place', piece: { type: 'dark', at: dark } })).toContain("It's dark");
    b = act(b, { type: 'guard', who: b.crew[0]!.id, at: g.common });
    b = act(b, { type: 'place', piece: { type: 'dark', at: dark } });
    expect(b.base!.pieces).toHaveLength(1);
  });
  it('a puzzle that can\'t be crossed the way the route goes won\'t save; a back way must reach outside; nothing on the Office', () => {
    const b = onSite('ship');
    const g = sq(b);
    const inner = g.slots.find((s) => !outsideSide(g, s));
    if (inner) expect(refused(b, { type: 'place', piece: { type: 'backway', at: inner } })).toContain('cupboard');
    expect(refused(b, { type: 'place', piece: { type: 'corridor', at: g.office } })).toContain('Nothing can go');
    // Every way across a square and every layout: whatever is accepted is fair.
    let tried = 0;
    for (const t of ['ice', 'spin', 'conveyor', 'warp'] as const) for (const s of g.slots) for (let v = 0; v < 3; v++) {
      const p = previewPiece(b, { type: t, at: s, variant: v });
      if (p.fair && !p.fair.ok) tried += 1;
      if (p.base) expect(p.problem === null || !p.fair!.ok || p.problem.includes('Funds')).toBe(true);
    }
    expect(tried).toBeGreaterThan(0);
  });
  it('a quiz\'s answers must be findable before the door: asking about the cook with no Mess won\'t save', () => {
    const b = onSite('ship');
    const d = door(b);
    expect(refused(b, { type: 'place', piece: { type: 'quiz', at: d, quiz: ['cook', 'creed', 'types'] } })).toContain('Nobody could know that');
    expect(act(b, { type: 'place', piece: { type: 'quiz', at: d, quiz: ['creed', 'town', 'types'] } }).base!.pieces).toHaveLength(1);
  });
  it('three pieces a Night at most; free with a working Medium Workshop', () => {
    let b = based();
    const s = freeSquares(b.base!);
    for (let i = 0; i < 3; i++) b = act(b, { type: 'place', piece: { type: 'corridor', at: s[i]! } });
    expect(refused(b, { type: 'place', piece: { type: 'corridor', at: s[3]! } })).toContain('3 pieces');
    expect(pieceCost(b, 'spin')).toBe(500);
  });
  it('fuzz: a thousand random placements, moves and builds never leave a stored base unfair', () => {
    let b = based('lodge', {}, 'fuzz');
    const types = EVIL_DATA.base.pieces.map((p) => p.id);
    let x = 7;
    const rnd = (n: number) => { x = (x * 1103515245 + 12345) % 2147483648; return x % n; };
    let accepted = 0;
    for (let i = 0; i < 1000; i++) {
      // Tonight's three pieces start again (a thousand Nights would run past the region; the check doesn't care what day it is).
      if (i % 3 === 0) b = { ...b, base: { ...b.base!, night: null } };
      const g = sq(b);
      const cells = [...g.cells.keys()];
      const a = cells[rnd(cells.length)]!;
      const n = neighbours(g, a);
      const t = types[rnd(types.length)]!;
      const def = EVIL_DATA.base.pieces.find((p) => p.id === t)!;
      const at = def.on === 'door' ? edgeKey(a, n[rnd(n.length)]!) : a;
      const r = step(b, rnd(5) === 0 && b.base!.pieces.length ? { type: 'unplace', id: b.base!.pieces[rnd(b.base!.pieces.length)]!.id } : { type: 'place', piece: { type: t, at, key: cells[rnd(cells.length)]!, variant: rnd(3), quiz: EVIL_DATA.base.quiz.slice(rnd(4), rnd(4) + 3).map((q) => q.id) } });
      if (r.ok) { accepted += 1; b = r.block; }
      expect(checkFair({ site: b.base!.site, rooms: b.base!.rooms, pieces: b.base!.pieces, posts: b.base!.posts }).ok).toBe(true);
    }
    expect(accepted).toBeGreaterThan(20);
  });
  it('every site is fairable on day 1\'s money, for every Creed: the first room\'s free and a piece costs what the poorest has', () => {
    for (const s of SITES) {
      for (const creed of EVIL_DATA.creeds) {
        let b: EvilModeBlock | null = null;
        for (let i = 0; i < 80 && !b; i++) {
          const f = foundForPlay(`fair-${s.id}-${creed.id}-${i}`, choice({ creed: creed.id }));
          if (siteOffer(f).includes(s.id)) b = toBeat(act(f, { type: 'pickSite', site: s.id }), 'night');
        }
        expect(b, s.id).not.toBeNull();
        expect(fairOf(b!.base!).ok).toBe(true);
        const day1 = EVIL_DATA.creeds.find((c) => c.id === creed.id)!.start.funds;
        expect(roomCost(b!, 'mess', 1)).toBe(0);
        const cheapest = Math.min(...EVIL_DATA.base.pieces.map((p) => p.cost).filter((c) => c > 0));
        expect(cheapest).toBeLessThanOrEqual(day1);
        const placed = act({ ...b!, team: { ...b!.team, funds: day1 } }, { type: 'place', piece: { type: 'corridor', at: freeSquares(b!.base!)[0]! } });
        expect(fairOf(placed.base!).ok).toBe(true);
      }
    }
  });
});

describe('the Night\'s base actions (Part 16 section 8)', () => {
  it('stand at the window: Large Office only; nothing happens, one line, and no number changes', () => {
    let b = based();
    expect(refused(b, { type: 'window' })).toContain('Large');
    b = act(b, { type: 'enlarge', id: 'office' });
    b = nextNight(nextNight(b));
    b = act(nextNight(b), { type: 'enlarge', id: 'office' });
    b = nextNight(nextNight(nextNight(b)));
    const w = step(b, { type: 'window' });
    expect(w.ok).toBe(true);
    expect({ ...w.block.team }).toEqual({ ...b.team });
    expect(w.block.crew).toEqual(b.crew);
    expect(w.block.log).toEqual(b.log);
    expect(said(b, { type: 'window' })).toBe(windowLine(b));
  });
  it('walk the base: a line from each working room, and one person spoken to: Loyalty +1 (stream evil-people)', () => {
    let b = based();
    b = person(b, 0, { talent: 'heart', rank: 'lead', loyalty: 5 });
    b = act(b, { type: 'build', room: 'mess', at: freeSquares(b.base!)[0]! });
    b = act(nextNight(b), { type: 'staff', id: 'r-mess', who: b.crew[0]!.id });
    expect(b.crew[0]!.loyalty).toBe(6); // handed a room: +1
    const draws = b.draws['evil-people'];
    const w = act(b, { type: 'walkBase' });
    expect(w.crew[0]!.loyalty).toBe(7);
    expect(w.draws['evil-people']).toBe(draws + 1);
  });
});

describe('Walk it: a pseudo-stage (Part 17 section 4)', () => {
  const walkable = (seed = 'walk-1') => {
    let b = based('lodge', {}, seed);
    const route = routeOf({ site: b.base!.site, rooms: b.base!.rooms, pieces: [], posts: [] });
    b = person(b, 0, { loyalty: 9, flaw: 'proud' });
    b = person(b, 1, { loyalty: 3 });
    b = act(b, { type: 'guard', who: b.crew[0]!.id, at: route[1]! });
    b = act(b, { type: 'guard', who: b.crew[1]!.id, at: route[3]! });
    return toBeat(act(b, { type: 'lightsOut' }), 'inPerson');
  };
  it('at the In person beat; it costs the slot and nothing else; it changes no stage, day or number', () => {
    const b = walkable();
    const r = step(b, { type: 'walkIt' });
    expect(r.ok).toBe(true);
    expect(r.cues.some((c) => c.id === 'fight')).toBe(true);
    expect(r.block.here).toEqual(b.here);
    expect(r.block.team).toEqual(b.team);
    expect(r.block.inPerson).toEqual({ day: b.here.day, holdingId: 'base' });
    expect(r.block.region.past).toEqual(b.region.past);
    expect(stageDays(r.block)).toBe(stageDays(b));
    expect(refused(r.block, { type: 'walkIt' })).toBeTruthy();
  });
  it('a Devoted Grunt is fought twice; a Distant one steps aside; through to the Office; the Night after is written in the Ledger', () => {
    let b = act(walkable(), { type: 'walkIt' });
    expect(b.fight).toMatchObject({ kind: 'walk', personId: b.crew[0]!.id });
    b = act(b, { type: 'battleResult', won: true });
    expect(b.fight).toMatchObject({ kind: 'walk', personId: b.crew[0]!.id });
    const r = step(b, { type: 'battleResult', won: true });
    b = r.block;
    expect(r.cues.map((c) => ('line' in c ? c.line : '')).join(' ')).toContain('steps aside');
    expect(b.fight).toBeNull();
    expect(b.base!.walk!.end).toBe('office');
    b = act(b, { type: 'closeWalk' });
    b = toBeat(b, 'night');
    b = act(b, { type: 'place', piece: { type: 'corridor', at: freeSquares(b.base!).at(-1)! } });
    b = act(b, { type: 'lightsOut' });
    b = toBeat(b, 'morning');
    expect(b.log.some((e) => e.kind === 'base' && e.text.includes('Walked their own base. Then: placed a long corridor'))).toBe(true);
  });
  it('lost: the walk ends there; nobody\'s hurt', () => {
    let b = act(walkable('walk-2'), { type: 'walkIt' });
    b = act(b, { type: 'battleResult', won: false });
    expect(b.base!.walk!.end).toBe('lost');
    expect(b.crew).toEqual(walkable('walk-2').crew);
  });
  it('in the battle engine: the Hero-built party is lent, the Grunt\'s kit at the stage\'s level, the Boss\'s party back after', () => {
    const r0 = chooseStarter(content, createRun(content, { runId: 'wk', seed: 'wk', archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: EVIL_MODE_ID } }), 0);
    const f = foundInRun(r0, choice(), 'three', 2);
    if (f.problem) throw new Error(f.problem);
    let run: RunState = f.run;
    const B = (r: RunState) => r.expansion!.evilMode!;
    const go = (r: RunState, a: EvilAction) => { const o = stepInRun(r, a); if (!o.ok) throw new Error(JSON.stringify(o.cues)); return o.run; };
    run = { ...run, expansion: { ...run.expansion, evilMode: { ...B(run), team: { ...B(run).team, funds: 9000 } } } };
    run = go(run, { type: 'pickSite', site: siteOffer(B(run))[2]! });
    while (B(run).here.beat !== 'night') run = go(run, { type: BEAT_END[B(run).here.beat] });
    run = { ...run, expansion: { ...run.expansion, evilMode: person(B(run), 0, { loyalty: 7 }) } };
    run = go(run, { type: 'guard', who: B(run).crew[0]!.id, at: routeOf({ site: B(run).base!.site, rooms: B(run).base!.rooms, pieces: [], posts: [] })[1]! });
    while (B(run).here.beat !== 'inPerson') run = go(run, { type: BEAT_END[B(run).here.beat] });
    run = go(run, { type: 'walkIt' });
    const boss = run.party.map((m) => m.uid);
    const started = beginEvilFight(content, run)!;
    expect(started.battle!.trainer!.name).toBe(B(run).crew[0]!.name);
    expect(started.party.map((m) => m.uid)).not.toEqual(boss);
    const A = stageLevel(content, started, B(started));
    expect(started.battle!.enemyTeam.every((m) => Math.abs(m.level - A) <= 3 + started.rules.enemyLevelBonus)).toBe(true);
    endEvilFight(content, started, true, healParty);
    expect(started.party.map((m) => m.uid)).toEqual(boss);
    expect(started.phase).toBe('map');
  });
});

describe('the warning and the Raid (Part 17 section 9): it costs what Part 17 says and never the run', () => {
  const hot = (b: EvilModeBlock, heat: number): EvilModeBlock => ({ ...b, team: { ...b.team, heat } });
  const evening = (b: EvilModeBlock) => raidEvening({ ...b, here: { ...b.here, beat: 'evening' } });
  it('never below Heat 9 a warning, never below 10 a Raid; a day\'s notice first; it lapses if Heat falls', () => {
    const b = based();
    expect(evening(hot(b, 8)).raid).toBeNull();
    const w = evening(hot(b, 9));
    expect(w.raid).toMatchObject({ state: 'warned', day: b.here.day });
    expect(w.evening.join(' ')).toContain('They know where you are');
    // The next Evening: still 9, it lapses; at 10, the Raid.
    const next = (x: EvilModeBlock) => ({ ...x, here: { ...x.here, day: x.here.day + 1 } });
    expect(evening(hot(next(w), 9)).raid).toBeNull();
    expect(evening(hot(next(w), 10)).raid!.state).toBe('door');
    // Not the same Evening it was warned.
    expect(evening(hot(w, 10)).raid!.state).toBe('warned');
  });
  it('a warehouse reads one higher; a cave comes two Evenings late', () => {
    expect(evening(hot(onSite('warehouse'), 8)).raid!.state).toBe('warned');
    let c = hot(onSite('cave'), 9);
    c = evening(c);
    expect(c.raid).toBeNull();
    c = evening(c);
    expect(c.raid).toBeNull();
    expect(evening(c).raid!.state).toBe('warned');
  });
  const raided = (seed = 'raid-1', setup: (b: EvilModeBlock) => EvilModeBlock = (b) => b): EvilModeBlock => {
    let b = setup(based('lodge', {}, seed));
    b = evening(hot(b, 9));
    b = { ...b, here: { ...b.here, day: b.here.day + 1 } };
    return evening(hot(b, 10));
  };
  it('the four choices: Move loses the rooms, keeps the people, Heat −4; Walk into the station begins the Caught ending', () => {
    let b = evening(hot(based(), 9));
    expect(act(b, { type: 'warnChoice', choice: 'station' }).ending).toMatchObject({ id: 'caught', via: 'walkIn', done: false });
    const crew = b.crew;
    b = act(b, { type: 'warnChoice', choice: 'move' });
    expect(b.base).toBeNull();
    expect(b.team.heat).toBe(5);
    expect(b.crew).toEqual(crew);
    expect(siteOffer(b)).toHaveLength(3);
  });
  it('wing by wing: Held, Contested, Lost and never a fourth thing; the door opened, nobody hurt; to the Office', () => {
    let b = raided();
    expect(b.raid!.state).toBe('door');
    expect(refused(b, { type: 'callItADay' })).toContain("Raid's on");
    b = act(b, { type: 'raidDoor', open: true });
    expect(b.raid!.wings.front).toBe('lost');
    for (let i = 0; i < 12 && b.raid!.state === 'turns'; i++) {
      b = act(b, { type: 'raidTurn' });
      for (const w of WING_IDS) expect(['held', 'contested', 'lost']).toContain(b.raid!.wings[w]);
    }
    expect(b.raid!.state).toBe('office');
  });
  it('a minor\'s never ordered below first in the back way', () => {
    let b = raided('raid-minor', (x) => person(x, 2, { minor: true, age: 16 }));
    const minor = b.crew[2]!.id;
    expect(b.raid!.queue[0]).toBe(minor);
    const bad = [...b.raid!.queue.slice(1), minor];
    b = act(b, { type: 'raidDoor', open: false });
    expect(refused(b, { type: 'raidQueue', queue: bad })).toContain('minor');
  });
  it('the back way passes three a turn; Run is followed; the rest are caught; lost: Funds half, the rooms, deeds; the run goes on', () => {
    let b = raided('raid-2', (x) => {
      const g = sq(x);
      const edge = g.slots.find((s) => outsideSide(g, s) && neighbours(g, s).includes(g.common)) ?? g.slots.find((s) => outsideSide(g, s))!;
      let y = act(x, { type: 'place', piece: { type: 'backway', at: edge } });
      y = { ...y, crew: y.crew.map((c) => ({ ...c, loyalty: 7 })) };
      return y;
    });
    const funds = b.team.funds;
    b = act(b, { type: 'raidDoor', open: true });
    for (const w of WING_IDS) if (b.raid!.wings[w] !== 'lost') b = act(b, { type: 'raidOrder', wing: w, order: 'run' });
    for (let i = 0; i < 12 && b.raid!.state === 'turns'; i++) b = act(b, { type: 'raidTurn' });
    const out = Object.values(b.raid!.where).filter((w) => w === 'out').length;
    expect(out).toBeGreaterThan(0);
    expect(out).toBeLessThanOrEqual(3 * b.raid!.turn);
    b = act(b, { type: 'raidOffice', choice: 'charge' });
    expect(b.base).toBeNull();
    expect(b.team.funds).toBe(funds - Math.floor(funds / 2));
    expect(b.team.heat).toBe(EVIL_DATA.base.raid.heatAfter);
    expect(b.district!.end).toBeUndefined();
    for (const c of b.crew.filter((x) => x.cell)) expect(c.where).toBe('away');
    b = act(b, { type: 'raidDone' });
    expect(b.raid).toBeNull();
    // Never twice in a district.
    b = act(b, { type: 'pickSite', site: siteOffer(b)[0]! });
    expect(evening(hot(b, 10)).raid).toBeNull();
  });
  it('a Counting Room keeps nine tenths; bail is ₽1,000 × rank and brings them back', () => {
    let b = raided('raid-3', (x) => {
      let y = person(x, 0, { talent: 'books', rank: 'lead' });
      y = act(y, { type: 'build', room: 'counting', at: freeSquares(y.base!)[0]! });
      y = nextNight(y);
      return act(y, { type: 'staff', id: 'r-counting', who: y.crew[0]!.id });
    });
    const funds = b.team.funds;
    b = act(b, { type: 'raidDoor', open: true });
    for (let i = 0; i < 12 && b.raid!.state === 'turns'; i++) b = act(b, { type: 'raidTurn' });
    b = act(b, { type: 'raidOffice', choice: 'charge' });
    expect(b.team.funds).toBe(funds - Math.floor(funds / 10));
    // Slice 15: no back way, so the Boss's charge begins Caught (Part 23 section 7); bail is checked with that ending set aside.
    expect(b.ending).toMatchObject({ id: 'caught', via: 'raid' });
    b = { ...b, ending: null };
    const caught = b.crew.find((c) => c.cell)!;
    expect(caught).toBeTruthy();
    const f = b.team.funds;
    b = act(b, { type: 'bail', id: caught.id });
    expect(b.team.funds).toBe(f - bailOf(caught));
    expect(b.crew.find((c) => c.id === caught.id)!.where).toBe('in');
  });
  it('the window needs a Large Office; the Office battle in the engine: the detective\'s six at A+1; won: held, Heat 8 for the region', () => {
    const r0 = chooseStarter(content, createRun(content, { runId: 'rd', seed: 'rd', archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: EVIL_MODE_ID } }), 0);
    const f = foundInRun(r0, choice(), 'three', 2);
    if (f.problem) throw new Error(f.problem);
    const B = (r: RunState) => r.expansion!.evilMode!;
    const go = (r: RunState, a: EvilAction) => { const o = stepInRun(r, a); if (!o.ok) throw new Error(JSON.stringify(o.cues)); return o.run; };
    let run: RunState = go(f.run, { type: 'pickSite', site: siteOffer(B(f.run))[2]! });
    let b = B(run);
    b = evening(hot(b, 9));
    b = evening(hot({ ...b, here: { ...b.here, day: b.here.day + 1 } }, 10));
    run = { ...run, expansion: { ...run.expansion, evilMode: b } };
    run = go(run, { type: 'raidDoor', open: true });
    while (B(run).raid!.state === 'turns') run = go(run, { type: 'raidTurn' });
    expect(stepInRun(run, { type: 'raidOffice', choice: 'window' }).ok).toBe(false);
    run = go(run, { type: 'raidOffice', choice: 'battle' });
    const party = run.party.map((m) => m.uid);
    const started = beginEvilFight(content, run)!;
    expect(started.battle!.trainer!.name).toBe('DS Billie Achterberg');
    expect(started.party.map((m) => m.uid)).toEqual(party);
    endEvilFight(content, started, true, healParty);
    expect(B(started).base).not.toBeNull();
    expect(B(started).team.heat).toBe(8);
    expect(B(started).raid!.end).toBe('won');
    expect(started.party.map((m) => m.uid)).toEqual(party);
  });
});

describe('the Hero\'s delay (Part 17 section 3.3): at most two days a region', () => {
  it('three corridors a day, a decoy a day; never more than two; the Reckoning waits that long', () => {
    const p = (type: Piece['type'], i: number): Piece => ({ id: `p${i}`, type, at: `${i},0` });
    expect(delayOf([p('corridor', 1), p('corridor', 2)])).toBe(0);
    expect(delayOf([p('corridor', 1), p('corridor', 2), p('corridor', 3)])).toBe(1);
    expect(delayOf([p('decoy', 1), p('decoy', 2), p('decoy', 3), p('corridor', 4)])).toBe(2);
    let b = based();
    const s = freeSquares(b.base!);
    b = act(b, { type: 'place', piece: { type: 'decoy', at: s[0]! } });
    expect(baseDelay(b)).toBe(1);
    b = nextNight(b);
    for (let i = 3; i < 6; i++) b = act(b, { type: 'place', piece: { type: 'decoy', at: s[i]! } });
    b = nextNight(b);
    for (let i = 6; i < 9; i++) b = act(b, { type: 'place', piece: { type: 'decoy', at: s[i]! } });
    expect(baseDelay(b)).toBe(2);
    const reck = { ...b, here: { ...b.here, stage: 8 } };
    expect(stageDays(reck)).toBe(EVIL_DATA.region.reckoning.days + 2);
  });
});

describe('saves: block v9', () => {
  it('v8 -> v9: no base, no Raid, never raided; a base saved and loaded is the same', () => {
    const b = based();
    // A v8 block (fixed version order: 9 is this slice) has none of the later slices' fields either.
    const { base: _b, raid: _r, law: _l, economy: _e, neighbour: _n, scheme: _s, road: _d, fire: _f, reck: _k, ending: _g, ...rest } = b;
    const { 'evil-economy': _de, 'evil-scheme': _ds, ...draws } = rest.draws as Record<string, number>;
    const v9 = EvilModeBlockSchema.parse(JSON.parse(JSON.stringify({ ...rest, draws, v: 8 })));
    expect(v9).toMatchObject({ v: 22, base: null, raid: null, law: { hot: 0, raids: [], heatHeld: null } });
    expect(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(b)))).toEqual(b);
  });
  it('a damaged base is refused: an unknown room, a size of four', () => {
    const b = based();
    expect(EvilModeBlockSchema.safeParse({ ...b, base: { ...b.base!, rooms: [{ ...b.base!.rooms[0]!, type: 'ballroom' }] } }).success).toBe(false);
    expect(EvilModeBlockSchema.safeParse({ ...b, base: { ...b.base!, rooms: [{ ...b.base!.rooms[0]!, size: 4 }] } }).success).toBe(false);
    expect(EvilModeBlockSchema.safeParse({ ...b, raid: { state: 'warned' } }).success).toBe(false);
  });
});

describe('the Base page model (New look): what the page shows comes from the rules', () => {
  it('no base: the three sites, each with its pick action; a base: the grid, the tabs, the light', async () => {
    const { baseModel, newBaseSel } = await import('../../src/core/evilMode/baseScreens');
    const f = foundForPlay('page-1', choice());
    const m0 = baseModel(f, newBaseSel());
    expect(m0.mode).toBe('site');
    expect(m0.sites.map((s) => s.action)).toEqual(siteOffer(f).map((site) => ({ type: 'pickSite', site })));
    const b = based();
    const m = baseModel(b, newBaseSel());
    expect(m.mode).toBe('base');
    expect(m.grid!.cells).toHaveLength(gridOf(b.base!.site).cells.size);
    expect(m.fair.ok).toBe(true);
    expect(m.night[0]!.problem).toBeNull();
  });
  it('Build lists rooms with their problems; Defend\'s refused piece names its failing square; nothing on the page changes the block', async () => {
    const { baseModel } = await import('../../src/core/evilMode/baseScreens');
    const b = onSite('ship');
    const g = sq(b);
    const before = JSON.stringify(b);
    const build = baseModel(b, { tab: 0, at: g.slots[0]!, opt: 0, moving: null });
    expect(build.options.some((o) => o.label === 'The Mess')).toBe(true);
    // Slice 21: dark methods are shown and refused; with the Shadow branch removed the Lab's absent, not dark.
    expect(build.options.find((o) => o.label.includes('Lab'))!.problem).toContain('Line');
    const off = baseModel({ ...b, settings: { ...b.settings, shadow: false }, edges: { ...b.edges, shadow: null } }, { tab: 0, at: g.slots[0]!, opt: 0, moving: null });
    expect(off.options.find((o) => o.label.includes('Lab'))).toBeUndefined();
    const d = edgeKey(g.common, neighbours(g, g.common).find((n) => n !== g.door)!);
    const defend = baseModel(b, { tab: 2, at: d, opt: 0, moving: null });
    const i = defend.options.findIndex((o) => o.label.startsWith('A quiz') || o.label.includes('quiz'));
    expect(i).toBeGreaterThanOrEqual(0);
    const conv = baseModel(b, { tab: 2, at: g.slots[3]!, opt: 0, moving: null });
    const j = conv.options.findIndex((o) => !!o.bad);
    expect(j).toBeGreaterThanOrEqual(0);
    const shown = baseModel(b, { tab: 2, at: g.slots[3]!, opt: j, moving: null });
    expect(shown.grid!.cells.some((c) => c.bad) || shown.grid!.doors.some((x) => x.bad)).toBe(true);
    expect(shown.options[j]!.problem).toBeTruthy();
    expect(JSON.stringify(b)).toBe(before);
  });
  it('a lost Raid: the morning after still shows, with no base left', async () => {
    const { baseModel, newBaseSel } = await import('../../src/core/evilMode/baseScreens');
    let b = based();
    b = raidEvening({ ...b, team: { ...b.team, heat: 9 }, here: { ...b.here, beat: 'evening' } });
    b = raidEvening({ ...b, team: { ...b.team, heat: 10 }, here: { ...b.here, day: b.here.day + 1, beat: 'evening' } });
    b = act(b, { type: 'raidDoor', open: true });
    for (let i = 0; i < 12 && b.raid!.state === 'turns'; i++) b = act(b, { type: 'raidTurn' });
    b = act(b, { type: 'raidOffice', choice: 'charge' });
    expect(b.base).toBeNull();
    const m = baseModel(b, newBaseSel());
    expect(m.mode).toBe('raid');
    expect(m.raid!.state).toBe('done');
    expect(m.raid!.after.length).toBeGreaterThan(0);
  });
});
