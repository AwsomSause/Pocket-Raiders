// Helpers for the Delves (STORY_FAMILIES_14.md). Not built on its own (the name starts with "_").
// A Delve is a pseudo-stage drawn from its rooms' own links (src/data/catalogOverhaul/pseudo/places.json): the gate opens room a, each room opens the next.
import { ch, ev, out, room, type Json } from '../dsl.ts';

export const leaveP: Json = { kind: 'leavePseudo' };
export const moment = (text: string, importance = 45): Json => ({ kind: 'moment', text, importance });
/** A run flag that is still unset. */
export const no = (key: string): Json => ({ kind: 'flag', key, atLeast: 0, atMost: 0 });
/**
 * "(a node)" as a cost: the shared `takeNode` effect (STANDARDS.md; built by the new-events thread in src/core/co/).
 * Until that lands on this branch the cost is carried as a marker flag, so the files build; tests/unit/coPlaces.test.ts fails while any marker is left.
 */
const TAKE_NODE_READY = false;
export const takeNode = (nodes = 1): Json => (TAKE_NODE_READY ? { kind: 'takeNode', ...(nodes > 1 ? { nodes } : {}) } : { kind: 'flag', key: 'co-take-node-pending', amount: nodes });
/** Kindness +1 (STANDARDS.md): Good/Evil +1 and the run's kindness total. */
export const kind = (n = 1): Json[] => [{ kind: 'attribute', key: 'goodEvil', amount: n }, { kind: 'flag', key: 'kind-total', amount: n }];
/** Reputation +n / -n (STANDARDS.md): run flags `rep` and `rep-lost`. */
export const rep = (n: number): Json => (n >= 0 ? { kind: 'flag', key: 'rep', amount: n } : { kind: 'flag', key: 'rep-lost', amount: -n });
export const mtype = (type: string): Json => ({ kind: 'partyMoveType', type });
export const species = (id: string): Json => ({ kind: 'partySpecies', species: id });
export const variant = (id: string, when: Json[], o: { intro?: string; notice?: string; hide?: number[]; add?: Json[] } = {}): Json => ({ id, when, ...(o.intro ? { intro: o.intro } : {}), ...(o.notice ? { notice: o.notice } : {}), ...(o.hide ? { hide: o.hide } : {}), ...(o.add ? { addChoices: o.add } : {}) });

export interface Next {
  /** An outcome that walks on to the next room (in the exit room: walks out). */
  to: (text: string, ...fx: Json[]) => Json;
  /** An outcome that stays in this room (the room opens again, so a second thing can be done here). */
  stay: (text: string, ...fx: Json[]) => Json;
  /** A wild fight; winning walks on. A loss puts the player back on the road (pseudo-stage rule). */
  wild: (text: string, o: { species: string[]; lv?: number; chain?: number; format?: 'doubles' | 'triples'; win?: Json[] }, ...fx: Json[]) => Json;
  /** A trainer fight with a fixed team; winning walks on. */
  trainer: (text: string, name: string, o: { team: string[]; lv?: number; cls?: string; win?: Json[] }, ...fx: Json[]) => Json;
  /** "Turn back": every room that is not the exit offers it; nothing already taken is lost. */
  back: Json;
  /** A flag key of this Delve: `delve-<slug>-<name>`. */
  f: (name: string) => string;
}

export interface DelveDef { slug: string; name: string; rooms: string; types: string[]; tint: string; minStage: number; /** The Pokémon drawn in a room, by letter. */ mons?: Record<string, string>; gate: { intro: string; enter: string; enterText: string; pass: string; passText: string } }

/** One Delve: returns its gate event and a room builder. `rooms` is the letters in order ("abcde"). */
export function delve(d: DelveDef): { gate: Json; room: (letter: string, intro: string, mk: (n: Next) => Json[], remembers?: (n: Next) => Json[]) => Json; f: (name: string) => string } {
  const id = (letter: string) => `dg-${d.slug}-${letter}`;
  const f = (name: string) => `delve-${d.slug}-${name}`;
  const gate = ev(`delve-gate-${d.slug}`, d.name, 'Dungeons', { stop: 'delve', rarity: 'rare', types: d.types, minStage: d.minStage, requires: [no(f('done'))], tint: d.tint }, d.gate.intro, [
    ch(d.gate.enter, out(d.gate.enterText, room(id('a')))),
    ch(d.gate.pass, out(d.gate.passText)),
  ]);
  (gate as { tags?: string[] }).tags = ['Dungeon', 'Exploration'];
  const build = (letter: string, intro: string, mk: (n: Next) => Json[], remembers?: (n: Next) => Json[]): Json => {
    const at = d.rooms.indexOf(letter);
    if (at < 0) throw new Error(`${d.slug}: no room ${letter}`);
    const next = d.rooms[at + 1];
    const onward: Json[] = next ? [room(id(next))] : [];
    const n: Next = {
      to: (text, ...fx) => out(text, ...fx, ...onward),
      stay: (text, ...fx) => out(text, ...fx, room(id(letter))),
      wild: (text, o, ...fx) => ({ text, effects: fx, battle: { kind: 'wild', pseudo: true, species: o.species, types: [], levelBonus: o.lv ?? 0, shinyMultiplier: 1, ...(o.chain ? { chain: o.chain } : {}), ...(o.format ? { format: o.format } : {}), win: [...(o.win ?? []), ...onward] } }),
      trainer: (text, name, o, ...fx) => ({ text, effects: fx, battle: { kind: 'trainer', pseudo: true, name, team: o.team, size: o.team.length, types: [], levelBonus: o.lv ?? 0, ...(o.cls ? { classId: o.cls } : {}), win: [...(o.win ?? []), ...onward] } }),
      back: ch('Turn back toward the daylight.', out(`You keep everything you carry and walk back out. ${d.name} will wait.`, leaveP)),
      f,
    };
    const rem = remembers ? remembers(n) : [];
    return { id: id(letter), scene: { cast: [], ...(d.mons?.[letter] ? { pokemon: d.mons[letter] } : {}), effect: 'none', tint: d.tint }, intro, choices: mk(n), ...(rem.length > 0 ? { remembers: rem } : {}) };
  };
  return { gate, room: build, f };
}
