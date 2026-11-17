// The map's battle previews walk a copy of the run to each next node. While a stop must be played first
// (an event placed before this node's battle), moving on is refused, so the previews must not try it (it used to throw and stop the map opening).
import { describe, expect, it } from 'vitest';
import { attachBlocker } from '../../src/core/co/attach';
import { stageKey } from '../../src/core/mapItems';
import { chooseStarter, createRun, mapPreviews } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

describe('map previews while an event holds the node', () => {
  it('shows no previews and does not throw', () => {
    const run: RunState = structuredClone(chooseStarter(content, createRun(content, { runId: 'held-prev', seed: 'held-prev', archetypeId: 'red' }), 0));
    const before = [...(content.coPlacement ?? new Map())].find(([id, p]) => p.attaches === 'before' && content.events.get(id) && !content.events.get(id)!.disabled)![0];
    const node = run.stage!.map.nodes.find((n) => n.column === 1)!;
    node.sides = [{ id: 'held-1', kind: 'event', used: false, eventId: before }];
    run.stage!.current = node.id;
    run.itemCounters = { ...run.itemCounters, 'co-held': 1, [`rift-preview:${stageKey(run)}`]: 1 };
    expect(attachBlocker(content, run)).toMatch(/before moving on/);
    expect(() => mapPreviews(content, run)).not.toThrow();
    // Once the stop is played the previews come back.
    node.sides[0]!.used = true;
    expect(attachBlocker(content, run)).toBeNull();
    expect(Object.keys(mapPreviews(content, run)).length).toBeGreaterThan(0);
  });
});
