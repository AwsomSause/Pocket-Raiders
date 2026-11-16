// S498 Alpha Nobles, rebuilt by the Catalog Overhaul (A1 The Noble Frenzy, families-c-7): each frenzied Noble is calmed in
// a wild fight with a Calm meter (a turn it isn't hurt fills it), or refused. The room after it tells calmed from beaten.

import { describe, expect, it } from 'vitest';
import { content } from './helpers';

const nobles = [...content.events.values()].filter((e) => /^alpha-noble-[a-z]+$/.test(e.id));

describe('Alpha Nobles', () => {
  it('there are eight, in their own group, each with its room after', () => {
    expect(nobles).toHaveLength(8);
    for (const e of nobles) {
      expect(e.group).toBe('Alpha Nobles');
      expect(content.events.get(`${e.id}-after`)?.room, e.id).toBe(true);
    }
  });
  it('calming is a friendly wild fight against the same species with a Calm meter; refusing starts no fight', () => {
    for (const e of nobles) {
      const species = e.id.slice('alpha-noble-'.length);
      expect(content.species.has(species), species).toBe(true);
      const [show, why, refuse] = e.choices;
      for (const c of [show!, why!]) {
        const b = c.success.battle as { kind: string; species: string[]; rule?: { calm?: number }; friendly?: boolean } | undefined;
        expect(b?.kind, e.id).toBe('wild');
        expect(b?.species).toEqual([species]);
        expect(b?.rule?.calm).toBe(3);
        expect(b?.friendly).toBe(true);
      }
      expect(refuse!.success.battle).toBeUndefined();
      // The room after: calmed (the meter filled) is a Remembers variant on the engine's `co-calm-done`.
      const after = content.events.get(`${e.id}-after`)!;
      expect(JSON.stringify(after.remembers)).toContain('co-calm-done');
    }
  });
});
