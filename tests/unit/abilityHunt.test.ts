// Hidden Ability Hunts (S229).
import { describe, expect, it } from 'vitest';
import { abilityHunt } from '../../src/core/abilityHunt';
import { content } from './helpers';

describe('hidden ability hunts', () => {
  it('lists the ways for a species with a Hidden Ability', () => {
    const hunt = abilityHunt(content, { mastery: {} }, 'pikachu');
    expect(hunt.has).toBe(true);
    expect(hunt.unlocked).toBe(false);
    expect(hunt.ability).not.toBe('');
    expect(hunt.ways.join(' ')).toMatch(/Silver/);
    expect(hunt.ways.join(' ')).toMatch(/Eggs/);
  });
  it('is empty for a species without one, or an unknown family', () => {
    const none = [...content.species.values()].find((s) => !s.abilities.hidden)!;
    expect(abilityHunt(content, { mastery: {} }, none.id).has).toBe(false);
    expect(abilityHunt(content, { mastery: {} }, 'nope')).toEqual({ has: false, ability: '', unlocked: false, ways: [] });
  });
  it('shows Silver as unlocked once the family reaches it', () => {
    const hunt = abilityHunt(content, { mastery: { pikachu: { seen: 9, caught: 9, battles: 999, bossWins: 9, evolved: 9, flawless: 9, regions: 0 } } }, 'pikachu');
    expect(hunt.unlocked).toBe(true);
  });
});
