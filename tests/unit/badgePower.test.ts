// Badge Powers (idea S483): a badge boosts your Pokémon of the Gym Leader's type.
import { describe, expect, it } from 'vitest';
import { badgeTypesOf, getArchetype, typeModifiers } from '../../src/core/archetypes';
import { content } from './helpers';

const bp = content.balance.badgePower;
const base = getArchetype(content, content.archetypes.keys().next().value!);

describe('badge powers', () => {
  it('no badges changes nothing', () => {
    expect(typeModifiers(base, [], bp)).toEqual(typeModifiers(base));
  });
  it("Brock's badge boosts Rock and cuts Rock's weakness damage", () => {
    const types = badgeTypesOf(content, ['brock']);
    expect(types).toContain('rock');
    const m = typeModifiers(base, types, bp);
    const b = typeModifiers(base);
    expect(m.damageDealt.rock).toBeCloseTo((b.damageDealt.rock ?? 1) * (1 + bp.damagePerBadge));
    expect(m.weaknessTaken.rock).toBeLessThan(b.weaknessTaken.rock ?? 1);
  });
  it('stacks stop at maxStacks and an unknown badge adds nothing', () => {
    const many = Array(bp.maxStacks + 5).fill('rock' as const);
    const m = typeModifiers(base, many, bp);
    expect(m.damageDealt.rock).toBeCloseTo((typeModifiers(base).damageDealt.rock ?? 1) * (1 + bp.damagePerBadge * bp.maxStacks));
    expect(badgeTypesOf(content, ['no-such-leader'])).toEqual([]);
  });
});
