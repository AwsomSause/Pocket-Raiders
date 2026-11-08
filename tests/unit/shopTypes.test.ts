import { describe, expect, it } from 'vitest';
import { createPokemon } from '../../src/core/pokemon';
import { haggleChance, SHOP_TYPE_IDS, SHOP_TYPES_READY, shopScreenType, shopTypeAt, type ShopPlace } from '../../src/core/shopTypes';
import { buyItem, buyItems, oneOnly, chooseStarter, createRun, haggleItem, isBlackMarket, leaveShop, shopBadgesNeeded, shopPrice, shopSaleItem, shopStock, visitSide } from '../../src/core/run';
import { shopView } from '../../src/ui/shopLook';
import { content } from './helpers';

const place = (over: Partial<ShopPlace> = {}): ShopPlace => ({ seed: 's', regionIndex: 0, stageIndex: 0, nodeId: 'n1', period: 'morning', blackMarket: false, ...over });

describe('shop types (shops redesign)', () => {
  it('the same place always gives the same type, and places spread over every daytime type', () => {
    expect(shopTypeAt(place())).toBe(shopTypeAt(place()));
    const seen = new Set(Array.from({ length: 200 }, (_, i) => shopTypeAt(place({ nodeId: `n${i}` }))));
    for (const t of SHOP_TYPE_IDS.filter((t) => t !== 'night' && t !== 'ballguy')) expect(seen.has(t)).toBe(true);
    expect(seen.has('night')).toBe(false);
    expect(seen.has('ballguy')).toBe(false); // Ball Guy's shop is only ever entered in Galar's tournament
  });

  it('night time and the Black Market make it a Night Market', () => {
    expect(shopTypeAt(place({ period: 'night' }))).toBe('night');
    expect(shopTypeAt(place({ blackMarket: true }))).toBe('night');
    expect(shopTypeAt(place({ period: 'evening' }))).not.toBe('night');
  });

  it('every type has its own screen; a bad override falls back to the real type', () => {
    expect([...SHOP_TYPES_READY]).toEqual(SHOP_TYPE_IDS.filter((t) => t !== 'ballguy')); // Ball Guy draws with the Mart screen
    for (let i = 0; i < 50; i++) expect(SHOP_TYPES_READY).toContain(shopScreenType(shopTypeAt(place({ nodeId: i }))));
    expect(shopScreenType('mart', 'boutique')).toBe('boutique');
    expect(shopScreenType('mart', 'nonsense')).toBe('mart');
    expect(shopScreenType('depot', 'nonsense')).toBe('depot');
  });
});

describe('shop view (what every style draws)', () => {
  const run = () => chooseStarter(content, createRun(content, { runId: 'r', seed: 'shop-view', archetypeId: 'red' }), 0);
  const view = (r: ReturnType<typeof run>) =>
    shopView(content, r, {
      stock: shopStock(content, r),
      price: (e) => shopPrice(content, r, e),
      basePrice: (e) => shopPrice(content, r, e),
      badgesFor: (e) => shopBadgesNeeded(content, r, e),
      saleItem: shopSaleItem(content, r),
      isBlack: (e) => isBlackMarket(content, r, e),
      canSell: false,
      working: null,
    });

  it('lists the stock in order with prices, money and the next stock line', () => {
    const r = run();
    r.money = 300;
    const v = view(r);
    expect(v.rows.map((x) => x.itemId)).toEqual(shopStock(content, r).map((e) => e.item));
    expect(v.money).toBe(300);
    expect(v.nextStock).toMatch(/^New stock at \d+ badges$/);
    for (const row of v.rows) expect(row.affordable).toBe(row.price <= 300);
    for (const row of v.rows) expect(row.problem === null).toBe(row.affordable);
  });

  it('an evolution stone names the party members who can use it', () => {
    const r = run();
    r.badges = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const pika = createPokemon(content, 'pikachu', 20, 'pika');
    r.party.push(pika);
    const stone = view(r).rows.find((x) => x.itemId === 'thunder-stone');
    expect(stone?.users).toEqual(['pika']);
    expect(view(r).rows.find((x) => x.itemId === 'poke-ball')?.users).toBeNull();
  });
});

describe('each shop kind sells its own goods, with its own perk', () => {
  const base = () => {
    const r = chooseStarter(content, createRun(content, { runId: 'r', seed: 'shop-kinds', archetypeId: 'red' }), 0);
    r.badges = ['a', 'b'];
    r.money = 50_000;
    const node = r.stage!.map.nodes[0]!;
    node.sides.push({ id: 'shop', kind: 'shop', used: false });
    r.stage!.current = node.id;
    return visitSide(content, r, 'shop').run;
  };
  const as = (type: string) => {
    const r = base();
    r.shop = { ...r.shop!, type };
    return r;
  };
  const items = (r: ReturnType<typeof base>) => shopStock(content, r).map((e) => e.item);
  const mart = items(as('mart'));
  const cat = (id: string) => content.items.get(id)!.category;
  const bt = content.balance.shopTypes!;

  it('entering a shop fixes its kind; leaving forgets it', () => {
    const r = base();
    expect(SHOP_TYPE_IDS).toContain(r.shop!.type);
    expect(leaveShop(content, r).shop).toBeUndefined();
  });

  it('Boutique: only held, training, evolution and form goods, a little dearer, plus rare stock early', () => {
    const r = as('boutique');
    const stock = shopStock(content, r);
    expect(stock.length).toBeGreaterThan(0);
    for (const e of stock) expect(bt.boutique.categories).toContain(cat(e.item));
    const open = stock.find((e) => mart.includes(e.item))!;
    const plain = as('mart');
    expect(Math.abs(shopPrice(content, r, open) - shopPrice(content, plain, open) * bt.boutique.priceFactor)).toBeLessThanOrEqual(1);
  });

  it('Depot: only balls and medicine; buying in bulk takes a share off', () => {
    const r = as('depot');
    for (const id of items(r)) expect(bt.depot.categories).toContain(cat(id));
    const ball = shopStock(content, r).find((e) => e.item === 'poke-ball')!;
    const unit = shopPrice(content, r, ball);
    const after = buyItems(content, r, 'poke-ball', bt.depot.bulkMin).run;
    expect(r.money - after.money).toBe(Math.round(unit * bt.depot.bulkMin * (1 - bt.depot.bulkDiscount)));
    expect(after.inventory['poke-ball']).toBe((r.inventory['poke-ball'] ?? 0) + bt.depot.bulkMin);
    // A small basket pays full price; anywhere else bulk is just repeat buying.
    expect(r.money - buyItems(content, r, 'poke-ball', 2).run.money).toBe(unit * 2);
    const m = as('mart');
    expect(m.money - buyItems(content, m, 'poke-ball', bt.depot.bulkMin).run.money).toBe(shopPrice(content, m, ball) * bt.depot.bulkMin);
    // The basket holds one at most of a key item, Mega Stone or Z-Crystal.
    const key = [...content.items.values()].find((i) => i.effect.kind === 'keyItem')!;
    expect(oneOnly(content, key.id)).toBe(true);
    expect(oneOnly(content, 'poke-ball')).toBe(false);
  });

  it('Bazaar: a few of the Mart goods; one haggle per visit, fixed per stall and item', () => {
    const r = as('bazaar');
    const stock = items(r);
    expect(stock.length).toBe(Math.min(bt.bazaar.stockSize, mart.length));
    for (const id of stock) expect(mart).toContain(id);
    const target = stock[0]!;
    const entry = shopStock(content, r).find((e) => e.item === target)!;
    const before = shopPrice(content, r, entry);
    const h = haggleItem(content, r, target);
    expect(haggleItem(content, r, target).run.shop!.haggle).toEqual(h.run.shop!.haggle);
    const after = shopPrice(content, h.run, entry);
    if (h.run.shop!.haggle!.won) expect(after).toBeLessThan(before);
    else expect(after).toBeGreaterThan(before);
    expect(() => haggleItem(content, h.run, target)).toThrow(/already haggled/);
    expect(() => haggleItem(content, as('mart'), target)).toThrow(/Only Kecleon/);
  });

  it('haggle odds rise with Charisma up to a cap', () => {
    expect(haggleChance(content, 0)).toBe(bt.bazaar.haggleBase);
    expect(haggleChance(content, 40)).toBeGreaterThan(haggleChance(content, 0));
    expect(haggleChance(content, 100)).toBeLessThanOrEqual(bt.bazaar.haggleMax);
  });

  it('PokéNet: the Mart stock plus the next locked item; one deal of the visit is cheaper', () => {
    const r = as('pokenet');
    const stock = items(r);
    for (const id of mart) expect(stock).toContain(id);
    expect(stock.length).toBe(mart.length + bt.pokenet.early);
  });

  it('Night Market: the Mart stock plus mystery rare goods no Mart lists, buyable', () => {
    const r = as('night');
    const stock = shopStock(content, r);
    const extra = stock.filter((e) => !mart.includes(e.item));
    expect(extra.length).toBe(bt.night.mystery);
    for (const e of extra) expect(content.shop.some((s) => s.item === e.item)).toBe(false);
    expect(buyItem(content, r, extra[0]!.item).run.inventory[extra[0]!.item]).toBeGreaterThan(0);
  });
});
