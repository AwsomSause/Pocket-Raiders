import { describe, expect, it } from 'vitest';
import { hooksOf } from '../../src/core/battle/held';
import { completeSets, ITEM_SETS, itemSetProblems, setHooks } from '../../src/core/itemSets';
import { createPokemon } from '../../src/core/pokemon';
import { content } from './helpers';

describe('Item Sets (S79, S431)', () => {
  it('every set uses real, supported, non-team held items', () => {
    expect(itemSetProblems(content)).toEqual([]);
    expect(ITEM_SETS.length).toBeGreaterThanOrEqual(8);
  });

  it('a set only counts when every item is held', () => {
    expect(completeSets(undefined)).toEqual([]);
    expect(completeSets({ 'muscle-band': 1 })).toEqual([]);
    expect(completeSets({ 'muscle-band': 1, 'black-belt': 0 })).toEqual([]);
    expect(completeSets({ 'muscle-band': 1, 'black-belt': 1 }).map((s) => s.id)).toEqual(['bruiser']);
    expect(setHooks({ 'muscle-band': 1, 'black-belt': 1 }).every((h) => h.itemId === 'set:bruiser')).toBe(true);
  });

  it('the bonus shows up in the battle hooks of the holder only', () => {
    const mon = createPokemon(content, 'machamp', 30, 'm');
    const plain = hooksOf({ content }, mon, 'player').length;
    mon.held = { 'muscle-band': 1, 'black-belt': 1 };
    const withPair = hooksOf({ content }, mon, 'player');
    expect(withPair.some((h) => h.itemId === 'set:bruiser' && h.hook.hook === 'stat')).toBe(true);
    expect(withPair.length).toBeGreaterThan(plain);
    const other = createPokemon(content, 'machamp', 30, 'o');
    other.held = { 'muscle-band': 1 };
    expect(hooksOf({ content }, other, 'player').some((h) => h.itemId.startsWith('set:'))).toBe(false);
  });
});
