// A job's odds (design Part 7 section 2): a base and a list of named terms, added in the order printed, clamped last.
// One function: the Dispatch screen and the Evening's roll both call it. Pure arithmetic; it never draws a number.

import { EVIL_DATA, type EvilData } from './data';
import type { EvilModeBlock, JobMethod, OddsTerm, TakeThing } from './schema';
import { kindDef } from './board';
import { darkTerms, lawTerms } from './line';

export interface JobDraft {
  holdingId: string;
  method: JobMethod;
  squad: string[];
  /** Pay only: percent of the fair price. */
  offer?: number;
  /** Take only: what's taken. */
  thing?: TakeThing;
}

export interface Odds {
  /** The figure rolled against (1..100). 100 when certain. */
  odds: number;
  certain: boolean;
  terms: OddsTerm[];
  /** What the screen may show: equal to `odds` when every term is known; a band when the mood isn't scouted yet. */
  lo: number;
  hi: number;
}

const clamp = (n: number, data: EvilData): number => Math.max(data.district.terms.floor, Math.min(data.district.terms.ceiling, n));

/** The odds of a job on a holding. Callers check the job can be queued first (dispatch.ts `jobProblem`). */
export function oddsFor(block: EvilModeBlock, job: JobDraft, data: EvilData = EVIL_DATA): Odds {
  const h = block.district?.holdings.find((x) => x.id === job.holdingId);
  const T = data.district.terms;
  if (!h) return { odds: 0, certain: false, terms: [], lo: 0, hi: 0 };
  if (job.method === 'scout') return certain('Scouting always works');
  if (job.method === 'pay') {
    const offer = data.district.methods.pay.offers.find((o) => o.pct === (job.offer ?? 100)) ?? data.district.methods.pay.offers[0]!;
    if (offer.odds === null) return certain(`Offer: the fair price (${offer.pct}%)`);
    const pt = [{ label: `Offer: ${offer.pct}% of the fair price`, value: offer.odds }, ...peopleTerms(block, job, data), ...lawTerms(block, job, data)];
    const n = clamp(pt.reduce((a, t) => a + t.value, 0), data);
    return { odds: n, certain: false, terms: pt, lo: n, hi: n };
  }
  if (job.method === 'lean' || job.method === 'take' || job.method === 'expose') {
    const L = data.line;
    const dt: OddsTerm[] = [{ label: 'Base', value: L[job.method].base }, ...darkTerms(block, h, job.method, job.squad, data), ...peopleTerms(block, job, data), ...lawTerms(block, job, data)];
    const n = clamp(dt.reduce((a, t) => a + t.value, 0), data);
    return { odds: n, certain: false, terms: dt, lo: n, hi: n };
  }
  const terms: OddsTerm[] = [];
  const base = job.method === 'persuade' ? data.district.methods.persuade.base : data.district.methods.outplay.base;
  terms.push({ label: 'Base', value: base });
  let unknownMood = false;
  let hidden = 0;
  if (job.method === 'persuade') {
    const mood = data.district.moods.find((m) => m.id === h.mood);
    if (mood && h.scouted === 0) {
      unknownMood = true;
      hidden = mood.persuade;
    } else if (mood && mood.persuade !== 0) terms.push({ label: `Mood: ${mood.name}`, value: mood.persuade });
    if (h.scouted >= 2) terms.push({ label: 'You know what they want', value: T.wantKnown });
    const r = block.team.regard;
    if (r >= 2) terms.push({ label: `Regard ${r}`, value: Math.min(T.regardMost, (r - 1) * T.regardPerPoint) });
    if (block.team.dread >= 4) terms.push({ label: `Dread ${block.team.dread}`, value: T.dread });
  } else {
    const alpha = kindDef(h.kind, data).outplay;
    if (alpha) terms.push({ label: `${kindDef(h.kind, data).name}: a stronger pack`, value: alpha });
  }
  if (h.tried.includes(job.method)) terms.push({ label: job.method === 'outplay' ? 'A rematch' : 'Asked before: they liked being asked', value: T.triedBefore });
  if (h.scouted > 0) terms.push({ label: 'Scouted: you know the ground', value: T.scouted });
  if (job.squad.length === 2) terms.push({ label: 'The squad is short: two people', value: T.short });
  terms.push(...peopleTerms(block, job, data), ...lawTerms(block, job, data));
  const sum = terms.reduce((n, t) => n + t.value, 0);
  const odds = clamp(sum + hidden, data);
  if (!unknownMood) return { odds, certain: false, terms, lo: odds, hi: odds };
  // Not scouted: the mood is red ink. The figure rolled is the true one; the screen shows the band it lies in.
  const known = data.district.moods.filter((m) => m.id !== 'shut').map((m) => m.persuade);
  return { odds, certain: false, terms: [...terms, { label: 'Mood: ? (not scouted)', value: 0 }], lo: clamp(sum + Math.min(...known), data), hi: clamp(sum + Math.max(...known), data) };

  function certain(label: string): Odds {
    return { odds: 100, certain: true, terms: [{ label, value: 100 }], lo: 100, hi: 100 };
  }
}

/**
 * The people on a squad (Part 7 section 2.2): the lead's talent fits, +20 (only the lead's counts); a second fitting
 * talent, +5 once; the lead's rank; the squad's Loyalty as a band. Each is a named term, printed in this order.
 */
export function peopleTerms(block: EvilModeBlock, job: JobDraft, data: EvilData = EVIL_DATA): OddsTerm[] {
  const O = data.people.rules.odds;
  const squad = job.squad.map((id) => block.crew.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c);
  const lead = squad[0];
  if (!lead) return [];
  const terms: OddsTerm[] = [];
  const fits = (t: string | null) => !!t && data.people.talents.find((x) => x.id === t)!.fits.includes(job.method);
  const tname = (t: string) => data.people.talents.find((x) => x.id === t)!.name;
  if (fits(lead.talent)) terms.push({ label: `Rolls on ${tname(lead.talent!)}: ${lead.name} leads`, value: O.talentLead });
  const second = squad.slice(1).find((c) => fits(c.talent));
  if (second) terms.push({ label: `${second.name}'s ${tname(second.talent!)} too`, value: O.talentSecond });
  if (lead.rank === 'lead') terms.push({ label: `${lead.name} is a Lead`, value: O.leadRank });
  else if (lead.rank === 'officer' || lead.rank === 'executive') terms.push({ label: `${lead.name} is an ${lead.rank === 'officer' ? 'Officer' : 'Executive'}`, value: O.officerRank });
  const avg = squad.reduce((n, c) => n + c.loyalty, 0) / squad.length;
  if (avg >= 9) terms.push({ label: 'The squad is Devoted', value: O.devoted });
  else if (avg >= 3 && avg < 5) terms.push({ label: 'The squad is Distant', value: O.distant });
  const leaving = squad.find((c) => c.loyalty >= 1 && c.loyalty <= 2);
  if (leaving) terms.push({ label: `${leaving.name} is Leaving`, value: O.leaving });
  return terms;
}


/** The odds as printed, line by line (design Part 7 section 2): the figure (a band while a mood is unscouted), then every term. Dispatch and the Card both print this. */
export function oddsText(o: Odds): string {
  const figure = o.certain ? 'Certain' : o.lo === o.hi ? `${o.odds}%` : `${o.lo}–${o.hi}%`;
  return `${figure} · ${o.terms.map((t) => (o.certain || t.value === 0 ? t.label : `${t.label} ${t.value > 0 ? '+' : ''}${t.value}`)).join(' · ')}`;
}
