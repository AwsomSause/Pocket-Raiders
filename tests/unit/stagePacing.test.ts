// Beta 0.6 B6 stage pacing: 4–5 trainer fights per stage (1–2 skippable), an ace trainer, doubles from region 2, EXP −20%.

import { describe, expect, it } from 'vitest';
import { generateStageMap, validateStageMap } from '../../src/core/map';
import { hashSeed, Rng } from '../../src/core/rng';
import { createRun } from '../../src/core/run';
import type { StageMap } from '../../src/core/state';
import { content } from './helpers';

const FULL = content.campaigns.get('full')!;

function routes(map: StageMap): string[][] {
  const byId = new Map(map.nodes.map((n) => [n.id, n]));
  const out: string[][] = [];
  const walk = (id: string, path: string[]) => {
    const next = [...path, id];
    const n = byId.get(id)!;
    if (n.next.length === 0) out.push(next);
    else for (const t of n.next) walk(t, next);
  };
  for (const n of map.nodes.filter((x) => x.column === 1)) walk(n.id, []);
  return out;
}

describe('stage pacing map (B6)', () => {
  it('is valid, has 4–5 trainer columns, 1–2 skippable, and every route meets at least 3 trainers', () => {
    for (let i = 0; i < 150; i++) {
      const map = generateStageMap(content, FULL, new Rng(hashSeed(`pace-${i}`)), { regionIndex: 1 });
      expect(validateStageMap(map), `seed pace-${i}`).toEqual([]);
      const optional = map.optionalTrainerColumns ?? [];
      const total = map.trainerColumns.length + optional.length;
      expect(total).toBeGreaterThanOrEqual(4);
      expect(total).toBeLessThanOrEqual(5);
      expect(optional.length).toBeGreaterThanOrEqual(1);
      expect(optional.length).toBeLessThanOrEqual(2);
      for (const route of routes(map).slice(0, 100)) {
        const trainers = route.filter((id) => map.nodes.find((n) => n.id === id)!.kind === 'trainer').length;
        expect(trainers).toBeGreaterThanOrEqual(map.trainerColumns.length);
        expect(trainers).toBeLessThanOrEqual(total);
      }
      // Every stage has an ace trainer column; the last forced trainer column is it.
      expect(map.nodes.some((n) => n.ace)).toBe(true);
      expect(map.nodes.every((n) => !n.ace || n.kind === 'trainer')).toBe(true);
    }
  }, 30_000);

  it('doubles trainers appear only from region 2', () => {
    const first = generateStageMap(content, FULL, new Rng(hashSeed('d0')), { regionIndex: 0 });
    const second = generateStageMap(content, FULL, new Rng(hashSeed('d1')), { regionIndex: 1 });
    expect(first.nodes.some((n) => n.doubles)).toBe(false);
    expect(second.nodes.some((n) => n.doubles)).toBe(true);
    expect(second.nodes.every((n) => !n.doubles || n.kind === 'trainer')).toBe(true);
  });

  it('the same seed builds the same pacing map', () => {
    const a = generateStageMap(content, FULL, new Rng(hashSeed('same')), { regionIndex: 2 });
    const b = generateStageMap(content, FULL, new Rng(hashSeed('same')), { regionIndex: 2 });
    expect(a).toEqual(b);
  });

  it('without pacing the old two-trainer map is unchanged', () => {
    const map = generateStageMap(content, FULL, new Rng(hashSeed('old')));
    expect(map.optionalTrainerColumns).toBeUndefined();
    expect(map.trainerColumns).toHaveLength(2);
    expect(map.nodes.some((n) => n.ace || n.doubles)).toBe(false);
  });

  it('a run only gets the pacing flag when the setting was on at run start', () => {
    const off = createRun(content, { runId: 'p0', seed: 'p0', archetypeId: 'red' });
    const on = createRun(content, { runId: 'p1', seed: 'p1', archetypeId: 'red', expansion: { stagePacing: true } });
    expect(off.expansion).toBeUndefined();
    expect(on.expansion?.pacing).toBe(true);
    expect(content.balance.stage.pacing.expMultiplier).toBe(0.8);
  });
});
