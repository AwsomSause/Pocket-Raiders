import { describe, expect, it } from 'vitest';
import { eligibleEvents } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const run = () => chooseStarter(content, createRun(content, { runId: 'r', seed: 'wm', archetypeId: 'red' }), 0);

describe('Wandering Merchant Line (S144)', () => {
  it('the route steps one visit per stage: only the next merchant is eligible', () => {
    const r = run();
    const ids = () => eligibleEvents(content, r).map((e) => e.id).filter((id) => id.startsWith('wm-'));
    expect(ids()).toEqual(['wm-1']);
    r.story.flags['ev:wm-route'] = 1;
    expect(ids()).toEqual(['wm-1', 'wm-2']);
    r.story.flags['ev:wm-route'] = 3;
    expect(ids()).toContain('wm-4');
    expect(ids()).not.toContain('wm-2');
  });
  it('every visit keeps a free way out and the later ones are forced stops', () => {
    for (const id of ['wm-1', 'wm-2', 'wm-3', 'wm-4']) expect(content.events.get(id)!.choices.some((c) => !c.requires.length)).toBe(true);
    for (const id of ['wm-2', 'wm-3', 'wm-4']) expect(content.events.get(id)!.callback).toBe(true);
  });
});
