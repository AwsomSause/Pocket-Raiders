// Greenneedle gn.new.21 The Orchestra (tools/events/co/greenneedle-new-21.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import type { Grade } from '../../src/core/interaction/prompt';
import { chooseEvent } from '../../src/core/events';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';
import { flagOf, gnRun, open, scene } from './helpers/gnPlay';

const sideOf = (run: RunState, id: string): string => {
  const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
  const side = here.sides.find((x) => x.kind === 'event' && !x.used && x.eventId === id);
  if (!side) throw new Error(`no open ${id}`);
  return side.id;
};
const play = (run: RunState, id: string, label: string, grade?: Grade): RunState => {
  const index = scene(run, id).labels.indexOf(label);
  if (index < 0) throw new Error(`${id}: no "${label}"`);
  return chooseEvent(content, run, sideOf(run, id), index, undefined, grade).run;
};
const has = (run: RunState, id: string): boolean => !!run.stage!.map.nodes.find((n) => n.id === run.stage!.current)?.sides.some((x) => x.kind === 'event' && !x.used && x.eventId === id);
const kricketot = (run: RunState) => [...run.party, ...run.box, ...run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.speciesId === 'kricketot');
const SECTIONS = ['drones', 'chirps', 'trills', 'tutti'];

/** Conducts all four sections, each with `grades[i]`. */
function conduct(seed: string, grades: Grade[]): RunState {
  let run = gnRun(seed);
  open(run, 'gn-new-21');
  run = play(run, 'gn-new-21', 'Step up to the stump.');
  SECTIONS.forEach((s, i) => {
    expect(has(run, `gn-new-21-${s}`)).toBe(true);
    run = play(run, `gn-new-21-${s}`, 'Bring them in.', grades[i]);
  });
  return run;
}

describe('gn.new.21 The Orchestra', () => {
  it('is built to the doc: two choices, four rhythm sections with their own prompts, no battles', () => {
    expect(scene(gnRun('o1'), 'gn-new-21').labels).toEqual(['Step up to the stump.', 'Go and find the conductor.']);
    expect(SECTIONS.map((s) => content.events.get(`gn-new-21-${s}`)!.choices[0]!.prompt)).toEqual(SECTIONS.map((s) => ({ id: `orchestra-${s}`, needs: 'ok' })));
    for (const id of ['gn-new-21', 'gn-new-21-well', 'gn-new-21-bad', 'gn-new-21-return', 'gn-new-21-bow', 'gn-new-21-night']) {
      expect(JSON.stringify(content.events.get(id))).not.toContain('"kind":"fight"');
    }
    expect(content.moves.get('encore-performance')!.effects.encorePerformance).toBe(true);
  });

  it('conducted well: the old Kricketune takes the stump back, and the back-row Kricketot joins with Encore Performance', () => {
    let run = conduct('o2', ['good', 'good', 'ok', 'good']);
    expect(flagOf(run, 'orchestra-conducted')).toBe(1);
    expect(flagOf(run, 'orchestra-score')).toBe(4);
    expect(has(run, 'gn-new-21-well')).toBe(true);
    run = play(run, 'gn-new-21-well', 'Let the back-row one come.');
    expect(flagOf(run, 'orchestra-end')).toBe(1);
    const mon = kricketot(run)!;
    expect(mon.moves.some((m) => m.id === 'encore-performance')).toBe(true);
  });

  it('conducted badly: the orchestra plays louder, and the back-row one still winks and comes', () => {
    let run = conduct('o3', ['miss', 'miss', 'ok', 'miss']);
    expect(flagOf(run, 'orchestra-score')).toBe(1);
    expect(has(run, 'gn-new-21-bad')).toBe(true);
    run = play(run, 'gn-new-21-bad', 'Let the back-row one come.');
    expect(flagOf(run, 'orchestra-end')).toBe(2);
    expect(kricketot(run)!.moves.some((m) => m.id === 'encore-performance')).toBe(true);
  });

  it('three sections right is a good performance; two is not', () => {
    expect(has(conduct('o4', ['ok', 'ok', 'ok', 'miss']), 'gn-new-21-well')).toBe(true);
    expect(has(conduct('o5', ['ok', 'ok', 'miss', 'miss']), 'gn-new-21-bad')).toBe(true);
  });

  it('find the conductor: it listens to the whole recording, gets up, and bows to the player first', () => {
    let run = gnRun('o6');
    open(run, 'gn-new-21');
    run = play(run, 'gn-new-21', 'Go and find the conductor.');
    expect(flagOf(run, 'orchestra-returned')).toBe(1);
    expect(has(run, 'gn-new-21-return')).toBe(true);
    run = play(run, 'gn-new-21-return', 'Let it play.');
    expect(has(run, 'gn-new-21-bow')).toBe(true);
    expect(scene(run, 'gn-new-21-bow').intro).toContain('bows to you before it bows to them');
    run = play(run, 'gn-new-21-bow', 'Bow back.');
    expect(flagOf(run, 'orchestra-end')).toBe(3);
    expect(kricketot(run)!.moves.some((m) => m.id === 'encore-performance')).toBe(true);
  });

  it('once per region, and the orchestra is heard at night for the rest of the region', () => {
    const run = conduct('o7', ['good', 'good', 'good', 'good']);
    const ev = content.events.get('gn-new-21')!;
    expect(JSON.stringify(ev.requires)).toContain('orchestra-at');
    const night = content.events.get('gn-new-21-night')!;
    expect(night.callback).toBe(true);
    expect(JSON.stringify(night.requires)).toContain('night');
    expect(run.story.flags['ev:orchestra-at']).toBeGreaterThan(0);
  });
});

describe('Encore Performance (engine)', () => {
  it('repeats the last move next turn at +1 priority, and fails used twice in a row', () => {
    const player = createPokemon(content, 'kricketot', 10, 'p1');
    const enemy = createPokemon(content, 'snorlax', 60, 'e1');
    enemy.moves = [{ id: 'splash', pp: 40 }];
    player.moves = ['bug-bite', 'encore-performance'].map((id) => ({ id, pp: content.moves.get(id)!.pp }));
    const battle = createBattle('wild', [enemy], 0, player.uid);
    const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('ep')), captureRng: new Rng(hashSeed('ep-c')), catchMultiplier: 1 };
    resolveTurn(ctx, { kind: 'move', index: 0 });
    resolveTurn(ctx, { kind: 'move', index: 1 });
    expect(battle.playerVolatile.locked).toMatchObject({ moveId: 'bug-bite', turns: 1, bonus: true });
    const ev = resolveTurn(ctx, { kind: 'move', index: 1 });
    // the forced move wins over the choice: Bug Bite is used, then the lock is spent
    expect(ev.some((e) => e.type === 'move' && e.side === 'player' && e.moveId === 'bug-bite')).toBe(true);
    expect(battle.playerVolatile.locked).toBeNull();
    resolveTurn(ctx, { kind: 'move', index: 1 });
    const again = resolveTurn(ctx, { kind: 'move', index: 1 });
    expect(again.some((e) => e.type === 'fail' && e.side === 'player')).toBe(true);
  });
});
