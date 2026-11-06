// S414 Key item upgrades: the workshop event trades a rod or bike for the next level, for a fee.
import { describe, expect, it } from 'vitest';
import { chooseEvent } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content, toBattle } from './helpers';

function atWorkshop(eventId = 'key-item-workshop-rod'): RunState {
  const run = structuredClone(toBattle(chooseStarter(content, createRun(content, { runId: 'ws', seed: 'ws', archetypeId: 'red' }), 0)));
  run.phase = 'map';
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  node.sides.push({ id: 'ws', kind: 'event', used: false, eventId });
  return run;
}

describe('Key Item Workshop (S414)', () => {
  it('upgrades Old Rod to Good Rod for the fee', () => {
    const run = atWorkshop();
    run.passives = { 'old-rod': 1 };
    run.money = 1000;
    const out = chooseEvent(content, run, 'ws', 0).run;
    expect(out.passives?.['old-rod']).toBeUndefined();
    expect(out.passives?.['good-rod']).toBe(1);
    expect(out.money).toBe(400);
  });
  it('is locked without the item or the money', () => {
    const none = atWorkshop();
    none.money = 5000;
    expect(() => chooseEvent(content, none, 'ws', 0)).toThrow();
    const poor = atWorkshop('key-item-workshop-bike');
    poor.passives = { 'mach-bike': 1 };
    poor.money = 100;
    expect(() => chooseEvent(content, poor, 'ws', 1)).toThrow();
  });
  it('every upgrade steps up exactly one level', () => {
    const choices = ['key-item-workshop-rod', 'key-item-workshop-bike'].flatMap((id) => content.events.get(id)!.choices.slice(0, 2));
    const pairs = choices.map((c) => [c.requires.find((r) => r.kind === 'item')!, c.success!.effects.find((f) => f.kind === 'item')!] as const);
    expect(pairs.map(([a, b]) => `${(a as { id: string }).id}>${(b as { id: string }).id}`)).toEqual(['old-rod>good-rod', 'good-rod>super-rod', 'bicycle>mach-bike', 'mach-bike>acro-bike']);
  });
});
