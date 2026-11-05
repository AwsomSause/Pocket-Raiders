// Offline social features kept on the profile (ideas S214, S215, S217): the Achievements Showcase, the weekly Photo
// Contest and the Trade Board. There is no server: a trade is two short codes passed between friends by hand, and the
// claim ledger makes each code work once. Pure: no RNG stream is used (ids come from the clock and a counter).

import { hashSeed } from './rng';
import { legacyOf, withLegacy } from './legacy';
import type { PastPokemon, Profile } from './state';

// ---------- Achievements Showcase ----------

export const SHOWCASE_SLOTS = 3;

/** The earned achievements on show, in the order they were picked, dropping any that are no longer earned. */
export const showcaseOf = (p: Pick<Profile, 'legacy' | 'achievements'>): string[] => legacyOf(p).showcase.filter((id) => !!p.achievements[id]);

/** Adds an earned achievement to the showcase, or removes it if already there. Null with a reason when it cannot. */
export function toggleShowcase(p: Profile, id: string): { profile: Profile } | { problem: string } {
  const on = legacyOf(p).showcase.includes(id);
  if (!on && !p.achievements[id]) return { problem: 'You have not earned that yet.' };
  if (!on && legacyOf(p).showcase.length >= SHOWCASE_SLOTS) return { problem: `Only ${SHOWCASE_SLOTS} can be shown. Remove one first.` };
  return { profile: withLegacy(p, (l) => { l.showcase = on ? l.showcase.filter((x) => x !== id) : [...l.showcase, id]; }) };
}

// ---------- Photo Contest ----------

export const PHOTO_THEMES = ['Your whole team', 'A shiny', 'Your lead on the map', 'A Pokémon at low HP', 'A big critical hit', 'A rival meeting', 'A Water-type', 'A Dragon-type', 'Your favourite Hub spot', 'A sunset on the map', 'A surprise event', 'A legendary'] as const;

/** ISO week id like "2026-W45" (weeks start Monday). */
export function weekId(isoDate: string): string {
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const first = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((d.getTime() - first.getTime()) / 86400000 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** The week's theme: the same for everyone, from the week id alone. */
export const weekTheme = (isoDate: string): string => PHOTO_THEMES[hashSeed(`photo::${weekId(isoDate)}`).a % PHOTO_THEMES.length]!;

/** Logs (or replaces) this week's entry: a short note and your own 1 to 5 star rating of the shot. */
export function logPhoto(p: Profile, isoDate: string, note: string, stars: number): Profile {
  const week = weekId(isoDate);
  const entry = { week, theme: weekTheme(isoDate), note: note.trim().slice(0, 80), stars: Math.min(5, Math.max(1, Math.trunc(stars) || 1)), at: isoDate };
  return withLegacy(p, (l) => { l.photos = [...l.photos.filter((x) => x.week !== week), entry].sort((a, b) => b.week.localeCompare(a.week)).slice(0, 60); });
}

// ---------- Trade Board ----------

const b64 = (s: string): string => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s: string): string => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

type Board = ReturnType<typeof legacyOf>['tradeBoard'][number];
type Mon = Board['mon'];
const toMon = (m: PastPokemon): Mon => ({ speciesId: m.speciesId, level: m.level, shiny: m.shiny, abilitySlot: m.abilitySlot, moves: m.moves.slice(0, 4) });
const fromMon = (m: Mon, id: string): PastPokemon => ({ ...m, runId: `trade:${id}`, hallOfFame: false });
const validMon = (m: unknown): m is Mon => !!m && typeof m === 'object' && typeof (m as Mon).speciesId === 'string' && Number.isInteger((m as Mon).level) && (m as Mon).level >= 1 && (m as Mon).level <= 1000 && Array.isArray((m as Mon).moves) && (m as Mon).moves.length >= 1 && (m as Mon).moves.length <= 4 && (m as Mon).moves.every((x) => typeof x === 'string') && Number.isInteger((m as Mon).abilitySlot);

export const TRADE_BOARD_SLOTS = 10;
export type TradeResult<T = object> = ({ ok: true; profile: Profile } & T) | { ok: false; reason: string };

/** Puts a kept Pokémon on the board and gives the offer code to send a friend. It leaves your kept list until it is traded or cancelled. */
export function postOffer(p: Profile, index: number, want: string | null, from: string, now: string): TradeResult<{ code: string }> {
  const mon = p.pastPokemon[index];
  if (!mon) return { ok: false, reason: 'Pick one of your kept Pokémon.' };
  if (legacyOf(p).tradeBoard.length >= TRADE_BOARD_SLOTS) return { ok: false, reason: 'The board is full. Cancel an offer first.' };
  const id = hashSeed(`trade::${now}::${mon.runId}::${mon.speciesId}::${legacyOf(p).tradeBoard.length}`).a.toString(36);
  const entry: Board = { id, want: want || null, at: now, mon: toMon(mon) };
  const profile = withLegacy(p, (l) => { l.tradeBoard = [...l.tradeBoard, entry]; });
  profile.pastPokemon = profile.pastPokemon.filter((_, i) => i !== index);
  return { ok: true, profile, code: `TB1.${b64(JSON.stringify({ id, from: from.slice(0, 24), want: entry.want, mon: entry.mon }))}` };
}

/** Takes back an unfilled offer. */
export function cancelOffer(p: Profile, id: string): TradeResult {
  const e = legacyOf(p).tradeBoard.find((x) => x.id === id);
  if (!e) return { ok: false, reason: 'That offer is not on your board.' };
  const profile = withLegacy(p, (l) => { l.tradeBoard = l.tradeBoard.filter((x) => x.id !== id); });
  profile.pastPokemon = [fromMon(e.mon, `back-${id}`), ...profile.pastPokemon];
  return { ok: true, profile };
}

export interface OfferView { id: string; from: string; want: string | null; mon: Mon }
export function readOffer(code: string): { ok: true; offer: OfferView } | { ok: false; reason: string } {
  const bits = code.trim().split('.');
  if (bits[0] !== 'TB1' || bits.length !== 2) return { ok: false, reason: 'This is not a trade offer code.' };
  try {
    const o = JSON.parse(unb64(bits[1]!)) as OfferView;
    if (typeof o.id !== 'string' || !/^[0-9a-z]{1,10}$/.test(o.id) || typeof o.from !== 'string' || !validMon(o.mon) || (o.want !== null && typeof o.want !== 'string')) return { ok: false, reason: 'The offer is damaged.' };
    return { ok: true, offer: { id: o.id, from: o.from.slice(0, 24), want: o.want, mon: o.mon } };
  } catch {
    return { ok: false, reason: 'The offer is damaged.' };
  }
}

/** Accepts a friend's offer: you give the wanted Pokémon (if they asked for one) and receive theirs. Returns the reply code to send back. Works once per offer. */
export function acceptOffer(p: Profile, code: string, giveIndex: number | null, now: string): TradeResult<{ reply: string }> {
  const read = readOffer(code);
  if (!read.ok) return read;
  const { offer } = read;
  if (legacyOf(p).tradeBoard.some((e) => e.id === offer.id)) return { ok: false, reason: 'That is your own offer.' };
  if (p.claims[`trade:in:${offer.id}`]) return { ok: false, reason: 'You already took this offer.' };
  const give = giveIndex === null ? null : p.pastPokemon[giveIndex];
  if (offer.want && (!give || give.speciesId !== offer.want)) return { ok: false, reason: `They want a ${offer.want}. Pick one from your kept Pokémon.` };
  const profile = structuredClone(p);
  if (give) profile.pastPokemon = profile.pastPokemon.filter((_, i) => i !== giveIndex);
  profile.pastPokemon = [fromMon(offer.mon, offer.id), ...profile.pastPokemon];
  profile.claims[`trade:in:${offer.id}`] = { at: now };
  return { ok: true, profile, reply: `TR1.${b64(JSON.stringify({ id: offer.id, mon: give ? toMon(give) : null }))}` };
}

/** Redeems a friend's reply to your offer: their Pokémon (if any) arrives and the offer closes. Works once. */
export function redeemReply(p: Profile, code: string, now: string): TradeResult {
  const bits = code.trim().split('.');
  if (bits[0] !== 'TR1' || bits.length !== 2) return { ok: false, reason: 'This is not a trade reply code.' };
  let r: { id?: unknown; mon?: unknown };
  try {
    r = JSON.parse(unb64(bits[1]!));
  } catch {
    return { ok: false, reason: 'The reply is damaged.' };
  }
  if (typeof r.id !== 'string' || (r.mon !== null && !validMon(r.mon))) return { ok: false, reason: 'The reply is damaged.' };
  if (p.claims[`trade:out:${r.id}`]) return { ok: false, reason: 'You already used this reply.' };
  if (!legacyOf(p).tradeBoard.some((e) => e.id === r.id)) return { ok: false, reason: 'No open offer of yours matches this reply.' };
  const profile = withLegacy(p, (l) => { l.tradeBoard = l.tradeBoard.filter((e) => e.id !== r.id); });
  if (r.mon) profile.pastPokemon = [fromMon(r.mon as Mon, r.id as string), ...profile.pastPokemon];
  profile.claims[`trade:out:${r.id}`] = { at: now };
  return { ok: true, profile };
}
