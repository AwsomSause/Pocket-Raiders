// Shared helpers for the families-a modules (STORY_FAMILIES 1, 2, 3, 4, 7). Files starting with "_" are not built.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { $, ch, flag, item, out, trainer, type Json } from '../dsl.ts';

const OLD = JSON.parse(readFileSync(join(import.meta.dirname, '../../../src/data/catalogOverhaul/oldPlacement.json'), 'utf8')) as Record<string, Json>;

// ---------- conditions ----------
/** The flag was never set. */
export const not = (key: string): Json => ({ kind: 'flag', key, atLeast: 0, atMost: 0 });
/** The flag is set (at least `atLeast`). */
export const is = (key: string, atLeast = 1): Json => ({ kind: 'flag', key, atLeast, atMost: 99 });
/** The flag (set with `flagAt`) is at least this many regions old (people's `regionsAgo`), or (any flag) this many stages old (anime's `flagAge`). */
export const later = (key: string, o: { stages?: number; regions?: number }): Json => (o.regions ? { kind: 'flag', key, atLeast: 1, atMost: 99, regionsAgo: o.regions } : { kind: 'flagAge', key, atLeast: o.stages ?? 1, atMost: 99 });
/** The featured rival trusts you at least this much. */
export const trusts = (n: number): Json => ({ kind: 'rivalState', feeling: { key: 'trust', atLeast: n } });
export const knows = (move: string): Json => ({ kind: 'partyMove', move });
export const hasType = (type: string): Json => ({ kind: 'partyType', type });
export const crisisAt = (atLeast: number, atMost = 5): Json => ({ kind: 'crisis', atLeast, atMost });

// ---------- effects ----------
export const trust = (n: number): Json => ({ kind: 'rivalChange', feelings: { trust: n } });
export const feel = (feelings: Record<string, number>): Json => ({ kind: 'rivalChange', feelings });
export const crisis = (amount: number): Json => ({ kind: 'crisis', amount });
export const aid = (amount: number): Json => ({ kind: 'aid', amount });
export const moment = (text: string, importance = 60): Json => ({ kind: 'moment', text, importance });
/** A passing effect on the next battles (at most 5). */
export const temp = (label: string, effects: Json[], battles = 3): Json => ({ kind: 'tempEffect', label, effects, battles, until: 'battle' });
/** An effect that lasts until the run moves to the next region ("for the region"). */
export const region = (label: string, ...effects: Json[]): Json => ({ kind: 'tempEffect', label, effects, until: 'region' });
/** A kind act / a sly act: the Good and Evil meter is the Apprentice's Record (SF2), and the pack's flags are set for other families. */
export const kind = (n = 1): Json[] => [{ kind: 'attribute', key: 'goodEvil', amount: n }, flag('kind-total', n), flag('kind-helped-stranger')];
export const sly = (n = 1): Json[] => [{ kind: 'attribute', key: 'goodEvil', amount: -n }];

// ---------- battles ----------
/** A story fight (people's `friendly`): a loss never ends the run, the party is back on its feet at the same node, and `lose` applies. */
export const safe = (battle: Json, ...lose: Json[]): Json => ({ ...battle, friendly: true, lose });
/** A Grunt of the run's Evil Team (male only, Kice). */
export const grunt = (name: string, o: { size?: number; lv?: number; win?: Json[]; format?: 'doubles'; chain?: number } = {}): Json => ({ ...trainer(name, { size: o.size ?? 2, lv: o.lv ?? 0, win: o.win ?? [], ...(o.format ? { format: o.format } : {}), ...(o.chain ? { chain: o.chain } : {}) }), evil: 'grunt' });
/** A fight against the disaster itself (panicked wild Pokémon, drawn as one of them); `waves` fights in a row with no rest. */
export const disaster = (name: string, sprite: string, types: string[], o: { waves?: number; size?: number; lv?: number; win?: Json[]; lose?: Json[]; format?: 'doubles' } = {}): Json =>
  safe({ ...trainer(name, { cls: 'ace-trainer', size: o.size ?? 3, types, lv: o.lv ?? 0, win: o.win ?? [], ...(o.waves && o.waves > 1 ? { chain: o.waves } : {}), ...(o.format ? { format: o.format } : {}) }), spritePokemon: sprite }, ...(o.lose ?? []));

// ---------- events ----------
/** A follow-up scene of a catalog event: a room opened by `room(id)`, or (with `callback: true`) a stop on a later stage. Group and scene come from the parent. */
export function sub(parent: string, id: string, name: string, intro: string, choices: Json[], o: Json = {}): Json {
  const p = OLD[parent];
  if (!p) throw new Error(`sub: ${parent} is not an old event`);
  return { id, name, group: p.group, stop: p.stop ?? 'event', rarity: p.rarity ?? 'common', types: p.types ?? [], scene: p.scene ?? { cast: [], effect: 'none' }, room: o.callback !== true, requires: [], intro, choices, ...o };
}
/** A remembers variant. */
export const v = (id: string, when: Json[], o: { intro?: string; notice?: string; hide?: number[]; add?: Json[] }): Json => ({ id, when, ...(o.intro ? { intro: o.intro } : {}), ...(o.notice ? { notice: o.notice } : {}), ...(o.hide ? { hide: o.hide } : {}), ...(o.add ? { addChoices: o.add } : {}) });
/** A fair-price purchase that reopens the stall (`back`), counting what was spent in hundreds under `spent`. */
export const buy = (label: string, price: number, id: string, text: string, back: string, spent?: string, count = 1): Json =>
  ch(`${label} (₽${price})`, out(text, $(-price), item(id, count), ...(spent ? [flag(spent, Math.round(price / 100))] : []), { kind: 'addEvent', eventId: back }), { requires: [{ kind: 'money', atLeast: price }] });
