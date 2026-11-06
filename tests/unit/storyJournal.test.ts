import { describe, expect, it } from 'vitest';
import { chooseStarter, createRun } from '../../src/core/run';
import { journalRows } from '../../src/core/story2/journalView';
import { StoryV2Schema } from '../../src/core/story2/schema';
import { content } from './helpers';

function setup() {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'jr', seed: 'jr', archetypeId: 'red' }), 0));
  run.story.v2 = StoryV2Schema.parse({ mode: 'story_run' });
  return run;
}

describe('story journal rows', () => {
  it('is empty for a Classic run', () => {
    const run = setup();
    run.story.v2 = undefined;
    expect(journalRows(run)).toEqual([]);
  });
  it('shows route progress, arcs (paused ones flagged) and this run\'s scenes newest first', () => {
    const run = setup();
    const v2 = run.story.v2!;
    v2.stops = { index: 3, planned: 44, done: ['a', 'b', 'c'] };
    v2.arcs = { arc_tally: { state: 'paused', step: 1, nodeCost: 0 }, arc_ghost: { state: 'active', step: 0, nodeCost: 0 } };
    v2.module = { backstory: 'bs', queue: [], active: null, activeStop: null, played: [], echoes: 0, lastSceneStop: 0, ending: null, chronicle: [], snapshots: [{ event: 'ev_one', stop: null, act: 1, text: 'First.', choice: null }, { event: 'ev_two', stop: null, act: 2, text: 'Second.', choice: null }] };
    const rows = journalRows(run);
    expect(rows[0]).toMatchObject({ section: 'Route', right: '3 / 44' });
    expect(rows.filter((r) => r.section === 'Arcs').map((r) => [r.title, r.right])).toEqual([['Ghost', 'In progress'], ['Tally', 'Arc Paused']]);
    expect(rows.filter((r) => r.section === 'Scenes').map((r) => r.title)).toEqual(['Two', 'One']);
  });
});
