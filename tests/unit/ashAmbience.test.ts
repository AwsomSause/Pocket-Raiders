import { describe, expect, it } from 'vitest';
import { AMBIENCE, hasAsh } from '../../src/ui/battleFx/ambience';

describe('S251 ash particles', () => {
  it('falls only in Fire arenas', () => {
    expect(hasAsh(['fire'])).toBe(true);
    expect(hasAsh(['water', 'fire'])).toBe(true);
    expect(hasAsh(['water'])).toBe(false);
    expect(hasAsh([])).toBe(false);
    expect(hasAsh(['water', 'grass', 'fire'])).toBe(false);
  });
  it('has a falling grey preset', () => {
    expect(AMBIENCE.ash!.flow).toBe('fall');
  });
});
