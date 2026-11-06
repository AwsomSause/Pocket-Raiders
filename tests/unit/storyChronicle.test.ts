import { describe, expect, it } from 'vitest';
import { buildChronicle, chronicleTitle, closestBond, recordChronicle } from '../../src/core/story2/chronicle';
import { change, freshRecord, meet } from '../../src/core/story2/relationships';
import { StoryV2Schema, freshProfileStory } from '../../src/core/story2/schema';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const run = () => structuredClone(chooseStarter(content, createRun(content, { runId: 'ch1', seed: 'seed1', archetypeId: 'red' }), 0));
const storyRun = () => {
  const r = run();
  const v2 = StoryV2Schema.parse({ mode: 'story_run', protagonist: { look: 'look_a', name: 'W', pronouns: 'they', backstory: 'bs_viridian' }, starter: { lineId: 'rm_tuftin', temperament: 'warm' } });
  const met = freshRecord(); meet(met, 1); change(met, { trust: 40 }, 2); met.stage = 'friendly';
  v2.cast.ch_vance = met; v2.cast.ch_tally = freshRecord();
  v2.stops.done = ['s1', 's2']; v2.stops.planned = 44; v2.scenesDone = Array.from({ length: 15 }, (_, i) => `scene_${i}`); v2.facts.story_losses = 2;
  r.story.v2 = v2;
  return r;
};

describe('run chronicle', () => {
  it('a Classic run has no Chronicle', () => {
    expect(buildChronicle(run(), 'now')).toBeNull();
  });
  it('records stops, losses, met characters only, and at most 12 highlights', () => {
    const rec = buildChronicle(storyRun(), '2026-11-06T00:00:00.000Z')!;
    expect(rec).toMatchObject({ runId: 'ch1', backstory: 'bs_viridian', starter: { line: 'rm_tuftin', temperament: 'warm' }, stops: { done: 2, planned: 44 }, losses: 2, relationships: { ch_vance: 'friendly' } });
    expect(rec.highlights).toHaveLength(12);
    expect(closestBond(rec)).toBe('ch_vance');
  });
  it('is recorded once per run and capped at 40, newest last', () => {
    const p = { story: freshProfileStory() };
    const r = storyRun();
    recordChronicle(p as never, r, 't1'); recordChronicle(p as never, r, 't2');
    expect(p.story.chronicles).toHaveLength(1);
    for (let i = 0; i < 45; i++) { const x = storyRun(); x.runId = `more${i}`; recordChronicle(p as never, x, 't'); }
    expect(p.story.chronicles).toHaveLength(40);
    expect(p.story.chronicles.at(-1)!.runId).toBe('more44');
  });
  it('titles name the theme and how the run ended', () => {
    expect(chronicleTitle('th_marauder_conspiracy', true)).toBe('Marauder conspiracy: The Road Home');
    expect(chronicleTitle(undefined, false)).toBe('A Story: An Unfinished Road');
  });
});

import { chronicleView } from '../../src/core/story2/chronicle';
describe('chronicle page', () => {
  it('opens with "In this telling," and names the cast', () => {
    const rec = buildChronicle(storyRun(), '2026-11-06T00:00:00.000Z')!;
    const v = chronicleView(content.storyData, rec);
    expect(v.lines[0]).toMatch(/^In this telling,/);
    expect(v.lines.join('\n')).toContain('Professor Ottoline Vance: Friendly');
    expect(v.lines.join('\n')).toContain('2 setbacks, and the road went on');
    expect(v.sub).toContain('2/44 stops');
  });
});
