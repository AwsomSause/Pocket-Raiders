// Catalog Overhaul, families-c: the small event pieces in src/core/events/coToolkit.ts.
import { describe, expect, it } from 'vitest';
import { EventDefSchema } from '../../src/core/contentSchema';
import { chooseEvent, conditionMet, eventView } from '../../src/core/events';
import { coBattleBegin, coFled, coHealStop, coNodeEnter, coStageStart, coWildKo, fillCoText, idolCurse, impostorTarget, leastUsed, paradoxOf, recordOf, restoreMachine, ruleMultiplier, teamFact } from '../../src/core/events/coToolkit';
import { maxHp } from '../../src/core/pokemon';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const EVENT = {
  id: 'test-co-toolkit', name: 'Toolkit', group: 'Test', intro: '{lead} looks at {starter}. Luck: {flag:test-luck}. {unknown} stays.',
  choices: [
    { label: 'How bad is it for me?', success: { text: 'The game reads your team.', effects: [{ kind: 'ruleRead', key: 'rule-test', bad: ['small'], good: [], prize: 400 }] } },
    { label: 'Point at {least}.', pick: {}, success: { text: 'You point at one of them. {most} watches.', effects: [{ kind: 'pickTest', test: 'leastUsed', pass: 'test-pass', fail: 'test-fail', sulk: 5 }] } },
    { label: 'Take the prize.', success: { text: 'Paid.', effects: [{ kind: 'ruleRead', key: 'rule-test', bad: ['small'], good: [], prize: 400, store: true }, { kind: 'rulePrize', key: 'rule-test', amount: 400 }] } },
    { label: 'Only if the road thinks badly of you.', requires: [{ kind: 'record', is: 'low' }], success: { text: 'Sorry.', effects: [] } },
  ],
};

function setup(): RunState {
  const event = EventDefSchema.parse(EVENT);
  content.events.set(event.id, event);
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'co-toolkit', archetypeId: 'red' }), 0);
  const second = structuredClone(run.party[0]!);
  second.uid = 'second';
  second.moveCounts = { tackle: 9 };
  run.party.push(second);
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'p', kind: 'event', used: false, eventId: event.id });
  return run;
}
const flag = (run: RunState, key: string): number => Number(run.story.flags[`ev:${key}`] ?? 0);

describe('families-c toolkit: text tokens', () => {
  it('fills names and flag numbers and leaves unknown tokens alone', () => {
    const run = setup();
    run.story.flags['ev:test-luck'] = 3;
    const view = eventView(content, run, 'p');
    expect(view.event.intro).not.toMatch(/\{lead\}|\{starter\}|\{flag:/);
    expect(view.event.intro).toContain('Luck: 3.');
    expect(view.event.intro).toContain('{unknown} stays.');
    expect(view.choices[1]!.label).not.toContain('{least}');
    expect(fillCoText(content, run, 'No tokens.')).toBe('No tokens.');
    expect(fillCoText(content, run, '{flag:never-set}')).toBe('0');
  });
  it('fills the outcome text too', () => {
    const run = setup();
    expect(chooseEvent(content, run, 'p', 1, run.party[0]!.uid).text).not.toContain('{most}');
  });
});

describe('families-c toolkit: the record (SF83)', () => {
  it('is middle by default, high on reputation or kindness, low on lost reputation or a kept find', () => {
    const run = setup();
    expect(recordOf(run)).toBe('middle');
    run.story.flags['ev:rep'] = 3;
    expect(recordOf(run)).toBe('high');
    run.story.flags['ev:rep-lost'] = 5;
    expect(recordOf(run)).toBe('low');
    run.story.flags['ev:rep-lost'] = 0;
    run.story.flags['ev:rep'] = 0;
    run.story.flags['ev:kind-total'] = 5;
    expect(recordOf(run)).toBe('high');
    run.story.flags['ev:honest-kept-wallet'] = 1;
    expect(recordOf(run)).toBe('low');
    expect(conditionMet(content, run, { kind: 'record', is: 'low' })).toBe(true);
    expect(eventView(content, run, 'p').choices[3]!.locked).toBeNull();
  });
  it('locks a low-record choice for an ordinary record', () => {
    expect(eventView(content, setup(), 'p').choices[3]!.locked).toBeTruthy();
  });
});

describe('families-c toolkit: rule battles (SF72)', () => {
  it('reads team facts from species, moves and order only', () => {
    const run = setup();
    expect(teamFact(content, run, 'small')).toBe(true);
    expect(teamFact(content, run, 'full')).toBe(false);
    expect(teamFact(content, run, 'nonsense')).toBe(false);
    const before = ruleMultiplier(content, run, ['small'], []);
    run.party[0]!.hp = 1;
    expect(ruleMultiplier(content, run, ['small'], [])).toBe(before);
  });
  it('gives x2, x1.5, x1 and x0.75', () => {
    const run = setup();
    expect(ruleMultiplier(content, run, ['small', 'small'], [])).toBe(2);
    expect(ruleMultiplier(content, run, ['small'], [])).toBe(1.5);
    expect(ruleMultiplier(content, run, [], [])).toBe(1);
    expect(ruleMultiplier(content, run, [], ['small'])).toBe(0.75);
  });
  it('shows the true multiplier and pays it once', () => {
    const run = setup();
    const shown = chooseEvent(content, run, 'p', 0);
    expect(shown.changes.join(' ')).toContain('prize ×1.5 (₽600)');
    expect(shown.run.money).toBe(run.money);
    const paid = chooseEvent(content, run, 'p', 2);
    expect(paid.run.money).toBe(run.money + 600);
    expect(flag(paid.run, 'rule-test')).toBe(0);
  });
});

describe('families-c toolkit: pointing at a Pokémon', () => {
  it('counts a true answer and a wrong one, and a wrong pick sulks', () => {
    const run = setup();
    expect(leastUsed(run)!.uid).toBe(run.party[0]!.uid);
    const right = chooseEvent(content, run, 'p', 1, run.party[0]!.uid).run;
    expect(flag(right, 'test-pass')).toBe(1);
    const wrong = chooseEvent(content, run, 'p', 1, 'second').run;
    expect(flag(wrong, 'test-fail')).toBe(1);
    expect(wrong.party[1]!.friendship).toBe(Math.max(0, run.party[1]!.friendship - 5));
  });
  it('the impostor target is the same on a reload', () => {
    const run = setup();
    expect(impostorTarget(run)!.uid).toBe(impostorTarget(structuredClone(run))!.uid);
  });
});

describe('families-c toolkit: the Cursed Idol and the oaths', () => {
  it('pays and curses once a stage only while carried', () => {
    const run = setup();
    const money = run.money;
    coStageStart(run);
    expect(run.money).toBe(money);
    run.story.flags['ev:idol-carried'] = 1;
    coStageStart(run);
    coStageStart(run);
    expect(run.money).toBe(money + 600);
    expect(idolCurse(run)).toBe(2);
    run.story.flags['ev:idol-carried'] = 0;
    expect(idolCurse(run)).toBe(0);
  });
  it('at Curse 5 a healing stop heals 25% less', () => {
    const run = setup();
    run.story.flags['ev:idol-carried'] = 1;
    run.story.flags['ev:idol-curse'] = 5;
    const mon = run.party[0]!;
    const max = maxHp(content, mon);
    mon.hp = max;
    run.party[1]!.hp = maxHp(content, run.party[1]!);
    coHealStop(content, run, [0, 0]);
    expect(mon.hp).toBe(Math.floor(max * 0.75));
  });
  it('at Curse 3 the Pokémon sent out starts 10% down, never fainted', () => {
    const run = setup();
    run.story.flags['ev:idol-carried'] = 1;
    run.story.flags['ev:idol-curse'] = 3;
    const mon = run.party[0]!;
    const max = maxHp(content, mon);
    mon.hp = max;
    run.battle = { activeIndex: 0 } as RunState['battle'];
    coBattleBegin(content, run);
    expect(mon.hp).toBe(max - Math.ceil(max * 0.1));
    mon.hp = 1;
    coBattleBegin(content, run);
    expect(mon.hp).toBe(1);
  });
  it('a flee breaks Steel, a second rest breaks Speed, a wild knock-out with a Ball in the bag breaks Mercy', () => {
    const steel = setup();
    coFled(steel);
    expect(flag(steel, 'oath-broken')).toBe(0);
    steel.story.flags['ev:oath-steel'] = 1;
    coFled(steel);
    expect(flag(steel, 'oath-broken')).toBe(1);
    const speed = setup();
    speed.story.flags['ev:oath-speed'] = 1;
    coHealStop(content, speed, speed.party.map((m) => m.hp));
    expect(flag(speed, 'oath-broken')).toBe(0);
    coHealStop(content, speed, speed.party.map((m) => m.hp));
    expect(flag(speed, 'oath-broken')).toBe(1);
    coStageStart(speed);
    expect(flag(speed, 'oath-rests')).toBe(0);
    const mercy = setup();
    mercy.story.flags['ev:oath-mercy'] = 1;
    mercy.inventory = {};
    coWildKo(mercy);
    expect(flag(mercy, 'oath-broken')).toBe(0);
    mercy.inventory = { 'poke-ball': 1 };
    coWildKo(mercy);
    expect(flag(mercy, 'oath-broken')).toBe(1);
  });
});

describe('families-c toolkit: the Sealed Letter and the Time Machine', () => {
  it('the kept letter glows once, the first time the party is under a quarter of its HP', () => {
    const run = setup();
    run.story.flags['ev:letter-kept'] = 1;
    expect(coNodeEnter(content, run)).toBeNull();
    for (const m of run.party) m.hp = 1;
    expect(coNodeEnter(content, run)).toBe('rk-sealed-letter-open');
    expect(coNodeEnter(content, run)).toBeNull();
  });
  it('knows the counterparts and always snaps back', () => {
    expect(paradoxOf(content, 'donphan', 'past')).toBe(content.species.has('great-tusk') ? 'great-tusk' : null);
    expect(paradoxOf(content, 'pidgey', 'past')).toBeNull();
    const run = setup();
    const mon = run.party[0]!;
    const was = mon.speciesId;
    run.story.flags['co:machine'] = `${mon.uid}|${was}`;
    mon.speciesId = 'donphan';
    expect(restoreMachine(content, run)).toBe(true);
    expect(mon.speciesId).toBe(was);
    expect(run.story.flags['co:machine']).toBeUndefined();
    expect(restoreMachine(content, run)).toBe(false);
  });
});
