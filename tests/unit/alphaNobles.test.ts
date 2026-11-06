// S498 Alpha Nobles: each frenzied noble can be calmed (joins you) or fought, and both paths are valid.

import { describe, expect, it } from 'vitest';
import { content } from './helpers';

const nobles = [...content.events.values()].filter((e) => e.id.startsWith('alpha-noble-'));

describe('Alpha Nobles', () => {
  it('there are eight, in their own group', () => {
    expect(nobles).toHaveLength(8);
    for (const e of nobles) expect(e.group).toBe('Alpha Nobles');
  });
  it('calming joins the noble, failing or choosing to fight starts a battle with the same species', () => {
    for (const e of nobles) {
      const species = e.id.slice('alpha-noble-'.length);
      expect(content.species.has(species), species).toBe(true);
      const [calm, fightIt, leave] = e.choices;
      expect(JSON.stringify(calm!.success)).toContain('"kind":"join"');
      expect(JSON.stringify(calm!.success)).toContain(species);
      expect(calm!.prompt, e.id).toBeTruthy();
      expect(calm!.failure?.battle, e.id).toBeTruthy();
      expect(fightIt!.success.battle, e.id).toBeTruthy();
      expect(leave!.success.battle).toBeUndefined();
    }
  });
});
