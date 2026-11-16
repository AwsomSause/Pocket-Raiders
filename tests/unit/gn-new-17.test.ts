// gn.new.17 The Stranding (tools/events/co/greenneedle-new-17.ts; rules in src/core/greenneedle/stranding.ts).
import { describe, expect, it } from 'vitest';
import { createPokemon } from '../../src/core/pokemon';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';
import type { RunState } from '../../src/core/state';
import { step } from './autoplay';

/** Clears a decision the Wailmer's arrival opens. */
const settle = (run: RunState): RunState => {
  for (let i = 0; i < 6 && run.phase === 'decision'; i += 1) run = step(content, run).run;
  return run;
};

const here = (run: RunState): string[] => run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.sides.filter((s) => s.kind === 'event' && !s.used).map((s) => s.eventId!);
const party = (run: RunState): void => {
  run.party = [run.party[0]!, createPokemon(content, 'squirtle', 20, 'p-sq'), createPokemon(content, 'onix', 20, 'p-on'), createPokemon(content, 'machop', 20, 'p-ma')];
  for (const m of run.party) m.hp = 99;
};
const started = (seed: string, prep?: (r: RunState) => void): RunState => {
  let run = gnRun(seed);
  party(run);
  prep?.(run);
  open(run, 'gn-new-17-beach');
  run = choose(run, 'gn-new-17-beach', 'Report to Captain Ffion.').run;
  return run;
};
/** The open room is the work room (or more): gives the waiting Pokémon one task by label. */
const job = (run: RunState, label: string): { run: RunState; text: string } => {
  const id = here(run).find((e) => e === 'gn-new-17-work' || e === 'gn-new-17-more')!;
  const labels = scene(run, id).labels;
  if (!labels.includes(label)) run = choose(run, id, labels.includes('More tasks.') ? 'More tasks.' : 'Back.').run;
  const r = choose(run, here(run).find((e) => e === 'gn-new-17-work' || e === 'gn-new-17-more')!, label);
  return { run: r.run, text: [r.text, ...r.changes].join(' ') };
};

describe('gn.new.17 The Stranding', () => {
  it('opens at the beach with Captain Ffion, bars at 3, turn 1', () => {
    const run = started('t17-open');
    expect(here(run)).toContain('gn-new-17-work');
    expect(flagOf(run, 'st-turn')).toBe(1);
    expect(scene(run, 'gn-new-17-work').intro).toContain('Turn 1 of 8');
    expect(flagOf(run, 'st-bar-wet')).toBe(3);
  });

  it('a Pokémon that can\'t do the job stays waiting; one that can moves on', () => {
    let run = started('t17-can');
    const r = job(run, 'Dig a channel.');
    run = r.run;
    expect(flagOf(run, 'st-i')).toBe(0);
    expect(r.text).toContain('not something it can do');
    expect(job(run, 'Hold the crowd.').run).toBeTruthy();
  });

  it('the tide can\'t be guided before turn 5', () => {
    const run = started('t17-tide');
    run.party = [createPokemon(content, 'squirtle', 20, 'p-sq')];
    const r = job(run, 'Guide the tide.');
    expect(r.text).toContain('isn\'t there to guide yet');
  });

  const LABELS: [string, string][] = [['wet', 'Keep it wet.'], ['shade', 'Shade it.'], ['dig', 'Dig a channel.'], ['calm', 'Calm it.'], ['crowd', 'Hold the crowd.'], ['tide', 'Guide the tide.']];
  /** Plays eight turns: each waiting Pokémon takes the neediest task it can do (or only the crowd, when `lazy`). */
  function play(run: RunState, lazy: boolean): RunState {
    for (let t = 1; t <= 8 && here(run).includes('gn-new-17-work'); t += 1) {
      for (let guard = 0; guard < 20 && !here(run).includes('gn-new-17-resolve'); guard += 1) {
        const order = lazy ? LABELS.filter(([k]) => k === 'crowd') : [...LABELS].sort((x, y) => flagOf(run, `st-bar-${x[0]}`) - flagOf(run, `st-bar-${y[0]}`));
        for (const [, label] of order) {
          const i = flagOf(run, 'st-i');
          run = job(run, label).run;
          if (flagOf(run, 'st-i') > i || here(run).includes('gn-new-17-resolve')) break;
        }
      }
      run = choose(run, 'gn-new-17-resolve', 'Let the hour pass.').run;
    }
    return run;
  }

  it('well played: four or more tasks kept up, the tide lifts it, a Wailmer joins, the town thanks you', () => {
    let run = play(started('t17-win'), false);
    expect(here(run)).toContain('gn-new-17-lifted');
    expect(flagOf(run, 'st-kept')).toBeGreaterThanOrEqual(4);
    run = settle(choose(run, 'gn-new-17-lifted', 'Watch it go.').run);
    expect(run.party.some((m) => m.speciesId === 'wailmer') || run.box.some((m) => m.speciesId === 'wailmer')).toBe(true);
    expect(flagOf(run, 'stranding-helped')).toBe(1);
    expect(flagOf(run, 'stranding-gratitude')).toBe(run.regionIndex + 1);
  });

  it('left to the townspeople: a second Wailord calls; it lives, the Wailmer still follows, nobody is lost', () => {
    let run = play(started('t17-lose'), true);
    expect(here(run)).toContain('gn-new-17-dragged');
    expect(flagOf(run, 'st-kept')).toBeLessThan(4);
    run = settle(choose(run, 'gn-new-17-dragged', 'Watch it go.').run);
    expect(run.party.concat(run.box).some((m) => m.speciesId === 'wailmer')).toBe(true);
    expect(flagOf(run, 'stranding-helped')).toBe(1);
  });

  it('a factory left running gives seven turns', () => {
    const run = started('t17-seven', (r) => setFlag(r, 'factory-left-running'));
    expect(scene(run, 'gn-new-17-work').intro).toContain('of 7');
    expect(flagOf(play(run, true), 'st-turn')).toBe(8);
  });

  it('later in the run, the festival has the calmer on its banner', () => {
    let run = play(started('t17-fest'), false);
    run = settle(choose(run, 'gn-new-17-lifted', 'Watch it go.').run);
    run.regionIndex += 1;
    open(run, 'gn-new-17-festival');
    expect(scene(run, 'gn-new-17-festival').intro).not.toContain('{stranding');
    run = choose(run, 'gn-new-17-festival', 'Join the festival.').run;
    expect(flagOf(run, 'stranding-festival')).toBe(1);
  });
});
