// Rival Rescue Plan screen content (Beta 0.6 R9). Pure view-models for the Rescue screen: the words, the options, the
// readiness label and the clock. Nothing here changes state or touches gameplay randomness (the choice order uses a
// private hashed shuffle, so previews never move any stream).

import { Rng, hashSeed } from '../rng';
import type { RunState } from '../state';
import {
  BEATS, RESCUE, holdState, nodesHeld, planOptions, planReadiness, preferredPlan, receiptText, rescueOf, rivalLine, siteOf,
  type Archetype, type Hold, type HoldState, type Offer, type PlanId, type Readiness, type RescueCtx, type RescueOutcome,
} from './rescue';

export interface PlanChoice {
  plan: PlanId;
  label: string;
  /** The rival's pitch for this plan. */
  pitch: string;
  available: boolean;
  reason: string | null;
  preferred: boolean;
  /** Risky / Even / Likely / Safe for plans with a roll; null for the Deal and the Exchange. Never a number. */
  readiness: Readiness | null;
}

export interface OfferView {
  holdId: string;
  kind: Offer['kind'];
  /** The rival's opening lines, in order (approach, offer; or climax-eve / second-offer). */
  lines: string[];
  site: string;
  jailer: string;
  receipt: string | null;
  clock: { state: HoldState; nodesHeld: number; label: string };
  /** The cage icon fill, 0..1 (full at 10 nodes). */
  cageFill: number;
  count: number;
  plans: PlanChoice[];
}

const PLAN_LABEL: Record<PlanId, string> = { quiet: 'Quiet Extraction', loud: 'Loud Grab', deal: 'The Deal', inside: 'The Inside Job', exchange: 'The Exchange' };
const PITCH_STAGE: Record<PlanId, string> = { quiet: 'pitch-quiet', loud: 'pitch-loud', deal: 'pitch-deal', inside: 'pitch-inside', exchange: 'pitch-exchange' };
const CLOCK_LABEL: Record<HoldState, string> = { logged: 'Logged', processed: 'Processed', assigned: 'Assigned', 'held-too-long': 'Held too long' };

const tagsFor = (run: RunState, h: Hold, playerName: string, monName: string) => ({ player: playerName, count: h.pokemon.length, mon: monName, team: siteOf(h.teamId).name, site: siteOf(h.teamId).site });

/** What the offer screen shows. */
export function offerView(run: RunState, offer: Offer, ctx: RescueCtx, node: number, names: { player: string; mon: string }): OfferView {
  const s = rescueOf(run);
  const h = s.holds.find((x) => x.id === offer.holdId)!;
  const a: Archetype = ctx.archetype;
  const tags = tagsFor(run, h, names.player, names.mon);
  const first = offer.kind === 'first' || offer.kind === 'late';
  const lines = first ? [rivalLine(a, 'approach', tags), rivalLine(a, 'offer', tags)] : [rivalLine(a, offer.kind === 'second' ? 'second-offer' : 'climax-eve', tags)];
  const st = holdState(h, node);
  const pref = preferredPlan(ctx);
  const plans = planOptions(ctx).map((o): PlanChoice => ({
    plan: o.plan, label: PLAN_LABEL[o.plan], pitch: rivalLine(a, PITCH_STAGE[o.plan], tags), available: o.available, reason: o.reason, preferred: o.plan === pref,
    readiness: o.available && (o.plan === 'quiet' || o.plan === 'loud' || o.plan === 'inside') ? planReadiness(run, o.plan, ctx, { late: h.late, receiptShown: h.receipt }) : null,
  }));
  return {
    holdId: h.id, kind: offer.kind, lines, site: siteOf(h.teamId).site, jailer: siteOf(h.teamId).jailer, receipt: receiptText(h), clock: { state: st, nodesHeld: nodesHeld(h, node), label: CLOCK_LABEL[st] },
    cageFill: Math.min(1, nodesHeld(h, node) / RESCUE.tuning.assignedAt), count: h.pokemon.length, plans,
  };
}

export interface BeatChoice {
  /** The answer to send back: answerBeat takes it as is; answerComplication takes 'good' or 'poor' (bad = poor). */
  rating: 'good' | 'neutral' | 'bad';
  text: string;
}
export interface BeatView {
  kind: 'beat' | 'complication';
  /** approach / door / cage, or the complication's name. */
  title: string;
  /** The rival's line: the hint (their preferred plan's good choice) or the complication line. */
  hint: string | null;
  /** What the player sees (complications). */
  scene: string | null;
  choices: BeatChoice[];
  /** 0-based position and total, e.g. beat 2 of 3. */
  index: number;
  total: number;
}

/** A fixed, per-run shuffle so the good answer is not always first. Presentation only. */
function shuffled<T>(run: RunState, key: string, list: T[]): T[] {
  const r = new Rng(hashSeed(`${run.seed}::rescue-view::${key}`));
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) { const j = r.int(0, i); [out[i], out[j]] = [out[j]!, out[i]!]; }
  return out;
}

/** The next question of the running plan: each beat in order, then the complication. Null when everything is answered. */
export function nextBeatView(run: RunState, ctx: RescueCtx): BeatView | null {
  const pr = rescueOf(run).active;
  if (!pr || pr.plan === 'deal' || pr.plan === 'exchange') return null;
  const beats = BEATS[pr.plan];
  const i = pr.beats.length;
  const a = ctx.archetype;
  if (i < beats.length) {
    const name = beats[i]!;
    const row = RESCUE.beats[pr.plan]![name]!;
    const hintKey = `hint-${name}`;
    return {
      kind: 'beat', title: name, hint: RESCUE.lines[a][hintKey] ?? null, scene: null, index: i, total: beats.length,
      choices: shuffled(run, `${pr.holdId}:${pr.plan}:${name}`, [{ rating: 'good' as const, text: row.good }, { rating: 'neutral' as const, text: row.neutral }, { rating: 'bad' as const, text: row.bad }]),
    };
  }
  if (pr.complicationAnswer === null) {
    const c = RESCUE.complications.find((x) => x.id === pr.complication)!;
    return {
      kind: 'complication', title: c.name, hint: c.id === 12 ? RESCUE.froze[a] : RESCUE.lines[a].complication!, scene: c.sees, index: beats.length, total: beats.length,
      choices: shuffled(run, `${pr.holdId}:c`, [{ rating: 'good' as const, text: c.good }, { rating: 'bad' as const, text: c.poor }]),
    };
  }
  return null;
}

/** One Exchange line (opening, middle, close) with its right and wrong answer, in a fixed shuffled order. */
export function exchangeView(run: RunState, step: 0 | 1 | 2): { title: string; choices: { wrong: boolean; text: string }[] } {
  const key = (['opening', 'middle', 'close'] as const)[step];
  const row = RESCUE.exchange[key]!;
  return { title: key, choices: shuffled(run, `ex:${key}`, [{ wrong: false, text: row.good }, { wrong: true, text: row.wrong }]) };
}

export interface ResultView {
  lines: string[];
  headline: string;
  returned: number;
  stillHeld: number;
  cellmate: RescueOutcome['cellmate'];
}

/** The result and reunion text for a finished plan. */
export function resultView(out: RescueOutcome, archetype: Archetype, names: { player: string; mon: string; site: string }): ResultView {
  const tags = { player: names.player, mon: names.mon, site: names.site, count: out.returned.length };
  return {
    headline: out.result === 'full' || out.result === 'deal' ? 'They are home.' : out.result === 'partial' ? 'Some of them are home.' : 'It did not work.',
    lines: out.stages.map((st) => rivalLine(archetype, st, tags)),
    returned: out.returned.length,
    stillHeld: out.stillHeld,
    cellmate: out.cellmate,
  };
}
