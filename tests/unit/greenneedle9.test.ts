// Greenneedle part 9: gn.39 The Travelling Pokémon Market, gn.40 The Pokémon Day-Care Village (tools/events/co/greenneedle-9.ts; rules in src/core/greenneedle/market.ts).
import { describe, expect, it } from 'vitest';
import type { PokemonInstance, RunState } from '../../src/core/state';
import { createPokemon } from '../../src/core/pokemon';
import { hatchEgg } from '../../src/core/eggs';
import { pairBondLevel } from '../../src/core/bond';
import { atDaycare, compatible, unflinching, unflinchingStart } from '../../src/core/greenneedle/daycare';
import { content } from './helpers';
import { chooseEvent, conditionMet } from '../../src/core/events';
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

// ---------------------------------------------------------------------------------------------------------------------
// gn.40 The Pokémon Day-Care Village (core/greenneedle/daycare.ts)
// ---------------------------------------------------------------------------------------------------------------------
const addMon = (run: RunState, species: string, level = 20): PokemonInstance => {
  const mon = createPokemon(content, species, level, `p${run.nextUid}`);
  run.nextUid += 1;
  run.party.push(mon);
  return mon;
};
function village(seed: string, prep?: (run: RunState) => void): RunState {
  const run = gnRun(seed);
  run.money = 20000;
  prep?.(run);
  open(run, 'gn-40-door');
  return choose(run, 'gn-40-door', 'Walk into the village.').run;
}
/** Picks a choice that asks for a party Pokémon. */
function choosePick(run: RunState, eventId: string, label: string, uid: string): RunState {
  const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
  const side = here.sides.find((x) => x.kind === 'event' && !x.used && x.eventId === eventId)!;
  return chooseEvent(content, run, side.id, scene(run, eventId).labels.indexOf(label), uid).run;
}
const newestEgg = (run: RunState) => run.eggs[run.eggs.length - 1]!;

describe('gn.40 The Pokémon Day-Care Village', () => {
  it('opens with Mr. Holloway; the first visit counts, and the adoption egg and Bronwen\'s pair are the first of each', () => {
    const run = village('t40-open');
    expect(flagOf(run, 'daycare-visits')).toBe(1);
    expect(flagOf(run, 'daycare-egg')).toBe(1);
    expect(flagOf(run, 'daycare-pair')).toBe(1);
    expect(scene(run, 'gn-40-square').labels).toEqual(['The day-care.', 'Walk round the village.', 'The edge of the village.', 'Leave the village.']);
  });

  it('two left for a region come home a level a stage stronger, knowing each other, with an egg if they could', () => {
    let run = village('t40-leave', (r) => {
      addMon(r, 'eevee');
      addMon(r, 'growlithe');
    });
    const [, a, b] = run.party as [PokemonInstance, PokemonInstance, PokemonInstance];
    run = choose(run, 'gn-40-square', 'The day-care.').run;
    run = choose(run, 'gn-40-daycare', 'Leave two Pokémon.').run;
    run = choosePick(run, 'gn-40-leave-1', 'This one.', a.uid);
    run = choosePick(run, 'gn-40-leave-2', 'This one.', b.uid);
    expect(run.party.map((m) => m.uid)).not.toContain(a.uid);
    expect(atDaycare(run).map((m) => m.uid).sort()).toEqual([a.uid, b.uid].sort());
    expect(scene(run, 'gn-40-daycare').labels).not.toContain('Leave two Pokémon.');
    // A region later: three stages away.
    setFlag(run, 'daycare-at', flagOf(run, 'daycare-at') - 3);
    setFlag(run, 'daycare-region', 0);
    const levels = [a.level, b.level];
    open(run, 'gn-40-return');
    const r = choose(run, 'gn-40-return', 'Take them home.');
    const home = r.run.party.filter((m) => m.uid === a.uid || m.uid === b.uid);
    expect(home.map((m) => m.level)).toEqual(levels.map((l) => l + 3));
    expect(said(r)).toMatch(/They know each other now/);
    expect(pairBondLevel(r.run, a.uid, b.uid)).toBe(2);
    expect(said(r)).toMatch(/there's an egg waiting/);
    const egg = newestEgg(r.run);
    const hatched = hatchEgg(content, r.run, egg);
    expect(hatched.marks).toContain('looks for the Old Dog in every town');
    expect(hatched.marks).toContain('a card came from the Day-Care Village, with a pawprint in ink');
    expect(hatched.gn).toContain(`child-of:${a.uid}`);
  });

  it('a pair that could never make an egg comes home without one', () => {
    let run = village('t40-noegg', (r) => {
      addMon(r, 'eevee');
      addMon(r, 'magikarp');
    });
    const [, a, b] = run.party as [PokemonInstance, PokemonInstance, PokemonInstance];
    expect(compatible(content, a, b)).toBe(false);
    run = choose(run, 'gn-40-square', 'The day-care.').run;
    run = choose(run, 'gn-40-daycare', 'Leave two Pokémon.').run;
    run = choosePick(run, 'gn-40-leave-1', 'This one.', a.uid);
    run = choosePick(run, 'gn-40-leave-2', 'This one.', b.uid);
    const eggs = run.eggs.length;
    setFlag(run, 'daycare-region', 0);
    open(run, 'gn-40-return');
    const r = choose(run, 'gn-40-return', 'Take them home.');
    expect(r.run.eggs.length).toBe(eggs);
    expect(said(r)).not.toMatch(/egg waiting/);
  });

  it('the adoption: the answer shapes the hatchling (held: Bond higher; "No.": bold; "A bit.": hatches sooner)', () => {
    let run = choose(village('t40-adopt'), 'gn-40-square', 'The edge of the village.').run;
    run = choose(run, 'gn-40-edge', 'The egg with a story.').run;
    expect(scene(run, 'gn-40-adopt-1').intro).toMatch(/What'll you do the first time it's frightened again/);
    const held = choose(run, 'gn-40-adopt-1', 'Hold it.');
    expect(said(held)).toMatch(/We don't sell these ones\. We place them\./);
    const mon = hatchEgg(content, held.run, newestEgg(held.run));
    expect(mon.friendship).toBeGreaterThanOrEqual(150);
    expect(scene(held.run, 'gn-40-edge').labels).not.toContain('The egg with a story.');
    const door = village('t40-door', (r) => setFlag(r, 'daycare-visits', 1));
    expect(flagOf(door, 'daycare-egg')).toBe(2);
    let d = choose(door, 'gn-40-square', 'The edge of the village.').run;
    d = choose(d, 'gn-40-edge', 'The egg with a story.').run;
    d = choose(d, 'gn-40-adopt-2', 'No.').run;
    expect(hatchEgg(content, d, newestEgg(d)).nature).toBe('bold');
    const late = village('t40-late', (r) => setFlag(r, 'daycare-visits', 2));
    let c = choose(late, 'gn-40-square', 'The edge of the village.').run;
    c = choose(c, 'gn-40-edge', 'The egg with a story.').run;
    c = choose(c, 'gn-40-adopt-3', 'A bit.').run;
    expect(newestEgg(c).left).toBe(1);
    expect(hatchEgg(content, c, newestEgg(c)).marks).toContain('hatched early, and knows it');
  });

  it('"Let it see I\'m not afraid": it can\'t be made to flinch in its first battle, and only that one', () => {
    let run = choose(village('t40-brave'), 'gn-40-square', 'The edge of the village.').run;
    run = choose(run, 'gn-40-edge', 'The egg with a story.').run;
    run = choose(run, 'gn-40-adopt-1', 'Let it see I\'m not afraid.').run;
    const mon = hatchEgg(content, run, newestEgg(run));
    run.party.push(mon);
    unflinchingStart(run);
    expect(unflinching(mon)).toBe(true);
    unflinchingStart(run);
    expect(unflinching(mon)).toBe(false);
  });

  it('the hatching: holding it needs good Bond across the party', () => {
    let run = choose(village('t40-hatch'), 'gn-40-square', 'Walk round the village.').run;
    run = choose(run, 'gn-40-village', 'On through the village.').run;
    run = choose(run, 'gn-40-village-2', 'Wait by the step.').run;
    expect(scene(run, 'gn-40-hatch').labels).toEqual(['Cheer.', 'Stay at the back.', 'Ask to hold it.']);
    const cold = structuredClone(run);
    for (const m of cold.party) m.friendship = 60;
    const no = choose(cold, 'gn-40-hatch', 'Ask to hold it.');
    expect(said(no)).toMatch(/Not today, love/);
    for (const m of run.party) m.friendship = 120;
    const yes = choose(run, 'gn-40-hatch', 'Ask to hold it.');
    expect(said(yes)).toMatch(/puts it in your arms/);
    expect(scene(yes.run, 'gn-40-village-2').labels).not.toContain('Wait by the step.');
  });

  it('the breeding board pays a rare item for a calm one, once a visit', () => {
    let run = choose(village('t40-board'), 'gn-40-square', 'Walk round the village.').run;
    run = choose(run, 'gn-40-village', 'On through the village.').run;
    run = choose(run, 'gn-40-village-2', 'The breeding board.').run;
    run.party[0]!.nature = 'calm';
    const r = choose(run, 'gn-40-board', 'One with a calm nature.');
    expect(r.success).toBe(true);
    expect(scene(r.run, 'gn-40-board').labels).not.toContain('One with a calm nature.');
  });

  it('Bronwen\'s pair: the sign names it; a Nidoran pair brings an egg with both lines\' best moves', () => {
    let run = choose(village('t40-bronwen'), 'gn-40-square', 'The edge of the village.').run;
    run = choose(run, 'gn-40-edge', 'Bronwen\'s caravan.').run;
    expect(scene(run, 'gn-40-bronwen-1').intro).toMatch(/A NIDORAN♀ AND A NIDORAN♂/);
    addMon(run, 'nidoran-f');
    addMon(run, 'nidoran-m');
    const r = choose(run, 'gn-40-bronwen-1', 'Show her the pair.');
    expect(r.success).toBe(true);
    const mon = hatchEgg(content, r.run, newestEgg(r.run));
    expect(mon.moves.map((m) => m.id)).toEqual(expect.arrayContaining(['earth-power', 'megahorn']));
    expect(scene(r.run, 'gn-40-bronwen-1').intro).toMatch(/already given you this visit's/);
  });
});
