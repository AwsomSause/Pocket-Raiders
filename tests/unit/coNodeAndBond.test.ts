// Catalog Overhaul: "(a node)" as a cost (takeNode), one-Pokémon selectors and the Bond-level condition.
import { describe, expect, it } from 'vitest';
import { EventDefSchema } from '../../src/core/contentSchema';
import { chooseEvent, conditionMet, eventView } from '../../src/core/events';
import { chooseNode, chooseStarter, createRun, mapChoices } from '../../src/core/run';
import { nodeProtected, spendTakenNode, takeNodeOwed } from '../../src/core/co/takeNode';
import { bondLevel, bondLevelFriendship, firstCatch, whoOf } from '../../src/core/co/who';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const EVENT = {
  id: 'test-co-node', name: 'The River', group: 'Test', intro: 'Two Alphas, one river.',
  choices: [
    { label: 'Dig a second channel (a node).', success: { text: 'A long afternoon.', effects: [{ kind: 'takeNode' }] } },
    { label: 'Dig two (two nodes).', success: { text: 'Two long afternoons.', effects: [{ kind: 'takeNode', nodes: 2 }] } },
    { label: 'Go back for the Flaaffy (a node back).', success: { text: 'You walk back.', effects: [{ kind: 'takeNode', back: true }] } },
    { label: 'Let mine call.', pick: { moveFlag: 'sound' }, success: { text: 'It roars.', effects: [{ kind: 'friendship', amount: 10, who: 'picked' }] } },
  ],
};

function setup(): RunState {
  const event = EventDefSchema.parse(EVENT);
  content.events.set(event.id, event);
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'co-node', archetypeId: 'red' }), 0);
  const node = run.stage!.map.nodes.find((n) => n.column === 1)!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'p', kind: 'event', used: false, eventId: event.id });
  return run;
}

describe('takeNode', () => {
  it('owes one node, then spends the next ordinary node: no battle, no reward, the level counts', () => {
    const run = chooseEvent(content, setup(), 'p', 0).run;
    expect(takeNodeOwed(run)).toBe(1);
    const next = mapChoices(content, run)[0]!;
    expect(['wild', 'trainer']).toContain(next.kind);
    const after = chooseNode(content, run, next.id);
    expect(after.phase).toBe('map');
    expect(after.battle).toBeNull();
    expect(after.stage!.current).toBe(next.id);
    expect(takeNodeOwed(after)).toBe(0);
    // The node after is fought as usual.
    const then = chooseNode(content, after, mapChoices(content, after)[0]!.id);
    expect(then.phase).not.toBe('map');
  });

  it('two nodes are spent one after the other; "a node back" costs nothing', () => {
    const two = chooseEvent(content, setup(), 'p', 1).run;
    expect(takeNodeOwed(two)).toBe(2);
    const a = chooseNode(content, two, mapChoices(content, two)[0]!.id);
    expect(takeNodeOwed(a)).toBe(1);
    const b = chooseNode(content, a, mapChoices(content, a)[0]!.id);
    expect(takeNodeOwed(b)).toBe(0);
    expect(b.phase).toBe('map');
    const back = chooseEvent(content, setup(), 'p', 2);
    expect(takeNodeOwed(back.run)).toBe(0);
    expect(back.changes.join(' ')).toContain('nothing is refought');
  });

  it('never takes a protected node: the Gym, or a node with a must-see stop; the work keeps till after', () => {
    const run = chooseEvent(content, setup(), 'p', 0).run;
    const gym = run.stage!.map.nodes.find((n) => n.kind === 'gym')!;
    expect(nodeProtected(content, run, gym)).toBe(true);
    expect(spendTakenNode(content, run, gym)).toEqual({ spent: false, text: "It'll keep till after." });
    expect(takeNodeOwed(run)).toBe(1);
    const forced = EventDefSchema.parse({ ...EVENT, id: 'test-co-must-see', forced: true });
    content.events.set(forced.id, forced);
    const next = run.stage!.map.nodes.find((n) => n.id === mapChoices(content, run)[0]!.id)!;
    next.sides.push({ id: 'must', kind: 'event', used: false, eventId: forced.id });
    expect(nodeProtected(content, run, next)).toBe(true);
    expect(nodeProtected(content, run, next, () => false)).toBe(true);
    const plain = run.stage!.map.nodes.find((n) => n.column === 3 && n.kind !== 'gym')!;
    expect(nodeProtected(content, run, plain, (n) => n.id === plain.id)).toBe(true);
  });

  it("moves the spent node's unused event stops one node on", () => {
    const run = chooseEvent(content, setup(), 'p', 0).run;
    const next = run.stage!.map.nodes.find((n) => n.id === mapChoices(content, run)[0]!.id)!;
    next.sides = [{ id: 'badge', kind: 'event', used: false, eventId: 'test-co-node' }, { id: 'rest', kind: 'heal', used: false }];
    const after = chooseNode(content, run, next.id);
    const here = after.stage!.map.nodes.find((n) => n.id === next.id)!;
    expect(here.sides.map((s) => s.id)).toEqual(['rest']);
    const ahead = after.stage!.map.nodes.find((n) => n.id === here.next[0])!;
    expect(ahead.sides.some((s) => s.id === 'badge-on' && s.eventId === 'test-co-node')).toBe(true);
  });
});

describe('one-Pokémon selectors and Bond levels', () => {
  function party(): RunState {
    const run = setup();
    const starter = run.party[0]!;
    starter.friendship = 60;
    const caught = { ...structuredClone(starter), uid: 'p7', friendship: 120, caughtBall: 'poke-ball' };
    const later = { ...structuredClone(starter), uid: 'p9', friendship: 255, caughtBall: 'great-ball' };
    run.party.push(caught, later);
    return run;
  }

  it('Bond level N is friendship N x 50, and level 5 is full friendship', () => {
    expect(bondLevelFriendship(content, 3)).toBe(150);
    expect(bondLevelFriendship(content, 5)).toBe(255);
    expect(bondLevel(content, { friendship: 149 })).toBe(2);
    expect(bondLevel(content, { friendship: 200 })).toBe(4);
    expect(bondLevel(content, { friendship: 254 })).toBe(4);
    expect(bondLevel(content, { friendship: 255 })).toBe(5);
  });

  it('finds the starter, the closest, the first catch and the newest', () => {
    const run = party();
    expect(whoOf(content, run, 'starter')[0]!.uid).toBe(run.log.starterUid);
    expect(whoOf(content, run, 'top')[0]!.uid).toBe('p9');
    expect(firstCatch(run)!.uid).toBe('p7');
    expect(whoOf(content, run, 'newest')[0]!.uid).toBe('p9');
    expect(whoOf(content, run, 'picked', 'p7')[0]!.uid).toBe('p7');
    const type = content.species.get(run.party[0]!.speciesId)!.types[0]!;
    expect(whoOf(content, run, { types: [type] })[0]!.uid).toBe(run.party[0]!.uid);
    expect(whoOf(content, run, { species: ['no-such-species'] })).toEqual([]);
  });

  it('the Bond-level condition reads anyone, one Pokémon, or nobody', () => {
    const run = party();
    expect(conditionMet(content, run, { kind: 'bondLevel', atLeast: 5, who: 'any' })).toBe(true);
    expect(conditionMet(content, run, { kind: 'bondLevel', atLeast: 2, who: 'starter' })).toBe(false);
    expect(conditionMet(content, run, { kind: 'bondLevel', atLeast: 1, who: 'starter' })).toBe(true);
    expect(conditionMet(content, run, { kind: 'bondLevel', atLeast: 2, who: 'lead', absent: true })).toBe(true);
    const type = content.species.get(run.party[0]!.speciesId)!.types[0]!;
    expect(conditionMet(content, run, { kind: 'partyTypes', types: [type, 'ghost'] })).toBe(true);
  });

  it('a pick with a move flag lists only Pokémon that know such a move, and locks when nobody does', () => {
    const run = party();
    const sound = [...content.moves.values()].find((m) => m.flags.includes('sound'))!;
    for (const m of run.party) m.moves = m.moves.filter((mv) => !content.moves.get(mv.id)?.flags.includes('sound'));
    expect(eventView(content, run, 'p').choices[3]!.locked).toBe('Needs a Pokémon that fits');
    run.party[1]!.moves[0] = { id: sound.id, pp: sound.pp };
    const view = eventView(content, run, 'p');
    expect(view.choices[3]!.tradePicks?.map((p) => p.uid)).toEqual(['p7']);
    const done = chooseEvent(content, run, 'p', 3, 'p7');
    expect(done.run.party[1]!.friendship).toBeGreaterThan(120);
    expect(done.run.party[0]!.friendship).toBe(60);
  });
});
