// Beta 0.6 workstream 5 wiring: bank lines at battle start, meeting counts, counter-pick caps.
import { describe, expect, it } from 'vitest';
import { counterCap, encounterOf, rivalBattleLines, rivalResultLine, totalMeetings } from '../../src/core/rivals/live';
import { registerRival } from '../../src/core/rivals/overhaul';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const run = () => chooseStarter(content, createRun(content, { runId: 'lv', seed: 'lv', archetypeId: 'red' }), 0);
const reg = (r: ReturnType<typeof run>) => registerRival(r, { id: 'blue', role: 'main', personality: 'underdog', style: 'blitz', arc: 'prodigy-learns-humility' });

describe('rival live wiring', () => {
  it('unregistered rivals get nothing and keep their normal cap', () => {
    const r = run();
    expect(rivalBattleLines(content, r, 'blue', 'trainer', 0)).toEqual([]);
    expect(counterCap(r, 'blue', 'trainer', 2)).toBe(2);
    expect(rivalResultLine(r, 'blue', true)).toBeNull();
  });
  it('says one Pokémon line and counts the meeting; deterministic', () => {
    const a = run(), b = run();
    reg(a); reg(b);
    const la = rivalBattleLines(content, a, 'blue', 'trainer', 0);
    expect(la).toHaveLength(1);
    expect(la[0]).not.toMatch(/\{/);
    expect(rivalBattleLines(content, b, 'blue', 'trainer', 0)).toEqual(la);
    expect(totalMeetings(a, 'blue')).toBe(1);
  });
  it('adds a gym line at a gym and a pity line once pity is active', () => {
    const r = run();
    const rec = reg(r);
    expect(rivalBattleLines(content, r, 'blue', 'gym', 0)).toHaveLength(2);
    rec.pityLosses = 5;
    expect(rivalBattleLines(content, r, 'blue', 'trainer', 0)).toHaveLength(2);
  });
  it('counter-picks: none on the first fight, one mid-region, never above the normal cap', () => {
    const r = run();
    reg(r);
    expect(counterCap(r, 'blue', 'trainer', 3)).toBe(0);
    rivalBattleLines(content, r, 'blue', 'trainer', 0);
    expect(counterCap(r, 'blue', 'trainer', 3)).toBe(1);
    expect(counterCap(r, 'blue', 'trainer', 0)).toBe(0);
    expect(encounterOf(5, 'trainer')).toBe('finale');
    expect(encounterOf(1, 'champion')).toBe('league');
  });
  it('has a result line for a win and a loss', () => {
    const r = run();
    reg(r);
    expect(rivalResultLine(r, 'blue', true)).toBeTruthy();
    expect(rivalResultLine(r, 'blue', false)).toBeTruthy();
  });
});
