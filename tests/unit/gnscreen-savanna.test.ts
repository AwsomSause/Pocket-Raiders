// Greenneedle gn.19 The Deep Savanna as a walkable zone (doc GREENNEEDLE_REWORKED_PLACED_4.md): the grid past the last fence post,
// the places where the story waits, and every room of the stage still played as written, reached on foot.
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { SAVANNA_ID, ZONES, ZONE_H, ZONE_W, zoneNext, zonePlaceState, zoneRows, zoneSolid, zoneStanding, zoneTile, type ZoneState } from '../../src/core/greenneedle/zone';
import { gameModule } from '../../src/core/minigame/games';
import { continuePark, minigameAct, minigameView, parkEventSide, parkWaiting } from '../../src/core/minigame/flow';
import { hashSeed, Rng } from '../../src/core/rng';
import { choose, flagOf, gnRun, open, setFlag } from './helpers/gnPlay';
import { answer, labelsNow, play, reload, roomNow, walkToRoom, zs } from './helpers/zoneWalk';

const def = ZONES[SAVANNA_ID]!;
const mod = gameModule(SAVANNA_ID);
const walkIn = (seed: string, setup: (run: RunState) => void = () => {}, door = 'gn-19-door'): RunState => {
  const run = gnRun(seed);
  setup(run);
  open(run, door);
  return choose(run, door, 'Walk in.').run;
};
const act = (run: RunState, ...ids: string[]): RunState => ids.reduce((r, id) => minigameAct(content, r, id), run);
const KEEP = ['Keep your water.', 'Wait for the herd to pass.'];
/** Through the first place and its herd (if one crosses), to the walk again. */
const pastEdge = (seed: string, setup?: (run: RunState) => void): RunState => play(walkIn(seed, setup), KEEP);
const toWaterhole = (seed: string, setup?: (run: RunState) => void): RunState => walkToRoom(play(pastEdge(seed, setup), ['Cross (one flask).']));
const toRing = (seed: string): RunState => {
  let run = play(toWaterhole(seed), ['Wait until it sleeps.', 'Wait for the herd to pass.']);
  run = play(run, ['Move on.']);
  run = play(run, ['Go round (one flask).']);
  run = play(run, ['Walk through it.']);
  if (roomNow(walkToRoom(run)) === 'gn-19-oasis') run = play(run, ['Fill your flasks.']);
  run = play(run, ['Cross (one flask).']);
  return walkToRoom(run);
};

describe('gn.19 The Deep Savanna, walked', () => {
  it('the zone is four areas of 15 by 7 tiles, fenced by rock, with every place on its map once and a resident on a tile of its own', () => {
    expect(def.areas.map((a) => a.name)).toEqual(['The Edge', 'The First Waterhole', 'The Night Plain', 'The Second Waterhole']);
    const all = def.areas.flatMap((a) => a.rows).join('');
    for (const a of def.areas) {
      expect(a.rows).toHaveLength(ZONE_H);
      for (const row of a.rows) expect(row).toHaveLength(ZONE_W);
      expect(a.rows[0]).toBe('R'.repeat(ZONE_W));
      expect(a.rows[ZONE_H - 1]).toBe('R'.repeat(ZONE_W));
    }
    for (const p of def.places) {
      expect(all.split(p.tile).length - 1, p.id).toBe(1);
      for (const id of p.events) expect(content.events.get(id)?.room, id).toBe(true);
      expect(content.species.has(p.who), p.who).toBe(true);
    }
    for (const r of def.residents) expect(def.areas[r.area]!.rows[r.y]![r.x], `${r.species}`).toBe('*');
    expect(all.split('*').length - 1).toBe(def.residents.length);
    // Every room of the stage that asks something belongs to a place or is reached from one.
    expect(def.places.flatMap((p) => p.events)).toEqual(expect.arrayContaining(['gn-19-thirsty', 'gn-19-cross', 'gn-19-waterhole', 'gn-19-watch', 'gn-19-herd', 'gn-19-devil', 'gn-19-oasis', 'gn-19-on', 'gn-19-ring', 'gn-19-dawn', 'gn-19-prize']));
  });

  it('"Walk in." sets the stage as before and starts the walk at the fence, with the first room waiting at its place', () => {
    const run = walkIn('sv-in');
    expect(run.phase).toBe('minigame');
    expect(run.minigame!.id).toBe(SAVANNA_ID);
    expect([flagOf(run, 'savanna-entered'), flagOf(run, 'savanna-water'), flagOf(run, 'savanna-night')]).toEqual([1, 3, 0]);
    const s = zs(run);
    expect([s.area, s.x, s.y, s.facing]).toEqual([0, 1, 3, 'right']);
    expect(s.open.map((o) => o.eventId)).toEqual(['gn-19-thirsty']);
    expect(s.hud).toMatchObject({ 'savanna-water': 3, 'savanna-night': 0 });
    expect(minigameView(content, run).hud).toEqual(expect.arrayContaining(['The Edge', 'Water: 3 of 3 flasks', 'Day']));
    expect(zoneNext(def, s)!.id).toBe('edge');
    // The Sandile stands on its tile; the place after it bars the way until its room is opened by the story.
    expect(zoneStanding(def, s).find((x) => x.waits)).toMatchObject({ x: 5, y: 2, species: 'sandile' });
    expect(zoneTile(def, s, 10, 4)).toBe('#');
    expect(zoneSolid(def, s, 10, 4)).toBe(true);
    // Through the far gate it is the same walk, after the warden's line.
    const far = walkIn('sv-far', () => {}, 'gn-19-far');
    expect([far.phase, far.minigame!.id, zs(far).open[0]!.eventId]).toEqual(['minigame', SAVANNA_ID, 'gn-19-thirsty']);
  });

  it('walking: a tile at a time, a run is two, rock turns you and costs nothing, and nothing is counted or rolled', () => {
    let run = walkIn('sv-walk');
    const rs = JSON.stringify(zs(run).rs);
    run = act(run, 'go:right');
    expect([zs(run).x, zs(run).y, zs(run).walked]).toEqual([2, 3, 1]);
    run = act(run, 'run:right');
    expect([zs(run).x, zs(run).walked]).toEqual([4, 3]);
    // The rocks at x 5 (the gap is a row up): you turn to face them and stay.
    run = act(run, 'go:right');
    expect([zs(run).x, zs(run).facing, zs(run).walked, zs(run).msg]).toEqual([4, 'right', 3, 'Rock and thorn. No way through.']);
    run = act(run, 'go:left', 'go:left', 'go:left', 'go:left');
    expect([zs(run).x, zs(run).facing, zs(run).msg]).toEqual([1, 'left', 'The last fence post.']);
    expect(JSON.stringify(zs(run).rs)).toBe(rs);
    // "Look around" says where the story waits; an unknown action does nothing.
    expect(zs(act(run, 'look')).msg).toMatch(/gap in the rocks/);
    expect(act(run, 'nonsense', 'go:sideways', 'wait')).toEqual(run);
    const cells = mod.view(content, zs(run) as never).cells;
    expect(cells.map((c) => c.id)).toEqual(['go:up', 'go:left', 'go:right', 'go:down', 'run:left', 'look']);
    expect(cells.find((c) => c.id === 'go:left')!.detail).toBe('something in the way');
  });

  it('walking onto the place opens its room as written; answering it brings you back to the same tile, and the next place opens', () => {
    let run = walkToRoom(walkIn('sv-room'));
    expect(run.phase).toBe('map');
    expect(parkWaiting(run)).toBe(true);
    expect(roomNow(run)).toBe('gn-19-thirsty');
    expect([zs(run).x, zs(run).y, zs(run).at]).toEqual([5, 2, 'edge']);
    expect(labelsNow(run)).toEqual(["Trade a flask for what it's carrying.", 'Trade a flask, and let it come along.', 'Trade a flask for the way.', 'Keep your water.']);
    // While the room is open the walk does not move.
    expect(() => minigameAct(content, run, 'go:right')).toThrow();
    run = answer(run, 'Trade a flask for the way.');
    // A herd may be crossing (35%): it is met where you stand, before the walk goes on.
    if (parkWaiting(run)) {
      expect(roomNow(run)).toBe('gn-19-herd-edge');
      run = answer(run, 'Wait for the herd to pass.');
    }
    expect(run.phase).toBe('minigame');
    const s = zs(run);
    expect([s.x, s.y, s.away, s.at]).toEqual([5, 2, null, null]);
    expect(s.seen).toEqual(['edge']);
    expect(s.open.map((o) => o.eventId)).toEqual(['gn-19-cross']);
    expect(s.hud['savanna-water']).toBe(2);
    expect([flagOf(run, 'savanna-water'), flagOf(run, 'savanna-path')]).toEqual([2, 1]);
    // The gap is plain ground now, and the pit's tile shows who waits there.
    expect(zoneTile(def, s, 5, 2)).toBe('.');
    expect(zoneTile(def, s, 10, 4)).toBe('b');
    expect(zonePlaceState(s, def.places[0]!)).toBe('done');
  });

  it('the crossing is a fight in a sandstorm; won, the first waterhole waits in the next area, and you walk there', () => {
    let run = walkToRoom(pastEdge('sv-cross'));
    expect(roomNow(run)).toBe('gn-19-cross');
    run = answer(run, 'Cross (one flask).');
    expect(run.phase).toBe('minigame');
    expect(zs(run).open.map((o) => o.place)).toEqual(['waterhole']);
    expect(zs(run).hud['savanna-water']).toBe(2);
    run = walkToRoom(run);
    expect([zs(run).area, roomNow(run)]).toEqual([1, 'gn-19-waterhole']);
    expect(labelsNow(run)).toEqual(['Wait until it sleeps.', 'Offer it shade (a large Pokémon stands by it).', 'Battle.']);
    // The Hippowdon moves over for someone who calmed the Crowned Calf (or dug the second channel).
    for (const key of ['crowned-calf-calmed', 'alphas-second-channel', 'river-shared']) expect(labelsNow(toWaterhole(`sv-${key}`, (r) => setFlag(r, key)))[0], key).toBe('Walk to the water.');
  });

  it('a lost fight lets you go: the zone is over, the run is on the map, and nothing is left waiting', () => {
    let run = walkToRoom(pastEdge('sv-lost'));
    run = answer(run, 'Cross (one flask).', { fight: 'lose' });
    expect(run.phase).toBe('map');
    expect(run.minigame).toBeNull();
    expect(parkWaiting(run)).toBe(false);
    expect(flagOf(run, 'savanna-entered')).toBe(1);
  });

  it('night falls at the watching place and the walk shows it; the plain after it is walked in the dark', () => {
    let run = play(toWaterhole('sv-night'), ['Wait until it sleeps.', 'Wait for the herd to pass.']);
    expect(zs(run).hud['savanna-night']).toBe(0);
    run = play(run, ['Watch.']);
    expect(zs(run).hud['savanna-night']).toBe(1);
    expect(minigameView(content, run).hud).toContain('Night');
    run = walkToRoom(run);
    expect([zs(run).area, roomNow(run)]).toEqual([2, 'gn-19-herd']);
    expect(labelsNow(run)).toEqual(['Wait for the herd to pass.', 'Go round (one flask).', 'Hold a flask out to the eyes in the dark.']);
  });

  it('the whole stage on foot: the ring, guarded and treated, the calf, the prize, and out; the flags are the doc\'s', () => {
    let run = toRing('sv-whole');
    expect([zs(run).area, roomNow(run)]).toEqual([3, 'gn-19-ring']);
    expect(labelsNow(run)).toEqual(expect.arrayContaining(['Guard it through the night.', 'Lead the herd on without it.', 'Walk past.']));
    // Three waves, each a room of the same place: they follow one another without a step between.
    run = answer(run, 'Guard it through the night.');
    expect(roomNow(run)).toBe('gn-19-guard2');
    run = answer(run, 'Hold.');
    expect(roomNow(run)).toBe('gn-19-guard3');
    run = answer(run, 'Hold.');
    expect(roomNow(run)).toBe('gn-19-ring-2');
    expect(flagOf(run, 'savanna-guarded')).toBe(1);
    setFlag(run, 'savanna-water', 2);
    run = answer(run, 'Treat it.');
    expect(roomNow(run)).toBe('gn-19-treat');
    run = answer(run, 'With your own time.');
    expect([flagOf(run, 'savanna-treated'), flagOf(run, 'savanna-water')]).toEqual([1, 0]);
    run = answer(run, 'Go on to the water.');
    // Back on the ring's tile; the second waterhole waits further on.
    expect(run.phase).toBe('minigame');
    expect(zs(run).open.map((o) => o.place)).toEqual(['dawn']);
    expect(zs(run).seen).toContain('ring');
    run = walkToRoom(run);
    expect(roomNow(run)).toBe('gn-19-dawn');
    run = answer(run, 'Take the calf.');
    expect(flagOf(run, 'savanna-both')).toBe(1);
    expect([...run.party, ...run.box].some((m) => m.speciesId === 'phanpy')).toBe(true);
    run = walkToRoom(run);
    expect(roomNow(run)).toBe('gn-19-prize');
    expect(labelsNow(run)).toEqual(['Soft Sand', 'A Smooth Rock', 'A Gible with Rough Skin', 'A Trapinch']);
    const sand = (r: RunState): number => JSON.stringify([r.inventory, r.party, r.box]).split('smooth-rock').length;
    const before = sand(run);
    run = answer(run, 'A Smooth Rock');
    // Out: the zone is over, nothing waits, the run is on the map on the same node.
    expect(run.phase).toBe('map');
    expect(run.minigame).toBeNull();
    expect(sand(run)).toBeGreaterThan(before);
    expect(flagOf(run, 'savanna-water')).toBe(0);
    expect(run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.sides.filter((x) => x.kind === 'event' && !x.used && x.eventId?.startsWith('gn-19'))).toEqual([]);
    // Once a run: the door is not offered again.
    expect(content.events.get('gn-19-door')!.requires).toContainEqual(expect.objectContaining({ key: 'savanna-entered' }));
  });

  it('save and reload anywhere: on the grid, with a room open, and in the middle of a fight; and the same seed and steps give the same run', () => {
    const through = (reloads: boolean): RunState => {
      const r = (x: RunState) => (reloads ? reload(x) : x);
      let run = r(walkIn('sv-same'));
      run = r(walkToRoom(run, reloads ? { reloadEvery: 2 } : {}));
      run = r(answer(run, 'Keep your water.'));
      if (parkWaiting(run)) run = r(answer(run, 'Go round (one flask).'));
      run = r(walkToRoom(run));
      run = r(answer(run, 'Cross (one flask).'));
      return r(walkToRoom(run));
    };
    const a = through(false), b = through(true);
    expect(b.minigame).toEqual(a.minigame);
    expect(b.story.flags).toEqual(a.story.flags);
    expect(b.party.map((m) => [m.speciesId, m.level, m.hp])).toEqual(a.party.map((m) => [m.speciesId, m.level, m.hp]));
    // A save made while the fight at the crossing is on: the walk is kept under it and comes back after.
    let run = walkToRoom(pastEdge('sv-mid'));
    const side = parkEventSide(run)!;
    run = reload(run);
    expect(parkEventSide(run)).toBe(side);
    const tile = [zs(run).x, zs(run).y];
    const fight = choose(run, 'gn-19-cross', 'Cross (one flask).').run;
    expect(fight.phase).toBe('battle');
    const kept = reload(fight);
    expect((kept.minigame!.state as ZoneState).away).toMatchObject({ eventId: 'gn-19-cross' });
    expect(parkWaiting(kept)).toBe(false);
    // continuePark is a no-op until the fight is over.
    expect(continuePark(content, kept).run).toBe(kept);
    expect([zs(kept).x, zs(kept).y]).toEqual(tile);
  });

  it('a run saved inside the rooms before the savanna was walked plays on as it did: the rooms follow one another beside the node', () => {
    const run = walkIn('sv-old');
    // What such a save looks like: no walk, the room's stop beside the node.
    run.minigame = null;
    run.phase = 'map';
    const next = choose(run, 'gn-19-thirsty', 'Keep your water.').run;
    expect(next.phase).toBe('map');
    const sides = next.stage!.map.nodes.find((n) => n.id === next.stage!.current)!.sides.filter((x) => !x.used && x.kind === 'event').map((x) => x.eventId);
    expect(sides.some((id) => id === 'gn-19-cross' || id === 'gn-19-herd-edge')).toBe(true);
    expect(parkWaiting(next)).toBe(false);
  });

  it('a state with no run behind it (the module on its own) starts clean and ignores a move while a room is open', () => {
    const s = mod.start(content, {}, new Rng(hashSeed('sv')).state) as unknown as ZoneState;
    expect([s.area, s.x, s.y, s.open, s.seen, s.done]).toEqual([0, 1, 3, [], [], false]);
    expect(zoneRows(def, s)).toHaveLength(ZONE_H);
    // With nothing open every place that must be passed bars the way, and "Look around" says so.
    mod.act(content, s as never, 'look');
    expect(s.msg).toBe('Nothing is waiting. The way is open.');
    s.away = { eventId: 'gn-19-thirsty', from: 0, opened: [], side: 'x' };
    mod.act(content, s as never, 'go:right');
    expect(s.x).toBe(1);
    expect(mod.result(s as never)).toEqual({ score: 0, max: 1 });
  });
});
