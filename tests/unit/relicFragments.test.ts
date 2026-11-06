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

  it('the forge needs three fragments, takes them and gives one relic', () => {
    expect(conditionMet(content, atEvent('relic-forge', 2), { ...FRAGMENTS, atLeast: 3 })).toBe(false);
    const few = atEvent('relic-forge', 2);
    expect(() => chooseEvent(content, few, 'rf', 0)).toThrow();
    const run = atEvent('relic-forge', 4);
    const out = chooseEvent(content, run, 'rf', 0).run;
    expect(out.story.flags['ev:relic-frag']).toBe(1);
    expect(out.story.flags['ev:frag-charm']).toBe(1);
    expect(JSON.stringify(out)).toContain('Fragment Charm');
  });

  it('the Crown costs five and each relic can only be forged once', () => {
    const run = atEvent('relic-forge', 4);
    expect(() => chooseEvent(content, run, 'rf', 1)).toThrow();
    const rich = atEvent('relic-forge', 10);
    rich.story.flags['ev:frag-charm'] = 1;
    expect(() => chooseEvent(content, rich, 'rf', 0)).toThrow();
    const out = chooseEvent(content, rich, 'rf', 1).run;
    expect(out.story.flags['ev:relic-frag']).toBe(5);
  });
});
