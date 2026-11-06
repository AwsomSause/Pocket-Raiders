// The items added from the Google Drive packs (tools/drive/build-items.py): each one is a
// working catalog item with its own picture, offered in the draft, and its effect runs.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { heldStatMultiplier } from '../../src/core/battle/held';
import { applyCatalog, getCatalogEntry } from '../../src/core/catalog';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import { catalogRewardId } from '../../src/data';
import driveIds from '../../tools/drive/items.json';
import { content } from './helpers';

const pngSize = (path: string): [number, number] => {
  const b = readFileSync(path);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

describe('Drive pack items', () => {
  it('every one is supported, has a 24x24 icon and a draft card', () => {
    expect(driveIds.length).toBeGreaterThan(100);
    for (const id of driveIds) {
      const entry = getCatalogEntry(content, id);
      expect(entry.status, id).toBe('supported');
      expect(entry.icon, id).toBe(id);
      expect(pngSize(`public/assets/images/items/gen5/${id}.png`), id).toEqual([24, 24]);
      expect(content.rewards.has(catalogRewardId(id)), id).toBe(true);
    }
  });

  it('a Gauntlet only boosts its own family', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'drive-items', archetypeId: 'red' }), 0);
    const eevee = createPokemon(content, 'eevee', 20, 'e');
    const pikachu = createPokemon(content, 'pikachu', 20, 'p');
    const rng = new Rng(hashSeed('drive-items'));
    for (const mon of [eevee, pikachu]) applyCatalog(content, run, getCatalogEntry(content, 'eevee-gauntlet'), mon, { moneyMultiplier: 1, rng });
    expect(eevee.held?.['eevee-gauntlet']).toBe(1);
    expect(heldStatMultiplier({ content }, eevee, 'player', 'atk')).toBeCloseTo(1.3);
    expect(heldStatMultiplier({ content }, pikachu, 'player', 'atk')).toBe(1);
  });

  it('a Herba Mystica boosts the whole team for its next battle', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'drive-items', archetypeId: 'red' }), 0);
    applyCatalog(content, run, getCatalogEntry(content, 'spicy-herba-mystica'), undefined, { moneyMultiplier: 1, rng: new Rng(hashSeed('x')) });
    for (const mon of run.party) expect(mon.boosts).toEqual([{ kind: 'stage', stat: 'atk', stages: 2, turns: 5 }]);
  });
});
