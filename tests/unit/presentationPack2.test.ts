import { describe, expect, it } from 'vitest';
import { cameraShot } from '../../src/core/presentation/camera';
import { packSource } from '../../src/core/presentation/moveAnimPack';
import { PARALLAX_RANGE, parallaxOffset, pointerShare } from '../../src/core/presentation/parallax';
import { loadingTip, loadingTipFor } from '../../src/core/presentation/uiPrefs';
import { STICKERS, STICKER_COOLDOWN_MS, canSendSticker } from '../../src/core/presentation/stickers';
import { DEFAULT_SETTINGS, SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

describe('S240 battle camera', () => {
  it('does nothing when off or under reduced motion', () => {
    expect(cameraShot('off', { type: 'faint', side: 'enemy' }, 'full')).toBeNull();
    expect(cameraShot('cinematic', { type: 'faint', side: 'enemy' }, 'reduced')).toBeNull();
    expect(cameraShot('cinematic', { type: 'faint', side: 'enemy' }, 'off')).toBeNull();
  });
  it('pushes in harder when cinematic, hardest on a boss ace', () => {
    const subtle = cameraShot('subtle', { type: 'faint', side: 'enemy' }, 'full')!;
    const cine = cameraShot('cinematic', { type: 'faint', side: 'enemy' }, 'full')!;
    const ace = cameraShot('cinematic', { type: 'faint', side: 'enemy', bossAce: true }, 'full')!;
    expect(cine.zoom).toBeGreaterThan(subtle.zoom);
    expect(ace.zoom).toBeGreaterThan(cine.zoom);
  });
  it('crits get a shot, small hits and your own faint (subtle) do not', () => {
    expect(cameraShot('subtle', { type: 'damage', side: 'enemy', crit: true }, 'full')).not.toBeNull();
    expect(cameraShot('subtle', { type: 'damage', side: 'enemy', effectiveness: 2 }, 'full')).toBeNull();
    expect(cameraShot('cinematic', { type: 'damage', side: 'enemy', effectiveness: 2 }, 'full')).not.toBeNull();
    expect(cameraShot('subtle', { type: 'faint', side: 'player' }, 'full')).toBeNull();
    expect(cameraShot('cinematic', { type: 'move' }, 'full')).toBeNull();
  });
});

describe('S253 move animation packs', () => {
  const look = { anim: 'rogue-ember', pack: 'ess-ember', script: 'ebdx-ember' };
  it('mixed keeps the script, pack and stand-by', () => expect(packSource('mixed', look)).toEqual({ anim: 'ess-ember', alt: 'rogue-ember', script: 'ebdx-ember' }));
  it('pokerogue uses only its own file', () => expect(packSource('pokerogue', look)).toEqual({ anim: 'rogue-ember' }));
  it('essentials drops the script and falls back when the move has no pack file', () => {
    expect(packSource('essentials', look)).toEqual({ anim: 'ess-ember', alt: 'rogue-ember' });
    expect(packSource('essentials', { anim: 'rogue-tackle' })).toEqual({ anim: 'rogue-tackle' });
    expect(packSource('mixed', { anim: 'rogue-tackle' })).toEqual({ anim: 'rogue-tackle' });
  });
});

describe('S242 parallax', () => {
  it('is zero when off or reduced', () => {
    expect(parallaxOffset(false, 'full', 1, 'ground')).toBe(0);
    expect(parallaxOffset(true, 'reduced', 1, 'ground')).toBe(0);
  });
  it('nearer layers slide further, against the pointer, within the range', () => {
    const far = parallaxOffset(true, 'full', 1, 'scenery');
    const near = parallaxOffset(true, 'full', 1, 'ground');
    expect(near).toBeCloseTo(-PARALLAX_RANGE);
    expect(Math.abs(near)).toBeGreaterThan(Math.abs(far));
    expect(parallaxOffset(true, 'full', 9, 'ground')).toBeCloseTo(-PARALLAX_RANGE);
  });
  it('maps the pointer to -1..1 and survives a zero size', () => {
    expect(pointerShare(0, 960)).toBe(-1);
    expect(pointerShare(480, 960)).toBe(0);
    expect(pointerShare(5, 0)).toBe(0);
  });
});

describe('S256 stickers', () => {
  it('has unique ids', () => expect(new Set(STICKERS.map((s) => s.id)).size).toBe(STICKERS.length));
  it('rate-limits taps and caps how many are on screen', () => {
    expect(canSendSticker(0, null, 0)).toBe(true);
    expect(canSendSticker(STICKER_COOLDOWN_MS - 1, 0, 0)).toBe(false);
    expect(canSendSticker(STICKER_COOLDOWN_MS, 0, 0)).toBe(true);
    expect(canSendSticker(5000, null, 3)).toBe(false);
  });
});

describe('settings v31 migration', () => {
  it('adds the four presentation settings, all off, to a v30 save', () => {
    const { battleCamera, mapParallax, moveAnimPack, stickers, ...old } = { ...DEFAULT_SETTINGS, musicVolume: 0.3 };
    void [battleCamera, mapParallax, moveAnimPack, stickers];
    const storage = new MemoryStorageProvider();
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 30, savedAt: '', data: old }));
    const s = new SaveManager(storage, content).loadSettings();
    expect(s.musicVolume).toBe(0.3);
    expect(s).toMatchObject({ battleCamera: 'off', mapParallax: false, moveAnimPack: 'mixed', stickers: false });
  });
});

describe('S258 run-aware loading tips', () => {
  it('uses the general tip with no run and on most screens', () => {
    expect(loadingTipFor(2, null)).toBe(loadingTip(2));
    expect(loadingTipFor(0, { lead: 'Pikachu', badges: 2 })).toBe(loadingTip(0));
  });
  it('talks about the run on every third screen', () => {
    expect(loadingTipFor(2, { lead: 'Pikachu', badges: 2 })).toContain('Pikachu');
    expect(loadingTipFor(5, { lead: 'Pikachu', badges: 1 })).toContain('1 badge earned');
    expect(loadingTipFor(2, { badges: 0 })).toContain('No badges');
  });
});
