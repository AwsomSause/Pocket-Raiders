// The asset manifest is built from readCatalogInputs; a species file it skips never gets its art registered,
// so the game would show placeholders for those Pokémon (Jet and story species were once skipped).
import { describe, expect, it } from 'vitest';
import { readCatalogInputs } from '../../tools/catalogInputs';
import { content } from './helpers';

describe('catalog inputs cover every species with art', () => {
  it('lists the sprite of every Jet and story species', () => {
    const sprites = new Set(readCatalogInputs().pokemon.map((a) => a.sprite));
    const missing = [...content.species.values()].filter((s) => !sprites.has(s.assets.sprite)).map((s) => s.id);
    expect(missing).toEqual([]);
  });
});
