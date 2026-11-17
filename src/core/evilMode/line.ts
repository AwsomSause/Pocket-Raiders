// The Line (design Part 3 section 7, Part 5 sections 4 and 6, Part 7 sections 6, 7, 9 and 11, Part 9 section 10).
// What each stop allows; Lean, Take and Expose's odds terms and Heat; the Heat ladder and Dread's words; proof for an
// Expose; moving the Line once a region; the team's real Line; and the `evil-line` stream. Pure: new blocks are returned.

import { hashSeed, Rng } from '../rng';
import { localOf, streetOf } from './board';
import { EVIL_DATA, type EvilData } from './data';
import { appendLog, crewNames, fill, lineFor } from './ledger';
import { inRoster, moveLoyalty } from './people';
import { lineIndex } from './start';
import { type Crew, type EvilModeBlock, type Holding, type JobMethod, type LineId, type OddsTerm, type TakeThing } from './schema';

/** The n-th number `evil-line` gives out in this run, 1..max. The count is stored, so a reload draws the same. */
export const lineRoll = (seed: string, n: number, max: number): number => new Rng(hashSeed(`${seed}::evil-line::${n}`)).int(1, max);

/** Whether the team's Line allows a method (methods.json `minLine`). Checked in `step`, not only on screen. */
export function lineAllows(block: EvilModeBlock, method: JobMethod, data: EvilData = EVIL_DATA): boolean {
  const m = data.methods.find((x) => x.id === method);
  return !!m && lineIndex(block.team.line) >= lineIndex(m.minLine);
}

export const lineName = (id: LineId, data: EvilData = EVIL_DATA): string => data.founding.lines.find((l) => l.id === id)!.name;

/** Where a refused method's "why" comes from: the Line, by name. */
export const lineWhy = (block: EvilModeBlock, data: EvilData = EVIL_DATA): string => `Not on a ${lineName(block.team.line, data)} team.`;

// ---- Heat (Part 5 section 4) ----

/** What a job adds to the day's loudest, once its result is known (Part 5 section 4.1). Not a sum: the Evening takes the largest. */
export function heatFor(method: JobMethod, won: boolean, handsLed: boolean, data: EvilData = EVIL_DATA): number {
  const L = data.line;
  if (method === 'lean') return won ? L.lean.heat : L.lean.failHeat;
  // A failed Take with Hands leading leaves nothing behind: nothing loud.
  if (method === 'take') return won ? L.take.heat : handsLed ? data.district.methods.scout.heat : L.take.failHeat;
  if (method === 'expose') return L.expose.heat;
  return data.district.methods[method].heat;
}

/** The Card's and the forecast's figure: what the job adds if it goes. */
export const heatIfSent = (method: JobMethod, data: EvilData = EVIL_DATA): number => heatFor(method, true, false, data);

/** The ladder's word and what the law's doing at a Heat (Part 5 section 4.3). */
export function heatStep(heat: number, data: EvilData = EVIL_DATA): { word: string; doing: string } {
  const l = [...data.line.heat.ladder].reverse().find((x) => heat >= x.min) ?? data.line.heat.ladder[0]!;
  return { word: l.word, doing: l.doing };
}

export const dreadWord = (dread: number, data: EvilData = EVIL_DATA): string => ([...data.line.dread.words].reverse().find((x) => dread >= x.min) ?? data.line.dread.words[0]!).word;

/**
 * Dispatch's forecast (Part 5 section 4.2): "Heat tonight: 5 → 7 (the warehouse). At this pace: a Raid in three days."
 * The queue's loudest job, if every job goes; nothing queued is "nothing loud".
 */
export function heatForecast(block: EvilModeBlock, data: EvilData = EVIL_DATA): string {
  const h0 = block.team.heat;
  let loud = data.district.methods.scout.heat;
  let what = 'nothing loud';
  for (const j of block.queue) {
    const v = heatIfSent(j.method, data);
    if (v > loud) {
      loud = v;
      const h = block.district?.holdings.find((x) => x.id === j.holdingId);
      what = `${data.methods.find((m) => m.id === j.method)!.name}, step ${h?.step ?? '?'}`;
    }
  }
  const h1 = Math.max(0, Math.min(10, h0 + loud));
  const pace = loud > 0 && h1 < 10 ? ` At this pace: a Raid in ${Math.ceil((10 - h1) / loud)} day${Math.ceil((10 - h1) / loud) === 1 ? '' : 's'}.` : h1 >= 10 ? ' The lamps are all lit.' : '';
  return `Heat tonight: ${h0} → ${h1} (${what}).${pace}`;
}

/** Checkpoints (Heat 7+): every job but a scout at −20%, unless Wheels leads (Part 5 section 4.3). */
export function lawTerms(block: EvilModeBlock, job: { method: JobMethod; squad: readonly string[] }, data: EvilData = EVIL_DATA): OddsTerm[] {
  if (job.method === 'scout' || block.team.heat < data.line.heat.checkpoints) return [];
  const lead = block.crew.find((c) => c.id === job.squad[0]);
  if (lead?.talent === 'wheels') return [];
  return [{ label: `Checkpoints: Heat ${block.team.heat}`, value: data.line.terms.checkpoint }];
}

// ---- Lean, Take and Expose (Part 7 sections 6, 7 and 9) ----

/** The odds terms after the base for the three new methods (Part 7 section 2.3). */
export function darkTerms(block: EvilModeBlock, h: Holding, method: 'lean' | 'take' | 'expose', squad: readonly string[], data: EvilData = EVIL_DATA): OddsTerm[] {
  const T = data.line.terms;
  const t = block.team;
  const terms: OddsTerm[] = [];
  const l = localOf(h, data);
  if (method === 'lean') {
    if (h.scouted >= 2 && l) terms.push({ label: `Their fear, known: ${l.fear.toLowerCase()}`, value: T.fearKnown });
    if (t.dread >= data.line.dread.comeOver) terms.push({ label: `Dread ${t.dread}`, value: T.leanDreadHigh });
    else if (t.dread >= 4) terms.push({ label: `Dread ${t.dread}: they've heard`, value: T.leanDread });
    if (t.regard >= 6) terms.push({ label: `Regard ${t.regard}: they don't believe it of you`, value: T.leanRegardHigh });
    if (l?.hard) terms.push({ label: 'Not easily frightened', value: T.leanHard });
    if (block.hero && Math.abs(block.hero.at - h.step) <= T.heroNearSteps) terms.push({ label: 'The kid is close: someone to tell', value: T.heroNear });
  }
  if (method === 'expose') {
    if (t.regard >= 4) terms.push({ label: `Regard ${t.regard}: people believe you`, value: T.exposeRegard });
    if (t.dread >= 4) terms.push({ label: `Dread ${t.dread}: they believe it, and don't say so`, value: T.exposeDread });
  }
  if (h.scouted > 0) terms.push({ label: 'Scouted: you know the ground', value: data.district.terms.scouted });
  if (squad.length === 2) terms.push({ label: 'The squad is short: two people', value: data.district.terms.short });
  return terms;
}

/** Why a Take of this thing can't be done here, or null. */
export function thingProblem(h: Holding, thing: TakeThing | undefined, data: EvilData = EVIL_DATA): string | null {
  const l = localOf(h, data);
  if (!l) return 'Nothing here to take.';
  if (!thing) return 'Pick what to take.';
  if (thing === 'stock' && l.take <= 0) return 'There is no stock worth taking.';
  if (thing === 'deed' && (l.earns <= 0 || l.noPrice)) return l.noPrice ?? 'There is no deed to take.';
  if (thing === 'ledger' && l.earns <= 0 && !l.secret) return 'There is no ledger.';
  return null;
}

/** The proof for an Expose about this local: their own ledger, taken; or a Warm local the team holds on their street, who was there. */
export function proofFor(block: EvilModeBlock, h: Holding, data: EvilData = EVIL_DATA): { how: 'ledger' | 'witness'; who?: string } | null {
  if (block.proof.includes(h.id)) return { how: 'ledger' };
  const d = block.district;
  if (!d || h.scouted < 2) return null;
  const st = streetOf(h.step, data);
  const w = d.holdings.find((x) => x.id !== h.id && x.kind === 'local' && x.owner === 'team' && x.mood === 'warm' && streetOf(x.step, data) === st);
  return w ? { how: 'witness', who: localOf(w, data)!.who } : null;
}

/** Why an Expose can't be built here, or null. */
export function exposeProblem(block: EvilModeBlock, h: Holding, data: EvilData = EVIL_DATA): string | null {
  const l = localOf(h, data);
  if (!l?.secret) return data.line.proof.nothing!;
  if (!proofFor(block, h, data)) return data.line.proof.need!;
  return null;
}

// ---- Moving the Line (Part 3 section 7.1) ----

export interface LineMovePreview {
  to: LineId;
  darker: boolean;
  problem: string | null;
  /** Who it costs, by name, with what each will do. */
  who: { id: string; name: string; will: string }[];
  text: string;
}

/** Hard cases (Part 3 section 7.1): people whose talent fits a method the new stop forbids. They were hired for the old Line. */
const hardCase = (c: Crew, to: LineId, data: EvilData): boolean => {
  if (!c.talent) return false;
  const fits = data.people.talents.find((t) => t.id === c.talent)!.fits;
  return fits.some((m) => {
    const def = data.methods.find((x) => x.id === m)!;
    return lineIndex(to) < lineIndex(def.minLine);
  });
};

/** What moving the Line to `to` would do, shown before it's confirmed. */
export function linePreview(block: EvilModeBlock, to: LineId, data: EvilData = EVIL_DATA): LineMovePreview {
  const M = data.line.move;
  const from = block.team.line;
  const darker = lineIndex(to) > lineIndex(from);
  let problem: string | null = null;
  if (to === from) problem = M.same!;
  else if (block.team.lineMovedInRegion.includes(block.here.region)) problem = M.once!;
  else if (block.here.beat !== 'night') problem = M.notNight!;
  const who: LineMovePreview['who'] = [];
  if (to !== from && darker && to === 'whatever') for (const c of inRoster(block)) if (c.talent === 'heart') who.push({ id: c.id, name: c.name, will: 'leaves within three days' });
  if (to !== from && !darker) for (const c of inRoster(block)) if (hardCase(c, to, data)) who.push({ id: c.id, name: c.name, will: c.loyalty < 5 ? 'leaves' : 'stays, and watches' });
  const text = to === from ? M.same! : `${darker ? M.darker : M.lighter} ${who.length ? who.map((w) => `${w.name} ${w.will}.`).join(' ') : M.nobody}`;
  return { to, darker, problem, who, text };
}

/** Moves the Line (once a region, at Night). Darker is free; lighter costs the hard cases. Logged. */
export function moveLine(block: EvilModeBlock, to: LineId, data: EvilData = EVIL_DATA): { block: EvilModeBlock; problem: string | null; line: string } {
  const p = linePreview(block, to, data);
  if (p.problem) return { block, problem: p.problem, line: '' };
  const from = block.team.line;
  const L = data.line;
  let b: EvilModeBlock = { ...block, team: { ...block.team, line: to, lineMovedInRegion: [...block.team.lineMovedInRegion, block.here.region] }, lineMove: { day: block.here.day, region: block.here.region, from, to } };
  b = appendLog(b, { kind: 'line', who: [], text: lineFor(b, [], fill(L.move.written!, { from: lineName(from, data), to: lineName(to, data) })) });
  const lines = [fill(L.move.written!, { from: lineName(from, data), to: lineName(to, data) })];
  if (p.darker && p.who.length) lines.push(fill(L.move.hearts!, { names: p.who.map((w) => w.name).join(' and ') }));
  if (!p.darker) {
    const day = block.here.day;
    for (const w of p.who) {
      const c = b.crew.find((x) => x.id === w.id)!;
      if (c.loyalty < 5) {
        b = { ...b, crew: b.crew.map((x) => (x.id === c.id ? { ...x, where: 'left' as const, left: { day, how: 'lineMoved' as const } } : x)) };
        b = appendLog(b, { kind: 'leave', who: [c.id], text: lineFor(b, [c.id], L.leave.lineMovedLight!) });
        lines.push(`${c.name} ${L.leave.lineMovedLight}`);
      } else {
        b = { ...b, crew: b.crew.map((x) => (x.id === c.id ? moveLoyalty(x, -1, data) : x)) };
        lines.push(`${c.name} ${L.leave.lineMovedStay}`);
      }
    }
  }
  return { block: b, problem: null, line: lines.join(' ') };
}

/**
 * A move to Whatever it takes: every Heart goes within three days, together, by the front, at breakfast (Part 9 section
 * 10, way 3). Run at each Morning; applies once. A Line moved back before then keeps them.
 */
export function heartsGo(block: EvilModeBlock, data: EvilData = EVIL_DATA): { block: EvilModeBlock; notes: string[] } {
  const m = block.lineMove;
  if (!m || m.to !== 'whatever' || block.team.line !== 'whatever' || m.region !== block.here.region || block.here.day < m.day + 2) return { block, notes: [] };
  const key = `hearts:${m.region}:${m.day}`;
  if (block.applied.includes(key)) return { block, notes: [] };
  const go = inRoster(block).filter((c) => c.talent === 'heart');
  let b: EvilModeBlock = { ...block, applied: [...block.applied, key] };
  if (!go.length) return { block: b, notes: [] };
  const ids = go.map((c) => c.id);
  b = { ...b, crew: b.crew.map((c) => (ids.includes(c.id) ? { ...c, where: 'left' as const, left: { day: block.here.day, how: 'lineMoved' as const } } : c)) };
  b = appendLog(b, { kind: 'leave', who: ids, text: lineFor(b, ids, data.line.leave.lineMoved!) });
  return { block: b, notes: [`${crewNames(b, ids)} ${data.line.leave.lineMoved}`] };
}

/**
 * Way 4 (Part 9 section 10, Part 7 section 12): a posted person beaten by the kid, at Loyalty under 5, may go with the
 * Hero: one in three, two in three if their flaw's Doubts or Kind. One number from `evil-line`, drawn only when it can happen.
 */
export function goWithHero(block: EvilModeBlock, personId: string | undefined, data: EvilData = EVIL_DATA): { block: EvilModeBlock; line: string | null } {
  const c = block.crew.find((x) => x.id === personId);
  if (!c || c.where !== 'in' || c.loyalty >= 5 || !block.district) return { block, line: null };
  const n = block.draws['evil-line'] ?? 0;
  const roll = lineRoll(block.district.seed, n, 3);
  let b: EvilModeBlock = { ...block, draws: { ...block.draws, 'evil-line': n + 1 } };
  if (roll > (c.flaw === 'doubts' || c.flaw === 'kind' ? 2 : 1)) return { block: b, line: null };
  b = { ...b, crew: b.crew.map((x) => (x.id === c.id ? { ...x, where: 'left' as const, left: { day: block.here.day, how: 'hero' as const } } : x)) };
  b = appendLog(b, { kind: 'leave', who: [c.id], text: lineFor(b, [c.id], data.line.leave.hero!) });
  return { block: b, line: `${c.name} ${data.line.leave.hero}` };
}

// ---- The team's real Line (Part 3 section 7.2, Part 7 section 11.3) ----

/** What the Roster, as it stands, won't do, whatever the Line says: a method nobody (or too few) will go on, and no Heart left. */
export function realLine(block: EvilModeBlock, data: EvilData = EVIL_DATA): string[] {
  const W = data.line.wont;
  const out: string[] = [];
  const ins = inRoster(block).filter((c) => !c.minor);
  for (const [method, need] of [['lean', data.line.lean.squad], ['take', 2]] as const) {
    if (!lineAllows(block, method, data)) continue;
    const will = ins.filter((c) => c.line === null || !data.people.lines.find((l) => l.n === c.line)!.tags.includes(method));
    if (will.length < need) out.push(fill(W.method, { verb: W.verbs[method]! }));
  }
  const hadHeart = block.crew.some((c) => c.talent === 'heart');
  if (hadHeart && !ins.some((c) => c.talent === 'heart')) out.push(W.noHeart);
  return out;
}
