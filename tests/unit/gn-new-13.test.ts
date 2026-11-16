// Greenneedle gn.new.13 The Ones You Left (tools/events/co/greenneedle-new-13.ts; rules in src/core/greenneedle/left.ts).
import { describe, expect, it } from 'vitest';
import { conditionMet } from '../../src/core/events';
import type { RunState } from '../../src/core/state';
import { createPokemon } from '../../src/core/pokemon';
import { fatesOf, leftHas, leftTeam, noteLeft } from '../../src/core/greenneedle/left';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, scene } from './helpers/gnPlay';

// Newest first: the ledger is oldest first, so the last entry (snorlax) is the first Ball.
const LEDGER = 'raichu:38|pidgeot:39|venusaur:40|blastoise:41|charizard:42|snorlax:37';
const lostRun = (seed: string, ledger = LEDGER): RunState => {
  const run = gnRun(seed);
  run.story.flags['left:ledger'] = ledger;
  return run;
};
const opened = (run: RunState, id: string): boolean => !!run.stage!.map.nodes.find((n) => n.id === run.stage!.current)?.sides.some((x) => x.kind === 'event' && !x.used && x.eventId === id);

describe('gn.new.13 The Ones You Left', () => {
  it('needs Pokémon left earlier in this run (an earlier run does not count)', () => {
    const e = content.events.get('gn-new-13-door')!;
    const needs = (run: RunState): boolean => e.requires.every((c) => conditionMet(content, run, c));
    expect(needs(gnRun('n13-none'))).toBe(false);
    const old = gnRun('n13-old');
    old.story.flags['retired:team'] = 'pidgey:12';
    expect(needs(old)).toBe(false);
    expect(needs(lostRun('n13-lost'))).toBe(true);
  });

  it('take one: it joins marked Came Back, the five others decide (one into the woods), nothing is lost', () => {
    let run = lostRun('n13-take');
    open(run, 'gn-new-13-door');
    expect(scene(run, 'gn-new-13-door').labels).toEqual(['Take one.', 'Take none. Bury the notebook.']);
    run = choose(run, 'gn-new-13-door', 'Take one.').run;
    const a = scene(run, 'gn-new-13-pick-a');
    expect(a.intro).toContain('Snorlax (Lv 37)');
    expect(a.labels).toHaveLength(4);
    run = choose(run, 'gn-new-13-pick-a', 'Look at the others.').run;
    const b = scene(run, 'gn-new-13-pick-b');
    expect(b.intro).toContain('Raichu (Lv 38)');
    expect(b.labels).toHaveLength(4);
    run = choose(run, 'gn-new-13-pick-b', 'The sixth Ball: Raichu (Lv 38).').run;
    expect(flagOf(run, 'left-took')).toBe(6);
    const back = [...run.party, ...run.box].find((m) => m.speciesId === 'raichu');
    expect(back?.gn).toContain('came-back');
    expect(leftHas(run, 1)).toBe(false);
    const fates = fatesOf(run);
    expect(fates).toHaveLength(5);
    expect(fates.filter((x) => x.fate === 'woods')).toHaveLength(1);
    expect(fates.filter((x) => x.fate === 'trainer')).toHaveLength(2);
    expect(fates.filter((x) => x.fate === 'camp')).toHaveLength(2);
    expect(fates.map((x) => x.speciesId)).not.toContain('raichu');
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
    let run = lostRun('n13-two', 'pidgey:12|rattata:11');
    open(run, 'gn-new-13-door');
    run = choose(run, 'gn-new-13-door', 'Take one.').run;
    expect(scene(run, 'gn-new-13-pick-a').labels).toEqual(['The first Ball: Rattata (Lv 11).', 'The second Ball: Pidgey (Lv 12).', 'Look at the others.']);
  });

  it('a boxed Pokémon is a Ball too: it keeps its nickname and walks out of the PC into the party', () => {
    let run = gnRun('n13-box');
    const boxed = createPokemon(content, 'pikachu', 14, 'p-boxed');
    boxed.care = { mood: 0, fatigue: 0, fights: 0, wins: 0, falls: 0, benchedWins: 0, stop: -1, done: {}, sulkUntil: -1, nickname: 'Biscuit' };
    run.box = [boxed];
    open(run, 'gn-new-13-door');
    run = choose(run, 'gn-new-13-door', 'Take one.').run;
    expect(scene(run, 'gn-new-13-pick-a').intro).toContain('Biscuit the Pikachu (Lv 14)');
    run = choose(run, 'gn-new-13-pick-a', 'The first Ball: Biscuit the Pikachu (Lv 14).').run;
    expect(run.box).toHaveLength(0);
    const back = run.party.find((m) => m.uid === 'p-boxed');
    expect(back?.gn).toContain('came-back');
  });

  it('a released catch is noted, and the Nuzlocke fallen are Balls', () => {
    const run = gnRun('n13-fallen');
    noteLeft(run, { speciesId: 'rattata', level: 9 });
    run.nuzlocke = { areas: [], memorial: [{ uid: 'x', speciesId: 'geodude', level: 20, shiny: false, ace: false, area: 'a', cause: 'Brock' }] };
    expect(leftTeam(run).map((m) => `${m.speciesId}:${m.from}`)).toEqual(['rattata:released', 'geodude:fallen']);
  });
});
