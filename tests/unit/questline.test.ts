// Catalog Overhaul questline pieces (src/core/events/questline.ts): stage gaps, a Companion's line and Bond, "N nodes on" events.

import { describe, expect, it } from 'vitest';
import { EventConditionSchema, EventDefSchema, EventEffectSchema } from '../../src/core/contentSchema';
import { applyEffect, conditionMet, stageNumber } from '../../src/core/events';
import { BOND_STEP, bondLevel, flagAge, laterEventLeft, laterEventStep, lineHolds, lineMember, lineOf, queueLaterEvent } from '../../src/core/events/questline';
import { createPokemon } from '../../src/core/pokemon';
import { Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const cond = (c: unknown) => EventConditionSchema.parse(c);
const effect = (e: unknown) => EventEffectSchema.parse(e);
const rng = () => new Rng(1);

function setup(): RunState {
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'questline', archetypeId: 'red' }), 0);
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  return run;
}
function add(run: RunState, species: string, friendship: number): void {
  const mon = createPokemon(content, species, 10, new Rng(7), 'q');
  mon.friendship = friendship;
  run.party.push(mon);
}

describe('flagAge: stages since a remembered act', () => {
  it('is false for a flag never set, and 0 on the stage it was set', () => {
    const run = setup();
    expect(conditionMet(content, run, cond({ kind: 'flagAge', key: 'owl-met' }))).toBe(false);
    applyEffect(content, run, effect({ kind: 'flag', key: 'owl-met' }), rng());
    expect(flagAge(run, 'owl-met', stageNumber(content, run))).toBe(0);
    expect(conditionMet(content, run, cond({ kind: 'flagAge', key: 'owl-met' }))).toBe(false);
    expect(conditionMet(content, run, cond({ kind: 'flagAge', key: 'owl-met', atLeast: 0, atMost: 0 }))).toBe(true);
  });

  it('counts stages from the first time the flag was set, across a region change', () => {
    const run = setup();
    applyEffect(content, run, effect({ kind: 'flag', key: 'owl-met' }), rng());
    run.stage!.index += 2;
    // Setting it again later does not move the stamp.
    applyEffect(content, run, effect({ kind: 'flag', key: 'owl-met' }), rng());
    expect(flagAge(run, 'owl-met', stageNumber(content, run))).toBe(2);
    expect(conditionMet(content, run, cond({ kind: 'flagAge', key: 'owl-met', atLeast: 2 }))).toBe(true);
    expect(conditionMet(content, run, cond({ kind: 'flagAge', key: 'owl-met', atLeast: 3 }))).toBe(false);
    expect(conditionMet(content, run, cond({ kind: 'flagAge', key: 'owl-met', atLeast: 1, atMost: 1 }))).toBe(false);
    run.regionIndex += 1;
    expect(flagAge(run, 'owl-met', stageNumber(content, run))!).toBeGreaterThan(2);
  });

  it('a flag lowered to nothing is not stamped', () => {
    const run = setup();
    applyEffect(content, run, effect({ kind: 'flag', key: 'debt', amount: -1 }), rng());
    expect(flagAge(run, 'debt', stageNumber(content, run))).toBeNull();
  });
});

describe('partyLine: a Companion and its Bond', () => {
  it('a line holds the species and everything it evolves into', () => {
    expect(lineOf(content, 'hoothoot').has('hoothoot')).toBe(true);
    expect(lineOf(content, 'hoothoot').has('noctowl')).toBe(true);
    expect(lineOf(content, 'froakie').has('greninja')).toBe(true);
    expect(lineOf(content, 'hoothoot').has('pidgey')).toBe(false);
  });

  it('Bond level N is friendship N x 50, capped at 5', () => {
    expect(BOND_STEP).toBe(50);
    expect(bondLevel({ friendship: 0 })).toBe(0);
    expect(bondLevel({ friendship: 70 })).toBe(1);
    expect(bondLevel({ friendship: 149 })).toBe(2);
    expect(bondLevel({ friendship: 150 })).toBe(3);
    expect(bondLevel({ friendship: 255 })).toBe(5);
  });

  it('holds for the evolved form, reads Bond, and `absent` is its opposite', () => {
    const run = setup();
    expect(conditionMet(content, run, cond({ kind: 'partyLine', species: 'hoothoot' }))).toBe(false);
    expect(conditionMet(content, run, cond({ kind: 'partyLine', species: 'hoothoot', absent: true }))).toBe(true);
    add(run, 'noctowl', 120);
    expect(lineHolds(content, run, 'hoothoot')).toBe(true);
    expect(conditionMet(content, run, cond({ kind: 'partyLine', species: 'hoothoot', bond: 2 }))).toBe(true);
    expect(conditionMet(content, run, cond({ kind: 'partyLine', species: 'hoothoot', bond: 3 }))).toBe(false);
    expect(conditionMet(content, run, cond({ kind: 'partyLine', species: 'hoothoot', absent: true }))).toBe(false);
  });

  it('friendshipLine moves only that Pokémon, within 0 and the maximum, and does nothing without it', () => {
    const run = setup();
    const before = run.party.map((m) => m.friendship);
    applyEffect(content, run, effect({ kind: 'friendshipLine', species: 'hoothoot', amount: 30 }), rng());
    expect(run.party.map((m) => m.friendship)).toEqual(before);
    add(run, 'hoothoot', 70);
    applyEffect(content, run, effect({ kind: 'friendshipLine', species: 'hoothoot', amount: 30 }), rng());
    expect(lineMember(content, run, 'hoothoot')!.friendship).toBe(100);
    expect(run.party.slice(0, before.length).map((m) => m.friendship)).toEqual(before);
    applyEffect(content, run, effect({ kind: 'friendshipLine', species: 'hoothoot', amount: -500 }), rng());
    expect(lineMember(content, run, 'hoothoot')!.friendship).toBe(0);
    applyEffect(content, run, effect({ kind: 'friendshipLine', species: 'hoothoot', amount: 999 }), rng());
    expect(lineMember(content, run, 'hoothoot')!.friendship).toBe(content.balance.friendship.max);
  });
});

describe('laterEvent: a scene N nodes on', () => {
  const LATER = EventDefSchema.parse({ id: 'test-later', name: 'Later', group: 'Test', room: true, intro: 'Three nodes on.', choices: [{ label: 'Ok', success: { text: 'Done.', effects: [] } }] });

  it('opens beside the node reached after N nodes, once, and can be played again after a re-queue', () => {
    content.events.set(LATER.id, LATER);
    const run = setup();
    applyEffect(content, run, effect({ kind: 'laterEvent', eventId: 'test-later', nodes: 2 }), rng());
    expect(laterEventLeft(run, 'test-later')).toBe(2);
    const sides = () => run.stage!.map.nodes.flatMap((n) => n.sides).filter((s) => s.kind === 'event' && s.eventId === 'test-later');
    expect(laterEventStep(content, run)).toEqual([]);
    expect(sides()).toHaveLength(0);
    run.itemCounters = { ...run.itemCounters, 'event-seen:test-later': 1 };
    expect(laterEventStep(content, run)).toEqual(['test-later']);
    expect(sides()).toHaveLength(1);
    expect(sides()[0]!.used).toBe(false);
    expect(run.itemCounters?.['event-seen:test-later']).toBeUndefined();
    expect(laterEventLeft(run, 'test-later')).toBe(0);
    expect(laterEventStep(content, run)).toEqual([]);
    expect(sides()).toHaveLength(1);
  });

  it('two events due on the same node open in a fixed order; an unknown event is dropped', () => {
    content.events.set(LATER.id, LATER);
    const other = EventDefSchema.parse({ ...LATER, id: 'test-later-b' });
    content.events.set(other.id, other);
    const run = setup();
    queueLaterEvent(run, 'test-later-b', 1);
    queueLaterEvent(run, 'test-later', 1);
    queueLaterEvent(run, 'no-such-event', 1);
    expect(laterEventStep(content, run)).toEqual(['test-later', 'test-later-b']);
    expect(laterEventLeft(run, 'no-such-event')).toBe(0);
  });

  it('waits a node when the player stands on the gym', () => {
    content.events.set(LATER.id, LATER);
    const run = setup();
    const stage = run.stage!;
    const gym = stage.map.nodes.find((n) => n.column >= stage.map.columns);
    if (!gym) return;
    stage.current = gym.id;
    queueLaterEvent(run, 'test-later', 1);
    expect(laterEventStep(content, run)).toEqual([]);
    expect(laterEventLeft(run, 'test-later')).toBe(1);
  });

  it('does nothing outside a stage map', () => {
    const run = setup();
    queueLaterEvent(run, 'test-later', 1);
    run.stage!.current = null;
    expect(laterEventStep(content, run)).toEqual([]);
    expect(laterEventLeft(run, 'test-later')).toBe(1);
  });
});
