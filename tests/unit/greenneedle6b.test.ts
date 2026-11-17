// Greenneedle part 6b: gn.29 The Psyduck Migration (tools/events/co/greenneedle-6.ts; Snake in src/core/greenneedle/snake.ts).
import { describe, expect, it } from 'vitest';
import type { PokemonInstance, RunState } from '../../src/core/state';
import { content } from './helpers';
import { createPokemon } from '../../src/core/pokemon';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { hashSeed, Rng } from '../../src/core/rng';
import { beginMinigame, minigameAct } from '../../src/core/minigame/flow';
import { gameModule } from '../../src/core/minigame/games';
import { H, SNAKE_ID, snakeStep, snakeTurn, TARGETS, W, type SnakeState } from '../../src/core/greenneedle/snake';
import { choose, flagOf, gnRun, open, openSide, scene, setFlag } from './helpers/gnPlay';

const said = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');
const fresh = (seed: string, golduck = 0): SnakeState => gameModule(SNAKE_ID).start(content, { golduck }, new Rng(hashSeed(seed)).state) as unknown as SnakeState;
/** Clears the street and puts one Psyduck straight ahead of the head. */
const plain = (s: SnakeState, duckAhead = 1): SnakeState => {
  s.things = [];
  s.ducks = [s.head + duckAhead];
  return s;
};

describe('gn.29 Snake (the Psyduck Migration)', () => {
  it('three rounds of 6, 10 and 15 Psyduck on a 9 by 7 street; three Psyduck to find at a time, and the round\'s things to knock over', () => {
    const s = fresh('snake-start');
    expect(TARGETS).toEqual([6, 10, 15]);
    expect([W, H]).toEqual([9, 7]);
    expect(s.ducks).toHaveLength(3);
    expect(s.things.map((t) => t.name).sort()).toEqual(['a flower pot', 'a flower pot', 'a fruit stall']);
    expect(gameModule(SNAKE_ID).view(content, s as never).cells).toHaveLength(W * H + 9);
  });

  it('walking onto a Psyduck adds it to the line, which follows where you walked', () => {
    const s = plain(fresh('snake-collect'));
    snakeStep(s);
    expect(s.collected).toBe(1);
    const at = s.head;
    snakeStep(s);
    expect(s.trail[0]).toBe(at);
  });

  it('running into the line sits everyone down: the round restarts with the ones already collected', () => {
    const s = plain(fresh('snake-line'));
    s.collected = 4;
    s.trail = [s.head - 1, s.head - 2, s.head - 3, s.head - 4];
    s.head = s.head + W; // below the line, about to turn back into it
    s.trail = [s.head - W, ...s.trail];
    snakeTurn(s, 'u');
    snakeStep(s);
    expect(s.sits).toBe(1);
    expect(s.collected).toBe(4);
    expect(s.trail).toEqual([]);
  });

  it('walking off the street sits them down too', () => {
    const s = plain(fresh('snake-edge'));
    s.ducks = [];
    snakeTurn(s, 'u');
    for (let i = 0; i < 4; i++) snakeStep(s);
    expect(s.sits).toBe(1);
  });

  it('each thing knocked over is counted, and a villager shouts; the mayor says keep going', () => {
    const s = plain(fresh('snake-knock'));
    s.ducks = [];
    s.things = [{ at: s.head + 1, name: 'the mayor' }];
    snakeStep(s);
    expect(s.knocked).toEqual(['the mayor']);
    expect(s.msg).toMatch(/Keep going, dear/);
  });

  it('Stray Confusion is telegraphed: a Psyduck glows first, then a bench lands two tiles ahead', () => {
    const s = plain(fresh('snake-glow'), 1);
    s.steps = 7;
    snakeStep(s); // collects: steps 8
    s.ducks = [];
    snakeStep(s); // steps 9: the glow
    expect(s.glow).toBe(2);
    expect(s.msg).toMatch(/glow/);
    snakeStep(s);
    expect(s.things).toHaveLength(0);
    snakeStep(s);
    expect(s.things.map((t) => t.name)).toEqual(['a bench']);
  });

  it('without a Golduck the last three drift wide on corners (and can knock things over); with one they don\'t', () => {
    const setup = (golduck: number): SnakeState => {
      const s = plain(fresh(`snake-drift-${golduck}`, golduck));
      s.ducks = [];
      s.collected = 3;
      s.head = 4 * W + 5;
      s.trail = [4 * W + 4, 4 * W + 3, 4 * W + 2];
      s.things = [{ at: 3 * W + 3, name: 'a stack of crates' }];
      snakeTurn(s, 'u');
      return s;
    };
    expect(setup(0).knocked).toEqual(['a stack of crates']);
    expect(setup(1).knocked).toEqual([]);
  });

  it('collecting the round\'s last Psyduck moves on to the next street; the Lake Road ends the game', () => {
    const s = plain(fresh('snake-round'));
    s.collected = 5;
    snakeStep(s);
    expect(s.round).toBe(1);
    expect(s.things.map((t) => t.name)).toContain('a wedding cake');
    s.round = 2;
    s.rounds = 2;
    plain(s);
    s.collected = 14;
    snakeStep(s);
    expect(s.done).toBe(true);
    expect(gameModule(SNAKE_ID).result(s as never)).toEqual({ score: 3, max: 3 });
  });

  it('it moves on ticks: slow on the High Street, every tick on the Lake Road', () => {
    const mod = gameModule(SNAKE_ID);
    const s = plain(fresh('snake-tick'), 5);
    mod.tick!(content, s as never);
    mod.tick!(content, s as never);
    expect(s.steps).toBe(0);
    mod.tick!(content, s as never);
    expect(s.steps).toBe(1);
    s.round = 2;
    mod.tick!(content, s as never);
    expect(s.steps).toBe(2);
  });
});

describe('gn.29 The Psyduck Migration (the town and the lake)', () => {
  const town = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
    const run = gnRun(seed);
    setup(run);
    open(run, 'gn-29-town');
    return run;
  };
  const played = (seed: string, rounds: number, knocked: string[] = []): RunState => {
    let run = choose(town(seed), 'gn-29-town', 'I\'ll lead them.').run;
    const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
    const side = here.sides.find((x) => x.kind === 'minigame' && x.minigameId === SNAKE_ID)!;
    run = beginMinigame(content, run, side.id, 0);
    const s = run.minigame!.state as unknown as SnakeState;
    s.rounds = rounds;
    s.knocked = knocked;
    return minigameAct(content, run, 'stop');
  };
  const atLake = (run: RunState): RunState => {
    const r = structuredClone(run);
    r.phase = 'map';
    r.minigame = null as never;
    return r;
  };

  it('at the town (step 5 until towns exist), optional, instead of the battle, A2, once a region', () => {
    expect(content.coPlacement!.get('gn-29-town')).toMatchObject({ home: 5, window: [3, 8], sits: 'optional', attaches: 'instead', earliest: 2 });
    expect(content.minigames.games.find((g) => g.id === SNAKE_ID)).toMatchObject({ eventOnly: true, attemptLimit: 1 });
  });

  it('the mayor\'s script; the doc\'s three choices; why they have headaches', () => {
    const run = town('t29-town');
    expect(scene(run, 'gn-29-town').intro).toMatch(/Mrs\. Quimby/);
    expect(scene(run, 'gn-29-town').labels).toEqual(['I\'ll lead them.', 'Why do they have headaches?', 'Not my ducks.']);
    const why = choose(run, 'gn-29-town', 'Why do they have headaches?');
    expect(why.text).toMatch(/It's what they \*are\.\*/);
    expect(scene(why.run, 'gn-29-town').labels).toEqual(['I\'ll lead them.', 'Not my ducks.']);
  });

  it('if you fell through the bridge (gn.06), the mayor says so', () => {
    expect(scene(town('t29-bridge', (r) => setFlag(r, 'kanto-bridge-fell')), 'gn-29-town').intro).toMatch(/Some fool went through it last week/);
  });

  it('"I\'ll lead them." puts the Snake game on the node; with a Golduck in the party it walks at the back', () => {
    let run = choose(town('t29-golduck', (r) => r.party.push(createPokemon(content, 'golduck', 20, 'p-g'))), 'gn-29-town', 'I\'ll lead them.').run;
    const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
    const side = here.sides.find((x) => x.kind === 'minigame' && x.minigameId === SNAKE_ID)!;
    run = beginMinigame(content, run, side.id, 0);
    expect((run.minigame!.state as unknown as SnakeState).golduck).toBe(true);
  });

  it('all three rounds, nothing knocked over: the Headache Psyduck joins, and the town gives a Rare item', () => {
    const run = atLake(played('t29-clean', 3));
    expect(flagOf(run, 'psyduck-rounds')).toBe(3);
    expect(openSide(run)!.eventId).toBe('gn-29-lake');
    expect(scene(run, 'gn-29-lake').labels).toEqual(['Kneel down to it.', 'Let it find its own way in.']);
    const r = choose(run, 'gn-29-lake', 'Kneel down to it.');
    expect(said(r)).toMatch(/Rare item/);
    const duck = [...r.run.party, ...r.run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.speciesId === 'psyduck');
    expect(duck?.fixedAbility).toBe('headache');
    expect(flagOf(r.run, 'psyduck-joined')).toBe(1);
  });

  it('a few things knocked over: a Berry bundle; the wedding cake: nothing extra', () => {
    expect(said(choose(atLake(played('t29-few', 3, ['a flower pot'])), 'gn-29-lake', 'Let it find its own way in.'))).toMatch(/Berry bundle/);
    const cake = said(choose(atLake(played('t29-cake', 3, ['a wedding cake'])), 'gn-29-lake', 'Let it find its own way in.'));
    expect(cake).toMatch(/laughing about it, eventually/);
    expect(cake).not.toMatch(/Berry bundle/);
  });

  it('stopping early: the town walks them the rest of the way, and no Psyduck joins', () => {
    const run = atLake(played('t29-stop', 1));
    expect(scene(run, 'gn-29-lake').labels).toEqual(['Leave them at the edge of town.']);
  });
});

describe('Headache (gn.29)', () => {
  const withMoves = (species: string, level: number, uid: string, ...moves: string[]): PokemonInstance => {
    const m = createPokemon(content, species, level, uid);
    m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
    return m;
  };
  const duel = (player: PokemonInstance, enemy: PokemonInstance, seed: string): BattleContext => {
    const battle = createBattle('wild', [enemy], 0, player.uid);
    return { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}-c`)), catchMultiplier: 1 };
  };

  it('a super-effective hit raises its Sp. Atk by one, up to +2 a battle', () => {
    const duck = withMoves('psyduck', 60, 'p-d', 'splash');
    duck.fixedAbility = 'headache';
    const ctx = duel(duck, withMoves('pikachu', 20, 'e', 'thunder-shock'), 't-headache');
    for (let i = 0; i < 3; i++) {
      duck.hp = 999;
      resolveTurn(ctx, { kind: 'move', index: 0 });
    }
    expect(ctx.battle.playerStages.spa).toBe(2);
  });

  it('a plain hit does nothing', () => {
    const duck = withMoves('psyduck', 60, 'p-d2', 'splash');
    duck.fixedAbility = 'headache';
    const ctx = duel(duck, withMoves('rattata', 20, 'e', 'tackle'), 't-headache2');
    resolveTurn(ctx, { kind: 'move', index: 0 });
    if (!ctx.battle.storyEffects.length) expect(ctx.battle.playerStages.spa).toBe(0);
  });
});
