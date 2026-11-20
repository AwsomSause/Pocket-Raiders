import { describe, expect, it } from 'vitest';
import { isEnemyAce, pickAceUid } from '../../src/core/battle/ace';

const mon = (uid: string, level: number) => ({ uid, level }) as never;

describe('designated trainer ace', () => {
  it('ordinary trainers need three Pokémon; a pair or a single has no ace', () => {
    expect(pickAceUid([mon('a', 10)])).toBeUndefined();
    expect(pickAceUid([mon('a', 10), mon('b', 12)])).toBeUndefined();
    expect(pickAceUid([mon('a', 10), mon('b', 12)], { named: true })).toBe('b');
  });
  it('picks the highest level, later slot on ties, and a named family beats level', () => {
    expect(pickAceUid([mon('a', 12), mon('b', 10), mon('c', 12)])).toBe('c');
    expect(pickAceUid([mon('a', 12), mon('b', 10), mon('c', 12)], { named: true, matchesFamily: (m) => m.uid === 'b' })).toBe('b');
  });
  it('the last slot is not the ace when another is designated; old saves fall back to last', () => {
    const team = [mon('a', 12), mon('b', 10), mon('caught', 8)];
    expect(isEnemyAce({ aceUid: 'a', enemyTeam: team }, 'caught')).toBe(false);
    expect(isEnemyAce({ aceUid: 'a', enemyTeam: team }, 'a')).toBe(true);
    expect(isEnemyAce({ enemyTeam: team }, 'caught')).toBe(true);
  });
});
