// Rival Rescue Plan (Beta 0.6 R9). Pure rules, no Phaser, no UI. Impound -> receipt and holding clock -> the rival's offer
// -> one of five plans -> a result -> the reunion. State lives in run.expansion.rescue (no save bump).
// Randomness: stateless hashed rolls (seed + region + label, as the design says), so no shared stream ever moves.

import evilJson from '../../data/evilTeams.json';
import data from '../../data/rivalRescue.json';
import { Rng, hashSeed } from '../rng';
import type { RunState } from '../state';
import { changeFeelings, overhaulOf } from '../rivals/overhaul';
import { ARCHETYPES, PLAN_IDS, RescueDataSchema, RescueStateSchema } from './rescueSchema';
import type { Archetype, Hold, HoldState, PlanId, PlanRun, RescueResult, RescueState, ShortcutId } from './rescueSchema';

export { PLAN_IDS, ARCHETYPES };
export type { Archetype, Hold, HoldState, PlanId, PlanRun, RescueResult, RescueState, ShortcutId };

export const RESCUE = RescueDataSchema.parse(data);
const T = RESCUE.tuning;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** The run's rescue state (created on first use). */
export function rescueOf(run: RunState): RescueState {
  const block = (run.expansion ??= {});
  return (block.rescue ??= RescueStateSchema.parse({}));
}
const log = (s: RescueState, e: string) => {
  s.log.push(e);
  if (s.log.length > 60) s.log.splice(0, s.log.length - 60);
};
const roll = (run: RunState, regionId: string, label: string): number => new Rng(hashSeed(`${run.seed}::${regionId}::${label}`)).float();
const holdOf = (s: RescueState, id: string): Hold => {
  const h = s.holds.find((x) => x.id === id);
  if (!h) throw new Error(`No such hold ${id}`);
  return h;
};

// ---------- impound, receipt, clock ----------

export const hasReceipt = (teamId: string): boolean => teamId !== 'snagem' && teamId in RESCUE.receipts;
export const siteOf = (teamId: string) => {
  const s = RESCUE.sites.find((x) => x.team === teamId);
  if (!s) throw new Error(`Unknown holding team ${teamId}`);
  return s;
};

/** The wait before the offer: 9, 10 or 11 nodes, fixed by the seed. */
export const waitFor = (run: RunState, regionId: string): number => T.waitMin + Math.floor(roll(run, regionId, 'rescue-wait') * T.waitSpan);
/** The node the first offer is due: the wait, or the last quiet node before the climax, whichever is sooner. */
export const planDueAt = (impoundNode: number, wait: number, lastQuietNode: number): number => Math.min(impoundNode + wait, lastQuietNode);

export interface ImpoundInput {
  teamId: string;
  regionId: string;
  node: number;
  /** The last quiet node before the climax (the node before the news report). */
  lastQuietNode: number;
  /** 1 to 3 Pokémon. */
  count: number;
}

/**
 * C1 Impound: takes bench Pokémon first, never the last two party members. Returns the hold, or null when nothing could be taken.
 * A later impound in the same region joins a hold whose plan has not been offered yet; otherwise a new timer starts.
 */
export function impound(run: RunState, input: ImpoundInput): Hold | null {
  siteOf(input.teamId);
  const s = rescueOf(run);
  const takeable = Math.max(0, run.party.length - 2);
  const n = Math.min(clamp(input.count, 1, 3), takeable);
  if (n <= 0) return null;
  // Bench first: from the back of the party.
  const taken = run.party.splice(run.party.length - n, n);
  const join = s.holds.find((h) => h.regionId === input.regionId && h.offers === 0 && h.accepted === null && h.teamId === input.teamId);
  if (join) {
    join.pokemon.push(...(taken as unknown as Record<string, unknown>[]));
    log(s, `impound.applied:${join.id}:+${n}`);
    return join;
  }
  const wait = waitFor(run, input.regionId);
  const hold: Hold = {
    id: `h${s.holds.length + 1}-${input.regionId}`, teamId: input.teamId, regionId: input.regionId,
    pokemon: taken as unknown as Record<string, unknown>[], impoundNode: input.node, waitNodes: wait, lastQuietNode: input.lastQuietNode,
    dueAt: planDueAt(input.node, wait, input.lastQuietNode), receipt: hasReceipt(input.teamId), offers: 0, declines: 0, lastDeclineNode: null,
    lateDue: false, late: false, frozenAt: null, accepted: null, warrantAt: null, heldAtClimax: false,
  };
  s.holds.push(hold);
  log(s, `impound.applied:${hold.id}:${n}`);
  return hold;
}

/** Holds still waiting (their Pokémon are held). */
export const activeHolds = (run: RunState): Hold[] => rescueOf(run).holds.filter((h) => h.pokemon.length > 0);
/** The receipt line for a hold (the first clue), or null (Team Snag'em leaves none). */
export const receiptText = (h: Hold): string | null => (h.receipt ? RESCUE.receipts[h.teamId]! : null);

/** Nodes held (the clock stops when a plan is accepted). */
export const nodesHeld = (h: Hold, node: number): number => Math.max(0, (h.frozenAt ?? node) - h.impoundNode);

/** The holding clock: Logged 0-4, Processed 5-9, Assigned 10+; Held too long by the base rule only. */
export function holdState(h: Hold, node: number): HoldState {
  if (h.declines >= 2 || h.heldAtClimax) return 'held-too-long';
  const n = nodesHeld(h, node);
  return n >= T.assignedAt ? 'assigned' : n >= T.processedAt ? 'processed' : 'logged';
}

// ---------- offers ----------

export type OfferKind = 'first' | 'second' | 'late' | 'climax-eve';
export interface Offer {
  holdId: string;
  kind: OfferKind;
}

/**
 * The offer due at this node, or null. Offers come only at a quiet moment (`quiet`), and never while a plan or another
 * rival scene is running. First at `dueAt`; second 5 nodes after a decline or at the last quiet node; a Late Plan at the
 * first rest node after a stay-out; never a third.
 */
export function offerDue(run: RunState, node: number, quiet: boolean): Offer | null {
  const s = rescueOf(run);
  if (!quiet || s.active) return null;
  for (const h of s.holds) {
    if (h.pokemon.length === 0 || h.accepted) continue;
    if (h.lateDue) return { holdId: h.id, kind: 'late' };
    const eve = node >= h.lastQuietNode;
    if (h.offers === 0 && node >= h.dueAt) return { holdId: h.id, kind: eve ? 'climax-eve' : 'first' };
    if (h.offers === 1 && h.lastDeclineNode !== null && (node >= h.lastDeclineNode + T.secondOfferGap || eve)) return { holdId: h.id, kind: eve ? 'climax-eve' : 'second' };
  }
  return null;
}

export function declineOffer(run: RunState, holdId: string, node: number, archetype: Archetype): void {
  const s = rescueOf(run);
  const h = holdOf(s, holdId);
  h.offers += 1;
  h.declines += 1;
  h.lastDeclineNode = node;
  if (h.late) h.lateDue = false;
  s.attitude = clamp(s.attitude + RESCUE.attitude[archetype].declined, -5, 5);
  if (!s.memory.includes('rescue-declined')) s.memory.push('rescue-declined');
  log(s, `rescue.declined:${h.id}`);
}

/** The player stays out of the offer at the end of a region: the Late Plan is due at the next region's first rest node. */
export function stayOut(run: RunState, holdId: string): void {
  const h = holdOf(rescueOf(run), holdId);
  h.lateDue = true;
  h.late = true;
}

/** Cancels holds whose Pokémon were all returned another way (rescue event, Raid 3 Triumph). */
export function returnedElsewhere(run: RunState, holdId: string, node: number, how: string): string[] {
  const s = rescueOf(run);
  const h = holdOf(s, holdId);
  log(s, `impound.returned:${h.id}:${how}`);
  return restore(run, h, h.pokemon.length, node, holdState(h, node));
}

// ---------- plans ----------

export interface RescueCtx {
  archetype: Archetype;
  money: number;
  /** Intel 0..100 and Operational Strength (owned by the evil-team economy; passed in, never invented here). */
  intel: number;
  os: number;
  /** The player has someone inside: an Inside Man flag, a Defector, the runner, or trio reputation +15 (Remnants). */
  insider: boolean;
  /** The insider's relationship is good (Defector helped, runner close, trio rep +25). */
  insiderGood?: boolean;
  /** Something the team wants: Intel pack on a rival team, a recovered device, an officer's tool. */
  tradeItem: boolean;
  /** The item was taken from this very team (Bitter prefers the Exchange). */
  tradeItemFromTeam?: boolean;
  /** Reputation with the holding team. */
  teamRep?: number;
  /** A Defector exists (Scholar prefers the Inside Job). */
  defector?: boolean;
  /** Any raid this run ended in Triumph / Failure. */
  raidTriumph?: boolean;
  raidFailure?: boolean;
  /** The run's rival is the Side-with variant: the Inside Job is always listed (the rival is the insider). */
  sideWith?: boolean;
  /** Mirror: the approach used most in raids. */
  mirrorApproach?: 'quiet' | 'loud';
}

export interface PlanOption {
  plan: PlanId;
  available: boolean;
  /** Why it is greyed out or why it is listed. */
  reason: string | null;
  preferred: boolean;
}

/** The plan the rival prefers (gives +0.10 rapport). */
export function preferredPlan(ctx: RescueCtx): PlanId {
  if (ctx.archetype === 'scholar' && ctx.defector) return 'inside';
  if (ctx.archetype === 'bitter' && ctx.tradeItem && ctx.tradeItemFromTeam) return 'exchange';
  if (ctx.archetype === 'mirror') return ctx.mirrorApproach ?? 'quiet';
  return RESCUE.prefers[ctx.archetype];
}

/** The Deal's price: 40% of money (30% with team reputation +15), less with Intel spent. Pure. */
export function dealPrice(money: number, ctx: Pick<RescueCtx, 'teamRep' | 'intel'>, payIntel: boolean): { money: number; intel: number } {
  let pct = (ctx.teamRep ?? 0) >= 15 ? T.dealMoneyPctRep : T.dealMoneyPct;
  let intel = 0;
  if (payIntel && ctx.intel >= T.dealIntelCost) {
    pct = Math.max(0, pct - T.dealIntelOffPct);
    intel = T.dealIntelCost;
  }
  return { money: Math.floor((money * pct) / 100), intel };
}

/** The five plans with their availability. The Deal is greyed out with the reason when it cannot be paid. */
export function planOptions(ctx: RescueCtx): PlanOption[] {
  const pref = preferredPlan(ctx);
  const dealOk = ctx.money > 0 || ctx.archetype === 'heir';
  return PLAN_IDS.map((plan) => {
    let available = true;
    let reason: string | null = null;
    if (plan === 'deal' && !dealOk) { available = false; reason = 'You have no money to pay with.'; }
    if (plan === 'inside') { available = ctx.insider || !!ctx.sideWith; reason = available ? (ctx.insider ? 'Someone on the inside will open the door.' : 'Your rival says they have a way in.') : 'You have nobody on the inside.'; }
    if (plan === 'exchange') { available = ctx.tradeItem; reason = available ? 'You hold something they want.' : 'You hold nothing they want.'; }
    return { plan, available, reason, preferred: plan === pref };
  });
}

export interface SuccessInput {
  plan: 'quiet' | 'loud' | 'inside';
  attitude: number;
  intel: number;
  os: number;
  preferred: boolean;
  /** Sum of beat ratings: each good +1, bad -1 (the complication answer counts as a beat). */
  beatPoints: number;
  raidTriumph: boolean;
  raidFailure: boolean;
  late: boolean;
  /** The Exchange turned into a Loud Grab. */
  penalty?: number;
  insiderGood?: boolean;
  /** The receipt was shown (+1 beat point at the Approach). */
}

/** The success chance, clamped 0.35-0.95. Never shown as a number. */
export function successChance(i: SuccessInput): number {
  const p =
    T.base[i.plan] +
    T.attitudePerPoint * clamp(i.attitude, -5, 5) +
    T.intelPerTier * Math.floor(clamp(i.intel, 0, 100) / 25) -
    T.osPerPoint * Math.max(0, i.os - T.osFree) +
    (i.preferred ? T.preferredBonus : 0) +
    T.beatStep * i.beatPoints +
    (i.raidTriumph ? T.raidStep : 0) - (i.raidFailure ? T.raidStep : 0) -
    (i.late ? T.latePenalty : 0) -
    (i.penalty ?? 0) +
    (i.plan === 'inside' && i.insiderGood ? T.insiderGoodBonus : 0);
  return clamp(p, T.pMin, T.pMax);
}

export type Readiness = 'Risky' | 'Even' | 'Likely' | 'Safe';
export const readinessLabel = (p: number): Readiness => (p < T.labels.risky ? 'Risky' : p < T.labels.even ? 'Even' : p < T.labels.likely ? 'Likely' : 'Safe');

export const BEATS: Record<PlanId, readonly string[]> = { quiet: ['approach', 'door', 'cage'], loud: ['approach', 'door', 'cage'], inside: ['approach', 'cage'], deal: [], exchange: ['opening', 'middle', 'close'] };

/** Exactly one complication per plan, from the seed (1-12). */
export const drawComplication = (run: RunState, regionId: string): number => 1 + Math.floor(roll(run, regionId, 'rescue-complication') * 12);

/** The cheapest honest check that a plan may be started now. */
export function canStart(run: RunState, h: Hold, plan: PlanId, ctx: RescueCtx): PlanOption {
  const o = planOptions(ctx).find((x) => x.plan === plan)!;
  if (!o.available) return o;
  if (plan === 'deal' && ctx.archetype !== 'heir' && dealPrice(ctx.money, ctx, false).money <= 0 && h.pokemon.length > 0 && ctx.money <= 0) return { ...o, available: false, reason: 'You have no money to pay with.' };
  return o;
}

/** Accepts an offer. Starts the plan run (the micro Pseudo Stage PS-RESCUE) and stops the clock. */
export function acceptOffer(run: RunState, holdId: string, plan: PlanId, ctx: RescueCtx, node: number): PlanRun {
  const s = rescueOf(run);
  const h = holdOf(s, holdId);
  if (s.active) throw new Error('A rescue plan is already running');
  const opt = planOptions(ctx).find((o) => o.plan === plan)!;
  if (!opt.available) throw new Error(`Plan ${plan} is not available: ${opt.reason}`);
  h.offers += 1;
  h.accepted = plan;
  h.frozenAt = node;
  h.lateDue = false;
  const pr: PlanRun = { holdId, plan, complication: drawComplication(run, h.regionId), beats: [], complicationAnswer: null, exchangeWrong: 0, penalty: 0, late: h.late, heatDone: 0 };
  s.active = pr;
  log(s, `rescue.accepted:${h.id}:${plan}`);
  return pr;
}

/** Declining mid-way (the player quits the stage): the offer returns at the next quiet node and counts as the first offer. */
export function abandonPlan(run: RunState, node: number): void {
  const s = rescueOf(run);
  if (!s.active) return;
  const h = holdOf(s, s.active.holdId);
  h.accepted = null;
  h.frozenAt = null;
  h.dueAt = node;
  h.offers = 0;
  s.active = null;
}

/** One beat's choice (Approach, Door, Cage). Loud Grab's Cage 'bad' puts a Pokémon at risk (see finish). */
export function answerBeat(run: RunState, rating: 'good' | 'neutral' | 'bad'): PlanRun {
  const s = rescueOf(run);
  const pr = s.active;
  if (!pr) throw new Error('No rescue plan is running');
  if (pr.plan === 'deal' || pr.plan === 'exchange') throw new Error(`${pr.plan} has no beats`);
  if (pr.beats.length >= BEATS[pr.plan].length) throw new Error('All beats are answered');
  pr.beats.push(rating);
  return pr;
}

export function answerComplication(run: RunState, answer: 'good' | 'poor'): PlanRun {
  const pr = rescueOf(run).active;
  if (!pr) throw new Error('No rescue plan is running');
  pr.complicationAnswer = answer;
  return pr;
}

/** The Exchange: three lines, each right or wrong. Two wrong lines turn it into a Loud Grab at the Cage with -0.10. */
export function exchangeLine(run: RunState, wrong: boolean): { done: boolean; fallback: boolean } {
  const pr = rescueOf(run).active;
  if (!pr || pr.plan !== 'exchange') throw new Error('No Exchange is running');
  if (wrong) pr.exchangeWrong += 1;
  pr.beats.push(wrong ? 'bad' : 'good');
  if (pr.exchangeWrong >= 2) {
    pr.plan = 'loud';
    pr.penalty = T.exchangePenalty;
    pr.beats = ['neutral', 'neutral'];
    return { done: false, fallback: true };
  }
  return { done: pr.beats.length >= 3, fallback: false };
}

const beatPoints = (pr: PlanRun): number => pr.beats.reduce((n, b) => n + (b === 'good' ? 1 : b === 'bad' ? -1 : 0), 0) + (pr.complicationAnswer === 'good' ? 1 : pr.complicationAnswer === 'poor' ? -1 : 0);

/** The readiness label for the running (or a prospective) plan. */
export function planReadiness(run: RunState, plan: 'quiet' | 'loud' | 'inside', ctx: RescueCtx, opts: { beats?: PlanRun['beats']; late?: boolean; penalty?: number; receiptShown?: boolean } = {}): Readiness {
  return readinessLabel(chanceFor(run, plan, ctx, opts));
}

function chanceFor(run: RunState, plan: 'quiet' | 'loud' | 'inside', ctx: RescueCtx, o: { beats?: PlanRun['beats']; late?: boolean; penalty?: number; receiptShown?: boolean; complicationAnswer?: 'good' | 'poor' | null }): number {
  const pts = (o.beats ?? []).reduce((n, b) => n + (b === 'good' ? 1 : b === 'bad' ? -1 : 0), 0) + (o.receiptShown ? 1 : 0) + (o.complicationAnswer === 'good' ? 1 : o.complicationAnswer === 'poor' ? -1 : 0);
  return successChance({ plan, attitude: attitudeOf(run, ctx.archetype), intel: ctx.intel, os: ctx.os, preferred: preferredPlan(ctx) === plan, beatPoints: pts, raidTriumph: !!ctx.raidTriumph, raidFailure: !!ctx.raidFailure, late: !!o.late, penalty: o.penalty, insiderGood: ctx.insiderGood });
}

/** The rival's attitude toward the player (-5..+5): feelings of the main rival plus what rescues have changed. */
export function attitudeOf(run: RunState, _archetype: Archetype, rivalId?: string): number {
  const s = rescueOf(run);
  let base = 0;
  const id = rivalId ?? Object.entries(run.expansion?.rival ?? {}).find(([, r]) => r.role === 'main')?.[0];
  const rec = id ? overhaulOf(run, id) : undefined;
  if (rec) base = Math.round((rec.feelings.friendship + rec.feelings.trust + rec.feelings.respect - 1.5 * rec.feelings.resentment - 5) / 2);
  return clamp(base + s.attitude, -5, 5);
}

// ---------- results ----------

export interface RescueOutcome {
  plan: PlanId;
  result: RescueResult;
  /** Pokémon uids returned to the party (or box when the party is full). */
  returned: string[];
  stillHeld: number;
  moneySpent: number;
  intelDelta: number;
  /** Operational Strength change for the team (Loud Grab Full: -1; an Exchange of a device is the caller's +1). */
  osDelta: number;
  heatDelta: number;
  /** Rival line stages to show, in order. */
  stages: string[];
  cellmate: { speciesId: string; level: number; shadow: boolean } | null;
}

const BIND = (teamId: string) => !RESCUE.noBinding.includes(teamId);

/** Moves held Pokémon back to the party (box when the party is full). Returns the uids. */
function restore(run: RunState, h: Hold, n: number, node: number, state: HoldState): string[] {
  const s = rescueOf(run);
  const back = h.pokemon.splice(0, n) as unknown as RunState['party'];
  const veiled = state === 'held-too-long' && BIND(h.teamId);
  for (const p of back) {
    if (run.party.length < 6) run.party.push(p);
    else run.box.push(p);
    s.returned.push({ uid: p.uid, teamId: h.teamId, state, until: node + T.assignedNodes, veiled, bondGain: 0 });
  }
  if (h.pokemon.length === 0) {
    h.accepted = null;
    log(s, `impound.returned:${h.id}`);
  }
  return back.map((p) => p.uid);
}

const isYellSite = (h: Hold) => h.teamId === 'yell';

/**
 * Finishes the running plan and applies the result. `wiped` is a wipe inside PS-RESCUE: it resolves as Fail (never ends the run).
 * Deal and Exchange have no roll. Team Yell always resolves as Full.
 */
export function finishPlan(run: RunState, ctx: RescueCtx, node: number, opts: { wiped?: boolean; payIntel?: boolean; receiptShown?: boolean } = {}): RescueOutcome {
  const s = rescueOf(run);
  const pr = s.active;
  if (!pr) throw new Error('No rescue plan is running');
  const h = holdOf(s, pr.holdId);
  const state = holdState(h, node);
  const out: RescueOutcome = { plan: pr.plan, result: 'fail', returned: [], stillHeld: 0, moneySpent: 0, intelDelta: 0, osDelta: 0, heatDelta: 0, stages: [], cellmate: null };
  const total = h.pokemon.length;

  if (pr.plan === 'deal' || (pr.plan === 'exchange' && pr.exchangeWrong < 2)) {
    if (pr.plan === 'deal') {
      const heirPays = ctx.archetype === 'heir' && !opts.wiped;
      const price = dealPrice(run.money, ctx, !!opts.payIntel);
      if (!heirPays) {
        if (price.money > run.money) throw new Error('The Deal cannot be paid');
        run.money = Math.max(0, run.money - price.money);
        out.moneySpent = price.money;
      }
      out.intelDelta = -(T.dealIntelCost + price.intel);
    }
    out.result = 'deal';
  } else if (isYellSite(h)) {
    out.result = 'full';
  } else if (opts.wiped) {
    out.result = 'fail';
  } else {
    const p = chanceFor(run, pr.plan as 'quiet' | 'loud' | 'inside', ctx, { beats: pr.beats, late: pr.late, penalty: pr.penalty, receiptShown: !!opts.receiptShown && h.receipt, complicationAnswer: pr.complicationAnswer });
    const r = roll(run, h.regionId, 'rescue-roll');
    out.result = r <= p ? 'full' : r <= Math.min(1, p + T.partialBand) ? 'partial' : 'fail';
  }

  // Heat (quiet: +10 on a bad/partial/fail; loud: +15 always; fail: +10). Applied to the evil state when it exists.
  let heat = 0;
  if (pr.plan === 'loud') heat += T.heat.loudAlways;
  if (pr.plan === 'quiet' && out.result !== 'full' && out.result !== 'deal') heat += T.heat.quietBad;
  if (out.result === 'fail') heat += T.heat.fail;
  if (pr.plan === 'loud' && out.result === 'full') out.osDelta = -1;
  out.heatDelta = heat;
  const ev = run.story?.evil;
  if (ev && heat) ev.heat = clamp(ev.heat + heat, 0, evilJson.config.heatMax);

  // Return the Pokémon.
  const give = out.result === 'full' || out.result === 'deal' ? total : out.result === 'partial' ? Math.min(total, Math.max(1, Math.ceil(total / 2))) : 0;
  const rst = holdState(h, node);
  out.returned = give ? restore(run, h, give, node, rst) : [];
  out.stillHeld = h.pokemon.length;
  if (out.result === 'full' || out.result === 'deal') for (const r of s.returned.filter((x) => out.returned.includes(x.uid))) r.bondGain = out.result === 'full' ? 1 : 0;
  if (out.result === 'partial') for (const r of s.returned.filter((x) => out.returned.includes(x.uid))) r.bondGain = 0;

  // Attitude, memory, rival feelings.
  const a = RESCUE.attitude[ctx.archetype];
  if (out.result === 'full') s.attitude = clamp(s.attitude + a.full, -5, 5);
  else if (out.result === 'partial') s.attitude = clamp(s.attitude + a.partial, -5, 5);
  else if (out.result === 'fail') s.attitude = clamp(s.attitude + a.fail, -5, 5);
  else s.attitude = clamp(s.attitude + (ctx.archetype === 'heir' && pr.plan === 'deal' ? 1 : 0), -5, 5);
  const mem = out.result === 'full' ? 'rescue-together' : out.result === 'partial' ? 'rescue-partial' : out.result === 'fail' ? 'rescue-failed' : null;
  if (mem && !s.memory.includes(mem)) s.memory.push(mem);
  if (pr.complication === 12 && pr.complicationAnswer === 'good' && !s.memory.includes('rescue-froze')) s.memory.push('rescue-froze');
  const mainId = Object.entries(run.expansion?.rival ?? {}).find(([, r]) => r.role === 'main')?.[0];
  const rec = mainId ? overhaulOf(run, mainId) : undefined;
  if (rec && out.result === 'full') changeFeelings(rec, 'keptPromise');

  // Cellmate on Full (20%).
  if (out.result === 'full' && roll(run, h.regionId, 'rescue-cellmate') < T.cellmateChance) out.cellmate = cellmateFor(run, h, avgLevel(run));
  out.stages = [out.result === 'deal' ? 'full' : out.result, ...(out.result === 'full' || out.result === 'deal' ? ['reunion'] : [])];
  if (out.result === 'fail' && h.declines < 2) out.stages.push('second-offer');
  if (h.pokemon.length === 0) h.accepted = null;
  else { h.accepted = null; h.frozenAt = null; h.lastDeclineNode = node; }
  s.active = null;
  s.flags['rescue.plan'] = pr.plan;
  s.flags['rescue.complication'] = String(pr.complication);
  log(s, `rescue.result:${h.id}:${pr.plan}:${out.result}`);
  return out;
}

const avgLevel = (run: RunState): number => Math.max(1, Math.round(run.party.reduce((n, p) => n + p.level, 0) / Math.max(1, run.party.length)));

/** A cellmate drawn from the holding team's Grunt pool (weakest first; never stronger than the current fights). Shadow only for Snag'em. */
export function cellmateFor(run: RunState, h: Hold, level: number): { speciesId: string; level: number; shadow: boolean } {
  const team = (evilJson.teams as { id: string; ranks: { grunt: { species: string[] } } }[]).find((t) => t.id === h.teamId);
  const pool = team?.ranks.grunt.species ?? RESCUE.gruntPools[h.teamId] ?? RESCUE.gruntPools['rocket-remnants']!;
  const i = Math.floor(roll(run, h.regionId, 'rescue-cellmate-species') * Math.min(2, pool.length));
  return { speciesId: pool[i]!, level, shadow: h.teamId === 'snagem' };
}

// ---------- the five-node aftermath ----------

export interface ActiveEffect {
  uid: string;
  teamId: string;
  state: HoldState;
  /** The summary-screen line. */
  summary: string;
  /** The team's mark (Processed or later) and Assigned effect (state assigned or held-too-long keeps the mark). */
  mark: string | null;
  effect: string | null;
}
/** What a returned Pokémon shows for the next five nodes (summary line, mark, minor Assigned effect). */
export function activeEffects(run: RunState, node: number): ActiveEffect[] {
  return rescueOf(run).returned.filter((r) => node <= r.until).map((r) => ({
    uid: r.uid, teamId: r.teamId, state: r.state, summary: RESCUE.summaryLines[r.state],
    mark: r.state === 'logged' ? null : RESCUE.effects[r.teamId]!.processed,
    effect: r.state === 'assigned' ? RESCUE.effects[r.teamId]!.assigned : null,
  }));
}
/** Drops entries whose five nodes are over. */
export function expireEffects(run: RunState, node: number): void {
  const s = rescueOf(run);
  s.returned = s.returned.filter((r) => node <= r.until);
}

// ---------- shortcuts, climax, the Pound ----------

export interface ShortcutCtx {
  trioRep?: number;
  trioFavors?: number;
  lookerEvidence?: boolean;
  wesHere?: boolean;
  /** uids of Pokémon that are already Shadow. */
  shadowUids?: string[];
}

/** Whether a shortcut can end this hold now. */
export function shortcutAvailable(run: RunState, h: Hold, kind: ShortcutId, c: ShortcutCtx): { ok: boolean; reason: string | null } {
  const s = rescueOf(run);
  if (kind === 'trio') return s.balloonUsed ? { ok: false, reason: 'The Balloon works once a run.' } : (c.trioRep ?? 0) >= 15 || (c.trioFavors ?? 0) >= 3 ? { ok: true, reason: null } : { ok: false, reason: 'The trio owe you nothing yet.' };
  if (kind === 'looker') return h.teamId === 'snagem' || h.teamId === 'yell' ? { ok: false, reason: 'A warrant cannot reach this team.' } : c.lookerEvidence ? { ok: true, reason: null } : { ok: false, reason: 'Looker has no evidence.' };
  return c.wesHere && (h.teamId === 'snagem' || h.heldAtClimax || h.declines >= 2) && h.pokemon.some((p) => c.shadowUids?.includes(String(p.uid))) ? { ok: true, reason: null } : { ok: false, reason: 'Nothing here is Shadow for Wes to take back.' };
}

/**
 * Uses a shortcut. The Balloon and the Snag-back return at once (the Balloon counts as Full); the Warrant returns after 3 nodes
 * (call `tickWarrant`). The rival's decline penalty is not applied: they were beaten to it.
 */
export function useShortcut(run: RunState, holdId: string, kind: ShortcutId, node: number, c: ShortcutCtx, archetype: Archetype): { uids: string[]; line: string | null; pending: boolean } {
  const s = rescueOf(run);
  const h = holdOf(s, holdId);
  const ok = shortcutAvailable(run, h, kind, c);
  if (!ok.ok) throw new Error(ok.reason ?? 'Not available');
  s.flags['rescue.shortcut'] = kind;
  if (!s.memory.includes('rescue-beaten-to-it')) s.memory.push('rescue-beaten-to-it');
  const line = RESCUE.beatenToIt[archetype];
  if (kind === 'looker') {
    h.warrantAt = node + T.warrantNodes;
    h.frozenAt = node;
    log(s, `rescue.accepted:${h.id}:warrant`);
    return { uids: [], line, pending: true };
  }
  if (kind === 'trio') s.balloonUsed = true;
  const state = holdState(h, node);
  let uids: string[];
  if (kind === 'wes') {
    // Only the Pokémon that are already Shadow come back; they stay Veiled.
    const keep = h.pokemon.filter((p) => !(c.shadowUids ?? []).includes(String(p.uid)));
    const take = h.pokemon.filter((p) => (c.shadowUids ?? []).includes(String(p.uid)));
    h.pokemon = take;
    uids = restore(run, h, take.length, node, 'held-too-long');
    h.pokemon = keep;
  } else uids = restore(run, h, h.pokemon.length, node, state);
  log(s, `rescue.result:${h.id}:${kind}:full`);
  return { uids, line, pending: false };
}

/** Delivers a Warrant whose three nodes have passed. */
export function tickWarrant(run: RunState, node: number): string[] {
  const s = rescueOf(run);
  const out: string[] = [];
  for (const h of s.holds) if (h.warrantAt !== null && node >= h.warrantAt && h.pokemon.length) {
    out.push(...restore(run, h, h.pokemon.length, node, holdState(h, node)));
    h.warrantAt = null;
    log(s, `rescue.result:${h.id}:looker:full`);
  }
  return out;
}

/** The climax begins with Pokémon still held: they are marked held-too-long. Returns whether the Pound appears. */
export function climaxBegins(run: RunState, o: { extendedCut: boolean; climaxEligible: boolean }): boolean {
  const s = rescueOf(run);
  const holds = s.holds.filter((h) => h.pokemon.length > 0);
  for (const h of holds) { h.heldAtClimax = true; h.accepted = null; h.frozenAt = null; }
  return holds.length > 0 && o.extendedCut && o.climaxEligible;
}

/** The Pound at the Breather: Held returns them at 50% HP (still Veiled where the team binds); Lost leaves them for victory. */
export function resolvePound(run: RunState, held: boolean, node: number, maxHpOf: (p: RunState['party'][number]) => number): string[] {
  const s = rescueOf(run);
  s.flags['rescue.pound'] = held ? 'held' : 'lost';
  if (!held) return [];
  if (!s.memory.includes('rescue-pound')) s.memory.push('rescue-pound');
  const uids: string[] = [];
  for (const h of s.holds.filter((x) => x.pokemon.length > 0)) {
    for (const p of h.pokemon as unknown as RunState['party']) p.hp = Math.max(1, Math.ceil(maxHpOf(p) * T.poundHpShare));
    uids.push(...restore(run, h, h.pokemon.length, node, 'held-too-long'));
  }
  return uids;
}

/** Climax victory returns everything still held (Veiled only under the held-too-long rule where the team binds). */
export function climaxVictory(run: RunState, node: number): { uids: string[]; veiled: string[] } {
  const s = rescueOf(run);
  const uids: string[] = [];
  const veiled: string[] = [];
  for (const h of s.holds.filter((x) => x.pokemon.length > 0)) {
    const tooLong = h.declines >= 2 || h.heldAtClimax;
    const back = restore(run, h, h.pokemon.length, node, tooLong ? 'held-too-long' : holdState(h, node));
    uids.push(...back);
    if (tooLong && BIND(h.teamId)) veiled.push(...back);
  }
  return { uids, veiled };
}

/** Climax defeat: the run ends elsewhere; the Doom Ledger records what was never returned. */
export function climaxDefeat(run: RunState): string[] {
  const s = rescueOf(run);
  const lost = s.holds.filter((h) => h.pokemon.length > 0).map((h) => `lost-with-impounded:${h.id}`);
  s.lost.push(...lost);
  return lost;
}

// ---------- lines ----------

/** One rival line with tags filled. Every archetype has every stage, so this never returns an empty string. */
export function rivalLine(archetype: Archetype, stage: string, tags: { player?: string; count?: number; mon?: string; team?: string; site?: string } = {}): string {
  const raw = RESCUE.lines[archetype][stage];
  if (!raw) throw new Error(`No rescue line ${archetype}/${stage}`);
  return raw.replace(/\{(player|count|mon|team|site)\}/g, (_m, k: keyof typeof tags) => String(tags[k] ?? ''));
}
