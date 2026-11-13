// Beta 0.6 R1-R3 + R10: rival id lock, Lead, Marks, feelings, first-stage pity.
import { describe, expect, it } from 'vitest';
import { ExpansionRunSchema } from '../../src/core/expansion/schema';
import { addMark, assertRivalLock, changeFeelings, leadAfter, OVERHAUL, overhaulOf, pityFor, recordRivalBattle, registerRival } from '../../src/core/rivals/overhaul';
import { RIVAL_PROFILES } from '../../src/core/rivals/schema';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const run = () => chooseStarter(content, createRun(content, { runId: 'r44', seed: 'r44', archetypeId: 'red' }), 0);
const reg = (r: ReturnType<typeof run>, id = 'blue', role: 'main' | 'friend' = 'main') => registerRival(r, { id, role, personality: 'prodigy', style: 'blitz', arc: 'prodigy-learns-humility' });

describe('rival id lock', () => {
  it('keeps the record and refuses a role change', () => {
    const r = run();
    const a = reg(r);
    expect(reg(r)).toBe(a);
    expect(() => registerRival(r, { id: 'blue', role: 'friend', personality: 'prodigy', style: 'blitz', arc: 'prodigy-learns-humility' })).toThrow(/locked/);
    expect(() => assertRivalLock(r, 'blue', 'friend')).toThrow();
    expect(() => assertRivalLock(r, 'blue', 'main')).not.toThrow();
  });
  it('one main and one friend only; unknown data refused', () => {
    const r = run();
    reg(r);
    expect(() => reg(r, 'other', 'main')).toThrow(/taken/);
    expect(() => reg(r, 'pal', 'friend')).not.toThrow();
    expect(() => registerRival(run(), { id: 'x', role: 'main', personality: 'nope', style: 'blitz', arc: 'prodigy-learns-humility' })).toThrow();
  });
  it('the data maps 8 personalities onto real profiles', () => {
    expect(Object.values(OVERHAUL.personalities)).toHaveLength(8);
    for (const p of Object.values(OVERHAUL.personalities)) expect(RIVAL_PROFILES.personalities[p], p).toBeDefined();
    for (const s of OVERHAUL.styles) expect(RIVAL_PROFILES.styles[s], s).toBeDefined();
  });
});

describe('Lead', () => {
  it('moves by 1 and stays in -3..+3', () => {
    expect(leadAfter(0, true)).toBe(1);
    expect(leadAfter(0, false)).toBe(-1);
    expect(leadAfter(3, true)).toBe(3);
    expect(leadAfter(-3, false)).toBe(-3);
    let l = 0;
    for (let i = 0; i < 10; i++) l = leadAfter(l, true);
    expect(l).toBe(3);
  });
});

describe('marks and feelings', () => {
  it('keeps at most 5 marks, no duplicates, refuses unknown', () => {
    const r = run();
    const rec = reg(r);
    for (const m of OVERHAUL.marks.names) addMark(rec, m);
    addMark(rec, OVERHAUL.marks.names[7]!);
    expect(rec.marks).toHaveLength(5);
    expect(rec.marks.at(-1)).toBe(OVERHAUL.marks.names[7]);
    expect(() => addMark(rec, 'nope')).toThrow();
  });
  it('applies the change table and clamps to 0..10', () => {
    const rec = reg(run());
    changeFeelings(rec, 'rescued');
    expect(rec.feelings).toMatchObject({ friendship: 5, trust: 5, resentment: 0 });
    for (let i = 0; i < 9; i++) changeFeelings(rec, 'keptPromise');
    expect(rec.feelings.trust).toBe(10);
    for (let i = 0; i < 9; i++) changeFeelings(rec, 'brokePromise');
    expect(rec.feelings.trust).toBe(0);
    expect(rec.feelings.resentment).toBe(10);
  });
});

describe('battle record and first-stage pity', () => {
  it('rival win: Lead +1, loss: Lead -1; unregistered rival is untouched', () => {
    const r = run();
    reg(r);
    expect(recordRivalBattle(r, 'ghost', { rivalWon: true, stageIndex: 0 })).toBe(false);
    recordRivalBattle(r, 'blue', { rivalWon: true, stageIndex: 5 });
    expect(overhaulOf(r, 'blue')!.lead).toBe(1);
    recordRivalBattle(r, 'blue', { rivalWon: false, stageIndex: 5 });
    recordRivalBattle(r, 'blue', { rivalWon: false, stageIndex: 5 });
    expect(overhaulOf(r, 'blue')!.lead).toBe(-1);
  });
  it('pity after 5 straight first-stage losses, reset by a rival win', () => {
    const r = run();
    reg(r);
    for (let i = 0; i < 4; i++) recordRivalBattle(r, 'blue', { rivalWon: false, stageIndex: 1 });
    expect(pityFor(r, 'blue').active).toBe(false);
    recordRivalBattle(r, 'blue', { rivalWon: false, stageIndex: 2 });
    expect(pityFor(r, 'blue')).toEqual({ active: true, levelDelta: -2, aiTier: 3, advice: true });
    recordRivalBattle(r, 'blue', { rivalWon: true, stageIndex: 1 });
    expect(pityFor(r, 'blue').active).toBe(false);
  });
  it('later-stage losses do not count', () => {
    const r = run();
    reg(r);
    for (let i = 0; i < 8; i++) recordRivalBattle(r, 'blue', { rivalWon: false, stageIndex: 6 });
    expect(pityFor(r, 'blue').active).toBe(false);
  });
});

describe('save shape', () => {
  it('round-trips in the v43 expansion block, and an old block without it is valid (no version bump needed)', () => {
    const r = run();
    reg(r);
    const parsed = ExpansionRunSchema.parse(JSON.parse(JSON.stringify(r.expansion)));
    expect(parsed.rival!.blue!.role).toBe('main');
    expect(ExpansionRunSchema.safeParse({}).success).toBe(true);
    expect(ExpansionRunSchema.safeParse({ rival: { b: { role: 'boss' } } }).success).toBe(false);
  });
});
