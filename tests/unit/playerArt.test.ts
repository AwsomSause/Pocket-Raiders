// Player trainer art (Story Overhaul P1): every registered animation ships a strip whose frames match the registry,
// is in the manifest as a lazy atlas, and Look A has the 79 animation frames the plan promises.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { allPlayerAnims, PLAYER_ANIMS, playerAnimBase, playerAnimDef, playerAnimId, playerFrameNames } from '../../src/assets/playerArt';

const assets = join(import.meta.dirname, '..', '..', 'public', 'assets');
const manifest = JSON.parse(readFileSync(join(assets, 'manifest.json'), 'utf8')) as { assets: { id: string; path: string; atlasPath?: string; lazy?: boolean }[] };
const byId = new Map(manifest.assets.map((a) => [a.id, a]));

describe('player trainer art registry', () => {
  it('names ids player_<look>_<anim>', () => {
    expect(playerAnimId('a', 'throw')).toBe('player_a_throw');
    expect(playerAnimDef('a', 'nope')).toBeUndefined();
  });

  it('every animation has a strip whose frames match the registry and is a lazy manifest atlas', () => {
    for (const [look, anim] of allPlayerAnims()) {
      const def = playerAnimDef(look, anim)!;
      const base = playerAnimBase(look, anim);
      expect(existsSync(join(assets, `${base}.png`)), `${look}/${anim} png`).toBe(true);
      const atlas = JSON.parse(readFileSync(join(assets, `${base}.json`), 'utf8')) as { textures: { frames: { filename: string; frame: { x: number; w: number; h: number } }[]; size: { w: number } }[] };
      const frames = atlas.textures[0]!.frames;
      expect(frames.map((f) => f.filename), `${look}/${anim}`).toEqual(playerFrameNames(def));
      const last = frames[frames.length - 1]!;
      expect(last.frame.x + last.frame.w).toBe(atlas.textures[0]!.size.w);
      const entry = byId.get(playerAnimId(look, anim));
      expect(entry?.atlasPath, playerAnimId(look, anim)).toBe(`${base}.json`);
      expect(entry?.lazy).toBe(true);
    }
  });

  it('Look A has 79 animation frames (portrait and the Pidgey scene are extra); Look B is a stub', () => {
    const extras = new Set(['portrait', 'pidgey']);
    const frames = Object.entries(PLAYER_ANIMS.a).filter(([k]) => !extras.has(k)).reduce((n, [, d]) => n + d.frames, 0);
    expect(frames).toBe(79);
    expect(Object.keys(PLAYER_ANIMS.b).sort()).toEqual(['portrait', 'throw']);
  });

  it('every battle moment has a back-view animation in Look A', () => {
    const moments = new Set(Object.values(PLAYER_ANIMS.a).filter((d) => d.view === 'back').map((d) => d.moment));
    for (const m of ['sendOut', 'recall', 'win', 'hit', 'defeat'] as const) expect(moments.has(m), m).toBe(true);
  });
});
