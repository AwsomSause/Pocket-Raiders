// S434 Relic Fragments: collect fragments at dig sites and ruins, fuse them into one relic at the forge.
import { describe, expect, it } from 'vitest';
import { chooseEvent, conditionMet } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content, toBattle } from './helpers';

const FRAGMENTS = { kind: 'flag', key: 'relic-frag', atLeast: 1, atMost: 99 } as const;

function atEvent(eventId: string, fragments = 0): RunState {
  const run = structuredClone(toBattle(chooseStarter(content, createRun(content, { runId: 'rf', seed: 'rf', archetypeId: 'red' }), 0)));
  run.phase = 'map';
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  node.sides.push({ id: 'rf', kind: 'event', used: false, eventId });
  if (fragments > 0) run.story.flags['ev:relic-frag'] = fragments;
  return run;
}

describe('Relic Fragments (S434)', () => {
  it('a paid dig always gives one fragment', () => {
    const run = atEvent('relic-fragment-dig');
    run.money = 500;
    const out = chooseEvent(content, run, 'rf', 1).run;
    expect(out.story.flags['ev:relic-frag']).toBe(1);
    expect(out.money).toBe(200);
  });

  // Catalog Overhaul places (SF94): the forge fuses three fragments into the relic you are growing (no separate charm or crown).
  it('the forge needs three fragments, takes them and grows your relic two steps', () => {
    expect(conditionMet(content, atEvent('relic-forge', 2), { ...FRAGMENTS, atLeast: 3 })).toBe(false);
    const few = atEvent('relic-forge', 2);
    few.story.flags['ev:tree-ember'] = 1;
    expect(() => chooseEvent(content, few, 'rf', 0)).toThrow();
    const run = atEvent('relic-forge', 4);
    run.story.flags['ev:tree-ember'] = 1;
    const out = chooseEvent(content, run, 'rf', 0).run;
    expect(out.story.flags['ev:relic-frag']).toBe(1);
    expect(out.story.flags['ev:relic-growth-ember']).toBe(2);
    expect(out.story.flags['ev:relic-growth-tide'] ?? 0).toBe(0);
  });

  it('with no relic growing, the forge pays the scrap price and grows nothing', () => {
    const run = atEvent('relic-forge', 3);
    const money = run.money;
    const out = chooseEvent(content, run, 'rf', 0).run;
    expect(out.story.flags['ev:relic-frag'] ?? 0).toBe(0);
    expect(out.money).toBe(money + 150);
    for (const line of ['ember', 'tide', 'leaf']) expect(out.story.flags[`ev:relic-growth-${line}`] ?? 0).toBe(0);
  });
});
