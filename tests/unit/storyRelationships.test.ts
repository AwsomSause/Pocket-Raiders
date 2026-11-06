import { describe, it, expect } from 'vitest';
import { freshRecord, meet, change, endNode, computeStage, drift, ripples, remember, pickCallback, consequences, ACTIONS, stageRank, GATES } from '../../src/core/story2/relationships';

const met = () => { const r = freshRecord(); meet(r, 1); return r; };

describe('story relationships', () => {
  it('starts as a stranger and meeting makes an acquaintance', () => {
    const r = freshRecord();
    expect(r.stage).toBe('stranger');
    meet(r, 1);
    expect(r.stage).toBe('acquaintance');
    meet(r, 2);
    expect(r.last?.node).toBe(1);
  });
  it('change clamps to 0..100 and reports what was applied', () => {
    const r = met();
    expect(change(r, { trust: 150 }, 2)).toEqual({ trust: 100 });
    expect(change(r, { trust: -500 }, 3)).toEqual({ trust: -100 });
    expect(r.attrs.trust).toBe(0);
  });
  it('stage moves only after two Nodes past the hysteresis margin', () => {
    const r = met();
    change(r, { trust: 30, respect: 30, affection: 30 }, 2);
    endNode(r);
    expect(r.stage).toBe('acquaintance');
    expect(r.pending).toBe('familiar');
    endNode(r);
    expect(r.stage).toBe('familiar');
  });
  it('a number just over the line does not move the stage (hysteresis)', () => {
    const r = met();
    change(r, { trust: 15, respect: 15, affection: 12 }, 2);
    endNode(r); endNode(r);
    expect(r.stage).toBe('acquaintance');
  });
  it('trusted, close and devoted need their gate event', () => {
    const r = met();
    change(r, { trust: 90, respect: 90, affection: 90, loyalty: 90 }, 2);
    expect(computeStage(r)).not.toBe('trusted');
    r.gates.push(GATES.trusted);
    expect(computeStage(r)).toBe('trusted');
    r.gates.push(GATES.close);
    expect(computeStage(r)).toBe('close');
    r.gates.push(GATES.devoted);
    expect(computeStage(r)).toBe('devoted');
  });
  it('suspicion climbs the negative ladder and nemesis needs both gates', () => {
    const r = met();
    change(r, { suspicion: 25 }, 2);
    expect(computeStage(r)).toBe('wary');
    change(r, { suspicion: 20 }, 3);
    expect(computeStage(r)).toBe('suspicious');
    change(r, { suspicion: 10 }, 4);
    expect(computeStage(r)).toBe('disliked');
    r.gates.push(GATES.hostile);
    expect(computeStage(r)).toBe('hostile');
    r.gates.push(GATES.nemesis);
    expect(computeStage(r)).toBe('nemesis');
    expect(stageRank('nemesis')).toBeLessThan(0);
  });
  it('drift cools suspicion and moves rivalry toward baseline', () => {
    const r = met();
    change(r, { suspicion: 10, rivalry: 10, respect: 70, fear: 5 }, 2);
    drift(r, false, 5);
    expect(r.attrs.suspicion).toBe(9);
    expect(r.attrs.rivalry).toBe(9);
    expect(r.attrs.fear).toBe(4);
    drift(r, true);
    expect(r.attrs.suspicion).toBe(9);
  });
  it('ripples share a capped slice with linked characters', () => {
    const links = [{ a: 'a', b: 'b', kind: 'family' as const }, { a: 'a', b: 'c', kind: 'rival' as const }, { a: 'x', b: 'y', kind: 'friend' as const }];
    const out = ripples(links, 'a', { trust: 50, suspicion: -10 });
    expect(out.b).toEqual({ trust: 10, suspicion: -3 });
    expect(out.c).toEqual({ trust: -5, suspicion: 1 });
    expect(out.y).toBeUndefined();
  });
  it('callback picks the highest salience in the last 12 Nodes, never-forget memories stay', () => {
    const r = met();
    remember(r, 'old_minor', 4, 1);
    remember(r, 'old_big', 10, 1);
    remember(r, 'recent', 6, 20);
    expect(pickCallback(r, 22)?.tag).toBe('old_big');
    r.mem = r.mem.filter((m) => m.tag !== 'old_big');
    expect(pickCallback(r, 22)?.tag).toBe('recent');
    expect(pickCallback(r, 40)).toBeNull();
  });
  it('remember ignores duplicates and clamps salience', () => {
    const r = met();
    remember(r, 't', 99, 3); remember(r, 't', 5, 3);
    expect(r.mem).toEqual([{ tag: 't', salience: 10, node: 3 }]);
  });
  it('consequences follow the numbers', () => {
    const r = met();
    change(r, { respect: 65, rivalry: 75 }, 2);
    expect(consequences(r, 'rival')).toEqual(['rival_warns_before_hard_battle', 'rival_requests_rematch']);
    change(r, { suspicion: 45 }, 3);
    expect(consequences(r, 'leader')).toContain('refuses_information_and_services');
  });
  it('action table deltas apply', () => {
    const r = met();
    change(r, ACTIONS.save_from_danger!, 2);
    expect(r.attrs).toMatchObject({ trust: 15, affection: 10, loyalty: 10 });
  });
});
