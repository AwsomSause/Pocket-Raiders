// Greenneedle gn.new.13 The Ones You Left (tools/events/co/greenneedle-new-13.ts; rules in src/core/greenneedle/left.ts).
import { describe, expect, it } from 'vitest';
import { conditionMet } from '../../src/core/events';
import type { RunState } from '../../src/core/state';
import { fatesOf, leftHas } from '../../src/core/greenneedle/left';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, scene } from './helpers/gnPlay';

const TEAM = 'charizard:42,blastoise:41,venusaur:40,pidgeot:39,raichu:38,snorlax:37';
const lostRun = (seed: string, team = TEAM): RunState => {
  const run = gnRun(seed);
  run.story.flags['retired:team'] = team;
  return run;
};
const opened = (run: RunState, id: string): boolean => !!run.stage!.map.nodes.find((n) => n.id === run.stage!.current)?.sides.some((x) => x.kind === 'event' && !x.used && x.eventId === id);

describe('gn.new.13 The Ones You Left', () => {
  it('needs a lost run on this save', () => {
    const e = content.events.get('gn-new-13-door')!;
    const needs = (run: RunState): boolean => e.requires.every((c) => conditionMet(content, run, c));
    expect(needs(gnRun('n13-none'))).toBe(false);
    expect(needs(lostRun('n13-lost'))).toBe(true);
  });

  it('take one: it joins marked Came Back, the five others decide (one into the woods), nothing is lost', () => {
    let run = lostRun('n13-take');
    open(run, 'gn-new-13-door');
    expect(scene(run, 'gn-new-13-door').labels).toEqual(['Take one.', 'Take none. Bury the notebook.']);
    run = choose(run, 'gn-new-13-door', 'Take one.').run;
    const a = scene(run, 'gn-new-13-pick-a');
    expect(a.intro).toContain('Charizard (Lv 42)');
    expect(a.labels).toHaveLength(4);
    run = choose(run, 'gn-new-13-pick-a', 'Look at the others.').run;
    const b = scene(run, 'gn-new-13-pick-b');
    expect(b.intro).toContain('Snorlax (Lv 37)');
    expect(b.labels).toHaveLength(4);
    run = choose(run, 'gn-new-13-pick-b', 'The sixth Ball: Snorlax (Lv 37).').run;
    expect(flagOf(run, 'left-took')).toBe(6);
    const back = [...run.party, ...run.box].find((m) => m.speciesId === 'snorlax');
    expect(back?.gn).toContain('came-back');
    expect(leftHas(run, 1)).toBe(false);
    const fates = fatesOf(run);
    expect(fates).toHaveLength(5);
    expect(fates.filter((x) => x.fate === 'woods')).toHaveLength(1);
    expect(fates.filter((x) => x.fate === 'trainer')).toHaveLength(2);
    expect(fates.filter((x) => x.fate === 'camp')).toHaveLength(2);
    expect(fates.map((x) => x.speciesId)).not.toContain('snorlax');
    expect(opened(run, 'gn-new-13-goodbye')).toBe(true);
    expect(scene(run, 'gn-new-13-goodbye').intro).toMatch(/walks into the woods, [A-Z]/);
  });

  it('bury the notebook: +1 Bond each, all six decide, no Pokémon joins', () => {
    let run = lostRun('n13-bury');
    const before = run.party.map((m) => m.friendship);
    const count = run.party.length + run.box.length;
    open(run, 'gn-new-13-door');
    run = choose(run, 'gn-new-13-door', 'Take none. Bury the notebook.').run;
    expect(flagOf(run, 'left-buried')).toBe(1);
    expect(flagOf(run, 'left-took')).toBe(0);
    expect(run.party.length + run.box.length).toBe(count);
    expect(run.party[0]!.friendship).toBeGreaterThan(before[0]!);
    const fates = fatesOf(run);
    expect(fates).toHaveLength(6);
    expect(fates.filter((x) => x.fate === 'woods')).toHaveLength(1);
  });

  it('the fates are the same for the same seed (no gameplay roll moves)', () => {
    const go = (): string => {
      let run = lostRun('n13-same');
      open(run, 'gn-new-13-door');
      run = choose(run, 'gn-new-13-door', 'Take none. Bury the notebook.').run;
      return String(run.story.flags['left:fates']);
    };
    expect(go()).toBe(go());
  });

  it('a shorter lost team (two) shows only its own Balls', () => {
    let run = lostRun('n13-two', 'pidgey:12,rattata:11');
    open(run, 'gn-new-13-door');
    run = choose(run, 'gn-new-13-door', 'Take one.').run;
    expect(scene(run, 'gn-new-13-pick-a').labels).toEqual(['The first Ball: Pidgey (Lv 12).', 'The second Ball: Rattata (Lv 11).', 'Look at the others.']);
  });
});
