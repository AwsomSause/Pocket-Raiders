// Dispatch and the Evening (design Part 2 sections 3.2 and 3.4, Part 7, Part 30 sections 3.5, 5 and 6.4).
// Queueing checks a job can go; "Send them" fixes each job's odds; the Evening rolls each job once from the
// `evil-dispatch` stream, in queue order, then pays takings and wages. Pure: new blocks are returned.

import { hashSeed, Rng } from '../rng';
import { countsFor, fairPrice, payAmount, heldCount, holdingName, kindDef, localOf, methodsFor, settleTown, shiftMood, streetOf } from './board';
import { EVIL_DATA, type EvilData } from './data';
import { oddsFor, type JobDraft } from './odds';
import { cardFor, unknownCount } from './card';
import { appendLog, fill, lineFor, money, takingsAt } from './ledger';
import type { EvilModeBlock, Holding, Job, LogEntry, Sheet } from './schema';

/** The roll for the n-th number `evil-dispatch` gives out in this run: 1..100. The count is stored, so a reload rolls the same. */
export const dispatchRoll = (seed: string, n: number): number => new Rng(hashSeed(`${seed}::evil-dispatch::${n}`)).int(1, 100);

export { payAmount };

/** Funds already promised to Pay jobs in today's queue. */
export function promised(block: EvilModeBlock, data: EvilData = EVIL_DATA): number {
  return block.queue.filter((j) => j.method === 'pay').reduce((n, j) => n + payAmount(block.district!.holdings.find((h) => h.id === j.holdingId)!, j.offer, data), 0);
}

/** Why this person can't go today, or null. */
export function crewProblem(block: EvilModeBlock, id: string, ignoreHolding?: string): string | null {
  const c = block.crew.find((x) => x.id === id);
  if (!c) return 'Nobody by that name.';
  if (c.outOn === block.here.day) return `${c.name} is resting after yesterday's battle.`;
  if (block.queue.some((j) => j.holdingId !== ignoreHolding && j.squad.includes(id))) return `${c.name} is already going somewhere today.`;
  return null;
}

/** Why a job can't be queued, in plain words; null when it can. Checked by `step`, not only on screen. */
export function jobProblem(block: EvilModeBlock, job: JobDraft, data: EvilData = EVIL_DATA): string | null {
  const d = block.district;
  if (!d) return 'There is no district yet.';
  if (d.end) return "The district's over.";
  const h = d.holdings.find((x) => x.id === job.holdingId);
  if (!h) return 'Pick a holding.';
  const kind = kindDef(h.kind, data);
  if (!methodsFor(h, data).includes(job.method)) return kind.why ?? `Not by ${job.method} at ${kind.name.toLowerCase()}.`;
  if (h.owner === 'team' && job.method !== 'scout') return "It's already yours.";
  const local = localOf(h, data);
  if (local?.minor && job.method !== 'persuade' && job.method !== 'scout') return local.noPrice ?? 'Not with a child.';
  if (job.method === 'persuade' && h.mood === 'shut') return "Shut. They won't open the door.";
  if (job.method === 'pay') {
    if (h.mood === 'shut') return 'The door.';
    if (fairPrice(h, data) === null) return local?.noPrice ?? 'Nothing here has a price.';
    if (!data.district.methods.pay.offers.some((o) => o.pct === (job.offer ?? 100))) return 'Pick an offer.';
    const cost = payAmount(h, job.offer, data);
    const already = block.queue.find((j) => j.holdingId === h.id && j.method === 'pay');
    if (promised(block, data) - (already ? payAmount(h, already.offer, data) : 0) + cost > block.team.funds) return `Not enough Funds for ₽${cost.toLocaleString('en-GB')}.`;
  }
  const squad = job.squad;
  if (!squad.length) return 'Pick who goes.';
  if (new Set(squad).size !== squad.length) return 'Somebody is in the squad twice.';
  if (squad.length > data.district.rules.squadMax) return `${data.district.rules.squadMax} at most in a squad.`;
  if (job.method !== 'scout' && squad.length < 2) return 'One person can only scout.';
  for (const id of squad) {
    const p = crewProblem(block, id, h.id);
    if (p) return p;
  }
  return null;
}

/** Adds a job (or replaces the one on that holding). The odds are worked out now for the screen and fixed at Send. */
export function queueJob(block: EvilModeBlock, job: JobDraft, data: EvilData = EVIL_DATA): { block: EvilModeBlock; problem: string | null } {
  const problem = jobProblem(block, job, data);
  if (problem) return { block, problem };
  const o = oddsFor(block, job, data);
  // Slice 3: no job goes without its Honest Card. Confirming files the Card (kept with its day) and writes its twelfth
  // field into the Log as the line, character for character.
  const card = cardFor(block, job, data);
  const cardId = `C${block.cards.length + 1}`;
  const entry: Job = { holdingId: job.holdingId, method: job.method, squad: [...job.squad], ...(job.method === 'pay' ? { offer: job.offer ?? 100 } : {}), odds: null, certain: o.certain, terms: o.terms, cardId };
  const at = block.queue.findIndex((j) => j.holdingId === job.holdingId);
  let b: EvilModeBlock = block;
  if (at >= 0) b = calledOff(b, block.queue[at]!, data);
  const queue = at < 0 ? [...block.queue, entry] : block.queue.map((j, i) => (i === at ? entry : j));
  b = { ...b, queue, cards: [...b.cards, { ...card, id: cardId }] };
  const unknowns = unknownCount(card);
  b = appendLog(b, { kind: 'card', who: [...job.squad], to: job.holdingId, method: job.method, cardId, text: card.fields[11]!.text, ...(unknowns ? { unknowns } : {}) });
  return { block: b, problem: null };
}

/** A job taken off the queue: its Card stays in the Log, and a line under it says it was called off. */
function calledOff(block: EvilModeBlock, j: Job, data: EvilData): EvilModeBlock {
  if (!j.cardId) return block;
  return appendLog(block, { kind: 'job', who: [...j.squad], to: j.holdingId, method: j.method, cardId: j.cardId, result: 'called off', text: lineFor(block, [], data.ledger.written.calledOff) });
}

export function clearJob(block: EvilModeBlock, holdingId: string, data: EvilData = EVIL_DATA): EvilModeBlock {
  const j = block.queue.find((x) => x.holdingId === holdingId);
  if (!j) return block;
  return { ...calledOff(block, j, data), queue: block.queue.filter((x) => x.holdingId !== holdingId) };
}

/** "Send them": each job's odds and terms are fixed (design Part 30 section 3.5). No number is drawn. */
export function fixOdds(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  return { ...block, queue: block.queue.map((j) => { const o = oddsFor(block, j, data); return { ...j, odds: o.odds, certain: o.certain, terms: o.terms }; }) };
}

const voice = (method: string, won: boolean, step: number, data: EvilData): string => {
  const list = data.district.voices[`${method}.${won ? 'won' : 'lost'}`] ?? data.district.voices[`${method}.won`] ?? [''];
  return list[step % list.length]!;
};

/**
 * The Evening (design Part 2 section 3.4): each job rolls once, in queue order; then the Town, takings, wages and Heat.
 * Then the count: eleven held ends the district; the seventh day ends it either way. Applied once per day.
 */
export function resolveEvening(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  const d0 = block.district;
  if (!d0 || d0.end) return block;
  const day = block.here.day;
  const key = `evening:${d0.region}:${d0.n}:${day}`;
  if (block.applied.includes(key)) return block;
  const R = data.district.rules;
  let holdings = d0.holdings.map((h) => ({ ...h, tried: [...h.tried] }));
  let team = { ...block.team };
  let crew = block.crew.map((c) => ({ ...c }));
  let draws = block.draws['evil-dispatch'] ?? 0;
  const regardStreets = [...d0.regardStreets];
  const sheets: Sheet[] = [];
  const results: Omit<LogEntry, 'id' | 'day' | 'region' | 'district'>[] = [];
  const cap = (n: number) => Math.max(0, Math.min(10, n));
  let loudest: number | null = null;
  const set = (id: string, f: (h: Holding) => Holding) => { holdings = holdings.map((h) => (h.id === id ? f(h) : h)); };

  for (const j of block.queue) {
    const h = holdings.find((x) => x.id === j.holdingId);
    if (!h) continue;
    const odds = j.odds ?? oddsFor(block, j, data).odds;
    const roll = dispatchRoll(d0.seed, draws);
    draws += 1;
    const won = j.certain || roll <= odds;
    const name = holdingName({ ...h, scouted: Math.max(1, h.scouted) }, data);
    const lines: string[] = [];
    const m = data.district.methods;
    loudest = Math.max(loudest ?? -99, m[j.method].heat);
    if (j.method === 'scout') {
      set(h.id, (x) => ({ ...x, scouted: Math.min(2, x.scouted + 1) }));
      for (const n of holdings) if (n.id !== h.id && Math.abs(n.step - h.step) <= R.scoutReach && n.scouted === 0) set(n.id, (x) => ({ ...x, scouted: 1 }));
      lines.push(`Scouted step ${h.step}, and what touches it within ${R.scoutReach} steps.`);
    } else if (j.method === 'persuade') {
      if (won) {
        set(h.id, (x) => ({ ...x, owner: 'team', method: 'persuade', since: day, holds: true, mood: shiftMood(x.mood, 1), scouted: 2 }));
        lines.push('Persuaded. It holds.');
        const st = streetOf(h.step, data);
        if (!regardStreets.includes(st)) {
          regardStreets.push(st);
          team = { ...team, regard: cap(team.regard + m.persuade.regard) };
          lines.push(`Regard +${m.persuade.regard}: the first on ${data.district.streets[st]!.name}.`);
        }
      } else {
        set(h.id, (x) => ({ ...x, mood: shiftMood(x.mood, 1), scouted: 2, tried: x.tried.includes('persuade') ? x.tried : [...x.tried, 'persuade'] }));
        lines.push('Not persuaded. They were asked, and they liked that: one warmer.');
      }
    } else if (j.method === 'pay') {
      const offer = m.pay.offers.find((o) => o.pct === (j.offer ?? 100))!;
      const cost = payAmount(h, j.offer, data);
      if (won && cost <= team.funds) {
        team = { ...team, funds: team.funds - cost };
        set(h.id, (x) => ({ ...x, owner: 'team', method: 'pay', since: day, holds: offer.fair, mood: shiftMood(x.mood, offer.lowball ? -1 : offer.fair ? 1 : 0), scouted: Math.max(1, x.scouted) }));
        lines.push(`Bought for ₽${cost.toLocaleString('en-GB')}. ${offer.fair ? 'It holds.' : 'Under their price: it would turn.'}`);
      } else {
        if (offer.lowball) set(h.id, (x) => ({ ...x, mood: shiftMood(x.mood, -1) }));
        lines.push(won ? 'The money was short on the day. Nothing changed hands.' : `Refused. ${offer.lowball ? 'A lowball: one colder.' : 'No money spent.'}`);
      }
    } else {
      if (won) {
        set(h.id, (x) => ({ ...x, owner: 'team', method: 'outplay', since: day, holds: true, mood: shiftMood(x.mood, 1), scouted: Math.max(1, x.scouted) }));
        team = { ...team, regard: cap(team.regard + m.outplay.regard) };
        lines.push(`Won fairly. It holds. Regard +${m.outplay.regard}.${countsFor({ ...h, owner: 'team', method: 'outplay' }, team.creed) === 2 ? ' Under Power it counts double.' : ''}`);
      } else {
        set(h.id, (x) => ({ ...x, mood: shiftMood(x.mood, 1), tried: x.tried.includes('outplay') ? x.tried : [...x.tried, 'outplay'] }));
        crew = crew.map((c) => (j.squad.includes(c.id) ? { ...c, outOn: day + 1 } : c));
        lines.push('Lost. The squad rests tomorrow. A rematch is open.');
      }
    }
    sheets.push({ holdingId: h.id, method: j.method, squad: [...j.squad], odds, certain: j.certain, roll, won, voice: voice(j.method, won, h.step, data), lines });
    // The Card's line gets its mark: it went, or it didn't (a Pay short of money on the day didn't go either).
    const went = won && !(j.method === 'pay' && lines[0]?.startsWith('The money was short'));
    if (j.cardId) results.push({ kind: 'job', who: [...j.squad], to: h.id, method: j.method, cardId: j.cardId, result: went ? 'went' : 'didnt', text: `Day ${day}. ${went ? data.ledger.written.went : data.ledger.written.didnt}` });
  }

  let district = settleTown({ ...d0, holdings, regardStreets }, day, data);
  const evening: string[] = [];
  const income = district.holdings.reduce((n, h) => n + takingsAt(h, block.rates, data), 0);
  const wages = team.creed === 'belonging' ? Math.max(0, Math.floor(income / 2)) : crew.length * (team.creed === 'cause' ? R.wageCause : R.wage);
  const before = team.funds;
  team = { ...team, funds: Math.max(0, team.funds + income - wages) };
  evening.push(`Takings ₽${income.toLocaleString('en-GB')}.`);
  evening.push(team.creed === 'belonging' ? `Shares ₽${wages.toLocaleString('en-GB')}: half of today, split.` : `Wages ₽${wages.toLocaleString('en-GB')} for ${crew.length}.`);
  if (before + income - wages < 0) evening.push(`Short ₽${(wages - before - income).toLocaleString('en-GB')}: they were paid what there was.`);
  if (loudest !== null) {
    const h0 = team.heat;
    team = { ...team, heat: cap(team.heat + loudest) };
    evening.push(`Heat ${loudest >= 0 ? '+' : ''}${loudest}: the day's loudest job.${team.heat === h0 ? ' (No change.)' : ''}`);
  }
  let out: EvilModeBlock = { ...block, team, crew, district, queue: [], sheets, evening, draws: { ...block.draws, 'evil-dispatch': draws }, applied: [...block.applied, key] };
  for (const e of results) out = appendLog(out, e);
  // Wages paid: one to Given a head (Part 23 section 8.2), only when they were paid in full.
  if (wages > 0) {
    const full = before + income - wages >= 0;
    const W = data.ledger.written;
    const heads = `${crew.length}`;
    const text = fill(!full ? W.short : team.creed === 'belonging' ? W.shares : W.wages, { amount: money(full ? wages : Math.max(0, before + income)), heads });
    out = appendLog(out, { kind: 'pay', who: crew.map((c) => c.id), text: `Day ${day}. ${text}`, ...(full ? { given: crew.length * data.ledger.count.wageHead } : {}) });
  }
  const count = heldCount(out);
  if (count >= R.toHold) district = { ...district, end: { how: 'held', day, count } };
  else if (day >= R.days) district = { ...district, end: { how: 'taken', day, count } };
  if (district.end) evening.push(data.district.ends[district.end.how]);
  return { ...out, district, evening };
}
