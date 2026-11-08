import { describe, expect, it } from 'vitest';
import { PLAYER_TRAINER_IDS, isPlayerTrainer, playerTrainerFor } from '../../src/core/archetypes';
import { LOOKS, lookReady } from '../../src/core/story2/identity';

describe('player characters (Beta 0.5)', () => {
  it('are Red, Blue, Green, Hilda and Nate', () => {
    expect([...PLAYER_TRAINER_IDS]).toEqual(['red', 'blue', 'green', 'hilda', 'nate']);
    expect(isPlayerTrainer('cynthia')).toBe(false);
    expect(isPlayerTrainer('evolved-red')).toBe(true);
  });
  it('keeps Nate and Hilda, and maps every other id to one of the five, always the same one', () => {
    expect(playerTrainerFor('nate')).toBe('nate');
    expect(playerTrainerFor('hilda')).toBe('hilda');
    for (const id of ['cynthia', 'evolved-cynthia', 'npc-tuber-pip', '']) {
      expect(isPlayerTrainer(playerTrainerFor(id))).toBe(true);
      expect(playerTrainerFor(id)).toBe(playerTrainerFor(id));
    }
  });
  it('offers both Looks in the picker', () => {
    expect(LOOKS.filter((l) => lookReady(l.id)).map((l) => l.id)).toEqual(['look_a', 'look_b']);
  });
});

import archetypes from '../../src/data/archetypes.json';
describe('Hilda and Nate are a mirrored pair', () => {
  const get = (id: string) => (archetypes as any[]).find((a) => a.id === id);
  it('trade first-attack for later-attack damage, with fire against water', () => {
    const h = get('hilda').modifiers.find((m: any) => m.kind === 'firstAttackDamage');
    const n = get('nate').modifiers.find((m: any) => m.kind === 'firstAttackDamage');
    expect(h.first).toBe(1.3);
    expect(n.later).toBe(1.15);
    expect(h.later).toBeLessThan(1);
    expect(n.first).toBeLessThan(1);
    expect(get('hilda').signatureTypes).toEqual(['fire']);
    expect(get('nate').signatureTypes).toEqual(['water']);
    expect(get('hilda').unlockedByDefault && get('nate').unlockedByDefault).toBe(true);
  });
});
