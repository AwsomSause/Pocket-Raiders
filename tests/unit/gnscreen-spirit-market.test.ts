// gn.new.11 The Night Parade: the Spirit Market as a screen of its own (src/core/greenneedle/spiritMarket.ts, spiritMarketEnd.ts).
// Doc: "Six actions before the lanterns burn down. A counter on screen shows the lanterns left." Four stalls; the bell at the fifth
// action; staying past six swaps one item for another of the same tier.
import { describe, expect, it } from 'vitest';
import { RunStateSchema, type RunState } from '../../src/core/state';
import { leaveMinigame, minigameAct, minigameView } from '../../src/core/minigame/flow';
import { MARKET_ID, MARKET_LANTERNS, stallShut, type MarketState } from '../../src/core/greenneedle/spiritMarket';
import { MARKET_BELL_LINE } from '../../src/core/greenneedle/spiritMarketEnd';
import { dusclopsLessons } from '../../src/core/greenneedle/parade';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, openSide, scene, setFlag } from './helpers/gnPlay';

const D = 'gn-new-11-door';
const st = (run: RunState): MarketState => run.minigame!.state as unknown as MarketState;
const FOUR = ['tackle', 'growl', 'leer', 'scratch'];
const memory = (text: string, importance: number) => ({ eventId: 't', seq: 1, type: 'storyMoment', text, importance, emotions: [], actors: [] }) as never;

/** A run at the parade's door, set up by `prep`, then "Join the back of the line.". */
function join(seed: string, prep: (run: RunState) => void = () => undefined): RunState {
  const run = gnRun(seed);
  run.party[0]!.moves = FOUR.map((id) => ({ id, pp: 10 }));
  prep(run);
  open(run, D);
  return choose(run, D, 'Join the back of the line.').run;
}
const press = (run: RunState, ...ids: string[]): RunState => ids.reduce((r, id) => minigameAct(content, r, id), run);
/** One Banette trade: the first move on the cloth, for the lead, who gives its last move. */
function banette(run: RunState): RunState {
  const uid = run.party[0]!.uid;
  const r = press(run, 'stall:banette', `take:${st(run).cloth[0]!.id}`, `mon:${uid}`);
  return press(r, `give:${r.party[0]!.moves.at(-1)!.id}`);
}
const total = (run: RunState): number => Object.values(run.inventory).reduce((a, b) => a + b, 0);

describe('gn.new.11 the Spirit Market', () => {
  it('the data: six lanterns, only a story opens it, no medal money', () => {
    const def = content.minigames.games.find((g) => g.id === MARKET_ID)!;
    expect(def).toMatchObject({ eventOnly: true, attemptLimit: 1, durationLimit: 0 });
    expect(def.difficultyTiers[0]!.params).toEqual({ lanterns: 6 });
    expect(Object.values(def.rewardTable).every((r) => r.money === 0 && !r.item)).toBe(true);
  });

  it('"Join the back of the line." opens the market itself, not a choice scene: six lanterns, four stalls, three moves on the cloth', () => {
    const run = join('sm-open');
    expect(run.phase).toBe('minigame');
    expect(run.minigame!.id).toBe(MARKET_ID);
    expect(flagOf(run, 'parade-joined')).toBe(1);
    expect(flagOf(run, 'parade-lanterns')).toBe(6);
    expect(openSide(run)?.eventId).not.toBe('gn-new-11-lane-a');
    const s = st(run);
    expect(s).toMatchObject({ lanterns: MARKET_LANTERNS, max: 6, at: 'lanes', trades: 0, bell: false });
    expect(s.cloth).toHaveLength(3);
    expect(new Set(s.cloth.map((m) => m.type)).has('ghost')).toBe(true);
    const view = minigameView(content, run);
    expect(view.hud[0]).toBe('Lanterns: 6/6');
    expect(view.cells.map((c) => c.id)).toEqual(['stall:banette', 'stall:sableye', 'stall:mismagius', 'stall:dusclops', 'leave']);
    expect(view.back).toBe('leave');
  });

  it('the Masked Banette: the player picks the move, the Pokémon and the move it gives; one lantern goes out', () => {
    const start = join('sm-banette');
    const take = st(start).cloth[1]!.id;
    const uid = start.party[0]!.uid;
    let run = press(start, 'stall:banette');
    expect(minigameView(content, run).cells.map((c) => c.id)).toEqual([...st(start).cloth.map((m) => `take:${m.id}`), 'back']);
    run = press(run, `take:${take}`, `mon:${uid}`);
    expect(minigameView(content, run).cells.map((c) => c.id)).toEqual([...FOUR.map((id) => `give:${id}`), 'back']);
    expect(st(run).lanterns).toBe(6);
    run = press(run, 'give:growl');
    expect(run.party[0]!.moves.map((m) => m.id)).toEqual(['tackle', take, 'leer', 'scratch']);
    expect(run.party[0]!.moves[1]!.pp).toBe(content.moves.get(take)!.pp);
    expect(st(run)).toMatchObject({ lanterns: 5, trades: 1, at: 'lanes', todo: null });
    expect(flagOf(run, 'parade-lanterns')).toBe(5);
    expect(run.pending).toEqual([]);
    expect(st(run).log[0]).toMatch(/Masked Banette/);
    // The cloth is dealt again, and never shows a move the lead now knows.
    expect(st(run).cloth).toHaveLength(3);
    expect(st(run).cloth.some((m) => m.id === take)).toBe(false);
  });

  it('a Pokémon with fewer than four moves can still trade one for one (it keeps the same number)', () => {
    let run = join('sm-two', (r) => { r.party[0]!.moves = [{ id: 'tackle', pp: 10 }, { id: 'growl', pp: 10 }]; });
    run = banette(run);
    expect(run.party[0]!.moves).toHaveLength(2);
    expect(run.party[0]!.moves[0]!.id).toBe('tackle');
    expect(st(run).lanterns).toBe(5);
  });

  it('looking is free: walking up to a stall and back, or to the gate and back, spends nothing', () => {
    let run = join('sm-look');
    run = press(run, 'stall:banette', `take:${st(run).cloth[0]!.id}`, 'back', 'back', 'stall:dusclops', 'back', 'leave', 'back');
    expect(st(run)).toMatchObject({ lanterns: 6, trades: 0, at: 'lanes', step: 0, done: false });
    expect(run.party[0]!.moves.map((m) => m.id)).toEqual(FOUR);
  });

  it('a stall with nothing to trade is shut and says why; pressing it does nothing', () => {
    // (Joining the line is itself a Notebook line, so the Notebook is emptied after the market opens: the Sableye looks again at the next press.)
    let run = join('sm-shut', (r) => { for (const m of r.party) if (m.care) delete m.care.nickname; });
    run = structuredClone(run);
    run.story.chronicle = [];
    run = press(run, 'stall:banette', 'back');
    const s = st(run);
    expect(stallShut(s, 'sableye')).toMatch(/Notebook/);
    expect(stallShut(s, 'mismagius')).toMatch(/nickname/);
    const cells = minigameView(content, run).cells;
    expect(cells.find((c) => c.id === 'stall:sableye')).toMatchObject({ disabled: true });
    expect(cells.find((c) => c.id === 'stall:mismagius')).toMatchObject({ disabled: true });
    const after = press(run, 'stall:sableye', 'stall:mismagius', 'nonsense', 'give:tackle', 'yes');
    expect(st(after)).toMatchObject({ lanterns: 6, at: 'lanes', trades: 0 });
  });

  it('the Sableye: the least memorable Notebook line is shown, then erased, for a Rare item', () => {
    const start = join('sm-sableye', (r) => { r.story.chronicle = [memory('a big thing', 80), memory('a small thing', 0)]; r.inventory = {}; });
    expect(st(start).memory).toBe('a small thing');
    let run = press(start, 'stall:sableye');
    expect(minigameView(content, run).prompt).toContain('a small thing');
    const money = run.money;
    run = press(run, 'yes');
    expect(run.story.chronicle.map((c) => c.text)).toContain('a big thing');
    expect(run.story.chronicle.map((c) => c.text)).not.toContain('a small thing');
    expect(st(run).lanterns).toBe(5);
    expect(st(run).memory).not.toBe('a small thing');
    const got = Object.keys(run.inventory);
    expect(got.length === 1 ? content.catalog.get(got[0]!)?.rarity : run.money > money ? 'rare' : 'none').toBe('rare');
  });

  it('the Mismagius: the player says whose nickname goes; one hidden stop on this stage shows itself', () => {
    const start = join('sm-mis', (r) => {
      r.party[0]!.care = { ...r.party[0]!.care!, nickname: 'Pip' };
      r.stage!.map.nodes.find((n) => n.sides.length > 0)!.sides[0]!.hidden = true;
    });
    const hidden = (r: RunState): number => r.stage!.map.nodes.filter((n) => n.sides.some((x) => x.hidden)).length;
    const before = hidden(start);
    expect(before).toBeGreaterThan(0);
    let run = press(start, 'stall:mismagius');
    expect(minigameView(content, run).cells[0]!.label).toBe('Give up "Pip".');
    run = press(run, `mon:${start.party[0]!.uid}`);
    expect(run.party[0]!.care?.nickname).toBeUndefined();
    expect(hidden(run)).toBe(before - 1);
    expect(st(run).lanterns).toBe(5);
    // No nickname left: the stall is shut now.
    expect(stallShut(st(run), 'mismagius')).not.toBe('');
  });

  it('the Mismagius takes no name when nothing on the stage is hidden', () => {
    const run = join('sm-mis-none', (r) => {
      r.party[0]!.care = { ...r.party[0]!.care!, nickname: 'Pip' };
      for (const n of r.stage!.map.nodes) for (const x of n.sides) delete x.hidden;
    });
    expect(stallShut(st(run), 'mismagius')).toMatch(/hidden/);
    expect(press(run, 'stall:mismagius').party[0]!.care?.nickname).toBe('Pip');
  });

  it('the Old Dusclops: any one egg move of the line, the player\'s choice, for a move it knows', () => {
    const start = join('sm-egg');
    const lessons = dusclopsLessons(content, start.party[0]!);
    expect(lessons.length).toBeGreaterThan(1);
    const uid = start.party[0]!.uid;
    let run = press(start, 'stall:dusclops', `mon:${uid}`);
    expect(minigameView(content, run).cells.map((c) => c.id)).toEqual([...lessons.map((id) => `take:${id}`), 'back']);
    const want = lessons.at(-1)!;
    run = press(run, `take:${want}`, 'give:tackle');
    expect(run.party[0]!.moves.map((m) => m.id)).toEqual([want, 'growl', 'leer', 'scratch']);
    expect(st(run).lanterns).toBe(5);
    expect(st(run).party[0]!.lessons.some((m) => m.id === want)).toBe(false);
  });

  it('the bell rings at the fifth action; the sixth ends in the dark, where only the gate is left', () => {
    let run = join('sm-six');
    for (let n = 1; n <= 4; n += 1) run = banette(run);
    expect(st(run)).toMatchObject({ lanterns: 2, bell: false });
    run = banette(run);
    expect(st(run)).toMatchObject({ lanterns: 1, bell: true, at: 'lanes' });
    expect(minigameView(content, run).prompt).toContain(MARKET_BELL_LINE);
    run = banette(run);
    expect(st(run)).toMatchObject({ lanterns: 0, at: 'dark', trades: 6, done: false });
    expect(flagOf(run, 'parade-lanterns')).toBe(0);
    const view = minigameView(content, run);
    expect(view.cells.map((c) => c.id)).toEqual(['go', 'stay']);
    expect(view.back).toBeUndefined();
    // No seventh trade.
    expect(st(press(run, 'stall:banette')).at).toBe('dark');
  });

  it('leaving on time: out through the gate, nothing swapped, back on the map', () => {
    let run = join('sm-time', (r) => { r.inventory = { 'rare-candy': 1 }; });
    for (let n = 0; n < 6; n += 1) run = banette(run);
    run = press(run, 'go');
    expect(st(run)).toMatchObject({ done: true, ended: 'time' });
    expect(run.minigame!.outcome!.lines.join(' ')).toMatch(/folds up like a letter/);
    expect(run.minigame!.outcome!.lines.join(' ')).toContain('Trades made: 6 of 6.');
    expect(run.minigame!.outcome!.money).toBe(0);
    expect(run.inventory).toEqual({ 'rare-candy': 1 });
    // Pressing on after the end changes nothing.
    expect(press(run, 'stay', 'go')).toEqual(run);
    const map = leaveMinigame(run);
    expect(map.phase).toBe('map');
    expect(map.minigame).toBeNull();
  });

  it('staying past six: one item is swapped for another of the same tier, once', () => {
    let run = join('sm-stay', (r) => { r.inventory = { 'rare-candy': 1 }; });
    for (let n = 0; n < 6; n += 1) run = banette(run);
    run = press(run, 'stay');
    expect(st(run)).toMatchObject({ done: true, ended: 'stayed', todo: null });
    expect(run.inventory['rare-candy']).toBeUndefined();
    expect(total(run)).toBe(1);
    expect(content.catalog.get(Object.keys(run.inventory)[0]!)!.rarity).toBe(content.catalog.get('rare-candy')!.rarity);
    expect(run.minigame!.outcome!.lines.join(' ')).toMatch(/You wake at the next step.*Rare Candy is gone/);
    const bag = structuredClone(run.inventory);
    expect(press(run, 'stay').inventory).toEqual(bag);
  });

  it('staying with an empty Bag swaps nothing and says so', () => {
    let run = join('sm-stay-empty', (r) => { r.inventory = {}; });
    for (let n = 0; n < 6; n += 1) run = banette(run);
    run = press(run, 'stay');
    expect(run.inventory).toEqual({});
    expect(run.minigame!.outcome!.lines.join(' ')).toMatch(/nothing in it to swap/);
  });

  it('leaving early: the gate asks once, then the market is gone; the lanterns left are not kept', () => {
    let run = banette(join('sm-early'));
    run = press(run, 'leave');
    expect(st(run)).toMatchObject({ at: 'gate', done: false });
    run = press(run, 'go');
    expect(st(run)).toMatchObject({ done: true, ended: 'early', lanterns: 5 });
    expect(run.minigame!.outcome!.lines.join(' ')).toMatch(/gone before you reach the road/);
    expect(flagOf(run, 'parade-trades')).toBe(1);
    expect(flagOf(run, 'parade-all')).toBe(0);
    expect(openSide(leaveMinigame(run))?.eventId).not.toBe('gn-new-11-curtain');
    // Trading nothing at all is allowed.
    const none = press(join('sm-none'), 'leave', 'go');
    expect(none.minigame!.outcome!.lines).toContain('You traded nothing.');
  });

  it('the curtain: in the last region, for a player who joined every parade, its room opens when the market closes', () => {
    const last = (r: RunState): void => { r.regionIndex = r.regionOrder.length - 1; setFlag(r, 'parade-joined', r.regionOrder.length - 1); };
    let run = press(join('sm-curtain', last), 'leave', 'go');
    expect(flagOf(run, 'parade-all')).toBe(1);
    expect(st(run).room).toBeTruthy();
    run = leaveMinigame(run);
    expect(openSide(run)).toMatchObject({ id: expect.any(String), eventId: 'gn-new-11-curtain' });
    run = choose(run, 'gn-new-11-curtain', 'Take its lantern.').run;
    expect(run.party.some((m) => m.speciesId === 'litwick') || run.pending.length > 0 || run.box.length > 0).toBe(true);
    // Staying past six in the last region opens it too, once.
    let stay = join('sm-curtain-stay', last);
    for (let n = 0; n < 6; n += 1) stay = banette(stay);
    stay = leaveMinigame(press(stay, 'stay'));
    expect(stay.stage!.map.nodes.flatMap((n) => n.sides).filter((x) => x.eventId === 'gn-new-11-curtain')).toHaveLength(1);
    // Closing the game half-way (no gate) is the same as walking out: the curtain still waits.
    const shut = leaveMinigame(banette(join('sm-curtain-shut', last)));
    expect(shut.phase).toBe('map');
    expect(openSide(shut)?.eventId).toBe('gn-new-11-curtain');
  });

  it('failure: a trade the Pokémon can no longer make gives the lantern back and changes nothing', () => {
    const start = join('sm-fail');
    const uid = start.party[0]!.uid;
    let run = press(start, 'stall:banette', `take:${st(start).cloth[0]!.id}`, `mon:${uid}`);
    // The run is changed behind the stall's back: the move it meant to give is gone.
    run = structuredClone(run);
    run.party[0]!.moves = ['tackle', 'leer', 'scratch'].map((id) => ({ id, pp: 10 }));
    run = press(run, 'give:growl');
    expect(run.party[0]!.moves.map((m) => m.id)).toEqual(['tackle', 'leer', 'scratch']);
    expect(st(run)).toMatchObject({ lanterns: 6, trades: 0, todo: null, bell: false });
    expect(st(run).used.banette).toBe(0);
    expect(minigameView(content, run).prompt).toMatch(/No lantern is spent/);
    // A Pokémon that left the party: the same.
    let gone = press(start, 'stall:banette', `take:${st(start).cloth[0]!.id}`, `mon:${uid}`);
    gone = structuredClone(gone);
    gone.party[0]!.uid = 'someone-else';
    gone = press(gone, 'give:growl');
    expect(st(gone)).toMatchObject({ lanterns: 6, trades: 0 });
    expect(gone.party[0]!.moves.map((m) => m.id)).toEqual(FOUR);
  });

  it('save and reload half-way: the same night goes on, and no trade is done twice', () => {
    let run = join('sm-save', (r) => { r.inventory = { 'rare-candy': 2 }; });
    run = banette(banette(run));
    run = press(run, 'stall:dusclops', `mon:${run.party[0]!.uid}`);
    const loaded = RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(loaded.minigame).toEqual(run.minigame);
    expect(st(loaded)).toMatchObject({ lanterns: 4, at: 'dusclops', step: 1 });
    const rest = (r: RunState): RunState => {
      let x = press(r, `take:${st(r).party[0]!.lessons[0]!.id}`, `give:${r.party[0]!.moves[0]!.id}`);
      for (let n = 0; n < 3; n += 1) x = banette(x);
      return press(x, 'stay');
    };
    const a = rest(run), b = rest(loaded);
    expect(b.party).toEqual(a.party);
    expect(b.inventory).toEqual(a.inventory);
    expect(b.minigame).toEqual(a.minigame);
    expect(st(b).trades).toBe(6);
  });

  it('determinism: the same seed and the same presses give the same night; the run\'s other dice do not move', () => {
    const play = (seed: string): RunState => {
      let run = join(seed, (r) => { r.inventory = { 'rare-candy': 1, potion: 2 }; r.story.chronicle = [memory('one', 3), memory('two', 4)]; });
      run = banette(run);
      run = press(run, 'stall:sableye', 'yes');
      for (let n = 0; n < 4; n += 1) run = banette(run);
      return press(run, 'stay');
    };
    const a = play('sm-det'), b = play('sm-det');
    expect(b).toEqual(a);
    const before = join('sm-det');
    expect(a.rng).toEqual(before.rng);
    const other = join('sm-det-2');
    expect(JSON.stringify(st(other).cloth) === JSON.stringify(st(before).cloth) && JSON.stringify(play('sm-det-2').inventory) === JSON.stringify(a.inventory)).toBe(false);
  });

  it('a run saved in one of the earlier lane rooms still plays: the old stall scenes are kept, but nothing leads to them', () => {
    const run = gnRun('sm-old');
    setFlag(run, 'parade-joined', 1);
    setFlag(run, 'parade-lanterns', 1);
    run.party[0]!.moves = FOUR.map((id) => ({ id, pp: 10 }));
    open(run, 'gn-new-11-lane-a');
    expect(scene(run, 'gn-new-11-lane-a').intro).toContain('**1** of six');
    let r = choose(run, 'gn-new-11-lane-a', 'The Masked Banette.').run;
    r = choose(r, 'gn-new-11-banette', 'Trade a move.').run;
    expect(flagOf(r, 'parade-lanterns')).toBe(0);
    for (const e of content.events.values()) {
      if (e.id.startsWith('gn-new-11-')) continue;
      expect(JSON.stringify(e)).not.toMatch(/gn-new-11-(lane|banette|sableye|mismagius|dusclops|dark)/);
    }
    expect(JSON.stringify(content.events.get(D))).not.toMatch(/gn-new-11-lane/);
  });
});
