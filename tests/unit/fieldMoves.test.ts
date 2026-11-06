// S416 Field moves: events with choices that open only when a party member knows Cut, Surf, Flash ...
import { describe, expect, it } from 'vitest';
import { chooseEvent, conditionMet } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content, toBattle } from './helpers';

function atEvent(eventId: string): RunState {
  const run = structuredClone(toBattle(chooseStarter(content, createRun(content, { runId: 'fm', seed: 'fm', archetypeId: 'red' }), 0)));
  run.phase = 'map';
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  node.sides.push({ id: 'fm', kind: 'event', used: false, eventId });
  return run;
}

describe('field moves (S416)', () => {
  it('a choice needs a living party member who knows the move', () => {
    const run = atEvent('field-overgrowth');
    const cond = { kind: 'partyMove', move: 'cut' } as const;
    run.party[0]!.moves = [{ id: 'tackle', pp: 10 }];
    expect(conditionMet(content, run, cond)).toBe(false);
    expect(() => chooseEvent(content, run, 'fm', 0)).toThrow();
    run.party[0]!.moves.push({ id: 'cut', pp: 10 });
    expect(conditionMet(content, run, cond)).toBe(true);
    run.party[0]!.hp = 0;
    expect(conditionMet(content, run, cond)).toBe(false);
  });
  it('using the move gives the reward; walking around is always open', () => {
    const run = atEvent('field-overgrowth');
    run.party[0]!.moves.push({ id: 'cut', pp: 10 });
    chooseEvent(content, structuredClone(run), 'fm', 0);
    expect(chooseEvent(content, run, 'fm', 0).changes).toContain('Heart Scale');
    const walk = atEvent('field-hidden-cave');
    expect(() => chooseEvent(content, walk, 'fm', 3)).not.toThrow();
  });
  it('every move named in the events exists', () => {
    for (const id of ['field-overgrowth', 'field-hidden-cave']) {
      for (const c of content.events.get(id)!.choices) for (const r of c.requires) if (r.kind === 'partyMove') expect(content.moves.has(r.move)).toBe(true);
    }
  });
});
