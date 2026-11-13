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

import { friendInRegion } from '../../src/core/rivals/friend';
import { friendName, friendStageBeat, pseudoRivalBeat } from '../../src/core/rivals/live';
import { catchStepInRoll, markStepIn, PRESENCE } from '../../src/core/rivals/presence';

describe('Friend scenes and Pseudo Stage beats', () => {
  const withMain = () => {
    const r = run();
    reg(r);
    return r;
  };
  it('does nothing without a registered main rival', () => {
    const r = run();
    expect(friendStageBeat(content, r)).toBeNull();
    expect(pseudoRivalBeat(content, r)).toBeNull();
  });
  it('plays at most the four scenes in a Friend region, one per second stage, once per stage', () => {
    // find a seed whose region 0 has the Friend
    let r = withMain();
    for (let s = 0; s < 50 && !friendInRegion(r.seed, 0); s++) {
      r = chooseStarter(content, createRun(content, { runId: `fr${s}`, seed: `fr${s}`, archetypeId: 'red' }), 0);
      reg(r);
    }
    expect(friendInRegion(r.seed, 0)).toBe(true);
    const texts: string[] = [];
    for (let stage = 1; stage <= 10; stage++) {
      r.stage = { ...r.stage!, index: stage } as typeof r.stage;
      const t = friendStageBeat(content, r);
      if (t) texts.push(t);
      expect(friendStageBeat(content, r)).toBeNull(); // same stage twice: nothing
    }
    expect(texts).toHaveLength(PRESENCE.friend.scenes.length);
    for (const t of texts) expect(t).toContain(friendName(r));
    expect(r.expansion!.rival![`friend-${r.seed}`]!.role).toBe('friend');
  });
  it('catch step-in is pure to plan and fires once per region once marked', () => {
    const r = withMain();
    const rec = r.expansion!.rival!.blue!;
    let n = -1;
    for (let c = 0; c < 5000 && n < 0; c++) if (catchStepInRoll('x', rec, 0, c)) n = c;
    expect(n).toBeGreaterThanOrEqual(0);
    expect(catchStepInRoll('x', rec, 0, n)).toBe(true);
    expect(catchStepInRoll('x', rec, 0, n)).toBe(true); // planning twice gives the same answer
    markStepIn(rec, 0);
    expect(catchStepInRoll('x', rec, 0, n)).toBe(false);
  });
});
