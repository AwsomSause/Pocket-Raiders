// gn.new.27 The Little Cup (tools/events/co/greenneedle-new-27.ts; rules in src/core/greenneedle/littlecup.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { createPokemon } from '../../src/core/pokemon';
import { chooseEvent } from '../../src/core/events';
import { content } from './helpers';
import { choose, flagOf, gnRun, lose, open, scene, win } from './helpers/gnPlay';

const lv = (run: RunState, uid: string): number => [...run.party, ...run.box].find((m) => m.uid === uid)!.level;
const pickAt = (run: RunState, room: string, uid: string): RunState => {
  const side = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.sides.find((x) => !x.used && x.eventId === room)!;
  return chooseEvent(content, run, side.id, 0, uid).run;
};
/** Three first-stage entrants (and one evolved one that is turned away), to round 1. */
function entered(seed: string): RunState {
  let run = gnRun(seed);
  run.party = [run.party[0]!, createPokemon(content, 'pidgey', 20, 'p-pidgey'), createPokemon(content, 'rattata', 20, 'p-rattata'), createPokemon(content, 'raticate', 20, 'p-evolved')];
  open(run, 'gn-new-27-door');
  run = choose(run, 'gn-new-27-door', 'Enter.').run;
  run = pickAt(run, 'gn-new-27-pick', 'p-evolved'); // turned away
  expect(flagOf(run, 'lc-picked')).toBe(0);
  run = pickAt(run, 'gn-new-27-pick', 'p-pidgey');
  run = pickAt(run, 'gn-new-27-pick', 'p-rattata');
  return choose(run, 'gn-new-27-pick', "That's enough.").run;
}

describe('gn.new.27 The Little Cup', () => {
  it('first-stage only, set to level 5; the rest wait on the bench', () => {
    const run = entered('lc-start');
    expect(run.party.map((m) => m.uid).sort()).toEqual(['p-pidgey', 'p-rattata']);
    expect(run.party.every((m) => m.level === 5)).toBe(true);
    expect(run.box.map((m) => m.uid)).toContain('p-evolved');
  });

  it('four rounds at level 5, no experience; the win gives the Little Cup and the real levels come back', () => {
    let run = entered('lc-win');
    for (let i = 1; i <= 4; i++) {
      run = choose(run, `gn-new-27-r${i}`, 'Battle.').run;
      expect(run.battle!.enemyTeam.every((m) => m.level === 5)).toBe(true);
      if (i === 3) expect(run.battle!.enemyTeam).toHaveLength(3);
      if (i === 4) expect(run.battle!.enemyTeam[0]!.speciesId).toBe('sunkern');
      const xp = run.party.map((m) => m.xp);
      run = win(run);
      if (i < 4) expect(run.party.map((m) => m.xp)).toEqual(xp);
      if (i < 4) {
        while (scene(run, `gn-new-27-b${i}`).labels.includes('Cancel it. Stay in.')) run = choose(run, `gn-new-27-b${i}`, 'Cancel it. Stay in.').run;
        run = choose(run, `gn-new-27-b${i}`, 'On to the next round.').run;
      }
    }
    const cups = (r: RunState): number => (r.inventory['little-cup'] ?? 0) + [...r.party, ...r.box].reduce((n, m) => n + (m.held?.['little-cup'] ?? 0), 0);
    expect(cups(run)).toBe(1);
    expect(lv(run, 'p-pidgey')).toBe(20);
    expect(run.party.map((m) => m.uid)).toContain('p-evolved');
    run = choose(run, 'gn-new-27-champion', 'Take it.').run;
    expect(flagOf(run, 'lc-won')).toBe(1);
  });

  it('a loss puts you out, but everyone is their real level again and no Cup is won', () => {
    let run = entered('lc-lose');
    run = lose(choose(run, 'gn-new-27-r1', 'Battle.').run);
    expect(scene(run, 'gn-new-27-out').labels).toContain('Leave.');
    expect(lv(run, 'p-rattata')).toBe(20);
    expect(run.party).toHaveLength(4);
    expect((run.inventory['little-cup'] ?? 0) + [...run.party, ...run.box].reduce((n, m) => n + (m.held?.['little-cup'] ?? 0), 0)).toBe(0);
  });

  it('an entrant ready to evolve may cancel (Bond +2, flag set) or evolve and withdraw', () => {
    let run = entered('lc-evolve');
    // Pidgey (real level 20) is ready to evolve at its real level.
    run = win(choose(run, 'gn-new-27-r1', 'Battle.').run);
    expect(scene(run, 'gn-new-27-b1').labels).toEqual(expect.arrayContaining(['Cancel it. Stay in.', 'Evolve. Withdraw.']));
    const before = run.party.find((m) => m.uid === 'p-pidgey')!.friendship ?? 0;
    const stay = choose(run, 'gn-new-27-b1', 'Cancel it. Stay in.');
    run = stay.run;
    expect(flagOf(run, 'littlecup-cancelled')).toBe(1);
    expect(run.party.find((m) => m.uid === 'p-pidgey')!.friendship ?? 0).toBeGreaterThan(before);
    // Asked once only; the other (Rattata, level 20) is next.
    run = choose(run, 'gn-new-27-b1', 'Cancel it. Stay in.').run;
    expect(scene(run, 'gn-new-27-b1').labels).toEqual(['On to the next round.']);
  });
});
