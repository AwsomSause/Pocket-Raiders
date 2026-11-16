// SF145 The Plush Workshops (Catalog Overhaul singles): Mrs. Brisby sews a Canari Pal of her colour up a level for ₽100, to Lv.3 at most.
import { describe, expect, it } from 'vitest';
import { applyEffect, chooseEvent } from '../../src/core/events';
import { Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const held = (run: RunState, id: string): number => (run.inventory[id] ?? 0) + (run.passives?.[id] ?? 0);

function atWorkshop(colour: string, give: string | null): { run: RunState; side: string } {
  const run: RunState = structuredClone(chooseStarter(content, createRun(content, { runId: `plush-${colour}`, seed: `plush-${colour}`, archetypeId: 'red' }), 0));
  const node = run.stage!.map.nodes.find((n) => n.column === 1)!;
  node.sides = [{ id: 'plush', kind: 'event', used: false, eventId: `plush-workshop-${colour}` }];
  run.stage!.current = node.id;
  run.money = 1000;
  if (give) applyEffect(content, run, { kind: 'item', id: give, count: 1 }, new Rng(1));
  return { run, side: 'plush' };
}

describe('the Plush Workshops', () => {
  it('sews a Lv.1 Pal up to Lv.2 for ₽100', () => {
    const { run, side } = atWorkshop('blue', 'blue-canari-pal-1');
    const r = chooseEvent(content, run, side, 0);
    expect(r.run.money).toBe(900);
    expect(held(r.run, 'blue-canari-pal-1')).toBe(0);
    expect(held(r.run, 'blue-canari-pal-2')).toBe(1);
  });

  it('sews a Lv.2 Pal up to Lv.3 with gold thread', () => {
    const { run, side } = atWorkshop('gold', 'gold-canari-pal-2');
    const r = chooseEvent(content, run, side, 0);
    expect(r.text).toContain('level three');
    expect(held(r.run, 'gold-canari-pal-2')).toBe(0);
    expect(held(r.run, 'gold-canari-pal-3')).toBe(1);
    expect(r.run.money).toBe(900);
  });

  it('needs a Pal of her colour below Lv.3, and the thread money', () => {
    expect(() => chooseEvent(content, atWorkshop('red', null).run, 'plush', 0)).toThrow();
    expect(() => chooseEvent(content, atWorkshop('red', 'red-canari-pal-3').run, 'plush', 0)).toThrow();
    const poor = atWorkshop('pink', 'pink-canari-pal-1');
    poor.run.money = 50;
    expect(() => chooseEvent(content, poor.run, 'plush', 0)).toThrow();
    // "Not now." always works and costs nothing.
    expect(chooseEvent(content, poor.run, 'plush', 1).run.money).toBe(50);
  });
});
