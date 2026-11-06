import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { notebookEntry, rivalNotebook } from '../../src/core/rivals/notebook';
import { chooseStarter, createRun } from '../../src/core/run';
import type { Rival } from '../../src/core/story/schema';

const run0 = () => structuredClone(chooseStarter(content, createRun(content, { runId: 'nb', seed: 'nb', archetypeId: 'red' }), 0));
const rival = (over: Partial<Rival> = {}): Rival =>
  ({
    id: 'r1', name: 'Blue', classId: 'youngster', archetype: 'x', style: 'y', rivalPotential: 10, state: 'active', encounters: 0, setbacks: 0, away: 0, cooldown: 0, progress: 0, bonds: {}, offscreen: [], adaptations: [],
    arc: null, origin: { eventId: 'e', where: { region: 0, stage: 1, turn: 0 }, path: 'p' },
    traits: { empathy: 50, vindictiveness: 30, resilience: 50, pride: 40, ambition: 50, adaptability: 90 },
    memory: { lastBattle: { eventId: 'e', result: 'lose', hpLeftShare: 0.5, turns: 6, team: ['pidgey'] } },
    ...over,
  }) as unknown as Rival;

describe('rival Notebook', () => {
  it('is empty with no rivals', () => expect(rivalNotebook(content, run0())).toEqual([]));
  it('shows nothing learned before a fight (normal / failure)', () => {
    const run = run0();
    const e = notebookEntry(content, run, rival());
    expect(e.watched).toEqual([]);
    expect(e.lines.join(' ')).toContain('nothing to counter');
  });
  it('lists only what the rival saw, not the live party (boundary)', () => {
    const run = run0();
    const r = rival({ encounters: 2, seen: [{ signal: 'moveType', value: 'fire', source: 'fought', at: 'x', uses: 3 }, { signal: 'moveType', value: 'water', source: 'fought', at: 'y', uses: 1 }], adaptations: ['packed a Water Pokémon'] });
    const e = notebookEntry(content, run, r);
    expect(e.watched).toEqual(['Fire', 'Water']);
    expect(e.record).toContain('2 fights');
    expect(e.record).toContain('lost');
    expect(e.adaptations).toEqual(['packed a Water Pokémon']);
  });
  it('puts the major rival first and does not change the run', () => {
    const run = run0();
    run.story.rivals.push(rival({ id: 'a', name: 'A', encounters: 5 }), rival({ id: 'b', name: 'B', major: true }));
    const before = JSON.stringify(run);
    const list = rivalNotebook(content, run);
    expect(list.map((e) => e.id)).toEqual(['b', 'a']);
    expect(JSON.stringify(run)).toBe(before);
  });
});
