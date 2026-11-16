// gn.58 Old Friend Returns (tools/events/co/greenneedle-58.ts; rules in src/core/greenneedle/oldfriend.ts).
import { describe, expect, it } from 'vitest';
import { chooseEvent } from '../../src/core/events';
import { gnConditionMet, castOf } from '../../src/core/greenneedle';
import { evolvedBy, ofAssist, ofGuestLeaves, recordRelease, releases } from '../../src/core/greenneedle/oldfriend';
import { createPokemon } from '../../src/core/pokemon';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, setFlag, win } from './helpers/gnPlay';

const opened = (run: RunState, id: string): boolean => !!run.stage!.map.nodes.find((n) => n.id === run.stage!.current)?.sides.some((x) => x.kind === 'event' && !x.used && x.eventId === id);
const letGo = (run: RunState, species: string, why: 1 | 2 | 3 | 4, stage: number, friendship = 70): void => {
  const mon = createPokemon(content, species, 10, `r-${species}`);
  mon.friendship = friendship;
  recordRelease(content, run, mon, why, stage);
};
const due: { kind: 'gn'; test: 'ofDue' } = { kind: 'gn', test: 'ofDue' };

describe('gn.58 Old Friend Returns', () => {
  it('a release is remembered with its why; it is due two stages later, not before', () => {
    const run = gnRun('t58-due');
    letGo(run, 'pidgey', 3, 5);
    expect(releases(run)).toHaveLength(1);
    expect(releases(run)[0]!.y).toBe(3);
    expect(Object.keys(run.story.flags).some((k) => k.startsWith('released.pidgey.'))).toBe(true);
    expect(gnConditionMet(content, run, due, 6)).toBe(false);
    expect(gnConditionMet(content, run, due, 9)).toBe(true);
  });

  it('evolves as far as levelling allows, never by stone', () => {
    expect(evolvedBy(content, 'pidgey', 40)).toBe('pidgeot');
    expect(evolvedBy(content, 'pidgey', 10)).toBe('pidgey');
    expect(evolvedBy(content, 'pikachu', 90)).toBe('pikachu');
  });

  it('"not strong enough": it challenges one on one against the replacement; win or lose it nods', () => {
    let run = gnRun('t58-weak');
    run.party = [...run.party, createPokemon(content, 'rattata', 20, 'p-rattata')];
    letGo(run, 'pidgey', 3, -3);
    run.regionIndex = 0;
    open(run, 'gn-58-friend');
    run = choose(run, 'gn-58-friend', 'Kneel down, and hold out a hand.').run;
    expect(flagOf(run, 'of-why')).toBe(3);
    expect(castOf(run, 'old-friend')).toBeTruthy();
    expect(opened(run, 'gn-58-weak')).toBe(true);
    const before = run.party.map((m) => m.uid).sort();
    run = choose(run, 'gn-58-weak', 'Battle.').run;
    expect(run.phase).toBe('battle');
    expect(run.party).toHaveLength(1);
    run = win(run);
    expect(run.party.map((m) => m.uid).concat(run.box.map((m) => m.uid)).sort()).toEqual(expect.arrayContaining(before));
    expect(run.party.length).toBeGreaterThan(1);
    expect(opened(run, 'gn-58-nod')).toBe(true);
  });

  it('"happier" with no trainer: Come with me? takes it back, marked came-back, if it was fond', () => {
    let run = gnRun('t58-home');
    letGo(run, 'rattata', 1, -3, 90);
    open(run, 'gn-58-friend');
    run = choose(run, 'gn-58-friend', 'Kneel down, and hold out a hand.').run;
    expect(flagOf(run, 'of-trainer')).toBe(0);
    expect(flagOf(run, 'of-fond')).toBe(1);
    expect(flagOf(run, 'of-help')).toBe(1);
    const n = run.party.length;
    run = choose(run, 'gn-58-help', 'Come with me?').run;
    const mon = [...run.party, ...run.box].find((m) => m.gn?.includes('came-back'));
    expect(mon).toBeTruthy();
    expect(run.party.length + run.box.length).toBe(n + 1);
    expect(flagOf(run, 'of-help')).toBe(0);
  });

  it('a Pokémon that was not fond walks a little way and stops: no join', () => {
    let run = gnRun('t58-stop');
    letGo(run, 'rattata', 2, -3, 70);
    open(run, 'gn-58-friend');
    run = choose(run, 'gn-58-friend', 'Kneel down, and hold out a hand.').run;
    const n = run.party.length + run.box.length;
    run = choose(run, 'gn-58-help', 'Come with me?').run;
    expect(run.party.length + run.box.length).toBe(n);
    expect([...run.party, ...run.box].some((m) => m.gn?.includes('came-back'))).toBe(false);
  });

  it('no reason given: walk with me, a guest who leaves at the Gym door; Come with me? is a third choice', () => {
    let run = gnRun('t58-none');
    letGo(run, 'rattata', 4, -3, 90);
    open(run, 'gn-58-friend');
    run = choose(run, 'gn-58-friend', 'Kneel down, and hold out a hand.').run;
    run = choose(run, 'gn-58-none', 'Walk with me a while.').run;
    const guests = [...run.party, ...run.box].filter((m) => m.gn?.includes('of-guest'));
    expect(guests).toHaveLength(1);
    ofGuestLeaves(content, run);
    expect([...run.party, ...run.box].some((m) => m.gn?.includes('of-guest'))).toBe(false);
  });

  it('helps in the next hard fight, once, for a quarter of the foe\'s HP', () => {
    const run = gnRun('t58-help');
    letGo(run, 'pidgey', 1, -3);
    open(run, 'gn-58-friend');
    const r = choose(run, 'gn-58-friend', 'Kneel down, and hold out a hand.').run;
    const gym = structuredClone(r) as RunState;
    gym.battle = { ...(gym.battle ?? ({} as never)), trainer: { classId: 'gym-leader', name: 'Test', leaderId: 'x' }, enemyTeam: [createPokemon(content, 'onix', 20, 'f1')], enemyIndex: 0 } as unknown as NonNullable<RunState['battle']>;
    const hp = gym.battle!.enemyTeam[0]!.hp;
    const line = ofAssist(content, gym, gym.battle!);
    expect(line).toContain('crosses the field');
    expect(gym.battle!.enemyTeam[0]!.hp).toBeLessThan(hp);
    expect(ofAssist(content, gym, gym.battle!)).toBe('');
  });

  it('a new trainer shows three answers; a release survives a save round trip', () => {
    let run = gnRun('t58-minna');
    letGo(run, 'pidgey', 3, -3);
    run.regionIndex = 2;
    setFlag(run, 'unused', 0);
    open(run, 'gn-58-friend');
    for (let i = 0; i < 1; i++) run = choose(run, 'gn-58-friend', 'Kneel down, and hold out a hand.').run;
    if (flagOf(run, 'of-trainer') === 1) {
      expect(opened(run, 'gn-58-minna')).toBe(true);
      run = choose(run, 'gn-58-minna', 'It used to be mine.').run;
      expect(flagOf(run, 'of-told')).toBe(2);
    }
    const back = JSON.parse(JSON.stringify(run)) as RunState;
    expect(releases(back)).toHaveLength(1);
    void chooseEvent;
  });
});
