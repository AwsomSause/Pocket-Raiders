// Beta 0.6 E5: the Extended Cut director, the one climax-cut reader, and Second Shot.
import { describe, expect, it } from 'vitest';
import { beginClimax, climaxCutOf, climaxLost, climaxPhases, finishStep, nextStep } from '../../src/core/arc/climaxExtended';
import { assistModeOf } from '../../src/core/rivals/live';
import { friendAssist } from '../../src/core/rivals/friend';
import { xflagHolds } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import { RunStateSchema } from '../../src/core/state';
import { content } from './helpers';

const mk = (cut?: 'standard' | 'extended', seed = 'cx1') => {
  const r = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', ...(cut ? { expansion: { climaxCut: cut } } : {}) }), 0);
  return r;
};

describe('climax cut reader', () => {
  it('extended runs read extended everywhere, with the Assist cap of 6', () => {
    const r = mk('extended');
    expect(climaxCutOf(r)).toBe('extended');
    expect(assistModeOf(r)).toBe('extended');
    expect(xflagHolds(r, 'extendedCut')).toBe(true);
    expect(friendAssist(5, assistModeOf(r))).toBe(1);
  });
  it('classic runs are unchanged: no cut key, standard cap', () => {
    const a = mk(), b = mk('standard');
    for (const r of [a, b]) {
      expect(climaxCutOf(r)).toBe('standard');
      expect(assistModeOf(r)).toBe('standard');
      expect(r.expansion?.cut?.climaxCut).toBeUndefined();
      expect(beginClimax(r)).toBe(false);
    }
    expect(JSON.stringify(a.expansion ?? {})).toBe(JSON.stringify(b.expansion ?? {}));
  });
  it('an older save with only expansion.climaxCut still reads extended', () => {
    const r = mk();
    r.expansion = { ...r.expansion, climaxCut: 'extended' };
    expect(climaxCutOf(r)).toBe('extended');
  });
});

describe('Extended Cut phases and Second Shot', () => {
  it('runs the Kanto phases in order, skipping formats not built yet, and ends', () => {
    const r = mk('extended');
    expect(beginClimax(r)).toBe(true);
    const seen: string[] = [];
    for (let s = nextStep(r), n = 0; s && n < 30; s = finishStep(r), n++) seen.push(s.phase);
    const all = climaxPhases('kanto').map((p) => p.phase);
    expect(seen).toEqual(all);
    expect(seen.indexOf('0b')).toBeLessThan(seen.indexOf('1'));
    expect(nextStep(r)).toBeNull();
  });
  it('two shots then the run goes on: first loss retries from the save point, second ends the climax', () => {
    const r = mk('extended');
    beginClimax(r);
    for (let s = nextStep(r); s && s.name !== 'Giovanni'; s = finishStep(r));
    expect(climaxLost(r)).toBe('retry');
    expect(nextStep(r)?.phase).toBe('4');
    expect(climaxLost(r)).toBe('worst');
    expect(nextStep(r)).toBeNull();
    expect(r.phase).not.toBe('ended');
  });
  it('the director state survives a save round-trip', () => {
    const r = mk('extended');
    beginClimax(r);
    finishStep(r);
    const back = RunStateSchema.parse(JSON.parse(JSON.stringify(r)));
    expect(nextStep(back)?.phase).toBe(nextStep(r)?.phase);
    expect(climaxCutOf(back)).toBe('extended');
  });
});

describe('climaxTick (screens)', () => {
  it('standard runs and runs before the climax are untouched', async () => {
    const { climaxTick } = await import('../../src/core/arc/climaxExtended');
    const a = mk(), b = mk('extended');
    const before = JSON.stringify(a.expansion ?? {});
    expect(climaxTick(content, a)).toBe(false);
    expect(climaxTick(content, b)).toBe(false);
    expect(JSON.stringify(a.expansion ?? {})).toBe(before);
  });
  it('plays the wide formats in order, one at a time, and finishes', async () => {
    const { climaxTick } = await import('../../src/core/arc/climaxExtended');
    const { currentFormat, clearFormat } = await import('../../src/core/formats/store');
    const r = mk('extended');
    beginClimax(r);
    const ids: string[] = [];
    for (let i = 0; i < 12; i++) {
      if (!climaxTick(content, r)) break;
      const f = currentFormat(r);
      expect(f).not.toBeNull();
      ids.push(f!.id);
      expect(climaxTick(content, r)).toBe(true); // asking again while it runs changes nothing
      expect(currentFormat(r)!.id).toBe(f!.id);
      clearFormat(r);
    }
    expect(ids[0]).toBe('siege');
    expect(ids.indexOf('blackout')).toBeGreaterThan(0);
    expect(ids).toContain('breather');
    expect(nextStep(r)).toBeNull();
  });
});
