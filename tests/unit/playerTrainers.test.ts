import { describe, expect, it } from 'vitest';
import { PLAYER_TRAINER_IDS, isPlayerTrainer, playerTrainerFor } from '../../src/core/archetypes';
import { LOOKS, lookReady } from '../../src/core/story2/identity';

describe('player characters (Beta 0.5)', () => {
  it('are only Nate and Hilda', () => {
    expect([...PLAYER_TRAINER_IDS]).toEqual(['nate', 'hilda']);
    expect(isPlayerTrainer('red')).toBe(false);
  });
  it('keeps Nate and Hilda, and maps every other id to one of them, always the same one', () => {
    expect(playerTrainerFor('nate')).toBe('nate');
    expect(playerTrainerFor('hilda')).toBe('hilda');
    for (const id of ['red', 'cynthia', 'evolved-red', 'npc-tuber-pip', '']) {
      expect(isPlayerTrainer(playerTrainerFor(id))).toBe(true);
      expect(playerTrainerFor(id)).toBe(playerTrainerFor(id));
    }
  });
  it('shows no unready Look in the picker', () => {
    expect(LOOKS.filter((l) => lookReady(l.id)).map((l) => l.id)).toEqual(['look_a']);
  });
});
