// gn.new.10 The Mirror Lake (tools/events/co/greenneedle-new-10.ts; rules in src/core/greenneedle/mirror.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { createPokemon } from '../../src/core/pokemon';
import { gnConditionMet } from '../../src/core/greenneedle';
import { mirrorRecord, mirrorReady, mirrorTeam } from '../../src/core/greenneedle/mirror';
import { content } from './helpers';
import { choose, flagOf, gnRun, lose, open, scene, setFlag, win } from './helpers/gnPlay';

const READY = { kind: 'gn', test: 'mirrorReady' } as never;
/** A run whose last lost fight is remembered, with a lake open on the node. */
const lake = (seed: string, prep?: (run: RunState) => void): RunState => {
  const run = gnRun(seed);
  run.party = [...run.party, createPokemon(content, 'pidgey', 12, 'p-pidgey')];
  run.party[1]!.moves = [{ id: 'gust', pp: 35 }];
  for (const m of run.party) m.hp = 0;
  mirrorRecord(run, { outcome: 'lose', eventRule: undefined });
  for (const m of run.party) m.hp = 1;
  prep?.(run);
  open(run, 'gn-new-10-lake');
  return run;
};

describe('gn.new.10 The Mirror Lake', () => {
  it('remembers a lost fight, or a win with one Pokémon left of two or more; not a clean win, and not its own fight', () => {
    const run = gnRun('mirror-rec');
    run.party = [...run.party, createPokemon(content, 'pidgey', 12, 'p-pidgey')];
    expect(mirrorReady(run)).toBe(false);
    expect(gnConditionMet(content, run, READY, 1)).toBe(false);
    mirrorRecord(run, { outcome: 'win', eventRule: undefined });
    expect(mirrorReady(run)).toBe(false);
    run.party[1]!.hp = 0;
    mirrorRecord(run, { outcome: 'win', eventRule: undefined });
    expect(mirrorTeam(run).map((r) => r.s)).toEqual([run.party[0]!.speciesId, 'pidgey']);
    expect(gnConditionMet(content, run, READY, 1)).toBe(true);
    const before = JSON.stringify(mirrorTeam(run));
    run.party = [createPokemon(content, 'rattata', 5, 'x')];
    mirrorRecord(run, { outcome: 'lose', eventRule: { gn: 'mirror' } });
    expect(JSON.stringify(mirrorTeam(run))).toBe(before);
    mirrorRecord(run, { outcome: 'win', eventRule: undefined });
    expect(JSON.stringify(mirrorTeam(run))).toBe(before);
  });

  it('the step 13 fallback is the same lake: same choices, once a run', () => {
    const run = lake('mirror-b', (r) => { r.stage!.map.nodes.find((n) => n.id === r.stage!.current)!.sides.length = 0; });
    open(run, 'gn-new-10-lake-b');
    expect(scene(run, 'gn-new-10-lake-b').labels).toEqual(['Fight them.', 'Skip stones instead.', 'Leave.']);
    expect(flagOf(choose(run, 'gn-new-10-lake-b', 'Leave.').run, 'mirror-seen')).toBe(1);
    expect(content.events.get('gn-new-10-lake-b')!.requires?.length).toBe(content.events.get('gn-new-10-lake')!.requires?.length);
  });

  it('the doc\'s three choices', () => {
    expect(scene(lake('mirror-labels'), 'gn-new-10-lake').labels).toEqual(['Fight them.', 'Skip stones instead.', 'Leave.']);
  });

  it('Fight them: the foe is the remembered team, with those moves; a win bows and gives a Reflection Glass', () => {
    const run = lake('mirror-fight');
    const fought = choose(run, 'gn-new-10-lake', 'Fight them.').run;
    expect(fought.battle!.eventRule).toMatchObject({ gn: 'mirror' });
    expect(fought.battle!.enemyTeam.map((m) => m.speciesId)).toEqual([run.party[0]!.speciesId, 'pidgey']);
    expect(fought.battle!.enemyTeam[1]!.moves.map((m) => m.id)).toEqual(['gust']);
    expect(fought.battle!.enemyTeam[1]!.level).toBe(12);
    expect(flagOf(fought, 'mirror-seen')).toBe(1);
    expect(flagOf(fought, 'mirror-fought')).toBe(1);
    const won = win(fought);
    expect(won.passives?.['reflection-glass'] ?? 0).toBe(0);
    const done = choose(won, 'gn-new-10-bow', 'Watch them go.');
    expect(done.run.passives?.['reflection-glass']).toBe(1);
    expect(scene(done.run, 'gn-new-10-lake').labels.length).toBeGreaterThan(0);
  });

  it('Fight them, and lose: they go back in anyway; nothing is taken, the run goes on', () => {
    const lost = lose(choose(lake('mirror-lose'), 'gn-new-10-lake', 'Fight them.').run);
    expect(lost.phase).toBe('map');
    const done = choose(lost, 'gn-new-10-under', 'Watch them go.');
    expect(done.run.passives?.['reflection-glass'] ?? 0).toBe(0);
    expect(done.run.party.length).toBe(2);
  });

  it('Skip stones: one reflection watches; Leave: nothing follows', () => {
    const skip = choose(lake('mirror-skip'), 'gn-new-10-lake', 'Skip stones instead.').run;
    expect(flagOf(skip, 'mirror-watcher')).toBe(1);
    expect(flagOf(skip, 'mirror-fought')).toBe(0);
    expect(skip.battle).toBeFalsy();
    const leave = choose(lake('mirror-leave'), 'gn-new-10-lake', 'Leave.').run;
    expect(flagOf(leave, 'mirror-watcher')).toBe(0);
    expect(flagOf(leave, 'mirror-seen')).toBe(1);
  });

  it('afterstory: a late reflection twice more this run, then it stops', () => {
    let run = lake('mirror-late', (r) => setFlag(r, 'mirror-watcher'));
    run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.sides.length = 0;
    open(run, 'gn-new-10-late');
    run = choose(run, 'gn-new-10-late', 'Wave.').run;
    expect(flagOf(run, 'mirror-late')).toBe(1);
    open(run, 'gn-new-10-late');
    run = choose(run, 'gn-new-10-late', 'Walk on.').run;
    expect(flagOf(run, 'mirror-late')).toBe(2);
  });
});
