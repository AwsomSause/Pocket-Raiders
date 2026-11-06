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
  /** `${speciesId}|${move name lowercased}` -> the scene for finishing a boss battle with that move. */
  finishers: Map<string, string>;
  /** `${speciesId}|${move}` -> "The tenth time X uses M..." scene. */
  tenth: Map<string, string>;
  /** `${speciesId}|${move}` -> "When M misses, X..." scene. */
  misses: Map<string, string>;
  /** `${speciesId}|${ability name}` -> "The first time A triggers in a battle..." scene. */
  firstAbility: Map<string, string>;
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
    const finishers = new Map<string, string>();
    const tenth = new Map<string, string>();
    const misses = new Map<string, string>();
    const firstAbility = new Map<string, string>();
    for (const e of s.entries) {
      if (e.kind === 'move') {
        const fin = /^When (.+) finishes a boss battle/.exec(e.scene)?.[1];
        const ten = /^The tenth time \S+ uses (.+?),/.exec(e.scene)?.[1];
        const mis = /^When (.+) misses,/.exec(e.scene)?.[1];
        if (fin) finishers.set(`${e.speciesId}|${fin.toLowerCase()}`, e.scene);
        else if (ten) tenth.set(`${e.speciesId}|${ten.toLowerCase()}`, e.scene);
        else if (mis) misses.set(`${e.speciesId}|${mis.toLowerCase()}`, e.scene);
      } else if (e.kind === 'ability') {
        const ab = /^The first time (.+?) triggers in a battle/.exec(e.scene)?.[1];
        if (ab) firstAbility.set(`${e.speciesId}|${ab.toLowerCase()}`, e.scene);
      }
    }
    tables = { reactions, lore, finishers, tenth, misses, firstAbility };
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

/** The species scene for ending a boss battle with this move ("Frenzy Plant finishes a boss battle..."), or null. */
export function finisherScene(speciesId: string, moveName: string): string | null {
  return tables?.finishers.get(`${speciesId}|${moveName.toLowerCase()}`) ?? null;
}

interface SceneEvent {
  type: string;
  side?: string;
  moveId?: string | null;
  ability?: string;
}

/**
 * Species scenes that need a count: the tenth use of a move, a move's first miss, an ability's first trigger. Counts live
 * in the run's free-form counters (`pack.*`, so no save shape changes), count your active Pokémon only, and each scene
 * fires once. Returns at most one line (the first that fits). `nameOf` turns a move or ability id into its display name.
 */
export function countedScene(counters: Record<string, number>, mon: Pick<PokemonInstance, 'uid' | 'speciesId'> | undefined, events: readonly SceneEvent[], nameOf: (kind: 'move' | 'ability', id: string) => string): string | null {
  if (!tables || !mon) return null;
  let line: string | null = null;
  let lastMove: string | null = null;
  for (const e of events) {
    if (e.side !== 'player') continue;
    if (e.type === 'move' && e.moveId) {
      lastMove = e.moveId;
      const key = `pack.use.${mon.uid}.${e.moveId}`;
      counters[key] = (counters[key] ?? 0) + 1;
      if (counters[key] === 10) line ??= tables.tenth.get(`${mon.speciesId}|${nameOf('move', e.moveId).toLowerCase()}`) ?? null;
    } else if (e.type === 'miss' && lastMove) {
      const key = `pack.miss.${mon.uid}.${lastMove}`;
      counters[key] = (counters[key] ?? 0) + 1;
      if (counters[key] === 1) line ??= tables.misses.get(`${mon.speciesId}|${nameOf('move', lastMove).toLowerCase()}`) ?? null;
    } else if (e.type === 'ability' && e.ability) {
      const key = `pack.ability.${mon.uid}.${e.ability}`;
      counters[key] = (counters[key] ?? 0) + 1;
      if (counters[key] === 1) line ??= tables.firstAbility.get(`${mon.speciesId}|${nameOf('ability', e.ability).toLowerCase()}`) ?? null;
    }
  }
  return line;
}

/** The pack context for a wild battle's opening: a shiny, a legendary sighting, or the weather it starts in. Shiny wins, then legend, then weather. */
export function battleStartContext(enemy: { shiny: boolean; tags: readonly string[] }, weather: string | null | undefined): string | null {
  if (enemy.shiny) return 'shiny_encounter';
  if (enemy.tags.includes('legendary') || enemy.tags.includes('mythical')) return 'legend_sighting';
  if (weather === 'rain') return 'rain';
  if (weather === 'snow' || weather === 'hail') return 'snow';
  if (weather === 'sun') return 'sunny';
  return null;
}
