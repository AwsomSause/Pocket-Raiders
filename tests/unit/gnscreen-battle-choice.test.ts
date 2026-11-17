// A choice in the middle of a battle (src/core/greenneedle/ask.ts): the general rules, on a made-up fight rule.
// The events that use it have their own tests: gn.32 (greenneedle7), gn.17 (greenneedle4), gn.new.22, gn.new.23.
import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { RunStateSchema, type RunState } from '../../src/core/state';
import { GnAskSchema, GnPhaseSchema, type GnAsk } from '../../src/core/greenneedle/schema';
import { askButtons, askDue, askOf, phaseFloor, phaseOf } from '../../src/core/greenneedle/ask';
import { maxHp } from '../../src/core/pokemon';
import { takeTurn } from '../../src/core/run';
import { choose, flagOf, gnRun, open, setFlag } from './helpers/gnPlay';

const ASKS: GnAsk[] = [
  { id: 'low', at: { myHp: 0.5 }, text: 'Your Pokémon is hurt.', options: [{ label: 'Rest.', effects: [{ kind: 'heal', side: 'you', share: 1 }] }, { label: 'Push on.', effects: [{ kind: 'stages', side: 'you', stages: { atk: 6 } }, { kind: 'stages', side: 'you', stages: { atk: 6 } }] }] },
  { id: 'half', at: { foeHp: 0.5 }, text: 'It is tiring.', options: [{ label: 'Give up.', effects: [{ kind: 'end', outcome: 'lose' }] }, { label: 'Go on.', text: 'You go on.', effects: [{ kind: 'flag', key: 'ask-test', n: 7 }] }, { label: 'Secret.', if: [{ key: 'ask-secret' }] }] },
  { id: 'btn', at: { button: 'Shout.' }, if: [{ key: 'ask-shout' }], text: 'Shout what?', options: [{ label: 'Hey!', effects: [{ kind: 'stages', side: 'foe', stages: { atk: -1 } }] }, { label: 'Never mind.' }] },
];

/** A run inside a wild event fight, with the made-up questions put on its rule. */
const inFight = (seed: string): RunState => {
  const run = gnRun(seed);
  open(run, 'gn-32-phase-1');
  const r = choose(run, 'gn-32-phase-1', 'Fight.').run;
  r.battle!.eventRule = { noCatch: true, asks: ASKS };
  r.battle!.enemyTeam[0]!.moves = [{ id: 'splash', pp: 40 }];
  return r;
};

describe('a choice in the middle of a battle', () => {
  it('the data shape: a question has 2 to 4 answers; a button may have one; a phase line is a share of HP', () => {
    const one = { id: 'x', at: { turn: 1 }, text: 'Q', options: [{ label: 'A' }] };
    expect(GnAskSchema.safeParse(one).success).toBe(false);
    expect(GnAskSchema.safeParse({ ...one, at: { button: 'Do it.' } }).success).toBe(true);
    expect(GnAskSchema.safeParse({ ...one, options: Array.from({ length: 5 }, (_, i) => ({ label: `A${i}` })) }).success).toBe(false);
    expect(GnAskSchema.safeParse({ ...one, options: [{ label: 'A' }, { label: 'B', effects: [{ kind: 'explode' }] }] }).success).toBe(false);
    expect(GnPhaseSchema.safeParse({ at: 1 }).success).toBe(false);
    expect(GnPhaseSchema.safeParse({ at: 0.5 }).success).toBe(true);
  });

  it('an HP moment: asked exactly when the line is reached, once; hidden answers stay hidden', () => {
    const run = inFight('ask-hp');
    const foe = run.battle!.enemyTeam[0]!;
    const half = Math.floor(maxHp(content, foe) * 0.5);
    expect(askDue(content, run)).toBeNull();
    foe.hp = half + 1;
    expect(askDue(content, run)).toBeNull();
    foe.hp = half;
    expect(askDue(content, run)).toEqual({ id: 'half', text: 'It is tiring.', prompt: 'It is tiring.', options: [{ index: 0, label: 'Give up.' }, { index: 1, label: 'Go on.' }] });
    // an answer that is hidden, or out of range, or to another question, is refused and nothing changes
    for (const bad of [{ ask: 'half', option: 2 }, { ask: 'half', option: 9 }, { ask: 'low', option: 0 }, { ask: 'nope', option: 0 }]) expect(() => takeTurn(content, run, { kind: 'answer', ...bad })).toThrow();
    setFlag(run, 'ask-secret');
    expect(askDue(content, run)!.options).toHaveLength(3);
    const went = takeTurn(content, run, { kind: 'answer', ask: 'half', option: 1 });
    expect(flagOf(went.run, 'ask-test')).toBe(7);
    expect(JSON.stringify(went.events)).toMatch(/You go on\./);
    expect(askDue(content, went.run)).toBeNull();
    expect(() => takeTurn(content, went.run, { kind: 'answer', ask: 'half', option: 1 })).toThrow();
    // an answer can end the fight as a loss
    const lost = takeTurn(content, run, { kind: 'answer', ask: 'half', option: 0 }).run;
    expect(lost.battle?.outcome ?? 'over').not.toBe('win');
    expect(lost.phase === 'battle' && !lost.battle!.outcome).toBe(false);
  });

  it('your own HP: under the line, not at it; a heal never passes full and stages stop at +6', () => {
    const run = inFight('ask-mine');
    const mon = run.party[run.battle!.activeIndex]!;
    const max = maxHp(content, mon);
    mon.hp = Math.ceil(max * 0.5);
    expect(askDue(content, run)).toBeNull();
    mon.hp = Math.ceil(max * 0.5) - 1;
    expect(askDue(content, run)!.id).toBe('low');
    const rested = takeTurn(content, run, { kind: 'answer', ask: 'low', option: 0 }).run;
    expect(rested.party[rested.battle!.activeIndex]!.hp).toBe(max);
    expect(takeTurn(content, run, { kind: 'answer', ask: 'low', option: 1 }).run.battle!.playerStages.atk).toBe(6);
    // no question while a replacement must be chosen, or once the fight is over
    const down = structuredClone(run);
    down.battle!.needsSwitch = true;
    expect(askDue(content, down)).toBeNull();
    const over = structuredClone(run);
    over.battle!.outcome = 'win';
    expect(askDue(content, over)).toBeNull();
    expect(askButtons(content, over)).toEqual([]);
  });

  it('a button with a question: on the menu only while its condition holds; it stays until answered; a reload keeps all of it', () => {
    let run = inFight('ask-btn');
    expect(askButtons(content, run)).toEqual([]);
    expect(askOf(content, run, 'btn')).toBeNull();
    setFlag(run, 'ask-shout');
    expect(askButtons(content, run)).toEqual([{ id: 'btn', label: 'Shout.', direct: false }]);
    expect(askOf(content, run, 'btn')!.options.map((o) => o.label)).toEqual(['Hey!', 'Never mind.']);
    // a button is never asked by itself
    expect(askDue(content, run)).toBeNull();
    run = RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(run.battle!.eventRule!.asks).toHaveLength(3);
    const turn = run.battle!.turn;
    const atk = run.battle!.enemyStages.atk;
    run = takeTurn(content, run, { kind: 'answer', ask: 'btn', option: 0 }).run;
    expect(run.battle!.enemyStages.atk).toBe(atk - 1);
    expect(run.battle!.turn).toBe(turn);
    expect(askButtons(content, run)).toEqual([]);
  });

  it('a fight without phases has no line to stop at, and stays in phase 1', () => {
    const run = inFight('ask-nophase');
    const foe = run.battle!.enemyTeam[0]!;
    expect(phaseFloor(run.battle!, foe, maxHp(content, foe))).toBe(0);
    expect(phaseOf(run.battle!)).toBe(1);
  });
});
