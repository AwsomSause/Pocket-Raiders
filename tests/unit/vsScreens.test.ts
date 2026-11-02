// VS screens (Pokémon Memories slice 5): every boss with a VS card has its
// still picture, its card and bar ship and are catalogued, and the shared
// art is on disk.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { VS_BARS, VS_CARDS, VS_SHARED, vsCardFor, type VsStyle } from '../../src/assets/catalog';
import { VS_MS } from '../../src/ui/battleFx/vsLook';

const assets = join(import.meta.dirname, '..', '..', 'public', 'assets');
const manifest = JSON.parse(readFileSync(join(assets, 'manifest.json'), 'utf8')) as { assets: { id: string; path: string; lazy?: boolean }[] };
const byId = new Map(manifest.assets.map((a) => [a.id, a]));
const onDisk = (id: string) => {
  const entry = byId.get(id);
  expect(entry, id).toBeDefined();
  expect(entry!.lazy, id).toBe(true);
  expect(existsSync(join(assets, entry!.path)), id).toBe(true);
};

describe('VS screens', () => {
  it('every boss with a card has its still picture, card and bar, in one style only', () => {
    const seen = new Set<string>();
    for (const [style, names] of Object.entries(VS_CARDS) as [VsStyle, readonly string[]][]) {
      for (const n of names) {
        expect(seen.has(n), n).toBe(false);
        seen.add(n);
        expect(existsSync(join(assets, 'images', 'bosses', `${n}.png`)), n).toBe(true);
        const vs = vsCardFor(`boss.${n}`)!;
        expect(vs.style).toBe(style);
        onDisk(vs.card);
        onDisk(vs.bar);
      }
    }
    expect(seen.size).toBeGreaterThanOrEqual(60);
  });

  it('the Kanto leaders use their own bar, others the shared one, and a boss without a card gets none', () => {
    for (const n of VS_BARS) expect(vsCardFor(`boss.${n}`)?.bar).toBe(`vs.bar.${n}`);
    expect(vsCardFor('boss.clay')?.bar).toBe('vs.shared.bw_bar');
    expect(vsCardFor('boss.bugsy')?.bar).toBe('vs.shared.hgss_bar');
    expect(vsCardFor('boss.diantha')).toBeNull();
    expect(vsCardFor('trainer.red')).toBeNull();
  });

  it('the shared art is on disk and every style has a length', () => {
    for (const n of VS_SHARED) onDisk(`vs.shared.${n}`);
    for (const style of Object.keys(VS_CARDS) as VsStyle[]) expect(VS_MS[style]).toBeGreaterThan(1500);
  });
});
