// Greenneedle part 8: gn.35 Thunderstorm Ridge (tools/events/co/greenneedle-8.ts; rules in src/core/greenneedle/ridge.ts).
import { describe, expect, it } from 'vitest';
import type { PokemonInstance, RunState } from '../../src/core/state';
import { content } from './helpers';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { takeTurn } from '../../src/core/run';
import { chooseEvent } from '../../src/core/events';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { moveBlockReason } from '../../src/core/battle/moveBlock';
import { hashSeed, Rng } from '../../src/core/rng';
import { earthLine, lightning, ridgeCatch } from '../../src/core/greenneedle/ridge';
import { choose, flagOf, gnRun, open, openSide, scene, setFlag, win } from './helpers/gnPlay';

const said = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');
/** A choice with a skill prompt, played at `grade`. */
const graded = (run: RunState, eventId: string, label: string, grade: 'miss' | 'good'): ReturnType<typeof chooseEvent> => {
  const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
  const side = here.sides.find((x) => x.kind === 'event' && !x.used && x.eventId === eventId)!;
  return chooseEvent(content, run, side.id, scene(run, eventId).labels.indexOf(label), undefined, grade);
};
const withMoves = (species: string, level: number, uid: string, ...moves: string[]): PokemonInstance => {
  const m = createPokemon(content, species, level, uid);
  m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  return m;
};

describe('gn.35 Thunderstorm Ridge: the lightning', () => {
  const struck = (setup: (mon: PokemonInstance, run: RunState) => void, species = 'rattata'): { run: RunState; line: string } => {
    const run = gnRun(`t35-bolt-${species}`);
    run.party.unshift(createPokemon(content, species, 20, 'p-lead'));
    setup(run.party[0]!, run);
    return { run, line: lightning(content, run, 20, 0) };
  };

  it('a roll above the chance does nothing; a strike warns first, paralyses the lead and is counted', () => {
    const run = gnRun('t35-none');
    expect(lightning(content, run, 20, 0.2)).toBe('');
    expect(flagOf(run, 'ridge-struck')).toBe(0);
    const { run: hit, line } = struck(() => {});
    expect(line).toMatch(/fur stands up/);
    expect(hit.party[0]!.status?.id).toBe('par');
    expect(flagOf(hit, 'ridge-struck')).toBe(1);
  });

  it('a Ground-type in front, a held Metal Coat, or the hilltop\'s rod takes it', () => {
    expect(struck(() => {}, 'sandshrew').line).toMatch(/into the hill/);
    const coat = struck((m) => (m.held = { 'metal-coat': 1 }));
    expect(coat.line).toMatch(/Metal Coat/);
    expect(coat.run.party[0]!.status).toBeFalsy();
    const rod = struck((_m, r) => setFlag(r, 'hilltop-rod'));
    expect(rod.line).toMatch(/iron rod from the hilltop/);
    expect(rod.run.party[0]!.status).toBeFalsy();
  });

  it('Volt Absorb drinks it (heals); Lightning Rod holds it (+1 Sp. Atk next battle); an Electric-type isn\'t paralysed', () => {
    const volt = struck((m) => {
      m.fixedAbility = 'volt-absorb';
      m.hp = 1;
    });
    expect(volt.run.party[0]!.hp).toBeGreaterThan(1);
    const rod = struck((m) => (m.fixedAbility = 'lightning-rod'));
    expect(rod.run.party[0]!.boosts).toContainEqual({ kind: 'stage', stat: 'spa', stages: 1, turns: 99 });
    expect(struck(() => {}, 'pikachu').run.party[0]!.status).toBeFalsy();
  });

  it('the hilltop event\'s "Wait for the strike." keeps a length of the rod', () => {
    const run = gnRun('t35-hill');
    open(run, 'w4-lightning-rod');
    expect(flagOf(choose(run, 'w4-lightning-rod', 'Wait for the strike.').run, 'hilltop-rod')).toBe(1);
  });
});

describe('gn.35 Thunderstorm Ridge: the climb', () => {
  const climb = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
    const run = gnRun(seed);
    setup(run);
    open(run, 'gn-35-door');
    return choose(run, 'gn-35-door', 'Climb toward the storm.').run;
  };
  const toField = (run0: RunState): RunState => {
    const run = choose(run0, 'gn-35-gate', 'Go up.').run;
    return graded(run, 'gn-35-path', 'Cross on the long gap.', 'good').run;
  };

  it('a door at step 16 needing storm or high ground, A7, instead of the battle; six nodes from the Scorched Gate', () => {
    expect(content.coPlacement!.get('gn-35-door')).toMatchObject({ home: 16, window: [14, 18], sits: 'optional', attaches: 'instead', earliest: 7, tags: ['storm|high'] });
    const run = climb('t35-door');
    expect(openSide(run)!.eventId).toBe('gn-35-gate');
    expect(scene(run, 'gn-35-gate').intro).toMatch(/hit forty times and hasn't come down/);
    expect(Object.keys(run.story.flags).some((k) => k.startsWith('ev:cast-ridge-one:'))).toBe(true);
  });

  it('if you grounded the stuck Mega Manectric (NE9), Ada knows you', () => {
    expect(scene(climb('t35-ne9', (r) => setFlag(r, 'mega-grounded')), 'gn-35-gate').intro).toMatch(/You again\. You know what to do, then\./);
  });

  it('the Counting Path: a miss is a strike and another try; the long gap gets you across', () => {
    const run = choose(climb('t35-path'), 'gn-35-gate', 'Go up.').run;
    const before = flagOf(run, 'ridge-struck');
    const missed = graded(run, 'gn-35-path', 'Cross on the long gap.', 'miss').run;
    expect(flagOf(missed, 'ridge-struck')).toBe(before + 1);
    expect(openSide(missed)!.eventId).toBe('gn-35-path');
    expect(openSide(toField(climb('t35-path2')))!.eventId).toBe('gn-35-field');
  });

  it('the Crystal Field: the doc\'s three choices; each crystal draws a follower you face before going on', () => {
    const field = toField(climb('t35-field'));
    expect(scene(field, 'gn-35-field').labels).toEqual(['Take one.', 'Take three.', 'Take none.']);
    const none = choose(field, 'gn-35-field', 'Take none.').run;
    expect(scene(none, 'gn-35-bridge').labels).toEqual(['Cross when it\'s dark.']);
    const one = choose(field, 'gn-35-field', 'Take one.').run;
    expect(flagOf(one, 'ridge-followers')).toBe(1);
    expect(scene(one, 'gn-35-bridge').labels).toEqual(['Face what\'s following you.', 'Drop a crystal.']);
    const faced = choose(one, 'gn-35-bridge', 'Face what\'s following you.').run;
    expect(openSide(faced)!.eventId).toBe('gn-35-follower');
    const fought = win(choose(faced, 'gn-35-follower', 'Turn and face it.').run);
    expect(flagOf(fought, 'ridge-followers')).toBe(0);
    expect(scene(fought, 'gn-35-bridge').labels).toContain('Cross when it\'s dark.');
  });

  it('a dropped crystal is followed by whatever was following you', () => {
    const one = choose(toField(climb('t35-drop')), 'gn-35-field', 'Take one.');
    const r = choose(one.run, 'gn-35-bridge', 'Drop a crystal.');
    expect(said(r)).toMatch(/Stays with it/);
    expect([flagOf(r.run, 'ridge-crystals'), flagOf(r.run, 'ridge-followers')]).toEqual([0, 0]);
  });

  it('a friendly follower is caught twice as easily', () => {
    const run = gnRun('t35-friendly');
    const battle = { eventRule: { gn: 'ridge' as const } };
    expect(ridgeCatch(run, battle)).toBe(1);
    setFlag(run, 'ridge-friendly');
    expect(ridgeCatch(run, battle)).toBe(2);
    expect(ridgeCatch(run, { eventRule: undefined })).toBe(1);
  });

  it('three crystals: the overcharged one comes to the Shelter, a node early, and the tally marks are its own', () => {
    let run = choose(toField(climb('t35-three')), 'gn-35-field', 'Take three.').run;
    for (let i = 0; i < 3; i++) run = choose(run, 'gn-35-bridge', 'Drop a crystal.').run;
    expect(flagOf(run, 'ridge-crystals')).toBe(0);
    let three = choose(toField(climb('t35-three-b')), 'gn-35-field', 'Take three.').run;
    while (flagOf(three, 'ridge-followers') > 0) three = win(choose(choose(three, 'gn-35-bridge', 'Face what\'s following you.').run, 'gn-35-follower', 'Turn and face it.').run);
    three = graded(three, 'gn-35-bridge', 'Cross when it\'s dark.', 'good').run;
    expect(openSide(three)!.eventId).toBe('gn-35-hiding');
    expect(scene(three, 'gn-35-hiding').intro).toMatch(/The tally marks are its own/);
    expect(scene(three, 'gn-35-hiding').labels).toEqual(['Defeat it.']);
  });

  /** Straight to the summit with no crystals. */
  const summit = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
    let run = choose(toField(climb(seed, setup)), 'gn-35-field', 'Take none.').run;
    run = graded(run, 'gn-35-bridge', 'Cross when it\'s dark.', 'good').run;
    expect(scene(run, 'gn-35-shelter').intro).toMatch(/Something's been counting/);
    return choose(run, 'gn-35-shelter', 'Rest, then climb.').run;
  };
  const withGround = (r: RunState): void => {
    r.party.unshift(withMoves('sandslash', 30, 'p-ground', 'protect', 'earthquake'));
  };

  it('the summit: "Defeat it." / "Earth it." (Earth it needs a Ground-type); defeating it gives the capsule from the glass', () => {
    expect(scene(summit('t35-sum'), 'gn-35-summit').labels).toEqual(['Defeat it.']);
    const run = summit('t35-sum-g', withGround);
    expect(scene(run, 'gn-35-summit').labels).toEqual(['Defeat it.', 'Earth it.']);
    const fight = choose(run, 'gn-35-summit', 'Defeat it.').run;
    expect(fight.battle!.eventRule).toMatchObject({ gn: 'overcharged', noCatch: true });
    const after = win(fight);
    expect(flagOf(after, 'ridge-end')).toBe(1);
    // A catalog item for a Pokémon is used at once on the first one it fits (or sold when none fits).
    const taken = choose(after, 'gn-35-glass', 'Take the capsule.');
    expect(said(taken)).toMatch(/Summit Ability Capsule/);
    expect(flagOf(taken.run, 'ridge-done')).toBe(1);
  });

  it('earthing: the Ground-type leads and stands three turns; then it follows you down with Grounded Heart, and the Ground-type gains Bond', () => {
    const run = summit('t35-earth', withGround);
    const fight = choose(run, 'gn-35-summit', 'Earth it.').run;
    expect(fight.battle!.eventRule).toMatchObject({ gn: 'earthing', leadType: 'ground', noSwitch: true, surviveTurns: 3 });
    expect(fight.party[fight.battle!.activeIndex]!.uid).toBe('p-ground');
    const bond = fight.party.find((m) => m.uid === 'p-ground')!.friendship;
    const t1 = takeTurn(content, fight, { kind: 'move', index: 1 });
    expect(t1.run.battle!.enemyTeam[0]!.hp).toBe(maxHp(content, t1.run.battle!.enemyTeam[0]!));
    expect(JSON.stringify(t1.events)).toMatch(/It's needed there/);
    expect(JSON.stringify(t1.events)).toMatch(/bolts bend away from it/);
    const after = win(t1.run);
    expect(flagOf(after, 'ridge-end')).toBe(2);
    const done = choose(after, 'gn-35-earthed', 'Take the capsule, and go down.').run;
    const one = [...done.party, ...done.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.fixedAbility === 'grounded-heart');
    expect(one).toBeTruthy();
    expect(done.party.find((m) => m.uid === 'p-ground')!.friendship).toBeGreaterThan(bond);
  });

  it('with NE9 remembered, earthing takes two turns', () => {
    const run = summit('t35-earth2', (r) => {
      withGround(r);
      setFlag(r, 'mega-grounded');
    });
    expect(choose(run, 'gn-35-summit', 'Earth it.').run.battle!.eventRule).toMatchObject({ surviveTurns: 2 });
    expect([earthLine(1, 2), earthLine(2, 2)]).toEqual([expect.stringMatching(/bend away/), expect.stringMatching(/sky over the summit clears/)]);
    expect(earthLine(3, 3)).toMatch(/sits down, hard/);
  });

  it('afterstory: Ada and Kip\'s forecast, a later stage', () => {
    const ev = content.events.get('gn-35-forecast')!;
    expect(ev.intro).toMatch(/Clear over the ridge\. First time in a month\. Don't know why\./);
  });
});

describe('gn.35 battle rules and Grounded Heart', () => {
  const duel = (player: PokemonInstance, enemy: PokemonInstance, seed: string, gn: 'overcharged' | 'earthing'): BattleContext => {
    const battle = createBattle('wild', [enemy], 0, player.uid);
    battle.eventRule = { gn, ...(gn === 'earthing' ? { surviveTurns: 3 } : {}) } as never;
    return { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}-c`)), catchMultiplier: 1 };
  };

  it('overcharged: its Electric moves always paralyse; each turn it gains +1 Sp. Atk and loses 1/16 of its HP', () => {
    const foe = withMoves('manectric', 30, 'e', 'thunder-shock');
    const ctx = duel(withMoves('rattata', 60, 'p', 'splash'), foe, 't35-over', 'overcharged');
    ctx.party[0]!.hp = 999;
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(ctx.party[0]!.status?.id).toBe('par');
    expect(ctx.battle.enemyStages.spa).toBe(1);
    expect(foe.hp).toBe(maxHp(content, foe) - Math.floor(maxHp(content, foe) / 16));
  });

  it('earthing: an attack is greyed while a status move is left', () => {
    const me = withMoves('sandslash', 30, 'p', 'protect', 'earthquake');
    const ctx = duel(me, withMoves('manectric', 30, 'e', 'thunder-shock'), 't35-grey', 'earthing');
    expect(moveBlockReason(content, ctx.battle, me, 1)).toBe('It needs you to stand there');
    expect(moveBlockReason(content, ctx.battle, me, 0)).toBeNull();
  });

  it('Grounded Heart: the first paralysis of the battle doesn\'t land, and it gains +1 Speed', () => {
    const me = withMoves('rattata', 40, 'p', 'splash');
    me.fixedAbility = 'grounded-heart';
    const ctx = duel(me, withMoves('ekans', 40, 'e', 'glare'), 't35-heart', 'overcharged');
    ctx.battle.eventRule = undefined;
    me.hp = 999;
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(me.status).toBeFalsy();
    expect(ctx.battle.playerStages.spe).toBe(1);
  });
});
