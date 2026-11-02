import { describe, expect, it } from 'vitest';
import { crtLook, letterboxPlan } from '../../src/core/presentation/crtFilter';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

describe('S259 CRT filter and S260 crit letterbox', () => {
  it('is off by default and Full is darker and rounder than Light', () => {
    expect(crtLook('off')).toBeNull();
    const light = crtLook('light')!;
    const full = crtLook('full')!;
    expect(full.radius).toBeGreaterThan(light.radius);
    expect(full.scanlines).not.toBe(light.scanlines);
  });

  it('letterbox only plays when on and motion is full', () => {
    expect(letterboxPlan(false, 'full')).toBeNull();
    expect(letterboxPlan(true, 'reduced')).toBeNull();
    expect(letterboxPlan(true, 'off')).toBeNull();
    expect(letterboxPlan(true, 'full')!.barShare).toBeGreaterThan(0);
  });

  it('old settings (v21) load with both off (migration v21 -> v22)', () => {
    const storage = new MemoryStorageProvider();
    const current = new SaveManager(storage, content).loadSettings();
    expect(current.crtFilter).toBe('off');
    const { crtFilter: _c, critLetterbox: _l, ...old } = current;
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 21, savedAt: '', data: old }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.crtFilter).toBe('off');
    expect(loaded.critLetterbox).toBe(false);
    new SaveManager(storage, content).saveSettings({ ...loaded, crtFilter: 'full', critLetterbox: true });
    const again = new SaveManager(storage, content).loadSettings();
    expect([again.crtFilter, again.critLetterbox]).toEqual(['full', true]);
  });
});
