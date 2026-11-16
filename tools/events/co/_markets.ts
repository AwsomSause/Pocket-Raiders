// Shared helpers for the markets category (files starting with "_" are not built).
// Docs: STORY_FAMILIES_11, _12, _16 and TRADES.md in the Catalog Overhaul Pack.
import { $, ch, flag, flagIs, fr, good, money, out, room, type Json } from '../dsl.ts';

export const CATEGORY = 'markets';

// Honest price tiers (STORY_FAMILIES_11 "Honest prices"): one number per tier, always shown before buying.
export const COMMON = 300;
export const UNCOMMON = 1200;
export const RARE = 2500;
export const VERY_RARE = 5000;

/** The `market` effect (core/market.ts). */
export const mk = (action: string, o: Json = {}): Json => ({ kind: 'market', action, ...o });
/** "+N Bond": +5 friendship per point for the lead, +3 per point for the whole party (the convention of the earlier rebuilds). */
export const bond = (n = 1, who: 'lead' | 'party' = 'lead'): Json => fr((who === 'lead' ? 5 : 3) * n, who);
/** Kindness Ledger +N. */
export const kind = (n = 1): Json[] => [flag('kind-total', n), flag('kind-helped-stranger'), good(n)];
/** Reputation +N / −N (a run flag each way, so neither is lost at zero). */
export const rep = (n: number): Json[] => (n >= 0 ? [flag('rep', n)] : [flag('rep-lost', -n)]);
/** "(a node)" as a cost (STANDARDS.md: the `takeNode` effect, built by the new-events thread). Off until that effect is on this branch. */
export const TAKE_NODE = true;
export const aNode = (nodes = 1): Json[] => (TAKE_NODE ? [{ kind: 'takeNode', ...(nodes > 1 ? { nodes } : {}) }] : []);
/** A full mini-game opens beside the node (data/minigames.json id). */
export const game = (id: string): Json => ({ kind: 'addStop', stop: 'minigame', game: id });
/** Needs this much money. */
export const need = (n: number) => ({ requires: [money(n)] });
/** A purchase: the price leaves, then what was bought arrives. */
export const pay = (n: number): Json => $(-n);
/** A visit that counts toward being a regular, and lets the seller be met again this run. */
export const visit = (seller: string, eventId: string): Json[] => [flag(`market-${seller}-visits`), mk('comeBack', { event: eventId })];
/** After a question the stall stays open beside the node. */
export const stay = (eventId: string): Json => room(eventId);
/** An "ask" choice: the answer, and the stall stays open. */
export const ask = (label: string, text: string, eventId: string, ...effects: Json[]): Json => ch(label, out(text, ...effects, stay(eventId)));
/** The third-visit variant: the seller's own line, and the regular's perk as an added choice. */
export const regular = (seller: string, line: string, ...perk: Json[]): Json => ({
  id: `${seller}-regular`,
  when: [flagIs(`market-${seller}-visits`, 2)],
  notice: line,
  addChoices: perk,
});
/** A temporary effect for the next battles. */
export const temp = (label: string, effects: Json[], battles = 1, until: 'battle' | 'boss' | 'wild' = 'battle'): Json => ({ kind: 'tempEffect', label, effects, battles, until });
export const moment = (text: string, importance = 55): Json => ({ kind: 'moment', text, importance });
export const seen = (id: string): Json => ({ kind: 'eventSeen', id });
/** A room: an event that only opens from another event. */
export const asRoom = (e: Json): Json => ({ ...e, room: true });
