import { describe, expect, it } from 'vitest';
import { overhaulCatalogs } from '../../src/core/overhaul/catalogs';
import { activeCombos, comboMembers } from '../../src/core/overhaul/chemistry';
import { content } from './helpers';

const mon = (speciesId: string, uid = speciesId, shiny = false) => ({ uid, speciesId, shiny });
const combos = overhaulCatalogs().team_chemistry.entries;
const byId = (id: string) => combos.find((c) => c.id === id)!;

describe('overhaul chemistry', () => {
  it('a starter trio fires, a pair does not', () => {
    const trio = byId('kanto-trio');
    expect(comboMembers(content, trio, [mon('bulbasaur'), mon('charmander'), mon('squirtle')])?.length).toBe(3);
    expect(comboMembers(content, trio, [mon('bulbasaur'), mon('charmander')])).toBeNull();
  });
  it('an evolved member still counts for its earlier form', () => {
    const trio = byId('kanto-trio');
    expect(comboMembers(content, trio, [mon('venusaur'), mon('charizard'), mon('blastoise')])?.length).toBe(3);
  });
  it('type-count rules need enough members of the type', () => {
    const fire = combos.find((c) => c.requirement === '~type:Fire>=3')!;
    expect(comboMembers(content, fire, [mon('charmander'), mon('vulpix'), mon('growlithe')])).toBeTruthy();
    expect(comboMembers(content, fire, [mon('charmander'), mon('vulpix'), mon('pikachu')])).toBeNull();
  });
  it('the empty party and a unsupported requirement never fire', () => {
    expect(activeCombos(content, [])).toEqual([]);
    const weather = combos.find((c) => c.requirement.startsWith('~weather'))!;
    expect(comboMembers(content, weather, [mon('pikachu'), mon('raichu')])).toBeNull();
  });
  it('no combo fires on every party (not a free bonus)', () => {
    const party = ['pikachu', 'snorlax', 'eevee', 'machop', 'geodude', 'magikarp'].map((s) => mon(s));
    expect(activeCombos(content, party).length).toBeLessThan(15);
  });
  it('a good share of the catalog is playable', () => {
    // species-list combos are the playable base: every complete one fires with its own species as the party.
    let fired = 0;
    for (const c of combos.filter((x) => x.complete && x.speciesIds.length >= 2)) if (comboMembers(content, c, c.speciesIds.map((s) => mon(s)))) fired++;
    expect(fired).toBe(combos.filter((x) => x.complete && x.speciesIds.length >= 2).length);
  });
});
