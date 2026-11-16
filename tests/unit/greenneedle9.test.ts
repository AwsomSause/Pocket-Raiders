// Greenneedle part 9: gn.39 The Travelling Pokémon Market (tools/events/co/greenneedle-9.ts; rules in src/core/greenneedle/market.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { conditionMet } from '../../src/core/events';
import { marketPrice, penCandidates, penSpecies } from '../../src/core/greenneedle/market';
import { rarityIn } from '../../src/core/rarity';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';

const said = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');
const region = (run: RunState): string => run.regionOrder[run.regionIndex]!;

/** Into the market, and to the ring. */
function market(seed: string, prep?: (run: RunState) => void): RunState {
  const run = gnRun(seed);
  run.money = 20000;
  prep?.(run);
  open(run, 'gn-39-door');
  return choose(run, 'gn-39-door', 'Walk into the ring.').run;
}
/** The next appearance (a new region, as far as the market knows). */
function again(run: RunState): RunState {
  setFlag(run, 'market-region', 0);
  open(run, 'gn-39-door');
  return choose(run, 'gn-39-door', 'Walk into the ring.').run;
}
const toStones = (run: RunState): RunState => choose(run, 'gn-39-ring', 'Evolution Stones.').run;
const stock = (run: RunState): number => flagOf(run, 'market-stock');

describe('gn.39 The Travelling Pokémon Market', () => {
  it('opens with Old Wicker; the first appearance: stock one, Carmela and Tanager not speaking', () => {
    const run = gnRun('t39-open');
    open(run, 'gn-39-door');
    expect(scene(run, 'gn-39-door').intro).toMatch(/Mind who you haggle with; they talk\./);
    const r = choose(run, 'gn-39-door', 'Walk into the ring.');
    expect(said(r)).toMatch(/aren't speaking\./);
    expect(flagOf(r.run, 'market-visits')).toBe(1);
    expect(stock(r.run)).toBe(1);
    expect(scene(r.run, 'gn-39-ring').labels).toEqual(['Evolution Stones.', 'Held Items.', 'TMs.', 'Further round the ring.']);
  });

  it('comes once per region, and back in the next with new stock and the story moved on', () => {
    let run = market('t39-region');
    const door = content.events.get('gn-39-door')!;
    expect(door.requires.every((c) => conditionMet(content, run, c))).toBe(false);
    run = again(run);
    expect(stock(run)).toBe(2);
    expect(flagOf(run, 'market-story')).toBe(2);
    run = again(run);
    expect(scene(run, 'gn-39-ring').labels).not.toContain('Held Items.');
    expect(scene(run, 'gn-39-ring').intro).toMatch(/one long table/);
  });

  it('buying: the price is paid; next time, ten off; after three, fifteen off and the held-back lot', () => {
    let run = toStones(market('t39-buy'));
    expect(scene(run, 'gn-39-carmela-1').labels).toEqual(['Leaf Stone (₽800).', 'Fire Stone (₽800).', 'Moon Stone (₽1,000).', 'Back to the ring.']);
    run = choose(run, 'gn-39-carmela-1', 'Leaf Stone (₽800).').run;
    const before = run.money;
    const r = choose(run, 'gn-39-carmela-1-leaf-stone', 'Pay the price.');
    expect(before - r.run.money).toBe(800);
    expect(said(r)).toMatch(/Leaf Stone/);
    expect(flagOf(r.run, 'market-carmela-bought')).toBe(1);
    expect(marketPrice(r.run, 'carmela', 800)).toBe(720);
    expect(scene(r.run, 'gn-39-carmela-1').intro).toMatch(/Ten off/);
    setFlag(r.run, 'market-carmela-bought', 3);
    expect(marketPrice(r.run, 'carmela', 800)).toBe(680);
    const s = scene(r.run, 'gn-39-carmela-1');
    expect(s.labels).toContain('Shiny Stone (₽1,500).');
    expect(s.labels).not.toContain('Back to the ring.');
  });

  it('haggling: at or above the floor it is taken; below it, a warning, then "out of stock" for one appearance', () => {
    let run = choose(toStones(market('t39-haggle')), 'gn-39-carmela-1', 'Fire Stone (₽800).').run;
    run = choose(run, 'gn-39-carmela-1-fire-stone', 'Offer less.').run;
    expect(scene(run, 'gn-39-carmela-1-fire-stone-haggle').labels).toEqual(['Offer ₽720.', 'Offer ₽624.', 'Offer ₽560.', 'Walk away.']);
    const low = choose(run, 'gn-39-carmela-1-fire-stone-haggle', 'Offer ₽624.');
    expect(said(low)).toMatch(/They've stopped smiling/);
    expect(flagOf(low.run, 'market-carmela-bought')).toBe(0);
    // Refused: still at the counter.
    run = choose(low.run, 'gn-39-carmela-1-fire-stone', 'Offer less.').run;
    const lower = choose(run, 'gn-39-carmela-1-fire-stone-haggle', 'Offer ₽560.');
    expect(said(lower)).toMatch(/nothing on this stall for you/);
    run = again(lower.run);
    expect(flagOf(run, 'market-carmela-out')).toBe(1);
    run = toStones(run);
    const out = scene(run, 'gn-39-carmela-2');
    expect(out.intro).toMatch(/Out of stock\./);
    expect(out.labels).toEqual(['Back to the ring.']);
    // One appearance only.
    run = again(run);
    expect(flagOf(run, 'market-carmela-out')).toBe(0);
  });

  it('a fair offer is taken after a show of reluctance; paying at the Shop With No Shopkeeper lowers the floor', () => {
    let run = choose(toStones(market('t39-fair')), 'gn-39-carmela-1', 'Fire Stone (₽800).').run;
    run = choose(run, 'gn-39-carmela-1-fire-stone', 'Offer less.').run;
    const before = run.money;
    const r = choose(run, 'gn-39-carmela-1-fire-stone-haggle', 'Offer ₽720.');
    expect(said(r)).toMatch(/a handshake/);
    expect(before - r.run.money).toBe(720);
    let honest = choose(toStones(market('t39-shop', (x) => setFlag(x, 'honest-shop'))), 'gn-39-carmela-1', 'Fire Stone (₽800).').run;
    honest = choose(honest, 'gn-39-carmela-1-fire-stone', 'Offer less.').run;
    expect(scene(honest, 'gn-39-carmela-1-fire-stone-haggle').intro).toMatch(/wince comes later/);
    const paid = honest.money;
    const ok = choose(honest, 'gn-39-carmela-1-fire-stone-haggle', 'Offer ₽624.');
    expect(paid - ok.run.money).toBe(624);
  });

  it('took from the Shop With No Shopkeeper: no haggling at all', () => {
    const run = choose(toStones(market('t39-took', (x) => setFlag(x, 'honest-took'))), 'gn-39-carmela-1', 'Fire Stone (₽800).').run;
    const s = scene(run, 'gn-39-carmela-1-fire-stone');
    expect(s.intro).toMatch(/count your change twice/);
    expect(s.labels).toEqual(['Pay the price.', 'Walk away.']);
  });

  it('the rivals undercut each other once per appearance each way, 5%; three appearances running, they compare notes', () => {
    let run = choose(toStones(market('t39-rivals')), 'gn-39-carmela-1', 'Leaf Stone (₽800).').run;
    const r = choose(run, 'gn-39-carmela-1-leaf-stone', 'Mention Tanager\'s price.');
    expect(said(r)).toMatch(/He said \*what\?\* ₽760/);
    expect(marketPrice(r.run, 'carmela', 800)).toBe(760);
    const twice = choose(r.run, 'gn-39-carmela-1-leaf-stone', 'Mention Tanager\'s price.');
    expect(said(twice)).toMatch(/matched it once/);
    expect(marketPrice(twice.run, 'carmela', 800)).toBe(760);
    run = again(twice.run);
    setFlag(run, 'market-rivals-this', 1);
    run = again(run);
    expect(flagOf(run, 'market-rivals-run')).toBe(2);
    expect(scene(run, 'gn-39-ring').intro).toMatch(/NO, WE WON'T MATCH EACH OTHER'S PRICES/);
    run = choose(toStones(run), 'gn-39-carmela-3', 'Leaf Stone (₽800).').run;
    const caught = choose(run, 'gn-39-carmela-3-leaf-stone', 'Mention Tanager\'s price.');
    expect(said(caught)).toMatch(/We compared notes\. Full price\. For a month\./);
    setFlag(caught.run, 'market-carmela-bought', 2);
    expect(marketPrice(caught.run, 'carmela', 800)).toBe(800);
    expect(scene(caught.run, 'gn-39-carmela-3-leaf-stone').labels).not.toContain('Mention Tanager\'s price.');
    // The month runs out after the next appearance.
    const next = again(again(caught.run));
    expect(marketPrice(next, 'carmela', 800)).toBe(720);
  });

  it('Tanager throws in a Berry when you pay his price', () => {
    let run = choose(market('t39-tanager'), 'gn-39-ring', 'Held Items.').run;
    run = choose(run, 'gn-39-tanager-1', 'Quick Claw (₽600).').run;
    const r = choose(run, 'gn-39-tanager-1-quick-claw', 'Pay the price.');
    expect(said(r)).toMatch(/I like you/);
    expect(said(r)).toMatch(/Berry/);
  });

  it('the hooded stallholder\'s card shows the odds; Nan shows one egg and not the other', () => {
    let run = choose(market('t39-far'), 'gn-39-ring', 'Further round the ring.').run;
    const hooded = choose(run, 'gn-39-ring-2', 'Mystery Items.').run;
    run = choose(hooded, 'gn-39-hooded-1', 'A Small Parcel (₽400).').run;
    expect(scene(run, 'gn-39-hooded-1-small').intro).toMatch(/Super Potion ×2, 50%\. Great Ball ×3, 30%\. Rare Candy, 15%\. Star Piece, 5%\./);
    const paid = choose(run, 'gn-39-hooded-1-small', 'Pay the price.');
    expect(flagOf(paid.run, 'market-parcel-small')).toBeGreaterThan(0);
    let eggs = choose(market('t39-eggs'), 'gn-39-ring', 'Further round the ring.').run;
    eggs = choose(eggs, 'gn-39-ring-2', 'Eggs.').run;
    expect(scene(eggs, 'gn-39-nan-1').intro).toMatch(/One she'll tell you about\. One she won't\./);
  });

  it('Josune\'s pen holds a first-stage Pokémon uncommon for the region; paying the fee opens the pen', () => {
    let run = market('t39-pen');
    const sp = penSpecies(run)!;
    expect(penCandidates(content, region(run))).toContain(sp);
    expect(rarityIn(content, sp, region(run))).toBe('uncommon');
    run = choose(run, 'gn-39-ring', 'Further round the ring.').run;
    run = choose(run, 'gn-39-ring-2', 'On round the ring.').run;
    run = choose(run, 'gn-39-ring-3', 'Rare Encounters.').run;
    run = choose(run, 'gn-39-josune', 'The Pen (₽600).').run;
    run = choose(run, 'gn-39-josune-pen', 'Pay the price.').run;
    const fight = choose(run, 'gn-39-pen', 'Battle it.');
    expect(fight.battle).toBe(true);
    expect(fight.run.battle!.enemyTeam[0]!.speciesId).toBe(sp);
  });

  it('the pen\'s Pokémon backs away from a party with Intimidate, and Josune won\'t sell', () => {
    let run = market('t39-shy');
    run.party[0]!.fixedAbility = 'intimidate';
    run = choose(run, 'gn-39-ring', 'Further round the ring.').run;
    run = choose(run, 'gn-39-ring-2', 'On round the ring.').run;
    run = choose(run, 'gn-39-ring-3', 'Rare Encounters.').run;
    const s = scene(run, 'gn-39-josune');
    expect(s.intro).toMatch(/backs into the far corner/);
    expect(s.labels).toEqual(['Back to the ring.']);
  });

  it('the conditional stalls: the Veteran\'s after an Operation is stopped, the Fossil Stall with a fossil Pokémon', () => {
    let run = market('t39-back');
    run = choose(run, 'gn-39-ring', 'Further round the ring.').run;
    run = choose(run, 'gn-39-ring-2', 'On round the ring.').run;
    const none = choose(structuredClone(run), 'gn-39-ring-3', 'Behind the wagons.').run;
    expect(scene(none, 'gn-39-back').labels).toEqual(['Something in the mud by a wheel.', 'Back to the ring.']);
    setFlag(run, 'team-rocket-op-stopped');
    run.party[0]!.speciesId = 'omanyte';
    const both = choose(run, 'gn-39-ring-3', 'Behind the wagons.').run;
    expect(scene(both, 'gn-39-back').labels).toEqual(['The Fossil Stall.', 'The Veteran\'s Stall.', 'Something in the mud by a wheel.', 'Back to the ring.']);
    const found = choose(both, 'gn-39-back', 'Something in the mud by a wheel.');
    expect(said(found)).toMatch(/Carmela's loupe/);
    expect(said(found)).toMatch(/Moon Stone, no charge/);
    expect(flagOf(found.run, 'market-carmela-gift')).toBe(1);
  });
});
