// Fixes that bring gn.39–gn.43 in line with GREENNEEDLE_REWORKED_PLACED_9.md (audit part 5).
import { describe, expect, it } from 'vitest';
import type { PokemonInstance, RunState } from '../../src/core/state';
import { createPokemon } from '../../src/core/pokemon';
import { hatchEgg } from '../../src/core/eggs';
import { chooseEvent, conditionMet } from '../../src/core/events';
import { inheritedHabit, DAYCARE_LED } from '../../src/core/greenneedle/daycare';
import { marketOffer, marketPrice, marketPriceToken, marketUndercut } from '../../src/core/greenneedle/market';
import { MUSEUM_SETS } from '../../src/core/greenneedle/museum';
import { brainRecord, lastTeam, lastTeamToken } from '../../src/core/greenneedle/frontier';
import { auctionArrive, auctionOpen } from '../../src/core/greenneedle/auction';
import { gathering, reunionArrive } from '../../src/core/greenneedle/reunion';
import { borrowEnd } from '../../src/core/greenneedle/borrowed';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';

const said = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');
const addMon = (run: RunState, species: string, level = 20): PokemonInstance => {
  const mon = createPokemon(content, species, level, `p${run.nextUid}`);
  run.nextUid += 1;
  run.party.push(mon);
  return mon;
};
function market(seed: string, prep?: (run: RunState) => void): RunState {
  const run = gnRun(seed);
  run.money = 20000;
  prep?.(run);
  open(run, 'gn-39-door');
  return choose(run, 'gn-39-door', 'Walk into the ring.').run;
}
const toFireStone = (run: RunState): RunState => choose(choose(run, 'gn-39-ring', 'Evolution Stones.').run, 'gn-39-carmela-1', 'Fire Stone (₽800).').run;

describe('gn.39 fixes', () => {
  it('haggling: the wince offer (80%, the floor) is taken; 75% is below it and refused; 75% is taken after paying at the honest shop', () => {
    let run = choose(toFireStone(market('f39-haggle')), 'gn-39-carmela-1-fire-stone', 'Offer less.').run;
    expect(scene(run, 'gn-39-carmela-1-fire-stone-haggle').intro).toMatch(/At ₽720, nothing\. At ₽640, a wince\. At ₽600, they stop breathing\./);
    const before = run.money;
    const wince = choose(structuredClone(run), 'gn-39-carmela-1-fire-stone-haggle', 'Offer ₽640.');
    expect(said(wince)).toMatch(/a handshake/);
    expect(before - wince.run.money).toBe(640);
    expect(flagOf(wince.run, 'market-carmela-low')).toBe(0);
    const low = choose(run, 'gn-39-carmela-1-fire-stone-haggle', 'Offer ₽600.');
    expect(said(low)).toMatch(/They've stopped smiling/);
    expect(low.run.money).toBe(before);
    // The rule itself: exactly the floor is accepted, one coin under is not; a player who can't pay keeps the lot on the counter.
    const r = gnRun('f39-floor');
    r.money = 5000;
    expect(marketOffer(r, 'dace', 1000, 80).price).toBe(800);
    expect(marketOffer(r, 'dace', 1000, 79).price).toBeNull();
    setFlag(r, 'honest-shop');
    expect(marketOffer(r, 'nan', 1000, 75).price).toBe(750);
    r.money = 10;
    expect(marketOffer(r, 'nan', 1000, 90)).toEqual({ price: null, line: 'You count it out twice. You\'re short.' });
  });

  it('every price is shown before the player pays: the lot shows what this player pays, after discounts', () => {
    let run = toFireStone(market('f39-shown'));
    expect(scene(run, 'gn-39-carmela-1-fire-stone').intro).toMatch(/The asking price: \*\*₽800\*\*\. Your price today: \*\*₽800\*\*\./);
    setFlag(run, 'market-carmela-bought', 1);
    expect(scene(run, 'gn-39-carmela-1-fire-stone').intro).toMatch(/Your price today: \*\*₽720\*\*\./);
    run = choose(run, 'gn-39-carmela-1-fire-stone', 'Mention Tanager\'s price.').run;
    expect(scene(run, 'gn-39-carmela-1-fire-stone').intro).toMatch(/Your price today: \*\*₽680\*\*\./);
    expect(marketPriceToken(run, 'carmela', 800)).toBe('₽680');
    expect(marketPrice(run, 'carmela', 800)).toBe(680);
  });

  it('the rivals name real prices when they undercut', () => {
    const run = gnRun('f39-rivals');
    expect(marketUndercut(run, 'tanager', 800)).toBe('**Tanager:** "*₽800?* For a rock with a leaf in it? ₽760. And it\'s a nicer leaf."');
    expect(marketUndercut(run, 'carmela', 800)).toMatch(/He said \*what\?\* ₽760\./);
    // Once per appearance, each way.
    expect(marketUndercut(run, 'tanager', 800)).toMatch(/I matched it once/);
  });

  it('the Veteran\'s Stall opens after a Hideout cleared, as well as after an Operation stopped; not without either', () => {
    const veteran = (run: RunState): boolean => {
      let r = choose(run, 'gn-39-ring', 'Further round the ring.').run;
      r = choose(r, 'gn-39-ring-2', 'On round the ring.').run;
      r = choose(r, 'gn-39-ring-3', 'Behind the wagons.').run;
      return scene(r, 'gn-39-back').labels.includes('The Veteran\'s Stall.');
    };
    expect(veteran(market('f39-vet-none'))).toBe(false);
    expect(veteran(market('f39-vet-hideout', (r) => setFlag(r, 'hideout-reward')))).toBe(true);
    expect(veteran(market('f39-vet-op', (r) => setFlag(r, 'team-rocket-op-stopped')))).toBe(true);
  });

  it('the Farfetch\'d greeting no longer hides the honest shop\'s word: each has its own room', () => {
    let run = market('f39-notes', (r) => {
      setFlag(r, 'balthasar-placed');
      setFlag(r, 'honest-shop');
    });
    run = choose(run, 'gn-39-ring', 'Further round the ring.').run;
    expect(scene(run, 'gn-39-ring-2').intro).toMatch(/Your Farfetch'd is recognised/);
    run = choose(run, 'gn-39-ring-2', 'On round the ring.').run;
    expect(scene(run, 'gn-39-ring-3').intro).toMatch(/People here smile at you a moment longer/);
  });
});

describe('gn.40 fixes', () => {
  function toEggMoves(run: RunState): RunState {
    open(run, 'gn-40-door');
    let r = choose(run, 'gn-40-door', 'Walk into the village.').run;
    r = choose(r, 'gn-40-square', 'The day-care.').run;
    return choose(r, 'gn-40-daycare', 'Mrs. Holloway\'s egg moves.').run;
  }
  const pay = (run: RunState) => content.events.get('gn-40-eggmove')!.choices[0]!;

  it('Mrs. Holloway takes no money when the lead has no egg move left to learn', () => {
    const run = gnRun('f40-none');
    run.money = 5000;
    const lead = run.party[0]!;
    // Give the lead every egg move of its family (nothing left to learn).
    const family = content.eggMoves.get(lead.speciesId) ?? [];
    const withAll = toEggMoves(run);
    const can = pay(withAll).requires.every((c) => conditionMet(content, withAll, c));
    const usable = family.filter((id) => content.moves.get(id)?.supported && !lead.moves.some((m) => m.id === id));
    expect(can).toBe(usable.length > 0);
    // A lead with no egg moves at all (a Ditto): locked, and she says why.
    const ditto = gnRun('f40-ditto');
    ditto.money = 5000;
    ditto.party = [createPokemon(content, 'ditto', 20, 'p-ditto')];
    const at = toEggMoves(ditto);
    expect(pay(at).requires.every((c) => conditionMet(content, at, c))).toBe(false);
    expect(scene(at, 'gn-40-eggmove').intro).toMatch(/I won't take your money for that/);
    // Short of money, even with a move to learn: locked.
    const poor = gnRun('f40-poor');
    poor.money = 999;
    const atPoor = toEggMoves(poor);
    expect(pay(atPoor).requires.every((c) => conditionMet(content, atPoor, c))).toBe(false);
  });

  it('inherited habits: one move over and over (its stance), led the party, or left at the day-care', () => {
    const run = gnRun('f40-habit');
    const parent = run.party[0]!;
    const history = (moves: Record<string, number>): void => {
      run.story.histories[parent.uid] = { ...(run.story.histories[parent.uid] ?? {}), moves } as never;
    };
    history({});
    expect(inheritedHabit(run, parent)).toEqual({ shape: 'habit-daycare' });
    parent.gn = [DAYCARE_LED];
    expect(inheritedHabit(run, parent)).toEqual({ shape: 'habit-lead' });
    // Nine uses is not "over and over"; ten is; ten out of twenty is not "more than every other move together".
    history({ tackle: 9 });
    expect(inheritedHabit(run, parent).shape).toBe('habit-lead');
    history({ tackle: 10, ember: 9 });
    expect(inheritedHabit(run, parent)).toEqual({ shape: 'habit-stance', move: 'tackle' });
    history({ tackle: 10, ember: 10 });
    expect(inheritedHabit(run, parent).shape).toBe('habit-lead');
  });

  it('a day-care egg from a parent that led the party, or fought with one move, hatches with that habit', () => {
    const leave = (seed: string, prep: (run: RunState, a: PokemonInstance) => void, first: 'lead' | 'second'): PokemonInstance => {
      let run = gnRun(seed);
      const eevee = addMon(run, 'eevee');
      addMon(run, 'growlithe');
      addMon(run, 'pidgey');
      if (first === 'lead') run.party = [eevee, ...run.party.filter((m) => m !== eevee)];
      prep(run, eevee);
      open(run, 'gn-40-door');
      run = choose(run, 'gn-40-door', 'Walk into the village.').run;
      run = choose(run, 'gn-40-square', 'The day-care.').run;
      run = choose(run, 'gn-40-daycare', 'Leave two Pokémon.').run;
      const pick = (r: RunState, id: string, uid: string): RunState => {
        const side = r.stage!.map.nodes.find((n) => n.id === r.stage!.current)!.sides.find((x) => x.kind === 'event' && !x.used && x.eventId === id)!;
        return chooseEvent(content, r, side.id, 0, uid).run;
      };
      run = pick(run, 'gn-40-leave-1', eevee.uid);
      run = pick(run, 'gn-40-leave-2', run.party.find((m) => m.speciesId === 'growlithe')!.uid);
      setFlag(run, 'daycare-region', 0);
      open(run, 'gn-40-return');
      const r = choose(run, 'gn-40-return', 'Take them home.');
      expect(said(r)).toMatch(/there's an egg waiting/);
      expect(r.run.party.concat(r.run.box).some((m) => m.gn?.includes(DAYCARE_LED))).toBe(false);
      return hatchEgg(content, r.run, r.run.eggs[r.run.eggs.length - 1]!);
    };
    expect(leave('f40-led', () => undefined, 'lead').marks).toContain('walks one step ahead, and keeps looking back');
    const stance = leave('f40-stance', (run, a) => {
      run.story.histories[a.uid] = { ...(run.story.histories[a.uid] ?? {}), moves: { tackle: 12, growl: 1 } } as never;
    }, 'second');
    expect(stance.marks).toContain('practises the Tackle stance, wrongly');
    expect(leave('f40-plain', () => undefined, 'second').marks).toContain('looks for the Old Dog in every town');
  });
});

describe('gn.41 fixes', () => {
  function museum(seed: string, regionIndex: number, prep?: (run: RunState) => void): RunState {
    const run = gnRun(seed);
    run.regionIndex = regionIndex;
    prep?.(run);
    open(run, 'gn-41-door');
    return choose(run, 'gn-41-door', 'Go in.').run;
  }
  const toFossils = (run: RunState): RunState => choose(choose(run, 'gn-41-foyer', 'The halls.').run, 'gn-41-halls', 'Fossils.').run;
  const toTray = (run: RunState): RunState => choose(choose(run, 'gn-41-foyer', 'The activities desk.').run, 'gn-41-desk', 'Fossil identification.').run;

  it('each region\'s museum is different: its own bones, plaques and Relics, in turn', () => {
    expect(MUSEUM_SETS).toBe(3);
    const sets = [0, 1, 2, 3].map((i) => flagOf(museum(`f41-set-${i}`, i), 'museum-set'));
    expect(sets).toEqual([1, 2, 3, 1]);
    // The second museum: a Lileep on the tray, and its clue on the plaques.
    const second = museum('f41-second', 1);
    expect(scene(toFossils(second), 'gn-41-fossils').intro).toMatch(/Lileep, a stalk of rings, rooted\./);
    expect(scene(toFossils(museum('f41-first', 0)), 'gn-41-fossils').intro).toMatch(/Omanyte, the shell coils right\./);
    let tray = choose(toTray(second), 'gn-41-tray', 'Bone one.').run;
    expect(scene(tray, 'gn-41-bone-1-s2').labels).toEqual(['Omanyte.', 'Lileep.', 'Anorith.', 'Put it back.']);
    const right = choose(structuredClone(tray), 'gn-41-bone-1-s2', 'Lileep.');
    expect(right.run.pending.some((p) => 'mon' in p && p.mon.speciesId === 'lileep')).toBe(true);
    const wrong = choose(tray, 'gn-41-bone-1-s2', 'Omanyte.');
    expect(said(wrong)).toMatch(/Not quite, dear/);
    expect(wrong.run.pending.some((p) => 'mon' in p)).toBe(false);
    tray = wrong.run;
    expect(scene(tray, 'gn-41-tray').labels).not.toContain('Bone one.');
    // The third museum: a different Relic behind the case of small ones.
    let third = toFossils(museum('f41-third', 2));
    third = choose(third, 'gn-41-fossils', 'Lean on the case of small ones.').run;
    expect(scene(third, 'gn-41-hidden-case-s3').intro).toMatch(/a copper coin/);
    const took = choose(third, 'gn-41-hidden-case-s3', 'Take it.');
    expect(said(took)).toMatch(/Relic Copper/);
  });

  it('every bone and hidden room of every collection exists and gives a real thing', () => {
    for (const set of [1, 2, 3]) {
      const suffix = set === 1 ? '' : `-s${set}`;
      for (const n of [1, 2, 3, 4, 5]) {
        const room = content.events.get(`gn-41-bone-${n}${suffix}`)!;
        expect(room.choices).toHaveLength(4);
      }
      for (const id of ['case', 'tile', 'painting']) expect(content.events.get(`gn-41-hidden-${id}${suffix}`)!.choices.map((c) => c.label)).toEqual(['Take it.', 'Tell the curator.']);
    }
  });

  it('returning the museum\'s relics (SF129) opens the locked gallery as thanks; not otherwise', () => {
    const giving = content.events.get('museum-return')!.choices.filter((c) => c.label.startsWith('Return a'));
    expect(giving).toHaveLength(2);
    for (const c of giving) expect(JSON.stringify(c)).toContain('"key":"museum-relics-returned"');
    const thanked = museum('f41-relics', 0, (r) => setFlag(r, 'museum-relics-returned'));
    expect(scene(thanked, 'gn-41-foyer').labels).toContain('The door the colour of the wall.');
    expect(scene(museum('f41-no-relics', 0), 'gn-41-foyer').labels).not.toContain('The door the colour of the wall.');
  });
});

describe('gn.42 fixes', () => {
  it('a Brain remembers the last team, by species, in order; a new meeting replaces it', () => {
    const run = gnRun('f42-team');
    addMon(run, 'arcanine', 30);
    addMon(run, 'lapras', 25);
    const first = run.party.map((m) => m.speciesId);
    brainRecord(run, 'tower', 1);
    expect(lastTeam(run, 'tower')).toEqual(first);
    expect(lastTeam(run, 'dome')).toEqual([]);
    expect(lastTeamToken(content, run, 'dome')).toBe('your team');
    expect(lastTeamToken(content, run, 'tower')).toMatch(/, the Arcanine and the Lapras$/);
    run.party = [run.party[2]!];
    brainRecord(run, 'tower', 2);
    expect(lastTeam(run, 'tower')).toEqual(['lapras']);
    expect(lastTeamToken(content, run, 'tower')).toBe('the Lapras');
  });

  it('the Brain says the team back at the next meeting', () => {
    let run = gnRun('f42-says');
    addMon(run, 'arcanine', 30);
    brainRecord(run, 'pike', 1);
    open(run, 'gn-42-pike-brain');
    const r = choose(run, 'gn-42-pike-brain', 'Battle.');
    expect(said(r)).toMatch(/Unhealthily\." \*They count your last team off on their fingers: .*the Arcanine\.\*/);
    run = r.run;
    expect(run.battle).toBeTruthy();
  });

  it('swapping teams with the rival (gn.new.29) is heard at the Factory', () => {
    const run = gnRun('f42-swap');
    expect(flagOf(run, 'x-rival-swapped-teams')).toBe(0);
    open(run, 'gn-42-factory');
    expect(scene(run, 'gn-42-factory').intro).not.toMatch(/handled other people's Pokémon/);
    borrowEnd(content, run, 1);
    expect(flagOf(run, 'x-rival-swapped-teams')).toBe(1);
    expect(scene(run, 'gn-42-factory').intro).toMatch(/You've handled other people's Pokémon\. You'll be fine here\./);
  });

  it('the Factory swap offers each of the loser\'s three', () => {
    for (let i = 1; i <= 6; i += 1) {
      const labels = content.events.get(`gn-42-factory-swap-${i}`)!.choices.map((c) => c.label);
      expect(labels).toHaveLength(4);
      expect(labels[3]).toBe('Keep your three.');
      expect(new Set(labels).size).toBe(4);
    }
  });
});

describe('gn.43 fixes', () => {
  it('the stolen lot\'s three choices come up with the lot, without the second look at the photographs', () => {
    const run = gnRun('f43-open');
    auctionArrive(run, ['charcoal', 'fire-stone', 'helix-fossil', 'eevee', 'vulpix-alola', 'spinda'], () => 0, 1);
    setFlag(run, 'auction-stolen', 3);
    expect(flagOf(run, 'auction-spotted')).toBe(0);
    auctionOpen(run, 2);
    expect(flagOf(run, 'auction-suspect')).toBe(0);
    auctionOpen(run, 3);
    expect(flagOf(run, 'auction-suspect')).toBe(1);
    open(run, 'gn-43-lot-3');
    expect(scene(run, 'gn-43-lot-3').labels).toEqual(['Buy it, and return it.', 'Stand up and say so.', 'Say nothing.']);
    auctionOpen(run, 4);
    open(run, 'gn-43-lot-4');
    expect(scene(run, 'gn-43-lot-4').labels).toEqual(['Watch the bidding open.']);
  });

  it('the fourth clue: a player who has been to a museum this run has seen the lot\'s shape before', () => {
    const run = gnRun('f43-clue');
    auctionArrive(run, ['charcoal', 'fire-stone', 'helix-fossil', 'eevee', 'vulpix-alola', 'spinda'], () => 0, 1);
    setFlag(run, 'auction-stolen', 2);
    auctionOpen(run, 2);
    expect(scene(run, 'gn-43-lot-2').intro).toMatch(/grey gloves/);
    expect(scene(run, 'gn-43-lot-2').intro).not.toMatch(/an empty case in a museum/);
    setFlag(run, 'museum-visits');
    expect(scene(run, 'gn-43-lot-2').intro).toMatch(/grey gloves.*an empty case in a museum/);
    expect(scene(run, 'gn-43-lot-1').intro).not.toMatch(/an empty case in a museum/);
  });

  it('"Say nothing.": the lot is seen later, in the wrong hands, once', () => {
    const seat = (run: RunState) => {
      setFlag(run, 'auction-at', 0);
      open(run, 'gn-43-door');
      return choose(run, 'gn-43-door', 'Take a seat.');
    };
    const clean = seat(gnRun('f43-clean'));
    expect(said(clean)).not.toMatch(/two grunts/);
    const silent = gnRun('f43-silent');
    setFlag(silent, 'auction-silent');
    const first = seat(silent);
    expect(said(first)).toMatch(/two grunts of the team that works this region.*the lot you kept your paddle in your lap for/);
    expect(said(seat(first.run))).not.toMatch(/two grunts/);
  });
});

describe('gn.39 and gn.42 afterstories at the Final Reunion', () => {
  it('the market\'s wagons come as guests, and the Brains have a table; neither without the visit or a Symbol', () => {
    const none = gnRun('f61-none');
    reunionArrive(content, none);
    const ids = (run: RunState): string[] => gathering(run)!.att.map((a) => a.id);
    expect(ids(none)).not.toContain('market');
    expect(ids(none)).not.toContain('brains');
    const run = gnRun('f61-guests');
    setFlag(run, 'market-visits', 2);
    setFlag(run, 'frontier-symbols', 1);
    reunionArrive(content, run);
    expect(ids(run)).toEqual(expect.arrayContaining(['market', 'brains']));
    expect(gathering(run)!.att.find((a) => a.id === 'market')!.line).toMatch(/Nothing's for sale\. They've come as guests\./);
    expect(gathering(run)!.att.find((a) => a.id === 'brains')!.line).toMatch(/arguing about whose building is hardest/);
  });
});
