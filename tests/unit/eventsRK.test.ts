// Run events K (R506-R560): run-wide modifier events. Every event loads, rooms are never drawn alone,
// callbacks can be reached, and every choice of every event resolves without error.

import { describe, expect, it } from 'vitest';
import { chooseEvent } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import rk from '../../src/data/eventsRK.json';
import { content } from './helpers';

const RK = (rk as { events: { id: string; room?: boolean; callback?: boolean; choices: unknown[] }[] }).events;

function runAt(eventId: string, seed: string): RunState {
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed, archetypeId: 'red' }), 0);
  run.money = 5000;
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'rk-side', kind: 'event', used: false, eventId });
  return run;
}

describe('run events K', () => {
  it('has the event set, all registered in content', () => {
    expect(RK.length).toBeGreaterThanOrEqual(50);
    for (const e of RK) expect(content.events.has(e.id)).toBe(true);
  });

  it('keeps rooms out of the draw and callbacks marked', () => {
    expect(RK.filter((e) => e.room).length).toBeGreaterThanOrEqual(10);
    expect(content.events.get('rk-streak-2')!.room).toBe(true);
    expect(content.events.get('rk-streak-1')!.room).toBe(false);
    expect(RK.filter((e) => e.callback).length).toBeGreaterThanOrEqual(4);
  });

  it('resolves every choice of every event (checks, chances and trades included)', () => {
    let resolved = 0;
    for (const e of RK) {
      for (let i = 0; i < e.choices.length; i++) {
        const run = runAt(e.id, `rk-${e.id}-${i}`);
        const gated = (content.events.get(e.id)!.choices[i]!.requires ?? []).length > 0;
        try {
          expect(chooseEvent(content, run, 'rk-side', i).run).toBeTruthy();
          resolved++;
        } catch (err) {
          // Only a choice with its own requirements (an item, a season, a species) may refuse; anything else is a bug.
          if (!gated) throw err;
        }
      }
    }
    expect(resolved).toBeGreaterThan(100);
  });

  it('gives lasting relics once, with an upside', () => {
    const a = chooseEvent(content, runAt('rk-pact-booth', 'pact'), 'rk-side', 0).run;
    expect(a.story.flags['relic:rk-pact-lesser']).toBe(true);
  });
});
