import { describe, expect, it } from 'vitest';
import { MicMeter, rmsLevel, ShoutDetector } from '../../src/game/micInput';
import { changeSetting, settingById } from '../../src/core/settingsRegistry';
import { DEFAULT_SETTINGS } from '../../src/save/saveManager';

describe('rmsLevel', () => {
  it('is 0 for silence and an empty block', () => {
    expect(rmsLevel([])).toBe(0);
    expect(rmsLevel(new Float32Array(64))).toBe(0);
  });
  it('is the amplitude of a constant signal, capped at 1', () => {
    expect(rmsLevel([0.5, -0.5, 0.5, -0.5])).toBeCloseTo(0.5);
    expect(rmsLevel([3, 3])).toBe(1);
  });
});

describe('ShoutDetector', () => {
  it('fires after the level is held, once, then re-arms after a quiet moment', () => {
    const d = new ShoutDetector(0.25, 200);
    expect(d.feed(0.5, 0)).toBe(false);
    expect(d.feed(0.5, 100)).toBe(false);
    expect(d.feed(0.5, 200)).toBe(true);
    expect(d.feed(0.9, 300)).toBe(false); // same shout, no second fire
    expect(d.feed(0.1, 400)).toBe(false);
    expect(d.feed(0.5, 500)).toBe(false);
    expect(d.feed(0.5, 700)).toBe(true);
  });
  it('ignores a short blip', () => {
    const d = new ShoutDetector(0.25, 200);
    expect(d.feed(0.9, 0)).toBe(false);
    expect(d.feed(0.1, 50)).toBe(false);
    expect(d.feed(0.9, 100)).toBe(false);
    expect(d.feed(0.9, 250)).toBe(false);
  });
  it('is deterministic: same input, same output', () => {
    const run = () => {
      const d = new ShoutDetector();
      return [0.1, 0.4, 0.4, 0.4, 0.4, 0.1, 0.5, 0.5, 0.5, 0.5].map((l, i) => d.feed(l, i * 100));
    };
    expect(run()).toEqual(run());
  });
});

describe('MicMeter', () => {
  it('stays off and never asks for the stream while the setting is off', async () => {
    let asked = false;
    const m = new MicMeter(async () => { asked = true; throw new Error('no'); });
    expect(await m.start(false)).toBe('off');
    expect(asked).toBe(false);
    expect(m.level()).toBe(0);
  });
  it('reports denied or unsupported instead of throwing, and level stays 0', async () => {
    const m = new MicMeter(async () => { throw new Error('denied'); });
    expect(['denied', 'unsupported']).toContain(await m.start(true));
    expect(m.level()).toBe(0);
    m.stop();
    expect(m.state).toBe('off');
  });
});

describe('microphone setting', () => {
  it('is off by default and toggles in the controls page', () => {
    expect(DEFAULT_SETTINGS.expansion.micInput).toBe(false);
    expect(settingById('micInput')?.category).toBe('controls');
    const on = changeSetting(DEFAULT_SETTINGS, 'micInput');
    expect(on.expansion.micInput).toBe(true);
    expect(settingById('micInput')!.show(on)).toBe('On');
    expect(changeSetting(on, 'micInput').expansion.micInput).toBe(false);
  });
});
