// Transformation cutscenes in the animation registry (Pokémon Memories slice 3):
// their own settings switch (settings v18), how the settings shape them, the
// key item each one raises, and the Mega Evolution sounds.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { animSettingsFrom } from '../../src/core/accessibility';
import { resolveAnim } from '../../src/core/presentation/animRegistry';
import { TRANSFORM_MS, transformAnimId, type TransformKind } from '../../src/core/presentation/transformAnims';
import { SETTINGS } from '../../src/core/settingsRegistry';
import { DEFAULT_SETTINGS, SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { CINE_ASSETS, CINE_MS, keyItemFor } from '../../src/ui/battleFx/cineLook';
import { content } from './helpers';

const KINDS = Object.keys(TRANSFORM_MS) as TransformKind[];
const assets = join(import.meta.dirname, '..', '..', 'public', 'assets');
const manifest = JSON.parse(readFileSync(join(assets, 'manifest.json'), 'utf8')) as { assets: { id: string; path: string; lazy?: boolean }[] };
const byId = new Map(manifest.assets.map((a) => [a.id, a]));

describe('transformation cutscenes in the animation registry', () => {
  it('every cutscene is registered with the cinematic length', () => {
    for (const kind of KINDS) {
      const plan = resolveAnim(transformAnimId(kind), animSettingsFrom(DEFAULT_SETTINGS));
      expect(plan?.play, kind).toBe(true);
      expect(plan?.ms, kind).toBe(CINE_MS[kind]);
    }
  });

  it('the cutscene switch turns off Mega/Z/Dynamax/Tera but not evolving, and the other way round', () => {
    const noTransform = animSettingsFrom({ ...DEFAULT_SETTINGS, transformAnimations: false });
    for (const kind of KINDS) expect(resolveAnim(transformAnimId(kind), noTransform)?.play, kind).toBe(kind === 'evolve');
    const noEvolve = animSettingsFrom({ ...DEFAULT_SETTINGS, evolutionAnimations: false });
    expect(resolveAnim(transformAnimId('evolve'), noEvolve)?.play).toBe(false);
    expect(resolveAnim(transformAnimId('mega'), noEvolve)?.play).toBe(true);
    // "Disable all animations" also stops them, without changing the saved switch.
    expect(resolveAnim(transformAnimId('tera'), animSettingsFrom({ ...DEFAULT_SETTINGS, disableAllAnimations: true }))?.play).toBe(false);
  });

  it('reduced motion plays the calm version with no flash or shake; slow speed lengthens it', () => {
    const reduced = resolveAnim('transform.dynamax', animSettingsFrom({ ...DEFAULT_SETTINGS, battleAnimations: 'reduced' }))!;
    expect(reduced.reduced).toBe(true);
    expect(reduced.flash).toBe(0);
    expect(reduced.shake).toBe(0);
    expect(resolveAnim('transform.mega', animSettingsFrom({ ...DEFAULT_SETTINGS, animationSpeed: 'slow' }))!.ms).toBe(Math.round(CINE_MS.mega * 1.5));
    expect(resolveAnim('transform.mega', animSettingsFrom({ ...DEFAULT_SETTINGS, shakeIntensity: 0 }))!.shake).toBe(0);
    // Evolving never shakes the screen.
    expect(resolveAnim('evolution.evolve', animSettingsFrom(DEFAULT_SETTINGS))!.shake).toBe(0);
  });

  it('the switch is in the settings menu', () => {
    expect(SETTINGS.some((d) => d.id === 'transformAnimations')).toBe(true);
  });

  it('old settings saves get the cutscenes on (settings v17 -> v18)', () => {
    const storage = new MemoryStorageProvider();
    const current = new SaveManager(storage, content).loadSettings();
    const { transformAnimations: _t, ...old } = { ...current, evolutionAnimations: false };
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 17, savedAt: '', data: old }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.transformAnimations).toBe(true);
    expect(loaded.evolutionAnimations).toBe(false);
  });

  it('a turned-off switch survives a save and reload', () => {
    const storage = new MemoryStorageProvider();
    const saves = new SaveManager(storage, content);
    saves.saveSettings({ ...saves.loadSettings(), transformAnimations: false });
    expect(new SaveManager(storage, content).loadSettings().transformAnimations).toBe(false);
  });
});

describe('the key item and the Mega Evolution sounds', () => {
  it('each gimmick raises its own key item; evolving and Dynamax ending raise none', () => {
    expect(keyItemFor('mega')).toBe('cine.key.mega');
    expect(keyItemFor('primal', 'alpha')).toBe('cine.key.alpha');
    expect(keyItemFor('primal', 'omega')).toBe('cine.key.omega');
    expect(keyItemFor('zmove')).toBe('cine.key.zmove');
    expect(keyItemFor('gigantamax')).toBe('cine.key.dynamax');
    expect(keyItemFor('tera')).toBe('cine.key.tera');
    expect(keyItemFor('evolve')).toBeNull();
    expect(keyItemFor('dynamaxEnd')).toBeNull();
  });

  it('the key items and sounds are loaded with the cinematics, on demand, and on disk', () => {
    for (const id of ['cine.key.mega', 'cine.key.zmove', 'cine.key.dynamax', 'cine.key.tera', 'cine.key.alpha', 'cine.key.omega', 'cine.sfx.mega1', 'cine.sfx.mega2']) {
      expect(CINE_ASSETS, id).toContain(id);
      const entry = byId.get(id);
      expect(entry?.lazy, id).toBe(true);
      expect(existsSync(join(assets, entry!.path)), id).toBe(true);
    }
  });
});
