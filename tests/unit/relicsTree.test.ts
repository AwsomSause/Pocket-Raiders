import { describe, expect, it } from 'vitest';
import { conditionMet } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const BRANCHES = ['ember', 'tide', 'leaf'];

describe('Relics Tree (S373)', () => {
  const run = () => structuredClone(chooseStarter(content, createRun(content, { runId: 'r', seed: 'tree', archetypeId: 'red' }), 0));
  const open = (id: string, r: ReturnType<typeof run>) => content.events.get(id)!.requires.every((c) => conditionMet(content, r, c));

  it('has a root, and a bough and crown for every branch', () => {
    expect(content.events.get('relic-tree-roots')).toBeDefined();
    for (const b of BRANCHES) for (const t of ['bough', 'crown']) expect(content.events.get(`relic-tree-${b}-${t}`), `${b} ${t}`).toBeDefined();
  });

  it('grows one tier at a time, on the branch you chose', () => {
    const r = run();
    expect(open('relic-tree-roots', r)).toBe(true);
    expect(open('relic-tree-ember-bough', r)).toBe(false);
    r.story.flags['ev:tree-ember'] = 1;
    r.story.flags['ev:tree-branch'] = 1;
    expect(open('relic-tree-roots', r)).toBe(false);
    expect(open('relic-tree-ember-bough', r)).toBe(true);
    expect(open('relic-tree-tide-bough', r)).toBe(false);
    expect(open('relic-tree-ember-crown', r)).toBe(false);
    r.story.flags['ev:tree-ember'] = 2;
    expect(open('relic-tree-ember-bough', r)).toBe(false);
    expect(open('relic-tree-ember-crown', r)).toBe(true);
  });

  it('each tier-taking choice gives a relic and moves the branch up one', () => {
    for (const b of BRANCHES) for (const t of ['bough', 'crown']) {
      const take = content.events.get(`relic-tree-${b}-${t}`)!.choices[0]!.success.effects;
      expect(take.some((e) => e.kind === 'relic')).toBe(true);
      expect(take.some((e) => e.kind === 'flag' && e.key === `tree-${b}` && e.amount === 1)).toBe(true);
    }
  });
});
