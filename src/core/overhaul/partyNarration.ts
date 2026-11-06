// Overhaul pack: party narration. One short line about your team at a rest stop or after a won battle, from the pack's
// contextual reactions (by personality and by type) and the species scenes (lore at rest nodes). The files load once on
// request (ensureNarration, called by the map and battle scenes); until then, or when nothing fits, there is no line.
// Text only: it never changes a battle or run, uses no gameplay random numbers (a hash of the run and node picks), and
// is a single quiet line, so it stays far below the one-cinematic-moment cap (Moment Director).

import { loadOverhaulLines } from './catalogs';
import { personalityOfMon } from './personality';
import type { PokemonInstance } from '../state';

type Mon = Pick<PokemonInstance, 'uid' | 'nature' | 'speciesId'>;
/** A pack context key (rest_node, night, sunny, boss_intro...), or battle_win for the pack's "victory". */
export type NarrationContext = string;

interface Tables {
  /** `${personalityId}|${context}` and `${Type}|${context}` -> lines with {Name}. */
  reactions: Map<string, string[]>;
  /** species id -> rest-node lore scenes. */
  lore: Map<string, string[]>;
}
let tables: Tables | null = null;
let loading: Promise<void> | null = null;

const fnv = (text: string): number => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
};

const push = <K>(map: Map<K, string[]>, key: K, line: string) => {
  const list = map.get(key) ?? [];
  list.push(line);
  map.set(key, list);
};

export function ensureNarration(): Promise<void> {
  loading ??= Promise.all([loadOverhaulLines('contextual_reactions'), loadOverhaulLines('species_signature_moments')]).then(([r, s]) => {
    const reactions = new Map<string, string[]>();
    for (const e of r.entries) {
      // The pack's personality and type lines call a won battle "victory".
      const when = e.context === 'victory' ? 'battle_win' : e.context;
      if (e.source === 'personality-context' && e.personality) push(reactions, `${e.personality}|${when}`, e.text);
      else if (e.source === 'type-context' && e.type) push(reactions, `${e.type.toLowerCase()}|${when}`, e.text);
    }
    const lore = new Map<string, string[]>();
    for (const e of s.entries) if (e.kind === 'lore' && /^(night )?rest node|^sun rest node/.test(e.trigger)) push(lore, e.speciesId, e.scene);
    tables = { reactions, lore };
  });
  return loading;
}

/** Test hook. */
export function resetNarration(): void {
  tables = null;
  loading = null;
}

/** One line about the party for this moment, or null (not loaded, or nothing fits). `typesOf` gives a species' types. */
export function partyNarration(party: readonly Mon[], when: NarrationContext, key: string, nameOf: (m: Mon) => string, typesOf: (m: Mon) => readonly string[]): string | null {
  if (!tables) return null;
  const picks: { mon: Mon; line: string; lore: boolean }[] = [];
  for (const mon of party) {
    for (const l of tables.reactions.get(`${personalityOfMon(mon).id}|${when}`) ?? []) picks.push({ mon, line: l, lore: false });
    for (const t of typesOf(mon)) for (const l of tables.reactions.get(`${t.toLowerCase()}|${when}`) ?? []) picks.push({ mon, line: l, lore: false });
    if (when === 'rest_node') for (const l of tables.lore.get(mon.speciesId) ?? []) picks.push({ mon, line: l, lore: true });
  }
  if (!picks.length) return null;
  const p = picks[fnv(`${key}:${when}:narr`) % picks.length]!;
  return p.lore ? `${nameOf(p.mon)}: ${p.line}` : p.line.replaceAll('{Name}', nameOf(p.mon));
}
