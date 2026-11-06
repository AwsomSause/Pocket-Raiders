// Overhaul slice 24: team chemistry combos (src/data/overhaul/team_chemistry.json, 185 entries).
// A combo is active when the party meets its requirement. Pure and save-free. Supported requirement parts:
// a species list ("Bulbasaur+Charmander+Squirtle", an evolved member counts for its earlier forms),
// ~type:T>=N, ~distinct:types>=N, ~gen:G>=N, ~family:Name>=N, ~evolved:all, ~nfe:all, ~shiny>=N.
// Anything else (weather, ability, egg group, tags, trade/stone/friendship evolutions, size, starter) is
// not played yet and the combo never fires.

import { overhaulCatalogs } from './catalogs';
import type { Content } from '../contentSchema';
import type { PokemonInstance } from '../state';

type Cat = ReturnType<typeof overhaulCatalogs>;
export type Combo = Cat['team_chemistry']['entries'][number];

/** Chemistry points a rest stop gives every pair inside an active combo. */
export const COMBO_CAMP_POINTS: Record<Combo['tier'], number> = { common: 1, uncommon: 2, rare: 3, epic: 4 };

type Mon = Pick<PokemonInstance, 'uid' | 'speciesId' | 'shiny'>;

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function chain(content: Content, id: string): string[] {
  const out: string[] = [];
  let cur: string | null | undefined = id;
  for (let i = 0; cur && i < 8; i++) {
    out.push(cur);
    cur = content.species.get(cur)?.evolvesFrom;
  }
  return out;
}

/** The members a clause uses, or null when the clause is not met or not supported. */
function clause(content: Content, entry: Combo, party: readonly Mon[], text: string): string[] | null {
  const all = party.map((m) => m.uid);
  if (!text.startsWith('~')) {
    if (!entry.complete || !entry.speciesIds.length) return null;
    const used: string[] = [];
    for (const sid of entry.speciesIds) {
      const m = party.find((x) => !used.includes(x.uid) && chain(content, x.speciesId).includes(sid));
      if (!m) return null;
      used.push(m.uid);
    }
    return used;
  }
  const m = /^~([a-z]+)(?::([^>]+?))?(?:>=(\d+))?$/.exec(text);
  if (!m) return null;
  const [, kind, arg, nStr] = m;
  const n = Number(nStr ?? 0);
  const spec = (x: Mon) => content.species.get(x.speciesId);
  let hit: Mon[];
  switch (kind) {
    case 'type': hit = party.filter((x) => spec(x)?.types.some((t) => t === arg?.toLowerCase())); break;
    case 'gen': hit = party.filter((x) => String(spec(x)?.generation) === arg); break;
    case 'family': hit = party.filter((x) => chain(content, x.speciesId).includes(slug(arg ?? ''))); break;
    case 'shiny': hit = party.filter((x) => x.shiny); break;
    case 'distinct': {
      if (arg !== 'types') return null;
      const set = new Set(party.flatMap((x) => spec(x)?.types ?? []));
      return set.size >= n ? all : null;
    }
    case 'evolved': return arg === 'all' && party.length > 0 && party.every((x) => spec(x)?.evolvesFrom) ? all : null;
    case 'nfe': {
      if (arg !== 'all' || !party.length) return null;
      const parents = new Set([...content.species.values()].map((s) => s.evolvesFrom).filter(Boolean));
      return party.every((x) => parents.has(x.speciesId)) ? all : null;
    }
    default: return null;
  }
  return hit.length >= n && n > 0 ? hit.map((x) => x.uid) : null;
}

/** The uids that make `entry` active, or null. */
export function comboMembers(content: Content, entry: Combo, party: readonly Mon[]): string[] | null {
  const used = new Set<string>();
  for (const c of entry.requirement.split('&')) {
    const r = clause(content, entry, party, c.trim());
    if (!r) return null;
    r.forEach((u) => used.add(u));
  }
  return used.size >= 2 ? [...used] : null;
}

export function activeCombos(content: Content, party: readonly Mon[]): { combo: Combo; members: string[] }[] {
  const out: { combo: Combo; members: string[] }[] = [];
  for (const combo of overhaulCatalogs().team_chemistry.entries) {
    const members = comboMembers(content, combo, party);
    if (members) out.push({ combo, members });
  }
  return out;
}
