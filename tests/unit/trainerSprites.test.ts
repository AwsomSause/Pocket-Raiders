// Animated boss sprites and throwing back sprites (Pokémon Memories slice 4):
// every listed sprite has a still picture to stand in for it, ships with an
// atlas whose frames fit the strip, and is in the manifest as a lazy asset.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BOSS_ANIMATED, BOSS_BACKS, bossAnimId, bossBackId } from '../../src/assets/catalog';

const assets = join(import.meta.dirname, '..', '..', 'public', 'assets');
const manifest = JSON.parse(readFileSync(join(assets, 'manifest.json'), 'utf8')) as { assets: { id: string; path: string; atlasPath?: string; lazy?: boolean }[] };
const byId = new Map(manifest.assets.map((a) => [a.id, a]));
const pngSize = (file: string) => {
  const b = readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};

function checkAtlas(id: string, minFrames: number) {
  const entry = byId.get(id);
  expect(entry, id).toBeDefined();
  expect(entry!.lazy, id).toBe(true);
  const png = join(assets, entry!.path);
  const { w, h } = pngSize(png);
  const atlas = JSON.parse(readFileSync(join(assets, entry!.atlasPath!), 'utf8')) as { textures: { frames: { frame: { x: number; y: number; w: number; h: number } }[] }[] };
  const frames = atlas.textures[0]!.frames;
  expect(frames.length, id).toBeGreaterThanOrEqual(minFrames);
  for (const { frame } of frames) {
    expect(frame.x + frame.w, id).toBeLessThanOrEqual(w);
    expect(frame.y + frame.h, id).toBeLessThanOrEqual(h);
  }
}

describe('animated trainer sprites', () => {
  it('every animated boss has its still picture and a playable strip', () => {
    expect(BOSS_ANIMATED.length).toBeGreaterThanOrEqual(50);
    for (const n of BOSS_ANIMATED) {
      expect(existsSync(join(assets, 'images', 'bosses', `${n}.png`)), n).toBe(true);
      checkAtlas(`boss.anim.${n}`, 2);
    }
  });

  it('every back sprite is a five-frame throw', () => {
    for (const n of BOSS_BACKS) checkAtlas(`boss.back.${n}`, 5);
  });

  it('maps a boss picture to its animated and back sprites, and nothing else', () => {
    expect(bossAnimId('boss.brock')).toBe('boss.anim.brock');
    expect(bossAnimId('boss.cynthia-gen7')).toBeNull();
    expect(bossAnimId('trainer.red')).toBeNull();
    expect(bossBackId('boss.hilda')).toBe('boss.back.hilda');
    expect(bossBackId('boss.brock')).toBeNull();
  });
});
