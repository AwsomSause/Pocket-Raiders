// Overhaul slice 6: remember the last move (cursor only) and the settings v33 -> v34 upgrade.
import { describe, expect, it } from 'vitest';
import { defaultMoveIndex } from '../../src/core/battle/rememberChoice';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const ids = ['tackle', 'growl', 'ember', 'scratch'];

describe('defaultMoveIndex', () => {
  it('starts on the remembered move when it is usable', () => {
    expect(defaultMoveIndex(ids, [true, true, true, true], 'ember')).toBe(2);
  });
  it('does nothing without a memory, with the setting off, or when the move is gone', () => {
    expect(defaultMoveIndex(ids, [true, true, true, true], undefined)).toBeNull();
    expect(defaultMoveIndex(ids, [true, true, true, true], 'ember', false)).toBeNull();
    expect(defaultMoveIndex(ids, [true, true, true, true], 'surf')).toBeNull();
  });
  it('skips a move with no PP, Disable, Choice lock or Taunt to the next usable one, wrapping', () => {
    expect(defaultMoveIndex(ids, [true, true, false, true], 'ember')).toBe(3);
    expect(defaultMoveIndex(ids, [true, true, true, false], 'scratch')).toBe(0);
  });
  it('returns null when nothing is usable (the menu then offers Struggle)', () => {
    expect(defaultMoveIndex(ids, [false, false, false, false], 'ember')).toBeNull();
  });
  it('a refreshed move list (new move learned in the remembered slot) forgets the old memory safely', () => {
    expect(defaultMoveIndex(['tackle', 'growl', 'flamethrower', 'scratch'], [true, true, true, true], 'ember')).toBeNull();
  });
});

describe('Remember battle choices setting (settings v34)', () => {
  it('a v33 settings save loads through the save manager with the setting on and keeps its other choices', () => {
    const storage = new MemoryStorageProvider();
    const { rememberChoices: _r, ...old } = new SaveManager(storage, content).loadSettings();
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 33, savedAt: '', data: { ...old, musicVolume: 0.2, skipGuard: false } }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.rememberChoices).toBe(true);
    expect(loaded.musicVolume).toBe(0.2);
    expect(loaded.skipGuard).toBe(false);
  });
  it('can be switched off and stays off after a reload', () => {
    const storage = new MemoryStorageProvider();
    const sm = new SaveManager(storage, content);
    sm.saveSettings({ ...sm.loadSettings(), rememberChoices: false });
    expect(new SaveManager(storage, content).loadSettings().rememberChoices).toBe(false);
  });
});
