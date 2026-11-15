import { describe, expect, it } from 'vitest';
import { chooseEvent } from '../../src/core/events';
import { chooseStarter, createRun, debugForceEvent } from '../../src/core/run';
import { buildTownMenu } from '../../src/core/expansion/canonSpaces';
import { chainRooms, PSEUDO_CHAINS } from '../../src/core/dungeon/pseudo';
import { canonKanto, canonKantoPlaced } from '../../src/data/expansion';
import { content } from './helpers';

// KANTO_PLACED_5 (catalog overhaul): the eleven roads between, and the Sevii Islands as one Pseudo Stage.
const begin = (seed: string) => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { kantoCanon: true } }), 0);
type Run = ReturnType<typeof begin>;
const room = (id: string) => content.events.get(id)!;
const set = (run: Run, key: string, n = 1) => { run.story.flags[`ev:${key}`] = n; };
const flagOf = (run: Run, key: string) => Number(run.story.flags[`ev:${key}`] ?? 0);
const play = (id: string, choice: number, tweak?: (r: Run) => void) => {
  const base = begin('SV');
  tweak?.(base);
  const { run, sideId } = debugForceEvent(content, structuredClone(base), id);
  return chooseEvent(content, run, sideId, choice).run;
};
const locked = (id: string, choice: number, tweak?: (r: Run) => void) => () => play(id, choice, tweak);
const outs = (id: string) => room(id).choices.flatMap((c) => [c.success, c.failure]).filter(Boolean)
  .flatMap((o) => [...o!.effects, ...(o!.battle?.win ?? []), ...(o!.battle && 'lose' in o!.battle ? o!.battle.lose ?? [] : [])])
  .flatMap((e) => (e.kind === 'addEvent' || e.kind === 'laterEvent' ? [e.eventId] : e.kind === 'addEventFrom' ? e.ids : []));
const NET = 'cs-kanto-sevii-network';

describe('The Sevii Islands: the map', () => {
  it('every target exists, and every Sevii room is reached from the man on the dock', () => {
    const ids = [...content.events.keys()].filter((id) => id.startsWith('cs-kanto-sevii-') && !room(id).disabled);
    expect(ids.length).toBeGreaterThan(80);
    const reach = new Set<string>([NET]);
    for (let again = true; again;) { again = false; for (const id of [...reach]) for (const t of outs(id)) { expect(content.events.has(t), `${id} -> ${t}`).toBe(true); if (!reach.has(t)) { reach.add(t); again = true; } } }
    expect(ids.filter((id) => !reach.has(id))).toEqual([]);
  });
  it('the ferry sits on Cinnabar\'s menu every run, and the island places never roll on a menu', () => {
    for (let i = 0; i < 20; i++) {
      const menu = buildTownMenu(canonKanto, { seed: `SV${i}`, slot: 'stage-7', flags: new Set(), completed: new Set() });
      expect(menu).toContain('cs.kanto.sevii.network');
      expect(menu.filter((m) => m.startsWith('cs.kanto.sevii.') && m !== 'cs.kanto.sevii.network')).toEqual([]);
    }
    expect(canonKanto.spaces.filter((s) => s.id.startsWith('cs.kanto.sevii.')).length).toBe(25); // the ferry and Network Center (one space), 17 island places, 2 far islands, 5 more (KANTO_PLACED_6)
  });
});

describe('The Sevii maps', () => {
  const sevii = PSEUDO_CHAINS.filter((c) => c.entry.startsWith('cs-kanto-sevii-'));
  it('One Island and each of the six islands is its own small stage map, no column more than six rooms tall', () => {
    expect(sevii.map((c) => c.name).sort()).toEqual(['Five Island', 'Four Island', 'Seven Island', 'Six Island', 'The Sevii Islands', 'Three Island', 'Two Island']);
    const seen = new Set<string>();
    for (const c of sevii) {
      const rooms = chainRooms(content, c);
      const tall = Math.max(...[...new Set(rooms.map((r) => r.depth))].map((d) => rooms.filter((r) => r.depth === d).length));
      expect(tall, c.name).toBeLessThanOrEqual(6);
      for (const r of rooms) { expect(seen.has(r.event), r.event).toBe(false); seen.add(r.event); }
    }
  });
  it('played through: the dock, the Center, the board, the crossing, and Two Island\'s own map', () => {
    const start = begin('SV-walk');
    let { run, sideId } = debugForceEvent(content, structuredClone(start), NET);
    const side = (id: string) => {
      const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
      return here.sides.find((x) => x.eventId === id && !x.used)!.id;
    };
    run = chooseEvent(content, run, sideId, 0).run; // "Take me."
    expect(run.stage!.pseudo?.name).toBe('The Sevii Islands');
    run = chooseEvent(content, run, side(`${NET}-center`), 0).run;
    run = chooseEvent(content, run, side(`${NET}-knot`), 2).run; // the ferry board
    run = chooseEvent(content, run, side(`${NET}-board`), 0).run; // Two Island
    expect(run.stage!.pseudo ?? null).toBe(null);
    run = chooseEvent(content, run, side(`${NET}-sail-two`), 0).run; // step ashore
    expect(run.stage!.pseudo?.name).toBe('Two Island');
    expect(run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.roomEvent).toBe(`${NET}-two`);
    run = chooseEvent(content, run, side(`${NET}-two`), 3).run; // back to the ferry
    expect(run.stage!.pseudo ?? null).toBe(null);
    run = chooseEvent(content, run, side(NET), 0).run; // the Captain: with the pass, only "Back to One Island" shows
    expect(run.stage!.pseudo?.name).toBe('The Sevii Islands');
    expect(run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.roomEvent).toBe(`${NET}-knot`);
  });
  it('a ferry trip goes to the island\'s crossing; the crossing steps onto the dock; the dock sails back by the Captain', () => {
    expect(room(`${NET}-board`).choices[0]!.success.effects).toContainEqual({ kind: 'addEvent', eventId: `${NET}-sail-two` });
    expect(room(`${NET}-sail-two`).choices[0]!.success.effects).toContainEqual({ kind: 'addEvent', eventId: `${NET}-two` });
    expect(outs(`${NET}-two`)).toContain(NET);
    // With the pass, the Captain's only choice is back to One Island.
    const back = room(NET).remembers.find((v) => v.id === 'pass')!;
    expect(back.hide).toEqual([0, 1, 2]);
    expect(room(NET).choices[3]!.success.effects).toContainEqual({ kind: 'addEvent', eventId: `${NET}-knot` });
  });
});

describe('The ferry board', () => {
  it('a trip spends one of the three, and a fourth is refused', () => {
    const after = play(`${NET}-board`, 0);
    expect(flagOf(after, 'kanto-sevii-trips')).toBe(1);
    expect(flagOf(after, 'kanto-sevii-two')).toBe(1);
    expect(locked(`${NET}-board`, 0, (r) => set(r, 'kanto-sevii-trips', 3))).toThrow();
    expect(locked(`${NET}-board`, 1, (r) => set(r, 'kanto-sevii-three'))).toThrow(); // already been
  });
  it('the Missing Girl puts Three Island on the pass free', () => {
    const after = play('cs-kanto-sevii-missing', 1);
    expect(flagOf(after, 'kanto-sevii-three')).toBe(1);
    expect(flagOf(after, 'kanto-sevii-trips')).toBe(0);
  });
  it('the far islands need their tickets', () => {
    expect(locked(`${NET}-far`, 0)).toThrow();
    expect(() => play(`${NET}-far`, 0, (r) => set(r, 'kanto-mystic-ticket'))).not.toThrow();
  });
});

describe('The Ruby, the password and the Sapphire', () => {
  it('the warehouse door needs both halves; one half sends you back', () => {
    expect(locked('cs-kanto-sevii-warehouse', 0, (r) => set(r, 'kanto-sevii-password1'))).toThrow();
    expect(() => play('cs-kanto-sevii-warehouse', 0, (r) => { set(r, 'kanto-sevii-password1'); set(r, 'kanto-sevii-password2'); })).not.toThrow();
    expect(outs('cs-kanto-sevii-warehouse')).toContain(`${NET}-five`);
  });
  it('Celio pays one Network Machine for the Ruby, and a second for both stones', () => {
    const one = play(`${NET}-celio`, 0, (r) => set(r, 'kanto-sevii-ruby'));
    expect(flagOf(one, 'kanto-sevii-machine')).toBe(1);
    expect(room(`${NET}-celio`).choices[0]!.success.effects).toContainEqual({ kind: 'item', id: 'network-machine', count: 1 });
    expect(locked(`${NET}-celio`, 1, (r) => set(r, 'kanto-sevii-ruby'))).toThrow();
    const two = play(`${NET}-celio`, 1, (r) => { set(r, 'kanto-sevii-ruby'); set(r, 'kanto-sevii-sapphire'); set(r, 'kanto-sevii-machine'); });
    expect(flagOf(two, 'kanto-sevii-wall')).toBe(1);
  });
  it('the Growing Stall\'s shelves grow with the places done', () => {
    expect(locked('cs-kanto-sevii-stall', 1)).toThrow();
    expect(() => play('cs-kanto-sevii-stall', 1, (r) => set(r, 'kanto-sevii-places', 3))).not.toThrow();
    expect(locked('cs-kanto-sevii-stall', 2, (r) => set(r, 'kanto-sevii-places', 5))).toThrow();
  });
});

describe('The roads between', () => {
  it('each route space is a road row for its doc stages', () => {
    const rows = new Map(canonKantoPlaced.routes.map((r) => [r.event, r.stages]));
    const want: Record<string, number[]> = { song: [1, 2, 3, 4, 5, 6, 7, 8], darkcity: [3, 4, 5, 6], canyon: [2, 3, 4, 5, 6], daycare: [3, 4, 5, 6, 7], estate: [4, 5, 6, 7], leek: [2, 3, 4, 5], hero: [1, 2, 3, 4, 5, 6, 7, 8], film: [3, 4, 5, 6, 7], badges: [6, 7, 8], buried: [4, 5, 6, 7, 8] };
    for (const [k, stages] of Object.entries(want)) expect(rows.get(`cs-kanto-route-${k}`), k).toEqual(stages);
    expect(rows.has('cs-kanto-route-egg')).toBe(false); // the egg is opened five nodes after the Fossil Rush, never rolled
  });
  it('the Song: falling asleep leaves a second chance at the Sleeper on the Beach', () => {
    const after = play('cs-kanto-route-song', 0);
    expect(flagOf(after, 'kanto-song-missed')).toBe(1);
    const sleeper = room('cs-kanto-cinnabar-sleeper').remembers.find((r) => r.id === 'song')!;
    expect(sleeper.addChoices[0]!.success.effects).toContainEqual({ kind: 'addEvent', eventId: 'cs-kanto-route-song-v1' });
  });
  it('the Fossil Rush queues the egg five nodes on', () => {
    expect(room('cs-kanto-route-canyon-rim').choices[0]!.success.effects).toContainEqual({ kind: 'laterEvent', eventId: 'cs-kanto-route-egg', nodes: 5 });
  });
  it('Dark City\'s inspector ends it with no battle', () => {
    const after = play('cs-kanto-route-darkcity', 3);
    expect(flagOf(after, 'kanto-route-darkcity')).toBe(1);
    expect(room('cs-kanto-route-darkcity').choices[3]!.success.battle).toBeUndefined();
  });
});
