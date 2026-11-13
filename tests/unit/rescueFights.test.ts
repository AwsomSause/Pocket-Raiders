// Beta 0.6 R9: PS-RESCUE guard fights (Door and Cage) and the annex flow.
import { describe, expect, it } from 'vitest';
import { ExpansionRunSchema } from '../../src/core/expansion/schema';
import { isPseudoBattle } from '../../src/core/events';
import { acceptOffer, answerBeat, finishPlan, gruntSpecies, impound, rescueOf, type RescueCtx } from '../../src/core/evil/rescue';
import { fightAfterAnswer, pendingFight, rescueFightEnded, startRescueFight } from '../../src/core/evil/rescueFights';
import { runningRescue } from '../../src/core/evil/rescueGlue';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const mk = (seed = 'pf1') => {
  const r = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0);
  const base = r.party[0]!;
  r.party = Array.from({ length: 5 }, (_, i) => ({ ...structuredClone(base), uid: `m${i}` }));
  r.money = 1000;
  return r;
};
const ctx = (o: Partial<RescueCtx> = {}): RescueCtx => ({ archetype: 'prodigy', money: 1000, intel: 0, os: 0, insider: false, tradeItem: false, ...o });
const start = (plan: 'quiet' | 'loud' | 'inside', seed = 'pf1', team = 'rocket') => {
  const r = mk(seed);
  const h = impound(r, { teamId: team, regionId: 'kanto', node: 10, lastQuietNode: 60, count: 2 })!;
  acceptOffer(r, h.id, plan, ctx({ insider: plan === 'inside' }), 20);
  return r;
};
const answer = (r: ReturnType<typeof mk>, ratings: ('good' | 'neutral' | 'bad')[]) => ratings.map((x) => { answerBeat(r, x); const spot = fightAfterAnswer(r); if (spot) rescueFightEnded(r, true); return spot; });

describe('which beats lead to a guard fight', () => {
  it('Quiet: none at the Approach; always at least one fight, two when the choices were poor', () => {
    expect(answer(start('quiet'), ['bad', 'good', 'good'])).toEqual([null, null, 'cage']);
    expect(answer(start('quiet', 'pf2'), ['good', 'neutral', 'good'])).toEqual([null, 'door', null]);
    expect(answer(start('quiet', 'pf4'), ['good', 'bad', 'neutral'])).toEqual([null, 'door', 'cage']);
    const r = start('quiet', 'pf3');
    answerBeat(r, 'good'); fightAfterAnswer(r);
    answerBeat(r, 'good'); fightAfterAnswer(r);
    answerBeat(r, 'bad');
    expect(fightAfterAnswer(r)).toBe('cage');
    expect(pendingFight(r)).toBe('cage');
  });
  it('Loud: a guard after every beat, three in all', () => {
    const r = start('loud');
    for (const [i, spot] of (['approach', 'door', 'cage'] as const).entries()) {
      answerBeat(r, 'good');
      expect(fightAfterAnswer(r)).toBe(spot);
      rescueFightEnded(r, true);
      expect(rescueOf(r).active!.fights).toHaveLength(i + 1);
    }
  });
  it('the Inside Job has no fights', () => {
    expect(answer(start('inside'), ['bad', 'bad'])).toEqual([null, null]);
  });
  it('asking again before the fight is settled returns the same spot, never a second fight', () => {
    const r = start('loud');
    answerBeat(r, 'good');
    expect(fightAfterAnswer(r)).toBe('approach');
    expect(fightAfterAnswer(r)).toBe('approach');
  });
});

describe('the guard battle', () => {
  it('is a pseudo trainer battle from the holding team, the same on replay', () => {
    const a = start('loud', 'pf-same');
    answerBeat(a, 'neutral'); fightAfterAnswer(a);
    expect(startRescueFight(content, a)).toBe('approach');
    expect(a.phase).toBe('battle');
    expect(a.battle!.kind).toBe('trainer');
    expect(a.battle!.event?.eventId).toBe('rescue:approach');
    expect(isPseudoBattle(content, a.battle!.event!)).toBe(true);
    const pool = gruntSpecies('rocket');
    for (const mon of a.battle!.enemyTeam) expect(pool).toContain(mon.speciesId);
    const b = start('loud', 'pf-same');
    answerBeat(b, 'neutral'); fightAfterAnswer(b);
    startRescueFight(content, b);
    expect(b.battle!.enemyTeam.map((m) => m.speciesId)).toEqual(a.battle!.enemyTeam.map((m) => m.speciesId));
  });
  it('failure: starting a fight with none waiting throws', () => {
    expect(() => startRescueFight(content, start('quiet'))).toThrow();
  });
  it('a lost fight wipes the plan: result Fail, nothing returns, the hold stays', () => {
    const r = start('quiet');
    answerBeat(r, 'good'); fightAfterAnswer(r);
    answerBeat(r, 'neutral'); fightAfterAnswer(r);
    rescueFightEnded(r, false);
    expect(rescueOf(r).active!.wiped).toBe(true);
    const out = finishPlan(r, ctx(), 25, { wiped: rescueOf(r).active!.wiped });
    expect(out.result).toBe('fail');
    expect(out.returned).toHaveLength(0);
    expect(rescueOf(r).holds[0]!.pokemon).toHaveLength(2);
  });
  it('a won fight keeps the plan going to its roll', () => {
    const r = start('quiet');
    answerBeat(r, 'good'); fightAfterAnswer(r);
    answerBeat(r, 'neutral'); fightAfterAnswer(r);
    rescueFightEnded(r, true);
    const pr = rescueOf(r).active!;
    expect(pr.wiped).toBe(false);
    expect(pr.fightNow).toBeNull();
    expect(pr.fights).toEqual(['won']);
  });
});

describe('save and resume', () => {
  it('a plan mid-fight survives a save round trip and the map resumes it', () => {
    const r = start('loud');
    answerBeat(r, 'good'); fightAfterAnswer(r);
    r.expansion = ExpansionRunSchema.parse(JSON.parse(JSON.stringify({ ...r.expansion, rival: { blue: { role: 'main', personality: 'strategist', style: 'blitz', arc: 'prodigy-learns-humility', lead: 1, marks: [], feelings: { friendship: 3, respect: 3, trust: 3, rivalry: 3, resentment: 0, admiration: 2 }, pityLosses: 0 } } })));
    expect(pendingFight(r)).toBe('approach');
    expect(runningRescue(content, r)).not.toBeNull();
    expect(rescueOf(r).active!.plan).toBe('loud');
  });
  it('an old saved plan without the new fields still loads', () => {
    const r = start('quiet');
    const raw = JSON.parse(JSON.stringify(r.expansion));
    delete raw.rescue.active.fights; delete raw.rescue.active.fightNow; delete raw.rescue.active.wiped;
    const back = ExpansionRunSchema.parse(raw);
    expect(back.rescue!.active!.fights).toEqual([]);
    expect(back.rescue!.active!.wiped).toBe(false);
  });
  it('nothing resumes when no plan is running', () => {
    expect(runningRescue(content, mk())).toBeNull();
  });
});
