// Milestone 5.5: Run-Prep. Preparation tokens, Bank licenses, loadout
// presets, the Run Build Summary, and save upgrades.

import { describe, expect, it } from 'vitest';
import { createProfile } from '../../src/core/profile';
import {
  buildSummary,
  buyLicense,
  defaultPrep,
  licenseProblem,
  presetIn,
  presetParts,
  resolvePrep,
  savePreset,
  startingResources,
  tokenAvailable,
} from '../../src/core/runPrep';
import { chooseStarter, createRun } from '../../src/core/run';
import type { Profile, RunPrep } from '../../src/core/state';
import { buildContent, RAW_CONTENT } from '../../src/data';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const fresh = (extra: Partial<Profile> = {}): Profile => ({ ...createProfile(content, 'p'), ...extra });
const prep = (changes: Partial<RunPrep> = {}): RunPrep => ({ ...defaultPrep(content), ...changes });

describe('licenses', () => {
  it('cost Bank Credits and are bought once', () => {
    expect(licenseProblem(fresh({ bankCredits: 10 }), content.licenses.get('field-medic')!)).toMatch(/400 Bank Credits/);
    const p = buyLicense(content, fresh({ bankCredits: 500 }), 'field-medic');
    expect(p.bankCredits).toBe(100);
    expect(p.licenses).toEqual(['field-medic']);
    expect(() => buyLicense(content, p, 'field-medic')).toThrow(/already own/);
  });

  it('open up the Field Kit', () => {
    const p = fresh({ licenses: ['type-specialist', 'field-medic'] });
    expect(tokenAvailable(fresh(), content.prepTokens.get('field-kit')!)).toBe(false);
    expect(tokenAvailable(p, content.prepTokens.get('field-kit')!)).toBe(true);
  });
});

describe('preparation tokens and starting resources', () => {
  it('tokens unlock through achievements', () => {
    const money = content.prepTokens.get('pocket-money')!;
    expect(tokenAvailable(fresh(), money)).toBe(false);
    expect(tokenAvailable(fresh({ achievements: { 'first-steps': { earnedAt: 'x' } } }), money)).toBe(true);
  });

  it('a token adds money or items on top of the trainer and the base Bag', () => {
    const brock = content.archetypes.get('brock')!;
    const res = startingResources(content, brock, prep({ tokenId: 'field-kit' }));
    expect(res.items.potion).toBe(content.balance.startingItems.potion! + brock.startingItems.potion!);
    expect(res.items['super-potion']).toBe(3);
    expect(res.items.revive).toBe(1);
    const run = createRun(content, { runId: 'r', seed: 'tok', archetypeId: 'red', prep: prep({ tokenId: 'pocket-money' }) });
    expect(run.money).toBe(content.balance.money.startingMoney + 1000);
  });

  it('an unavailable choice is replaced and reported before the run starts', () => {
    const resolved = resolvePrep(content, fresh(), 'brock', prep({ tokenId: 'pocket-money' }));
    expect(resolved.archetypeId).toBe('red');
    expect(resolved.prep.tokenId).toBeNull();
    expect(resolved.problems).toHaveLength(2);
  });
});

describe('loadout presets and the build summary', () => {
  it('saves and loads presets by slot', () => {
    const preset = { ...prep({ tokenId: 'pocket-money' }), name: 'Token Red', archetypeId: 'red' };
    let p = savePreset(content, fresh(), 2, preset);
    expect(presetIn(p, 0)).toBeNull();
    expect(presetIn(p, 2)!.name).toBe('Token Red');
    expect(presetParts(presetIn(p, 2)!)).toEqual({ archetypeId: 'red', prep: prep({ tokenId: 'pocket-money' }) });
    expect(() => savePreset(content, p, content.balance.presetSlots, preset)).toThrow(/no preset slot/);
    p = savePreset(content, p, 2, { ...preset, name: 'Replaced' });
    expect(presetIn(p, 2)!.name).toBe('Replaced');
  });

  it('a preset that refers to something no longer unlocked is resolved, not used as is', () => {
    const preset = { ...prep({ tokenId: 'pocket-money' }), name: 'Money', archetypeId: 'red' };
    const parts = presetParts(preset);
    const resolved = resolvePrep(content, fresh(), parts.archetypeId, parts.prep);
    expect(resolved.prep.tokenId).toBeNull();
    expect(resolved.problems[0]).toMatch(/preparation isn't available/);
  });

  it('the summary shows the trainer, starters, token and starting resources', () => {
    const lines = buildSummary(content, 'green', prep({ tokenId: 'ball-bundle' })).join('\n');
    expect(lines).toMatch(/Trainer: Green/);
    expect(lines).toMatch(/Remembrance quiz picks/);
    expect(lines).toMatch(/Ball Bundle/);
    expect(lines).toMatch(/Great Ball ×5/);
  });
});

describe('content checks and save upgrades', () => {
  it('rejects a token with an unknown item', () => {
    const raw = structuredClone(RAW_CONTENT) as any;
    raw.runPrep.tokens[0].items = { 'not-an-item': 1 };
    expect(() => buildContent(raw)).toThrow(/not-an-item/);
  });

  it('upgrades a v3 profile and a v5 run', () => {
    const storage = new MemoryStorageProvider();
    const saves = new SaveManager(storage, content);
    const { licenses: _b, presets: _c, lastPrep: _d, ...oldProfile } = createProfile(content, 'old');
    storage.set('pkr.profile', JSON.stringify({ format: 'pkmn-roguelike', record: 'profile', schemaVersion: 3, savedAt: 'x', data: oldProfile }));
    const loaded = saves.loadOrCreateProfile(() => 'new').profile;
    expect(loaded.profileId).toBe('old');
    expect(loaded.presets).toEqual([]);
    expect(loaded.licenses).toEqual([]);

    const run = chooseStarter(content, createRun(content, { runId: 'old-run', seed: 's', archetypeId: 'red', campaignId: 'dev' }), 0);
    const { prep: _p, ...oldRun } = run;
    storage.set('pkr.run', JSON.stringify({ format: 'pkmn-roguelike', record: 'run', schemaVersion: 5, savedAt: 'x', data: oldRun }));
    const result = saves.loadRun();
    expect(result.status).toBe('ok');
    if (result.status === 'ok') expect(result.data.prep).toEqual({ campaignId: 'dev', tokenId: null, directive: null, license: null, loan: false, vaultItem: null, mentorId: null });
  });

  it('a current save that still holds Starter Set fields (run poolId/draftRuleId/typeFocus/note, profile unlockedPools) loads with them dropped', () => {
    const storage = new MemoryStorageProvider();
    const saves = new SaveManager(storage, content);
    const run = chooseStarter(content, createRun(content, { runId: 'legacy', seed: 'legacy', archetypeId: 'red' }), 0);
    saves.saveRun(run);
    const rawRun = JSON.parse(storage.get('pkr.run')!);
    rawRun.data.prep = { ...rawRun.data.prep, poolId: 'classic', draftRuleId: 'standard', typeFocus: null, note: null };
    storage.set('pkr.run', JSON.stringify(rawRun));
    const loadedRun = saves.loadRun();
    expect(loadedRun.status).toBe('ok');
    if (loadedRun.status === 'ok') {
      expect(loadedRun.data.starterChoices).toEqual(run.starterChoices);
      expect(Object.keys(loadedRun.data.prep)).not.toContain('poolId');
      expect(Object.keys(loadedRun.data.prep)).not.toContain('draftRuleId');
    }
    saves.saveProfile(createProfile(content, 'keep'));
    const rawProfile = JSON.parse(storage.get('pkr.profile')!);
    rawProfile.data.unlockedPools = ['johto'];
    storage.set('pkr.profile', JSON.stringify(rawProfile));
    const loaded = saves.loadOrCreateProfile(() => 'new').profile;
    expect(loaded.profileId).toBe('keep');
    expect(Object.keys(loaded)).not.toContain('unlockedPools');
  });
});
