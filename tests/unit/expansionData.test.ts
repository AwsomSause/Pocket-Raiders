// Beta 0.6 slice F4/E0: the expansion data pipeline. Schemas, counts, species-in-dex, and the generated files being current.
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { EXPANSION_APEX_COUNT, EXPANSION_COUNTS, ExpansionFileSchemas } from '../../src/core/expansion/data';
import { expansionData } from '../../src/data/expansion';
import { expansionGaps } from '../../src/quality/expansionGates';
import customSpecies from '../../src/data/customSpecies.json';
import jetSpecies from '../../src/data/jetSpecies.json';
import species from '../../src/data/species.json';
import storySpecies from '../../src/data/storySpecies.json';

const norm = (s: string) => s.toLowerCase().replace(/’/g, "'").trim();
const names = new Set([...(species as { name: string }[]), ...(customSpecies as { name: string }[]), ...storySpecies.species, ...jetSpecies.species].map((p) => norm(p.name)));

describe('expansion data', () => {
  it('holds the planned counts', () => {
    expect(expansionData.characters).toHaveLength(EXPANSION_COUNTS.characters);
    expect(expansionData.specialPokemon).toHaveLength(EXPANSION_COUNTS.specialPokemon);
    expect(expansionData.specialShadows).toHaveLength(EXPANSION_COUNTS.specialShadows);
    expect(expansionData.events).toHaveLength(EXPANSION_COUNTS.events);
    expect(expansionData.raids).toHaveLength(EXPANSION_COUNTS.raids);
    expect(expansionData.apex).toHaveLength(EXPANSION_APEX_COUNT);
    expect(expansionData.variantLines).toHaveLength(14);
  });

  it('has a track, siege map and Extended Cut for the finale and all nine regions', () => {
    for (const list of [expansionData.tracks, expansionData.siege_maps, expansionData.climax_extended]) {
      expect(list).toHaveLength(10);
      expect(new Set(list.map((r) => r.region)).size).toBe(10);
    }
    const kanto = expansionData.tracks.find((t) => t.region === 'kanto')!;
    expect(kanto.name).toBe('The Ledger Fills');
    expect(kanto.steps.map((s) => s.name)).toEqual(['Small Print', 'House Rules', 'Closed Roads', 'Export', 'Under New Management']);
    expect(expansionData.siege_maps.find((s) => s.region === 'kanto')!.districts.map((d) => d.name)).toEqual(['North Gate', 'East Gate', 'South Gate', 'West Gate', 'The Center']);
    const phases = expansionData.climax_extended.find((c) => c.region === 'kanto')!.phases;
    expect(phases.map((p) => p.phase)).toEqual(['0', '0b', '1', '2', '3', '—', '4', '5', '6', '7', '8']);
  });

  it('keeps Apex codes XD001 to XD012, each with a Phase 6', () => {
    expect(expansionData.apex.map((a) => a.code).sort()).toEqual(Array.from({ length: 12 }, (_, i) => `XD${String(i + 1).padStart(3, '0')}`));
    expect(expansionData.apex.find((a) => a.code === 'XD002')).toMatchObject({ id: 'ss.rocket.m2', phase: { timer: '10 turns' } });
    expect(expansionData.apex.every((a) => a.phase.heading.startsWith('Phase 6'))).toBe(true);
  });

  it('only names Pokémon the game has', () => {
    expect(expansionGaps(expansionData, names)).toEqual([]);
  });

  it('the gate catches a missing Pokémon, a wrong count and a duplicate id', () => {
    const bad = structuredClone(expansionData);
    bad.specialPokemon[0]!.species = ['Notamon'];
    bad.characters.pop();
    bad.specialShadows[1]!.id = bad.specialShadows[0]!.id;
    const gaps = expansionGaps(bad, names).join('\n');
    expect(gaps).toContain('"Notamon" is not in the game');
    expect(gaps).toContain('characters: 142, expected 143');
    expect(gaps).toContain('duplicate id');
  });

  it('every file passes its schema, and a bad row does not', () => {
    for (const [k, schema] of Object.entries(ExpansionFileSchemas)) expect(schema.safeParse(expansionData[k as keyof typeof expansionData]).success, k).toBe(true);
    expect(ExpansionFileSchemas.events.safeParse([{ id: 'xe.kanto', region: 'kanto' }]).success).toBe(false);
    expect(ExpansionFileSchemas.specialShadows.safeParse([{ ...expansionData.specialShadows[0], tier: '5 Lost' }]).success).toBe(false);
  });

  it('the generated files match a fresh build from tools/sources/expansion', () => {
    expect(() => execFileSync('node', ['tools/build-expansion.ts', '--check'], { stdio: 'pipe' })).not.toThrow();
  });
});
