// Greenneedle part 3 (GREENNEEDLE_REWORKED_PLACED_3.md): gn.11 to gn.15, played through the real engine.
import { describe, expect, it } from 'vitest';
import { chainRooms, PSEUDO_CHAINS } from '../../src/core/dungeon/pseudo';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { chooseEvent, conditionMet } from '../../src/core/events';
import { takeTurn } from '../../src/core/run';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { reinforcementDue } from '../../src/core/raid/raid';
import { FIFTH_HIT, FIFTH_LINES, FIFTH_WAITED, waitOffered } from '../../src/core/greenneedle/fifth';
import { choose, flagOf, gnRun, lose, open, openSide, scene, setFlag, win } from './helpers/gnPlay';

/** Picks a choice that has a skill prompt, with the given grade (the helper's `choose` plays it as a miss). */
const graded = (run: RunState, eventId: string, label: string, grade: 'miss' | 'ok' | 'good' | 'perfect' = 'ok') => {
  const side = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.sides.find((x) => !x.used && x.eventId === eventId)!;
  return chooseEvent(content, run, side.id, scene(run, eventId).labels.indexOf(label), undefined, grade);
};
const teach = (run: RunState, i: number, ...moves: string[]): void => {
  run.party[i]!.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
};
const addMon = (run: RunState, species: string, ...moves: string[]): void => {
  const mon = createPokemon(content, species, run.party[0]!.level, `p-test-${species}`);
  if (moves.length) mon.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  run.party.push(mon);
};

describe('gn.11 Kaiju Tentacruel', () => {
  const start = (seed: string, boats = false): RunState => {
    const run = gnRun(seed);
    open(run, 'gn-11-harbour');
    return choose(run, 'gn-11-harbour', boats ? 'Ask Ffion for the boats.' : 'Go straight to the breakwater.').run;
  };

  it('a must-see at step 14 (window 12 to 17), instead of the battle, needs water; the raid boss has the doc\'s four moves and calls Tentacool at each bar', () => {
    expect(content.coPlacement!.get('gn-11-harbour')).toMatchObject({ home: 14, window: [12, 17], sits: 'must-see', attaches: 'instead', earliest: 5 });
    const raid = content.raids.raids.find((r) => r.id === 'kaiju-tentacruel')!;
    expect(raid.moves).toEqual(['wrap', 'acid-armor', 'hydro-pump', 'tidal-surge']);
    expect(raid.calls).toEqual({ species: 'tentacool', at: [0.75, 0.5, 0.25] });
    expect(content.moves.get('tidal-surge')).toMatchObject({ type: 'water', effects: { clearHazards: 'both' } });
    expect(content.events.get('cs-kanto-vermilion-kaiju')!.canon).toBe('cs.kanto.vermilion.kaiju');
  });

  it('rescues: a Water- or Flying-type gets someone off in one turn, others take two; four turns in all', () => {
    let run = start('gn11-a');
    run.party = run.party.slice(0, 1);
    const fire = choose(run, 'gn-11-breakwater', 'Get Swimmer Bettany off the post.');
    expect(flagOf(fire.run, 'kaiju-turns')).toBe(2);
    run = start('gn11-b');
    addMon(run, 'psyduck');
    const water = choose(run, 'gn-11-breakwater', 'Get Swimmer Bettany off the post.');
    expect(flagOf(water.run, 'kaiju-turns')).toBe(1);
    expect(flagOf(water.run, 'kaiju-rescued')).toBe(1);
    setFlag(water.run, 'kaiju-turns', 4);
    expect(scene(water.run, 'gn-11-breakwater').labels).toEqual(['Hold the shallows.']);
  });

  it('Old Ned ashore hooks one Tentacool out: the swarm is one, not two; losing it is the lost ending and the run goes on', () => {
    let run = start('gn11-c');
    run = choose(run, 'gn-11-breakwater', 'Reach Old Ned on his rock.').run;
    run = choose(run, 'gn-11-breakwater', 'Hold the shallows.').run;
    const single = choose(run, 'gn-11-swarm', 'Fight the swarm.');
    expect(single.run.battle!.enemyTeam.length).toBe(1);
    const lost = lose(single.run);
    expect(lost.phase).toBe('map');
    expect(flagOf(lost, 'kaiju-lost')).toBe(1);
    expect(openSide(lost)?.eventId).toBe('gn-11-retreat');
    let other = start('gn11-d');
    other = choose(other, 'gn-11-breakwater', 'Hold the shallows.').run;
    expect(choose(other, 'gn-11-swarm', 'Fight the swarm.').run.battle!.enemyTeam.length).toBe(2);
  });

  const toWall = (seed: string): RunState => {
    let run = start(seed);
    run = choose(run, 'gn-11-breakwater', 'Hold the shallows.').run;
    return win(choose(run, 'gn-11-swarm', 'Fight the swarm.').run);
  };

  it('pylons need a Fighting, Rock or Steel move: each one +1 Attack for the boss; with the Sailor ashore the stun lasts longer', () => {
    let run = toWall('gn11-e');
    teach(run, 0, 'tackle');
    expect(scene(run, 'gn-11-seawall').labels).toEqual(['Follow it to the reef.']);
    teach(run, 0, 'rock-throw');
    setFlag(run, 'kaiju-sailor');
    run = choose(run, 'gn-11-seawall', 'Drop a pylon on it.').run;
    run = choose(run, 'gn-11-seawall', 'Drop a pylon on it.').run;
    expect(flagOf(run, 'kaiju-pylons')).toBe(2);
    expect(flagOf(run, 'kaiju-braced')).toBe(2);
    run = choose(run, 'gn-11-seawall', 'Follow it to the reef.').run;
    const fight = choose(run, 'gn-11-reef', 'Break its last shield.').run;
    const boss = fight.battle!.enemyTeam[0]!;
    expect(fight.battle!.raid).toBeTruthy();
    expect(fight.battle!.enemyStages.atk).toBe(2);
    expect(boss.hp).toBeLessThan(maxHp(content, boss));
    expect(boss.moves.map((m) => m.id)).toEqual(['wrap', 'acid-armor', 'hydro-pump', 'tidal-surge']);
    // At its first shield bar it calls a Tentacool.
    boss.hp = Math.floor(maxHp(content, boss) * 0.7);
    expect(reinforcementDue(content, fight.battle!)?.speciesId).toBe('tentacool');
  });

  it('defeat it: the Huge Power Tentacool with Liquidation, a Poison Barb and Mystic Water; the float can still be taken', () => {
    let run = toWall('gn11-f');
    run = choose(run, 'gn-11-seawall', 'Follow it to the reef.').run;
    const before = run.party.length;
    run = win(choose(run, 'gn-11-reef', 'Break its last shield.').run);
    expect(flagOf(run, 'kaiju-won')).toBe(1);
    expect(flagOf(run, 'kanto-kaiju-won')).toBe(1);
    const gift = [...run.party, ...run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.speciesId === 'tentacool' && m.fixedAbility === 'huge-power');
    expect(gift?.fixedAbility).toBe('huge-power');
    expect(gift?.moves.some((m) => m.id === 'liquidation')).toBe(true);
    expect(run.party.length + run.pending.length).toBeGreaterThan(before);
    expect(scene(run, 'gn-11-sinks').labels).toEqual(['Take the float with the stamp.', 'Leave the harbour.']);
    const stamp = choose(run, 'gn-11-sinks', 'Take the float with the stamp.');
    expect(stamp.text).toContain('PROPERTY OF');
    expect(flagOf(stamp.run, 'kaiju-stamp')).toBe(1);
  });

  it('free the injured one: two turns inside the raid; the cutter is out of the fight while the rest protect it; that Tentacool joins once', () => {
    let run = toWall('gn11-g');
    run = choose(run, 'gn-11-seawall', 'Follow it to the reef.').run;
    teach(run, 0, 'tackle');
    for (const m of run.party.slice(1)) m.moves = [{ id: 'tackle', pp: 35 }];
    expect(scene(run, 'gn-11-reef').labels).not.toContain('Cut the net.');
    teach(run, 0, 'metal-claw');
    // A cutter alone has nobody to protect it: the net can't be cut.
    const alone = structuredClone(run);
    alone.party = alone.party.slice(0, 1);
    expect(scene(alone, 'gn-11-reef').labels).not.toContain('Cut the net.');
    if (run.party.length < 2) addMon(run, 'rattata', 'tackle');
    const cutter = run.party[0]!.uid;
    const size = run.party.length;
    const cut = choose(run, 'gn-11-reef', 'Cut the net.');
    // The Kaiju is fought: this is the raid, won by holding out two turns. Nothing is freed yet.
    expect(cut.battle).toBe(true);
    expect(cut.run.battle!.raid).toBeTruthy();
    expect(cut.run.battle!.eventRule?.surviveTurns).toBe(2);
    expect(flagOf(cut.run, 'kaiju-freed')).toBe(0);
    expect(cut.run.party.some((m) => m.uid === cutter)).toBe(false);
    expect(cut.run.party.length).toBe(size - 1);
    expect(cut.run.box.some((m) => m.uid === cutter)).toBe(true);
    run = win(cut.run);
    expect(flagOf(run, 'kaiju-freed')).toBe(1);
    expect([...run.party, ...run.box].filter((m) => m.uid === cutter).length).toBe(1);
    expect(run.party.some((m) => m.uid === cutter) || run.party.length === 6).toBe(true);
    setFlag(run, 'kaiju-girl');
    const kept = choose(run, 'gn-11-freed', 'Hold out a hand.');
    expect([kept.text, ...kept.changes].join(' ')).toContain('I said it was looking');
    const all = [...kept.run.party, ...kept.run.box, ...kept.run.pending.flatMap((x) => (x.kind === 'caught' ? [x.mon] : []))];
    expect(all.filter((m) => m.speciesId === 'tentacool' && m.fixedAbility === 'huge-power').length).toBe(1);
    const ret = content.events.get('gn-11-return')!;
    const battle = ret.choices[0]!.success.battle as { ally?: string };
    expect(battle.ally).toBe('tentacruel');
  });

  it('losing while the net is being cut is the lost ending: the cutter comes back, nothing is freed, and the stage\'s shops shut', () => {
    let run = toWall('gn11-h');
    run = choose(run, 'gn-11-seawall', 'Follow it to the reef.').run;
    teach(run, 0, 'metal-claw');
    if (run.party.length < 2) addMon(run, 'rattata', 'tackle');
    const cutter = run.party[0]!.uid;
    const far = run.stage!.map.nodes.find((n) => n.id !== run.stage!.current)!;
    far.sides.push({ id: 'test-shop', kind: 'shop', used: false });
    run = lose(choose(run, 'gn-11-reef', 'Cut the net.').run);
    expect(run.phase).not.toBe('over');
    expect(flagOf(run, 'kaiju-freed')).toBe(0);
    expect(flagOf(run, 'kaiju-lost')).toBe(1);
    expect(run.party.some((m) => m.uid === cutter)).toBe(true);
    expect(run.stage!.map.nodes.flatMap((n) => n.sides).find((x) => x.id === 'test-shop')!.used).toBe(true);
  });

  it('freed, and the Polluted Factory left running: it comes back to the harbour angry (a giant, Attack +1, no catching); not otherwise', () => {
    const e = content.events.get('gn-11-anger')!;
    const run = gnRun('gn11-anger');
    const ok = (r: RunState) => e.requires.every((c) => conditionMet(content, r, c));
    setFlag(run, 'kaiju-at', 0);
    expect(ok(run)).toBe(false);
    setFlag(run, 'kaiju-freed');
    expect(ok(run)).toBe(false); // the factory was shut down, or not met
    setFlag(run, 'factory-left-running');
    run.story.flags['ev:kaiju-at'] = 1;
    const laterOk = ok(run);
    const b = e.choices[0]!.success.battle as { species: string[]; rule: { giant?: boolean; noCatch?: boolean; foeStages?: { atk?: number } }; foeMoves: string[] };
    expect(b.species).toEqual(['tentacruel']);
    expect(b.rule).toMatchObject({ giant: true, noCatch: true, foeStages: { atk: 1 } });
    expect(b.foeMoves).toEqual(['wrap', 'acid-armor', 'hydro-pump', 'tidal-surge']);
    open(run, 'gn-11-anger');
    const fought = choose(run, 'gn-11-anger', 'Stand on the sea wall.');
    expect(fought.battle).toBe(true);
    expect(fought.run.battle!.enemyStages.atk).toBe(1);
    const held = win(fought.run);
    expect(flagOf(held, 'kaiju-anger-held')).toBe(1);
    setFlag(held, 'kaiju-at', 0);
    expect(ok(held)).toBe(false); // once
    expect(typeof laterOk).toBe('boolean');
  });
});

describe("gn.12 Maiden's Peak", () => {
  const enter = (seed: string): RunState => {
    const run = gnRun(seed);
    open(run, 'gn-12-door');
    return choose(run, 'gn-12-door', 'Walk into the market.').run;
  };

  it('a pseudo stage: the market square, then a six-node chase (three sightings with a choice, two without, the cliff)', () => {
    expect(content.coPlacement!.get('gn-12-door')).toMatchObject({ home: 9, window: [7, 12], sits: 'optional' });
    const chain = PSEUDO_CHAINS.find((c) => c.id === 'ps_gn_maiden')!;
    const rooms = chainRooms(content, chain).map((r) => r.event);
    expect(rooms[0]).toBe('gn-12-square');
    for (const id of ['gn-12-see-4', 'gn-12-see-5', 'gn-12-top']) expect(rooms).toContain(id);
    const run = enter('gn12-a');
    expect(run.stage!.pseudo?.id).toBe('ps_gn_maiden');
    expect(content.events.get('cs-kanto-vermilion-maiden')!.canon).toBe('cs.kanto.vermilion.maiden');
    expect(content.events.get('cs-kanto-vermilion-maiden-top')!.disabled).toBe(true);
  });

  it('the TM Hall: the board changes by visit, the price goes by power, and a move is taught', () => {
    const run = enter('gn12-b');
    run.money = 10000;
    const hall = choose(run, 'gn-12-square', 'The TM Hall.').run;
    const board = openSide(hall)!.eventId;
    expect(['gn-12-tm-1', 'gn-12-tm-2']).toContain(board);
    const firstCase = scene(hall, board).labels[0]!;
    const room = choose(hall, board, firstCase).run;
    const caseId = openSide(room)!.eventId;
    const labels = scene(room, caseId).labels;
    expect(labels[0]).toMatch(/^TM .* \(₽[\d,]+\)$/);
    const bought = choose(room, caseId, labels[0]!);
    expect(bought.run.money).toBeLessThan(10000);
  });

  it('one of each a visit: three Swap Alley cards, one egg move (priced by rarity), one true thing from Madame Roux (no charge)', () => {
    let run = enter('gn12-visit');
    run.money = 50000;
    run = choose(run, 'gn-12-square', 'Further into the market.').run;
    const hub = run;
    // Swap Alley: a card is gone once it is taken.
    run = choose(hub, 'gn-12-square-2', 'Swap Alley.').run;
    expect(scene(run, 'gn-12-swap').labels.length).toBe(4);
    setFlag(run, 'maiden-swap-1');
    expect(scene(run, 'gn-12-swap').labels).toEqual(['The second card: a little further off.', 'The third card: anything goes.', 'Back to the square.']);
    expect(content.events.get('gn-12-swap')!.choices.slice(0, 3).map((c) => JSON.stringify(c.success.effects).includes('maiden-swap-'))).toEqual([true, true, true]);
    // A choice of nature: all twenty natures that lean one way, five stats by four.
    const natures = ['atk', 'spa', 'spe', 'def', 'spd'].flatMap((k) => content.events.get(`gn-12-nature-${k}`)!.choices.map((c) => (c.success.effects[0] as { key: string }).key));
    expect(new Set(natures).size).toBe(20);
    expect(scene(run, 'gn-12-nature').labels).toEqual(['Stronger (Attack).', 'Cleverer (Sp. Atk).', 'Some other way.', 'Leave it as it is.']);
    // The Egg Move Tutor: one price shows, by the lead's rarity; one egg move a visit.
    run = choose(hub, 'gn-12-square-2', 'Egg Row.').run;
    run = choose(run, 'gn-12-eggs', 'The Egg Move Tutor.').run;
    const prices = scene(run, 'gn-12-tutor').labels.filter((l) => l.startsWith('Pay him'));
    expect(prices.length).toBe(1);
    expect(['Pay him (₽600).', 'Pay him (₽1,200).', 'Pay him (₽2,400).']).toContain(prices[0]);
    const money = run.money;
    const taught = choose(run, 'gn-12-tutor', prices[0]!).run;
    expect(money - taught.money).toBe(Number(prices[0]!.replace(/\D/g, '')));
    expect(flagOf(taught, 'maiden-tutor')).toBe(1);
    expect(scene(taught, 'gn-12-tutor').labels).toEqual(['Back to the row.']);
    // Madame Roux: no price; one true thing.
    run = choose(hub, 'gn-12-square-2', 'Further in.').run;
    run = choose(run, 'gn-12-square-3', 'The Fortune Teller.').run;
    const before = run.money;
    const told = choose(run, 'gn-12-roux', 'Ask for the one true thing.').run;
    expect(told.money).toBe(before);
    expect(scene(told, 'gn-12-roux').labels).toEqual(['Back to the square.']);
    // A new visit resets all of it.
    setFlag(told, 'maiden-swap-1');
    open(told, 'gn-12-door');
    const again = choose(told, 'gn-12-door', 'Walk into the market.').run;
    for (const k of ['maiden-swap-1', 'maiden-tutor', 'maiden-roux-told']) expect(flagOf(again, k)).toBe(0);
  });

  it('Lantern Row: Poké Balls, status cures and supplies, each at the shop price plus 10%', () => {
    let run = enter('gn12-row');
    run.money = 50000;
    run = choose(run, 'gn-12-square', 'Lantern Row.').run;
    expect(scene(run, 'gn-12-lantern').labels).toEqual(['The Poké Ball shelf.', 'The status cures.', 'The out-of-battle supplies.', 'Back to the square.']);
    run = choose(run, 'gn-12-lantern', 'The Poké Ball shelf.').run;
    expect(scene(run, 'gn-12-lantern-balls').labels).toEqual(['A Poké Ball (₽220)', 'A Great Ball (₽660)', 'An Ultra Ball (₽880)', 'Back along the row.']);
    const balls = run.inventory['great-ball'] ?? 0;
    const money = run.money;
    const bought = choose(run, 'gn-12-lantern-balls', 'A Great Ball (₽660)').run;
    expect(bought.inventory['great-ball']).toBe(balls + 1);
    expect(bought.money).toBe(money - 660);
    bought.money = 100;
    expect(conditionMet(content, bought, content.events.get('gn-12-lantern-balls')!.choices[0]!.requires![0]!)).toBe(false); // can't afford it
  });

  it('the Dusk Vendors take a Berry from the bag too', () => {
    const run = enter('gn12-bag');
    run.party.forEach((m) => { m.held = {}; });
    for (const id of Object.keys(run.inventory)) if (id.endsWith('-berry')) delete run.inventory[id];
    const cond = { kind: 'gn', test: 'holdsBerry' } as never;
    expect(conditionMet(content, run, cond)).toBe(false);
    run.inventory['oran-berry'] = 2;
    expect(conditionMet(content, run, cond)).toBe(true);
  });

  it('the Dusk Vendors open only at dusk and take a held Berry', () => {
    let run = enter('gn12-c');
    run = choose(run, 'gn-12-square', 'Further into the market.').run;
    run = choose(run, 'gn-12-square-2', 'Further in.').run;
    run = choose(run, 'gn-12-square-3', 'The Dusk Vendors.').run;
    run.party[0]!.held = { 'oran-berry': 1 };
    const labels = scene(run, 'gn-12-dusk').labels;
    // Either it is dusk now (the trays are open) or it isn't (only the way back shows).
    if (labels.length === 1) expect(labels).toEqual(['Back to the square.']);
    else {
      const paid = choose(run, 'gn-12-dusk', 'A Dusk Stone, for a Berry.');
      expect(paid.run.party[0]!.held?.['oran-berry']).toBeUndefined();
      expect(paid.run.inventory['dusk-stone']).toBe(1);
    }
  });

  const chase = (seed: string, pickRight: number): RunState => {
    let run = choose(enter(seed), 'gn-12-square', 'Run after the veil.').run;
    for (let n = 1; n <= 3; n++) {
      const id = openSide(run)!.eventId;
      expect(id).toMatch(new RegExp(`^gn-12-see-${n}-[ab]$`));
      const rightWay = id.endsWith('-a') ? 'Right.' : 'Left.';
      const wrongWay = rightWay === 'Right.' ? 'Left.' : 'Right.';
      run = choose(run, id, n <= pickRight ? rightWay : wrongWay).run;
    }
    run = choose(run, 'gn-12-see-4', 'Keep going.').run;
    return choose(run, 'gn-12-see-5', 'Climb.').run;
  };

  it("two right turns of three: the short way, so the Fairium Z and the Lady's Blessing (a Fairy Feather and the Tea House as a hub)", () => {
    let run = chase('gn12-d', 2);
    expect(flagOf(run, 'maiden-right')).toBe(2);
    expect(scene(run, 'gn-12-top').labels).toEqual(['Pick it up.']);
    const top = choose(run, 'gn-12-top', 'Pick it up.');
    run = top.run;
    expect(run.inventory['fairium-z']).toBe(1);
    expect(flagOf(run, 'maiden-blessing')).toBe(1);
    expect([top.text, ...top.changes].join(' ')).toContain('Tea House lanterns');
    // The Tea House is a stop on every later stage: it can be met again after each visit.
    open(run, 'gn-12-teahouse');
    const tea = choose(run, 'gn-12-teahouse', 'Rest and drink.').run;
    expect(tea.itemCounters?.['event-seen:gn-12-teahouse']).toBeUndefined();
    expect(content.events.get('gn-12-teahouse')!.callback).toBe(true);
  });

  it('one right turn: the long way: the crystal, no Blessing; already holding it, three Fairy HMs instead', () => {
    let run = chase('gn12-e', 1);
    run.inventory['fairium-z'] = 1;
    expect(scene(run, 'gn-12-top').labels).toEqual(['Pick them up.']);
    run = choose(run, 'gn-12-top', 'Pick them up.').run;
    expect(flagOf(run, 'maiden-blessing')).toBe(0);
    expect(flagOf(run, 'kanto-maiden-hms')).toBe(1);
    expect(content.catalog.get('hm-moonblast')!.effect).toMatchObject({ kind: 'teachMove', move: 'moonblast' });
    // The HMs are kept and reusable: used once at the cliff, then their case opens once on every later stage.
    const hms = content.events.get('gn-12-hms')!;
    expect(hms.choices.map((c) => c.label)).toEqual(['Use HM Dazzling Gleam.', 'Use HM Play Rough.', 'Use HM Moonblast.', 'Put them away.']);
    const ok = (r: RunState) => hms.requires.every((c) => conditionMet(content, r, c));
    expect(ok(run)).toBe(false); // used at the cliff on this stage
    run.story.flags['ev:maiden-hms-at'] = -1;
    expect(ok(run)).toBe(true);
    expect(JSON.stringify(hms.choices[0]!.success.effects)).toContain('seeAgain'); // using one does not use it up
    run = win(run); // the three teach prompts
    run.story.flags['ev:maiden-hms-at'] = -1;
    open(run, 'gn-12-hms');
    const away = choose(run, 'gn-12-hms', 'Put them away.').run;
    expect(ok(away)).toBe(false); // not again this stage
    away.story.flags['ev:maiden-hms-at'] = -1;
    expect(ok(away)).toBe(true);
  });
});

describe('gn.13 Flight North', () => {
  const check = (seed: string, setup: (run: RunState) => void = () => {}) => {
    const run = gnRun(seed);
    setup(run);
    open(run, 'gn-13-check');
    return choose(run, 'gn-13-check', 'Keep walking.');
  };
  const stolenSeed = (): string => {
    for (let i = 0; i < 60; i++) if (flagOf(check(`gn13-${i}`).run, 'flight-stolen') === 1) return `gn13-${i}`;
    throw new Error('no seed');
  };

  it('a must-see check at step 17 (window 15 to 19), before the battle, with no badge; the odds move with the Squad, Heat and the S.S. Anne', () => {
    expect(content.coPlacement!.get('gn-13-check')).toMatchObject({ home: 17, window: [15, 19], sits: 'must-see', attaches: 'before', badge: 'none' });
    const odds = (setup: (run: RunState) => void) => {
      let n = 0;
      for (let i = 0; i < 200; i++) n += flagOf(check(`gn13-odds-${i}`, setup).run, 'flight-stolen');
      return n;
    };
    const base = odds(() => {});
    expect(base).toBeGreaterThan(70);
    expect(base).toBeLessThan(130);
    // The same seeds, so the counts can only move one way.
    expect(odds((run) => setFlag(run, 'ssanne-trio-seen'))).toBeGreaterThan(base);
    expect(odds((run) => { run.party[0]!.look = 'squad-lesser'; })).toBeLessThan(base);
    const roll = content.events.get('gn-13-check')!.choices[0]!.success.effects.find((e) => e.kind === 'gn' && (e as { op: string }).op === 'roll') as { mods: { n: number }[] };
    expect(roll.mods.map((m) => m.n)).toEqual([-5, -5, 5]);
  });

  it('the theft takes every Pokémon (stored, never lost); a Caterpie or a Weedle at level 5 saves you, and gets a name', () => {
    const r = check(stolenSeed());
    expect([r.text, ...r.changes].join(' ')).toContain('Prepare for trouble');
    let run = r.run;
    expect(run.stage!.pseudo?.id).toMatch(/flight/);
    expect(run.party.length).toBe(0);
    const bully = choose(run, 'gn-13-bully', 'Cover your head.');
    run = bully.run;
    expect(run.party.length).toBe(1);
    expect(['caterpie', 'weedle']).toContain(run.party[0]!.speciesId);
    expect(run.party[0]!.level).toBe(5);
    expect(['Pip', 'Nettle', 'Thimble', 'Button']).toContain(run.party[0]!.care?.nickname);
    expect(flagOf(run, 'kanto-flight-bug')).toBeGreaterThan(0);
  });

  it('carried a Weedle from the forest: it is a Weedle; seen the Spearow flock this region: the bully is from it', () => {
    const seed = stolenSeed();
    let run = gnRun(seed);
    run.party[0]!.speciesId = 'kakuna';
    run.story.flags['ev:spearow-seen-region'] = run.regionIndex + 1;
    open(run, 'gn-13-check');
    run = choose(run, 'gn-13-check', 'Keep walking.').run;
    const bully = choose(run, 'gn-13-bully', 'Cover your head.');
    expect(bully.run.party[0]!.speciesId).toBe('weedle');
    expect(bully.text).toContain('flock');
    expect(flagOf(bully.run, 'flight-flock')).toBe(1);
  });

  it('seven nodes at levels 5 to 20: cocoon, a Harden-only stream, wings, the camp, the Venomoth with the shiny rescue; then the team comes back', () => {
    const seed = stolenSeed();
    const team = gnRun(seed).party.map((m) => m.speciesId);
    let run = choose(check(seed).run, 'gn-13-bully', 'Cover your head.').run;
    teach(run, 0, 'tackle'); // the test player always attacks (the plain autoplay likes String Shot)
    const meadow = choose(run, 'gn-13-meadow', 'Let it try.').run;
    expect(meadow.battle!.enemyTeam[0]!.level).toBe(6);
    run = win(meadow);
    run = choose(run, 'gn-13-cocoon', 'Carry it where it can see.').run;
    expect(['metapod', 'kakuna']).toContain(run.party[0]!.speciesId);
    const stream = choose(run, 'gn-13-stream', 'Stay with it.').run;
    expect(stream.battle!.eventRule).toMatchObject({ noAttacks: true, surviveTurns: 4 });
    run = win(stream);
    const hatch = choose(run, 'gn-13-hatch', 'Stand together.').run;
    expect(['butterfree', 'beedrill']).toContain(hatch.party[0]!.speciesId);
    run = win(hatch);
    run = win(choose(run, 'gn-13-camp', 'Slip in from the shadows.').run);
    const boss = choose(run, 'gn-13-boss', 'Fight!').run;
    expect(boss.battle!.enemyTeam[0]!).toMatchObject({ speciesId: 'venomoth', level: 20 });
    expect(boss.battle!.eventRule).toMatchObject({ shinyRescue: true });
    run = win(boss);
    expect([0, 1]).toContain(run.story.flags['ev:flight-shiny-came']); // the fight wrote down whether the shiny one came
    const bye = choose(run, 'gn-13-goodbye', 'Say goodbye.').run;
    expect(bye.party.map((m) => m.speciesId)).toEqual(team); // the team comes back; the bug flies north
    expect(bye.party.every((m) => m.hp === maxHp(content, m))).toBe(true);
    expect(flagOf(bye, 'kanto-flight-gratitude')).toBe(1);
    expect(bye.expansion?.flightNorth?.state).toBe('ready');
    expect(content.events.get('cs-kanto-vermilion-flight-c7')!.disabled).toBe(true);
  });
  it('Meowth only counts two when the shiny one really came down', () => {
    const run = gnRun('fn-two');
    expect(scene(run, 'gn-13-goodbye').intro).not.toMatch(/TWO/);
    setFlag(run, 'flight-shiny-came');
    expect(scene(run, 'gn-13-goodbye').intro).toMatch(/TWO/);
  });

  it('after you let it go, its shape crosses the sky once in each later region; never if you kept it', () => {
    const sky = content.events.get('gn-13-sky')!;
    const ok = (run: RunState) => sky.requires.every((c) => conditionMet(content, run, c));
    const run = gnRun('fn-sky');
    expect(ok(run)).toBe(false); // no Flight North
    run.expansion = { ...(run.expansion ?? {}), flightNorth: { ...(run.expansion?.flightNorth ?? {}), state: 'released' } } as RunState['expansion'];
    expect(ok(run)).toBe(false); // still the region it left in
    run.regionIndex = 1;
    expect(ok(run)).toBe(true);
    open(run, 'gn-13-sky');
    const seen = choose(run, 'gn-13-sky', 'Watch it go.').run;
    expect(ok(seen)).toBe(false); // once per region
    seen.regionIndex = 2;
    expect(ok(seen)).toBe(true);
    seen.expansion!.flightNorth!.state = 'kept';
    expect(ok(seen)).toBe(false);
    expect(content.coPlacement!.get('gn-13-sky')).toMatchObject({ sits: 'must-see', badge: 'none' });
  });
});

describe("gn.14 Sabrina's Labyrinth", () => {
  const enter = (seed: string, setup: (run: RunState) => void = () => {}) => {
    const run = gnRun(seed);
    addMon(run, 'pikachu');
    addMon(run, 'eevee');
    setup(run);
    open(run, 'gn-14-door');
    return choose(run, 'gn-14-door', 'Read it.').run;
  };
  /** Through the unwinnable first fight and the ghost's offer, to node 1. */
  const toNode1 = (seed: string, setup?: (run: RunState) => void): RunState => {
    const fight = choose(enter(seed, setup), 'gn-14-lost', 'Stand there anyway.').run;
    expect(fight.battle!.eventRule).toMatchObject({ noPokemon: true });
    const after = takeTurn(content, structuredClone(fight), { kind: 'move', index: 0 }).run;
    expect(after.phase).toBe('map');
    return choose(after, 'gn-14-ghost', 'Take it.').run;
  };
  const lab = (run: RunState) => run.expansion!.canon!.lab!;

  it('a door on step 11 (window 9 to 14), optional, instead of the battle, with a "?" badge', () => {
    expect(content.coPlacement!.get('gn-14-door')).toMatchObject({ home: 11, window: [9, 14], sits: 'optional', attaches: 'instead', badge: '?' });
    expect(scene(gnRun('x'), 'gn-14-door').labels).toEqual(['Read it.', 'No, thank you.']);
  });

  it('"No, thank you." changes nothing; "Read it." leaves one of the four ghosts alone in the party with the team stashed', () => {
    const run = gnRun('lab-no');
    open(run, 'gn-14-door');
    const no = choose(run, 'gn-14-door', 'No, thank you.').run;
    expect(no.party.map((m) => m.uid)).toEqual(run.party.map((m) => m.uid));
    expect(no.expansion?.canon?.lab).toBeUndefined();
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const r = enter(`lab-${i}`);
      expect(r.party).toHaveLength(1);
      expect(r.party[0]!.level).toBe(10);
      expect(r.expansion!.canon!.stash).toHaveLength(3);
      expect(openSide(r)?.eventId).toBe('gn-14-lost');
      seen.add(r.party[0]!.speciesId);
    }
    expect([...seen].sort()).toEqual(['drifloon', 'duskull', 'gastly', 'shuppet']);
  });

  it('six lanterns (a sleepwalker, a mirror, four doors, two doors, the floor, the riddle), then Sabrina; the team comes back and the ghost is owed', () => {
    let run = toNode1('lab-walk');
    const n1 = choose(run, 'gn-14-n1', 'Wake them with a battle.').run;
    expect(n1.battle!.eventRule).toMatchObject({ foeAsleep: true, matchLead: true });
    run = win(n1);
    expect(lab(run).freed).toHaveLength(1);
    expect(run.party[0]!.level).toBe(15);
    const wrong = choose(run, 'gn-14-n2', 'Walk to your right.').run;
    expect(openSide(wrong)?.eventId).toBe('gn-14-n2');
    expect(wrong.party[0]!.hp).toBeLessThan(maxHp(content, wrong.party[0]!));
    run = graded(wrong, 'gn-14-n2', 'Walk to your left.').run;
    run = choose(run, 'gn-14-n3', 'Watch the doors.').run;
    const order = ['Town, route, rest, harbour.', 'Route, harbour, town, rest.', 'Rest, town, harbour, route.'][flagOf(run, 'lab-doors') - 1]!;
    run = choose(run, 'gn-14-n3-doors', order).run;
    expect(lab(run).freed).toHaveLength(3);
    run = choose(run, 'gn-14-n4', 'Open the other one.').run;
    run = graded(run, 'gn-14-n5', 'Step where it steps.').run;
    expect(run.party[0]!.level).toBe(37);
    const grave = choose(run, 'gn-14-n6', 'A shadow.');
    expect([grave.text, ...grave.changes].join(' ')).toMatch(/blank/);
    run = grave.run;
    expect(run.party[0]!.level).toBe(40);
    const boss = choose(run, 'gn-14-sabrina', 'Face Sabrina.').run;
    expect(boss.battle!.eventRule).toMatchObject({ falseSlot: true, ghostRescue: true, evolveMid: true });
    expect(boss.battle!.enemyTeam[0]!).toMatchObject({ speciesId: 'alakazam', level: 42 });
    run = win(boss);
    expect(run.party.map((m) => m.speciesId)).toEqual(gnRun('lab-walk').party.map((m) => m.speciesId).concat(['pikachu', 'eevee']));
    expect(flagOf(run, 'kanto-sabrina-labyrinth-done')).toBe(1);
    expect(run.expansion!.canon!.lab).toMatchObject({ owed: true, done: true, active: false });
    expect(scene(run, 'gn-14-goodbye').labels).toEqual(['Wave back.']);
  });

  it('a loss resets the stage: node 1 again, nobody freed', () => {
    let run = toNode1('lab-lose');
    run = win(choose(run, 'gn-14-n1', 'Wake them with a battle.').run);
    run = graded(run, 'gn-14-n2', 'Walk to your left.').run;
    expect(lab(run).freed).toHaveLength(2);
    run = choose(run, 'gn-14-n3', 'Watch the doors.').run;
    run = choose(run, 'gn-14-n3-doors', 'Harbour, rest, route, town.').run; // never right: the doors start over
    expect(openSide(run)?.eventId).toBe('gn-14-n3');
    const n1 = toNode1('lab-lose-2');
    const lost = lose(choose(n1, 'gn-14-n1', 'Wake them with a battle.').run);
    expect(openSide(lost)?.eventId).toBe('gn-14-n1');
    expect(lab(lost).freed).toEqual([]);
  });

  it('remembers: a cruel run sees the body turn round; a lost Pokémon names the grave; the Shedinja stands by it', () => {
    const cruel = choose(toNode1('lab-cruel', (r) => setFlag(r, 'robbed-trainer')), 'gn-14-n1', 'Wake them with a battle.');
    expect(cruel.text).toMatch(/disappointed/);
    const run = toNode1('lab-grave');
    setFlag(run, 'lost-mon');
    setFlag(run, 'shedinja-answered');
    let r = win(choose(run, 'gn-14-n1', 'Wake them with a battle.').run);
    r = graded(r, 'gn-14-n2', 'Walk to your left.').run;
    r = choose(r, 'gn-14-n3', 'Watch the doors.').run;
    r = choose(r, 'gn-14-n3-doors', ['Town, route, rest, harbour.', 'Route, harbour, town, rest.', 'Rest, town, harbour, route.'][flagOf(r, 'lab-doors') - 1]!).run;
    r = graded(choose(r, 'gn-14-n4', 'Open the other one.').run, 'gn-14-n5', 'Step where it steps.').run;
    const words = (({ text, changes }) => [text, ...changes].join(' '))(choose(r, 'gn-14-n6', 'A shadow.'));
    expect(words).toMatch(/has a name on it/);
    expect(words).toMatch(/Shedinja/);
  });

  it('the mirror walk and the floating tiles are played: a miss shoves the ghost back and costs the lead', () => {
    let run = win(choose(toNode1('lab-prompt'), 'gn-14-n1', 'Wake them with a battle.').run);
    expect(content.events.get('gn-14-n2')!.choices.find((c) => c.label === 'Walk to your left.')!.prompt).toMatchObject({ id: 'mirror-walk', needs: 'ok' });
    expect(content.events.get('gn-14-n5')!.choices.find((c) => c.label === 'Step where it steps.')!.prompt).toMatchObject({ id: 'floating-tiles', needs: 'ok' });
    const miss = graded(run, 'gn-14-n2', 'Walk to your left.', 'miss');
    expect(miss.success).toBe(false);
    expect(openSide(miss.run)?.eventId).toBe('gn-14-n2');
    expect(lab(miss.run).freed).toHaveLength(1);
    expect(miss.run.party[0]!.hp).toBeLessThan(maxHp(content, miss.run.party[0]!));
    run = graded(miss.run, 'gn-14-n2', 'Walk to your left.', 'ok').run;
    expect(lab(run).freed).toHaveLength(2);
  });

  it('the small grave names the Pokémon lost for good this run, when there is one', () => {
    const walk = (seed: string, setup: (run: RunState) => void) => {
      const run = toNode1(seed);
      setFlag(run, 'lost-mon');
      setup(run);
      let r = win(choose(run, 'gn-14-n1', 'Wake them with a battle.').run);
      r = graded(r, 'gn-14-n2', 'Walk to your left.').run;
      r = choose(r, 'gn-14-n3', 'Watch the doors.').run;
      r = choose(r, 'gn-14-n3-doors', ['Town, route, rest, harbour.', 'Route, harbour, town, rest.', 'Rest, town, harbour, route.'][flagOf(r, 'lab-doors') - 1]!).run;
      r = graded(choose(r, 'gn-14-n4', 'Open the other one.').run, 'gn-14-n5', 'Step where it steps.').run;
      return (({ text, changes }) => [text, ...changes].join(' '))(choose(r, 'gn-14-n6', 'A shadow.'));
    };
    const named = walk('lab-name', (run) => {
      run.nuzlocke = { ...(run.nuzlocke ?? {}), memorial: [{ uid: 'x', speciesId: 'pidgey', level: 9, shiny: false, ace: false, area: 'Route 1', cause: 'a Rattata' }] } as RunState['nuzlocke'];
    });
    expect(named).toMatch(/It says Pidgey\./);
    expect(walk('lab-noname', () => {})).toMatch(/You know the name\./);
  });

  it('the return one region later is the one gn-14-return room', () => {
    expect(scene(gnRun('x'), 'gn-14-return').labels).toEqual(['Take it.', 'Not this time.']);
    expect(content.events.get('gn-14-return')!.choices[0]!.success.effects).toContainEqual(expect.objectContaining({ kind: 'canon', action: 'ghostReturn' }));
  });
});

describe('gn.15 Route 25: The Angry Mankey', () => {
  const troop = (seed: string, setup: (run: RunState) => void = () => {}) => {
    const run = gnRun(seed);
    setup(run);
    open(run, 'gn-15-troop');
    return run;
  };
  const recruit = (run: RunState) => (run.pending.find((p) => p.kind === 'caught') as { mon: RunState['party'][number] } | undefined)?.mon;
  /** Fights 1 to 4 (each checked), up to the fifth. */
  const toFifth = (seed: string, setup?: (run: RunState) => void): RunState => {
    let run = choose(troop(seed, setup), 'gn-15-troop', 'Face them.').run;
    const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
    for (const id of here.next) expect(run.stage!.map.nodes.find((n) => n.id === id)!.sides.some((s) => s.eventId === 'gn-15-camp')).toBe(true);
    const m1 = choose(run, 'gn-15-m1', 'Hold the line.').run;
    expect(m1.battle!.eventRule).toMatchObject({ noCatch: true, myStages: { def: -2 } });
    expect(m1.battle!.enemyTeam[0]!.speciesId).toBe('mankey');
    const m2 = choose(win(m1), 'gn-15-m2', 'Hold the line.').run;
    expect(m2.battle!.enemyTeam[0]!.moves.map((m) => m.id)).toContain('fury-swipes');
    const m3 = choose(win(m2), 'gn-15-m3', 'Hold the line.').run;
    expect(m3.battle!.enemyTeam[0]!.held).toEqual({ 'sitrus-berry': 1 });
    run = win(m3);
    run.party[0]!.hp = 1;
    run = choose(run, 'gn-15-breath', 'Take it.').run;
    const quarter = maxHp(content, run.party[0]!) * 0.25;
    expect(run.party[0]!.hp).toBeGreaterThanOrEqual(1 + Math.floor(quarter));
    expect(run.party[0]!.hp).toBeLessThanOrEqual(1 + Math.ceil(quarter));
    const m4 = choose(run, 'gn-15-m4', 'Hold the line.').run;
    expect(m4.battle!.enemyTeam[0]!.moves.map((m) => m.id)).toContain('low-kick');
    return win(m4);
  };

  it('a must-see gauntlet on step 6 (window 4 to 9), instead of the battle, with a red "!"', () => {
    expect(content.coPlacement!.get('gn-15-troop')).toMatchObject({ home: 6, window: [4, 9], sits: 'must-see', attaches: 'instead', badge: 'own' });
  });

  const idle = (run: RunState): RunState => takeTurn(content, run, { kind: 'idle' }).run;

  it('four fights with no healing but one breath; the fifth is a fight with a "Wait." button: waiting twice lets you pass, and the fifth joins with Swords Dance and Mach Punch', () => {
    let run = toFifth('r25-wait');
    expect(scene(run, 'gn-15-fifth').labels).toEqual(['Step up to it.']);
    run = choose(run, 'gn-15-fifth', 'Step up to it.').run;
    expect(run.battle!.eventRule).toMatchObject({ waits: 2, foeStages: { atk: 1, def: 1, spe: 1 } });
    expect(waitOffered(run.battle)).toBe(true);
    const hp = run.party[0]!.hp;
    const first = takeTurn(content, run, { kind: 'idle' });
    expect(first.events.some((e) => e.type === 'raid' && e.text === FIFTH_LINES.looks)).toBe(true);
    expect(first.run.battle!.outcome).toBeFalsy();
    expect(first.run.party[0]!.hp).toBe(hp); // it never attacks while you wait
    const second = takeTurn(content, first.run, { kind: 'idle' });
    expect(second.events.some((e) => e.type === 'raid' && e.text === FIFTH_LINES.lowers)).toBe(true);
    run = win(second.run);
    expect(flagOf(run, 'mankey-waited-out')).toBe(1);
    expect(flagOf(run, 'mankey-struck')).toBe(0);
    expect(flagOf(run, 'mankey-waited')).toBe(1);
    expect(flagOf(run, 'mankey-hit-fifth')).toBe(0);
    run = choose(run, 'gn-15-reward', 'Let it come.').run;
    expect(flagOf(run, 'mankey-fifth-joined')).toBe(1);
    const mon = recruit(run)!;
    expect(mon.speciesId).toBe('mankey');
    expect(mon.moves.map((m) => m.id)).toEqual(expect.arrayContaining(['swords-dance', 'mach-punch']));
  });

  it('attacking the fifth: the "Wait." button goes, it uses Rage; one of the four joins, never the fifth; nobody fainted pays a Black Belt', () => {
    const fight = choose(toFifth('r25-hit'), 'gn-15-fifth', 'Step up to it.').run;
    expect(fight.battle!.enemyTeam[0]!.moves.map((m) => m.id)).toContain('rage');
    // One wait, then a hit: the wait no longer counts and the button is gone.
    let hit = structuredClone(idle(fight));
    hit.battle!.enemyTeam[0]!.hp = maxHp(content, hit.battle!.enemyTeam[0]!);
    teach(hit, 0, 'tackle');
    for (let i = 0; i < 6 && !hit.battle!.storyEffects.includes(FIFTH_HIT) && hit.phase === 'battle'; i++) hit = takeTurn(content, hit, { kind: 'move', index: 0 }).run;
    expect(hit.battle!.storyEffects).toContain(FIFTH_HIT);
    expect(waitOffered(hit.battle)).toBe(false);
    if (hit.phase === 'battle' && !hit.battle!.outcome) {
      const after = idle(hit);
      expect(after.battle?.storyEffects ?? []).not.toContain(FIFTH_WAITED);
    }
    const run = choose(win(hit), 'gn-15-reward', 'Let it come.');
    expect(flagOf(run.run, 'mankey-waited-out')).toBe(0);
    expect(flagOf(run.run, 'mankey-struck')).toBe(1);
    expect(flagOf(run.run, 'mankey-hit-fifth')).toBe(1);
    expect(flagOf(run.run, 'mankey-fifth-joined')).toBe(0);
    expect([run.text, ...run.changes].join(' ')).toMatch(/one of the four/);
    expect(recruit(run.run)!.held).toEqual({ 'black-belt': 1 });
  });

  it('fed the Poochyena once (or gave the Egg back): the fifth lowers its arms one turn sooner', () => {
    const run = choose(toFifth('r25-pooch', (r) => setFlag(r, 'fed-poochyena')), 'gn-15-fifth', 'Step up to it.');
    expect(run.text).toMatch(/Poochyena/);
    expect(run.run.battle!.eventRule!.waits).toBe(1);
    const done = win(idle(run.run));
    expect(flagOf(done, 'mankey-waited-out')).toBe(1);
    expect(openSide(done)?.eventId).toBe('gn-15-reward');
    const egg = choose(toFifth('r25-egg', (r) => setFlag(r, 'egg-returned')), 'gn-15-fifth', 'Step up to it.');
    expect(egg.text).toMatch(/Egg/);
    expect(egg.run.battle!.eventRule!.waits).toBe(1);
  });

  it('the first Mankey opens with Screech: its first turn is the told line, not an attack', () => {
    let run = choose(troop('r25-screech'), 'gn-15-troop', 'Face them.').run;
    run = choose(run, 'gn-15-m1', 'Hold the line.').run;
    expect(run.battle!.storyEffects.some((s) => s.startsWith('gn-foe-waits:Mankey opens with Screech!'))).toBe(true);
    expect(waitOffered(run.battle)).toBe(false);
  });

  it("the thieves' camp first: buying the food back for ₽500 skips the gauntlet, the fifth bows and joins Bond +2; carrying it needs Reputation 3", () => {
    let run = choose(troop('r25-camp'), 'gn-15-troop', 'Find out why they\'re so angry.').run;
    run.money = 600;
    expect(scene(run, 'gn-15-camp').labels).toEqual(['Take it back (a battle).', 'Buy it back.', 'Ask them to carry it back themselves.', 'Leave it.']);
    run = choose(run, 'gn-15-camp', 'Buy it back.').run;
    expect(run.money).toBe(100);
    expect(flagOf(run, 'mankey-gauntlet')).toBe(0);
    run = choose(run, 'gn-15-bow', 'Bow back.').run;
    const base = createPokemon(content, 'mankey', 5, 'x').friendship;
    run = choose(run, 'gn-15-reward', 'Let it come.').run;
    expect(flagOf(run, 'mankey-fifth-joined')).toBe(1);
    expect(recruit(run)!.friendship).toBeGreaterThanOrEqual(base + 10);
    expect(recruit(run)!.held ?? {}).not.toHaveProperty('black-belt');
    const sorry = choose(troop('r25-sorry', (r) => setFlag(r, 'rep', 3)), 'gn-15-troop', 'Find out why they\'re so angry.').run;
    expect(flagOf(choose(sorry, 'gn-15-camp', 'Ask them to carry it back themselves.').run, 'mankey-thieves-sorry')).toBe(1);
  });

  it('the camp after the fight: the four eat, the fifth waits, and the Mankey with you grows fonder; sorry thieves guard a grove later', () => {
    let run = choose(toFifth('r25-after'), 'gn-15-fifth', 'Step up to it.').run;
    run = choose(win(run), 'gn-15-reward', 'Let it come.').run;
    const mon = recruit(run)!;
    run.pending = [];
    run.phase = 'map';
    run.party.push(mon);
    const before = mon.friendship;
    open(run, 'gn-15-camp');
    run.money = 600;
    const after = choose(run, 'gn-15-camp', 'Buy it back.');
    expect([after.text, ...after.changes].join(' ')).toMatch(/fifth doesn't eat until they have/);
    expect(after.run.party.find((m) => m.uid === mon.uid)!.friendship).toBeGreaterThan(before);
    expect(content.events.get('gn-15-grove')!.requires).toContainEqual(expect.objectContaining({ key: 'mankey-thieves-sorry' }));
  });
});
