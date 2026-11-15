// Shared kit for the `people` category (mentors, past Champions and Leaders, the Road Roster).
// Files starting with "_" are not built. Guide: docs/catalog-overhaul.md and docs/status/co-people.md.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { flagAgo, flagAt, trainer, wild, type Json } from '../dsl.ts';

export const CATEGORY = 'people';
const OLD = JSON.parse(readFileSync(join(import.meta.dirname, '../../../src/data/catalogOverhaul/oldPlacement.json'), 'utf8')) as Record<string, Json>;
export const oldOf = (id: string): Json => OLD[id] ?? {};

/** The flag was never set. */
export const not = (key: string): Json => ({ kind: 'flag', key, atLeast: 0, atMost: 0 });
/** The flag is set (at least `n`). */
export const is = (key: string, n = 1): Json => ({ kind: 'flag', key, atLeast: n, atMost: 99 });

/** A friendly trainer fight: a loss never ends the run (the party gets back up, `lose` applies). Every fight in this category is one. */
export const spar = (name: string, o: Parameters<typeof trainer>[1] = {}): Json => trainer(name, { friendly: true, ...o });
/** A friendly wild fight. */
export const wildSpar = (o: Parameters<typeof wild>[0] & { lose?: Json[] } = {}): Json => {
  const { lose, ...rest } = o;
  return { ...wild(rest), friendly: true, ...(lose ? { lose } : {}) };
};

/** Pack words (STANDARDS.md): "+1 Bond" for one Pokémon is friendship +5; "+1 Bond all" is +3 each. */
export const bond = (n = 1, who: 'lead' | 'party' | 'picked' = 'lead'): Json => ({ kind: 'friendship', amount: (who === 'party' ? 3 : 5) * n, who });
/** "Reputation +1" (a run flag until the lead's per-region reputation lands). */
export const rep = (n = 1): Json => ({ kind: 'flag', key: 'rep', amount: n });
/** A line for the run's story so far (shown in the journal and the end-of-run recap). */
export const moment = (text: string, importance = 60): Json => ({ kind: 'moment', text, importance });

export interface Scene {
  /** The scene's title from the doc ("Top Percentage"). */
  title: string;
  intro: string;
  choices: Json[];
  remembers?: Json[];
  /** Extra conditions on top of the arc's own. */
  requires?: Json[];
  /** A different backdrop or cast than the trainer's usual one. */
  scene?: Json;
  minStage?: number;
}

/**
 * A Road Roster trainer (ROAD_ROSTER.md): three meetings, each at least one region after the one before, at the trainer's hours.
 * Flags are `roster-<key>-<name>`; `m1`, `m2` and `done` drive the arc and must be set by every outcome that counts as that meeting.
 */
export function rosterKit(key: string, baseId: string, who: string) {
  const old = oldOf(baseId);
  const hours = ((old.requires as Json[] | undefined) ?? []).filter((c) => c.kind === 'period');
  const k = (name: string) => `roster-${key}-${name}`;
  const idOf = (n: 1 | 2 | 3) => (n === 1 ? baseId : `${baseId}-m${n}`);
  const base = { group: old.group ?? 'Trainers and challenges', stop: old.stop ?? 'event', types: old.types ?? [] };
  return {
    key: k,
    id: idOf,
    /** Sets `roster-<key>-<name>` (and remembers the region, so the next meeting can wait one). */
    set: (name: string, amount = 1): Json => flagAt(k(name), amount),
    is: (name: string, n = 1): Json => is(k(name), n),
    not: (name: string): Json => not(k(name)),
    /** The id of a side scene of this trainer (a node of a search, a contest, a class). */
    roomId: (name: string): string => `${baseId}-${name}`,
    /** Meeting 1, 2 or 3. */
    meet(n: 1 | 2 | 3, s: Scene): Json {
      const gate = n === 1 ? [not(k('m1'))] : n === 2 ? [flagAgo(k('m1'), 1), not(k('m2'))] : [flagAgo(k('m2'), 1), not(k('done'))];
      return {
        id: idOf(n), name: `${who}: ${s.title}`, ...base, rarity: n === 1 ? (old.rarity ?? 'common') : 'uncommon', minStage: s.minStage ?? (old.minStage as number | undefined) ?? 1,
        requires: [...hours, ...gate, ...(s.requires ?? [])], ...(n > 1 ? { callback: true } : {}),
        scene: s.scene ?? old.scene ?? { cast: [], effect: 'none' }, intro: s.intro, choices: s.choices, ...(s.remembers ? { remembers: s.remembers } : {}),
      };
    },
    /** A side scene that only opens from one of this trainer's choices (`room(R.roomId(name))`): the second node of a search, a contest round. */
    room(name: string, s: Scene): Json {
      return {
        id: `${baseId}-${name}`, name: `${who}: ${s.title}`, ...base, rarity: 'uncommon', room: true, requires: s.requires ?? [],
        scene: s.scene ?? old.scene ?? { cast: [], effect: 'none' }, intro: s.intro, choices: s.choices, ...(s.remembers ? { remembers: s.remembers } : {}),
      };
    },
  };
}

/** A story scene with a full definition (new ids, or old ids whose placement the doc changes). */
export function scene(id: string, name: string, o: { group?: string; stop?: string; rarity?: string; types?: string[]; minStage?: number; requires?: Json[]; callback?: boolean; room?: boolean; cast?: string[]; pokemon?: string; tint?: string; effect?: string; tags?: string[]; remembers?: Json[] }, intro: string, choices: Json[]): Json {
  const old = oldOf(id);
  const oldScene = (old.scene as Json | undefined) ?? {};
  const sc = { cast: o.cast ?? oldScene.cast ?? [], ...(o.pokemon ?? oldScene.pokemon ? { pokemon: o.pokemon ?? oldScene.pokemon } : {}), ...(o.tint ?? oldScene.tint ? { tint: o.tint ?? oldScene.tint } : {}), effect: o.effect ?? oldScene.effect ?? 'none' };
  return {
    id, name, group: o.group ?? old.group ?? 'Past Champions and Leaders', ...(o.stop ?? old.stop ? { stop: o.stop ?? old.stop } : {}), rarity: o.rarity ?? old.rarity ?? 'uncommon',
    ...(o.tags ? { tags: o.tags } : {}), types: o.types ?? old.types ?? [], minStage: o.minStage ?? (old.minStage as number | undefined) ?? 1, requires: o.requires ?? (old.requires as Json[] | undefined) ?? [],
    ...(o.callback ? { callback: true } : {}), ...(o.room ? { room: true } : {}), scene: sc, intro, choices, ...(o.remembers ? { remembers: o.remembers } : {}),
  };
}

/** A Remembers variant (at most 3 per event; the first whose `when` holds applies). */
export const variant = (id: string, when: Json[], o: { intro?: string; notice?: string; hide?: number[]; add?: Json[] } = {}): Json => ({
  id, when, ...(o.intro ? { intro: o.intro } : {}), ...(o.notice ? { notice: o.notice } : {}), ...(o.hide ? { hide: o.hide } : {}), ...(o.add ? { addChoices: o.add } : {}),
});
