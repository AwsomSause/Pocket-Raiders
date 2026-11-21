import { describe, expect, it } from 'vitest';
import { logRow, logRows } from '../../src/ui/logRows';

// The Phantom battle log (mock-up blog): who acted, the move in gold, and a tag where each turn starts.

describe('logRow', () => {
  it('finds who acted on either side and the move used', () => {
    expect(logRow('Charizard used Air Slash!', ['Charizard'], ['Garchomp'])).toEqual({ who: 'Charizard', foe: false, text: 'used Air Slash!', move: 'Air Slash' });
    expect(logRow('The wild Garchomp used Swords Dance!', ['Charizard'], ['Garchomp'])).toMatchObject({ who: 'Garchomp', foe: true, move: 'Swords Dance' });
    expect(logRow("Garchomp's Attack rose!", ['Charizard'], ['Garchomp'])).toEqual({ who: 'Garchomp', foe: true, text: 'Its Attack rose!' });
  });
  it('keeps the longest name and counts a mirror match as yours unless the line says foe', () => {
    expect(logRow('Delta Wooper used Vine Whip!', [], ['Wooper', 'Delta Wooper']).who).toBe('Delta Wooper');
    expect(logRow('Pikachu used Thunder Wave!', ['Pikachu'], ['Pikachu']).foe).toBe(false);
    expect(logRow("Foe's Pikachu used Thunder Wave!", ['Pikachu'], ['Pikachu']).foe).toBe(true);
  });
  it('leaves field lines and partial names alone, and gives speech to its speaker', () => {
    expect(logRow('Rain began to fall.', ['Charizard'], ['Garchomp'])).toEqual({ text: 'Rain began to fall.' });
    expect(logRow('Charizardite glows!', ['Charizard'], [])).toEqual({ text: 'Charizardite glows!' });
    expect(logRow('Blue: “Smell ya later!”', ['Charizard'], [])).toEqual({ who: 'Blue', foe: true, text: '“Smell ya later!”' });
  });
});

describe('logRows', () => {
  it('tags the first row of each turn; a line with someone in it gets a tag row of its own', () => {
    const rows = logRows([
      { text: 'Rain began to fall.', turn: 1 },
      { text: 'Charizard used Air Slash!', turn: 1 },
      { text: 'Garchomp used Earthquake!', turn: 2 },
      { text: 'It does not affect Charizard.', turn: 2 },
    ], ['Charizard'], ['Garchomp']);
    expect(rows.map((r) => [r.turn ?? null, r.who ?? null])).toEqual([[1, null], [null, 'Charizard'], [2, null], [null, 'Garchomp'], [null, null]]);
    expect(rows[2]!.text).toBe('');
  });
  it('is empty for no lines and skips turn 0 tags', () => {
    expect(logRows([], [], [])).toEqual([]);
    expect(logRows([{ text: 'Go! Charizard!', turn: 0 }], ['Charizard'], [])[0]!.turn).toBeUndefined();
  });
});
