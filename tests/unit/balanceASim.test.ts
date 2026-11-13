// Beta 0.6 B2 sim: 300 seeded runs of 40 wild draws each; the dampeners must flatten the species spread.
import { describe, expect, it } from 'vitest';
import { hashSeed, Rng } from '../../src/core/rng';
import { pickThemeSpecies } from '../../src/core/themes';
import { rememberPick } from '../../src/core/variety';
import { wildMetWeight } from '../../src/core/wildDampers';
import { content } from './helpers';

function spread(damp: boolean): { ratio: number; early: number } {
  const total = new Map<string, number>();
  let earlyRepeats = 0;
  const themes = [...content.themes.values()];
  for (let r = 0; r < 300; r++) {
    const rng = new Rng(hashSeed(`balA:${r}`));
    const run = { history: {} as Record<string, string[]> };
    const seen: string[] = [];
    for (let i = 0; i < 40; i++) {
      const theme = themes[(r + Math.floor(i / 4)) % themes.length]!;
      const w = damp ? wildMetWeight(content, run) : undefined;
      const id = pickThemeSpecies(content, theme, rng, undefined, 'kanto', w, 30);
      if (i < 6 && seen.includes(id)) earlyRepeats++;
      seen.push(id);
      rememberPick(content, run, 'wildMet', id);
      total.set(id, (total.get(id) ?? 0) + 1);
    }
  }
  const counts = [...total.values()].sort((a, b) => a - b);
  return { ratio: counts[counts.length - 1]! / counts[Math.floor(counts.length / 2)]!, early: earlyRepeats };
}

describe('B2 sim', () => {
  it('dampeners cut the top-species ratio and early repeats', () => {
    const off = spread(false);
    const on = spread(true);
    console.log('B2 sim', JSON.stringify({ off, on }));
    expect(on.ratio).toBeLessThan(off.ratio);
    expect(on.early).toBeLessThan(off.early);
    expect(on.early).toBe(0);
  });
});
