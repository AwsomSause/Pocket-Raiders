// Overhaul slice 21: the 58 personalities and 54 quirks of the content pack (src/data/overhaul/).
// Pure and save-free: both come from a hash of the Pokémon's uid, so a Pokémon always has the same ones.
// A personality is drawn from the ones that list the Pokémon's nature. The older 12 traits and 8 quirks of
// Party Life stay exactly as they were (old Pokémon keep theirs); these are shown alongside them.

import { overhaulCatalogs } from './catalogs';
import type { PokemonInstance } from '../state';

type Cat = ReturnType<typeof overhaulCatalogs>;
export type OverhaulPersonality = Cat['personalities']['entries'][number];
export type OverhaulQuirk = Cat['quirks']['entries'][number];

const fnv = (text: string): number => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
};

export function personalityOfMon(mon: Pick<PokemonInstance, 'uid' | 'nature'>): OverhaulPersonality {
  const all = overhaulCatalogs().personalities.entries;
  const nature = mon.nature ? mon.nature[0]!.toUpperCase() + mon.nature.slice(1) : null;
  const fit = nature ? all.filter((p) => p.natures.includes(nature)) : [];
  const pool = fit.length ? fit : all;
  return pool[fnv(`${mon.uid}:pers58`) % pool.length]!;
}

export function quirkOfMon(mon: Pick<PokemonInstance, 'uid'>): OverhaulQuirk {
  const all = overhaulCatalogs().quirks.entries;
  return all[fnv(`${mon.uid}:quirk54`) % all.length]!;
}

/** One line for the Personality tab: "Brave: Steps up first. Loves Naps: Falls asleep anywhere warm." */
export function identityLine(mon: Pick<PokemonInstance, 'uid' | 'nature'>): string {
  const p = personalityOfMon(mon);
  const q = quirkOfMon(mon);
  return `${p.name}, ${p.voice}: ${p.summary} Quirk, ${q.name}: ${q.description}`;
}

type Named = Pick<PokemonInstance, 'uid' | 'nature' | 'speciesId'>;

/**
 * A quirk reaction to something that just happened (`when` is the catalog's key, e.g. "rest_node", "battle_win").
 * `key` makes the choice repeatable (an encounter number, a node id); a hash picks one Pokémon of the party whose
 * quirk reacts. Returns null when nobody's quirk fits. Never touches a gameplay RNG stream.
 */
export function quirkReaction(party: readonly Named[], when: string, key: string, nameOf: (m: Named) => string): string | null {
  const hits: { mon: Named; line: string }[] = [];
  for (const mon of party) {
    const m = quirkOfMon(mon).moments.find((x) => x.when === when);
    if (m) hits.push({ mon, line: m.line });
  }
  if (!hits.length) return null;
  const pick = hits[fnv(`${key}:${when}:react`) % hits.length]!;
  return pick.line.replaceAll('{Name}', nameOf(pick.mon));
}
