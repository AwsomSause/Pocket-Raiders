// Dispatch and the Evening (design Part 2 sections 3.2 and 3.4, Part 7, Part 30 sections 3.5, 5 and 6.4).
// Queueing checks a job can go; "Send them" fixes each job's odds; the Evening rolls each job once from the
// `evil-dispatch` stream, in queue order, then pays takings and wages. Pure: new blocks are returned.

import { hashSeed, Rng } from '../rng';
import { countsFor, fairPrice, payAmount, heldCount, holdingName, kindDef, localOf, methodsFor, settleTown, shiftMood, streetName, streetOf } from './board';
import { EVIL_DATA, type EvilData } from './data';
import { oddsFor, type JobDraft } from './odds';
import { cardFor, unknownCount } from './card';
import { appendLog, fill, lineFor, money, takingsAt } from './ledger';
import { schemeBusy } from './scheme';
import { econDistrictEnd, econEvening, econOn, shortLoyalty, tradeProblem } from './economy';
import type { Crew, EvilModeBlock, Holding, Job, LogEntry, Sheet } from './schema';
import { crossers, districtKey, inRoster, moveLoyalty, peopleText, talentDef, wageOf } from './people';
import { gymHeatToday, inChair } from './gym';
import { exposeProblem, heatFor, lineAllows, lineRoll, lineWhy, thingProblem } from './line';
import { allows, modify } from './regionRule';
import { dayIn, drift, pastTakings, stageKind } from './region';

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
  if (c.where !== 'in') return fill(peopleText('left'), { name: c.name });
  if (c.outOn === block.here.day) return `${c.name} is resting after yesterday's battle.`;
  if (block.queue.some((j) => j.holdingId !== ignoreHolding && j.squad.includes(id))) return `${c.name} is already going somewhere today.`;
  if (block.posted.some((p) => p.id === id)) return `${c.name} is posted somewhere today.`;
  if (inChair(block, id)) return `${c.name} holds the Gym's chair.`;
  return tradeProblem(block, id) ?? schemeBusy(block, id);
}

/** Why a job can't be queued, in plain words; null when it can. Checked by `step`, not only on screen. */
export function jobProblem(block: EvilModeBlock, job: JobDraft, data: EvilData = EVIL_DATA): string | null {
  const d = block.district;
  if (!d) return 'There is no district yet.';
  if (d.end) return "The district's over.";
  const h = d.holdings.find((x) => x.id === job.holdingId);
  if (!h) return 'Pick a holding.';
  const kind = kindDef(h.kind, data);
  // Slice 6: the Line. A method darker than the team's Line is refused here, whatever the screen shows.
  if (!lineAllows(block, job.method, data)) return lineWhy(block, data);
  // Slice 9: the region's doors (the first Arrival: Persuade, Pay, Outplay and scouting only). Refused here too.
  const door = allows(block, job.method, data);
  if (!door.ok) return door.why ?? `Shut by ${door.shutBy}.`;
  if (!methodsFor(h, data).includes(job.method)) return kind.why ?? `Not by ${job.method} at ${kind.name.toLowerCase()}.`;
  if (h.owner === 'team' && job.method !== 'scout') return "It's already yours.";
  const local = localOf(h, data);
  // Slice 9: a canon face's locks (Mr. Fuji can't be Leaned on or Taken from) and the tower's stair rule (Part 26a 2.3).
  if (local?.locks?.includes(job.method as never)) return local.lockWhy ?? 'Not them.';
  if (h.kind === 'floor' && job.method !== 'scout' && (h.floor ?? 1) > 1) {
    const below = d.holdings.find((x) => x.kind === 'floor' && x.floor === (h.floor ?? 1) - 1);
    if (below && below.owner !== 'team' && below.mood !== 'warm') return `Floors are held from the bottom: ${below.ref} first, or its tenant Warm.`;
  }
  const limit = squadLimit(block, data);
  if (!block.queue.some((j) => j.holdingId === h.id) && block.queue.length >= limit) return limit === 1 ? data.region.arrival.squadsWhy : `${limit} squads at most today.`;
  if (local?.minor && job.method !== 'persuade' && job.method !== 'scout') return local.noPrice ?? 'Not with a child.';
  if (job.method === 'persuade' && h.mood === 'shut') return "Shut. They won't open the door.";
  if (job.method === 'take') {
    const p = thingProblem(h, job.thing, data);
    if (p) return p;
  }
  if (job.method === 'expose') {
    const p = exposeProblem(block, h, data);
    if (p) return p;
  }
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
  if (job.method === 'lean' && squad.length < data.line.lean.squad) return `A Lean needs a squad of ${data.line.lean.squad}.`;
  for (const id of squad) {
    const p = crewProblem(block, id, h.id);
    if (p) return p;
    // A minor goes scouting and nowhere else: no job with Heat, whatever the Line (Part 10a section 2.1). Checked in `step`.
    const c = block.crew.find((x) => x.id === id)!;
    if (c.minor && job.method !== 'scout') return fill(peopleText('minor'), { name: c.name, age: c.age ?? '' });
    // Warrants (Heat 8+): a face the law knows can't be sent (Part 5 section 4.3).
    if (c.known && block.team.heat >= data.line.heat.warrants) return `${c.name}'s face is known. There's a warrant out.`;
  }
  return null;
}

/** Why a job can't simply be confirmed: somebody on the squad has a line it crosses. They can be asked anyway. */
export function lineProblem(block: EvilModeBlock, job: JobDraft, data: EvilData = EVIL_DATA): string | null {
  const who = crossers(block, job, data);
  return who.length ? `${who.map((p) => p.name).join(', ')} won't. Ask anyway, or send someone else.` : null;
}

/** Adds a job (or replaces the one on that holding). The odds are worked out now for the screen and fixed at Send. */
export function queueJob(block: EvilModeBlock, job: JobDraft, data: EvilData = EVIL_DATA): { block: EvilModeBlock; problem: string | null } {
  const problem = jobProblem(block, job, data) ?? lineProblem(block, job, data);
  if (problem) return { block, problem };
  return fileJob(block, job, data);
}

/** Files the Card and queues the job (or replaces the one on that holding). Checks are the caller's. */
function fileJob(block: EvilModeBlock, job: JobDraft, data: EvilData): { block: EvilModeBlock; problem: string | null } {
  const o = oddsFor(block, job, data);
  // Slice 3: no job goes without its Honest Card. Confirming files the Card (kept with its day) and writes its twelfth
  // field into the Log as the line, character for character.
  const card = cardFor(block, job, data);
  const cardId = `C${block.cards.length + 1}`;
  const entry: Job = { holdingId: job.holdingId, method: job.method, squad: [...job.squad], ...(job.method === 'pay' ? { offer: job.offer ?? 100 } : {}), ...(job.method === 'take' && job.thing ? { thing: job.thing } : {}), odds: null, certain: o.certain, terms: o.terms, cardId };
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
  let crew: Crew[] = block.crew.map((c) => ({ ...c }));
  const P = data.people.rules;
  const dkey = districtKey(block);
  const lead = (j: Job) => crew.find((c) => c.id === j.squad[0]);
  let draws = block.draws['evil-dispatch'] ?? 0;
  const regardStreets = [...d0.regardStreets];
  const sheets: Sheet[] = [];
  const results: Omit<LogEntry, 'id' | 'day' | 'region' | 'district'>[] = [];
  const cap = (n: number) => Math.max(0, Math.min(10, n));
  let loudest: number | null = null;
  let proof = [...block.proof];
  let lineDraws = block.draws['evil-line'] ?? 0;
  const set = (id: string, f: (h: Holding) => Holding) => { holdings = holdings.map((h) => (h.id === id ? f(h) : h)); };

  for (const j of block.queue) {
    const h = holdings.find((x) => x.id === j.holdingId);
    if (!h) continue;
    const odds = j.odds ?? oddsFor(block, j, data).odds;
    // Slice 5: a job the Boss played in person isn't rolled (and takes no number from the stream).
    const roll = j.played ? (j.played === 'won' ? 1 : 100) : dispatchRoll(d0.seed, draws);
    if (!j.played) draws += 1;
    const won = j.played ? j.played === 'won' : j.certain || roll <= odds;
    const name = holdingName({ ...h, scouted: Math.max(1, h.scouted) }, data);
    const lines: string[] = [];
    const m = data.district.methods;
    // Heat by the day's loudest job, not the sum (Part 5 section 4.1); what a job adds depends on how it went.
    // Slice 9: the region's rule may add to a job's Heat (Kanto: a Take from a deeded holding, +1), only when it went.
    const baseHeat = heatFor(j.method, won, lead(j)?.talent === 'hands', data);
    loudest = Math.max(loudest ?? -99, won ? modify(block, 'heat', { method: j.method, tags: h.tags }, baseHeat, data) : baseHeat);
    let takenBy = 0;
    if (j.method === 'scout') {
      set(h.id, (x) => ({ ...x, scouted: Math.min(2, x.scouted + 1) }));
      // Eyes leading: two steps deeper (Part 7 section 2.4).
      const reach = modify(block, 'scoutReach', {}, R.scoutReach, data) + (lead(j)?.talent === 'eyes' ? P.odds.eyesReach : 0);
      for (const n of holdings) if (n.id !== h.id && Math.abs(n.step - h.step) <= reach && n.scouted === 0) set(n.id, (x) => ({ ...x, scouted: 1 }));
      lines.push(`Scouted step ${h.step}, and what touches it within ${reach} steps.`);
    } else if (j.method === 'persuade') {
      if (won) {
        set(h.id, (x) => ({ ...x, owner: 'team', method: 'persuade', since: day, holds: true, mood: shiftMood(x.mood, 1), scouted: 2 }));
        lines.push('Persuaded. It holds.');
        const st = streetOf(h.step, data);
        if (!regardStreets.includes(st)) {
          regardStreets.push(st);
          team = { ...team, regard: cap(team.regard + m.persuade.regard) };
          lines.push(`Regard +${m.persuade.regard}: the first on ${streetName(d0, st, data)}.`);
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
    } else if (j.method === 'lean' || j.method === 'take' || j.method === 'expose') {
      const r = darkResult(j, h, won, { holdings, team, crew, proof, lineDraws, seed: d0.seed, day }, data);
      ({ holdings, team, crew, proof, lineDraws } = r);
      lines.push(...r.lines);
      takenBy = r.taken;
    } else {
      if (won) {
        set(h.id, (x) => ({ ...x, owner: 'team', method: 'outplay', since: day, holds: true, mood: shiftMood(x.mood, 1), scouted: Math.max(1, x.scouted) }));
        team = { ...team, regard: cap(team.regard + m.outplay.regard) };
        lines.push(`Won fairly. It holds. Regard +${m.outplay.regard}.${countsFor({ ...h, owner: 'team', method: 'outplay' }, team.creed) === 2 ? ' Under Power it counts double.' : ''}`);
      } else {
        set(h.id, (x) => ({ ...x, mood: shiftMood(x.mood, 1), tried: x.tried.includes('outplay') ? x.tried : [...x.tried, 'outplay'] }));
        // Nerve leading: a lost Outplay doesn't cost the squad a day (Part 7 section 2.4).
        if (lead(j)?.talent === 'nerve') lines.push('Lost. Nerve led: nobody needs a day off. A rematch is open.');
        else {
          crew = crew.map((c) => (j.squad.includes(c.id) ? { ...c, outOn: day + 1 } : c));
          lines.push('Lost. The squad rests tomorrow. A rematch is open.');
        }
      }
    }
    sheets.push({ holdingId: h.id, method: j.method, squad: [...j.squad], odds, certain: j.certain, roll, won, voice: voice(j.method, won, h.step, data), lines, ...(j.played ? { played: true } : {}) });
    // The Card's line gets its mark: it went, or it didn't (a Pay short of money on the day didn't go either).
    const went = won && !(j.method === 'pay' && lines[0]?.startsWith('The money was short'));
    // People: a job that went counts toward Lead; a job their talent fits, +1 once a district (Part 5 section 5.2).
    crew = crew.map((c) => {
      if (!j.squad.includes(c.id)) return c;
      let x = went ? { ...c, jobs: c.jobs + 1 } : c;
      if (x.talent && talentDef(x.talent, data).fits.includes(j.method) && x.fitIn !== dkey) x = { ...moveLoyalty(x, P.loyalty.fit, data), fitIn: dkey };
      return x;
    });
    if (j.cardId) results.push({ kind: 'job', who: [...j.squad], to: h.id, method: j.method, cardId: j.cardId, result: went ? 'went' : 'didnt', text: `Day ${day}. ${went ? data.ledger.written.went : data.ledger.written.didnt}`, ...(takenBy ? { taken: takenBy } : {}) });
  }

  const evening: string[] = [];
  // Dread 8+: one holding a day comes over on its own, nearest first, without a squad and without Heat (Part 7 section 6.6).
  if (team.dread >= data.line.dread.comeOver) {
    const next = holdings.filter((x) => x.kind === 'local' && x.owner !== 'team' && x.mood !== 'shut' && !localOf(x, data)?.minor).sort((a, b) => a.step - b.step)[0];
    if (next) {
      holdings = holdings.map((x) => (x.id === next.id ? { ...x, owner: 'team', method: 'lean', since: day, holds: false, mood: 'sullen', scouted: Math.max(1, x.scouted) } : x));
      evening.push(fill(data.line.dread.comeOverLine, { step: next.step }));
      results.push({ kind: 'law', who: [], to: next.id, text: `Day ${day}. ${fill(data.line.written.comeOver!, { step: next.step })}` });
    }
  }
  let district = settleTown({ ...d0, holdings, regardStreets }, day, data);
  // Slice 9: the districts behind pay too (full with an Officer there, half without; Part 2 section 4.1).
  const past = pastTakings(block, data);
  // Slice 11: Rackets and Fronts pay, Works finish, and upkeep's owed (Part 12, Part 13, Part 5 section 2.2).
  const ec = econEvening({ ...block, team, crew, district }, data);
  ({ team, crew, district } = { team: ec.block.team, crew: ec.block.crew, district: ec.block.district! });
  let econ = ec.block.economy;
  const holdingsIncome = district.holdings.reduce((n, h) => n + takingsAt(h, block.rates, data), 0) + past.amount;
  const income = holdingsIncome + ec.income;
  const paid = crew.filter((c) => c.where === 'in');
  const wages = team.creed === 'belonging' ? Math.max(0, Math.floor(income / 2)) : paid.reduce((n, c) => n + wageOf({ ...block, team }, c, income, data), 0);
  const before = team.funds;
  const out$ = wages + ec.upkeep;
  team = { ...team, funds: Math.max(0, team.funds + income - out$) };
  evening.push(`Takings ₽${holdingsIncome.toLocaleString('en-GB')}.`, ...past.lines, ...ec.lines);
  evening.push(team.creed === 'belonging' ? `Shares ₽${wages.toLocaleString('en-GB')}: half of today, split.` : `Wages ₽${wages.toLocaleString('en-GB')} for ${paid.length}.`);
  if (before + income - out$ < 0) {
    evening.push(`Short ₽${(out$ - before - income).toLocaleString('en-GB')}: they were paid what there was.`);
    if (econOn(data)) {
      // Bankrupt (Part 5 section 2.4): Short, Broke, Bust, a day each. None ends the run.
      econ = { ...econ, broke: econ.broke + 1 };
      const s = shortLoyalty({ ...block, team }, crew, Math.min(3, econ.broke), data);
      crew = s.crew.map((c) => (c.where === 'in' ? { ...c, unpaid: c.unpaid + 1 } : c));
      evening.push(s.line);
    } else {
      // Not paid: −1 each, a day (Part 5 section 5.2). Belonging's shares never fall short.
      crew = crew.map((c) => (c.where === 'in' ? { ...moveLoyalty(c, P.loyalty.unpaid, data), unpaid: c.unpaid + 1 } : c));
    }
  } else if (econ.broke > 0) econ = { ...econ, broke: 0, lastJob: false };
  if (ec.loud !== null) loudest = Math.max(loudest ?? -99, ec.loud);
  // Slice 8: what the Boss did at the Gym today counts toward the loudest (Part 8a section 12).
  const gymHeat = gymHeatToday(block);
  if (gymHeat !== null) loudest = Math.max(loudest ?? -99, gymHeat);
  if (loudest !== null) {
    const h0 = team.heat;
    team = { ...team, heat: cap(team.heat + loudest) };
    evening.push(`Heat ${loudest >= 0 ? '+' : ''}${loudest}: the day's loudest job.${team.heat === h0 ? ' (No change.)' : ''}`);
  }
  // Warrants (Heat 8+): a face the law knows is arrested (Part 9 section 10, way 6). Bail and visits come later.
  if (team.heat >= data.line.heat.warrants) {
    for (const c of crew.filter((x) => x.where === 'in' && x.known)) {
      crew = crew.map((x) => (x.id === c.id ? { ...x, where: 'left' as const, left: { day, how: 'arrested' as const } } : x));
      evening.push(`${c.name} ${data.line.leave.arrested}`);
      results.push({ kind: 'leave', who: [c.id], text: `Day ${day}. ${c.name} ${data.line.leave.arrested}` });
    }
  }
  let out: EvilModeBlock = { ...block, team, crew, district, queue: [], sheets, evening, proof, draws: { ...block.draws, 'evil-dispatch': draws, 'evil-line': lineDraws, 'evil-economy': ec.block.draws['evil-economy'] ?? 0 }, applied: [...block.applied, key], economy: econ };
  for (const e of ec.block.log.slice(block.log.length)) out = appendLog(out, { kind: e.kind, who: e.who, text: e.text, ...(e.given ? { given: e.given } : {}) });
  for (const e of results) out = appendLog(out, e);
  // Wages paid: one to Given a head (Part 23 section 8.2), only when they were paid in full.
  if (wages > 0) {
    const full = before + income - wages >= 0;
    const W = data.ledger.written;
    const heads = `${paid.length}`;
    const text = fill(!full ? W.short : team.creed === 'belonging' ? W.shares : W.wages, { amount: money(full ? wages : Math.max(0, before + income)), heads });
    out = appendLog(out, { kind: 'pay', who: paid.map((c) => c.id), text: `Day ${day}. ${text}`, ...(full ? { given: paid.length * data.ledger.count.wageHead } : {}) });
  }
  // Slice 9: drift in the districts behind that nobody holds, on its own stream.
  if (out.region.past.length) {
    const dr = drift(out, data);
    out = dr.block;
    evening.push(...dr.lines);
  }
  const count = heldCount(out);
  // Slice 9: only a district ends at eleven or on its seventh day; the Arrival and the Reckoning end with the Hero.
  const kind = data.region.on ? stageKind(block.here.stage) : 'district';
  if (kind === 'district' && count >= R.toHold) district = { ...district, end: { how: 'held', day, count } };
  else if (kind === 'district' && dayIn(block) >= R.days) district = { ...district, end: { how: 'taken', day, count } };
  if (district.end) {
    evening.push(data.district.ends[district.end.how as 'held' | 'taken']);
    // A district ends: Heat −3; Dread −1 if nothing in it was Leaned or Taken (Part 5 sections 4.1 and 6.1).
    const loud = out.log.some((e) => e.kind === 'job' && e.result === 'went' && e.region === d0.region && e.district === d0.n && (e.method === 'lean' || e.method === 'take'));
    const t = out.team;
    out = { ...out, team: { ...t, heat: cap(t.heat + data.line.heat.districtEnd), dread: loud ? t.dread : cap(t.dread + data.line.dread.fade) } };
    evening.push(`Heat ${data.line.heat.districtEnd}: the district's done.${loud ? '' : ` Dread ${data.line.dread.fade}: nothing loud in it.`}`);
    // Paid on time a whole district: +1 each (Part 5 section 5.2). The count starts again with the next district.
    out = { ...out, crew: out.crew.map((c) => (c.where !== 'in' ? c : { ...(c.unpaid === 0 ? moveLoyalty(c, P.loyalty.paidDistrict, data) : c), unpaid: 0 })) };
    // Slice 11: the district's rackets end with it; Fronts run well add Regard; Going Straight counts.
    const de = econDistrictEnd(out, data);
    out = de.block;
    evening.push(...de.lines);
  }
  return { ...out, district, evening };
}

// ---- Asking anyway (Part 7 sections 11.1 and 11.2, Part 29 section 5.4) ----

/**
 * An order across a line. The Card's filed with field 12 saying who was asked, and the person refuses, in the yard, before
 * the job, whatever the Boss answers next: their line's heard and the asking's counted. The job waits on the answer.
 */
export function askAnyway(block: EvilModeBlock, job: JobDraft, data: EvilData = EVIL_DATA): { block: EvilModeBlock; problem: string | null } {
  if (block.refusal) return { block, problem: 'Somebody is already waiting on an answer in the yard.' };
  const problem = jobProblem(block, job, data);
  if (problem) return { block, problem };
  const who = crossers(block, job, data);
  if (!who.length) return { block, problem: 'Nobody on this squad has a line it crosses.' };
  const card = cardFor(block, job, data, true);
  const cardId = `C${block.cards.length + 1}`;
  let b: EvilModeBlock = { ...block, cards: [...block.cards, { ...card, id: cardId }] };
  const unknowns = unknownCount(card);
  b = appendLog(b, { kind: 'card', who: [...job.squad], to: job.holdingId, method: job.method, cardId, text: card.fields[11]!.text, ...(unknowns ? { unknowns } : {}) });
  b = appendLog(b, { kind: 'asked', who: who.map((p) => p.id), to: job.holdingId, cardId, text: lineFor(b, who.map((p) => p.id), 'asked anyway, across their line. Refused, in the yard.') });
  b = { ...b, crew: b.crew.map((c) => (who.some((p) => p.id === c.id) ? { ...c, asked: c.asked + 1, lineHeard: true } : c)), refusal: { cardId, job: { holdingId: job.holdingId, method: job.method, squad: [...job.squad], ...(job.offer !== undefined ? { offer: job.offer } : {}), ...(job.thing ? { thing: job.thing } : {}) }, who: who.map((p) => p.id) } };
  return { block: b, problem: null };
}

/** Who'd go instead of the refusers: free today, not a minor on a job with Heat, and with no line this job crosses. */
export function swapsFor(block: EvilModeBlock, data: EvilData = EVIL_DATA): string[] | null {
  const r = block.refusal;
  if (!r) return null;
  const free = inRoster(block).filter((c) => !r.job.squad.includes(c.id) && !crewProblem(block, c.id, r.job.holdingId) && !(c.minor && r.job.method !== 'scout') && !crossers(block, { ...r.job, squad: [c.id] }, data).length);
  if (free.length < r.who.length) return null;
  return free.slice(0, r.who.length).map((c) => c.id);
}

export type RefusalAnswer = 'withdraw' | 'swap' | 'insist';

/**
 * The Boss's answer (Part 7 section 11.1): withdraw (the job's cancelled; the refuser +2, the others going +1); send someone
 * else (done by the swap; the refuser −1); insist (11.2: they leave on the spot, the armband on the bonnet; the two
 * nearest them in rank −2; the job isn't done today). The kept Card's line is marked "called off" unless the swap goes.
 */
export function answerRefusal(block: EvilModeBlock, answer: RefusalAnswer, data: EvilData = EVIL_DATA): { block: EvilModeBlock; problem: string | null; line: string } {
  const r = block.refusal;
  if (!r) return { block, problem: 'Nobody is waiting on an answer.', line: '' };
  const L = data.people.rules.loyalty;
  const names = r.who.map((id) => block.crew.find((c) => c.id === id)!.name).join(' and ');
  const calledOffLine = (b: EvilModeBlock) => appendLog(b, { kind: 'job', who: [...r.job.squad], to: r.job.holdingId, method: r.job.method, cardId: r.cardId, result: 'called off', text: lineFor(b, [], data.ledger.written.calledOff) });
  let b: EvilModeBlock = { ...block, refusal: null };
  if (answer === 'withdraw') {
    b = { ...b, crew: b.crew.map((c) => (r.who.includes(c.id) ? moveLoyalty(c, L.withdrawn, data) : r.job.squad.includes(c.id) ? moveLoyalty(c, L.withdrawnOthers, data) : c)) };
    b = calledOffLine(b);
    return { block: b, problem: null, line: fill(peopleText('withdrawn', data), { name: names }) };
  }
  if (answer === 'swap') {
    const swaps = swapsFor(block, data);
    if (!swaps) return { block, problem: peopleText('swapNone', data), line: '' };
    const squad = r.job.squad.map((id) => (r.who.includes(id) ? swaps[r.who.indexOf(id)]! : id));
    b = { ...b, crew: b.crew.map((c) => (r.who.includes(c.id) ? moveLoyalty(c, L.swapped, data) : c)) };
    b = calledOffLine(b);
    const q = queueJob(b, { ...r.job, squad }, data);
    if (q.problem) return { block, problem: q.problem, line: '' };
    return { block: q.block, problem: null, line: fill(peopleText('swapped', data), { name: names, who: swaps.map((id) => block.crew.find((c) => c.id === id)!.name).join(' and ') }) };
  }
  // Insist: the mode's one scene where the Boss gives an order twice.
  const order = data.people.ranks.map((x) => x.id);
  const day = block.here.day;
  let crew = b.crew.map((c) => (r.who.includes(c.id) ? { ...c, where: 'left' as const, left: { day, how: 'line' as const } } : c));
  for (const id of r.who) {
    const me = block.crew.find((c) => c.id === id)!;
    const near = crew.filter((c) => c.where === 'in').sort((x, y) => Math.abs(order.indexOf(x.rank) - order.indexOf(me.rank)) - Math.abs(order.indexOf(y.rank) - order.indexOf(me.rank))).slice(0, 2).map((c) => c.id);
    crew = crew.map((c) => (near.includes(c.id) ? moveLoyalty(c, L.insistedWatch, data) : c));
  }
  b = { ...b, crew };
  b = appendLog(b, { kind: 'leave', who: [...r.who], to: r.job.holdingId, cardId: r.cardId, text: lineFor(b, r.who, 'told twice, across their line. Left the armband on the bonnet of the van.') });
  b = calledOffLine(b);
  return { block: b, problem: null, line: fill(peopleText('insisted', data), { name: names }) };
}

/**
 * Lean, Take and Expose at the Evening (Part 7 sections 6, 7 and 9). Lean: the holding, would turn, takings half as much
 * again; Dread +1; the local Sullen; each other local on the street colder at one in two (`evil-line`). Failed: Shut, the
 * street one colder with no roll, the squad's Loyalty −1 (not a Heart's). Take: the thing (stock, a deed, a ledger);
 * Dread +2; the local Sullen; failed without Hands leading, the lead's face is known. Expose: the street warmer, the target
 * Shut to the team, Regard +1 when the proof was a witness (clean hands); the proof's spent either way.
 */
function darkResult(j: Job, h: Holding, won: boolean, s: { holdings: Holding[]; team: EvilModeBlock['team']; crew: Crew[]; proof: string[]; lineDraws: number; seed: string; day: number }, data: EvilData) {
  const L = data.line;
  let { holdings, team, crew, proof, lineDraws } = s;
  const cap = (n: number) => Math.max(0, Math.min(10, n));
  const set = (id: string, f: (x: Holding) => Holding) => { holdings = holdings.map((x) => (x.id === id ? f(x) : x)); };
  const st = streetOf(h.step, data);
  const street = holdings.filter((x) => x.id !== h.id && x.kind === 'local' && streetOf(x.step, data) === st);
  const lines: string[] = [];
  let taken = 0;
  const lead = crew.find((c) => c.id === j.squad[0]);
  const l = localOf(h, data);
  if (j.method === 'lean') {
    if (won) {
      set(h.id, (x) => ({ ...x, owner: 'team', method: 'lean', since: s.day, holds: false, mood: 'sullen', scouted: Math.max(1, x.scouted) }));
      team = { ...team, dread: cap(team.dread + L.lean.dread) };
      taken = L.lean.taken;
      let colder = 0;
      for (const x of street) {
        const roll = lineRoll(s.seed, lineDraws, 100);
        lineDraws += 1;
        if (roll <= L.lean.streetColder) { set(x.id, (y) => ({ ...y, mood: shiftMood(y.mood, -1) })); colder += 1; }
      }
      lines.push(`Frightened. It's yours, and it would turn. Dread +${L.lean.dread}.${colder ? ` ${colder} on the street went colder.` : ''}`);
    } else {
      set(h.id, (x) => ({ ...x, mood: 'shut', scouted: Math.max(1, x.scouted) }));
      for (const x of street) set(x.id, (y) => ({ ...y, mood: shiftMood(y.mood, -1) }));
      crew = crew.map((c) => (j.squad.includes(c.id) && c.talent !== 'heart' ? moveLoyalty(c, L.lean.loyaltyFail, data) : c));
      lines.push(`"I'll not be spoken to like that." They went to the constable. Shut, and the street one colder.`);
    }
  } else if (j.method === 'take') {
    const thing = L.things.find((t) => t.id === (j.thing ?? 'stock'))!;
    if (won) {
      team = { ...team, dread: cap(team.dread + L.take.dread) };
      taken = thing.taken;
      if (thing.id === 'stock') {
        const amount = (l?.take ?? 0) * L.take.stockDays;
        team = { ...team, funds: team.funds + amount };
        set(h.id, (x) => ({ ...x, mood: 'sullen', scouted: Math.max(1, x.scouted) }));
        lines.push(`Took the stock: ${money(amount)}. Not held. Dread +${L.take.dread}.`);
      } else if (thing.id === 'deed') {
        set(h.id, (x) => ({ ...x, owner: 'team', method: 'take', since: s.day, holds: true, mood: 'sullen', scouted: Math.max(1, x.scouted) }));
        lines.push(`Took the deed. It's yours on paper, and paper holds. Dread +${L.take.dread}.`);
      } else {
        set(h.id, (x) => ({ ...x, mood: 'sullen', scouted: 2 }));
        if (l?.secret) {
          if (!proof.includes(h.id)) proof = [...proof, h.id];
          lines.push(`Took the ledger. It's proof: ${l.secret} Dread +${L.take.dread}.`);
        } else {
          for (const x of street) set(x.id, (y) => ({ ...y, scouted: Math.max(1, y.scouted) }));
          lines.push(`Took the ledger. Nothing to prove, but now you know what the street earns. Dread +${L.take.dread}.`);
        }
      }
    } else if (lead?.talent === 'hands') {
      lines.push('Not taken. Hands led: nothing left behind.');
    } else {
      crew = crew.map((c) => (c.id === lead?.id ? { ...c, known: true } : c));
      lines.push(`Not taken. ${lead?.name ?? 'The lead'}'s face was seen.`);
    }
  } else {
    const clean = !proof.includes(h.id);
    proof = proof.filter((x) => x !== h.id);
    crew = crew.map((c) => (j.squad.includes(c.id) ? { ...c, outOn: s.day + L.expose.days - 1 } : c));
    if (won) {
      for (const x of street) set(x.id, (y) => ({ ...y, mood: y.mood === 'shut' ? y.mood : shiftMood(y.mood, 1) }));
      set(h.id, (x) => ({ ...x, mood: 'shut', scouted: 2 }));
      if (clean) team = { ...team, regard: cap(team.regard + L.expose.regard) };
      lines.push(`Published. It's true, and the street knows it: one warmer.${clean ? ` Regard +${L.expose.regard}: clean hands.` : ''}`);
    } else lines.push("Nobody printed it. The proof's spent.");
    lines.push(`The squad's out ${L.expose.days} days.`);
  }
  return { holdings, team, crew, proof, lineDraws, lines, taken };
}

/** Squads a day (Part 2 section 2.1): one in the first region's Arrival (a former Executive makes it two); otherwise no limit but the Roster. */
export function squadLimit(block: EvilModeBlock, data: EvilData = EVIL_DATA): number {
  if (!data.region.on || block.here.stage !== 1 || block.here.region !== 0) return Number.POSITIVE_INFINITY;
  return modify(block, 'squads', {}, data.region.arrival.squads, data);
}
