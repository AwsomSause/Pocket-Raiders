import { describe, expect, it } from 'vitest';
import { bracketLines, makeBracket, parseNames } from '../../src/core/tools/bracket';

describe('tournament bracket', () => {
  it('parses names', () => expect(parseNames(' ann, bob\n\ncy ,')).toEqual(['ann', 'bob', 'cy']));
  it('is the same for the same seed and differs for another', () => {
    const n = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    expect(makeBracket(n, 'x')).toEqual(makeBracket(n, 'x'));
    expect(JSON.stringify(makeBracket(n, 'x'))).not.toBe(JSON.stringify(makeBracket(n, 'y')));
  });
  it.each([2, 3, 5, 8, 13, 32])('%i players: everyone plays once in round 1 or gets a bye, no double byes', (count) => {
    const names = Array.from({ length: count }, (_, i) => `p${i}`);
    const r = makeBracket(names, 's');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const first = r.rounds[0]!;
    const seen = first.flatMap((m) => [m.a, m.b]).filter(Boolean);
    expect(seen.sort()).toEqual([...names].sort());
    expect(first.every((m) => m.a !== null)).toBe(true);
    expect(r.rounds.at(-1)).toHaveLength(1);
    expect(bracketLines(r.rounds).length).toBeGreaterThan(count - 1);
  });
  it('refuses bad input', () => {
    expect(makeBracket(['a'], 's').ok).toBe(false);
    expect(makeBracket(['a', 'A'], 's').ok).toBe(false);
    expect(makeBracket(Array.from({ length: 33 }, (_, i) => `p${i}`), 's').ok).toBe(false);
  });
});
