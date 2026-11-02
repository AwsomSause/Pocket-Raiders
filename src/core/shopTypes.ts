// Shop types (shops redesign, Kice 2026-11-02; mock-ups in project files `redesign/shops/`). Kice picked six
// looks as different kinds of shop: Poké Mart (Shop Channel, mock-up 03), Boutique (Aero Carousel, 08),
// Kecleon's Bazaar (07), Supply Depot (Basket & Register, 05), PokéNet (web store, 10) and Night Market (12).
// Which kind a shop stop is comes from a hash of the run seed and the stop's place, never from gameplay RNG,
// so no roll changes (it lives in core because the shop type will decide stock and perks, Kice 2026-11-02). Night Market is the shop after dark and wherever Giovanni's Black Market runs.

import { hashSeed } from './rng';

export const SHOP_TYPE_IDS = ['mart', 'boutique', 'bazaar', 'depot', 'pokenet', 'night'] as const;
export type ShopTypeId = (typeof SHOP_TYPE_IDS)[number];

export const SHOP_TYPE_LABELS: Record<ShopTypeId, string> = {
  mart: 'Poké Mart',
  boutique: 'Aero Boutique',
  bazaar: "Kecleon's Bazaar",
  depot: 'Supply Depot',
  pokenet: 'PokéNet Shop',
  night: 'Night Market',
};

/** The types with a built screen; the rest draw as the Poké Mart until their slice lands. */
export const SHOP_TYPES_READY: readonly ShopTypeId[] = ['mart', 'boutique', 'bazaar', 'night'];

/** How often each daytime type turns up (Night Market is decided by the clock, not by weight). */
export const SHOP_TYPE_WEIGHTS: Record<Exclude<ShopTypeId, 'night'>, number> = { mart: 40, boutique: 15, bazaar: 15, depot: 15, pokenet: 15 };

export interface ShopPlace {
  seed: string;
  regionIndex: number;
  stageIndex: number;
  nodeId: string | number | null;
  /** The clock period ('morning', 'afternoon', 'evening', 'night'). */
  period: string;
  /** Giovanni's Black Market is open this run. */
  blackMarket: boolean;
}

/** The kind of shop at this place (ignores whether its screen is built yet). */
export function shopTypeAt(place: ShopPlace): ShopTypeId {
  if (place.period === 'night' || place.blackMarket) return 'night';
  const total = Object.values(SHOP_TYPE_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = hashSeed(`${place.seed}::shop-type::${place.regionIndex}::${place.stageIndex}::${place.nodeId}`).a % total;
  for (const [id, w] of Object.entries(SHOP_TYPE_WEIGHTS) as [ShopTypeId, number][]) {
    if (roll < w) return id;
    roll -= w;
  }
  return 'mart';
}

/** The screen a shop draws with: its kind when built, else the Poké Mart. A debug override wins when it is built. */
export function shopScreenType(type: ShopTypeId, override?: string): ShopTypeId {
  if (override && SHOP_TYPES_READY.includes(override as ShopTypeId)) return override as ShopTypeId;
  return SHOP_TYPES_READY.includes(type) ? type : 'mart';
}

// ---------- what each kind sells, and its perk (Kice 2026-11-02: "own stock and a perk per type") ----------

/** The minimal content and run shapes the stock rules need (no import of run.ts, which imports this). */
interface StockContent {
  items: Map<string, { category: string }>;
  catalog: Map<string, { rarity?: string }>;
  shop: readonly { item: string }[];
  balance: { shopTypes?: ShopTypeBalance };
}
type ShopTypeBalance = {
  boutique: { categories: string[]; priceFactor: number; earlyRare: number };
  bazaar: { stockSize: number; haggleBase: number; hagglePerCharisma: number; haggleMax: number; haggleDiscount: number; hagglePenalty: number };
  depot: { categories: string[]; bulkMin: number; bulkDiscount: number };
  pokenet: { priceFactor: number; early: number; dealDiscount: number };
  night: { mystery: number; mysteryPrice: Record<string, number> };
};
interface StockRun {
  seed?: string;
  shop?: { type: string; place: string; haggle?: { item: string; won: boolean } };
}
export interface StockEntry {
  item: string;
  price: number;
  minBadges: number;
}

/** The kind of shop the run is in (Poké Mart when it entered before shop kinds existed, or outside a shop). */
export function currentShopType(run: StockRun): ShopTypeId {
  return SHOP_TYPE_IDS.includes(run.shop?.type as ShopTypeId) ? (run.shop!.type as ShopTypeId) : 'mart';
}

/** A number from 0 to 1 fixed by the run, the shop's place and a key (no gameplay RNG). */
function placeHash(run: StockRun, key: string): number {
  return hashSeed(`${run.seed}::shop::${run.shop?.place ?? ''}::${key}`).a / 2 ** 32;
}

/**
 * The stock for this kind of shop. `open` is what a Poké Mart sells here; `locked` is stock your badges
 * have not opened yet (nearest first). Boutique: only held, training, evolution and form goods, plus the
 * nearest locked rare ones early. Bazaar: a handful of the Mart's goods, different at every stall. Depot:
 * only balls and medicine. PokéNet: everything, plus the next locked item early. Night Market: everything,
 * plus mystery rare goods no Mart sells.
 */
export function typedStock<E extends StockEntry>(content: StockContent, run: StockRun, open: E[], locked: E[]): (E | StockEntry)[] {
  const b = content.balance.shopTypes;
  const type = currentShopType(run);
  if (!b || type === 'mart') return open;
  const category = (e: StockEntry) => content.items.get(e.item)?.category ?? '';
  const rare = (e: StockEntry) => ['rare', 'epic'].includes(content.catalog.get(e.item)?.rarity ?? '');
  switch (type) {
    case 'boutique': {
      const fits = (e: StockEntry) => b.boutique.categories.includes(category(e));
      return [...open.filter(fits), ...locked.filter((e) => fits(e) && rare(e)).slice(0, b.boutique.earlyRare)];
    }
    case 'bazaar': {
      const keep = new Set([...open].sort((x, y) => placeHash(run, x.item) - placeHash(run, y.item)).slice(0, b.bazaar.stockSize));
      return open.filter((e) => keep.has(e));
    }
    case 'depot':
      return open.filter((e) => b.depot.categories.includes(category(e)));
    case 'pokenet':
      return [...open, ...locked.slice(0, b.pokenet.early)];
    case 'night': {
      const listed = new Set(content.shop.map((e) => e.item));
      const pool = [...content.items.entries()]
        .filter(([id, it]) => !listed.has(id) && !open.some((e) => e.item === id) && !['key', 'transformation', 'attribute'].includes(it.category) && b.night.mysteryPrice[content.catalog.get(id)?.rarity ?? ''] !== undefined)
        .map(([id]) => id)
        .sort((x, y) => placeHash(run, `mystery:${x}`) - placeHash(run, `mystery:${y}`))
        .slice(0, b.night.mystery);
      return [...open, ...pool.map((item) => ({ item, price: b.night.mysteryPrice[content.catalog.get(item)!.rarity!]!, minBadges: 0 }))];
    }
  }
}

/** PokéNet's deal of the visit: one of its goods at a discount (not the shop-wide sale item). */
export function pokenetDeal(content: StockContent, run: StockRun, stock: readonly StockEntry[], saleItem: string | null): string | null {
  if (currentShopType(run) !== 'pokenet' || !content.balance.shopTypes) return null;
  const pool = stock.filter((e) => e.item !== saleItem);
  if (pool.length === 0) return null;
  return [...pool].sort((x, y) => placeHash(run, `deal:${x.item}`) - placeHash(run, `deal:${y.item}`))[0]!.item;
}

/** This kind's price factor for one entry: Boutique and PokéNet charge a little more, PokéNet's deal and a won haggle less, a lost haggle more. */
export function typePriceFactor(content: StockContent, run: StockRun, item: string, deal: string | null): number {
  const b = content.balance.shopTypes;
  if (!b) return 1;
  const type = currentShopType(run);
  if (type === 'boutique') return b.boutique.priceFactor;
  if (type === 'pokenet') return b.pokenet.priceFactor * (deal === item ? 1 - b.pokenet.dealDiscount : 1);
  if (type === 'bazaar' && run.shop?.haggle?.item === item) return run.shop.haggle.won ? 1 - b.bazaar.haggleDiscount : 1 + b.bazaar.hagglePenalty;
  return 1;
}

/** Kecleon's odds that a haggle works: better with Charisma (0 to 100). */
export function haggleChance(content: StockContent, charisma: number): number {
  const b = content.balance.shopTypes?.bazaar;
  if (!b) return 0;
  return Math.min(b.haggleMax, b.haggleBase + b.hagglePerCharisma * charisma);
}

/** Whether a haggle over this item works (fixed by the run, the stall and the item, so reloading can't reroll it). */
export function haggleWins(content: StockContent, run: StockRun, item: string, charisma: number): boolean {
  return placeHash(run, `haggle:${item}`) < haggleChance(content, charisma);
}

/** Supply Depot bulk price: buying `count` of one item at once takes a share off when it is enough. */
export function bulkTotal(content: StockContent, run: StockRun, unitPrice: number, count: number): number {
  const b = content.balance.shopTypes?.depot;
  const off = b && currentShopType(run) === 'depot' && count >= b.bulkMin ? b.bulkDiscount : 0;
  return Math.round(unitPrice * count * (1 - off));
}
