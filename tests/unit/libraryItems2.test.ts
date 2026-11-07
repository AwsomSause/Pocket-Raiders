// W7: the second batch of library-picture items (tools/drive/wire-library2.py): each is supported,
// uses a real library picture, shows up in the draft, and its effect runs.
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applyCatalog, getCatalogEntry } from '../../src/core/catalog';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import { catalogRewardId } from '../../src/data';
import ids from '../../tools/drive/library-items2.json';
import { content } from './helpers';

const run0 = () => chooseStarter(content, createRun(content, { runId: 'r', seed: 'library-items-2', archetypeId: 'red' }), 0);
const apply = (id: string, mon = createPokemon(content, 'eevee', 20, 'e')) => {
  const run = run0();
  applyCatalog(content, run, getCatalogEntry(content, id), mon, { moneyMultiplier: 1, rng: new Rng(hashSeed('library-items-2')) });
  return { run, mon };
};

describe('Library batch 2 items', () => {
  it('every one is supported, has a library picture and a draft card', () => {
    expect(ids.length).toBeGreaterThan(100);
    for (const id of ids) {
      const entry = getCatalogEntry(content, id);
      expect(entry.status, id).toBe('supported');
      expect(entry.icon?.startsWith('library/'), id).toBe(true);
      expect(existsSync(`public/assets/images/items/${entry.icon}.png`), id).toBe(true);
      expect(content.rewards.has(catalogRewardId(id)), id).toBe(true);
    }
  });

  it('a ribbon is held and a valuable adds money', () => {
    expect(apply('classic-ribbon-10').mon.held?.['classic-ribbon-10']).toBe(1);
    const before = run0().money;
    expect(apply('pretty-feather').run.money).toBe(before + 200);
  });

  it('an egg item adds an egg to the run', () => {
    const before = JSON.stringify(run0());
    expect(JSON.stringify(apply('rare-egg').run)).not.toBe(before);
  });
});
