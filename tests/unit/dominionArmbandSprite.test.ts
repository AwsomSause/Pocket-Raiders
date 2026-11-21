import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { armbandColumn, armbandFile } from '../../src/core/dominion/armbandSprite';

describe('Dominion armband sprites', () => {
  it('has a sheet for every letter A to Z', () => {
    for (const L of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      const f = armbandFile(L.toLowerCase())!;
      expect(f).toBe(`dominion/armbands/${L}.png`);
      expect(existsSync(`public/assets/images/${f}`)).toBe(true);
    }
  });
  it('gives no sheet for a non-letter', () => {
    for (const x of ['', '1', '✦', 'AB']) expect(armbandFile(x)).toBeNull();
  });
  it('picks the cell nearest the primary on that letter\'s own sheet', () => {
    expect(armbandColumn('A', '#b01a20')).toBe(0);
    expect(armbandColumn('A', '#f0cc36')).toBe(6);
    expect(armbandColumn('N', '#5fdcdd')).toBe(5);
    expect(armbandColumn('n', '#5fdcdd')).toBe(5);
    expect(armbandColumn('?', '#5fdcdd')).toBe(0);
  });
  it('has 8 colours for each of the 26 sheets', () => {
    for (const L of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') expect(armbandColumn(L, '#123456')).toBeLessThan(8);
  });
});
