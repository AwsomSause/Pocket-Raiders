import { describe, expect, it } from 'vitest';
import { inspectSave, reportLines } from '../../src/save/saveInspector';
import { CURRENT_VERSIONS, DEFAULT_SETTINGS, SAVE_FORMAT } from '../../src/save/saveManager';

const env = (record: string, schemaVersion: number, data: unknown) => JSON.stringify({ format: SAVE_FORMAT, record, schemaVersion, savedAt: 'x', data });

describe('save inspector', () => {
  it('reads a current settings record as ok', () => {
    const r = inspectSave(env('settings', CURRENT_VERSIONS.settings, DEFAULT_SETTINGS));
    expect(r).toMatchObject({ record: 'settings', verdict: 'ok', steps: [], problems: [] });
    expect(r.largest.length).toBeGreaterThan(0);
  });
  it('previews upgrade steps without changing the input', () => {
    const raw = env('settings', CURRENT_VERSIONS.settings - 1, {});
    const r = inspectSave(raw);
    expect(r.steps).toEqual([`v${CURRENT_VERSIONS.settings - 1} -> v${CURRENT_VERSIONS.settings}`]);
    expect(raw).toBe(env('settings', CURRENT_VERSIONS.settings - 1, {}));
  });
  it('flags damaged, foreign, newer and bad-JSON files', () => {
    expect(inspectSave(env('settings', CURRENT_VERSIONS.settings, { musicVolume: 'loud' })).verdict).toBe('broken');
    expect(inspectSave('nope').verdict).toBe('broken');
    expect(inspectSave('{"format":"other"}').verdict).toBe('broken');
    expect(inspectSave(env('settings', 999, {})).problems[0]).toContain('newer');
    expect(inspectSave(env('bogus', 1, {})).problems[0]).toContain('Unknown record');
  });
  it('writes plain lines', () => {
    expect(reportLines(inspectSave(env('settings', CURRENT_VERSIONS.settings, DEFAULT_SETTINGS)))[1]).toBe('Loads as is.');
  });
});
