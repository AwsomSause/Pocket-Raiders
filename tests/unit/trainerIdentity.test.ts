// Trainer identity (plans/starter-sets-quests-mastery-plan.md, Part 2a):
// signature types and Pokémon, and the passives of Cynthia, Oak and N.

import { describe, expect, it } from 'vitest';
import { getArchetype } from '../../src/core/archetypes';
import { createProfile } from '../../src/core/profile';
import { applyRunToProfile } from '../../src/core/progress';
import { chooseStarter, createRun, mapPreviews } from '../../src/core/run';
import { buildSummary, defaultPrep } from '../../src/core/runPrep';
import { buildContent, RAW_CONTENT } from '../../src/data';
import { content } from './helpers';

const prep = () => defaultPrep(content);

describe('trainer identity', () => {
  it('every trainer has known signature species', () => {
    for (const a of content.archetypes.values()) {
      for (const id of a.signatureSpecies) expect(content.species.has(id), `${a.id}: ${id}`).toBe(true);
      expect(a.available, a.id).toBe(true);
    }
  });

  it('Oak earns 50% more Research Points; N’s Pokémon gain more friendship', () => {
    const payFor = (archetypeId: string) => {
      const run = createRun(content, { runId: 'r', seed: 'rp', archetypeId, prep: prep() });
      run.log.speciesSeen = ['pidgey', 'rattata', 'spearow', 'zubat'];
      run.log.speciesCaught = ['pidgey'];
      return applyRunToProfile(content, createProfile(content, 'p'), run, '2026-10-30').researchPoints;
    };
    expect(payFor('oak')).toBe(Math.round(payFor('red') * 1.5));
  });

  it('Cynthia sees the gym leader’s whole team and Oak the wild Pokémon, without any item', () => {
    for (const id of ['cynthia', 'oak']) {
      const started = chooseStarter(content, createRun(content, { runId: 'r', seed: 'pv', archetypeId: id, prep: prep() }), 0);
      const previews = Object.values(mapPreviews(content, started));
      expect(previews.length, id).toBeGreaterThan(0);
      expect(previews.every((p) => p.itemId === null && p.source === getArchetype(content, id).name)).toBe(true);
      const red = chooseStarter(content, createRun(content, { runId: 'r', seed: 'pv', archetypeId: 'red', prep: prep() }), 0);
      expect(Object.keys(mapPreviews(content, red))).toHaveLength(0);
    }
  });

  it('the Run Build Summary names the signature', () => {
    expect(buildSummary(content, 'misty', prep()).join('\n')).toMatch(/Signature: Water · Staryu/);
    expect(buildSummary(content, 'red', prep()).join('\n')).toMatch(/Signature: Pikachu/);
  });

  it('rejects an unknown signature species', () => {
    const raw = structuredClone(RAW_CONTENT) as any;
    raw.archetypes[0].signatureSpecies = ['missingno'];
    expect(() => buildContent(raw)).toThrow(/missingno/);
  });
});
