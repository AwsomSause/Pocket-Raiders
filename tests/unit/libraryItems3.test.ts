// "Give every remaining picture a use" (tools/drive/wire-library3-*.py): every item a batch wired is supported,
// has a library picture and a draft card, is not a key, card or candy, and its effect applies cleanly.
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applyCatalog, getCatalogEntry } from '../../src/core/catalog';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import { catalogRewardId } from '../../src/data';
import { content } from './helpers';

const batches = import.meta.glob('../../tools/drive/library-items3-*.json', { eager: true, import: 'default' }) as Record<string, string[]>;
const ids = Object.values(batches).flat();

describe('Library batch 3 items', () => {
  it('every one is supported, has a library picture and a draft card', () => {
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      const entry = getCatalogEntry(content, id);
      expect(entry.status, id).toBe('supported');
      expect(entry.icon?.startsWith('library/'), id).toBe(true);
      expect(existsSync(`public/assets/images/items/${entry.icon}.png`), id).toBe(true);
      expect(content.rewards.has(catalogRewardId(id)), id).toBe(true);
    }
  });

  it('none is a key, a card or a candy (Kice 2026-11-07)', () => {
    const picture = (id: string) => getCatalogEntry(content, id).icon!.split('/').pop()!;
    for (const id of ids) expect(picture(id), id).not.toMatch(/(?<!bi)key|candy|card$|^cardkeys/);
  });

  it('every effect applies without throwing', () => {
    for (const id of ids) {
      const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'library-items-3', archetypeId: 'red' }), 0);
      const entry = getCatalogEntry(content, id);
      const mon = entry.stacksOn === 'pokemon' ? run.party[0] : undefined;
      expect(() => applyCatalog(content, run, entry, mon ?? createPokemon(content, 'eevee', 20, 'e'), { moneyMultiplier: 1, rng: new Rng(hashSeed('library-items-3')) }), id).not.toThrow();
    }
  });
});
