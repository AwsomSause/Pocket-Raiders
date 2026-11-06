import { beforeEach, describe, expect, it } from 'vitest';
import { ensureNarration, partyNarration, resetNarration } from '../../src/core/overhaul/partyNarration';
import { content } from './helpers';

const party = ['bulbasaur', 'charmander', 'squirtle', 'pikachu'].map((speciesId, i) => ({ uid: `m${i}`, nature: 'hardy' as const, speciesId }));
const nameOf = (m: { speciesId: string }) => content.species.get(m.speciesId)?.name ?? m.speciesId;
const typesOf = (m: { speciesId: string }) => content.species.get(m.speciesId)?.types ?? [];

describe('overhaul party narration', () => {
  beforeEach(() => resetNarration());
  it('is silent until the lines load', () => {
    expect(partyNarration(party, 'rest_node', 'k', nameOf, typesOf)).toBeNull();
  });
  it('speaks after load, repeatably, with no leftover placeholders', async () => {
    await ensureNarration();
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const a = partyNarration(party, 'rest_node', `run:${i}`, nameOf, typesOf);
      expect(a).toBe(partyNarration(party, 'rest_node', `run:${i}`, nameOf, typesOf));
      if (a) {
        expect(a).not.toMatch(/[{}]/);
        seen.add(a);
      }
    }
    expect(seen.size).toBeGreaterThan(5);
    expect(partyNarration(party, 'battle_win', 'run:1', nameOf, typesOf)).toBeTruthy();
  });
  it('serves the place and hour contexts too', async () => {
    await ensureNarration();
    for (const c of ['night', 'sunny', 'boss_intro']) {
      const lines = new Set(Array.from({ length: 30 }, (_, i) => partyNarration(party, c, `k${i}`, nameOf, typesOf)).filter(Boolean));
      expect(lines.size, c).toBeGreaterThan(0);
    }
  });
  it('an empty party has nothing to say', async () => {
    await ensureNarration();
    expect(partyNarration([], 'rest_node', 'k', nameOf, typesOf)).toBeNull();
  });
});
