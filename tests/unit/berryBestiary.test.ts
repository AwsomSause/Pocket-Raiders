import { describe, expect, it } from 'vitest';
import { berryEntries, berryLines } from '../../src/core/tools/berryBestiary';
import { content } from './helpers';

describe('Berry Bestiary (S422)', () => {
  const list = berryEntries(content);
  it('lists every held berry once, with an effect text', () => {
    expect(list.length).toBeGreaterThanOrEqual(20);
    expect(new Set(list.map((b) => b.id)).size).toBe(list.length);
    for (const b of list) expect(b.effect.length).toBeGreaterThan(3);
  });
  it('marks cross-bred berries and gives each a page', () => {
    expect(list.find((b) => b.id === 'lansat-berry')?.crossBred).toBe(true);
    expect(list.find((b) => b.id === 'oran-berry')?.crossBred).toBe(false);
    for (const b of list) expect(berryLines(b).length).toBe(4);
  });
});
