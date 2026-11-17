import { describe, expect, it } from 'vitest';
import { eligibleEvents, stageNumber } from '../../src/core/events';
import { stampFlagStage } from '../../src/core/events/questline';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const run = () => chooseStarter(content, createRun(content, { runId: 'r', seed: 'wm', archetypeId: 'red' }), 0);

describe('Wandering Merchant Line (S144)', () => {
  it('the route steps one visit per stage: only the next merchant is eligible', () => {
    // Catalog Overhaul (SF15 Tam's road): each visit sets its own flag (tam-met, tam-second, tam-third), and the next one waits a stage.
    const r = run();
    const ids = () => eligibleEvents(content, r).map((e) => e.id).filter((id) => id.startsWith('wm-'));
    expect(ids()).toEqual(['wm-1']);
    const visit = (key: string) => { r.story.flags[`ev:${key}`] = 1; stampFlagStage(r, key, stageNumber(content, r)); };
    visit('tam-met');
    expect(ids()).toEqual([]);
    r.stage!.index += 1;
    expect(ids()).toEqual(['wm-2']);
    visit('tam-second');
    visit('tam-third');
    r.stage!.index += 1;
    expect(ids()).toEqual(['wm-4']);
  });
  it('every visit keeps a free way out and the later ones are forced stops', () => {
    for (const id of ['wm-1', 'wm-2', 'wm-3', 'wm-4']) expect(content.events.get(id)!.choices.some((c) => !c.requires.length)).toBe(true);
    for (const id of ['wm-2', 'wm-3', 'wm-4']) expect(content.events.get(id)!.callback).toBe(true);
  });
});
