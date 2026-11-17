// Greenneedle gn.new.14 The Arcade Cabinet: the three played games (core/greenneedle/arcade.ts, arcadeEnd.ts).
import { describe, expect, it } from 'vitest';
import { beginMinigame, getMinigame, leaveMinigame, minigameAct, minigameTick, minigameView } from '../../src/core/minigame/flow';
import { gameModule } from '../../src/core/minigame/games';
import { hashSeed } from '../../src/core/rng';
import { ARCADE_GAMES, ARCADE_ID, mazeDistance, type ArcadeState, type MazeGame, type ShootGame, type StackGame } from '../../src/core/greenneedle/arcade';
import { RunStateSchema, type RunState } from '../../src/core/state';
import { content } from './helpers';
import { arcadePress } from './helpers/arcadePlay';
import { choose, flagOf, gnRun, open, openSide, scene } from './helpers/gnPlay';

const mod = gameModule(ARCADE_ID);
const P = getMinigame(content, ARCADE_ID).difficultyTiers[0]!.params;
const fresh = (seed: string): ArcadeState => mod.start(content, P, hashSeed(seed)) as ArcadeState;
const act = (s: ArcadeState, id: string): void => mod.act(content, s, id);
const tick = (s: ArcadeState, n = 1): void => { for (let i = 0; i < n; i++) mod.tick!(content, s); };
const SEEDS = Array.from({ length: 40 }, (_, i) => `arcade-${i}`);

/** One press a tick, the careful way, until the game on screen changes (or 400 ticks). */
function careful(s: ArcadeState): void {
  const game = s.game;
  if (s.stage === 'intro') act(s, 'a');
  for (let i = 0; i < 400 && !s.done && s.game === game && s.stage === 'play'; i++) {
    act(s, arcadePress(s));
    tick(s);
  }
}
/** No presses at all: the bird is given all the time there is. */
function patient(s: ArcadeState): void {
  const game = s.game;
  if (s.stage === 'intro') act(s, 'a');
  for (let i = 0; i < 600 && !s.done && s.game === game && s.stage === 'play'; i++) tick(s);
}
/** Three presses a tick. */
function mash(s: ArcadeState, id: string): void {
  if (s.stage === 'intro') act(s, 'a');
  for (let i = 0; i < 400 && !s.done && s.stage === 'play'; i++) {
    act(s, id); act(s, id); act(s, id);
    tick(s);
  }
}

/** A run standing at the cabinet's game, begun through the event's "Play.". */
function atCabinet(seed: string): RunState {
  const run = gnRun(seed);
  open(run, 'gn-new-14-cabinet');
  const played = choose(run, 'gn-new-14-cabinet', 'Play.').run;
  const here = played.stage!.map.nodes.find((n) => n.id === played.stage!.current)!;
  const side = here.sides.find((x) => x.kind === 'minigame' && x.minigameId === ARCADE_ID)!;
  return beginMinigame(content, played, side.id, 0);
}
const state = (run: RunState): ArcadeState => run.minigame!.state as ArcadeState;
/** Plays the run's cabinet the careful way to the end. */
function clearRun(start: RunState): RunState {
  let run = start;
  for (let i = 0; i < 1500 && !run.minigame!.outcome; i++) {
    run = minigameAct(content, run, arcadePress(state(run)));
    if (state(run).stage === 'play') run = minigameTick(content, run);
  }
  return run;
}

describe('gn.new.14 the cabinet: data and shape', () => {
  it('is an event-only game with one try, and every number comes from the data', () => {
    const def = getMinigame(content, ARCADE_ID);
    expect(def).toMatchObject({ eventOnly: true, attemptLimit: 1 });
    expect(def.rewardTable.gold.money).toBe(0);
    expect(() => mod.start(content, {}, hashSeed('x'))).toThrow(/no number/);
  });

  it('three games in the doc\'s order: a maze, a block-stacker, a one-screen shooter', () => {
    expect(ARCADE_GAMES).toEqual(['The Maze', 'The Block-Stacker', 'The Shooter']);
    const s = fresh('order');
    const kinds: string[] = [];
    for (let g = 0; g < 3 && !s.done; g++) {
      kinds.push(s.g.k);
      careful(s);
    }
    expect(kinds).toEqual(['maze', 'stack', 'shoot']);
    expect(s.done).toBe(true);
    expect(mod.result(s)).toEqual({ score: 3, max: 3 });
  });

  it('the score table has one high score, HELP, and the player never passes it', () => {
    for (const seed of SEEDS.slice(0, 10)) {
      const s = fresh(seed);
      for (let g = 0; g < 3; g++) careful(s);
      expect(s.score).toBeGreaterThan(0);
      expect(s.score).toBeLessThan(P.helpScore!);
      const table = mod.view(content, s).board!.table;
      expect(table[1]).toMatch(/^1ST\s+HELP\s+99990$/);
      expect(table).toHaveLength(3);
    }
  });

  it('the bird is the piece on every screen', () => {
    const s = fresh('bird');
    for (let g = 0; g < 3; g++) {
      const b = mod.view(content, s).board!;
      expect(b.sprites.map((x) => x.k)).toEqual(['p']);
      expect(b.tiles).toHaveLength(b.w * b.h);
      careful(s);
    }
  });
});

describe('gn.new.14 the maze', () => {
  it('always has a way out, and a careful player walks it in time', () => {
    for (const seed of SEEDS) {
      const s = fresh(seed);
      const g = s.g as MazeGame;
      const far = mazeDistance(g.cells, g.w, g.at, g.exit, false);
      expect(far).toBeGreaterThan(0);
      expect(g.left).toBe(far + P.mazeSlack!);
      careful(s);
      expect(s.cleared).toBe(1);
    }
  });

  it('rushed: three presses a tick and it panics, stops listening and bumps walls; the timer runs out', () => {
    const s = fresh('rush-maze');
    mash(s, arcadePress({ ...s, stage: 'play' }));
    expect(s.panics).toBeGreaterThan(0);
    expect((s.g as MazeGame).bumps).toBeGreaterThan(0);
    expect(s.stage).toBe('lost');
    expect(s.cleared).toBe(0);
  });

  it('boundary: the panic starts exactly at panicAt and ends only when the rush is all gone', () => {
    const s = fresh('edge');
    act(s, 'a');
    act(s, 'u'); act(s, 'u');
    expect(s.rush).toBe(4);
    expect(s.panic).toBe(false);
    act(s, 'u');
    expect(s.rush).toBe(P.panicAt);
    expect(s.panic).toBe(true);
    tick(s);
    expect(s.panic).toBe(true);
    tick(s);
    expect(s.rush).toBe(0);
    expect(s.panic).toBe(false);
    // One press a tick never builds up.
    for (let i = 0; i < 10; i++) { act(s, 'u'); tick(s); }
    expect(s.panic).toBe(false);
  });

  it('given time: it opens a shortcut the maze does not show, and the way out gets shorter', () => {
    let opened = 0;
    for (const seed of SEEDS) {
      const s = fresh(seed);
      const g = s.g as MazeGame;
      if (!g.cells.includes('s')) continue;
      const shown = mod.view(content, s).board!.tiles;
      expect(shown).not.toContain('s');
      const before = mazeDistance(g.cells, g.w, g.at, g.exit, false);
      act(s, 'a');
      tick(s, P.patience! - 1);
      expect(g.found).toBe(0);
      tick(s);
      expect(g.found).toBe(1);
      expect(g.cells).toContain('o');
      expect(mod.view(content, s).board!.tiles).toContain('o');
      expect(mazeDistance(g.cells, g.w, g.at, g.exit, false)).toBeLessThanOrEqual(before);
      opened += 1;
    }
    expect(opened).toBeGreaterThan(SEEDS.length / 2);
  });

  it('a hidden shortcut is a wall until the bird opens it', () => {
    const seed = SEEDS.find((x) => (fresh(x).g as MazeGame).cells.includes('s'))!;
    const s = fresh(seed);
    const g = s.g as MazeGame;
    const wall = g.cells.indexOf('s');
    act(s, 'a');
    const side = [[-1, 'r'], [1, 'l'], [-g.w, 'd'], [g.w, 'u']].find(([d]) => '.o'.includes(g.cells[wall + (d as number)]!))! as [number, string];
    g.at = wall + side[0];
    act(s, side[1]);
    expect(g.at).toBe(wall + side[0]);
    expect(g.bumps).toBe(1);
  });
});

describe('gn.new.14 the block-stacker and the shooter', () => {
  const at = (seed: string, game: number): ArcadeState => {
    const s = fresh(seed);
    for (let g = 0; g < game; g++) careful(s);
    expect(s.game).toBe(game);
    return s;
  };

  it('the stacker: a full row clears, and a careful player clears the rows asked for', () => {
    for (const seed of SEEDS) {
      const s = at(seed, 1);
      careful(s);
      expect(s.cleared).toBe(2);
    }
    const s = at('row', 1);
    act(s, 'a');
    const g = s.g as StackGame;
    for (let x = 0; x < g.w - 1; x++) g.cells[(g.h - 1) * g.w + x] = 1;
    g.bar = { x: g.w - 1, y: 0, w: 1, c: 2 };
    act(s, 'd');
    expect(g.rows).toBe(1);
    expect(g.cells.every((c) => c === 0)).toBe(true);
  });

  it('the stacker fails when the well fills to the top, and when the blocks run out', () => {
    const full = at('full', 1);
    act(full, 'a');
    const g = full.g as StackGame;
    // Every row under the top is full but for its last cell; the top row has one free cell left after this bar locks.
    for (let y = 1; y < g.h; y++) for (let x = 0; x < g.w - 1; x++) g.cells[y * g.w + x] = 1;
    for (let x = 1; x < g.w - 1; x++) g.cells[x] = 1;
    g.bar = { x: 0, y: 0, w: 1, c: 1 };
    act(full, 'd');
    // The next block has nowhere to appear, unless it is one square wide and lands on the one free cell.
    if (full.stage === 'play') expect(g.bar).toMatchObject({ x: g.w - 1, w: 1 });
    else expect(full.stage).toBe('lost');
    let topped = 0;
    for (const seed of SEEDS.slice(0, 8)) {
      const s = at(seed, 1);
      act(s, 'a');
      const w = s.g as StackGame;
      for (let x = 1; x < w.w; x++) w.cells[x] = 1;
      w.cells[w.w] = 1;
      w.bar = { x: 0, y: 0, w: 1, c: 1 };
      w.cells[1] = 0;
      act(s, 'd');
      if (s.stage === 'lost') topped += 1;
    }
    expect(topped).toBeGreaterThan(0);
    const out = at('out', 1);
    act(out, 'a');
    (out.g as StackGame).left = 0;
    (out.g as StackGame).bar = { x: 0, y: 0, w: 1, c: 1 };
    act(out, 'd');
    expect(out.stage).toBe('lost');
    expect(out.cleared).toBe(1);
  });

  it('the shooter: a shot takes the lowest square of the column, and a careful player clears the wall', () => {
    for (const seed of SEEDS) {
      const s = at(seed, 2);
      careful(s);
      expect(s.done).toBe(true);
      expect(s.cleared).toBe(3);
    }
    const s = at('shot', 2);
    act(s, 'a');
    const g = s.g as ShootGame;
    g.sq = [g.x, g.x + g.w, 0 === g.x ? 1 : 0];
    act(s, 'a');
    expect(g.sq).not.toContain(g.x + g.w);
    expect(g.sq).toContain(g.x);
    expect(g.hits).toBe(1);
  });

  it('the shooter fails when the wall lands on the ship\'s row', () => {
    const s = at('land', 2);
    act(s, 'a');
    const g = s.g as ShootGame;
    g.sq = [(g.h - 2) * g.w];
    g.x = g.w - 1;
    // Keep the bird busy (one press a tick, moving away) so it never helps.
    for (let i = 0; i < g.every && s.stage === 'play'; i++) { act(s, 'r'); tick(s); }
    expect(s.stage).toBe('lost');
  });

  it('given time, the bird plays both by itself: it lines blocks up and picks its own targets', () => {
    for (const seed of SEEDS) {
      const s = at(seed, 1);
      patient(s);
      expect(s.cleared).toBe(2);
      expect(s.helped).toBe(0); // counted per game: the shooter starts fresh
      patient(s);
      expect(s.cleared).toBe(3);
      expect(s.done).toBe(true);
    }
  });

  it('rushed, the stacker and the shooter are lost', () => {
    for (const game of [1, 2]) {
      let lost = 0;
      for (const seed of SEEDS.slice(0, 12)) {
        const s = at(seed, game);
        mash(s, game === 1 ? 'd' : 'a');
        expect(s.panics).toBeGreaterThan(0);
        if (s.stage === 'lost') lost += 1;
      }
      expect(lost).toBeGreaterThanOrEqual(9);
    }
  });
});

describe('gn.new.14 failing a game: the last life', () => {
  const lost = (seed: string): ArcadeState => {
    const s = fresh(seed);
    act(s, 'a');
    tick(s, 400);
    expect(s.stage).toBe('lost');
    return s;
  };

  it('it pushes the last life back across the screen, and waits: nothing moves until the player answers', () => {
    const s = lost('life');
    const v = mod.view(content, s);
    expect(v.board!.text).toMatch(/last life/);
    expect(v.cells.map((c) => c.label)).toEqual(['Take the life.', 'Walk away.']);
    expect(v.waiting).toBe(true);
    const before = JSON.stringify(s);
    tick(s, 50);
    act(s, 'l');
    expect(JSON.stringify(s)).toBe(before);
  });

  it('taking the life starts the same game again, slower each time', () => {
    const s = lost('slower');
    const first = (s.g as MazeGame).left;
    act(s, 'take');
    expect(s.stage).toBe('play');
    expect(s.game).toBe(0);
    expect(s.retries).toBe(1);
    const g = s.g as MazeGame;
    expect(g.left).toBe(Math.ceil(((mazeDistance(g.cells, g.w, g.at, g.exit, false) + P.mazeSlack!) * 150) / 100));
    expect(first).toBeLessThanOrEqual(0);
    careful(s);
    expect(s.cleared).toBe(1);
  });

  it('walking away ends it with what was cleared', () => {
    const s = lost('walk');
    act(s, 'walk');
    expect(s.done).toBe(true);
    expect(s.walked).toBe(true);
    expect(mod.result(s)).toEqual({ score: 0, max: 3 });
  });
});

describe('gn.new.14 the cabinet in a run', () => {
  it('"Play." opens the game beside the node; clearing all three opens the room where the Porygon steps out with Debug', () => {
    const start = atCabinet('run-clear');
    expect(start.phase).toBe('minigame');
    const run = clearRun(start);
    expect(run.minigame!.outcome).toMatchObject({ score: 3, max: 3, medal: 'gold', money: 0, item: null });
    expect(run.minigame!.outcome!.lines.join(' ')).not.toMatch(/₽/);
    expect(flagOf(run, 'arcade-cleared-games')).toBe(3);
    expect(flagOf(run, 'arcade-walked')).toBe(0);
    const map = leaveMinigame(run);
    expect(openSide(map)?.eventId).toBe('gn-new-14-clear');
    expect(scene(map, 'gn-new-14-clear').intro).toMatch(/One polygon at a time/);
    const r = choose(map, 'gn-new-14-clear', 'Say hello.');
    const mon = [...r.run.party, ...r.run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.speciesId === 'porygon');
    expect(mon?.fixedAbility).toBe('debug');
    expect(flagOf(r.run, 'arcade-cleared')).toBe(1);
  });

  it('failing and walking away: no Porygon, no room, arcade-walked', () => {
    let run = minigameAct(content, atCabinet('run-walk'), 'a');
    for (let i = 0; i < 400 && state(run).stage === 'play'; i++) run = minigameTick(content, run);
    run = minigameAct(content, run, 'walk');
    expect(run.minigame!.outcome).toMatchObject({ score: 0, medal: 'none', money: 0 });
    expect(flagOf(run, 'arcade-walked')).toBe(1);
    const map = leaveMinigame(run);
    expect(openSide(map)?.eventId).not.toBe('gn-new-14-clear');
    expect(map.party.some((m) => m.speciesId === 'porygon')).toBe(false);
    // One coin: the stop is spent.
    const side = map.stage!.map.nodes.find((n) => n.id === map.stage!.current)!.sides.find((x) => x.minigameId === ARCADE_ID)!;
    expect(() => beginMinigame(content, map, side.id, 0)).toThrow(/No attempts left/);
  });

  it('leaving half-way is walking away', () => {
    const run = minigameAct(content, atCabinet('run-leave'), 'a');
    const map = leaveMinigame(run);
    expect(map.phase).toBe('map');
    expect(flagOf(map, 'arcade-walked')).toBe(1);
  });

  it('the reward is paid once: more presses and ticks after the end change nothing', () => {
    const run = clearRun(atCabinet('run-once'));
    const again = minigameTick(content, minigameAct(content, run, 'a'));
    expect(again).toEqual(run);
    const here = again.stage!.map.nodes.find((n) => n.id === again.stage!.current)!;
    expect(here.sides.filter((x) => x.eventId === 'gn-new-14-clear')).toHaveLength(1);
  });

  it('save and reload in the middle of a game: the same game goes on to the same end', () => {
    let run = atCabinet('run-save');
    for (let i = 0; i < 12; i++) {
      run = minigameAct(content, run, arcadePress(state(run)));
      if (state(run).stage === 'play') run = minigameTick(content, run);
    }
    expect(state(run).stage).toBe('play');
    const loaded = RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(loaded.minigame).toEqual(run.minigame);
    expect(minigameView(content, loaded)).toEqual(minigameView(content, run));
    expect(clearRun(loaded).minigame).toEqual(clearRun(run).minigame);
  });

  it('determinism: the same seed and presses give the same games; another seed gives another maze', () => {
    const a = clearRun(atCabinet('run-same'));
    const b = clearRun(atCabinet('run-same'));
    expect(a.minigame).toEqual(b.minigame);
    expect(state(atCabinet('run-same')).g).not.toEqual(state(atCabinet('run-other')).g);
  });

  it('the games never touch the run\'s own dice', () => {
    const start = atCabinet('run-dice');
    const run = clearRun(start);
    expect(run.rng).toEqual(start.rng);
  });
});
