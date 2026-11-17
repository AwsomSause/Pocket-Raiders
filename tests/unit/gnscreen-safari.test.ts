// Greenneedle gn.18 Safari Land as a walkable zone (doc GREENNEEDLE_REWORKED_PLACED_4.md): the grid and its steps, the photograph kept
// as a picture for the gatehouse wall, the Kanto scenes inside the park, and the doors beyond the far gate.
import { describe, expect, it } from 'vitest';
import { RunStateSchema, type RunState } from '../../src/core/state';
import { content } from './helpers';
import { chooseEvent, eventView } from '../../src/core/events';
import { PARK_H, PARK_STAMPEDE, PARK_TEETH, PARK_W, SAFARI_ID, parkMonAt, parkRows, parkSolid, parkState, parkTile, type SafariState } from '../../src/core/greenneedle/safari';
import { gameModule } from '../../src/core/minigame/games';
import { beginMinigame, continuePark, leaveMinigame, minigameAct, parkDoorSide, parkEventSide, parkWaiting } from '../../src/core/minigame/flow';
import { hashSeed, Rng } from '../../src/core/rng';
import { choose, flagOf, gnRun, open, setFlag, win } from './helpers/gnPlay';

const mod = gameModule(SAFARI_ID);
const fresh = (seed = 'park'): SafariState => mod.start(content, { steps: 500, balls: 30 }, new Rng(hashSeed(seed)).state) as unknown as SafariState;
const act = (s: SafariState, ...ids: string[]): SafariState => {
  for (const id of ids) mod.act(content, s as never, id);
  return s;
};
const cells = (s: SafariState) => mod.view(content, s as never).cells;
const st = (run: RunState) => run.minigame!.state as SafariState;
const here = (run: RunState) => run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
const reload = (run: RunState): RunState => RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
/** The gate paid and the visit started. */
const visit = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
  const run = gnRun(seed);
  run.money = 5000;
  setup(run);
  open(run, 'gn-18-gate');
  const paid = choose(run, 'gn-18-gate', run.story.flags['ev:safari-fee-up'] ? 'Pay ₽800 and go in.' : 'Pay ₽500 and go in.').run;
  const stop = here(paid).sides.find((x) => x.kind === 'minigame' && x.minigameId === SAFARI_ID)!;
  return beginMinigame(content, paid, stop.id, 0);
};
/** Puts you on a tile in an area (the test's hand, not a move). */
const put = (run: RunState, area: number, x: number, y: number): RunState => {
  Object.assign(st(run), { area, x, y, mode: 'walk', mon: null, spot: null, familySeen: true, migrationSeen: true, herd: 'none' });
  return run;
};

describe('gn.18 Safari Land: a walkable zone with its own steps', () => {
  it('four areas of 15 by 7 tiles, fenced by trees; you start by the gatehouse door', () => {
    const s = fresh();
    expect([s.x, s.y, s.facing, s.area]).toEqual([1, 3, 'right', 0]);
    for (let area = 0; area < 4; area++) {
      s.area = area;
      const rows = parkRows(s);
      expect(rows).toHaveLength(PARK_H);
      for (const row of rows) expect(row).toHaveLength(PARK_W);
      expect(rows[0]).toBe('T'.repeat(PARK_W));
      expect(rows[PARK_H - 1]).toBe('T'.repeat(PARK_W));
      expect(rows.join('')).toMatch(/,/);
    }
    // Off the grid is solid.
    expect(parkSolid(s, -1, 3)).toBe(true);
    expect(parkSolid(s, 3, 99)).toBe(true);
  });

  it('a tile walked is one step; walking into a tree, a rock or the water turns you and costs nothing', () => {
    const s = fresh();
    act(s, 'go:right');
    expect([s.x, s.y, s.steps]).toEqual([2, 3, 499]);
    Object.assign(s, { x: 1, y: 1 });
    act(s, 'go:up');
    expect([s.x, s.y, s.steps, s.facing]).toEqual([1, 1, 499, 'up']);
    expect(s.msg).toMatch(/trees/);
    Object.assign(s, { area: 1, x: 4, y: 3 });
    act(s, 'go:right');
    expect([s.x, s.steps]).toEqual([4, 499]);
    expect(s.msg).toMatch(/Water/);
    // A run is two tiles, and stops short at something solid.
    Object.assign(s, { area: 1, x: 3, y: 3 });
    act(s, 'run:right');
    expect([s.x, s.steps]).toEqual([4, 498]);
    // An id that is not an action changes nothing.
    const before = JSON.stringify(s);
    act(s, 'go:sideways', 'fly', 'door:gn-19-far');
    expect(JSON.stringify(s)).toBe(before);
  });

  it('Pokémon only come out of tall grass; the paths between the areas carry you across and back', () => {
    const s = fresh();
    s.familySeen = true;
    // The middle row of the plain: short grass until the tall patch at x 7.
    for (let i = 0; i < 5; i++) act(s, 'go:right');
    expect([s.x, s.mode, s.mon]).toEqual([6, 'walk', null]);
    const quiet = fresh('quiet-path');
    quiet.familySeen = true;
    Object.assign(quiet, { area: 2, x: 1, y: 3 });
    // The Long Grass's middle path is all short grass: forty tiles, nothing.
    for (let i = 0; i < 12; i++) act(quiet, 'go:right');
    expect([quiet.x, quiet.mode]).toEqual([13, 'walk']);
    act(quiet, 'go:right');
    expect([quiet.area, quiet.x, quiet.y, quiet.facing]).toEqual([3, 1, 3, 'right']);
    expect(quiet.mode).toBe('migration');
    act(quiet, 'leave', 'go:left');
    expect([quiet.area, quiet.x, quiet.facing]).toEqual([2, 13, 'left']);
    // In tall grass something does come out, sooner or later.
    const grass = fresh('grass');
    grass.familySeen = true;
    Object.assign(grass, { area: 2, x: 1, y: 1 });
    for (let i = 0; i < 200 && grass.mode !== 'meet'; i++) act(grass, i % 2 ? 'go:left' : 'go:right');
    expect(grass.mode).toBe('meet');
    expect(parkTile(grass, grass.x, grass.y)).toBe(',');
    const at = parkMonAt(grass)!;
    expect(parkSolid(grass, at.x, at.y)).toBe(false);
  });

  it('Quiet: +1 for every eight tiles walked, -1 for a run, +1 for bait left behind, -2 within one tile of the family', () => {
    const s = fresh();
    s.familySeen = true;
    for (let i = 0; i < 4; i++) act(s, 'go:right', 'go:left');
    expect([s.walked, s.quiet]).toEqual([8, 1]);
    act(s, 'run:right');
    expect(s.quiet).toBe(0);
    s.quiet = 5;
    s.mode = 'meet';
    s.mon = { species: 'tauros', catchP: 0.3, fleeP: -1, behaviour: 'grazing', noticed: true, star: false, hungry: null, fed: false, dragonair: false, dist: 2 };
    act(s, 'bait', 'leave');
    expect([s.quiet, s.mode]).toEqual([6, 'walk']);
    // The family: stepping closer puts you beside them.
    const f = fresh('family');
    f.quiet = 5;
    for (let i = 0; i < 5; i++) act(f, 'go:right', 'go:left');
    expect(f.mode).toBe('family');
    act(f, 'closer');
    // Ten tiles walked first (+1), then the two it costs.
    expect(f.quiet).toBe(4);
    expect(Math.abs(4 - f.x)).toBe(1);
    expect([f.mode, f.fam]).toEqual(['walk', null]);
  });

  it('photography scores on distance, behaviour and whether it noticed; stepping closer costs a step', () => {
    const shot = (dist: number, noticed: boolean): number => {
      const s = fresh();
      s.camera = true;
      s.mode = 'meet';
      s.mon = { species: 'ponyta', catchP: 0.3, fleeP: -1, behaviour: 'playing', noticed, star: false, hungry: null, fed: false, dragonair: false, dist };
      act(s, 'photo');
      expect(s.shot).toMatchObject({ species: 'ponyta', kind: 'playing' });
      return s.photoBest;
    };
    expect([shot(3, true), shot(2, true), shot(1, true), shot(1, false)]).toEqual([2, 3, 4, 6]);
    const s = fresh();
    s.mode = 'meet';
    s.mon = { species: 'ponyta', catchP: 0.3, fleeP: -1, behaviour: 'playing', noticed: true, star: false, hungry: null, fed: false, dragonair: false, dist: 2 };
    expect(cells(s).some((c) => c.id === 'closer')).toBe(true);
    act(s, 'closer');
    expect([s.mon!.dist, s.steps]).toEqual([1, 499]);
    expect(cells(s).some((c) => c.id === 'closer')).toBe(false);
    act(s, 'closer');
    expect(s.mon!.dist).toBe(1);
  });

  it('the best photograph hangs in the gatehouse on the next visit, with a brass plate', () => {
    let run = visit('wall-a');
    Object.assign(st(run), { photo: { species: 'kangaskhan', kind: 'family', score: 10 }, photoBest: 10 });
    expect(st(run).wall).toBeNull();
    run = minigameAct(content, run, 'exit');
    expect(run.story.flags['ev:safari-photo-wall']).toBe('kangaskhan|family|10');
    run = leaveMinigame(run);
    // A second visit (the stop is put back by hand: the gate's once-a-region rule is tested elsewhere).
    const side = here(run).sides.find((x) => x.minigameId === SAFARI_ID)!;
    side.used = false;
    run.minigames.attempts[side.id] = 0;
    run = reload(beginMinigame(content, run, side.id, 0));
    expect(st(run).wall).toEqual({ species: 'kangaskhan', kind: 'family', score: 10 });
    // The wall is the tile beside the door.
    Object.assign(st(run), { x: 2, y: 1 });
    run = minigameAct(content, run, 'go:left');
    expect(st(run).msg).toMatch(/your photograph.*brass plate.*Kangaskhan, with its young out of the pouch\. 10 points/);
    // A worse photograph later does not replace it.
    Object.assign(st(run), { photo: { species: 'doduo', kind: 'grazing', score: 2 }, photoBest: 2 });
    run = minigameAct(content, run, 'exit');
    expect(run.story.flags['ev:safari-photo-wall']).toBe('kangaskhan|family|10');
  });

  it('the far gate: the warden\'s line, the Deep Savanna and the Lush Jungle; a door ends the visit and opens next', () => {
    let run = put(visit('far-a'), 3, 13, 3);
    expect(st(run).doors).toEqual(['gn-19-far', 'gn-20-far']);
    run = minigameAct(content, run, 'go:right');
    expect(st(run)).toMatchObject({ mode: 'spot', spot: 'far', x: 14 });
    const view = mod.view(content, st(run) as never);
    expect(view.prompt).toMatch(/Beyond here, it isn't a park\. Nobody's counting your steps\. Nobody's coming to fetch you, either\./);
    expect(view.cells.map((c) => c.label)).toEqual(['The Deep Savanna', 'The Lush Jungle', 'Turn back']);
    // Turning back keeps the visit going.
    const back = minigameAct(content, run, 'stay');
    expect([back.minigame!.outcome, st(back).mode]).toEqual([null, 'walk']);
    // Save and reload at the gate, then go through.
    run = minigameAct(content, reload(run), 'door:gn-19-far');
    expect(run.minigame!.outcome).not.toBeNull();
    expect(flagOf(run, 'safari-far-gate')).toBe(run.regionIndex + 1);
    const door = parkDoorSide(run)!;
    expect(here(run).sides.find((x) => x.id === door)).toMatchObject({ eventId: 'gn-19-far', used: false });
    // The other door stays open on the node.
    expect(here(run).sides.some((x) => x.eventId === 'gn-20-far' && !x.used)).toBe(true);
    run = leaveMinigame(run);
    expect(eventView(content, run, door).event.name).toBe('The Deep Savanna');
    const inside = chooseEvent(content, run, door, 0).run;
    expect(flagOf(inside, 'savanna-entered')).toBe(1);
  });

  it('a door already taken this run is not offered again; with neither left the gate only turns you back', () => {
    const one = put(visit('far-b', (r) => setFlag(r, 'savanna-entered')), 3, 13, 3);
    expect(st(one).doors).toEqual(['gn-20-far']);
    const none = minigameAct(content, put(visit('far-c', (r) => { setFlag(r, 'savanna-entered'); setFlag(r, 'jungle-entered'); }), 3, 13, 3), 'go:right');
    expect(cells(st(none)).map((c) => c.id)).toEqual(['stay']);
    // A door that is not open cannot be forced.
    const forced = minigameAct(content, none, 'door:gn-19-far');
    expect([forced.minigame!.outcome, st(forced).door]).toEqual([null, null]);
  });

  it('outside Kanto there is no Stampede and no Gold Teeth in the park', () => {
    const run = visit('not-kanto', (r) => { r.regionOrder = r.regionOrder.map((id, i) => (i === r.regionIndex ? 'johto' : id === 'johto' ? 'kanto' : id)); });
    const s = st(run);
    expect(s.kanto).toEqual([]);
    expect(parkTile(s, 10, 3, 0)).toBe(',');
    expect(parkTile(s, 12, 1, 3)).toBe('.');
  });

  describe('in Kanto the Tauros Stampede and the Warden\'s Gold Teeth happen inside the park', () => {
    const kanto = (seed: string): RunState => {
      const run = visit(seed, (r) => { r.regionOrder = r.regionOrder.map((id, i) => (i === r.regionIndex ? 'kanto' : id === 'kanto' ? r.regionOrder[r.regionIndex]! : id)); });
      expect(st(run).kanto).toEqual([PARK_STAMPEDE, PARK_TEETH]);
      return run;
    };

    it('the Stampede is a spot on the plain: the visit steps out to it and comes back to the same tile', () => {
      let run = put(kanto('k-a'), 0, 9, 3);
      expect(parkTile(st(run), 10, 3)).toBe('S');
      run = minigameAct(content, run, 'go:right');
      expect(st(run)).toMatchObject({ mode: 'spot', spot: 'stampede' });
      // Stepping out of the way leaves it there.
      expect(st(minigameAct(content, run, 'stay')).mode).toBe('walk');
      run = minigameAct(content, run, 'see');
      expect(run.phase).toBe('map');
      expect(parkWaiting(run)).toBe(true);
      const side = parkEventSide(run)!;
      expect(here(run).sides.find((x) => x.id === side)!.eventId).toBe(PARK_STAMPEDE);
      // The park's Safari Balls are in the Bag while the event plays; the park takes no action meanwhile.
      expect(run.inventory['safari-ball']).toBe(30);
      expect(() => minigameAct(content, run, 'go:left')).toThrow();
      // Save and reload in the middle of the event.
      run = reload(run);
      expect(parkWaiting(run)).toBe(true);
      run = chooseEvent(content, run, side, 0).run; // Dodge
      expect(flagOf(run, 'kanto-tauros-dodged')).toBe(1);
      const back = continuePark(content, run);
      expect(back.sideId).toBeNull();
      run = back.run;
      expect(run.phase).toBe('minigame');
      expect(st(run)).toMatchObject({ area: 0, x: 10, y: 3, mode: 'walk', balls: 30, away: null, seen: [PARK_STAMPEDE] });
      expect(run.inventory['safari-ball']).toBeUndefined();
      // It happened: the spot is grass again, this visit and the next.
      expect(parkTile(st(run), 10, 3)).toBe(',');
      expect(flagOf(run, `safari-in:${PARK_STAMPEDE}`)).toBe(1);
      // The visit goes on and ends as usual.
      run = minigameAct(content, run, 'exit');
      expect(run.minigame!.outcome).not.toBeNull();
    });

    it('the rooms an event opens play one after another; Balls thrown there are the park\'s Balls; your own are left alone', () => {
      let run = put(kanto('k-b'), 0, 9, 3);
      run.inventory['safari-ball'] = 2;
      run = minigameAct(content, minigameAct(content, run, 'go:right'), 'see');
      expect(run.inventory['safari-ball']).toBe(32);
      run = chooseEvent(content, run, parkEventSide(run)!, 1).run; // Bait
      let next = continuePark(content, run);
      expect(here(next.run).sides.find((x) => x.id === next.sideId)!.eventId).toBe('cs-kanto-fuchsia-tauros-bait');
      expect(next.run.phase).toBe('map');
      // Throw until the herd moves on or one is caught (each throw is a Ball), following every room the event opens.
      run = next.run;
      let guard = 0;
      while (next.sideId && guard++ < 20) {
        const side = next.sideId;
        const labels = eventView(content, run, side).event.choices.map((c) => c.label);
        const throwAt = labels.findIndex((l) => /^Throw/.test(l));
        run = chooseEvent(content, run, side, throwAt >= 0 && guard < 4 ? throwAt : labels.length - 1).run;
        // A Tauros caught asks where it goes (the keep-or-send screen); the park waits behind that too.
        if (run.phase !== 'map') run = win(run);
        next = continuePark(content, run);
        run = next.run;
      }
      expect(run.phase).toBe('minigame');
      const spent = 30 - st(run).balls;
      expect(spent).toBeGreaterThanOrEqual(1);
      expect(spent).toBeLessThanOrEqual(6);
      expect(run.inventory['safari-ball']).toBe(2);
    });

    it('leaving the event without choosing brings you back with the spot still there; asking twice does not reopen the same room', () => {
      let run = put(kanto('k-c'), 3, 11, 1);
      run = minigameAct(content, minigameAct(content, run, 'go:right'), 'see');
      expect(here(run).sides.find((x) => x.id === parkEventSide(run))!.eventId).toBe(PARK_TEETH);
      const back = continuePark(content, run);
      expect(back.sideId).toBeNull();
      expect(st(back.run)).toMatchObject({ mode: 'walk', seen: [], balls: 30 });
      expect(parkTile(st(back.run), 12, 1)).toBe('W');
      // Not waiting any more: asking again changes nothing.
      expect(continuePark(content, back.run).run).toBe(back.run);
      // The Gold Teeth pay ten Safari Balls: found inside the park, they are ten more Balls for this visit.
      let found = minigameAct(content, minigameAct(content, put(back.run, 3, 11, 1), 'go:right'), 'see');
      let next: string | null = parkEventSide(found);
      let guard = 0;
      while (next && guard++ < 10) {
        found = chooseEvent(content, found, next, 0).run;
        const c = continuePark(content, found);
        found = c.run;
        next = c.sideId;
      }
      expect(found.phase).toBe('minigame');
      expect(st(found).balls).toBe(40);
      expect(st(found).seen).toEqual([PARK_TEETH]);
    });
  });

  it('the same seed and the same steps give the same visit, with a save and reload in the middle', () => {
    const script = (run: RunState, n: number, r: Rng): RunState => {
      for (let i = 0; i < n && !run.minigame!.outcome; i++) {
        const open = mod.view(content, st(run) as never).cells.filter((c) => !c.disabled && c.id !== 'exit' && !c.id.startsWith('door:') && c.id !== 'see');
        run = minigameAct(content, run, r.pick(open).id);
      }
      return run;
    };
    const a = script(visit('same'), 300, new Rng(hashSeed('script')));
    const r = new Rng(hashSeed('script'));
    const half = reload(script(visit('same'), 120, r));
    const b = script(half, 180, r);
    expect(JSON.stringify(st(b))).toBe(JSON.stringify(st(a)));
    expect(st(a).steps).toBeLessThan(500);
    const other = script(visit('same-other'), 300, new Rng(hashSeed('script')));
    expect(JSON.stringify(st(other))).not.toBe(JSON.stringify(st(a)));
  });

  it('a visit saved before the park had a grid picks up at the area\'s way in', () => {
    const s = fresh();
    const old = JSON.parse(JSON.stringify(s)) as Record<string, unknown>;
    for (const k of ['x', 'y', 'facing', 'walked', 'spot', 'fam', 'kanto', 'seen', 'doors', 'door', 'doorSide', 'away', 'photo', 'wall', 'shot']) delete old[k];
    const back = parkState(old as unknown as SafariState);
    expect([back.x, back.y, back.facing, back.kanto, back.away]).toEqual([1, 3, 'right', [], null]);
    act(back, 'go:right');
    expect(back.steps).toBe(499);
  });
});
