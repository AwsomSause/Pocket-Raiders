// Greenneedle gn.39, the Travelling Pokémon Market: seven stalls whose vendors remember the player (within the run), the haggle, and the
// two rivals who undercut each other. Every key is a run flag (`ev:market-...`), so the market's memory lasts the run and no longer.
//  - gn op `marketArrive`: a new appearance. Counts it, turns the stock, and starts each vendor's "out of stock" (a vendor haggled
//    below their floor twice at the last appearance has nothing on the stall for the player this time). Picks Josune's pen Pokémon.
//  - gn op `marketBuy` (`key` vendor, `n` asking price, `then` what is bought): pays the price after the vendor's discounts.
//  - gn op `marketOffer` (`key` vendor, `n` asking price, `min` the offer in percent, `then`): at or above the floor (80% of the asking
//    price; 75% for a player who paid at the Shop With No Shopkeeper, `honest-shop`) it's taken, after a show of reluctance; below it
//    it's refused, with one warning, and a second low offer leaves the stall "out of stock" next time.
//  - gn op `marketUndercut` (`key` the vendor told the other's price): 5% off, once per appearance each way, down to the floor. Three
//    appearances running, and they've compared notes: full price at both, this appearance and the next.
import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { rarityIn } from '../rarity';

export const VENDORS = ['carmela', 'tanager', 'dace', 'ivo', 'nan', 'hooded', 'josune'] as const;
export type Vendor = (typeof VENDORS)[number];
const RIVALS: Record<string, string> = { carmela: 'tanager', tanager: 'carmela' };
const GEN: Record<string, number> = { kanto: 1, johto: 2, hoenn: 3, sinnoh: 4, unova: 5, kalos: 6, alola: 7, galar: 8, paldea: 9 };

const f = (run: RunState, k: string): number => Number(run.story.flags[`ev:market-${k}`] ?? 0);
const set = (run: RunState, k: string, n: number): void => {
  run.story.flags[`ev:market-${k}`] = Math.max(0, n);
};
const honestShop = (run: RunState): boolean => Number(run.story.flags['ev:honest-shop'] ?? 0) > 0;

/** The vendor's floor, in percent of the asking price. */
export const floorPercent = (run: RunState): number => (honestShop(run) ? 75 : 80);
/** Loyalty: 10% off after one purchase, 15% after three. */
export const loyalty = (run: RunState, v: string): number => (f(run, `${v}-bought`) >= 3 ? 15 : f(run, `${v}-bought`) >= 1 ? 10 : 0);
/** Whether the two rivals have compared notes (full price at both stalls). */
export const rivalsCaught = (run: RunState): boolean => f(run, 'rivals-caught') > 0;

/** What the vendor asks of this player now: loyalty, then the rival's undercut, never below the floor. */
export function marketPrice(run: RunState, v: string, base: number): number {
  if (RIVALS[v] && rivalsCaught(run)) return base;
  const off = loyalty(run, v) + 5 * f(run, `under-${v}`);
  return Math.max(Math.round((base * floorPercent(run)) / 100), Math.round((base * (100 - off)) / 100));
}

/** Josune's pen Pokémon this appearance (the cast flag). */
export const penSpecies = (run: RunState): string | undefined => Object.keys(run.story.flags).find((k) => k.startsWith('ev:cast-market-pen:'))?.slice('ev:cast-market-pen:'.length);

/** Josune's pen: first-stage Pokémon of the region's own generation that are uncommon there (sorted, so the pick is the run's). */
export function penCandidates(content: Content, region: string): string[] {
  const gen = GEN[region] ?? 1;
  const all = [...content.species.values()].filter((s) => s.generation === gen && s.evolutionStage === 1 && rarityIn(content, s.id, region) === 'uncommon');
  return all.map((s) => s.id).sort();
}

export function marketArrive(content: Content, run: RunState, region: string, roll: number): string {
  const visits = f(run, 'visits') + 1;
  set(run, 'visits', visits);
  set(run, 'stock', ((visits - 1) % 3) + 1);
  set(run, 'story', Math.min(visits, 3));
  // The rivals: played off against each other at the last appearance too? (Three running, and they work it out.)
  if (visits > 1) set(run, 'rivals-run', f(run, 'rivals-this') > 0 ? f(run, 'rivals-run') + 1 : 0);
  set(run, 'rivals-this', 0);
  set(run, 'rivals-caught', f(run, 'rivals-caught') - 1);
  for (const v of VENDORS) {
    set(run, `${v}-out`, f(run, `${v}-banned`));
    set(run, `${v}-banned`, 0);
    set(run, `${v}-low`, 0);
    set(run, `under-${v}`, 0);
  }
  set(run, 'found', 0);
  // Josune's pen: cast as story Pokémon `market-pen` (a fight's `@market-pen`), a new one each appearance.
  for (const k of Object.keys(run.story.flags)) if (k.startsWith('ev:cast-market-pen:')) delete run.story.flags[k];
  const list = penCandidates(content, region);
  if (list.length) run.story.flags[`ev:cast-market-pen:${list[Math.min(list.length - 1, Math.floor(roll * list.length))]!}`] = 1;
  return '';
}

/** Pays and hands over `then` (the caller applies it). Returns the line, or null when the player can't pay. */
export function marketBuy(run: RunState, v: string, base: number): { price: number; line: string } | null {
  const price = marketPrice(run, v, base);
  if (run.money < price) return null;
  run.money -= price;
  set(run, `${v}-bought`, f(run, `${v}-bought`) + 1);
  return { price, line: `You pay ₽${price.toLocaleString('en-GB')}.` };
}

/** An offer of `percent`% of the asking price. Accepted: the price paid. Refused: null, and the line to show. */
export function marketOffer(run: RunState, v: string, base: number, percent: number): { price: number | null; line: string } {
  const offer = Math.round((base * percent) / 100);
  if (offer >= Math.round((base * floorPercent(run)) / 100)) {
    const price = Math.min(offer, marketPrice(run, v, base));
    if (run.money < price) return { price: null, line: 'You count it out twice. You\'re short.' };
    run.money -= price;
    set(run, `${v}-bought`, f(run, `${v}-bought`) + 1);
    return { price, line: `A long breath through the teeth, a look at the sky, a handshake. You pay ₽${price.toLocaleString('en-GB')}.` };
  }
  const low = f(run, `${v}-low`) + 1;
  set(run, `${v}-low`, low);
  if (low === 1) return { price: null, line: 'A flat "No." *They\'ve stopped smiling.*' };
  set(run, `${v}-banned`, 1);
  set(run, `${v}-lowballed`, f(run, `${v}-lowballed`) + 1);
  return { price: null, line: '"No." They turn the lot face down. Next time the market comes, there\'ll be nothing on this stall for you.' };
}

const UNDERCUT: Record<string, (was: string, p: string) => string> = {
  tanager: (was, p) => `**Tanager:** "*${was}?* For a rock with a leaf in it? ${p}. And it's a nicer leaf."`,
  carmela: (_was, p) => `**Carmela:** "He said *what?* ${p}. And you can tell him I said his awning's crooked."`,
};
const coins = (n: number): string => `₽${n.toLocaleString('en-GB')}`;
/** Text token `{market:<vendor>:<asking price>}`: what this player would pay now, shown before they pay. */
export const marketPriceToken = (run: RunState, v: string, base: number): string => coins(marketPrice(run, v, base));
/** The player tells vendor `v` what the rival asks. */
export function marketUndercut(run: RunState, v: string, base: number): string {
  if (rivalsCaught(run)) return '**Both, from behind one stall:** "Full price. We said."';
  if (f(run, `under-${v}`) > 0) return '"I matched it once. I\'m not made of money."';
  if (f(run, 'rivals-this') === 0 && f(run, 'rivals-run') >= 2) {
    set(run, 'rivals-caught', 2);
    set(run, 'rivals-this', 1);
    return '**Both, from behind one stall:** "We compared notes. Full price. For a month."';
  }
  const was = coins(marketPrice(run, v, base));
  set(run, `under-${v}`, 1);
  set(run, 'rivals-this', 1);
  set(run, 'rivals-played', f(run, 'rivals-played') + 1);
  return UNDERCUT[v]!(was, coins(marketPrice(run, v, base)));
}

