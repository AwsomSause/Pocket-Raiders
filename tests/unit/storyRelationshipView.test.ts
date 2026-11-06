import { describe, expect, it } from 'vitest';
import { markRelationshipsSeen, relationshipRows, seenKey } from '../../src/core/story2/relationshipView';
import { change, endNode, freshRecord, meet, remember } from '../../src/core/story2/relationships';
import { StoryV2Schema } from '../../src/core/story2/schema';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const data = content.storyData;
function setup() {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'rv', seed: 'rv', archetypeId: 'red' }), 0));
  const v2 = StoryV2Schema.parse({ mode: 'story_run' });
  const met = freshRecord(); meet(met, 1); change(met, { trust: 60, respect: 30 }, 2); remember(met, 'shared_umbrella', 6, 2);
  v2.cast.ch_vance = met;
  v2.cast.ch_tally = freshRecord(); // never met
  run.story.v2 = v2;
  return run;
}

describe('relationship view', () => {
  it('lists only met characters, with names, bars and memories', () => {
    const run = setup();
    const rows = relationshipRows(data, run);
    expect(rows.map((r) => r.id)).toEqual(['ch_vance']);
    expect(rows[0]!.name).toBe(data.text['ch.ch_vance.name']);
    expect(rows[0]!.bars.find((b) => b.attr === 'trust')!.pips).toBe('■■■□□');
    expect(rows[0]!.memories).toEqual(['Shared umbrella']);
  });
  it('pulses until the page is opened, and again after a stage change', () => {
    const run = setup();
    expect(relationshipRows(data, run)[0]!.pulse).toBe(true);
    markRelationshipsSeen(run);
    expect(run.story.flags[seenKey('ch_vance')]).toBeDefined();
    expect(relationshipRows(data, run)[0]!.pulse).toBe(false);
    const rec = run.story.v2!.cast.ch_vance!;
    change(rec, { trust: 30, respect: 40, affection: 40 }, 3); endNode(rec); endNode(rec);
    expect(relationshipRows(data, run)[0]!.pulse).toBe(true);
  });
  it('a run with no story state shows nothing', () => {
    const run = setup(); run.story.v2 = undefined;
    expect(relationshipRows(data, run)).toEqual([]);
  });
});
