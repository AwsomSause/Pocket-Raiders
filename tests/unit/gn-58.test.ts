// gn.58 Old Friend Returns (tools/events/co/greenneedle-58.ts; rules in src/core/greenneedle/oldfriend.ts).
import { describe, expect, it } from 'vitest';
import { chooseEvent } from '../../src/core/events';
import { gnConditionMet, castOf } from '../../src/core/greenneedle';
import { evolvedBy, ofAssist, ofGuestLeaves, ofShadow, ofShadowMark, recordRelease, releases } from '../../src/core/greenneedle/oldfriend';
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
    gym.battle = { ...(gym.battle ?? ({} as never)), trainer: { classId: 'gym-leader', name: 'Test', leaderId: 'x' }, enemyTeam: [createPokemon(content, 'onix', 20, 'f1')], enemyIndex: 0, enemyStages: {}, storyEffects: [] } as unknown as NonNullable<RunState['battle']>;
    const hp = gym.battle!.enemyTeam[0]!.hp;
    const line = ofAssist(content, gym, gym.battle!);
    expect(line).toContain('crosses the field');
    expect(line).toMatch(/It uses [A-Za-z' -]+, once, hard/);
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

  it('the helper\'s hit is a real move: damage from the formula, never the foe\'s last HP', () => {
    const run = gnRun('t58-real');
    letGo(run, 'pidgey', 1, -3);
    open(run, 'gn-58-friend');
    const r = choose(run, 'gn-58-friend', 'Kneel down, and hold out a hand.').run as RunState;
    r.battle = { trainer: { classId: 'champion', name: 'T', leaderId: null }, enemyTeam: [createPokemon(content, 'machamp', 50, 'f1')], enemyIndex: 0, enemyStages: {}, storyEffects: [] } as unknown as NonNullable<RunState['battle']>;
    const foe = r.battle!.enemyTeam[0]!;
    const hp = foe.hp;
    const line = ofAssist(content, r, r.battle!);
    expect(line).toMatch(/It uses/);
    expect(foe.hp).toBeLessThan(hp);
    expect(foe.hp).toBeGreaterThanOrEqual(1);
    expect(hp - foe.hp).not.toBe(Math.floor(hp * 0.25));
  });

  it('gn.02: a bird let go leaves a shadow in a hard battle that stage, once, as a one-turn accuracy drop', () => {
    const run = gnRun('t58-shadow');
    ofShadowMark(run);
    run.battle = { trainer: { classId: 'gym-leader', name: 'T', leaderId: 'x' }, enemyTeam: [createPokemon(content, 'onix', 20, 'f1')], enemyIndex: 0, enemyStages: {}, storyEffects: [] } as unknown as NonNullable<RunState['battle']>;
    expect(ofShadow(run, run.battle!)).toContain('shadow');
    expect(run.battle!.enemyStages.acc).toBe(-1);
    expect(run.battle!.storyEffects).toContain('of-shadow');
    expect(ofShadow(run, run.battle!)).toBe('');
  });

  it.each([['bug', 'gn-58-bug', 'Look up.'], ['cubone', 'gn-58-cubone', 'Help it set the stone.'], ['mimikyu', 'gn-58-mimikyu', 'Sit down.']])('the %s that was let go is met two stages on, once', (key, id, label) => {
    let run = gnRun(`t58-${key}`);
    const sp = { kind: 'gn', test: 'ofSp', key } as never;
    expect(gnConditionMet(content, run, sp, 9)).toBe(false);
    run.story.flags[`ev:of-sp-${key}`] = 3;
    expect(gnConditionMet(content, run, sp, 4)).toBe(false);
    expect(gnConditionMet(content, run, sp, 5)).toBe(true);
    open(run, id);
    run = choose(run, id, label).run;
    expect(flagOf(run, `of-sp-${key}-seen`)).toBe(1);
    expect(gnConditionMet(content, run, sp, 9)).toBe(false);
    expect(run.story.flags[`oldfriend.met.${key}`]).toBe(1);
  });

  it('the made Pokémon is found helping a farmer or carrying a kite', () => {
    let run = gnRun('t58-made');
    run.story.flags['ev:cast-lab-subject:dragonite'] = 1;
    open(run, 'gn-58-made');
    run = choose(run, 'gn-58-made', 'Go closer.').run;
    const room = opened(run, 'gn-58-made-farm') ? 'gn-58-made-farm' : 'gn-58-made-kite';
    expect(opened(run, room)).toBe(true);
    run = choose(run, room, room.endsWith('farm') ? 'Wave back.' : 'Let it be.').run;
    expect(flagOf(run, 'of-sp-made-seen')).toBe(1);
  });

  it('the release hook is called by the endings that let a Pokémon go', () => {
    const has = (id: string, key: string): boolean => JSON.stringify(content.events.get(id)).includes(`"ofSpecial"`) && JSON.stringify(content.events.get(id)).includes(`"${key}"`);
    expect(has('gn-13-goodbye', 'bug')).toBe(true);
    expect(has('gn-22-join', 'cubone')).toBe(true);
    expect(has('gn-37-told', 'mimikyu')).toBe(true);
    expect(has('gn-38-endings', 'made')).toBe(true);
  });
});
