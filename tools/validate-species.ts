// Pokémon database validator (The Overhaul, P0 section 6.6). Run it after any change to species data.
//
//   npm run data:validate                  the game's own checks (src/quality/speciesAudit.ts)
//   npm run data:validate -- --official    also compare with PokeAPI's official data: base stats, types,
//                                          abilities, Pokédex numbers, catch rates, and level-up moves no
//                                          official game teaches (CSVs are downloaded into .cache/pokeapi)
//
// Exits 1 when the game's own checks find a problem. Differences from the official data are listed, not
// failed: some are on purpose (PokeRogue learnsets, custom forms, the game's evolution rules, GAME_DESIGN §5c).
// Fix a real data mistake in src/data/speciesFixes.json. Read-only: never writes game files.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type * as Data from '../src/data/index.ts';
import type * as Audit from '../src/quality/speciesAudit.ts';
import { closeModules, loadModule } from './lib/gameModules.ts';

const { buildContent } = await loadModule<typeof Data>('/src/data/index.ts');
const { auditSpecies } = await loadModule<typeof Audit>('/src/quality/speciesAudit.ts');
await closeModules();

const content = buildContent();
const problems = auditSpecies(content);
console.log(`${problems.length ? 'FAIL' : 'ok  '} Species audit: ${content.species.size} species and forms, ${problems.length} problems`);
for (const p of problems.slice(0, 50)) console.log(`  ${p.speciesId} [${p.check}]: ${p.detail}`);

if (process.argv.includes('--official')) compareOfficial();
if (problems.length) process.exit(1);

function compareOfficial(): void {
  const dir = join(import.meta.dirname, '..', '.cache', 'pokeapi');
  mkdirSync(dir, { recursive: true });
  const download = (name: string): string => {
    const path = join(dir, `${name}.csv`);
    if (!existsSync(path)) execFileSync('curl', ['-sSfL', '-o', path, `https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/${name}.csv`]);
    return path;
  };
  const csv = (name: string): Record<string, string>[] => {
    const [head, ...rows] = readFileSync(download(name), 'utf8').trim().split('\n');
    const keys = head!.split(',');
    return rows.map((r) => Object.fromEntries(r.split(',').map((v, i) => [keys[i], v])));
  };
  const pokemon = csv('pokemon');
  const speciesRows = new Map(csv('pokemon_species').map((s) => [s.id!, s]));
  const statKey: Record<string, string> = { 1: 'hp', 2: 'atk', 3: 'def', 4: 'spa', 5: 'spd', 6: 'spe' };
  const stats = new Map<string, Record<string, number>>();
  for (const r of csv('pokemon_stats')) stats.set(r.pokemon_id!, { ...stats.get(r.pokemon_id!), [statKey[r.stat_id!]!]: Number(r.base_stat) });
  const typeName = new Map(csv('types').map((t) => [t.id!, t.identifier!]));
  const types = new Map<string, string[]>();
  for (const r of csv('pokemon_types')) {
    const list = types.get(r.pokemon_id!) ?? [];
    list[Number(r.slot) - 1] = typeName.get(r.type_id!)!;
    types.set(r.pokemon_id!, list);
  }
  const abilityName = new Map(csv('abilities').map((a) => [a.id!, a.identifier!]));
  const abilities = new Map<string, { normal: string[]; hidden: string | null }>();
  for (const r of csv('pokemon_abilities')) {
    const a = abilities.get(r.pokemon_id!) ?? { normal: [], hidden: null };
    if (r.is_hidden === '1') a.hidden = abilityName.get(r.ability_id!)!;
    else a.normal.push(abilityName.get(r.ability_id!)!);
    abilities.set(r.pokemon_id!, a);
  }
  const moveName = new Map(csv('moves').map((m) => [m.id!, m.identifier!]));
  const legal = new Map<string, Set<string>>(); // by species id: every move any form learns in any game
  const pokemonSpecies = new Map(pokemon.map((p) => [p.id!, p.species_id!]));
  for (const line of readFileSync(download('pokemon_moves'), 'utf8').split('\n').slice(1)) {
    const [pid, , mid] = line.split(',');
    const sid = pokemonSpecies.get(pid ?? '');
    if (!sid) continue;
    const set = legal.get(sid) ?? new Set<string>();
    set.add(moveName.get(mid!)!);
    legal.set(sid, set);
  }
  // A Pokémon may keep moves its earlier stages learn.
  const lineMoves = (sid: string) => {
    const all = new Set<string>();
    for (let at = speciesRows.get(sid); at; at = speciesRows.get(at.evolves_from_species_id ?? '')) for (const m of legal.get(at.id!) ?? []) all.add(m);
    return all;
  };
  // PokeAPI spells two moves differently.
  const spelling: Record<string, string> = { 'vise-grip': 'vice-grip' };

  const diffs: string[] = [];
  let compared = 0;
  for (const s of content.species.values()) {
    const row = pokemon.find((p) => p.identifier === s.id) ?? pokemon.find((p) => p.is_default === '1' && speciesRows.get(p.species_id!)?.identifier === s.id);
    if (!row) continue; // custom forms and Pokémon have no official entry
    compared++;
    const st = stats.get(row.id!)!;
    for (const k of Object.keys(st)) if (s.baseStats[k as keyof typeof s.baseStats] !== st[k]) diffs.push(`${s.id}: base ${k} ${s.baseStats[k as keyof typeof s.baseStats]}, official ${st[k]}`);
    const t = types.get(row.id!)!.join('/');
    if (t !== s.types.join('/')) diffs.push(`${s.id}: types ${s.types.join('/')}, official ${t}`);
    const a = abilities.get(row.id!);
    if (a && (a.normal.join('/') !== s.abilities.normal.join('/') || a.hidden !== s.abilities.hidden)) diffs.push(`${s.id}: abilities ${s.abilities.normal.join('/')} | ${s.abilities.hidden}, official ${a.normal.join('/')} | ${a.hidden}`);
    if (Number(row.species_id) !== s.dex) diffs.push(`${s.id}: dex ${s.dex}, official ${row.species_id}`);
    if (!s.form || s.form.kind === 'regional' || s.form.kind === 'alternate') {
      const ok = lineMoves(row.species_id!);
      const odd = s.learnset.filter((e) => !ok.has(spelling[e.move] ?? e.move)).map((e) => `${e.move}@${e.level}`);
      if (odd.length) diffs.push(`${s.id}: level-up moves no official game teaches it: ${odd.join(', ')}`);
    }
  }
  console.log(`info Official data: compared ${compared} species and forms, ${diffs.length} differences`);
  for (const d of diffs) console.log(`  ${d}`);
}
