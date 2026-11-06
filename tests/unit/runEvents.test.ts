import { describe, expect, it } from 'vitest';
import { addEventStops, eligibleEvents } from '../../src/core/events';
import { byPriority, EVENT_TAGS, priorityOf, QUEUE_MAX, stepQueue, tagsOf } from '../../src/core/events/priority';
import { chooseStarter, createRun } from '../../src/core/run';
import catalogue from '../../src/data/events/run-catalogue.json';
import { content } from './helpers';

const critical = () => true;
const base = { queue: [], wanted: [] as string[], capacity: 2, stage: 5, critical, seed: 's', priority: () => 90 };

describe('W5 priority and tags', () => {
  it('ranks map to the base priorities and forced events use 70 or more', () => {
    expect(priorityOf({ rarity: 'common', forced: false })).toBe(10);
    expect(priorityOf({ rarity: 'uncommon', forced: false })).toBe(30);
    expect(priorityOf({ rarity: 'rare', forced: false })).toBe(50);
    expect(priorityOf({ rarity: 'epic', forced: false })).toBe(60);
    expect(priorityOf({ rarity: 'common', forced: true })).toBe(70);
    expect(priorityOf({ rarity: 'common', forced: true, priority: 100 })).toBe(100);
    const list = byPriority([{ id: 'a', rarity: 'common', forced: false }, { id: 'b', rarity: 'epic', forced: false }, { id: 'c', rarity: 'rare', forced: false }], 'x');
    expect(list.map((e) => e.id)).toEqual(['b', 'c', 'a']);
    expect(byPriority(list, 'x').map((e) => e.id)).toEqual(['b', 'c', 'a']);
  });
  it('every live event has valid tags (own or from its group) and the catalogue has 25 events', () => {
    for (const e of content.events.values()) for (const t of tagsOf(e)) expect(EVENT_TAGS).toContain(t);
    const cat = catalogue.events.map((e) => content.events.get(e.id)!);
    expect(cat.every(Boolean)).toBe(true);
    expect(cat).toHaveLength(25);
    expect(cat.filter((e) => e.disabled)).toHaveLength(13);
  });
  it('disabled events are never offered', () => {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'd', seed: 'd', archetypeId: 'red' }), 0));
    expect(eligibleEvents(content, run).some((e) => e.disabled)).toBe(false);
  });
});

describe('W5 event queue', () => {
  it('places forced events up to the stage capacity and queues the rest', () => {
    const s = stepQueue({ ...base, wanted: ['a', 'b', 'c'], critical: () => false });
    expect(s.place).toHaveLength(2);
    expect(s.queue).toHaveLength(1);
    expect(s.queue[0]!.since).toBe(5);
  });
  it('a waiting event is retried from the top and never duplicated', () => {
    const first = stepQueue({ ...base, wanted: ['a', 'b', 'c'], critical: () => false });
    const next = stepQueue({ ...base, queue: first.queue, wanted: ['c'], stage: 6, critical: () => false });
    expect(next.place).toEqual(['c']);
    expect(next.queue).toEqual([]);
    const again = stepQueue({ ...base, queue: first.queue, wanted: ['c', 'c'], stage: 6, critical: () => false });
    expect(again.place).toEqual(['c']);
  });
  it('after 2 stages a Critical event becomes a first stop even with no room; others expire', () => {
    const q = [{ id: 'crit', since: 3 }, { id: 'meh', since: 3 }];
    const s = stepQueue({ ...base, queue: q, wanted: ['crit', 'meh'], capacity: 0, stage: 5, critical: (id) => id === 'crit' });
    expect(s.place).toEqual(['crit']);
    expect(s.expired).toEqual(['meh']);
    expect(s.queue).toEqual([]);
  });
  it('the queue never starves: with many events it never holds more than 4 and Critical overflow is placed', () => {
    const wanted = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const s = stepQueue({ ...base, wanted, capacity: 1 });
    expect(s.queue.length).toBeLessThanOrEqual(QUEUE_MAX);
    expect(s.place.length + s.queue.length).toBe(7);
  });
  it('an entry that is no longer eligible expires with a report', () => {
    const s = stepQueue({ ...base, queue: [{ id: 'gone', since: 5 }], wanted: [] });
    expect(s.expired).toEqual(['gone']);
  });
});

describe('W5 stage placement', () => {
  it('addEventStops never places a forced event twice on one stage and keeps the queue valid', () => {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'p', seed: 'p', archetypeId: 'red' }), 0));
    addEventStops(content, run);
    const ids = run.stage!.map.nodes.flatMap((n) => n.sides).flatMap((s) => (s.eventId ? [s.eventId] : []));
    expect(ids.every((id) => !content.events.get(id)?.forced || ids.filter((x) => x === id).length === 1)).toBe(true);
    expect((run.story.eventQueue ?? []).length).toBeLessThanOrEqual(QUEUE_MAX);
  });
});
