// A job's odds (design Part 7 section 2): a base and a list of named terms, added in the order printed, clamped last.
// One function: the Dispatch screen and the Evening's roll both call it. Pure arithmetic; it never draws a number.

import { EVIL_DATA, type EvilData } from './data';
import type { EvilModeBlock, JobMethod, OddsTerm } from './schema';
import { kindDef } from './board';

export interface JobDraft {
  holdingId: string;
  method: JobMethod;
  squad: string[];
  /** Pay only: percent of the fair price. */
  offer?: number;
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
    return flat(offer.odds, `Offer: ${offer.pct}% of the fair price`);
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
  const sum = terms.reduce((n, t) => n + t.value, 0);
  const odds = clamp(sum + hidden, data);
  if (!unknownMood) return { odds, certain: false, terms, lo: odds, hi: odds };
  // Not scouted: the mood is red ink. The figure rolled is the true one; the screen shows the band it lies in.
  const known = data.district.moods.filter((m) => m.id !== 'shut').map((m) => m.persuade);
  return { odds, certain: false, terms: [...terms, { label: 'Mood: ? (not scouted)', value: 0 }], lo: clamp(sum + Math.min(...known), data), hi: clamp(sum + Math.max(...known), data) };

  function certain(label: string): Odds {
    return { odds: 100, certain: true, terms: [{ label, value: 100 }], lo: 100, hi: 100 };
  }
  function flat(n: number, label: string): Odds {
    return { odds: n, certain: false, terms: [{ label, value: n }], lo: n, hi: n };
  }
}


/** The odds as printed, line by line (design Part 7 section 2): the figure (a band while a mood is unscouted), then every term. Dispatch and the Card both print this. */
export function oddsText(o: Odds): string {
  const figure = o.certain ? 'Certain' : o.lo === o.hi ? `${o.odds}%` : `${o.lo}–${o.hi}%`;
  return `${figure} · ${o.terms.map((t) => (o.certain || t.value === 0 ? t.label : `${t.label} ${t.value > 0 ? '+' : ''}${t.value}`)).join(' · ')}`;
}
