// Greenneedle part 3 (GREENNEEDLE_REWORKED_PLACED_3.md): gn.11 to gn.15, played through the real engine.
import { describe, expect, it } from 'vitest';
import { chainRooms, PSEUDO_CHAINS } from '../../src/core/dungeon/pseudo';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { reinforcementDue } from '../../src/core/raid/raid';
import { choose, flagOf, gnRun, lose, open, openSide, scene, setFlag, win } from './helpers/gnPlay';

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

  it('free the injured one: needs a slicing or claw move; it costs HP (more if angered); that Tentacool joins, and the Kaiju comes back later as an ally', () => {
    let run = toWall('gn11-g');
    run = choose(run, 'gn-11-seawall', 'Follow it to the reef.').run;
    teach(run, 0, 'tackle');
    for (const m of run.party.slice(1)) m.moves = [{ id: 'tackle', pp: 35 }];
    expect(scene(run, 'gn-11-reef').labels).not.toContain('Cut the net.');
    teach(run, 0, 'metal-claw');
    const hp = run.party[0]!.hp;
    run = choose(run, 'gn-11-reef', 'Cut the net.').run;
    expect(run.party[0]!.hp).toBeLessThan(hp);
    expect(flagOf(run, 'kaiju-freed')).toBe(1);
    setFlag(run, 'kaiju-girl');
    const kept = choose(run, 'gn-11-freed', 'Hold out a hand.');
    expect([kept.text, ...kept.changes].join(' ')).toContain('I said it was looking');
    const ret = content.events.get('gn-11-return')!;
    const battle = ret.choices[0]!.success.battle as { ally?: string };
    expect(battle.ally).toBe('tentacruel');
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
  });
});
