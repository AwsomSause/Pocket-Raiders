// Stage length: 30 nodes by default, the setting moves it from 20 to 50, and the pacing rules stretch with it.

import { describe, expect, it } from 'vitest';
import { generateStageMap, validateStageMap } from '../../src/core/map';
import { hashSeed, Rng } from '../../src/core/rng';
import { runCampaign, scaleColumn, stageColumnsFor } from '../../src/core/regions';
import { scaledCap, stageLengthFactor } from '../../src/core/stageLength';
import { createRun } from '../../src/core/run';
import { ExpansionSettingsSchema } from '../../src/core/expansion/schema';
import { SettingsSchema } from '../../src/core/state';
import { content } from './helpers';

const FULL = content.campaigns.get('full')!;
const forLength = (cols: number) => runCampaign(content, { campaignId: 'full', expansion: { stageCols: cols } });

describe('stage length', () => {
  it('defaults to 30 nodes, and the setting runs from 20 to 50', () => {
    expect(stageColumnsFor(FULL)).toBe(30);
    expect(stageColumnsFor(FULL, -10)).toBe(20);
    expect(stageColumnsFor(FULL, 20)).toBe(50);
    expect(stageColumnsFor(FULL, 99)).toBe(50);
    expect(stageColumnsFor(FULL, -99)).toBe(20);
    expect(ExpansionSettingsSchema.parse({}).stageLength).toBe(0);
    expect(() => ExpansionSettingsSchema.parse({ stageLength: 21 })).toThrow();
  });

  it('leaves short and Story campaigns alone', () => {
    for (const c of content.campaigns.values()) if (c.columns < 20 || c.mode === 'story') expect(stageColumnsFor(c, 20)).toBe(c.columns);
  });

  it('a new run starts at 30 nodes per stage; an old run (no stageCols) keeps 20', () => {
    const fresh = createRun(content, { runId: 'len', seed: 'len-a', archetypeId: 'red', campaignId: 'full', expansion: { stagePacing: true } });
    expect(fresh.expansion?.stageCols).toBe(30);
    expect(runCampaign(content, fresh).columns).toBe(30);
    const long = createRun(content, { runId: 'len', seed: 'len-b', archetypeId: 'red', campaignId: 'full', expansion: { stagePacing: true, stageLength: 20 } });
    expect(long.expansion?.stageCols).toBe(50);
    const old = createRun(content, { runId: 'len', seed: 'len-c', archetypeId: 'red', campaignId: 'full' });
    expect(old.expansion?.stageCols).toBeUndefined();
    expect(runCampaign(content, old).columns).toBe(20);
  });

  it('scales pacing numbers from 20 and keeps 20 exactly as before', () => {
    expect(scaleColumn(5, 20)).toBe(5);
    expect(scaleColumn(5, 30)).toBe(8);
    expect(scaleColumn(19, 50)).toBe(48);
    expect(stageLengthFactor({})).toBe(1);
    expect(stageLengthFactor({ expansion: { stageCols: 30 } })).toBe(1.5);
    expect(scaledCap(2, {})).toBe(2);
    expect(scaledCap(2, { expansion: { stageCols: 30 } })).toBe(3);
    expect(scaledCap(0, { expansion: { stageCols: 50 } })).toBe(0);
    expect(scaledCap(1, { expansion: { stageCols: 20 } })).toBe(1);
  });

  it('builds valid paced maps at every length, with trainer columns growing with the stage', () => {
    for (const cols of [20, 30, 40, 50]) {
      const camp = forLength(cols);
      let most = 0;
      for (let i = 0; i < 60; i++) {
        const map = generateStageMap(content, camp, new Rng(hashSeed(`len-${cols}-${i}`)), { regionIndex: 1 });
        expect(map.columns).toBe(cols);
        expect(validateStageMap(map), `cols ${cols} seed ${i}`).toEqual([]);
        most = Math.max(most, map.trainerColumns.length + (map.optionalTrainerColumns?.length ?? 0));
      }
      if (cols === 20) expect(most).toBeLessThanOrEqual(5);
      if (cols === 30) expect(most).toBeGreaterThanOrEqual(6);
    }
  });

  it('keeps the old stage identical when the length is 20', () => {
    const a = generateStageMap(content, FULL, new Rng(hashSeed('same')), { regionIndex: 1 });
    const b = generateStageMap(content, forLength(20), new Rng(hashSeed('same')), { regionIndex: 1 });
    expect(b).toEqual(a);
  });

  it('older settings without stageLength load with the default', () => {
    const parsed = SettingsSchema.shape.expansion.parse({ eventsDensity: 'full' });
    expect(parsed.stageLength).toBe(0);
  });
});
