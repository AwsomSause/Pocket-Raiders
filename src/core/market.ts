// Catalog Overhaul Pack, markets (STORY_FAMILIES_11, _12, _16): the `market` event effect.
// One effect with a few honest, deterministic actions that the plain effects cannot express:
// stat effort for a named stat, printed-odds prize tables, selling, pawning, rebates, deposits and a seller who comes back.
// Everything it stores lives in run.itemCounters ("market:*") and run.story.flags, so no save version changes.

import type { Content, EventEffect } from './contentSchema';
import { changeFriendship } from './friendship';
import { addItem } from './items';
import { NATURES } from './natures';
import { teachEggMove } from './mastery';
import { gainXp, getSpecies, maxHp, maxPp, usableLearnset, xpForLevel } from './pokemon';
import { levelCap } from './regions';
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
/** Who an action is for: the picked Pokémon (a `pick` choice), the lead (first able to fight) or the whole party. */
function targets(run: RunState, e: MarketEffect, uid?: string): Mon[] {
  if (e.who === 'party') return run.party;
  const picked = e.who === 'picked' ? run.party.find((m) => m.uid === uid) : undefined;
  const one = picked ?? run.party.find((m) => m.hp > 0) ?? run.party[0];
  return one ? [one] : [];
}

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

function effort(content: Content, run: RunState, e: MarketEffect, uid?: string): string {
  const cap = content.balance.vitaminMaxStacks;
  const lines: string[] = [];
  for (const m of targets(run, e, uid)) {
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

function prize(content: Content, run: RunState, e: MarketEffect, rng: Rng, apply: (x: EventEffect) => string = () => ''): string {
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
    if (row.event) apply({ kind: 'addEvent', eventId: row.event } as EventEffect);
    if (row.money || row.item || row.flag || row.event) won.push(row.label);
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
  const hit = Object.entries(run.itemCounters ?? {}).find(([k, v]) => k.startsWith(pawnPrefix(key)) && v >= 0);
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

/**
 * A con's takings, put away where they can be found again (the next Hideout's vault). Silent: the money itself
 * already left through the price the player saw. A Hideout pays it back with `withdraw` on the same key.
 */
function stash(run: RunState, e: MarketEffect): string {
  const key = e.key ?? 'hideout-vault';
  const amount = Math.max(0, e.amount ?? 0);
  if (amount <= 0) return '';
  counters(run)[`market:deposit:${key}`] = (counters(run)[`market:deposit:${key}`] ?? 0) + amount;
  setFlag(run, `deposit-${key}`, flagOf(run, `deposit-${key}`) + 1);
  return '';
}

/** A thief takes the most valuable item (the same one a pawnshop would): held under `key` like a free pawn ticket, so `redeem` with factor 0 gives it back. */
function stolen(content: Content, run: RunState, e: MarketEffect): string {
  const key = e.key ?? 'hideout-vault';
  if (pawned(run, key)) return '';
  const best = sellable(content, run)[0];
  if (!best) return 'They got nothing: your pockets were empty';
  take(run, best.id, 1);
  counters(run)[`${pawnPrefix(key)}${best.id}`] = 0;
  setFlag(run, `pawn-${key}`, 1);
  return `Your ${nameOf(content, best.id)} is gone`;
}

/** Hands over `amount` items (default 1) from `only`, in list order; `holdsAny` on the choice makes sure they are there. */
function payItem(content: Content, run: RunState, e: MarketEffect): string {
  let left = e.amount ?? 1;
  const given: string[] = [];
  for (const id of e.only ?? []) {
    while (left > 0 && (run.inventory[id] ?? 0) > 0) {
      take(run, id, 1);
      given.push(nameOf(content, id));
      left--;
    }
  }
  return given.length > 0 ? `Gave ${given.join(' and ')}` : '';
}

const rentPrefix = (key: string) => `market:rent:${key}:`;
/** The item out on rent under `key`, if any. */
export function rented(run: RunState, key: string): string | null {
  const hit = Object.keys(run.itemCounters ?? {}).find((k) => k.startsWith(rentPrefix(key)));
  return hit ? hit.slice(rentPrefix(key).length) : null;
}

/** A held item from `only` (one seeded draw) goes out on rent under `key`. */
function rent(content: Content, run: RunState, e: MarketEffect, rng: Rng): string {
  const key = e.key ?? 'rental';
  const pool = e.only ?? [];
  if (pool.length === 0 || rented(run, key)) return '';
  const id = rng.pick([...pool]);
  addItem(run.inventory, id, 1);
  counters(run)[`${rentPrefix(key)}${id}`] = 1;
  setFlag(run, `rent-${key}`, 1);
  return `Rented: ${nameOf(content, id)}`;
}

/** The rental goes back: the item itself if you still hold it and say so, else its fair value (never more than you have). */
function returnRent(content: Content, run: RunState, e: MarketEffect): string {
  const key = e.key ?? 'rental';
  const id = rented(run, key);
  if (!id) return '';
  delete counters(run)[`${rentPrefix(key)}${id}`];
  setFlag(run, `rent-${key}`, 0);
  if (!e.used && (run.inventory[id] ?? 0) > 0) {
    take(run, id, 1);
    return `Returned ${nameOf(content, id)}`;
  }
  const value = Math.min(run.money, itemValue(content, id));
  run.money -= value;
  return `Paid ₽${value} for the ${nameOf(content, id)}`;
}

/** The Apothecary's test potion, the odds printed on the bottle: a quarter each, a stat's effort up, one down, a nap (half HP back), nothing. */
function brew(content: Content, run: RunState, e: MarketEffect, rng: Rng, uid?: string): string {
  const m = targets(run, e, uid)[0];
  if (!m) return '';
  const roll = rng.int(0, 3);
  const stat = STATS[rng.int(0, STATS.length - 1)]!;
  const cap = content.balance.vitaminMaxStacks;
  if (roll === 0) {
    const before = m.vitamins[stat] ?? 0;
    m.vitamins[stat] = Math.min(cap, before + 1);
    return before >= cap ? `${STAT_NAMES[stat]} up, but ${monName(content, m)} is already at its limit` : `${monName(content, m)}: ${STAT_NAMES[stat]} effort +1`;
  }
  if (roll === 1) {
    const before = m.vitamins[stat] ?? 0;
    m.vitamins[stat] = Math.max(0, before - 1);
    return before === 0 ? `${STAT_NAMES[stat]} down, but there was nothing to lose` : `${monName(content, m)}: ${STAT_NAMES[stat]} effort −1`;
  }
  if (roll === 2) {
    m.hp = Math.min(maxHp(content, m), m.hp + Math.ceil(maxHp(content, m) / 2));
    return `${monName(content, m)} naps and wakes with half its HP back`;
  }
  return 'Nothing happens at all';
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
function mend(content: Content, run: RunState, e: MarketEffect, uid?: string): string {
  const share = e.factor ?? 0.1;
  for (const m of targets(run, e, uid)) if (m.hp > 0) m.hp = Math.min(maxHp(content, m), m.hp + Math.ceil(maxHp(content, m) * share));
  return `${e.who === 'party' ? 'the party' : 'the lead'} heals ${Math.round(share * 100)}%`;
}

/**
 * Honest advice, said from what is really in the party. `stone`: which stone (`only`) would evolve something. `abilities`: both normal abilities.
 * `evolutions`: how and when each one changes. `nature`: what its Nature is and favours.
 */
function advise(content: Content, run: RunState, e: MarketEffect, uid?: string): string {
  const who = e.who === 'party' || e.key === 'stone' ? run.party : targets(run, e, uid);
  const lines: string[] = [];
  for (const m of who) {
    const sp = content.species.get(m.speciesId);
    if (!sp) continue;
    const name = monName(content, m);
    if (e.key === 'best') {
      const best = sellable(content, run)[0];
      return best ? `Your stake would be your ${nameOf(content, best.id)}` : 'You have nothing to stake';
    }
    if (e.key === 'abilities') {
      const names = sp.abilities.normal.map((id) => content.abilities.get(id)?.name ?? id);
      lines.push(names.length < 2 ? `${name} has only ${names[0] ?? 'one ability'}: nothing to swap` : `${name}: ${names.join(' or ')}`);
    } else if (e.key === 'evolutions') {
      if (sp.evolutions.length === 0) lines.push(`${name} is as grown as it will ever be`);
      else lines.push(`${name} becomes ${sp.evolutions.map((x) => `${content.species.get(x.to)?.name ?? x.to} ${x.item ? `with a ${nameOf(content, x.item)}` : `at level ${x.level}`}`).join(', or ')}`);
    } else if (e.key === 'nature') {
      const [up, down] = NATURES[m.nature as keyof typeof NATURES] ?? ['atk', 'atk'];
      lines.push(up === down ? `${name} is ${m.nature}: it leans no way at all` : `${name} is ${m.nature}: more ${STAT_NAMES[up]}, less ${STAT_NAMES[down]}`);
    } else {
      const stones = e.only ?? ['fire-stone', 'water-stone', 'thunder-stone', 'leaf-stone'];
      const evo = sp.evolutions.find((x) => x.item !== undefined && stones.includes(x.item));
      if (evo?.item) lines.push(`${name} would evolve with a ${nameOf(content, evo.item)}`);
    }
  }
  return lines.length > 0 ? `"${lines.join('. ')}."` : '"None. Keep your money."';
}

/** A service done for one Pokémon: the plain lead-only effects, applied to the Pokémon the player picked. */
function service(content: Content, run: RunState, e: MarketEffect, uid: string | undefined, apply: (x: EventEffect) => string): string {
  const mon = targets(run, e, uid)[0];
  if (!mon) return '';
  if (mon.hp <= 0) return `${monName(content, mon)} has fainted and cannot take part`;
  const effects: EventEffect[] =
    e.what === 'abilitySwap' ? [{ kind: 'train', what: 'abilitySwap' }]
    : e.what === 'natureNudge' ? [{ kind: 'train', what: 'natureNudge', stat: e.stat === 'hp' || e.stat === 'highest' || e.stat === 'lowest' ? undefined : e.stat }]
    : e.what === 'eggMove' ? [{ kind: 'eggMove' }]
    : e.what === 'hyper' ? [{ kind: 'item', id: 'bottle-cap', count: 1 }]
    : e.what === 'learnMove' ? (e.types ?? [undefined]).map((type) => ({ kind: 'train', what: 'learnMove', ...(type ? { type } : {}) }) as EventEffect)
    : [];
  // The plain effects act on the first Pokémon able to fight: stand the picked one there for a moment.
  const order = run.party.map((m) => m.uid);
  run.party = [mon, ...run.party.filter((m) => m !== mon)];
  let said = '';
  for (const x of effects) {
    said = apply(x);
    if (said) break;
  }
  run.party = order.map((id) => run.party.find((m) => m.uid === id)).filter((m): m is Mon => !!m).concat(run.party.filter((m) => !order.includes(m.uid)));
  return said || `${monName(content, mon)} has nothing new to learn here`;
}

const forgotPrefix = (uid: string): string => `market:forgot:${uid}:`;

/** The Move Forgetter: the picked Pokémon forgets its last move (never its only one). The Move Tutor can bring it back. */
function forget(content: Content, run: RunState, e: MarketEffect, uid?: string): string {
  const mon = targets(run, e, uid)[0];
  if (!mon) return '';
  if (mon.moves.length <= 1) return `${monName(content, mon)} knows only one move and keeps it`;
  const gone = mon.moves.pop()!;
  counters(run)[`${forgotPrefix(mon.uid)}${gone.id}`] = 1;
  setFlag(run, 'move-forgotten', flagOf(run, 'move-forgotten') + 1);
  return `${monName(content, mon)} forgot ${content.moves.get(gone.id)?.name ?? gone.id}`;
}

function relearn(content: Content, run: RunState, e: MarketEffect, uid?: string): string {
  const mon = targets(run, e, uid)[0];
  if (!mon) return '';
  const key = Object.keys(run.itemCounters ?? {}).find((k) => k.startsWith(forgotPrefix(mon.uid)) && (run.itemCounters?.[k] ?? 0) > 0);
  if (!key) return `${monName(content, mon)} has forgotten nothing`;
  const id = key.slice(forgotPrefix(mon.uid).length);
  delete counters(run)[key];
  setFlag(run, 'move-forgotten', flagOf(run, 'move-forgotten') - 1);
  if (mon.moves.some((m) => m.id === id)) return '';
  if (mon.moves.length < 4) mon.moves.push({ id, pp: maxPp(content, { id, pp: 0 }) });
  else if (!teachEggMove(content, mon, id, [])) return '';
  return `${monName(content, mon)} remembered ${content.moves.get(id)?.name ?? id}`;
}

/** Experience worth `factor` of each Pokémon's next level. */
function xp(content: Content, run: RunState, e: MarketEffect, uid?: string): string {
  const cap = levelCap(content, run.regionIndex);
  let n = 0;
  for (const m of targets(run, e, uid)) {
    if (m.hp <= 0) continue;
    const rate = getSpecies(content, m.speciesId).growthRate;
    const step = xpForLevel(rate, m.level + 1) - xpForLevel(rate, m.level);
    gainXp(content, m, Math.max(1, Math.round(step * (e.factor ?? 1))), cap);
    n++;
  }
  return n > 0 ? `experience for ${n === 1 ? 'one Pokémon' : `${n} Pokémon`}` : '';
}

/** Teaches `move` when the Pokémon can learn it; otherwise the drill becomes effort in `stat`. */
function teachOr(content: Content, run: RunState, e: MarketEffect, uid?: string): string {
  const mon = targets(run, e, uid)[0];
  if (!mon || !e.move) return '';
  const sp = getSpecies(content, mon.speciesId);
  const can = usableLearnset(content, sp).some((x) => x.move === e.move) || (content.learnables.get(sp.id) ?? []).includes(e.move);
  if (can && !mon.moves.some((m) => m.id === e.move) && teachEggMove(content, mon, e.move, [])) return `${monName(content, mon)} learned ${content.moves.get(e.move)?.name ?? e.move}!`;
  return effort(content, run, e, uid);
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
export function applyMarket(content: Content, run: RunState, e: MarketEffect, rng: Rng, uid?: string, apply: (x: EventEffect) => string = () => ''): string {
  switch (e.action) {
    case 'comeBack':
      if (e.event && run.itemCounters) delete run.itemCounters[`event-seen:${e.event}`];
      return '';
    case 'effort':
      return effort(content, run, e, uid);
    case 'prize':
      return prize(content, run, e, rng, apply);
    case 'sell':
      return sell(content, run, e);
    case 'pawn':
      return pawn(content, run, e);
    case 'stash':
      return stash(run, e);
    case 'payItem':
      return payItem(content, run, e);
    case 'rent':
      return rent(content, run, e, rng);
    case 'returnRent':
      return returnRent(content, run, e);
    case 'brew':
      return brew(content, run, e, rng, uid);
    case 'stolen':
      return stolen(content, run, e);
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
      return mend(content, run, e, uid);
    case 'advise':
      return advise(content, run, e, uid);
    case 'service':
      return service(content, run, e, uid, apply);
    case 'forget':
      return forget(content, run, e, uid);
    case 'relearn':
      return relearn(content, run, e, uid);
    case 'xp':
      return xp(content, run, e, uid);
    case 'teachOr':
      return teachOr(content, run, e, uid);
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
      const who = e.who === 'party' ? 'the party' : e.who === 'picked' ? 'the one you pick' : 'the lead';
      return e.type ? `${stat} effort (${e.type}-types +${e.typeAmount ?? e.amount ?? 1})` : `${stat} effort +${e.amount ?? 1} for ${who}`;
    }
    case 'prize':
      return e.stake ? `a printed-odds draw (₽${e.stake}${(e.times ?? 1) > 1 ? ` ×${e.times}` : ''})` : 'a printed-odds draw';
    case 'sell':
      return e.pick === 'stack' ? 'sell your biggest stack' : e.pick === 'curio' ? 'sell your curios' : 'sell some junk';
    case 'pawn':
      return 'pawn your most valuable item';
    case 'stash':
      return '';
    case 'payItem':
      return `give ${(e.amount ?? 1) > 1 ? `${e.amount} items` : 'an item'}`;
    case 'rent':
      return 'a rented held item';
    case 'returnRent':
      return e.used ? 'pay for the rented item' : 'return the rented item';
    case 'brew':
      return 'a test potion (printed odds)';
    case 'stolen':
      return 'your most valuable item is taken';
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
    case 'service':
      return e.what === 'abilitySwap' ? 'its ability changes' : e.what === 'natureNudge' ? 'its Nature changes' : e.what === 'eggMove' ? 'it learns an egg move' : e.what === 'hyper' ? 'its weakest stat is hyper trained' : 'it learns a move';
    case 'forget':
      return 'it forgets its last move';
    case 'relearn':
      return 'it remembers a forgotten move';
    case 'xp':
      return e.who === 'party' ? 'experience for the party' : 'experience';
    case 'teachOr':
      return `learns ${e.move ?? 'a move'} if it can`;
    case 'buyPoint':
      return `₽${e.amount ?? 500} for 1 Battle Point`;
    case 'cashPoint':
      return `1 Battle Point for ₽${e.amount ?? 500}`;
  }
}
