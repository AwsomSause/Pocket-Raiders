import { describe, expect, it } from 'vitest';
import { eligibleEvents } from '../../src/core/events';
import { PSEUDO, pseudoEvents, pseudoGateId, validateAllPseudo, validatePseudo } from '../../src/core/dungeon/pseudo';
import { chooseNode, chooseStarter, createRun, pseudoLost } from '../../src/core/run';
import { chooseEvent } from '../../src/core/events';
import { buildChainStage, chainRooms, routeChainEvent, settleChain, buildPseudoStage, enterPseudoStage, leavePseudoStage } from '../../src/core/dungeon/pseudo';
import { maxHp } from '../../src/core/pokemon';
import { content } from './helpers';

const newRun = (seed: string) => structuredClone(chooseStarter(content, createRun(content, { runId: 'ps', seed, archetypeId: 'red' }), 0));

describe('W7 pseudo stage records', () => {
  it('has the 10 records, each valid (3 to 6 rooms, every branch reaches the exit), and none counts as a stage', () => {
    expect(PSEUDO.records).toHaveLength(10);
    expect(validateAllPseudo()).toEqual([]);
    expect(PSEUDO.records.filter((r) => r.countsAsStage).map((r) => r.id)).toEqual([]);
    // Eight are opened by events (pseudo-openers.json adds Safari, Dreamscape, Celestial Expanse); Distortion World is opened by Dimensional Collision.
    // The Evil Hideout is off: Catalog Overhaul SF13 gives every team its own Hideout as a chain pseudo-stage (ps_evil_hideout_<team>), and its opener ev-hidden-hideout is retired.
    expect(PSEUDO.records.filter((r) => r.status === 'disabled').map((r) => r.id).sort()).toEqual(['ps_evil_hideout']);
    expect(PSEUDO.records.filter((r) => r.status !== 'disabled').every((r) => r.status === 'limited')).toBe(true);
  });
  it('rejects a record that breaks the rules', () => {
    const base = structuredClone(PSEUDO.records[0]!);
    expect(validatePseudo({ ...base, countsAsStage: true }).join()).toMatch(/never counts as a stage/);
    expect(validatePseudo({ ...base, reward: { item: 'ultra-ball', count: 9 } }).join()).toMatch(/reward over/);
    expect(validatePseudo({ ...base, nodes: [{ id: 'a', kind: 'wild', next: ['b'] }, { id: 'b', kind: 'exit', next: [] }] as never }).length).toBeGreaterThan(0);
  });
});

describe('W7 gates and rooms', () => {
  it('every gate offers Leave and Enter before any fight (P2) and every room is in the live content', () => {
    const live = PSEUDO.records.filter((r) => r.status !== 'disabled');
    for (const r of live) {
      const gate = content.events.get(pseudoGateId(r))!;
      expect(gate.room).toBe(true);
      expect(gate.choices.map((c) => c.label)).toEqual([`Enter ${r.name}`, 'Leave']);
      expect(gate.choices.every((c) => !c.success.battle)).toBe(true);
    }
    expect(pseudoEvents().length).toBe(live.length + live.reduce((n, r) => n + r.nodes.length, 0));
  });
  it('every battle inside a pseudo stage is marked so a loss ejects (P5)', () => {
    for (const e of pseudoEvents() as { id: string; choices: { success: { battle?: { pseudo?: boolean } }; failure?: { battle?: { pseudo?: boolean } } }[] }[]) {
      for (const c of e.choices) for (const o of [c.success, c.failure]) if (o?.battle) expect(o.battle.pseudo, e.id).toBe(true);
    }
  });
  it('the boss reward is not doubled: the boss win adds no extra reward item (P4)', () => {
    const rooms = pseudoEvents() as { id: string; choices: { success: { effects: { kind: string; id?: string }[]; battle?: { win: { kind: string }[] } } }[] }[];
    for (const r of PSEUDO.records.filter((x) => x.status !== 'disabled')) {
      const boss = r.nodes.filter((n) => n.kind === 'boss').map((n) => r.id.replace(/_/g, '-') + '-' + n.id);
      const items = rooms.filter((e) => boss.includes(e.id)).flatMap((e) => e.choices.flatMap((c) => [...c.success.effects, ...(c.success.battle?.win ?? [])])).filter((x) => x.kind === 'item' && (x as { id?: string }).id === r.reward.item);
      expect(items.length, r.id).toBe(0);
    }
  });
  it('a loss ejects with a partial heal and the run goes on, without touching stage, badges or regions (P1, P5)', () => {
    const run = newRun('p5');
    run.party.forEach((m) => { m.hp = 0; m.status = { id: 'psn' } as never; });
    const before = { stage: run.stage?.index, badges: run.badges.length, cleared: run.regionsCleared.length, region: run.regionIndex };
    pseudoLost(content, run);
    expect(run.party.every((m) => m.hp === Math.max(1, Math.floor(maxHp(content, m) * PSEUDO.rules.failureHeal)) && m.status === null)).toBe(true);
    expect(run.phase).toBe('map');
    expect({ stage: run.stage?.index, badges: run.badges.length, cleared: run.regionsCleared.length, region: run.regionIndex }).toEqual(before);
  });
});

describe('W7 caps (P3)', () => {
  const entry = 'ev-trainer-tournament';
  const offered = (run: ReturnType<typeof newRun>) => eligibleEvents(content, run).some((e) => e.id === entry);
  it('1 per region, 2 per run, and never in a League stage or a blocked campaign', () => {
    const run = newRun('p3');
    run.regionIndex = 0;
    run.stage = { ...(run.stage as object), index: 3 } as never;
    expect(content.events.get(entry)!.pseudo).toBe(true);
    const fresh = structuredClone(run);
    run.itemCounters = { 'pseudo-seen:0': 1 };
    expect(eligibleEvents(content, run).some((e) => e.pseudo)).toBe(false);
    run.regionIndex = 1;
    expect(eligibleEvents(content, run).some((e) => e.id === 'ev-champions-invitation')).toBe(false); // needs reputation, not a cap
    run.itemCounters = { 'pseudo-seen:0': 1, 'pseudo-seen:1': 1 };
    run.regionIndex = 2;
    expect(eligibleEvents(content, run).some((e) => e.pseudo)).toBe(false);
    const blocked = structuredClone(fresh);
    blocked.campaignId = 'boss-rush';
    expect(offered(blocked)).toBe(false);
  });
});

describe('Beta 0.7 pseudo stages are real, drawn stages inside one node', () => {
  const live = PSEUDO.records.filter((r) => r.status !== 'disabled');
  it('every record builds a map like a stage: one start, reachable nodes, one exit at the end, a real theme and real room events', () => {
    const run = newRun('ps-map');
    for (const r of live) {
      const st = buildPseudoStage(r, run.stage!);
      expect(content.themes.has(st.themeId), r.id).toBe(true);
      expect(st.pseudo?.id).toBe(r.id);
      expect(st.index).toBe(run.stage!.index);
      expect(st.map.nodes.filter((n) => n.column === 1).length, r.id).toBe(1);
      const last = st.map.nodes.filter((n) => n.column === st.map.columns);
      expect(last.map((n) => n.roomKind), r.id).toEqual(['exit']);
      for (const n of st.map.nodes) {
        expect(content.events.has(n.roomEvent!), `${r.id} ${n.id}`).toBe(true);
        if (n.column > 1) expect(st.map.nodes.some((p) => p.next.includes(n.id)), `${r.id} ${n.id} unreachable`).toBe(true);
        if (n.column < st.map.columns) expect(n.next.length, `${r.id} ${n.id} dead end`).toBeGreaterThan(0);
      }
    }
  });
  it('enter keeps the parent aside, leave brings the same stage back on the same node, and a second enter does nothing', () => {
    const run = newRun('ps-enter');
    run.stage!.current = run.stage!.map.nodes.find((n) => n.column === 1)!.id;
    const parent = structuredClone(run.stage);
    enterPseudoStage(content, run, 'ps_safari_zone');
    expect(run.stage!.pseudo?.id).toBe('ps_safari_zone');
    expect(run.stage!.current).toBeNull();
    enterPseudoStage(content, run, 'ps_battle_frontier');
    expect(run.stage!.pseudo?.id).toBe('ps_safari_zone');
    leavePseudoStage(run);
    expect(run.stage).toEqual(parent);
    expect(run.pseudoParent).toBeUndefined();
    leavePseudoStage(run);
    expect(run.stage).toEqual(parent);
  });
  it('walking a pseudo map opens each node\'s room event, never adds a stage or node, and the exit room walks back out', () => {
    const run = newRun('ps-walk');
    run.phase = 'map';
    run.stage!.current = run.stage!.map.nodes.find((n) => n.column === 1)!.id;
    const parentNode = run.stage!.current;
    const nodes = run.stage!.map.nodes.length;
    enterPseudoStage(content, run, 'ps_safari_zone');
    let cur = run;
    for (let i = 0; i < 4; i++) {
      const next = cur.stage!.map.nodes.find((n) => cur.stage!.current === null ? n.column === 1 : n.id === (cur.stage!.map.nodes.find((x) => x.id === cur.stage!.current)!.next[0]));
      cur = chooseNode(content, cur, next!.id);
      const side = cur.stage!.map.nodes.find((n) => n.id === cur.stage!.current)!.sides.find((x) => x.kind === 'event' && !x.used)!;
      expect(side.eventId).toBe(next!.roomEvent);
      if (cur.stage!.map.nodes.find((n) => n.id === cur.stage!.current)!.roomKind === 'exit') {
        cur = chooseEvent(content, cur, side.id, 0).run;
        break;
      }
      // Skip the fights: mark the room done as if it were won.
      cur = structuredClone(cur);
      side.used = true;
      cur.stage!.map.nodes.find((n) => n.id === cur.stage!.current)!.sides.find((x) => x.id === side.id)!.used = true;
    }
    expect(cur.stage!.pseudo).toBeUndefined();
    expect(cur.stage!.current).toBe(parentNode);
    expect(cur.stage!.map.nodes.length).toBe(nodes);
    expect(cur.stage!.index).toBe(0);
  });
  it('a lost fight inside ejects back to the parent stage', () => {
    const run = newRun('ps-lose');
    run.stage!.current = run.stage!.map.nodes.find((n) => n.column === 1)!.id;
    enterPseudoStage(content, run, 'ps_battle_frontier');
    pseudoLost(content, run);
    expect(run.stage!.pseudo).toBeUndefined();
    expect(run.pseudoParent).toBeUndefined();
  });
});

describe('Beta 0.7 the Kanto event lines are pseudo stages', () => {
  it('Flight North, the Labyrinth, Route 25 and the Tournament each draw a map from their own events, keeping every room', () => {
    expect(PSEUDO.chains.map((c) => c.id)).toEqual(['ps_flight_north', 'ps_sabrinas_labyrinth', 'ps_route_25', 'ps_fighting_tournament', 'ps_rival_race']);
    const run = newRun('ps-chain');
    for (const c of PSEUDO.chains) {
      expect(content.events.has(c.entry), c.id).toBe(true);
      expect(content.themes.has(c.themeId), c.id).toBe(true);
      const rooms = chainRooms(content, c);
      expect(rooms.length, c.id).toBeGreaterThan(5);
      const st = buildChainStage(content, c, run.stage!);
      expect(st.map.nodes.filter((n) => n.column === 1).length, c.id).toBeGreaterThan(0);
      for (const n of st.map.nodes) if (n.column > 1) expect(st.map.nodes.some((p) => p.next.includes(n.id)), `${c.id} ${n.roomEvent}`).toBe(true);
    }
    // Nothing is cut: every event of the Labyrinth chain is a node.
    const lab = chainRooms(content, PSEUDO.chains[1]!).map((r) => r.event);
    for (const id of ['lab-lost', 'lab-ghost', 'lab-n1', 'lab-n6', 'lab-final']) expect(lab).toContain(`cs-kanto-saffron-${id}`);
  });
  it('the entry opens the stage, rooms walk the player along the map, and the last room walks back out', () => {
    const run = newRun('ps-chain-walk');
    run.stage!.current = run.stage!.map.nodes.find((n) => n.column === 1)!.id;
    const parent = structuredClone(run.stage);
    expect(routeChainEvent(content, run, 'cs-kanto-saffron-lab-lost')).toBe(true);
    expect(run.stage!.pseudo?.id).toBe('ps_sabrinas_labyrinth');
    expect(run.stage!.current).toBeNull();
    expect(routeChainEvent(content, run, 'cs-kanto-saffron-lab-ghost')).toBe(true);
    expect(run.stage!.current).toBeNull(); // still choosing the start
    run.stage!.current = run.stage!.map.nodes.find((n) => n.roomEvent === 'cs-kanto-saffron-lab-lost')!.id;
    expect(routeChainEvent(content, run, 'cs-kanto-saffron-lab-ghost')).toBe(true);
    const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
    expect(here.roomEvent).toBe('cs-kanto-saffron-lab-ghost');
    expect(here.sides.filter((x) => !x.used).map((x) => x.eventId)).toEqual(['cs-kanto-saffron-lab-ghost']);
    // the final room, once played, leaves
    run.stage!.current = run.stage!.map.nodes.find((n) => n.roomEvent === 'cs-kanto-saffron-lab-final')!.id;
    const last = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
    last.sides.push({ id: 'x', kind: 'event', used: true, eventId: last.roomEvent });
    settleChain(run);
    expect(run.stage).toEqual(parent);
  });
  it('Route 25 handing over to the Tournament leaves the stage so the Tournament opens on the parent node as before', () => {
    const run = newRun('ps-chain-link');
    run.stage!.current = run.stage!.map.nodes.find((n) => n.column === 1)!.id;
    routeChainEvent(content, run, 'cs-kanto-saffron-r25-1');
    expect(run.stage!.pseudo?.id).toBe('ps_route_25');
    expect(routeChainEvent(content, run, 'cs-kanto-saffron-tournament')).toBe(false);
    expect(run.stage!.pseudo).toBeUndefined();
  });
});
