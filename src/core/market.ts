// Catalog Overhaul Pack, markets (STORY_FAMILIES_11, _12, _16): the `market` event effect.
// One effect with a few honest, deterministic actions that the plain effects cannot express:
// stat effort for a named stat, printed-odds prize tables, selling, pawning, rebates, deposits and a seller who comes back.
// Everything it stores lives in run.itemCounters ("market:*") and run.story.flags, so no save version changes.

import type { Content, EventEffect } from './contentSchema';
import { changeFriendship } from './friendship';
import { addItem } from './items';
import { NATURES } from './natures';
import { maxHp } from './pokemon';
import type { Rng } from './rng';
import type { RunState } from './state';

export type MarketEffect = Extract<EventEffect, { kind: 'market' }>;
type Mon = RunState['party'][number];
type Stat = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';

const STATS: readonly Stat[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const STAT_NAMES: Record<Stat, string> = { hp: 'HP', atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed' };
const RARITY_VALUE: Record<string, number> = { common: 60, uncommon: 120, rare: 240, epic: 480, legendary: 960 };
/** Things a collector calls curios: fossils, shards, pearls and other treasure. */
const CURIO = /fossil|shard|pearl|nugget|star-piece|stardust|old-amber|rare-bone|relic-|big-mushroom/;
const LAST_SPEND = 'market:last-spend';

const counters = (run: RunState): Record<string, number> => (run.itemCounters ??= {});
const nameOf = (content: Content, id: string): string => content.catalog.get(id)?.name ?? content.items.get(id)?.name ?? id;
const monName = (content: Content, m: Mon): string => m.care?.nickname || (content.species.get(m.speciesId)?.name ?? 'your Pokémon');
const isKey = (content: Content, id: string): boolean => (content.catalog.get(id)?.family ?? '').startsWith('Key items') || content.items.get(id)?.category === 'key';

/** The fair value of one item: its shop price when a shop lists it, else a value by rarity. */
export function itemValue(content: Content, id: string): number {
  const listed = content.shop.find((s) => s.item === id);
  if (listed) return listed.price;
  return RARITY_VALUE[content.catalog.get(id)?.rarity ?? 'common'] ?? RARITY_VALUE.common!;
}

/** Bag items a market will take (never key items), most valuable first, then by id. */
export function sellable(content: Content, run: RunState): { id: string; count: number; value: number }[] {
  return Object.entries(run.inventory)
    .filter(([id, n]) => (n ?? 0) > 0 && !isKey(content, id))
    .map(([id, n]) => ({ id, count: n ?? 0, value: itemValue(content, id) }))
    .sort((a, b) => b.value - a.value || (a.id < b.id ? -1 : 1));
}

/** Money spent in an event (the Rebate Booth pays a share of the last one back). */
export function noteSpend(run: RunState, amount: number): void {
  if (amount > 0) counters(run)[LAST_SPEND] = amount;
}

const take = (run: RunState, id: string, n: number): void => {
  const left = (run.inventory[id] ?? 0) - n;
  if (left > 0) run.inventory[id] = left;
  else delete run.inventory[id];
};
const setFlag = (run: RunState, key: string, value: number): void => {
  run.story.flags[`ev:${key}`] = Math.max(0, value);
};
const flagOf = (run: RunState, key: string): number => Number(run.story.flags[`ev:${key}`] ?? 0);

function effortStat(content: Content, m: Mon, stat: MarketEffect['stat'], cap: number): Stat | null {
  const base = content.species.get(m.speciesId)?.baseStats;
  const room = STATS.filter((s) => (m.vitamins[s] ?? 0) < cap);
  if (stat === 'highest' || stat === 'lowest') {
    if (!base || room.length === 0) return null;
    const sorted = [...room].sort((a, b) => (stat === 'highest' ? base[b] - base[a] : base[a] - base[b]));
    return sorted[0] ?? null;
  }
  return stat && room.includes(stat) ? stat : null;
}

function effort(content: Content, run: RunState, e: MarketEffect): string {
  const cap = content.balance.vitaminMaxStacks;
  const targets = e.who === 'party' ? run.party : run.party.filter((m) => m.hp > 0).slice(0, 1);
  const lines: string[] = [];
  for (const m of targets) {
    const typed = e.type !== undefined && (content.species.get(m.speciesId)?.types ?? []).includes(e.type);
    const amount = e.type === undefined ? e.amount ?? 1 : typed ? e.typeAmount ?? e.amount ?? 1 : e.typeAmount === undefined ? 0 : e.amount ?? 1;
    if (amount <= 0) continue;
    const stat = effortStat(content, m, e.stat ?? 'lowest', cap);
    if (!stat) {
      lines.push(`${monName(content, m)} is already at its limit`);
      continue;
    }
    const before = m.vitamins[stat] ?? 0;
    m.vitamins[stat] = Math.min(cap, before + amount);
    lines.push(`${monName(content, m)}: ${STAT_NAMES[stat]} effort +${m.vitamins[stat]! - before}`);
  }
  return lines.join(', ');
}

function prize(content: Content, run: RunState, e: MarketEffect, rng: Rng): string {
  const table = e.table ?? [];
  if (table.length === 0) return '';
  const stake = e.stake ?? 0;
  const times = e.times ?? 1;
  let played = 0;
  let net = 0;
  const won: string[] = [];
  for (let i = 0; i < times; i++) {
    if (run.money < stake) break;
    run.money -= stake;
    net -= stake;
    played++;
    const row = rng.weighted(table.map((r) => ({ item: r, weight: r.weight })));
    if (row.money) {
      run.money = Math.max(0, run.money + row.money);
      net += row.money;
    }
    if (row.item) addItem(run.inventory, row.item, row.count ?? 1);
    if (row.flag) setFlag(run, row.flag, flagOf(run, row.flag) + 1);
    if (row.money || row.item || row.flag) won.push(row.label);
    else if (times === 1) won.push(row.label);
  }
  if (played === 0) return 'Not enough money to play';
  if (times === 1) return won[0] ?? '';
  const money = net === 0 ? 'even' : net > 0 ? `+₽${net}` : `−₽${-net}`;
  return `${played} plays: ${won.length > 0 ? won.join(', ') : 'nothing'} (${money} in all)`;
}

function sell(content: Content, run: RunState, e: MarketEffect): string {
  const factor = e.factor ?? 1;
  const bag = sellable(content, run).filter((x) => !e.only || e.only.includes(x.id));
  if (e.pick === 'stack') {
    const stack = bag.filter((x) => x.count >= 5).sort((a, b) => b.count - a.count || b.value - a.value)[0];
    if (!stack) return 'You have no stack of five identical items';
    const paid = Math.round(stack.value * 0.5 * factor) * stack.count;
    take(run, stack.id, stack.count);
    run.money += paid;
    return `Sold ${nameOf(content, stack.id)} ×${stack.count} for ₽${paid}`;
  }
  if (e.pick === 'curio') {
    const curios = bag.filter((x) => CURIO.test(x.id));
    if (curios.length === 0) return 'You carry no curios';
    let paid = 0;
    for (const c of curios) {
      paid += Math.round(c.value * factor) * c.count;
      take(run, c.id, c.count);
    }
    run.money += paid;
    return `Sold ${curios.map((c) => `${nameOf(content, c.id)}${c.count > 1 ? ` ×${c.count}` : ''}`).join(', ')} for ₽${paid}`;
  }
  // junk: up to three of the cheapest thing in the bag, at the plain scrap price.
  const junk = bag[bag.length - 1];
  if (!junk) return 'You have nothing to sell';
  const n = Math.min(3, junk.count);
  const paid = Math.round(junk.value * 0.5 * factor) * n;
  take(run, junk.id, n);
  run.money += paid;
  return `Sold ${nameOf(content, junk.id)}${n > 1 ? ` ×${n}` : ''} for ₽${paid}`;
}

const pawnPrefix = (key: string): string => `market:pawn:${key}:`;

/** What a pawnbroker holds for you under `key`: the item and what was paid for it. */
export function pawned(run: RunState, key: string): { item: string; paid: number } | null {
  const hit = Object.entries(run.itemCounters ?? {}).find(([k, v]) => k.startsWith(pawnPrefix(key)) && v > 0);
  return hit ? { item: hit[0].slice(pawnPrefix(key).length), paid: hit[1] } : null;
}

function pawn(content: Content, run: RunState, e: MarketEffect): string {
  const key = e.key ?? 'pawn';
  if (pawned(run, key)) return 'They already hold something of yours';
  const best = sellable(content, run)[0];
  if (!best) return 'You have nothing to pawn';
  const paid = Math.max(1, Math.round(best.value * (e.factor ?? 0.6)));
  take(run, best.id, 1);
  run.money += paid;
  counters(run)[`${pawnPrefix(key)}${best.id}`] = paid;
  setFlag(run, `pawn-${key}`, 1);
  return `Pawned ${nameOf(content, best.id)} for ₽${paid}`;
}

function redeem(content: Content, run: RunState, e: MarketEffect): string {
  const key = e.key ?? 'pawn';
  const held = pawned(run, key);
  if (!held) return '';
  const price = Math.round(held.paid * (e.factor ?? 1));
  setFlag(run, `pawn-${key}`, 0);
  delete counters(run)[`${pawnPrefix(key)}${held.item}`];
  if (e.forfeit) return `${nameOf(content, held.item)} stays with them`;
  if (run.money < price) {
    // Never silently lost: the ticket stays good.
    counters(run)[`${pawnPrefix(key)}${held.item}`] = held.paid;
    setFlag(run, `pawn-${key}`, 1);
    return `You need ₽${price} to buy it back`;
  }
  run.money -= price;
  addItem(run.inventory, held.item, 1);
  return `Bought back ${nameOf(content, held.item)} for ₽${price}`;
}

function deposit(run: RunState, e: MarketEffect): string {
  const key = e.key ?? 'bank';
  const amount = Math.min(run.money, e.amount ?? Math.floor(run.money * (e.factor ?? 0.5)));
  if (amount <= 0) return 'You have nothing to deposit';
  run.money -= amount;
  counters(run)[`market:deposit:${key}`] = (counters(run)[`market:deposit:${key}`] ?? 0) + amount;
  setFlag(run, `deposit-${key}`, flagOf(run, `deposit-${key}`) + 1);
  return `Deposited ₽${amount}`;
}

function withdraw(run: RunState, e: MarketEffect): string {
  const key = e.key ?? 'bank';
  const held = counters(run)[`market:deposit:${key}`] ?? 0;
  if (held <= 0) return '';
  const paid = Math.round(held * (e.factor ?? 1));
  delete counters(run)[`market:deposit:${key}`];
  setFlag(run, `deposit-${key}`, 0);
  run.money += paid;
  return `+₽${paid} from your deposit of ₽${held}`;
}

/** The Tasting Table: a plate for each Pokémon you can pay for; a Pokémon whose Nature favours a flavour finds it (+1 Bond). */
function feed(content: Content, run: RunState, e: MarketEffect): string {
  const price = e.amount ?? 0;
  let fed = 0;
  let liked = 0;
  for (const m of run.party) {
    if (run.money < price) break;
    run.money -= price;
    fed++;
    const [up, down] = NATURES[m.nature as keyof typeof NATURES] ?? ['atk', 'atk'];
    if (up !== down) {
      changeFriendship(content, m, 5, 1);
      liked++;
    }
  }
  if (fed === 0) return 'Not enough money for a plate';
  return `${fed} plate${fed > 1 ? 's' : ''} for ₽${fed * price}: ${liked} found a flavour they love`;
}

/** Out-of-battle healing by a share of max HP for the lead or the whole party (never revives). */
function mend(content: Content, run: RunState, e: MarketEffect): string {
  const share = e.factor ?? 0.1;
  const who = e.who === 'party' ? run.party : run.party.filter((m) => m.hp > 0).slice(0, 1);
  for (const m of who) if (m.hp > 0) m.hp = Math.min(maxHp(content, m), m.hp + Math.ceil(maxHp(content, m) * share));
  return `${e.who === 'party' ? 'the party' : 'the lead'} heals ${Math.round(share * 100)}%`;
}

/** Honest advice, said from what is really in the party (`stone`: which of the four stones would evolve something). */
function advise(content: Content, run: RunState, e: MarketEffect): string {
  const stones = e.only ?? ['fire-stone', 'water-stone', 'thunder-stone', 'leaf-stone'];
  const hits: string[] = [];
  for (const m of run.party) {
    const evo = content.species.get(m.speciesId)?.evolutions.find((x) => x.item !== undefined && stones.includes(x.item));
    if (evo?.item) hits.push(`${monName(content, m)} would evolve with a ${nameOf(content, evo.item)}`);
  }
  return hits.length > 0 ? `"${hits.join('. ')}."` : '"None. Keep your money."';
}

/** Frontier (Battle) Points bought or cashed at a posted rate: `amount` is the money for one point. */
function points(run: RunState, e: MarketEffect, buy: boolean): string {
  const rate = e.amount ?? 500;
  if (buy) {
    if (run.money < rate) return 'Not enough money';
    run.money -= rate;
    run.minigames.frontierPoints += 1;
    return `−₽${rate}, +1 Battle Point`;
  }
  if (run.minigames.frontierPoints < 1) return 'You have no Battle Points to change';
  run.minigames.frontierPoints -= 1;
  run.money += rate;
  return `−1 Battle Point, +₽${rate}`;
}

/** Applies a market effect (mutates `run`) and says what changed. */
export function applyMarket(content: Content, run: RunState, e: MarketEffect, rng: Rng): string {
  switch (e.action) {
    case 'comeBack':
      if (e.event && run.itemCounters) delete run.itemCounters[`event-seen:${e.event}`];
      return '';
    case 'effort':
      return effort(content, run, e);
    case 'prize':
      return prize(content, run, e, rng);
    case 'sell':
      return sell(content, run, e);
    case 'pawn':
      return pawn(content, run, e);
    case 'redeem':
      return redeem(content, run, e);
    case 'rebate': {
      const last = counters(run)[LAST_SPEND] ?? 0;
      if (last <= 0) return 'You have bought nothing to claim against';
      const back = Math.round(last * (e.factor ?? 0.2));
      delete counters(run)[LAST_SPEND];
      run.money += back;
      return `+₽${back} back on your last ₽${last}`;
    }
    case 'deposit':
      return deposit(run, e);
    case 'withdraw':
      return withdraw(run, e);
    case 'feed':
      return feed(content, run, e);
    case 'mend':
      return mend(content, run, e);
    case 'advise':
      return advise(content, run, e);
    case 'buyPoint':
      return points(run, e, true);
    case 'cashPoint':
      return points(run, e, false);
  }
}

/** Short chip text for an outcome. */
export function marketWords(e: MarketEffect): string {
  switch (e.action) {
    case 'comeBack':
      return '';
    case 'effort': {
      const stat = e.stat === 'highest' ? 'best stat' : e.stat === 'lowest' || !e.stat ? 'weakest stat' : STAT_NAMES[e.stat];
      const who = e.who === 'party' ? 'the party' : 'the lead';
      return e.type ? `${stat} effort (${e.type}-types +${e.typeAmount ?? e.amount ?? 1})` : `${stat} effort +${e.amount ?? 1} for ${who}`;
    }
    case 'prize':
      return e.stake ? `a printed-odds draw (₽${e.stake}${(e.times ?? 1) > 1 ? ` ×${e.times}` : ''})` : 'a printed-odds draw';
    case 'sell':
      return e.pick === 'stack' ? 'sell your biggest stack' : e.pick === 'curio' ? 'sell your curios' : 'sell some junk';
    case 'pawn':
      return 'pawn your most valuable item';
    case 'redeem':
      return e.forfeit ? 'the pawned item is gone' : 'buy your item back';
    case 'rebate':
      return `${Math.round((e.factor ?? 0.2) * 100)}% of your last purchase back`;
    case 'deposit':
      return e.amount ? `deposit ₽${e.amount}` : 'deposit half your money';
    case 'withdraw':
      return 'your deposit pays out';
    case 'feed':
      return `a plate each (₽${e.amount ?? 0} per Pokémon)`;
    case 'mend':
      return `${e.who === 'party' ? 'the party' : 'the lead'} heals ${Math.round((e.factor ?? 0.1) * 100)}%`;
    case 'advise':
      return 'honest advice';
    case 'buyPoint':
      return `₽${e.amount ?? 500} for 1 Battle Point`;
    case 'cashPoint':
      return `1 Battle Point for ₽${e.amount ?? 500}`;
  }
}
