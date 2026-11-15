// Shared helpers for the families-b modules (STORY_FAMILIES_6). Files starting with "_" are not built.
import { wild, type Json } from '../dsl.ts';

/** The flag was never set this run. */
export const no = (key: string): Json => ({ kind: 'flag', key, atLeast: 0, atMost: 0 });
/** A scene that only opens from another scene (never drawn on its own). Clears what the old event of the same id needed. */
export const ROOM = { requires: [] as Json[], callback: false, room: true };
/** A wild fight inside a door (pseudo stage): a loss walks you out, the run goes on. */
export const pw = (o: Parameters<typeof wild>[0]): Json => ({ ...wild(o), pseudo: true });
/** A Remembers variant: the first whose `when` holds applies. */
export const rem = (id: string, when: Json[], o: { intro?: string; notice?: string; hide?: number[]; add?: Json[] }): Json => ({
  id, when, ...(o.intro ? { intro: o.intro } : {}), ...(o.notice ? { notice: o.notice } : {}), hide: o.hide ?? [], addChoices: o.add ?? [],
});
/** Walk back out of a door (a no-op outside one). */
export const exit: Json = { kind: 'leavePseudo' };
/** A short-lived boost (ArchetypeModifier effects). */
export const temp = (label: string, effects: Json[], battles = 1, until: 'battle' | 'boss' | 'wild' = 'battle'): Json => ({ kind: 'tempEffect', label, effects, battles, until });
/** A line for the run's journal. */
export const moment = (text: string, importance = 60): Json => ({ kind: 'moment', text, importance });
export const mentorIs = (id: string): Json => ({ kind: 'mentor', id });
export const seen = (id: string): Json => ({ kind: 'eventSeen', id });
export const teach = (move: string, species: string): Json => ({ kind: 'teachMove', move, species });
export const foresight = (columns: number): Json => ({ kind: 'foresight', columns });
export const GEMS = ['rock-gem', 'ground-gem', 'fire-gem', 'water-gem', 'electric-gem', 'ice-gem', 'fairy-gem', 'steel-gem'];
/** The Valley-born egg (SF31): mechanically a Bramblin, a Smoliv or a Nacli, by region. */
export const VALLEY: { species: string; regions: string[] }[] = [
  { species: 'bramblin', regions: ['kanto', 'hoenn', 'unova', 'torren', 'orrery-basin'] },
  { species: 'smoliv', regions: ['johto', 'kalos', 'alola', 'paldea', 'grand', 'trial-archipelago'] },
  { species: 'nacli', regions: [] },
];
/** Adds branches to a choice built with ch(). */
export const withBr = (choice: Json, ...branches: Json[]): Json => ({ ...choice, branches });
