import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildCatalog } from '../../src/assets/catalog';
import { BADGE_TYPES, STORY_ICONS, badgeIconId, heartIconId, storyIconScale } from '../../src/assets/storyIcons';

function pngSize(path: string): [number, number] {
  const b = readFileSync(path);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

describe('story icon pack (P7)', () => {
  it('has the 107 icons the pack promises', () => {
    expect(STORY_ICONS).toHaveLength(107);
    expect(new Set(STORY_ICONS.map((i) => i.id)).size).toBe(107);
  });
  it('every icon file exists at its stated size', () => {
    for (const i of STORY_ICONS) {
      const file = `public/assets/${i.path}`;
      expect(existsSync(file), file).toBe(true);
      expect(pngSize(file), i.id).toEqual([i.size, i.size]);
    }
  });
  it('is in the catalog, lazy', () => {
    const cat = buildCatalog({ pokemon: [], trainerAssetIds: [], itemAssetIds: [], backgroundAssetIds: [] });
    for (const i of STORY_ICONS) expect(cat.find((e) => e.id === i.id)?.lazy, i.id).toBe(true);
  });
  it('badge lookup covers all 18 types and rejects others', () => {
    expect(BADGE_TYPES).toHaveLength(18);
    expect(badgeIconId('Fire')).toBe('icon.badge.fire');
    expect(badgeIconId('stellar')).toBeNull();
  });
  it('heart level clamps and scale stays whole', () => {
    expect(heartIconId(0)).toBe('icon.heart.1');
    expect(heartIconId(99)).toBe('icon.heart.10');
    expect(storyIconScale(64)).toBe(2);
    expect(storyIconScale(10)).toBe(1);
  });
});
