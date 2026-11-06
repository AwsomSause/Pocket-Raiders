// Overhaul slice 2 (THE OVERHAUL.md rule 5): every species and form, checked across systems at once.
// A data change to one Pokémon that breaks battle, evolution, eggs, trades, forms, sprites or saves fails here by name.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createPokemon } from '../../src/core/pokemon';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { buildContent } from '../../src/data';
import { crossSystemProblems, type CrossProblem } from '../../src/quality/crossSystem';
import { isTransformation, meetableSpecies } from '../../src/quality/supportStatus';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const assetsDir = join(__dirname, '..', '..', 'public', 'assets');
const assetExists = (p: string) => existsSync(join(assetsDir, p));
const baseRun = (): RunState => structuredClone(chooseStarter(content, createRun(content, { runId: 'cross', seed: 'cross', archetypeId: 'red' }), 0));
const show = (ps: CrossProblem[]) => ps.slice(0, 30).map((p) => `${p.speciesId} [${p.system}] ${p.problem}`).join('\n');

describe('Cross-system check: every species and form', () => {
  it('every species works in battle, evolution, eggs, trades, forms and sprites (normal)', () => {
    const problems = crossSystemProblems(content, { run: baseRun(), assetExists });
    expect(problems, show(problems)).toEqual([]);
  });

  it('every species a player can own survives a save and reload (in parties of six)', () => {
    const saves = new SaveManager(new MemoryStorageProvider(), content);
    const ids = [...meetableSpecies(content)].filter((id) => !isTransformation(content.species.get(id)!)).sort();
    expect(ids.length).toBeGreaterThan(1000);
    for (let i = 0; i < ids.length; i += 6) {
      const run = baseRun();
      run.party = ids.slice(i, i + 6).map((id, j) => createPokemon(content, id, 1 + ((i + j) % 100), `p${i + j}`, `cross:${id}`));
      expect(saves.saveRun(run), ids[i]).toEqual({ ok: true });
      const loaded = saves.loadRun();
      expect(loaded.status, ids[i]).toBe('ok');
      if (loaded.status === 'ok') expect(loaded.data.party, ids[i]).toEqual(run.party);
    }
  });

  it('a Pokémon with no usable moves still enters battle with a stand-in attack (boundary)', () => {
    const c = buildContent();
    c.species.get('bulbasaur')!.learnset = [{ level: 1, move: 'max-guard' }];
    const problems = crossSystemProblems(c, { run: baseRun(), assetExists, speciesIds: ['bulbasaur'] });
    expect(problems).toEqual([]);
    expect(createPokemon(c, 'bulbasaur', 5, 'b').moves.map((m) => m.id)).toEqual(['tackle']);
  });

  it('names the species and the system when data breaks (failure)', () => {
    const c = buildContent();
    c.species.get('charmander')!.evolutions = [{ to: 'not-a-pokemon', level: 16 }];
    c.species.get('pikachu')!.abilities = { normal: ['not-an-ability'], hidden: null };
    const venusaur = c.species.get('venusaur')!;
    venusaur.assets = { ...venusaur.assets, sprite: 'missing-sprite' };
    const problems = crossSystemProblems(c, { run: baseRun(), assetExists, speciesIds: ['charmander', 'pikachu', 'venusaur', 'missingno'] });
    const has = (id: string, system: string, text: RegExp) => problems.some((p) => p.speciesId === id && p.system === system && text.test(p.problem));
    expect(has('charmander', 'evolution', /unknown species "not-a-pokemon"/), show(problems)).toBe(true);
    expect(has('pikachu', 'battle', /unknown ability "not-an-ability"/), show(problems)).toBe(true);
    expect(has('venusaur', 'sprite', /front sprite missing/), show(problems)).toBe(true);
    expect(has('missingno', 'battle', /not in the species list/), show(problems)).toBe(true);
  });

  it('the walk is read-only: the run it is given stays the same', () => {
    const run = baseRun();
    const before = structuredClone(run);
    crossSystemProblems(content, { run, assetExists, speciesIds: ['eevee', 'charmander', 'venusaur'] });
    expect(run).toEqual(before);
  });
});
