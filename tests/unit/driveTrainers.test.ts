// Every trainer from the Google Drive packs (tools/drive/build-trainers.py, plans/drive-assets-plan.md):
// each new class and named trainer is valid game data, has its art on disk, and loads on demand.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { driveTrainer, trainerEntry } from '../../src/assets/catalog';
import { getContent } from '../../src/data';
import { pickGymLeader, trainerClassesFor } from '../../src/core/themes';
import { Rng, hashSeed } from '../../src/core/rng';
import trainersDrive from '../../src/data/trainersDrive.json';
import bosses from '../../src/data/bosses.json';

const assets = join(import.meta.dirname, '..', '..', 'public', 'assets');
const content = getContent();
const driveBosses = (bosses as { id: string; drive?: boolean; sprites: { default: string } }[]).filter((b) => b.drive);

function hasArt(assetId: string) {
  const entry = trainerEntry(assetId);
  expect(existsSync(join(assets, entry.path)), assetId).toBe(true);
  if (entry.atlasPath) expect(existsSync(join(assets, entry.atlasPath)), assetId).toBe(true);
}

describe('Google Drive trainers', () => {
  it('adds hundreds of trainer classes, all in the game data with their art', () => {
    expect(trainersDrive.length).toBeGreaterThan(600);
    for (const c of trainersDrive) {
      expect(content.trainers.get(c.id)?.name, c.id).toBe(c.name);
      expect(c.types.length, c.id).toBeGreaterThan(0);
      expect(new Set(c.names).size, c.id).toBe(c.names.length);
      hasArt(c.spriteAssetId);
    }
  });

  it('adds the named trainers as bosses with teams and art', () => {
    expect(driveBosses.length).toBeGreaterThan(70);
    for (const b of driveBosses) {
      const boss = content.bosses.get(b.id);
      expect(boss, b.id).toBeDefined();
      for (const s of boss!.signature) expect(content.species.has(s), `${b.id}: ${s}`).toBe(true);
      hasArt(b.sprites.default);
    }
  });

  it('loads Drive trainer art on demand and everything else at start-up as before', () => {
    expect(driveTrainer('trainer.pr/ace_trainer_f')).toBe(true);
    expect(driveTrainer('trainer.drive/beauty')).toBe(true);
    expect(driveTrainer('boss.drive/professor-oak')).toBe(true);
    expect(driveTrainer('trainer.hiker')).toBe(false);
    expect(driveTrainer('boss.brock')).toBe(false);
    expect(trainerEntry('trainer.pr/ace_trainer_f').lazy).toBe(true);
    expect(trainerEntry('boss.drive/professor-oak').lazy).toBe(true);
    expect(trainerEntry('boss.brock').lazy).toBeUndefined();
  });

  it('every animated strip atlas fits its picture', () => {
    for (const c of trainersDrive.filter((t) => t.spriteAssetId.startsWith('trainer.drive/'))) {
      const entry = trainerEntry(c.spriteAssetId);
      const png = readFileSync(join(assets, entry.path));
      const w = png.readUInt32BE(16);
      const atlas = JSON.parse(readFileSync(join(assets, entry.atlasPath!), 'utf8')) as { textures: { frames: { frame: { x: number; w: number } }[] }[] };
      const frames = atlas.textures[0]!.frames;
      expect(frames.length, c.id).toBeGreaterThan(1);
      for (const { frame } of frames) expect(frame.x + frame.w, c.id).toBeLessThanOrEqual(w);
    }
  });

  it('new classes join the trainer pools and new bosses can be met (same seed, same pick)', () => {
    const theme = { id: 'water', name: 'Water', types: ['water'] } as never;
    const pool = trainerClassesFor(content, theme);
    expect(pool.some((c) => trainersDrive.some((d) => d.id === c.id))).toBe(true);
    const used = [...content.bosses.keys()].filter((id) => !driveBosses.some((b) => b.id === id));
    const a = pickGymLeader(content, theme, used, new Rng(hashSeed('drive')));
    const b = pickGymLeader(content, theme, used, new Rng(hashSeed('drive')));
    expect(a.id).toBe(b.id);
    expect(driveBosses.some((d) => d.id === a.id)).toBe(true);
  });
});
