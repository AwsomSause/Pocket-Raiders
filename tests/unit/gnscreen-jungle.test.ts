// Greenneedle gn.20 The Lush Jungle as a walkable zone (doc GREENNEEDLE_REWORKED_PLACED_4.md): the grid beyond the fence, the places
// where the story waits (the plants, the storms, the hill, the clearing, the ladder or the treehouse), every room played as written.
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { JUNGLE_ID, ZONES, ZONE_H, ZONE_W, zoneNext, zoneSolid, zoneStanding, zoneTile, type ZoneState } from '../../src/core/greenneedle/zone';
import { minigameAct, minigameView, parkWaiting } from '../../src/core/minigame/flow';
import { choose, flagOf, gnRun, open, setFlag } from './helpers/gnPlay';
import { answer, labelsNow, play, reload, roomNow, walkToRoom, zs } from './helpers/zoneWalk';

const def = ZONES[JUNGLE_ID]!;
const goIn = (seed: string, setup: (run: RunState) => void = () => {}, door = 'gn-20-door'): RunState => {
  const run = gnRun(seed);
  setup(run);
  open(run, door);
  return choose(run, door, 'Go in.').run;
};
const ROUND = ['Go round (the long way).'];
/** Past the wall and the three bright plants, to the walk again (the vine tangle waits). */
const pastPlants = (seed: string, setup?: (run: RunState) => void): RunState => [1, 2, 3].reduce((run) => play(run, ROUND), play(goIn(seed, setup), ['Walk on.']));
/** To the hill, having shared the Ledian's shelter. */
const toHill = (seed: string, setup?: (run: RunState) => void): RunState => {
  let run = play(pastPlants(seed, setup), ['Push on.']);
  run = play(run, ['Share the shelter.']);
  run = play(run, ['Take the long way.', 'Follow the Ledian.']);
  return walkToRoom(run);
};
/** Across the stones without a slip, round the Roselia, the second storm: the clearing's room open. */
const toClearing = (seed: string, setup?: (run: RunState) => void): RunState => {
  let run = answer(toHill(seed, setup), 'Start across.');
  for (const label of ['Wait for the hum to drop.', 'Step now.', 'Wait for the hum to drop.']) run = answer(run, label);
  run = play(run, ['Walk round them.']);
  run = play(run, ['Take the long way.']);
  return walkToRoom(run);
};
/** After the clearing: a Venusaur may be asleep on the way (15%); left alone. */
const pastHeart = (run: RunState): RunState => (roomNow(walkToRoom(run)) === 'gn-20-venusaur' ? play(run, ['Leave it.']) : run);

describe('gn.20 The Lush Jungle, walked', () => {
  it('the zone is four areas of 15 by 7 tiles, walled by trees, with every place on its map once', () => {
    expect(def.areas.map((a) => a.name)).toEqual(['The Green Wall', 'The Flooded Trail', 'The Hill That Hums', 'The Clearing']);
    const all = def.areas.flatMap((a) => a.rows).join('');
    for (const a of def.areas) {
      expect(a.rows).toHaveLength(ZONE_H);
      for (const row of a.rows) expect(row).toHaveLength(ZONE_W);
      expect(a.rows[0]).toBe('T'.repeat(ZONE_W));
    }
    for (const p of def.places) {
      expect(all.split(p.tile).length - 1, p.id).toBe(1);
      for (const id of p.events) expect(content.events.get(id)?.room, id).toBe(true);
      expect(content.species.has(p.who), p.who).toBe(true);
    }
    for (const r of def.residents) expect(def.areas[r.area]!.rows[r.y]![r.x], r.species).toBe('*');
    // Every room of the stage has a place (the Lantern afterstory is a stop of its own, later).
    const rooms = [...content.events.values()].filter((e) => e.id.startsWith('gn-20-') && e.room).map((e) => e.id);
    expect(rooms.filter((id) => !def.places.some((p) => p.events.includes(id)))).toEqual([]);
  });

  it('"Go in." sets the stage as before and starts the walk; Unharmed: yes shows; a taken egg means the nests cannot be looked at', () => {
    const run = goIn('jg-in');
    expect([run.phase, run.minigame!.id]).toEqual(['minigame', JUNGLE_ID]);
    expect([flagOf(run, 'jungle-entered'), flagOf(run, 'jungle-unharmed')]).toEqual([1, 1]);
    expect(minigameView(content, run).hud).toEqual(expect.arrayContaining(['The Green Wall', 'Unharmed: yes']));
    expect(zs(run).open.map((o) => o.eventId)).toEqual(['gn-20-wall']);
    expect(zoneStanding(def, zs(run)).find((x) => x.waits)).toMatchObject({ species: 'bellsprout' });
    const wall = walkToRoom(run);
    expect(roomNow(wall)).toBe('gn-20-wall');
    expect(labelsNow(wall)).toEqual(['Look up.', 'Walk on.']);
    const watched = walkToRoom(goIn('jg-egg', (r) => setFlag(r, 'egg-taken')));
    expect(flagOf(watched, 'jungle-watched')).toBe(1);
    expect(labelsNow(watched)).toEqual(['Walk on.']);
    // The warden's word, by bird: Quiet 8 or more in Safari Land sends the ladder down whatever happens.
    expect(flagOf(goIn('jg-quiet', (r) => setFlag(r, 'safari-quiet', 8)), 'jungle-ladder-sent')).toBe(1);
    const far = goIn('jg-far', () => {}, 'gn-20-far');
    expect([far.phase, far.minigame!.id]).toEqual(['minigame', JUNGLE_ID]);
  });

  it('looking up at the wall: the nest is met where you stand, and left alone the bright path opens further on', () => {
    let run = answer(walkToRoom(goIn('jg-nest')), 'Look up.');
    expect(roomNow(run)).toBe('gn-20-nest');
    const tile = [zs(run).x, zs(run).y];
    run = answer(run, 'Leave them be.');
    expect(run.phase).toBe('minigame');
    expect([zs(run).x, zs(run).y]).toEqual(tile);
    expect(zs(run).open.map((o) => o.place)).toEqual(['bright-1']);
    expect(zs(run).hud['jungle-unharmed']).toBe(1);
  });

  it('the three careless plants are three places on the path: each bars the way until the one before it is answered', () => {
    let run = play(goIn('jg-plants'), ['Walk on.']);
    const s = zs(run);
    expect([zoneTile(def, s, 6, 3), zoneTile(def, s, 9, 4), zoneTile(def, s, 12, 3)]).toEqual(['b', '#', '#']);
    expect(zoneSolid(def, s, 9, 4)).toBe(true);
    run = walkToRoom(run);
    expect(roomNow(run)).toBe('gn-20-bright');
    expect(labelsNow(run)).toEqual(['Push through.', 'Go round (the long way).', 'Send a Poison- or Grass-type first.']);
    run = answer(run, 'Push through.');
    expect(zs(run).open.map((o) => o.place)).toEqual(['bright-2']);
    expect([zoneTile(def, zs(run), 6, 3), zoneTile(def, zs(run), 9, 4)]).toEqual(['.', 'c']);
    run = play(play(run, ROUND), ROUND);
    // The vine tangle is in the next area: you walk there.
    expect(zs(run).open.map((o) => o.place)).toEqual(['vines']);
    run = walkToRoom(run);
    expect([zs(run).area, roomNow(run)]).toEqual([1, 'gn-20-vines']);
    // Above the tangle, a nest: looked at and left, the tangle asks again where you stand.
    run = answer(run, 'Look up.');
    expect(roomNow(run)).toBe('gn-20-nest-2');
    run = answer(run, 'Leave them be.');
    expect(roomNow(run)).toBe('gn-20-vines');
    expect(labelsNow(run)).toEqual(['Push on.']);
  });

  it('a slip on the stones brings the three waves where you stand; a knockout pulls the ladder up, and the walk shows Unharmed: no', () => {
    let run = answer(toHill('jg-slip'), 'Start across.');
    expect(roomNow(run)).toBe('gn-20-stone1');
    run = answer(run, 'Step now.');
    expect([flagOf(run, 'jungle-slipped'), roomNow(run)]).toEqual([1, 'gn-20-wave1']);
    for (const next of ['gn-20-wave2', 'gn-20-wave3']) {
      run = answer(run, 'Fight them off.');
      expect(roomNow(run)).toBe(next);
    }
    // A knockout in the last wave (core/run.ts marks it when a fight in here ends with someone down).
    setFlag(run, 'jungle-harmed');
    run = answer(run, 'Fight them off.');
    expect(run.phase).toBe('minigame');
    expect(zs(run).open.map((o) => o.place)).toEqual(['roses']);
    expect(flagOf(run, 'jungle-unharmed')).toBe(0);
    expect(minigameView(content, run).hud).toContain('Unharmed: no');
  });

  it('the whole jungle on foot without hurting anything: the clearing backed out of, the ladder, the village, and out', () => {
    let run = toClearing('jg-whole');
    expect([zs(run).area, roomNow(run)]).toEqual([3, 'gn-20-clearing']);
    expect(labelsNow(run)).toEqual(['Back out.', 'Walk round the edge.', 'Step forward.']);
    run = pastHeart(answer(run, 'Back out.'));
    expect(flagOf(run, 'jungle-tsareena')).toBe(1);
    expect(zs(run).open.map((o) => o.place)).toEqual(['ladder']);
    run = walkToRoom(run);
    expect(roomNow(run)).toBe('gn-20-ladder');
    run = answer(run, 'Climb up.');
    expect(roomNow(run)).toBe('gn-20-tutor');
    run = answer(run, 'A Grass move.');
    expect(roomNow(run)).toBe('gn-20-nestling');
    const had = run.party.length + run.box.length;
    run = answer(run, 'Take it down with me.');
    expect(run.phase).toBe('map');
    expect(run.minigame).toBeNull();
    expect([flagOf(run, 'jungle-village'), flagOf(run, 'jungle-nestling'), flagOf(run, 'jungle-lantern'), flagOf(run, 'jungle-unharmed')]).toEqual([1, 1, 1, 1]);
    expect(run.party.length + run.box.length).toBe(had + 1);
    expect(run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.sides.filter((x) => x.kind === 'event' && !x.used && x.eventId?.startsWith('gn-20'))).toEqual([]);
  });

  it('with the ladder pulled up the treehouse waits instead, at its own place; stepping forward at the clearing is the Tsareena', () => {
    let run = toClearing('jg-tree');
    const fight = choose(run, 'gn-20-clearing', 'Step forward.').run;
    expect(fight.phase).toBe('battle');
    expect(fight.battle!.enemyTeam[0]!.speciesId).toBe('tsareena');
    expect(fight.battle!.eventRule).toMatchObject({ gn: 'tsareena' });
    run = pastHeart(answer(run, 'Step forward.'));
    expect([flagOf(run, 'jungle-tsareena'), flagOf(run, 'jungle-unharmed')]).toEqual([3, 0]);
    expect(zs(run).open.map((o) => o.place)).toEqual(['treehouse']);
    // The ladder's tile stays plain ground; the treehouse shows who waits.
    expect([zoneTile(def, zs(run), 11, 2), zoneTile(def, zs(run), 11, 4)]).toEqual(['.', 'n']);
    run = walkToRoom(run);
    expect(roomNow(run)).toBe('gn-20-treehouse');
    run = answer(run, 'A seedling.');
    expect(roomNow(run)).toBe('gn-20-treehouse-2');
    run = answer(run, 'Black Sludge');
    expect([run.phase, run.minigame, flagOf(run, 'jungle-lantern')]).toEqual(['map', null, 1]);
  });

  it('save and reload on every other tile and after every room gives the same walk as playing straight through', () => {
    const through = (reloads: boolean): RunState => {
      const r = (x: RunState) => (reloads ? reload(x) : x);
      let run = r(goIn('jg-same'));
      for (const label of ['Walk on.', 'Push through.', 'Go round (the long way).', 'Go round (the long way).']) {
        run = r(walkToRoom(run, reloads ? { reloadEvery: 2 } : {}));
        run = r(answer(run, label));
      }
      return r(walkToRoom(run));
    };
    const a = through(false), b = through(true);
    expect(b.minigame).toEqual(a.minigame);
    expect(b.story.flags).toEqual(a.story.flags);
    expect(b.party.map((m) => [m.speciesId, m.hp, m.status ?? null])).toEqual(a.party.map((m) => [m.speciesId, m.hp, m.status ?? null]));
    expect((b.minigame!.state as ZoneState).away).toMatchObject({ eventId: 'gn-20-vines' });
  });

  it('failure cases: a move into the trees only turns you, a move while a room is open is refused, and an old save in the rooms plays on', () => {
    let run = goIn('jg-fail');
    run = minigameAct(content, run, 'go:up');
    run = minigameAct(content, run, 'go:up');
    run = minigameAct(content, run, 'go:up');
    expect([zs(run).x, zs(run).y, zs(run).facing, zs(run).msg]).toEqual([1, 1, 'up', 'Leaves, trunks, more leaves. No way through.']);
    expect(zoneNext(def, zs(run))!.id).toBe('wall');
    const open1 = walkToRoom(run);
    expect(() => minigameAct(content, open1, 'go:left')).toThrow();
    const old = goIn('jg-old');
    old.minigame = null;
    old.phase = 'map';
    const next = choose(old, 'gn-20-wall', 'Walk on.').run;
    expect(parkWaiting(next)).toBe(false);
    expect(next.stage!.map.nodes.find((n) => n.id === next.stage!.current)!.sides.some((x) => !x.used && x.eventId === 'gn-20-bright')).toBe(true);
  });
});
