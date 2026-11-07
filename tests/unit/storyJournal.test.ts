import { describe, expect, it } from 'vitest';
import { chooseStarter, createRun } from '../../src/core/run';
import { currentObjective, journalTabs } from '../../src/core/story2/journalView';
import { StoryV2Schema } from '../../src/core/story2/schema';
import { content } from './helpers';

function setup() {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'jr', seed: 'jr', archetypeId: 'red' }), 0));
  run.story.v2 = StoryV2Schema.parse({ mode: 'story_run' });
  return run;
}

describe('story journal tabs', () => {
  const tab = (run: ReturnType<typeof setup>, id: string) => journalTabs(run).find((t) => t.id === id);

  it('has no tabs for a Classic run', () => {
    const run = setup();
    run.story.v2 = undefined;
    expect(journalTabs(run)).toEqual([]);
    expect(currentObjective(run)).toBeNull();
  });
  it('always has Main Story, and only shows other tabs that hold something', () => {
    expect(journalTabs(setup()).map((t) => t.id)).toEqual(['main']);
  });
  it('shows route progress, arcs (paused ones flagged) and this run\'s scenes newest first', () => {
    const run = setup();
    const v2 = run.story.v2!;
    v2.stops = { index: 3, planned: 44, done: ['a', 'b', 'c'] };
    v2.arcs = { arc_tally: { state: 'paused', step: 1, nodeCost: 0 }, arc_ghost: { state: 'active', step: 0, nodeCost: 0 } };
    v2.module = { backstory: 'bs', queue: [], active: null, activeStop: null, played: [], echoes: 0, lastSceneStop: 0, ending: null, chronicle: [], snapshots: [{ event: 'ev_one', stop: null, act: 1, text: 'First.', choice: null }, { event: 'ev_two', stop: null, act: 2, text: 'Second.', choice: null }] };
    expect(tab(run, 'main')!.rows.map((r) => [r.title, r.right])).toEqual([['Now', ''], ['Story stops', '3 / 44'], ['Arc Paused', '1']]);
    expect(currentObjective(run)).toBe('Follow up: Ghost.');
    expect(tab(run, 'quests')!.rows.map((r) => [r.title, r.right])).toEqual([['Ghost', 'In progress'], ['Tally', 'Arc Paused']]);
    expect(tab(run, 'backstory')!.rows.map((r) => r.title)).toEqual(['Two', 'One']);
  });
  it('lists rivals met and route re-plans newest first', () => {
    const run = setup();
    const v2 = run.story.v2!;
    v2.rel = { rival_pip: { respect: 50, rivalry: 50, affection: 50, suspicion: 0, met: true, gates: ['g1', 'g2'] }, rival_ada: { respect: 50, rivalry: 50, affection: 50, suspicion: 0, met: false, gates: [] } };
    v2.replans = [{ at: 4, reason: 'arc_paused' }, { at: 9, reason: 'lost_fight' }];
    expect(tab(run, 'rivals')!.rows.map((r) => [r.title, r.right])).toEqual([['Rival ada', 'Not met'], ['Rival pip', '2 meetings']]);
    expect(tab(run, 'changes')!.rows.map((r) => r.right)).toEqual(['Stop 9', 'Stop 4']);
  });
});
