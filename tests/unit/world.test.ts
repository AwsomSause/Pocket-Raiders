import { ZONES } from '../../src/core/greenneedle/zone';
import familiesC from '../../src/data/catalogOverhaul/familiesC.json';
import { MENTORS } from '../../src/core/mentors';
import { PSEUDO, PSEUDO_CHAINS } from '../../src/core/dungeon/pseudo';
import { POKEMON_MOMENTS } from '../../src/core/moments/pokemonMoments';
import { canonKantoPlaced } from '../../src/data/expansion';
// Exploration (APPROVED.md §5-6): fog of war, weather fronts, roaming Legendaries, camps, secret
// paths, callbacks, landmark rooms and the stops of the limited-time events.

import { LANDMARK_STOP, TRAVERSAL } from '../../src/core/traversal';
import { TREASURE_DIG_EVENT } from '../../src/core/run';
import { DRAMA_LIBRARY } from '../../src/core/drama/schema';
import { describe, expect, it } from 'vitest';
import type { Content, EventEffect as Effect } from '../../src/core/contentSchema';
import { addEventStops, chooseEvent, eligibleEvents, stopIsHidden } from '../../src/core/events';
import { findNode, nextChoices } from '../../src/core/map';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { chooseStarter, chooseNode, createRun } from '../../src/core/run';
import { StageStateSchema, type RunState } from '../../src/core/state';
import { advanceRoamers, applyFrontWeather, convoyStep, healConvoy, forecast, foggedAt, frontAt, isFogged, placeCamp, roamerOn, scoutAhead, sightRange, spawnRoamers, stageFronts, stageHasCamp, visibleColumn } from '../../src/core/world';
import { content } from './helpers';

const withWorld = (patch: Partial<Content['balance']['world']>): Content => ({ ...content, balance: { ...content.balance, world: { ...content.balance.world, ...patch } } });

function newRun(c: Content = content, seed = 'world'): RunState {
  return chooseStarter(c, createRun(c, { runId: 'r', seed, archetypeId: 'red' }), 0);
}

/** Puts a Pokémon of this species in the lead (its own ability, not an override). */
function setLead(run: RunState, species: string): void {
  run.party[0] = createPokemon(content, species, 5, run.party[0]!.uid);
}

const eventStops = (run: RunState) => run.stage!.map.nodes.flatMap((n) => n.sides.filter((s) => s.kind === 'event').map((s) => ({ node: n, side: s })));

/** Stands the run on the first node with this event beside it. */
function atEvent(run: RunState, eventId: string, sideId = 'test-event'): RunState {
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: sideId, kind: 'event', used: false, eventId });
  return run;
}

describe('fog of war', () => {
  it('shows a few columns ahead, never the gym, and never what you have visited', () => {
    const run = newRun();
    const stage = run.stage!;
    const sight = sightRange(content, run);
    expect(sight).toBeGreaterThanOrEqual(content.balance.world.fogSight);
    const seen = visibleColumn(content, run);
    expect(seen).toBe(sight); // before the first node
    const far = stage.map.nodes.find((n) => n.column === seen + 1)!;
    expect(foggedAt(stage, seen, far)).toBe(true);
    expect(isFogged(content, run, far)).toBe(true);
    const near = stage.map.nodes.find((n) => n.column === 1)!;
    expect(isFogged(content, run, near)).toBe(false);
    const gym = stage.map.nodes.find((n) => n.column === stage.map.columns)!;
    expect(isFogged(content, run, gym)).toBe(false);
    stage.visited.push(far.id);
    expect(isFogged(content, run, far)).toBe(false);
  });

  it('scouting shows more columns for the rest of the stage and walking moves the fog on', () => {
    const run = newRun();
    const before = visibleColumn(content, run);
    expect(scoutAhead(content, run, 4)).toBe(before + 4);
    expect(visibleColumn(content, run)).toBe(before + 4);
    const walked = chooseNode(content, newRun(), nextChoices(newRun().stage!)[0]!.id);
    expect(visibleColumn(content, walked)).toBeGreaterThan(before);
  });

  it('a keen-eyed or Flying party sees a column further', () => {
    const run = newRun();
    const base = sightRange(content, run);
    setLead(run, 'sentret'); // Keen Eye
    expect(sightRange(content, run)).toBe(base + 1);
  });
});

describe('weather fronts', () => {
  it('come from the seed, cover columns of the stage and are the same every time', () => {
    let found = 0;
    for (let i = 0; i < 12; i++) {
      const run = newRun(content, `front-${i}`);
      const fronts = stageFronts(content, run);
      expect(stageFronts(content, structuredClone(run))).toEqual(fronts);
      for (const f of fronts) {
        found++;
        expect(f.from).toBeGreaterThanOrEqual(1);
        expect(f.to).toBeLessThan(run.stage!.map.columns);
        expect(content.balance.world.frontWeathers).toContain(f.weather);
      }
    }
    expect(found).toBeGreaterThan(0);
  });

  it('a battle on a node inside a front starts in that weather, and a node outside it does not', () => {
    const run = newRun();
    run.stage!.extraFronts.push({ weather: 'sand', from: 1, to: 1 });
    const inside = chooseNode(content, structuredClone(run), nextChoices(run.stage!)[0]!.id);
    if (inside.battle) expect(inside.battle.weather?.id).toBe('sand');
    const node = run.stage!.map.nodes.find((n) => n.column === 3 && n.kind === 'wild')!;
    expect(applyFrontWeather(content, { ...run, battle: null }, node)).toBeNull();
  });

  it('a forecast names the next front within the telegraph distance', () => {
    const run = newRun();
    run.stage!.extraFronts.push({ weather: 'hail', from: 3, to: 4 });
    const fc = forecast(content, run);
    expect(fc?.front.weather === 'hail' || fc !== null).toBe(true);
    const mine = stageFronts(content, run).find((f) => f.weather === 'hail' && f.from === 3)!;
    expect(frontAt(content, run, run.stage!.map.nodes.find((n) => n.column === 3)!)?.weather).toBe(mine.weather);
  });

  it('a Weather Prophet widens the forecast horizon (S124)', () => {
    const run = newRun();
    const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)?.column ?? 0;
    run.stage!.extraFronts = [{ weather: 'hail', from: here + 7, to: here + 8 }];
    const far = forecast(content, run)?.front;
    expect(far?.weather === 'hail' && far.from === here + 7).toBe(false);
    run.stage!.foresight = 6;
    const fc = forecast(content, run);
    expect(fc?.front.from).toBeLessThanOrEqual(here + 7);
    expect(fc).not.toBeNull();
  });

  it('a Weather Vane brings a chosen front in', () => {
    const run = atEvent(newRun(), 'weather-vane');
    const after = chooseEvent(content, run, 'test-event', 0).run;
    expect(after.stage!.extraFronts.some((f) => f.weather === 'rain')).toBe(true);
  });
});

describe('roaming Legendaries', () => {
  const c = withWorld({ roamerChance: 1, roamerMinStage: 1 });

  it('a map can hold one, shown as a stop beside a node that moves as you do', () => {
    const run = newRun(c, 'roam');
    const stage = run.stage!;
    expect(stage.roamers).toHaveLength(1);
    const r = stage.roamers[0]!;
    expect(roamerOn(stage, r.nodeId!)).toBe(r.species);
    const stops = () => eventStops(run).filter((s) => s.side.roamer);
    expect(stops()).toHaveLength(1);
    expect(content.events.get(`roamer-${r.species}`)?.stop).toBe('roamer');
    // Stepping onto the first column moves it ahead (or it rests), never behind.
    const start = findNode(stage.map, r.nodeId!);
    const step = stage.map.nodes.find((n) => n.column === 1)!;
    advanceRoamers(c, run, step);
    const now = stage.roamers[0]!;
    if (now.status === 'roaming') expect(findNode(stage.map, now.nodeId!).column).toBeGreaterThanOrEqual(start.column);
    expect(stops().filter((s) => !s.side.used).length).toBe(now.status === 'roaming' ? 1 : 0);
  });

  it('is deterministic: the same run and step move it to the same place', () => {
    const a = newRun(c, 'roam-2');
    const b = newRun(c, 'roam-2');
    expect(a.stage!.roamers).toEqual(b.stage!.roamers);
    const step = a.stage!.map.nodes.find((n) => n.column === 1)!;
    advanceRoamers(c, a, step);
    advanceRoamers(c, b, step);
    expect(a.stage!.roamers).toEqual(b.stage!.roamers);
  });

  it('a roamer left behind slips away, and playing its stop ends the chase', () => {
    const run = newRun(c, 'roam-3');
    const stage = run.stage!;
    const roamer = stage.roamers[0]!;
    const here = findNode(stage.map, roamer.nodeId!);
    const stop = here.sides.find((s) => s.roamer)!;
    stage.current = here.id;
    stage.visited.push(here.id);
    const after = chooseEvent(c, run, stop.id, 2).run; // watch from a distance
    expect(after.stage!.roamers[0]!.status).toBe('done');
    const passed = newRun(c, 'roam-4');
    const lead = passed.stage!.map.nodes.find((n) => n.column === passed.stage!.map.columns - 1)!;
    advanceRoamers(c, passed, lead);
    expect(passed.stage!.roamers[0]!.status).toBe('gone');
  });

  it('the Legendary Beasts Chase puts all three beasts on the map together', () => {
    const run = newRun(c, 'beasts');
    run.gameEvents = ['legendary-beasts-chase@2026-W44'];
    spawnRoamers(c, run);
    expect(run.stage!.roamers.map((r) => r.species).sort()).toEqual(['entei', 'raikou', 'suicune']);
  });

  it('has an event and a species for every roamer in the balance file', () => {
    for (const r of content.balance.world.roamers) {
      expect(content.species.has(r.species), r.species).toBe(true);
      expect(content.events.get(`roamer-${r.species}`)?.stop).toBe('roamer');
    }
  });
});

describe('checkpoint camps', () => {
  it('a camp turns up in every stage, in the middle of the map, and gives one free service', () => {
    const run = newRun();
    expect(stageHasCamp(content, run)).toBe(true); // spec §22: never missing, even in the first stage
    expect(stageHasCamp(withWorld({ campEvery: 2 }), run)).toBe(false); // an older cadence still skips the first
    const camps = eventStops(run).filter((s) => s.side.eventId === 'camp-checkpoint');
    expect(camps).toHaveLength(1);
    const [lo, hi] = content.balance.world.campColumns;
    expect(camps[0]!.node.column).toBeGreaterThanOrEqual(lo);
    expect(camps[0]!.node.column).toBeLessThanOrEqual(hi);
    const there = atEvent(run, 'camp-checkpoint');
    there.party[0]!.hp = 1;
    const after = chooseEvent(content, there, 'test-event', 0).run;
    expect(after.party[0]!.hp).toBe(maxHp(content, after.party[0]!));
    expect(after.clock.day).toBe(2); // resting takes the night
    expect(after.clock.tick).toBe(0);
    const planned = chooseEvent(content, atEvent(newRun(), 'camp-prepare'), 'test-event', 0).run;
    expect(planned.stage!.scoutedTo).toBeGreaterThan(0);
  });

  it('is never drawn as an ordinary event', () => {
    expect(eligibleEvents(content, newRun()).some((e) => e.id === 'camp-checkpoint')).toBe(false);
  });
});

describe('secret paths', () => {
  it('stay a "?" until a party Pokémon has the ability, then show themselves', () => {
    const run = atEvent(newRun(), 'secret-keen-eye-ledge');
    const node = run.stage!.map.nodes[0]!;
    const side = node.sides.find((s) => s.id === 'test-event')!;
    side.hidden = true;
    run.stage!.current = null;
    expect(stopIsHidden(content, run, node, side)).toBe(true);
    setLead(run, 'sentret');
    expect(stopIsHidden(content, run, node, side)).toBe(false);
  });

  it('their choices are locked without the ability and work with it', () => {
    const run = atEvent(newRun(), 'secret-levitate-chasm');
    expect(() => chooseEvent(content, run, 'test-event', 0)).toThrow(/Levitate/);
    setLead(run, 'gastly');
    const result = chooseEvent(content, run, 'test-event', 0);
    // Catalog Overhaul SF143: floating over finds a random Rare item in the chest.
    expect(result.success).toBe(true);
    expect(result.changes.join(' ')).toMatch(/Leftovers|Focus Sash|Life Orb|Choice (Band|Specs|Scarf)/);
  });
});

describe('follow-up scenes', () => {
  it('a kindness comes back on the next stage as a stop, once', () => {
    const run = newRun();
    run.story.flags['ev:fed-poochyena'] = 1; // Catalog Overhaul SF63: feeding the thin Poochyena (was `fed-wild`)
    run.stage!.index = 3;
    run.stage!.map.nodes.forEach((n) => (n.sides = []));
    addEventStops(content, run);
    expect(eventStops(run).some((s) => s.side.eventId === 'starving-wild-returns')).toBe(true);
    run.itemCounters = { ...run.itemCounters, 'event-seen:starving-wild-returns': 1 };
    run.stage!.map.nodes.forEach((n) => (n.sides = []));
    addEventStops(content, run);
    expect(eventStops(run).some((s) => s.side.eventId === 'starving-wild-returns')).toBe(false);
  });

  it('the egg cradle plays out over three stages with the flag counting up', () => {
    let run = atEvent(newRun(), 'egg-cradle-find');
    run.stage!.index = 3;
    run = chooseEvent(content, run, 'test-event', 0).run;
    expect(run.story.flags['ev:cradle']).toBe(1);
    expect(run.eggs.length).toBeGreaterThan(0);
    run.stage!.map.nodes.forEach((n) => (n.sides = []));
    addEventStops(content, run);
    expect(eventStops(run).some((s) => s.side.eventId === 'egg-cradle-night')).toBe(true);
    run = atEvent(run, 'egg-cradle-night', 'night');
    run = chooseEvent(content, run, 'night', 0).run;
    expect(run.story.flags['ev:cradle']).toBe(2);
    run.stage!.map.nodes.forEach((n) => (n.sides = []));
    addEventStops(content, run);
    expect(eventStops(run).some((s) => s.side.eventId === 'egg-cradle-hatch')).toBe(true);
  });
});

describe('landmarks and dungeons', () => {
  it('a landmark opens its rooms one after another beside the same node', () => {
    // The pack's landmarks are pseudo-stage Doors now (Catalog Overhaul; a chain room walks into the Door's map), so the room
    // mechanism is checked on a test landmark that opens a plain room.
    const def = structuredClone(content.events.get('lighthouse-entrance')!);
    def.stop = LANDMARK_STOP;
    def.id = 'test-landmark';
    def.pseudo = false;
    def.choices[0]!.requires = [];
    def.choices[0]!.branches = [];
    delete def.choices[0]!.success.battle;
    def.choices[0]!.success.effects = [{ kind: 'addEvent', eventId: 'fb-last-train-carriage' }];
    const withRoom = { ...content, events: new Map(content.events).set(def.id, def) };
    let run = atEvent(newRun(), def.id);
    run = chooseEvent(withRoom, run, 'test-event', 0).run;
    const here = findNode(run.stage!.map, run.stage!.current!);
    expect(here.sides.some((s) => s.eventId === 'fb-last-train-carriage' && !s.used)).toBe(true);
  });

  it('rooms are never drawn on their own', () => {
    const rooms = [...content.events.values()].filter((e) => e.room);
    expect(rooms.length).toBeGreaterThan(40);
    const run = newRun();
    run.stage!.index = 4;
    const drawn = new Set(eligibleEvents(content, run).map((e) => e.id));
    for (const r of rooms) expect(drawn.has(r.id), r.id).toBe(false);
  });

  it('every room is reached from an event, and every room an event opens exists', () => {
    const opened = new Set<string>();
    const viaMentor = new Set<string>();
    // Stops queued some nodes on (`laterEvent`: the Fossil Rush's egg) or placed by code need not be rooms, but they do reach the rooms they are.
    const queued = new Set<string>();
    const questOpened = new Set<string>();
    const retiredOpened = new Set<string>();
    // Openers: outcome effects, a battle's win and lose effects (a friendly fight's loss still opens its room), choice branches,
    // and the choices a Remembers variant adds.
    for (const e of content.events.values()) {
      // A retired event (kept for saved runs) isn't checked, but a room it opens still counts as reached (an old save can open it).
      if (e.disabled) {
        for (const ch of e.choices) for (const o of [ch.success, ch.failure]) for (const ef of o?.effects ?? []) if (ef.kind === 'addEvent') retiredOpened.add(ef.eventId);
        continue;
      }
      for (const ch of [...e.choices, ...e.remembers.flatMap((v) => v.addChoices)]) {
        const lists = [...[ch.success, ch.failure].flatMap((o) => [o?.effects ?? [], o?.battle?.win ?? [], o?.battle?.lose ?? [], (o?.battle && 'caught' in o.battle ? o.battle.caught : undefined) ?? []]), ...(ch.branches ?? []).map((b) => b.effects)];
        // A Greenneedle effect (`gn`) holds more effects: a `when`'s `then`, and a `route`'s `to` (an addEventFrom); a `scene` opens room `key`.
        const flat = (efs: Effect[]): Effect[] => efs.flatMap((ef) => (ef.kind === 'gn' ? [ef, ...flat([...(ef.then ?? []), ...(ef.to ? [ef.to] : [])] as Effect[])] : [ef]));
        for (const ef of flat(lists.flat())) {
          // Catalog Overhaul markets: a stall that stays open after a question opens itself again (not a room: it is drawn on its own
          // too), and the Game Corner opens its games, which are also drawn on their own (SF91).
          // An event that opens itself again ("Read it again.", "What's on?") re-shows the same stop; that is not a room.
          if (ef.kind === 'addEvent' && (ef.eventId === e.id || e.id === 'game-corner') && !content.events.get(ef.eventId)?.room) continue;
          // Volume III: `{region}` is filled in play (one Offer per region): every region's room counts as opened.
          if (ef.kind === 'addEvent' && ef.eventId.includes('{region}')) {
            const [head, tail] = ef.eventId.split('{region}') as [string, string];
            for (const id of content.events.keys()) if (id.startsWith(head) && id.endsWith(tail)) opened.add(id);
          } else if (ef.kind === 'addEvent' && ef.eventId !== e.id) opened.add(ef.eventId);
          if (ef.kind === 'gn' && ef.op === 'scene' && (ef.key !== e.id || content.events.get(ef.key!)?.room)) opened.add(ef.key!); // a scene beside the current node
          if (ef.kind === 'gn' && ef.op === 'ahead' && ef.key) opened.add(ef.key); // a stop on the nodes just ahead (gn.new.26)
          if (ef.kind === 'laterEvent') queued.add(ef.eventId);
          // Catalog Overhaul markets: a prize row that needs its own scene opens it (core/market.ts prize).
          if (ef.kind === 'market') for (const row of ef.table ?? []) if (row.event) opened.add(row.event);
          if (ef.kind === 'addEventFrom') ef.ids.forEach((i) => opened.add(i));
          // Rival questlines (core/rivals/questlines.ts): the first scene whose conditions hold, or stops further along the map.
          // These may also open a scheduled beat (not a room), so they only count as a way into a room.
          if (ef.kind === 'rivalQuest') {
            ef.openFirst?.forEach((i) => questOpened.add(i));
            ef.ahead?.forEach((a) => questOpened.add(a.event));
          }
          // Catalog Overhaul mentors: a shared scene opens the run's mentor's own `mentor-<id>-<part>` (core/mentors/lessons.ts mentorSceneId).
          // Its Recruit and Story are catalog events it can also open, so these count only as a way in to a room.
          if (ef.kind === 'mentorScene') for (const m of MENTORS) viaMentor.add(`mentor-${m.id}-${ef.part}`);
          // Rival questlines (core/rivals/questlines.ts): the first scene whose conditions hold, or stops further along the map.
          // These may also open a scheduled beat (not a room), so they only count as a way into a room.
          if (ef.kind === 'rivalQuest') {
            ef.openFirst?.forEach((i) => questOpened.add(i));
            ef.ahead?.forEach((a) => questOpened.add(a.event));
          }
        }
      }
    }
    // Kanto canon: follow-up scenes and road rows are placed by code (core/expansion/canonKantoPlaced.ts).
    for (const r of [...canonKantoPlaced.followups, ...canonKantoPlaced.routes]) queued.add(r.event);

    // Ideas W4: rooms opened by a traversal obstacle, and stops the code places (wanderer, treasure map, landmarks).
    for (const o of TRAVERSAL.obstacles) for (const ef of o.pass) if (ef.kind === 'addEvent') opened.add(ef.eventId);
    // (The W4 wanderer's two scenes are R13's now, The One Who Follows: they open from the rival questline, not from code.)
    for (const id of [TREASURE_DIG_EVENT]) opened.add(id);
    // Catalog Overhaul SF161: a Battle Moment with an after-battle choice opens its room beside the next node (core/drama/events.ts).
    for (const d of DRAMA_LIBRARY.events) if (d.after) opened.add(d.after);
    // A game event places its own room on the map (a `placeEvent` modifier, e.g. the Looping Forest).
    for (const g of content.gameEvents.values()) for (const m of g.modifiers) if (m.kind === 'placeEvent') opened.add(m.eventId);
    for (const e of content.events.values()) if (e.stop === LANDMARK_STOP) opened.add(e.id);
    // Beta 0.7: a pseudo-stage's rooms are the nodes of its own map (core/dungeon/pseudo.ts), entered by walking there.
    for (const r of PSEUDO.records) for (const n of r.nodes) opened.add(`${r.id.replace(/_/g, '-')}-${n.id}`);
    // Catalog Overhaul: a chain pseudo-stage with a layout (the Evil Team Hideouts) places its rooms by column.
    for (const c of PSEUDO_CHAINS) for (const col of c.layout ?? []) for (const id of col) opened.add(c.team ? id.replaceAll('{teamId}', c.team) : id);
    // Catalog Overhaul SF63: the helped rare Pokémon's thanks is queued by code after it strikes (core/events/coHelpers.ts `co:soon`).
    opened.add('wounded-rare-thanks');
    // Catalog Overhaul SF73: the Mystery Dungeon's rooms are drawn by code, floor by floor (core/events/coDungeon.ts).
    for (const id of [...familiesC.dungeon.floors.flat(), familiesC.dungeon.spring, familiesC.dungeon.noShop]) opened.add(id);
    // Beta 0.7 U1: the code places each Ultra Beast Tear (core/ultra/run.ts placeTear).
    for (const id of content.events.keys()) if (id.startsWith('ultra-tear-')) opened.add(id);
    // Beta 0.7: Pidgey's Resolve places its join rooms from code (core/sky/story.ts pushRoom).
    for (const id of content.events.keys()) if (id.startsWith('sky.join.')) opened.add(id);
    // gn.14: the Labyrinth ghost's return is placed by code (core/expansion/canonRun.ts addGhostReturnStop).
    opened.add('gn-14-return');
    // gn.16: the Tournament rival's return is placed by code too (addRivalReturnStop).
    opened.add('gn-16-rival-return');
    // Rivalry weeks (legends row C): the rival's scene is placed in every pseudo-stage by code (core/co/weeks.ts rivalInPseudo).
    opened.add('co-week-rival');
    // gn.60: the Pokémon that followed you walks in beside a rest (core/greenneedle/followed.ts followedRest).
    opened.add('gn-60-reveal');
    // Catalog Overhaul: a placed event (core/co/placement.ts) is put on the map at its home step, room or not.
    for (const id of content.coPlacement?.keys() ?? []) opened.add(id);
    // gn.29: the lake opens when the Snake game ends (core/greenneedle/snakeEnd.ts psyduckFinish).
    opened.add('gn-29-lake');
    // gn.51: the rescued Pokémon's scene opens beside a rest stop (core/greenneedle/smuggling.ts smuggleRest); gn.53: the siege's rescued Pokémon (citysiege.ts sgRest).
    opened.add('gn-51-rest');
    opened.add('gn-53-waiting');
    // gn.49: the following Snorlax's scene at a rest stop (snorlax.ts snorlaxAsk).
    opened.add('gn-49-follower');
    // gn.62: the prison moves you between its rooms from code (core/greenneedle/prison.ts prNext).
    // gn.new.03: the Poké Ball's rest and hatch scenes open beside a rest from code (core/greenneedle/ball.ts).
    opened.add('gn-new-03-rest');
    opened.add('gn-new-03-hatch');
    // gn.new.14: the cabinet's games are a minigame now. Clearing all three opens the last room from code
    // (core/greenneedle/arcadeEnd.ts); the six rooms of the earlier version stay only for runs saved inside one.
    for (const id of ['clear', 'maze', 'stacker', 'shooter', 'maze-lost', 'stacker-lost', 'shooter-lost']) opened.add(`gn-new-14-${id}`);
    // gn.19, gn.20: the Deep Savanna and the Lush Jungle are walked; the walk puts the first room at its place (core/greenneedle/zoneEnd.ts zoneBegin).
    for (const z of Object.values(ZONES)) opened.add(z.first);
    for (const id of ['gn-62-hub', 'gn-62-warden', 'gn-62-warden-bare', 'gn-62-caught', 'gn-62-wing', 'gn-62-cell-room']) opened.add(id);
    // Damian's "Go again." (gn.05) opens his next meeting, an ordinary drawn event, at once; anything else opened must be a room.
    const drawnToo = new Set(['gn-05-barn', 'gn-05-hall', 'gn-05-gym']);
    // Row 17: a rest moment opens its camp scene beside the stop (core/moments/runMoments.ts openEvent).
    for (const m of POKEMON_MOMENTS) if (m.effect?.openEvent) opened.add(m.effect.openEvent);
    for (const id of opened) if (!content.coPlacement?.has(id) && !drawnToo.has(id)) expect(content.events.get(id)?.room, id).toBe(true);
    // A retired room (Catalog Overhaul REMOVE: kept for saved runs, never drawn) need not be reachable.
    for (const e of content.events.values()) if (e.room && !e.disabled) expect(opened.has(e.id) || retiredOpened.has(e.id) || viaMentor.has(e.id) || queued.has(e.id) || questOpened.has(e.id), e.id).toBe(true);
  });

  it('a Mystery Dungeon floor picks its next room from the floor below', () => {
    let run = atEvent(newRun(), 'md-entrance');
    run = chooseEvent(content, run, 'test-event', 0).run;
    const here = findNode(run.stage!.map, run.stage!.current!);
    const room = here.sides.find((s) => s.eventId?.startsWith('md-1-'));
    expect(room).toBeDefined();
  });

  it('the Tower of Legends has five floors', () => {
    for (let i = 1; i <= 5; i++) expect(content.events.get(`tower-${i}`)?.room, `tower-${i}`).toBe(true);
  });
});

describe('limited-time events', () => {
  it('six new weekly events exist and feature only events that exist', () => {
    for (const id of ['legendary-beasts-chase', 'campfire-tales-week', 'plasma-operation', 'hidden-path-week', 'mystery-dungeon-week', 'tower-of-legends']) {
      const g = content.gameEvents.get(id);
      expect(g, id).toBeDefined();
      expect(g!.kind).toBe('weekly');
      for (const e of g!.mapEvents) expect(content.events.has(e), `${id}: ${e}`).toBe(true);
    }
  });

  it("an event's own stops only appear while it is on, and always get a stop on a stage", () => {
    const run = newRun();
    run.stage!.map.nodes.forEach((n) => (n.sides = []));
    addEventStops(content, run);
    expect(eventStops(run).some((s) => s.side.eventId === 'md-entrance')).toBe(false);
    run.gameEvents = ['mystery-dungeon-week@2026-W44'];
    run.stage!.map.nodes.forEach((n) => (n.sides = []));
    addEventStops(content, run);
    expect(eventStops(run).some((s) => s.side.eventId === 'md-entrance')).toBe(true);
  });

  it('the Plasma Operation unfolds over its three stops', () => {
    let run = newRun();
    run.gameEvents = ['plasma-operation@2026-W44'];
    run = atEvent(run, 'plasma-op-1');
    run = chooseEvent(content, run, 'test-event', 2).run;
    expect(run.story.flags['ev:plasma-op']).toBe(1);
    run.stage!.map.nodes.forEach((n) => (n.sides = []));
    addEventStops(content, run);
    expect(eventStops(run).some((s) => s.side.eventId === 'plasma-op-2')).toBe(true);
  });
});

describe('convoy mode', () => {
  const escort = (c: Content = content): RunState => {
    const run = atEvent(newRun(c), 'convoy-lost-researcher');
    return chooseEvent(c, run, 'test-event', 0).run;
  };

  it('an escort event starts a convoy, and not a second one', () => {
    const run = escort();
    expect(run.stage!.convoy).toEqual({ name: 'the researcher', hp: 4, maxHp: 4 });
    expect(eligibleEvents(content, run).some((e) => e.id === 'convoy-lost-researcher')).toBe(false);
  });

  it('battle nodes strike it by a seeded roll, guards soften the blow, and 0 health loses it', () => {
    const hard = withWorld({ convoyHitChance: 1, convoyHit: [2, 2], convoyGuardAbilities: [] });
    const run = escort(hard);
    const node = run.stage!.map.nodes.find((n) => n.kind === 'wild')!;
    convoyStep(hard, run, node);
    expect(run.stage!.convoy!.hp).toBe(2);
    const twin = escort(hard);
    convoyStep(hard, twin, node);
    expect(twin.stage!.convoy).toEqual(run.stage!.convoy);
    convoyStep(hard, run, node);
    expect(run.stage!.convoy).toBeNull();
    expect(run.story.flags['ev:convoy-lost']).toBe(1);
  });

  it('a living escort is delivered at the gym for money; nothing happens with no escort', () => {
    const run = escort();
    run.stage!.convoy!.hp = 3;
    const money = run.money;
    convoyStep(content, run, run.stage!.map.nodes.find((n) => n.kind === 'gym')!);
    expect(run.money).toBe(money + content.balance.world.convoyReward + 3 * content.balance.world.convoyRewardPerHp);
    expect(run.story.flags['ev:convoy-delivered']).toBe(1);
    expect(run.stage!.convoy).toBeNull();
    const none = newRun();
    convoyStep(content, none, none.stage!.map.nodes[0]!);
    expect(none.stage!.convoy).toBeNull();
  });

  it('healing stops at full health, and an old stage loads with no convoy', () => {
    const run = escort();
    run.stage!.convoy!.hp = 1;
    healConvoy(run, 9);
    expect(run.stage!.convoy!.hp).toBe(4);
    const { convoy: _c, ...old } = JSON.parse(JSON.stringify(run.stage));
    expect(StageStateSchema.parse(old).convoy).toBeNull();
  });
});

describe('saves', () => {
  it('a stage saved before these fields existed still loads, with the defaults', () => {
    const run = newRun();
    const { scoutedTo: _s, extraFronts: _f, roamers: _r, ...old } = run.stage!;
    const parsed = StageStateSchema.parse(old);
    expect(parsed.scoutedTo).toBe(0);
    expect(parsed.extraFronts).toEqual([]);
    expect(parsed.roamers).toEqual([]);
  });

  it('a stage with a roamer, a front and a scouted map round-trips through JSON', () => {
    const run = newRun(withWorld({ roamerChance: 1, roamerMinStage: 1 }), 'save');
    run.stage!.scoutedTo = 7;
    run.stage!.extraFronts.push({ weather: 'rain', from: 2, to: 4 });
    expect(StageStateSchema.parse(JSON.parse(JSON.stringify(run.stage)))).toEqual(run.stage);
  });
});
