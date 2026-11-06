// Mining Spots (S231).
import { describe, expect, it } from 'vitest';
import { MINING, MiningSchema, dig } from '../../src/core/mining';
import { serviceView, useService } from '../../src/core/services/flow';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SERVICES } from '../../src/core/services/schema';
import { content } from './helpers';

function spot(seed = 'mine'): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'mn', seed, archetypeId: 'red' }), 0));
  const node = run.stage!.map.nodes.find((n) => n.column === 1)!;
  node.sides = [{ id: 'ms', kind: 'service', serviceId: 'mining', used: false }];
  run.stage!.current = node.id;
  run.money = 1000;
  return run;
}

describe('mining data', () => {
  it('validates and every item exists', () => {
    expect(MiningSchema.safeParse(MINING).success).toBe(true);
    for (const d of MINING.digs) for (const f of d.table) if (f.kind === 'item') expect(content.items.has(f.id) || content.catalog.has(f.id), f.id).toBe(true);
  });
  it('the service is registered as supported', () => {
    expect(SERVICES.services.some((s) => s.id === 'mining' && s.status === 'supported')).toBe(true);
  });
});

describe('mining spot', () => {
  it('offers both digs, charges the deep dig and can be used once', () => {
    const run = spot();
    const view = serviceView(content, run, 'ms');
    expect(view.options.map((o) => o.id)).toEqual(['dig:shallow', 'dig:deep']);
    const done = useService(content, run, 'ms', 'dig:deep');
    expect(done.message.length).toBeGreaterThan(5);
    expect(done.run.money).toBeGreaterThanOrEqual(1000 - 300);
    expect(() => useService(content, done.run, 'ms', 'dig:shallow')).toThrow(/already/);
  });
  it('is repeatable for the same seed and covers every kind of find across seeds', () => {
    const kinds = new Set<string>();
    for (let i = 0; i < 80; i++) {
      const a = spot(`m${i}`);
      const b = spot(`m${i}`);
      const msg = dig(content, a, 'ms', 'deep');
      expect(dig(content, b, 'ms', 'deep')).toBe(msg);
      kinds.add(/Only rubble/.test(msg) ? 'nothing' : /worth/.test(msg) ? 'money' : 'item');
    }
    expect([...kinds].sort()).toEqual(['item', 'money', 'nothing']);
  });
  it('rejects an unknown dig', () => {
    expect(() => dig(content, spot(), 'ms', 'nope')).toThrow();
  });
});
