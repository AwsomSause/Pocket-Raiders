import { beforeEach, describe, expect, it } from 'vitest';
import { countedScene, ensureNarration, finisherScene, partyNarration, resetNarration } from '../../src/core/overhaul/partyNarration';
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
  it('finisher scenes need the exact species and move', async () => {
    expect(finisherScene('bulbasaur', 'Frenzy Plant')).toBeNull();
    await ensureNarration();
    expect(finisherScene('bulbasaur', 'Frenzy Plant')).toMatch(/Frenzy Plant finishes a boss battle/);
    expect(finisherScene('bulbasaur', 'Tackle')).toBeNull();
    expect(finisherScene('missingno', 'Frenzy Plant')).toBeNull();
  });
  it('badge reactions exist', async () => {
    await ensureNarration();
    expect(Array.from({ length: 30 }, (_, i) => partyNarration(party, 'badge', `k${i}`, nameOf, typesOf)).some(Boolean)).toBe(true);
  });
  it('counted scenes fire once, on the exact count, and only after load', async () => {
    const names = (k: string, id: string) => (k === 'move' ? (id === 'bug-bite' ? 'Bug Bite' : id) : id.replaceAll('-', ' '));
    const mon = { uid: 'u1', speciesId: 'metapod' };
    const use = Array.from({ length: 10 }, () => ({ type: 'move', side: 'player', moveId: 'bug-bite' }));
    expect(countedScene({}, mon, use, names)).toBeNull();
    await ensureNarration();
    const counters: Record<string, number> = {};
    expect(countedScene(counters, mon, use.slice(0, 9), names)).toBeNull();
    expect(countedScene(counters, mon, use.slice(9), names)).toMatch(/tenth time Metapod uses Bug Bite/);
    expect(countedScene(counters, mon, use.slice(9), names)).toBeNull();
    expect(counters['pack.use.u1.bug-bite']).toBe(11);
    expect(countedScene({}, undefined, use, names)).toBeNull();
    // the enemy's moves are never counted
    expect(countedScene({}, mon, use.map((e) => ({ ...e, side: 'enemy' })), names)).toBeNull();
  });
  it('evolution, hatch and new member reactions exist', async () => {
    await ensureNarration();
    for (const c of ['evolution', 'hatch', 'new_member']) {
      expect(Array.from({ length: 30 }, (_, i) => partyNarration(party, c, `k${i}`, nameOf, typesOf)).some(Boolean), c).toBe(true);
    }
  });
  it('an empty party has nothing to say', async () => {
    await ensureNarration();
    expect(partyNarration([], 'rest_node', 'k', nameOf, typesOf)).toBeNull();
  });
});
