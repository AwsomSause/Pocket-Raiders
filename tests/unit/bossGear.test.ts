import { describe, expect, it } from 'vitest';
import { gearTeam, playerItemsPer } from '../../src/core/bossGear';
import { createPlannedPokemon, type PlannedMember } from '../../src/core/encounters';
import { getContent } from '../../src/data';

const content = getContent();
const team = (): PlannedMember[] => ['garchomp', 'blissey', 'gengar'].map((speciesId) => ({ speciesId, level: 50, moves: ['tackle'] }));

describe('boss gear', () => {
  it('champions get max IVs, capped training and an item on every Pokémon', () => {
    const out = gearTeam(content, team(), 'champion');
    for (const m of out) {
      expect(Object.keys(m.held ?? {}).length).toBe(1);
      expect(m.ivs?.atk).toBe(31);
      expect(m.training?.hp).toBe(content.balance.vitaminMaxStacks);
      expect(Object.values(m.evs ?? {}).reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(510);
    }
    const mon = createPlannedPokemon(content, out[0]!, 'x');
    expect(mon.ivs?.spe).toBe(31);
    expect(mon.held).toBeDefined();
  });
  it('gym tier is lighter than champion and keeps items already held', () => {
    const t = team();
    t[0] = { ...t[0]!, held: { 'life-orb': 1 } };
    const gym = gearTeam(content, t, 'gym');
    expect(gym[0]!.held).toEqual({ 'life-orb': 1 });
    expect(gym[1]!.training?.hp).toBe(1);
    expect(gym[1]!.ivs?.hp).toBeLessThan(31);
  });
  it('mirrors the player item count, 1 to 3, and is deterministic', () => {
    expect(playerItemsPer([])).toBe(1);
    expect(playerItemsPer([{ held: { a: 1, b: 1, c: 1, d: 1 } }])).toBe(3);
    const two = gearTeam(content, team(), 'rival', 2);
    expect(Object.keys(two[2]!.held ?? {}).length).toBe(2);
    expect(gearTeam(content, team(), 'rival', 2)).toEqual(two);
  });
});
