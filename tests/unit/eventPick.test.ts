// Catalog Overhaul: a choice can ask the player to pick one party Pokémon; `who: 'picked'` effects land on it.
import { describe, expect, it } from 'vitest';
import { EventDefSchema } from '../../src/core/contentSchema';
import { chooseEvent, eventView } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const REST = {
  id: 'test-pick-rest', name: 'Hot Spring', group: 'Test', intro: 'Steam; the team runs in.',
  choices: [
    { label: 'Who soaks first?', pick: {}, success: { text: 'It sinks in up to its chin.', effects: [{ kind: 'friendship', amount: 5, who: 'picked' }] } },
    { label: 'Only a Fire-type.', pick: { types: ['fire'] }, success: { text: 'It glows.', effects: [{ kind: 'friendship', amount: 5, who: 'picked' }] } },
    { label: 'Walk on.', success: { text: 'You walk on.', effects: [] } },
  ],
};

function setup(): RunState {
  const event = EventDefSchema.parse(REST);
  content.events.set(event.id, event);
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'pick', archetypeId: 'red' }), 0);
  const second = structuredClone(run.party[0]!);
  second.uid = 'second';
  second.friendship = 10;
  run.party[0]!.friendship = 10;
  run.party.push(second);
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'p', kind: 'event', used: false, eventId: event.id });
  return run;
}

describe('pick a Pokémon choices', () => {
  it('lists the party on a pick choice and nothing on a plain one', () => {
    const view = eventView(content, setup(), 'p');
    expect(view.choices[0]!.tradePicks?.map((p) => p.uid)).toContain('second');
    expect(view.choices[0]!.tradePicks).toHaveLength(2);
    expect(view.choices[2]!.tradePicks).toBeNull();
  });

  it('narrows the list by type', () => {
    const run = setup();
    const fire = run.party.filter((m) => content.species.get(m.speciesId)!.types.includes('fire')).length;
    expect(eventView(content, run, 'p').choices[1]!.tradePicks).toHaveLength(fire);
  });

  it('gives the bond to the picked Pokémon only', () => {
    const run = setup();
    const after = chooseEvent(content, run, 'p', 0, 'second').run;
    expect(after.party.find((m) => m.uid === 'second')!.friendship).toBeGreaterThan(10);
    expect(after.party[0]!.friendship).toBe(10);
  });

  it('falls back to the lead when nothing is picked, and refuses a Pokémon that is not listed', () => {
    const run = setup();
    const after = chooseEvent(content, run, 'p', 0).run;
    expect(after.party[0]!.friendship).toBeGreaterThan(10);
    expect(after.party.find((m) => m.uid === 'second')!.friendship).toBe(10);
    expect(() => chooseEvent(content, setup(), 'p', 0, 'nobody')).toThrow();
  });
});
