// Beta 0.6 E3: the quiet-node scheduler for story events, and the eight Kanto events built into the game.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { scheduleStage, spacedColumns, type Candidate } from '../../src/core/expansion/scheduler';
import { advanceTrack } from '../../src/core/expansion/trackRun';
import { addEventStops, conditionMet, eligibleEvents } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import { getCampaign } from '../../src/core/regions';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const cands = (n: number, anchor = false): Candidate[] => Array.from({ length: n }, (_, i) => ({ id: `xe.t.${i}`, priority: 50 + i, anchor: anchor && i === 0 }));

describe('scheduleStage', () => {
  const base = { seed: 's', stageKey: '0:stage:0' };
  it('spreads the region quota over the stages left', () => {
    expect(scheduleStage({ ...base, candidates: cands(8), quota: 5, placedInRegion: 0, stagesLeft: 5 }).ids).toHaveLength(1);
    expect(scheduleStage({ ...base, candidates: cands(8), quota: 8, placedInRegion: 0, stagesLeft: 4 }).ids).toHaveLength(2);
    expect(scheduleStage({ ...base, candidates: cands(8), quota: 5, placedInRegion: 5, stagesLeft: 1 }).ids).toHaveLength(0);
  });
  it('always places the anchor, even with the quota spent, and puts it first', () => {
    const c = cands(4, true);
    expect(scheduleStage({ ...base, candidates: c, quota: 3, placedInRegion: 3, stagesLeft: 1 }).ids).toEqual(['xe.t.0']);
    expect(scheduleStage({ ...base, candidates: c, quota: 5, placedInRegion: 0, stagesLeft: 1 }).ids[0]).toBe('xe.t.0');
  });
  it('prefers higher priority and is deterministic', () => {
    const a = scheduleStage({ ...base, candidates: cands(6), quota: 2, placedInRegion: 0, stagesLeft: 1 });
    expect(a.ids).toEqual(['xe.t.5', 'xe.t.4']);
    expect(scheduleStage({ ...base, candidates: cands(6), quota: 2, placedInRegion: 0, stagesLeft: 1 })).toEqual(a);
  });
});

describe('spacedColumns', () => {
  it('never picks neighbours, and keeps away from the avoided columns', () => {
    for (let i = 0; i < 40; i++) {
      const cols = spacedColumns([1, 2, 3, 4, 5, 6, 7, 8, 9], 3, [5], `seed${i}`);
      expect(cols).toHaveLength(3);
      for (const a of cols) {
        expect(Math.abs(a - 5)).toBeGreaterThan(1);
        for (const b of cols) if (a !== b) expect(Math.abs(a - b)).toBeGreaterThan(1);
      }
    }
  });
  it('still returns the columns asked for on a tiny map (the anchor must occur)', () => {
    expect(spacedColumns([1, 2], 2, [], 'x')).toHaveLength(2);
  });
});

const kantoRun = (seed: string, density: 'low' | 'normal' | 'full' | null = 'normal'): RunState => {
  const r = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', ...(density ? { expansion: { eventsDensity: density, worldTracks: true } } : {}) }), 0);
  r.regionOrder[r.regionIndex] = 'kanto';
  return r;
};
const placed = (r: RunState) => r.stage!.map.nodes.flatMap((n) => n.sides.filter((s) => s.eventId?.startsWith('xe.')).map((s) => ({ id: s.eventId!, column: n.column })));

describe('the Kanto story events', () => {
  it('are nine, all in Kanto, built from the script (file is current)', () => {
    const ids = [...content.events.keys()].filter((id) => id.startsWith('xe.kanto.'));
    expect(ids.sort()).toEqual(['xe.kanto.appointment', 'xe.kanto.blaine-defects', 'xe.kanto.count-room', 'xe.kanto.harbor-export', 'xe.kanto.madame-call', 'xe.kanto.orphan', 'xe.kanto.roadblock', 'xe.kanto.small-print', 'xe.kanto.trio-conscience']);
    const file = JSON.parse(readFileSync('src/data/events/xe-kanto.json', 'utf8')).events as { id: string }[];
    expect(file).toHaveLength(9);
  });
  it('are never eligible without the saga on, or outside Kanto', () => {
    const off = kantoRun('xe-off', null);
    expect(eligibleEvents(content, off).some((e) => e.id.startsWith('xe.'))).toBe(false);
    const away = kantoRun('xe-away');
    away.regionOrder[away.regionIndex] = 'johto';
    expect(eligibleEvents(content, away).some((e) => e.id.startsWith('xe.'))).toBe(false);
  });
  it('the Roadblock needs track step 3', () => {
    const r = kantoRun('xe-road');
    const road = content.events.get('xe.kanto.roadblock')!;
    expect(road.requires.every((c) => conditionMet(content, r, c))).toBe(false);
    for (const k of ['a', 'b', 'c']) advanceTrack(r, 'kanto', 'raidFailed', k);
    expect(road.requires.every((c) => conditionMet(content, r, c))).toBe(true);
  });
  it('place the anchor in the first stage, never twice, never on neighbouring columns, within the density quota', () => {
    for (const density of ['low', 'normal', 'full'] as const) {
      const r = kantoRun(`xe-${density}`, density);
      const stages = getCampaign(content, r.campaignId).stagesPerRegion;
      const seen: string[] = [];
      for (let i = 0; i < stages; i++) {
        r.stage!.index = i;
        r.stage!.map.nodes.forEach((n) => (n.sides = []));
        addEventStops(content, r);
        const here = placed(r);
        const cols = here.map((p) => p.column).sort((a, b) => a - b);
        for (let j = 1; j < cols.length; j++) expect(cols[j]! - cols[j - 1]!).toBeGreaterThan(1);
        seen.push(...here.map((p) => p.id));
      }
      expect(new Set(seen).size).toBe(seen.length);
      expect(seen).toContain('xe.kanto.small-print');
      expect(seen.length).toBeLessThanOrEqual(content.balance.expansionEvents.density[density] + 1);
    }
  });
  it('are not placed at all in a run without the saga flag (old rolls untouched)', () => {
    const r = kantoRun('xe-none', null);
    addEventStops(content, r);
    expect(placed(r)).toEqual([]);
  });
});

describe('10,000-seed schedule simulation', () => {
  it('anchor first, none twice, never adjacent, never over quota (+ the anchor)', () => {
    const all: Candidate[] = Array.from({ length: 8 }, (_, i) => ({ id: `xe.k.${i}`, priority: i === 0 ? 100 : 40 + (i % 3) * 10, anchor: i === 0 }));
    const quotas = { low: 3, normal: 5, full: 8 } as const;
    for (let n = 0; n < 10_000; n++) {
      const quota = Object.values(quotas)[n % 3]!;
      const seen: string[] = [];
      for (let stage = 0; stage < 5; stage++) {
        const left = all.filter((c) => !seen.includes(c.id));
        const { ids } = scheduleStage({ candidates: left, quota, placedInRegion: seen.length, stagesLeft: 5 - stage, seed: `sim${n}`, stageKey: `0:stage:${stage}` });
        const cols = spacedColumns([1, 2, 3, 4, 5, 6, 7, 8, 9], ids.length, [], `sim${n}:${stage}`).sort((a, b) => a - b);
        for (let j = 1; j < cols.length; j++) if (cols[j]! - cols[j - 1]! <= 1) throw new Error(`adjacent columns, seed ${n}`);
        if (stage === 0 && !ids.includes('xe.k.0')) throw new Error(`anchor missing, seed ${n}`);
        for (const id of ids) if (seen.includes(id)) throw new Error(`placed twice, seed ${n}`);
        seen.push(...ids);
      }
      if (seen.length > quota + 1) throw new Error(`over quota, seed ${n}`);
    }
  });
  it('the generated Kanto event file is current', () => {
    expect(() => execFileSync('node', ['tools/build-expansion-events.ts', '--check'], { stdio: 'pipe' })).not.toThrow();
  });
});
