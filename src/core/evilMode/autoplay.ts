// Evil Mode's autoplayer (design Part 30 section 14.1): plays a whole region from founding with a simple policy, through
// `step` only, and records every action, so the same list replays to the same block. The simulator (tools/evil-sim.ts)
// runs it over many seeds; the tests replay it. Pure: no Phaser, no gameplay RNG of its own (a policy reads the block).

import { EVIL_DATA, type EvilData } from './data';
import { BEAT_END, step, type EvilAction } from './day';
import { jobProblem } from './dispatch';
import { makeRoad } from './road';
import { makeHero } from './hero';
import { inRoster } from './people';
import { mayStay } from './region';
import { foundTeam, type FoundingChoice } from './start';
import type { EvilModeBlock, Holding, JobMethod } from './schema';
import type { JobDraft } from './odds';
import { bustProblem, cardDef, econOn, heldStreets, honestCost, offered, tradeReqProblem, ventureProblem } from './economy';

/** always Persuade; the richest job first (Pay when it can, else Persuade); a mix (and an Officer left behind). */
export type Policy = 'persuade' | 'richest' | 'mix';

export interface DistrictStat { n: number; how: string; funds: number; heat: number; held: number; day: number; left: number; badges: number }
export interface PlayResult {
  block: EvilModeBlock;
  actions: EvilAction[];
  districts: DistrictStat[];
  /** True when the region reached its end (the Reckoning's over) within the action budget. */
  finished: boolean;
  /** Slice 11: Evenings that ended bankrupt, and the lowest Funds after any Evening. */
  brokeDays: number;
  lowest: number;
}

/** A founded block at the region's first Morning, with the Hero made from the seed (as the session does). */
export function foundForPlay(seed: string, choice: FoundingChoice, data: EvilData = EVIL_DATA): EvilModeBlock {
  const r = foundTeam(choice, { boss: 'red', length: 'three', seed }, data);
  if (!r.ok) throw new Error(r.problem);
  const b = r.block;
  if (!data.hero.on || !b.district) return b;
  const hero = makeHero(seed, b.district, null, data).hero;
  // Slice 12: the other three, as the session makes them.
  return { ...b, hero, road: data.road.on ? makeRoad(seed, hero, b.district, 'red', data).road : [] };
}

/** The policy's jobs for today: scout the unknown, then work what's known, one squad at a time, while people are free. */
export function policyJobs(block: EvilModeBlock, policy: Policy, data: EvilData = EVIL_DATA): JobDraft[] {
  const d = block.district!;
  const free = inRoster(block).filter((c) => c.outOn !== block.here.day && !c.minor).map((c) => c.id);
  const out: JobDraft[] = [];
  const open = d.holdings.filter((h) => h.owner !== 'team' && h.kind !== 'gym' && h.kind !== 'town');
  const worth = (h: Holding) => (h.kind === 'local' || h.kind === 'floor' ? 2 : 1);
  const sorted = policy === 'persuade' ? open : [...open].sort((a, b) => worth(b) - worth(a) || a.step - b.step);
  let funds = block.team.funds;
  for (const h of sorted) {
    if (free.length === 0) break;
    const methods: JobMethod[] = h.scouted === 0 && h.kind !== 'wild' && h.kind !== 'alpha' ? ['scout'] : policy === 'persuade' ? ['persuade', 'outplay'] : policy === 'richest' ? ['pay', 'persuade', 'outplay'] : h.step % 2 ? ['persuade', 'pay', 'outplay'] : ['outplay', 'persuade', 'pay'];
    for (const method of methods) {
      const size = method === 'scout' ? 1 : 2;
      if (free.length < size) continue;
      const job: JobDraft = { holdingId: h.id, method, squad: free.slice(0, size), ...(method === 'pay' ? { offer: 100 } : {}) };
      const tried = { ...block, queue: [...block.queue, ...out.map((j) => ({ ...j, odds: null, certain: false, terms: [] }))] } as EvilModeBlock;
      if (method === 'pay' && funds < 2000) continue;
      if (jobProblem(tried, job, data)) continue;
      out.push(job);
      free.splice(0, size);
      if (method === 'pay') funds -= 2000;
      break;
    }
  }
  return out;
}

/**
 * Slice 11: the policy's trade for today, after its jobs: a way out if bankrupt (the Whip-Round, a sale, One Last Job), a
 * Sullen racket made honest, a racket (not under `persuade`), a Front and a Work when there's money to spare. Reads the block only.
 */
export function policyTrade(block: EvilModeBlock, policy: Policy, data: EvilData = EVIL_DATA): EvilAction[] {
  if (!econOn(data) || !block.district || block.here.beat !== 'dispatch') return [];
  const out: EvilAction[] = [];
  if (block.economy.broke > 0) {
    for (const way of ['whip', 'sell', 'lastJob'] as const) {
      if (way === 'lastJob' && policy === 'persuade') continue;
      if (!bustProblem(block, way, null, data)) return [{ type: 'bust', way }];
    }
  }
  const funds = block.team.funds;
  for (const v of block.economy.running) {
    const def = cardDef(v.cardId, data)!;
    if (v.kind === 'racket' && !v.honest && (v.patience ?? 99) <= data.economy.rules.racket.warnAt && funds > honestCost(def, data) + 2000 && !ventureProblem(block, v.id, 'honest', data)) return [{ type: 'venture', id: v.id, act: 'honest' }];
  }
  const cards = offered(block, data);
  if (policy !== 'persuade') {
    const street = heldStreets(block, data)[0];
    const c = cards.find((x) => x.kind === 'racket' && street !== undefined && !tradeReqProblem(block, { cardId: x.id, street }, data));
    if (c) out.push({ type: 'trade', req: { cardId: c.id, street: street! } });
  }
  const f = cards.find((x) => x.kind === 'front' && funds > x.cost + 3000 && !tradeReqProblem(block, { cardId: x.id }, data));
  if (f && !out.length) out.push({ type: 'trade', req: { cardId: f.id } });
  const w = cards.find((x) => x.kind === 'work' && !x.running && funds > x.cost + 5000 && !tradeReqProblem(block, { cardId: x.id }, data));
  if (w && !out.length) out.push({ type: 'trade', req: { cardId: w.id } });
  return out;
}

/** Plays from `block` to the region's end (or the budget), recording each action that was accepted. */
export function playRegion(block0: EvilModeBlock, policy: Policy, data: EvilData = EVIL_DATA, budget = 4000): PlayResult {
  let block = block0;
  const actions: EvilAction[] = [];
  const districts: DistrictStat[] = [];
  let brokeDays = 0;
  let lowest = block0.team.funds;
  const act = (a: EvilAction): boolean => {
    const r = step(block, a);
    if (r.ok) {
      if (r.block.here.beat === 'evening' && block.here.beat !== 'evening') {
        lowest = Math.min(lowest, r.block.team.funds);
        if ((r.block.economy?.broke ?? 0) > 0) brokeDays += 1;
      }
      block = r.block;
      actions.push(a);
    }
    return r.ok;
  };
  const done = (finished: boolean): PlayResult => ({ block, actions, districts, finished, brokeDays, lowest });
  for (let i = 0; i < budget; i++) {
    const R = block.region;
    if (R.phase === 'over') return done(true);
    if (R.phase === 'tally') {
      const d = block.district!;
      districts.push({ n: d.n, how: d.end!.how, funds: block.team.funds, heat: block.team.heat, held: d.end!.count, day: block.here.day, left: block.crew.filter((c) => c.where === 'left').length, badges: block.hero?.badges.length ?? 0 });
      act({ type: 'toRoad' });
      continue;
    }
    if (R.phase === 'road') {
      const officer = policy === 'mix' ? mayStay(block, data)[0]?.id ?? null : null;
      act({ type: 'goOn', stay: officer });
      continue;
    }
    // A battle the day waits on: the policy loses every one it's in (the soft-loss path; nothing ends).
    if (block.fight) {
      act({ type: 'battleResult', won: false });
      continue;
    }
    // Slice 12: the last room: the policy says nothing (the Hero answers their own question, and leaves).
    if (block.reck?.room && !block.reck.room.outcome) {
      act({ type: 'roomAct', what: 'nothing' });
      continue;
    }
    if (block.refusal) {
      act({ type: 'answerRefusal', answer: 'withdraw' });
      continue;
    }
    const beat = block.here.beat;
    if (beat === 'morning' && block.applicants.length && inRoster(block).length < 6 && block.team.funds > 1500) act({ type: 'hire', ref: block.applicants[0]!.ref });
    if (beat === 'dispatch' && block.queue.length === 0) {
      for (const job of policyJobs(block, policy, data)) act({ type: 'queueJob', job });
      for (const a of policyTrade(block, policy, data)) act(a);
    }
    if (!act({ type: BEAT_END[block.here.beat] })) return done(false);
  }
  return done(false);
}

/** Replays a list of actions from a founded block; every one must be accepted again. */
export function replay(block0: EvilModeBlock, actions: readonly EvilAction[]): EvilModeBlock {
  let block = block0;
  for (const a of actions) {
    const r = step(block, a);
    if (!r.ok) throw new Error(`Replay refused ${a.type}: ${r.cues.map((c) => ('reason' in c ? c.reason : c.id)).join('; ')}`);
    block = r.block;
  }
  return block;
}
