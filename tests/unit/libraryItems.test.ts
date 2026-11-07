import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { catalogIconId } from '../../src/core/contentSchema';
import { getContent } from '../../src/data';

const ids: string[] = JSON.parse(readFileSync('tools/drive/library-items.json', 'utf8'));

describe('item library wiring (P4)', () => {
  it('maps icons to asset ids', () => {
    expect(catalogIconId('library/lvl1candy')).toBe('item.library/lvl1candy');
    expect(catalogIconId('potion')).toBe('item.gen5/potion');
    expect(catalogIconId(null)).toBe('item.gen5/0');
  });

  it('every wired item has a real picture, a draft card and a working effect', () => {
    const content = getContent();
    for (const id of ids) {
      const entry = content.catalog.get(id);
      const reward = content.rewards.get(entry ? `item:${id}` : id);
      expect(entry ?? reward, id).toBeTruthy();
      const icon = entry ? `item.${entry.icon}` : reward!.iconAssetId;
      expect(icon, id).toMatch(/^item\.library\//);
      expect(existsSync(`public/assets/images/${icon.replace('item.', 'items/')}.png`), id).toBe(true);
      if (entry) expect(entry.status, id).toBe('supported');
    }
  });

  it('EXP and level candies are gone from the draft (Kice, 2026-11-07)', () => {
    for (const id of ['lvl-1-candy', 'lvl-100-candy', 'rarer-candy', 'exp-candy-s', 'exp-candy-m', 'exp-candy-l']) expect(getContent().rewards.has(id), id).toBe(false);
  });
});
