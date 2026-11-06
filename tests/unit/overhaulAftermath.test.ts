import { describe, expect, it } from 'vitest';
import { aftermathLine, aftermathLines, recordAftermath } from '../../src/core/overhaul/aftermath';
import { overhaulCatalogs } from '../../src/core/overhaul/catalogs';
import type { RunState } from '../../src/core/state';

const bosses = overhaulCatalogs().major_trainers.entries.filter((t) => t.bossId);
const fake = (seed = 's1') => ({ seed, story: { flags: {} as Record<string, string | number | boolean> } }) as unknown as RunState;

describe('boss aftermath', () => {
  it('gives every known boss a named, stable line', () => {
    expect(bosses.length).toBeGreaterThan(100);
    for (const b of bosses.slice(0, 40)) {
      const line = aftermathLine('seed', b.bossId!);
      expect(line).toContain(b.name);
      expect(aftermathLine('seed', b.bossId!)).toBe(line);
    }
  });

  it('records once per boss, keeps order, and returns the newest few', () => {
    const run = fake();
    const ids = bosses.slice(0, 4).map((b) => b.bossId!);
    for (const id of ids) expect(recordAftermath(run, id)).not.toBeNull();
    expect(recordAftermath(run, ids[0]!)).toBeNull();
    expect(aftermathLines(run)).toHaveLength(3);
    expect(aftermathLines(run, 10)).toHaveLength(4);
  });

  it('ignores a boss the pack does not know', () => {
    const run = fake();
    expect(aftermathLine('seed', 'not-a-boss')).toBeNull();
    expect(recordAftermath(run, 'not-a-boss')).toBeNull();
    expect(aftermathLines(run)).toEqual([]);
  });

  it('can differ by run seed', () => {
    const id = bosses[0]!.bossId!;
    const lines = new Set(['a', 'b', 'c', 'd', 'e', 'f'].map((s) => aftermathLine(s, id)));
    expect(lines.size).toBeGreaterThan(1);
  });
});
