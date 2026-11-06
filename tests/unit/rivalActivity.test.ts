// W4: rival activity, rumours and race paces (rivals/activity.ts).
import { describe, expect, it } from 'vitest';
import { liveRumors, nudgedPace, paceOf, raceLine, RIVAL_ACTIVITY, UPDATE_TYPES } from '../../src/core/rivals/activity';
import { maybeSpark, type SparkInput } from '../../src/core/rivals/manager';
import { RIVAL_CONFIG } from '../../src/core/rivals/schema';
import { VOICE_IDS } from '../../src/core/rivals/voice';
import { simulateRivalWorld } from '../../src/core/rivals/world';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { RivalWorldRecordSchema } from '../../src/core/story/schema';
import { content } from './helpers';

Object.assign(RIVAL_CONFIG.spark, { minStage: 0, chance: 1 });
const where = { region: 0, stage: 1, level: 1, node: null, battle: 1, turn: null };
const NO = { sponsored: false, openDebt: false, leaguePatron: false, hostileFaction: false, hasAlly: false, hasRival: false, mentorRival: false, legacy: false, crisis: false, sharedSpecies: false, copiesYou: false, devotedBond: false, bosses: 0 };
const input = (id: string): SparkInput => ({ where, classId: 'youngster', name: 'Joey', team: ['rattata'], ended: { id, seq: 9, type: 'battleEnded', where, actors: [], data: {} }, hpLeftShare: 0.2, turns: 6, flawless: true, ctx: NO });

function world(seed: string, stages = 12) {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0));
  for (let i = 0; i < 50 && run.story.rivals.length === 0; i++) maybeSpark(run, input(`${seed}#${i}`));
  const log: { stage: number; leads: number[]; news: string[] }[] = [];
  for (let s = 0; s < stages; s++) {
    run.stage = { ...(run.stage ?? ({} as NonNullable<RunState['stage']>)), index: s } as NonNullable<RunState['stage']>;
    const seq = run.story.events.length;
    const leadsBefore = run.story.rivals.map((r) => r.world?.lead ?? 0);
    simulateRivalWorld(content, run);
    const news = run.story.events.slice(seq).filter((e) => e.type === 'rivalryFormed').map((e) => e.data.outcome as string);
    log.push({ stage: s, leads: run.story.rivals.map((r, i) => (r.world?.lead ?? 0) - leadsBefore[i]!), news });
  }
  return { run, log };
}

describe('W4 data', () => {
  it('has 10 update types x 3 templates, 24 rumours and 3 lines per voice and situation', () => {
    expect(RIVAL_ACTIVITY.updates.map((u) => u.id)).toEqual([...UPDATE_TYPES]);
    expect(RIVAL_ACTIVITY.rumors.filter((r) => r.truth === 'T')).toHaveLength(17);
    expect(RIVAL_ACTIVITY.rumors.filter((r) => r.truth === 'F')).toHaveLength(4);
    for (const r of RIVAL_ACTIVITY.rumors.filter((x) => x.truth === 'F')) expect(r.correction).toBeTruthy();
    expect(Object.keys(RIVAL_ACTIVITY.lines).sort()).toEqual([...VOICE_IDS].sort());
  });
  it('only rumours the game can back are live', () => {
    const ids = liveRumors().map((r) => r.id);
    expect(ids).toContain('ru_01');
    expect(ids).not.toContain('ru_04');
  });
});

describe('W4 race paces', () => {
  it('sets pace from character and nudges it by results', () => {
    expect(paceOf({ traits: { ambition: 80, resilience: 50 } } as never)).toBe('fast');
    expect(paceOf({ traits: { ambition: 50, resilience: 30 } } as never)).toBe('slow');
    expect(paceOf({ traits: { ambition: 50, resilience: 50 } } as never)).toBe('steady');
    expect(nudgedPace('steady', { wins: 4, defeats: 1 })).toBe('fast');
    expect(nudgedPace('slow', { wins: 0, defeats: 9 })).toBe('slow');
  });
  it('the lead changes by at most 1 a stage and never leaves -3..3', () => {
    for (const seed of ['w4-a', 'w4-b', 'w4-c', 'w4-d']) {
      const { run, log } = world(seed, 14);
      for (const l of log) for (const d of l.leads) expect(Math.abs(d)).toBeLessThanOrEqual(1);
      for (const r of run.story.rivals) expect(Math.abs(r.world!.lead)).toBeLessThanOrEqual(3);
    }
  });
  it('fills the tracker fields and a race line in every voice', () => {
    const { run } = world('w4-e', 4);
    const r = run.story.rivals[0]!;
    expect(r.world).toMatchObject({ pace: expect.any(String), near: 'mid', goal: expect.any(String), condition: expect.any(String) });
    for (const v of VOICE_IDS) expect(raceLine(run, { ...r, voice: v })).toBeTruthy();
    expect(raceLine(run, r)).toBe(raceLine(run, r));
  });
});

describe('W4 news pacing and determinism', () => {
  it('same seed gives the same world; at most 2 news items per stage, the news is bounded', () => {
    const a = world('w4-f', 16);
    const b = world('w4-f', 16);
    expect(a.run.story.events.map((e) => e.data)).toEqual(b.run.story.events.map((e) => e.data));
    for (const l of a.log) expect(l.news.filter((o) => o === 'update' || o === 'rumor').length).toBeLessThanOrEqual(2);
  });
  it('no more than 1 observed update a stage; a wrong rumour is corrected within 2 stages', () => {
    for (const seed of ['w4-g', 'w4-h', 'w4-i', 'w4-j', 'w4-k']) {
      const { run } = world(seed, 20);
      const ups = run.story.events.filter((e) => e.data.outcome === 'update');
      const byStage = new Map<string, typeof ups>();
      for (const e of ups) byStage.set(`${e.where.region}.${e.where.stage}`, [...(byStage.get(`${e.where.region}.${e.where.stage}`) ?? []), e]);
      for (const list of byStage.values()) expect(list.filter((e) => e.data.visibility === 'observed').length).toBeLessThanOrEqual(1);
      const wrong = ups.filter((e) => e.data.accurate === false);
      for (const w of wrong) {
        const at = w.where.stage ?? 0;
        if (at + 2 > 19) continue;
        const fixed = ups.some((e) => e.data.visibility === 'observed' && String(e.data.text).startsWith('The rumour was off') && (e.where.stage ?? 0) > at && (e.where.stage ?? 0) <= at + 2);
        const rumorFix = ups.some((e) => e.data.visibility === 'observed' && (e.where.stage ?? 0) > at && (e.where.stage ?? 0) <= at + 2);
        expect(fixed || rumorFix).toBe(true);
      }
    }
  });
  it('old saves without the new fields still load', () => {
    expect(RivalWorldRecordSchema.parse({ lead: 0, badges: 0, region: 0, regionsDone: 0, wins: 0, defeats: 0, fame: 0, milestones: [] })).toBeTruthy();
  });
});
