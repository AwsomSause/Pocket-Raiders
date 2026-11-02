import { describe, expect, it } from 'vitest';
import { MemoryStorageProvider } from '../../src/save/storage';
import { SaveManager, DEFAULT_SETTINGS } from '../../src/save/saveManager';
import { resetSettings } from '../../src/core/settingsRegistry';
import { GAME_UPDATE_ID, TUTORIAL_CATEGORIES, UPDATE_LOG, markTutorialDone, markTutorialOffered, markUpdateSeen, tutorialOfferPending, updateLogPending } from '../../src/core/tutorial';
import { content } from './helpers';

describe('tutorial and update log', () => {
  it('has nine categories, each with its own professor and at least one page', () => {
    expect(TUTORIAL_CATEGORIES).toHaveLength(9);
    expect(new Set(TUTORIAL_CATEGORIES.map((c) => c.professor)).size).toBe(9);
    expect(new Set(TUTORIAL_CATEGORIES.map((c) => c.id)).size).toBe(9);
    for (const c of TUTORIAL_CATEGORIES) expect(c.pages.length).toBeGreaterThan(0);
  });

  it('newest log entry matches the current update id', () => {
    expect(UPDATE_LOG[0]!.id).toBe(GAME_UPDATE_ID);
  });

  it('shows once per version and offers the tutorial once', () => {
    let s = DEFAULT_SETTINGS;
    expect(updateLogPending(s)).toBe(true);
    expect(tutorialOfferPending(s)).toBe(true);
    s = markTutorialOffered(markUpdateSeen(s));
    expect(updateLogPending(s)).toBe(false);
    expect(tutorialOfferPending(s)).toBe(false);
    expect(updateLogPending({ ...s, lastSeenUpdate: 'beta-0.3' })).toBe(true);
    s = markTutorialDone(markTutorialDone(s, 'basics'), 'basics');
    expect(s.tutorialDone).toEqual(['basics']);
  });

  it('keeps what was read through a settings reset', () => {
    const read = markTutorialDone(markTutorialOffered(markUpdateSeen({ ...DEFAULT_SETTINGS, muted: true })), 'bonds');
    const after = resetSettings(DEFAULT_SETTINGS, read);
    expect(after.muted).toBe(false);
    expect(after.lastSeenUpdate).toBe(GAME_UPDATE_ID);
    expect(after.tutorialDone).toEqual(['bonds']);
  });

  it('old settings (v20) migrate so returning players see the log and the offer (v20 -> v21)', () => {
    const storage = new MemoryStorageProvider();
    const saves = new SaveManager(storage, content);
    const { lastSeenUpdate: _a, tutorialOffered: _b, tutorialDone: _c, ...old } = saves.loadSettings();
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 20, savedAt: '', data: old }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(updateLogPending(loaded)).toBe(true);
    expect(tutorialOfferPending(loaded)).toBe(true);
    expect(loaded.tutorialDone).toEqual([]);
    new SaveManager(storage, content).saveSettings(markUpdateSeen(loaded));
    expect(updateLogPending(new SaveManager(storage, content).loadSettings())).toBe(false);
  });
});
