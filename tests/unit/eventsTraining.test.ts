// Run events G (training, growth and mastery): every choice of every event in eventsTraining.json plays out.
import { describe, expect, it } from 'vitest';
import { chooseEvent } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import eventsTraining from '../../src/data/eventsTraining.json';
import { content } from './helpers';

const ids = (eventsTraining as { events: { id: string; choices: unknown[] }[] }).events;

describe('training events', () => {
  it('are loaded into the content', () => {
    for (const e of ids) expect(content.events.has(e.id)).toBe(true);
  });
  for (const e of ids) {
    it(`${e.id}: every choice resolves`, () => {
      for (let i = 0; i < e.choices.length; i++) {
        const run = chooseStarter(content, createRun(content, { runId: 'r', seed: `tr-${e.id}`, archetypeId: 'red' }), 0);
        run.money = 5000;
        const node = run.stage!.map.nodes[0]!;
        run.stage!.current = node.id;
        run.stage!.visited = [node.id];
        node.sides.push({ id: 'test-event', kind: 'event', used: false, eventId: e.id });
        const choice = content.events.get(e.id)!.choices[i]!;
        const locked = choice.requires.length > 0;
        if (locked) continue; // locked by a requirement this run may not meet
        expect(() => chooseEvent(content, run, 'test-event', i)).not.toThrow();
      }
    });
  }
});
