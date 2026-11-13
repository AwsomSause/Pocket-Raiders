// Choice memory (Beta 0.6): remembered flags change what an event shows; indices stay stable; the flag registry is clean.

import { describe, expect, it } from 'vitest';
import memoryFlags from '../../src/data/overhaul/memoryFlags.json';
import { EventDefSchema, MAX_EVENT_VARIANTS } from '../../src/core/contentSchema';
import { allChoices, choiceAt, effectiveEvent, memoryKey, memoryValue, remembered, visibleChoices } from '../../src/core/eventMemory';
import { chooseEvent, eventView } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const outcome = (text: string, effects: unknown[] = []) => ({ text, effects });
const BASE = {
  id: 'test-memory', name: 'Test', group: 'Test', intro: 'A stranger waves.',
  choices: [
    { label: 'Help', success: outcome('You helped.', [{ kind: 'flag', key: 'kind-helped-stranger' }]) },
    { label: 'Walk on', success: outcome('You walked on.') },
  ],
  remembers: [
    { id: 'again', when: [{ kind: 'flag', key: 'kind-helped-stranger' }], notice: 'It is the one you helped.', hide: [1], addChoices: [{ label: 'Say hello', success: outcome('They smile.') }] },
  ],
};

function setup(flags: Record<string, number> = {}): { run: RunState } {
  const event = EventDefSchema.parse(BASE);
  content.events.set(event.id, event);
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'mem', archetypeId: 'red' }), 0);
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'm', kind: 'event', used: false, eventId: event.id });
  for (const [k, v] of Object.entries(flags)) run.story.flags[`ev:${k}`] = v;
  return { run };
}

describe('choice memory', () => {
  it('shows the base scene when nothing is remembered', () => {
    const { run } = setup();
    const v = eventView(content, run, 'm');
    expect(v.event.intro).toBe('A stranger waves.');
    expect(v.choices.map((c) => c.label)).toEqual(['Help', 'Walk on']);
  });

  it('applies the first matching variant: notice added, a choice hidden, one added', () => {
    const { run } = setup({ 'kind-helped-stranger': 1 });
    const v = eventView(content, run, 'm');
    expect(v.event.intro).toBe('A stranger waves. It is the one you helped.');
    expect(v.choices.map((c) => c.label)).toEqual(['Help', 'Say hello']);
  });

  it('keeps stable indices: the added choice is index 2 in storage and position 1 in the view', () => {
    const { run } = setup({ 'kind-helped-stranger': 1 });
    const event = content.events.get('test-memory')!;
    expect(visibleChoices(content, run, event).map((c) => c.index)).toEqual([0, 2]);
    expect(allChoices(event).map((c) => c.label)).toEqual(['Help', 'Walk on', 'Say hello']);
    expect(choiceAt(event, 2)!.label).toBe('Say hello');
    expect(effectiveEvent(content, run, event).choices).toHaveLength(2);
  });

  it('chooses by position in the view', () => {
    const { run } = setup({ 'kind-helped-stranger': 1 });
    const result = chooseEvent(content, run, 'm', 1);
    expect(result.text).toBe('They smile.');
  });

  it('a choice sets a flag the next scene can read', () => {
    const { run } = setup();
    const after = chooseEvent(content, run, 'm', 0).run;
    expect(remembered(after, 'kind.helped_stranger')).toBe(true);
    expect(memoryValue(after, 'kind.walked_past')).toBe(0);
  });

  it('rejects more than three variants, duplicate ids and an empty scene', () => {
    const v = (id: string) => ({ id, when: [{ kind: 'flag', key: 'x' }], notice: 'n' });
    expect(MAX_EVENT_VARIANTS).toBe(3);
    expect(() => EventDefSchema.parse({ ...BASE, remembers: [v('a'), v('b'), v('c'), v('d')] })).toThrow();
    expect(() => EventDefSchema.parse({ ...BASE, remembers: [v('a'), v('a')] })).toThrow();
    expect(() => EventDefSchema.parse({ ...BASE, remembers: [{ ...v('a'), hide: [0, 1] }] })).toThrow();
    expect(() => EventDefSchema.parse({ ...BASE, remembers: [{ ...v('a'), hide: [5] }] })).toThrow();
  });
});

describe('memory flag registry', () => {
  it('has unique ids that turn into valid, unique flag keys, and no cross-run flags', () => {
    const ids = memoryFlags.flags.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    const keys = ids.map(memoryKey);
    expect(new Set(keys).size).toBe(keys.length);
    for (const k of keys) expect(k).toMatch(/^[a-z][a-z0-9-]*$/);
    for (const id of ids) expect(id).not.toMatch(/^(past|faller|released|promise)\b/);
  });

  it('every remembers condition in real content reads a flag some event sets', () => {
    const setKeys = new Set<string>();
    const reads: string[] = [];
    for (const ev of content.events.values()) {
      for (const ch of allChoices(ev)) for (const o of [ch.success, ch.failure]) for (const e of [...(o?.effects ?? []), ...(o?.battle?.win ?? [])]) if (e.kind === 'flag') setKeys.add(e.key);
      for (const v of ev.remembers) for (const c of v.when) if (c.kind === 'flag') reads.push(`${ev.id}:${c.key}`);
    }
    const missing = reads.filter((r) => !setKeys.has(r.split(':')[1]!));
    expect(missing).toEqual([]);
  });
});
