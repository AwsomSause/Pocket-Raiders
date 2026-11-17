// Greenneedle gn.new.07 The Shedinja Question (tools/events/co/greenneedle-new-07.ts; rules in src/core/greenneedle/shedinja.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { createPokemon } from '../../src/core/pokemon';
import { choose, flagOf, gnRun, open, openSide, scene } from './helpers/gnPlay';
import { content } from './helpers';

const started = (seed: string): RunState => {
  let run = gnRun(seed);
  run.party = [...run.party, createPokemon(content, 'pidgey', 20, 'p-pidgey'), createPokemon(content, 'rattata', 20, 'p-rattata')];
  open(run, 'gn-n07-open');
  run = choose(run, 'gn-n07-open', 'Let it follow.').run;
  return run;
};
const rest = (run: RunState, label: string): RunState => {
  open(run, 'gn-n07-rest');
  return choose(run, 'gn-n07-rest', label).run;
};
const shedinja = (run: RunState) => [...run.party, ...run.box].find((m) => m.speciesId === 'shedinja');

describe('gn.new.07 The Shedinja Question', () => {
  it('the cold open has no battle; the rest offers three answers, and the Ninjask only after the first rest', () => {
    const run = started('n07-open');
    expect(flagOf(run, 'shed-begun')).toBe(1);
    expect(scene(run, 'gn-n07-rest').labels).toEqual(['Let one of them answer.', 'Answer it myself.', 'Nobody answers.']);
    const after = rest(run, 'Let one of them answer.');
    expect(scene(after, 'gn-n07-rest').labels).toEqual(['Let one of them answer.', 'Answer it myself.', 'Nobody answers.', 'Find the Ninjask.']);
  });

  it('three acceptances, a different Pokémon each rest: it joins with Second Self', () => {
    let run = started('n07-join');
    const friends = run.party.map((m) => m.friendship ?? 0);
    run = rest(run, 'Let one of them answer.');
    run = rest(run, 'Let one of them answer.');
    expect(shedinja(run)).toBeUndefined();
    run = rest(run, 'Let one of them answer.');
    expect(flagOf(run, 'shed-accepted')).toBe(3);
    
    expect(run.party.slice(0, 3).filter((m, i) => (m.friendship ?? 0) > friends[i]!)).toHaveLength(3);
    const mon = shedinja(run)!;
    expect(mon.fixedAbility).toBe('second-self');
    expect(flagOf(run, 'shedinja-answered')).toBe(1);
    expect(flagOf(run, 'shed-end')).toBe(1);
  });

  it('the player answers: only "one of us" and "I don\'t know either" count', () => {
    let run = started('n07-me');
    run = rest(run, 'Answer it myself.');
    expect(openSide(run)?.eventId).toBe('gn-n07-answer');
    expect(scene(run, 'gn-n07-answer').labels).toEqual(['"You\'re one of us."', '"You\'re a shell."', '"I don\'t know either."']);
    run = choose(run, 'gn-n07-answer', '"You\'re a shell."').run;
    expect(flagOf(run, 'shed-accepted')).toBe(0);
    expect(flagOf(run, 'shed-silence')).toBe(0);
    run = rest(run, 'Answer it myself.');
    run = choose(run, 'gn-n07-answer', '"You\'re one of us."').run;
    run = rest(run, 'Answer it myself.');
    run = choose(run, 'gn-n07-answer', '"I don\'t know either."').run;
    expect(flagOf(run, 'shed-accepted')).toBe(2);
    expect(shedinja(run)).toBeDefined();
  });

  it('three silences: it is gone one morning', () => {
    let run = started('n07-gone');
    for (let i = 0; i < 3; i++) run = rest(run, 'Nobody answers.');
    expect(flagOf(run, 'shed-silence')).toBe(3);
    expect(flagOf(run, 'shed-end')).toBe(2);
    expect(shedinja(run)).toBeUndefined();
    expect(flagOf(run, 'shedinja-answered')).toBe(0);
  });

  it('Find the Ninjask holds the next rest until the Ninjask is seen, and it counts for the player', () => {
    let run = started('n07-ninjask');
    run = rest(run, 'Let one of them answer.');
    run = rest(run, 'Find the Ninjask.');
    expect(flagOf(run, 'shed-hold')).toBe(1);
    expect(content.events.get('gn-n07-rest')!.requires!.length).toBeGreaterThan(0);
    open(run, 'gn-n07-ninjask');
    run = choose(run, 'gn-n07-ninjask', 'Walk on, together.').run;
    expect(flagOf(run, 'shed-hold')).toBe(0);
    expect(flagOf(run, 'shed-accepted')).toBe(2);
    run = rest(run, 'Let one of them answer.');
    expect(flagOf(run, 'shed-end')).toBe(1);
    expect(shedinja(run)).toBeDefined();
  });

  it('Second Self is a known ability with the doc\'s words', () => {
    expect(content.abilities.get('second-self')?.name).toBe('Second Self');
  });
});
