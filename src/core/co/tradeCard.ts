// Catalog Overhaul: the Honest Trade Card (TRADES.md Part 1). Every trade shows both sides before the player agrees:
// species, level, nature, all four moves, ability, quirk, history marks, why the trader lets it go, and a fair value.
// What arrives is worked out from the run's seed and the Pokémon given, never from the event's roll, so the card
// shows exactly what the trade does. Trade pools: src/data/catalogOverhaul/tradePools/<category>.json.
import { draftTradeWarning } from '../greenneedle/draft';
import { z } from 'zod';
import { NATURE_IDS } from '../natures';
import { TradeWantSchema, type Content, type EventEffect, type HonestGives, type Species, type TradeWant } from '../contentSchema';
import type { PokemonInstance, RunState } from '../state';
import { hashSeed, Rng } from '../rng';
import { bondLevel, bondLevelFriendship } from './who';
import { allQuirks } from './quirks';

type HonestTrade = Extract<EventEffect, { kind: 'honestTrade' }>;

const Tier = z.number().int().min(1).max(4);
export const TradePoolSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(1),
  /** Where it appears, in words (TRADES.md Part 2). */
  where: z.string().min(1),
  offers: z.array(z.object({ species: z.string().min(1), tier: Tier, hidden: z.boolean().default(false), moves: z.array(z.string()).max(4).default([]), /** It comes holding this (Porygon with an Up-Grade evolves as it arrives). */ held: z.string().optional() })).min(1),
  wants: TradeWantSchema,
  /** What the trader says the want is for ("My boat needs a land-legs Pokémon."). */
  wantLine: z.string().min(1),
  traders: z.array(z.object({ name: z.string().min(1), line: z.string().min(1) })).min(1),
  /** Quirk ids a drawn Pokémon may have (none: it arrives with no quirk). */
  quirks: z.array(z.string()).default([]),
});
export type TradePool = z.infer<typeof TradePoolSchema>;
export const TradePoolFileSchema = z.object({ pools: z.array(TradePoolSchema) });

const files = Object.values(import.meta.glob<unknown>('../../data/catalogOverhaul/tradePools/*.json', { eager: true, import: 'default' }));
let poolCache: Map<string, TradePool> | null = null;
/** Every trade pool (all category files). Throws on a bad file or a duplicate id. */
export function allTradePools(): Map<string, TradePool> {
  if (poolCache) return poolCache;
  const map = new Map<string, TradePool>();
  for (const raw of files) for (const p of TradePoolFileSchema.parse(raw).pools) {
    if (map.has(p.id)) throw new Error(`Duplicate trade pool ${p.id}`);
    map.set(p.id, p);
  }
  return (poolCache = map);
}

/** Items that make a Pokémon evolve when it is traded holding them (the held-item trade evolutions). */
export const TRADE_HELD_ITEMS = new Set(['metal-coat', 'kings-rock', 'up-grade', 'dubious-disc', 'dragon-scale', 'deep-sea-tooth', 'deep-sea-scale', 'protector', 'electirizer', 'magmarizer', 'reaper-cloth', 'prism-scale', 'sachet', 'whipped-dream']);

/** What a trade evolution turns this species into when traded (holding `held`), or null. */
export function tradeEvolution(content: Content, speciesId: string, held?: string): string | null {
  const evos = content.species.get(speciesId)?.evolutions ?? [];
  const hit = evos.find((e) => e.item === 'linking-cord' && !e.region) ?? (held && TRADE_HELD_ITEMS.has(held) ? evos.find((e) => e.item === held && !e.region) : undefined);
  return hit && content.species.has(hit.to) ? hit.to : null;
}

export const isRegionalForm = (sp: Species | undefined): boolean => !!sp && (sp.form?.kind === 'regional' || /-delta(?:-|$)/.test(sp.id));

/** Fair-value tier: 1 Common, 2 Uncommon, 3 Rare, 4 Very Rare (Legendary and Mythical are always 4). */
export function speciesTier(content: Content, speciesId: string): number {
  const sp = content.species.get(speciesId);
  if (!sp) return 1;
  if (sp.tags.includes('legendary') || sp.tags.includes('mythical')) return 4;
  const [common, uncommon, rare] = content.balance.co.tradeTierCatchRate;
  return sp.catchRate >= common! ? 1 : sp.catchRate >= uncommon! ? 2 : sp.catchRate >= rare! ? 3 : 4;
}

/** TRADES.md 1.2: tier + 1 per 10 levels + 1 if fully evolved + 1 for a hidden ability or a regional/Delta form. */
export function fairValue(content: Content, speciesId: string, level: number, hidden: boolean, tier = speciesTier(content, speciesId)): number {
  const sp = content.species.get(speciesId);
  return tier + Math.floor(level / 10) + ((sp?.evolutions.length ?? 0) === 0 ? 1 : 0) + (hidden || isRegionalForm(sp) ? 1 : 0);
}

/** One side of the card. */
export interface CardSide {
  species: string;
  name: string;
  level: number;
  nature: string;
  moves: string[];
  ability: string | null;
  hidden: boolean;
  quirk: { id: string; name: string; line: string } | null;
  marks: string[];
  value: number;
  /** It evolves the moment it is traded (a trade evolution), into this species. */
  evolvesTo: string | null;
  held: string | null;
  shiny: boolean;
}

/** The whole card for one of the player's Pokémon. `warn`: 'worse' (you give more than you get; the trader says so and asks once more) or 'much-better' (you get 2+ more; the trader explains why). */
export interface HonestCard {
  id: string;
  trader: string | null;
  why: string;
  wants: string;
  theirs: CardSide;
  yours: CardSide | null;
  warn: 'worse' | 'much-better' | null;
  gift: boolean;
}

/** The trader's side before the level is known: a pool draw, from the run's seed. */
interface Offer { gives: HonestGives; tier?: number; trader: string | null; wants: TradeWant | null }

function drawRng(run: RunState, id: string): Rng {
  return new Rng(hashSeed(`${run.seed}::honest-trade::${id}:${run.encountersCompleted}`));
}

/**
 * Batch 5 (old-rival-old-friend): the main rival's side of an honest trade between two raised Pokémon. The rival keeps their ace and
 * offers the newest other Pokémon they fielded against you this run, with the moves it had that day. Nature by hash (no gameplay roll).
 */
export function rivalGives(content: Content, run: RunState): HonestGives | null {
  const live = run.story.rivals.filter((r) => r.state !== 'retired');
  const rival = live.find((r) => run.expansion?.rival?.[r.id]?.role === 'main') ?? [...live].sort((a, b) => b.encounters - a.encounters || a.id.localeCompare(b.id))[0];
  const last = rival?.memory.lastBattle;
  if (!rival || !last || last.team.length < 2) return null;
  const i = last.team.length - 2;
  const species = last.team[i]!;
  if (!content.species.has(species)) return null;
  const nature = new Rng(hashSeed(`${run.seed}::rival-trade::${rival.id}::${species}`)).pick([...NATURE_IDS]);
  return {
    species, levelOffset: 0, nature, moves: (last.moves?.[i] ?? []).slice(0, 4), hidden: false, marks: [`raised by ${rival.name}`],
    why: 'Not my best. My second-best. That is the honest part.', ot: rival.name, shiny: false,
  };
}

/** What the trader offers (a fixed `gives`, or the seeded pool draw). Null when the pool is unknown. */
export function honestOffer(content: Content, run: RunState, e: HonestTrade): Offer | null {
  if (e.rival) {
    const gives = rivalGives(content, run);
    return gives ? { gives, trader: gives.ot, wants: e.wants ?? null } : null;
  }
  if (e.gives) return { gives: e.gives, trader: e.gives.ot, wants: e.wants ?? null };
  const pool = e.pool ? allTradePools().get(e.pool) : undefined;
  if (!pool) return null;
  const rng = drawRng(run, e.id);
  const weights = content.balance.co.tradeTierWeights;
  const tiers = [...new Set(pool.offers.map((o) => o.tier))];
  const tier = rng.weighted(tiers.map((t) => ({ item: t, weight: weights[t - 1] ?? 1 })));
  const offer = rng.pick(pool.offers.filter((o) => o.tier === tier));
  const trader = rng.pick(pool.traders);
  const nature = rng.pick([...NATURE_IDS]);
  const quirk = pool.quirks.length > 0 ? rng.pick(pool.quirks) : undefined;
  return {
    gives: { species: offer.species, levelOffset: 0, nature, moves: offer.moves, hidden: offer.hidden, ...(quirk ? { quirk } : {}), marks: [], why: trader.line, ot: trader.name, shiny: false, ...(offer.held ? { held: offer.held } : {}) },
    tier,
    trader: trader.name,
    wants: e.wants ?? pool.wants,
  };
}

/** The moves it arrives knowing: the named ones, filled up with the latest its species learns by that level. */
function arrivingMoves(content: Content, speciesId: string, level: number, named: string[]): string[] {
  const out = named.filter((m) => content.moves.has(m)).slice(0, 4);
  const sp = content.species.get(speciesId);
  const learned = (sp?.learnset ?? []).filter((l) => l.level <= level && content.moves.has(l.move)).map((l) => l.move);
  for (const m of [...new Set(learned)].reverse()) {
    if (out.length >= 4) break;
    if (!out.includes(m)) out.push(m);
  }
  return out;
}

function abilityName(content: Content, speciesId: string, hidden: boolean): string | null {
  const ab = content.species.get(speciesId)?.abilities;
  if (!ab) return null;
  return hidden && ab.hidden ? ab.hidden : (ab.normal[0] ?? ab.hidden ?? null);
}

function quirkLine(id: string | undefined): CardSide['quirk'] {
  const q = id ? allQuirks().get(id) : undefined;
  return q ? { id: q.id, name: q.name, line: q.line } : null;
}

/** The trader's side, at the level it would arrive for this Pokémon of yours (or the run's cap-safe level 5 with none). */
export function theirSide(content: Content, run: RunState, offer: Offer, yourLevel: number, cap: number): CardSide {
  const g = offer.gives;
  const level = Math.max(1, Math.min(cap, yourLevel + g.levelOffset));
  const sp = content.species.get(g.species);
  return {
    species: g.species,
    name: sp?.name ?? g.species,
    level,
    nature: g.nature,
    moves: arrivingMoves(content, g.species, level, g.moves),
    ability: abilityName(content, g.species, g.hidden),
    hidden: g.hidden,
    quirk: quirkLine(g.quirk),
    marks: [...g.marks],
    value: fairValue(content, g.species, level, g.hidden, offer.tier),
    evolvesTo: tradeEvolution(content, g.species, g.held),
    held: g.held ?? null,
    shiny: g.shiny,
  };
}

/** The player's side for one party Pokémon. */
export function yourSide(content: Content, mon: PokemonInstance): CardSide {
  const sp = content.species.get(mon.speciesId);
  const hidden = mon.abilitySlot === -1 && !!sp?.abilities.hidden;
  const held = mon.held ? Object.keys(mon.held)[0] : undefined;
  return {
    species: mon.speciesId,
    name: sp?.name ?? mon.speciesId,
    level: mon.level,
    nature: mon.nature ?? 'hardy',
    moves: mon.moves.map((m) => m.id),
    ability: abilityName(content, mon.speciesId, hidden),
    hidden,
    quirk: quirkLine(mon.quirk),
    // Greenneedle gn.48: a drafted Pokémon that stayed goes back to its first trainer if traded; the card says so in advance.
    marks: [...(mon.marks ?? []), ...(draftTradeWarning(mon) ? [draftTradeWarning(mon)!] : [])],
    value: fairValue(content, mon.speciesId, mon.level, hidden),
    evolvesTo: null,
    held: held ?? null,
    shiny: mon.shiny,
  };
}

/** Does this party Pokémon fit a trader's want? (A Pokémon that bites strangers can't be traded again until Bond 4.) */
export function fitsWant(content: Content, mon: PokemonInstance, want: TradeWant): boolean {
  const sp = content.species.get(mon.speciesId);
  if (!sp) return false;
  if (mon.quirk === 'bites-strangers' && bondLevel(content, mon) < 4) return false;
  if (want.types && !sp.types.some((t) => want.types!.includes(t))) return false;
  if (want.notTypes && sp.types.some((t) => want.notTypes!.includes(t))) return false;
  if (want.natures && !want.natures.includes(mon.nature ?? 'hardy')) return false;
  if (want.bond !== undefined && bondLevel(content, mon) < want.bond) return false;
  if (want.moveFlag && !mon.moves.some((mv) => content.moves.get(mv.id)?.flags.includes(want.moveFlag!))) return false;
  if (want.shiny !== undefined && mon.shiny !== want.shiny) return false;
  if (want.minTier !== undefined && speciesTier(content, mon.speciesId) < want.minTier) return false;
  if (want.regional !== undefined && isRegionalForm(sp) !== want.regional) return false;
  return true;
}

export function warnOf(theirs: CardSide, yours: CardSide | null, muchBetter: number): HonestCard['warn'] {
  if (!yours) return null;
  if (yours.value > theirs.value) return 'worse';
  if (theirs.value - yours.value >= muchBetter) return 'much-better';
  return null;
}

/** The card for one of your Pokémon (null `mon`: a gift, or the card before a Pokémon is picked). */
export function honestCardFor(content: Content, run: RunState, e: HonestTrade, mon: PokemonInstance | null, cap: number): HonestCard | null {
  const offer = honestOffer(content, run, e);
  if (!offer) return null;
  const yours = mon ? yourSide(content, mon) : null;
  const level = mon?.level ?? Math.max(1, ...run.party.map((m) => m.level));
  const theirs = theirSide(content, run, offer, level, cap);
  return { id: e.id, trader: offer.trader, why: offer.gives.why, wants: e.gift ? 'Nothing: a gift' : (offer.wants?.label ?? 'Any Pokémon'), theirs, yours, warn: e.gift ? null : warnOf(theirs, yours, content.balance.co.tradeMuchBetter), gift: e.gift };
}

/** The want an honest trade uses (its own, else its pool's; a gift wants nothing). */
export function honestWant(content: Content, run: RunState, e: HonestTrade): TradeWant | null {
  if (e.gift) return null;
  return honestOffer(content, run, e)?.wants ?? { label: 'any Pokémon', species: [] };
}

/** Builds the arriving Pokémon on a fresh instance made by the caller (`fresh`, already at the right level and species). */
export function shapeArrival(content: Content, side: CardSide, fresh: PokemonInstance, gives: HonestGives, askedFirst: boolean): void {
  fresh.nature = gives.nature;
  fresh.abilitySlot = side.hidden ? -1 : 0;
  fresh.moves = side.moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  fresh.shiny = gives.shiny;
  if (gives.quirk) fresh.quirk = gives.quirk;
  fresh.marks = [...gives.marks, 'traded'].slice(0, 8);
  fresh.ot = gives.ot;
  fresh.friendship = bondLevelFriendship(content, askedFirst ? 3 : 2);
  if (gives.held) fresh.held = { [gives.held]: 1 };
}
