import { describe, expect, it } from 'vitest';
import { categoryOf, modifiersIn, replacedBy, toggleModifier, usedCategories } from '../../src/core/modifierCategories';
import { RUN_RULES, STANDARD_CHOICE, rulesProblem } from '../../src/core/rules';

describe('modifier categories', () => {
  it('puts every modifier in exactly one category, none left in Other', () => {
    const total = usedCategories().reduce((n, c) => n + modifiersIn(c.id).length, 0);
    expect(total).toBe(RUN_RULES.modifiers.length);
    expect(RUN_RULES.modifiers.filter((m) => categoryOf(m.group).id === 'other').map((m) => m.id)).toEqual([]);
  });
  it('unknown groups fall into Other', () => {
    expect(categoryOf('brand-new-group').id).toBe('other');
  });
  it('toggling on, off, and swapping within a group', () => {
    const a = toggleModifier(STANDARD_CHOICE, 'monotype');
    expect(a.modifierIds).toEqual(['monotype']);
    expect(replacedBy(a, 'solo-run')).toEqual(['Monotype']);
    const b = toggleModifier(a, 'solo-run');
    expect(b.modifierIds).toEqual(['solo-run']);
    expect(rulesProblem(b)).toBeNull();
    expect(toggleModifier(b, 'solo-run').modifierIds).toEqual([]);
  });
  it('planned and unknown modifiers cannot be turned on', () => {
    expect(toggleModifier(STANDARD_CHOICE, 'quick-route')).toBe(STANDARD_CHOICE);
    expect(toggleModifier(STANDARD_CHOICE, 'nope')).toBe(STANDARD_CHOICE);
  });
});
