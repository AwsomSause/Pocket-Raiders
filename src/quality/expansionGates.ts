// Beta 0.6 INSTRUMENTALITY (slice F4): the content gate over src/data/expansion/*.json. Returns the offending records so
// `npm run report:check` shows a count and tests/unit/expansionData.test.ts can seed a bad record. Empty list = passes.
import { EXPANSION_APEX_COUNT, EXPANSION_COUNTS } from '../core/expansion/data';
import type { ExpansionData } from '../core/expansion/data';

const norm = (s: string) => s.toLowerCase().replace(/’/g, "'").trim();

/** `speciesNames` are the game's Pokémon names (base dex, custom, story and jet species). */
export function expansionGaps(data: ExpansionData, speciesNames: ReadonlySet<string>): string[] {
  const out: string[] = [];
  const counts = { characters: data.characters.length, specialPokemon: data.specialPokemon.length, specialShadows: data.specialShadows.length, events: data.events.length, raids: data.raids.length };
  for (const k of Object.keys(EXPANSION_COUNTS) as (keyof typeof EXPANSION_COUNTS)[]) if (counts[k] !== EXPANSION_COUNTS[k]) out.push(`${k}: ${counts[k]}, expected ${EXPANSION_COUNTS[k]}`);
  if (data.apex.length !== EXPANSION_APEX_COUNT) out.push(`apex: ${data.apex.length}, expected ${EXPANSION_APEX_COUNT}`);
  for (const r of [...data.specialPokemon, ...data.specialShadows]) for (const s of r.species) if (!speciesNames.has(norm(s))) out.push(`${r.id}: species "${s}" is not in the game`);
  const ids = [...data.characters, ...data.specialPokemon, ...data.specialShadows].map((r) => r.id);
  for (const id of ids.filter((x, i) => ids.indexOf(x) !== i)) out.push(`${id}: duplicate id`);
  const codes = data.apex.map((a) => a.code);
  for (const c of codes.filter((x, i) => codes.indexOf(x) !== i)) out.push(`apex ${c}: duplicate code`);
  return out;
}
