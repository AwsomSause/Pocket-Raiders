// Greenneedle gn.new.30: The Cheer Squad (tools/events/co/greenneedle-new-30.ts; rules in src/core/greenneedle/cheer.ts).
import { describe, expect, it } from 'vitest';
import type { BattleState, RunState } from '../../src/core/state';
import { CALL_MARK, CHEER_TAG, callNote, callPriority, cheerBattleStart, cheerPercents, cheerTurn } from '../../src/core/greenneedle/cheer';
import { stageNumber } from '../../src/core/events';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, scene } from './helpers/gnPlay';

const fake = (): BattleState => ({ storyEffects: [], turn: 0, enemyTeam: [] }) as unknown as BattleState;
const joined = (run: RunState): string[] => [...run.party, ...run.box].map((m) => m.speciesId);
function squad(seed: string): RunState {
  const run = gnRun(seed);
  open(run, 'gn-new-30-street');
  return choose(run, 'gn-new-30-street', 'Let them come along.').run;
}
function ending(seed: string, label: string): RunState {
  const run = squad(seed);
  open(run, 'gn-new-30-end');
  return choose(run, 'gn-new-30-end', label).run;
}

describe('gn.new.30 The Cheer Squad', () => {
  it('the street scene: one button; they fall in and the stage is remembered', () => {
    const run = gnRun('t-cheer-1');
    open(run, 'gn-new-30-street');
    expect(scene(run, 'gn-new-30-street').labels).toEqual(['Let them come along.']);
    const after = choose(run, 'gn-new-30-street', 'Let them come along.').run;
    expect(flagOf(after, 'cheer-on')).toBe(stageNumber(content, after));
    expect(joined(after)).not.toContain('plusle');
  });

  it('in every battle until step 19: +5% Attack and Defence and a cheer line each turn; none after, none in another stage', () => {
    const run = squad('t-cheer-2');
    const b = fake();
    cheerBattleStart(run, b, stageNumber(content, run));
    expect(b.storyEffects).toContain(CHEER_TAG);
    expect(cheerPercents(b)).toEqual({ atk: 5, def: 5 });
    const lines: string[] = [];
    cheerTurn(b, (t) => lines.push(t));
    expect(lines.join(' ')).toMatch(/Plusle cheers.*Minun cheers/);
    const later = fake();
    cheerBattleStart(run, later, stageNumber(content, run) + 1);
    expect(cheerPercents(later)).toEqual({ atk: 0, def: 0 });
    run.story.flags['ev:cheer-over'] = 1;
    const over = fake();
    cheerBattleStart(run, over, stageNumber(content, run));
    expect(over.storyEffects).toEqual([]);
  });

  it('the ending has the four doc choices and needs the same stage', () => {
    const run = squad('t-cheer-3');
    open(run, 'gn-new-30-end');
    expect(scene(run, 'gn-new-30-end').labels).toEqual(['"It was you, Plusle."', '"It was you, Minun."', '"It was both of you."', '"It only worked because there were two."']);
  });

  it('one: that one joins, the other stays on the road (cheer-split)', () => {
    const a = ending('t-cheer-4', '"It was you, Plusle."');
    expect(joined(a)).toContain('plusle');
    expect(joined(a)).not.toContain('minun');
    expect(flagOf(a, 'cheer-split')).toBe(1);
    const b = ending('t-cheer-5', '"It was you, Minun."');
    expect(joined(b)).toContain('minun');
    expect(joined(b)).not.toContain('plusle');
  });

  it('the one left on the road cheers for the rival once: +5% Attack to the rival team', () => {
    const run = ending('t-cheer-6', '"It was you, Plusle."');
    const b = { storyEffects: [], turn: 0, rival: true, enemyTeam: [{ eventBoosts: {} }] } as unknown as BattleState;
    cheerBattleStart(run, b, stageNumber(content, run) + 1);
    expect(b.enemyTeam[0]!.eventBoosts).toEqual({ atk: 5 });
    const again = { storyEffects: [], turn: 0, rival: true, enemyTeam: [{ eventBoosts: {} }] } as unknown as BattleState;
    cheerBattleStart(run, again, stageNumber(content, run) + 1);
    expect(again.enemyTeam[0]!.eventBoosts).toEqual({});
  });

  it('both: both join with Call and Response; cheer-both / cheer-truth are remembered', () => {
    const a = ending('t-cheer-7', '"It was both of you."');
    expect(joined(a)).toEqual(expect.arrayContaining(['plusle', 'minun']));
    expect(flagOf(a, 'cheer-both')).toBe(1);
    expect([...a.party, ...a.box].filter((m) => m.speciesId === 'plusle' || m.speciesId === 'minun').every((m) => m.marks?.includes(CALL_MARK))).toBe(true);
    const t = ending('t-cheer-8', '"It only worked because there were two."');
    expect(flagOf(t, 'cheer-truth')).toBe(1);
    expect(joined(t)).toEqual(expect.arrayContaining(['plusle', 'minun']));
  });

  it('Call and Response: a status move from one gives the other +1 priority next turn, once; only for the pair', () => {
    const b = fake();
    const p = { uid: 'p', marks: [CALL_MARK] };
    const m = { uid: 'm', marks: [CALL_MARK] };
    callNote(b, p, m, false);
    expect(callPriority(b, 'm')).toBe(0);
    callNote(b, p, m, true);
    callNote(b, p, m, true);
    expect(b.storyEffects.filter((t) => t.startsWith('cr-next:'))).toHaveLength(1);
    expect(callPriority(b, 'm')).toBe(0);
    b.turn = 1;
    expect(callPriority(b, 'm')).toBe(1);
    expect(callPriority(b, 'p')).toBe(0);
    callNote(b, p, { uid: 'x', marks: [] }, true);
    expect(callPriority(b, 'x')).toBe(0);
  });
});
