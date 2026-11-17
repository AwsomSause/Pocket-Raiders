// gn.41 The Pokémon Museum, fossil restoration: a real twelve-piece jigsaw (src/core/greenneedle/jigsaw.ts, jigsawEnd.ts).
// Doc: "A jigsaw. A broken skull in a sandbox. Twelve pieces. The museum pays for the work; and if it's done with no piece forced, a Rare Bone."
import { describe, expect, it } from 'vitest';
import { RunStateSchema, type RunState } from '../../src/core/state';
import { leaveMinigame, minigameAct, minigameView } from '../../src/core/minigame/flow';
import { JIGSAW_ID, JIGSAW_PIECES, pieceName, slotName, type JigsawState } from '../../src/core/greenneedle/jigsaw';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, openSide, scene } from './helpers/gnPlay';

const st = (run: RunState): JigsawState => run.minigame!.state as unknown as JigsawState;
function atSandbox(seed: string): RunState {
  const run = gnRun(seed);
  run.money = 5000;
  open(run, 'gn-41-door');
  let r = choose(run, 'gn-41-door', 'Go in.').run;
  r = choose(r, 'gn-41-foyer', 'The activities desk.').run;
  r = choose(r, 'gn-41-desk', 'Fossil restoration.').run;
  return choose(r, 'gn-41-jigsaw', 'Fit the pieces.').run;
}
/** Sets every piece from `from` on where it belongs, never forcing one. */
function finish(run: RunState, from = 0): RunState {
  let r = run;
  for (let n = from; n < JIGSAW_PIECES; n += 1) {
    r = minigameAct(content, r, `p${n}`);
    r = minigameAct(content, r, `s${n}`);
  }
  return r;
}
// A Rare Bone is a gift this game has no Bag slot for: like every such gift, it is sold on the spot (balance `events.soldGift`).
const BONE = content.items.has('rare-bone') ? 0 : content.balance.events.soldGift;
const bones = (run: RunState): number => (content.items.has('rare-bone') ? (run.inventory['rare-bone'] ?? 0) : run.money);

describe('gn.41 fossil restoration: the jigsaw', () => {
  it('the data: twelve pieces, four across, the museum pays ₽800, only a story opens it', () => {
    const def = content.minigames.games.find((g) => g.id === JIGSAW_ID)!;
    expect(def).toMatchObject({ eventOnly: true, attemptLimit: 1, durationLimit: 0 });
    expect(def.difficultyTiers[0]!.params).toEqual({ pieces: 12, cols: 4, pay: 800 });
  });

  it('opens straight from the event: twelve loose pieces in a shuffled tray, nothing placed, nothing in hand', () => {
    const run = atSandbox('jig-open');
    expect(run.phase).toBe('minigame');
    const s = st(run);
    expect(s.placed).toHaveLength(12);
    expect(s.placed.every((x) => !x)).toBe(true);
    expect([...s.tray].sort((a, b) => a - b)).toEqual(Array.from({ length: 12 }, (_, i) => i));
    expect(s.tray).not.toEqual(Array.from({ length: 12 }, (_, i) => i));
    expect(s).toMatchObject({ held: -1, forced: 0, pay: 800, cols: 4, rows: 3 });
    const view = minigameView(content, run);
    expect(view.cols).toBe(8);
    expect(view.cells).toHaveLength(24);
    expect(view.hud).toEqual(['Pieces: 0/12', 'Forced: 0', 'In hand: none']);
  });

  it('no piece forced: the museum pays, and a Rare Bone; the restoration is done for the region; the desk is next', () => {
    const start = atSandbox('jig-clean');
    const money = start.money;
    const had = bones(start);
    const run = finish(start);
    expect(st(run).done).toBe(true);
    expect(run.minigame!.outcome!.medal).toBe('gold');
    expect(run.minigame!.outcome!.lines.join(' ')).toMatch(/Twelve pieces, and not one forced\..*For a good pair of hands/);
    expect(run.money).toBe(money + 800 + BONE);
    expect(bones(run)).toBe(BONE ? had + 800 + BONE : had + 1);
    expect(run.minigame!.outcome!.lines.join(' ')).toMatch(/Rare Bone/);
    expect(flagOf(run, 'museum-jigsaw-at')).toBe(run.regionIndex + 1);
    const map = leaveMinigame(run);
    expect(map.phase).toBe('map');
    expect(openSide(map)).toMatchObject({ id: st(run).room, eventId: 'gn-41-desk' });
    expect(scene(map, 'gn-41-desk').labels).not.toContain('Fossil restoration.');
  });

  it('a piece forced: it stays in the hand and is counted; the museum still pays, but no Rare Bone', () => {
    const start = atSandbox('jig-forced');
    const money = start.money;
    const had = bones(start);
    let run = minigameAct(content, start, 'p0');
    expect(st(run).held).toBe(0);
    run = minigameAct(content, run, 's5');
    expect(st(run)).toMatchObject({ held: 0, forced: 1 });
    expect(st(run).placed[5]).toBe(false);
    expect(minigameView(content, run).prompt).toContain(`Piece ${pieceName(st(run), 0)} doesn't sit at ${slotName(st(run), 5)}`);
    run = finish(minigameAct(content, run, 's0'), 1);
    expect(run.minigame!.outcome!.medal).toBe('silver');
    expect(run.minigame!.outcome!.lines.join(' ')).toMatch(/One piece went in with a crack you'll both pretend not to have heard/);
    expect(run.money).toBe(money + 800);
    expect(bones(run)).toBe(BONE ? had + 800 : had);
    expect(run.minigame!.outcome!.lines.join(' ')).not.toMatch(/Rare Bone/);
    expect(flagOf(run, 'museum-jigsaw-forced')).toBe(1);
  });

  it('the edges: an empty hand, a filled place, putting a piece back, a made-up cell: nothing is forced, nothing breaks', () => {
    let run = atSandbox('jig-edges');
    run = minigameAct(content, run, 's3');
    expect(st(run).forced).toBe(0);
    expect(minigameView(content, run).prompt).toMatch(/Pick up a piece from the tray first/);
    run = minigameAct(content, minigameAct(content, run, 'p3'), 'p3');
    expect(st(run).held).toBe(-1);
    run = minigameAct(content, minigameAct(content, run, 'p3'), 's3');
    expect(st(run).placed[3]).toBe(true);
    // A placed piece can't be picked up again, and its place can't take another.
    run = minigameAct(content, run, 'p3');
    expect(st(run).held).toBe(-1);
    run = minigameAct(content, minigameAct(content, run, 'p4'), 's3');
    expect(st(run)).toMatchObject({ held: 4, forced: 0 });
    for (const bad of ['s99', 'p-1', 'zz', '', 's1.5']) run = minigameAct(content, run, bad);
    expect(st(run)).toMatchObject({ held: 4, forced: 0, done: false });
    expect(st(run).placed.filter(Boolean)).toHaveLength(1);
  });

  it('pays once: nothing more happens after the last piece', () => {
    const run = finish(atSandbox('jig-once'));
    const again = minigameAct(content, minigameAct(content, run, 'p0'), 's0');
    expect(again.money).toBe(run.money);
    expect(bones(again)).toBe(bones(run));
  });

  it('walking away half-way pays nothing, and the skull can be tried again from the desk', () => {
    const start = atSandbox('jig-leave');
    const money = start.money;
    const map = leaveMinigame(finish(start, 6).minigame!.outcome ? start : minigameAct(content, minigameAct(content, start, 'p0'), 's0'));
    expect(map.money).toBe(money);
    expect(flagOf(map, 'museum-jigsaw-at')).toBe(0);
  });

  it('save and reload half-way: the same pieces sit, the same piece is in the hand, and it finishes the same', () => {
    let run = atSandbox('jig-save');
    for (const id of ['p0', 's0', 'p1', 's1', 'p2', 's7', 'p2']) run = minigameAct(content, run, id);
    run = minigameAct(content, run, 'p5');
    const loaded = RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(loaded.minigame).toEqual(run.minigame);
    expect(st(loaded)).toMatchObject({ held: 5, forced: 1 });
    const a = finish(minigameAct(content, run, 's5'), 2);
    const b = finish(minigameAct(content, loaded, 's5'), 2);
    expect(b.minigame).toEqual(a.minigame);
    expect(b.money).toBe(a.money);
    expect(bones(b)).toBe(bones(a));
  });

  it('determinism: the same seed lays the tray out the same; another seed lays it out differently', () => {
    expect(st(atSandbox('jig-same')).tray).toEqual(st(atSandbox('jig-same')).tray);
    const trays = new Set(['jig-a', 'jig-b', 'jig-c', 'jig-d'].map((seed) => st(atSandbox(seed)).tray.join(',')));
    expect(trays.size).toBeGreaterThan(1);
  });
});
