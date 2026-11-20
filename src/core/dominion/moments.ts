// DOMINION slice D30: job moments and the morning paper (round-4 mockups m8 Boss order cut-in, m9 Job done, m10 Job
// botched, m12 The morning paper).
//
// - The moments only PRESENT what D2's `act` already did and saved: `orderModel` and `jobModel` read the block as it
//   was before the act and as it is after, so nothing here can change an outcome, and skipping or cutting the
//   animation changes nothing either. Their lines are picked on their own stream (`dominion-moment`), never a game roll.
// - The paper: each act leaves a small note (`noteJob`; a battle the job waited on turns it into won or lost), and the
//   World Turn takes a morning snapshot (`paperEnd`). `paperModel` prints yesterday's busiest job on the front page,
//   the night's news lines (D25's week log, D3's report as the fallback) as side stories, a WANTED poster whose bounty
//   follows the Wanted meter and Notoriety, and the news panel (this morning's snapshot against yesterday's).
//   D25's Rotom line for a weekly paper shows as a ✦ line on the morning it came out.

import { z } from 'zod';
import raw from '../../data/dominion/moments.json';
import type { AiLog } from '../ai/schema';
import type { RunState } from '../state';
import { hashSeed, Rng } from '../rng';
import { DOMINION_DATA } from './data';
import { notorietyOf, stepIndex } from './empire';
import { addFightHook, card, type Card } from './field';
import { heroDefOf } from './hero';
import { teamDef, teamsHere } from './rivals';
import { STAT_IDS, type DominionBlock, type JobNote, type JobResult, type NewsSnap, type PaperState } from './schema';
import { latestPaper, rotomText } from './voices';
import { addWorldEnd, fill } from './worldTurn';

const S = z.string().min(1);
const Lines = z.array(S).min(1);
const ByStat = z.object({ brawn: Lines, nerve: Lines, wits: Lines, charm: Lines, stealth: Lines, any: Lines }).strict();
const PAPER_KINDS = ['done', 'big', 'botched', 'won', 'lost', 'quiet'] as const;
const ByKind = <T extends z.ZodTypeAny>(t: T) => z.object({ done: t, big: t, botched: t, won: t, lost: t, quiet: t }).strict();

export const MomentsFileSchema = z.object({
  _source: S,
  order: z.object({ boss: ByStat, crew: ByStat, alone: Lines, sub: S, sure: S }).strict(),
  done: z.object({ stamp: z.object({ paid: S, done: S, big: S }).strict(), weekly: S, rolled: S, sure: S }).strict(),
  botched: z.object({
    stamp: S, rolled: S, tape: S, cost: S, caught: S, caughtBoss: S, free: S, police: S, policeSub: S, map: S, mapSub: S, next: S, nextSub: S,
    quote: z.object({ caught: Lines, free: Lines }).strict(),
  }).strict(),
  paper: z.object({
    masthead: S, edition: S, price: S,
    heads: ByKind(Lines), decks: ByKind(S), column: ByKind(S),
    caption: S, captionQuiet: S,
    side: z.object({ hero: Lines, police: Lines, rivals: Lines, legends: Lines, crew: Lines }).strict(),
    sideQuiet: Lines, sideQuietBody: Lines,
    wanted: S, who: S, by: S, byNew: S, bySame: S,
    bounty: z.object({ base: z.number().int().min(0), perWanted: z.number().int().min(0), perStep: z.number().int().min(0) }).strict(),
    news: S, fold: S,
    rows: z.object({ notoriety: S, bounty: S, regard: S, dread: S, threat: S, tension: S }).strict(),
    noRows: S,
  }).strict(),
}).strict().superRefine((m, ctx) => {
  if (m.paper.sideQuiet.length !== m.paper.sideQuietBody.length) ctx.addIssue({ code: 'custom', message: 'paper.sideQuiet and sideQuietBody must pair up' });
});
export type MomentsFile = z.infer<typeof MomentsFileSchema>;
export const MOMENTS: MomentsFile = MomentsFileSchema.parse(raw);
const M = () => MOMENTS;

const rngOf = (...key: (string | number)[]): Rng => new Rng(hashSeed(key.join('::')));
const regionName = (): string => { const r = DOMINION_DATA.start.start.region; return r[0]!.toUpperCase() + r.slice(1).toLowerCase(); };
const nice = (name: string): string => (name === name.toUpperCase() ? name[0]! + name.slice(1).toLowerCase() : name);
const statOf = (stat: string | null): keyof MomentsFile['order']['boss'] => ((STAT_IDS as readonly string[]).includes(stat ?? '') ? (stat as (typeof STAT_IDS)[number]) : 'any');
const districtName = (id: string): string => DOMINION_DATA.field.districts.find((d) => d.id === id)?.name ?? id;
const targetOf = (id: string | null) => {
  for (const d of DOMINION_DATA.field.districts) for (const t of d.targets) if (t.id === id) return { t, d };
  return null;
};
const sign = (n: number): string => (n > 0 ? `+${n}` : `${n}`);
const money = (n: number): string => `₽${n.toLocaleString('en-US')}`;

export function paperOf(b: DominionBlock): PaperState {
  return (b.paper ??= { jobs: [], prev: null, snap: null });
}

/** The member on the job: the first brought along, else the first member, else nobody (the Boss alone). */
function doer(b: DominionBlock, bring: readonly string[]): { id: string; name: string; look: string } | null {
  const m = b.members.find((x) => x.id === bring[0]) ?? b.members[0];
  return m ? { id: m.id, name: nice(m.name), look: m.look } : null;
}

// ---------- the Boss order cut-in (m8) ----------

export interface ActInput { action: string; target: string | null; district: string; bring: string[]; opt?: string | null }
export interface Roll { r: number; chance: number; rolled: boolean }

export interface OrderModel {
  verb: string;
  sub: string;
  boss: string;
  crew: { name: string; look: string; line: string } | null;
}

const pickRng = (seed: string, b: DominionBlock): Rng => rngOf(seed, 'dominion-moment', b.day, b.field.rolls);

/** The cut-in after Do it, from the Card as it stood (block `before` the act). Null when the Card can't be built. */
export function orderModel(before: DominionBlock, run: Pick<RunState, 'party' | 'seed'>, a: ActInput): OrderModel | null {
  const c = card(before, run, a.action, a.target, a.district, a.bring, a.opt ?? null);
  if (!c) return null;
  const O = M().order, r = pickRng(run.seed, before);
  const st = statOf(c.def.stat);
  const who = doer(before, c.bring);
  const vars = { owner: c.target?.owner.name ?? 'them', target: c.target?.name ?? c.district.name, district: c.district.name };
  const boss = fill(r.pick(O.boss[st]), vars);
  const crewLine = who ? fill(r.pick(O.crew[st]), vars) : fill(r.pick(O.alone), vars);
  const more = c.bring.length > 1 ? ` + ${c.bring.length - 1}` : '';
  const sv = { target: vars.target.toUpperCase(), chance: c.chance, member: (who?.name ?? 'THE BOSS').toUpperCase(), more };
  return {
    verb: c.def.name.toUpperCase(),
    sub: fill(c.roll ? O.sub : O.sure, sv),
    boss,
    crew: who ? { name: who.name, look: who.look, line: crewLine } : { name: 'The Boss', look: '', line: crewLine },
  };
}

// ---------- Job done (m9) and Job botched (m10) ----------

export interface Change { ic: string; label: string; from: string; d: string; cls: 'y' | 'up' | 'dn' }
export interface JobModel {
  kind: 'done' | 'botched';
  big: boolean;
  title: string;
  /** "rolled 31 under 64", or "a sure thing". */
  rolled: string;
  stamp: string;
  take: number;
  changes: Change[];
  weekly: string | null;
  member: { name: string; look: string } | null;
  /** Botched: the police opened a case on someone (D24 takes the screen after this page). */
  caught: string | null;
  head: string;
  quote: string | null;
  /** What the act's own lines said (loot, edges, street meetings), so nothing D2 reports is lost. */
  lines: string;
}

/** The result page for an act that settled at once. `roll` is what `act` rolled (null for a sure thing). */
export function jobModel(before: DominionBlock, after: DominionBlock, run: Pick<RunState, 'party' | 'seed'>, a: ActInput, roll: Roll | null, notice: string | null): JobModel | null {
  const c = card(before, run, a.action, a.target, a.district, a.bring, a.opt ?? null);
  if (!c) return null;
  const pass = !roll || !roll.rolled || roll.r <= roll.chance;
  const big = pass && !!roll?.rolled && roll.r <= Math.floor(roll.chance * DOMINION_DATA.field.odds.bigShare);
  const take = Math.max(0, after.funds - before.funds);
  const who = doer(before, c.bring);
  const R = pickRng(run.seed, before);
  const d0 = before.field.districts[c.district.id], d1 = after.field.districts[c.district.id];
  const dn = c.district.name;
  const ch: Change[] = [];
  const row = (ic: string, label: string, x: number, y: number, cls: (n: number) => Change['cls'], fmt = (n: number) => `${n}`, tail = ''): void => {
    if (x !== y) ch.push({ ic, label, from: `${fmt(x)} → ${fmt(y)}${tail}`, d: fmt === money ? `${y - x > 0 ? '+' : '−'}${money(Math.abs(y - x))}` : sign(y - x), cls: cls(y - x) });
  };
  row('g-amulet-coin', 'Funds', before.funds, after.funds, () => 'y', money);
  if (d0 && d1) {
    row('g-fire-stone', `Heat in ${dn}`, d0.heat, d1.heat, (n) => (n > 0 ? 'dn' : 'up'));
    row('g-dark-gem', `Dread · ${dn}`, d0.dread, d1.dread, (n) => (n > 0 ? 'up' : 'dn'));
    row('g-soothe-bell', `Regard · ${dn}`, d0.regard, d1.regard, (n) => (n > 0 ? 'up' : 'dn'));
    row('g-relic-crown', `Your control · ${dn}`, d0.control, d1.control, (n) => (n > 0 ? 'up' : 'dn'), String, ' of 100');
  }
  row('g-policekey', 'Wanted', before.field.wanted, after.field.wanted, (n) => (n > 0 ? 'dn' : 'up'));
  if (before.hero && after.hero) row('t-red', 'Hero Threat', before.hero.threat, after.hero.threat, (n) => (n > 0 ? 'dn' : 'up'));
  const racket = after.field.rackets.find((x) => !before.field.rackets.some((y) => y.target === x.target));
  const title = `${c.def.name} · ${c.target?.name ?? dn}`;
  const lines = notice ?? '';
  if (pass) {
    const S2 = M().done.stamp;
    return {
      kind: 'done', big, title,
      rolled: roll?.rolled ? fill(M().done.rolled, { r: roll.r, chance: roll.chance }) : M().done.sure,
      stamp: big ? S2.big : take > 0 ? S2.paid : S2.done,
      take, changes: ch.slice(0, 6),
      weekly: racket ? fill(M().done.weekly, { target: targetOf(racket.target)?.t.name ?? title, weekly: racket.weekly }) : null,
      member: who, caught: null, head: title, quote: null, lines,
    };
  }
  const B = M().botched;
  const q = after.police?.q && after.police.q !== before.police?.q ? after.police.q : null;
  const name = q ? (q.who === 'boss' ? 'You' : nice(q.name)) : who?.name ?? 'You';
  return {
    kind: 'botched', big: false, title,
    rolled: roll?.rolled ? fill(B.rolled, { r: roll.r, chance: roll.chance }) : M().done.sure,
    stamp: B.stamp, take: 0, changes: ch.slice(0, 4), weekly: null, member: who,
    caught: q ? name : null,
    head: fill(q ? (q.who === 'boss' ? B.caughtBoss : B.caught) : B.free, { who: name }),
    quote: who ? R.pick(q ? B.quote.caught : B.quote.free) : null,
    lines,
  };
}

// ---------- the paper's notes (session.ts calls noteJob after every act) ----------

/** Keeps a note of the act for tomorrow's paper. `res` from the roll and what the act left waiting. */
export function noteJob(after: DominionBlock, before: DominionBlock, a: ActInput, roll: Roll | null, fight: boolean): void {
  const hero = after.field.fight?.why === 'hero' && !after.field.fight.begun;
  const pass = !roll || !roll.rolled || roll.r <= roll.chance;
  const big = pass && !!roll?.rolled && roll.r <= Math.floor(roll.chance * DOMINION_DATA.field.odds.bigShare);
  const res: JobResult = hero ? 'hero' : fight ? 'fight' : !pass ? 'botched' : big ? 'big' : 'done';
  const heat = (after.field.districts[a.district]?.heat ?? 0) - (before.field.districts[a.district]?.heat ?? 0);
  const p = paperOf(after);
  p.jobs.push({ d: before.day, a: a.action, t: a.target, at: a.district, res, pay: Math.max(0, after.funds - before.funds), heat, who: doer(before, a.bring)?.id ?? null });
}

// A battle a job waited on decides it: the last waiting note for that action turns into won or lost.
addFightHook((b, _run, fight, outcome) => {
  const n = [...(b.paper?.jobs ?? [])].reverse().find((j) => (j.res === 'fight' || j.res === 'hero') && j.a === fight.action && j.at === fight.district);
  if (n) n.res = outcome === 'win' ? 'won' : 'lost';
  return [];
});

export function snapOf(b: DominionBlock): NewsSnap {
  const regard: Record<string, number> = {}, dread: Record<string, number> = {};
  for (const [id, d] of Object.entries(b.field.districts)) {
    regard[id] = d.regard;
    dread[id] = d.dread;
  }
  const rt = teamsHere()[0];
  return { d: b.day, notoriety: notorietyOf(b).total, wanted: b.field.wanted, threat: b.hero?.threat ?? 0, tension: rt ? b.rivals?.teams[rt.id]?.tension ?? 0 : 0, regard, dread };
}

/** World Turn end: yesterday's snapshot moves back, this morning's is taken, and notes older than yesterday drop. */
export function paperEnd(b: DominionBlock): string[] {
  const p = paperOf(b);
  p.prev = p.snap;
  p.snap = snapOf(b);
  p.jobs = p.jobs.filter((j) => j.d >= b.day - 1);
  return [];
}
addWorldEnd(paperEnd);

// ---------- the morning paper (m12) ----------

export interface PaperRow { label: string; d: string; cls: 'y' | 'up' | 'dn'; stars?: number }
export interface PaperModel {
  masthead: string;
  dateline: [string, string, string];
  head: string;
  deck: string;
  column: string;
  rotom: string | null;
  caption: string;
  photo: { look: string } | null;
  side: { head: string; body: string }[];
  wanted: { title: string; who: string; bounty: string; by: string };
  news: string;
  rows: PaperRow[];
  noRows: string;
  fold: string;
}

/** The bounty on the poster: shown only (the Wanted meter and Notoriety drive it; nothing reads it back). */
export const bountyOf = (wanted: number, notoriety: number): number => {
  const k = M().paper.bounty;
  return k.base + k.perWanted * wanted + k.perStep * stepIndex(notoriety);
};
/** Notoriety as five stars (the ladder's steps spread over five). */
export const starsOf = (notoriety: number): number => {
  const n = DOMINION_DATA.empire.notoriety.steps.length - 1;
  return n > 0 ? Math.round((stepIndex(notoriety) / n) * 5) : 0;
};

/** The weight that picks the front page: big jobs and battles over plain ones, the most money last. */
const WEIGHT: Record<JobResult, number> = { big: 5, won: 4, lost: 3, botched: 3, done: 2, hero: 1, fight: 1 };

/** This morning's paper. Same block + seed = the same paper. Changes nothing. */
export function paperModel(b: DominionBlock, seed: string, log?: AiLog): PaperModel {
  const P = M().paper, r = rngOf(seed, 'dominion-paper', b.day);
  const region = regionName();
  const jobs = (b.paper?.jobs ?? []).filter((j) => j.d === b.day - 1);
  const lead = [...jobs].sort((x, y) => WEIGHT[y.res] - WEIGHT[x.res] || y.pay - x.pay)[0] ?? null;
  const kind: (typeof PAPER_KINDS)[number] = !lead ? 'quiet' : lead.res === 'hero' || lead.res === 'fight' ? 'botched' : lead.res;
  const tg = lead ? targetOf(lead.t) : null;
  const dname = lead ? districtName(lead.at) : districtName(DOMINION_DATA.field.hq);
  const team = b.team?.name ?? b.teamName ?? 'A new gang';
  const rt = teamsHere()[0];
  const rival = rt ? teamDef(rt.id)?.name ?? rt.name : 'Team Rocket';
  const hero = b.hero ? heroDefOf(b.hero.id).name : 'A young trainer';
  const vars = {
    target: tg?.t.name ?? dname, TARGET: (tg?.t.name ?? dname).toUpperCase(), district: dname, DISTRICT: dname.toUpperCase(),
    owner: tg?.t.owner.name ?? 'The owner', pay: (lead?.pay ?? 0).toLocaleString('en-US'), n: Math.max(1, jobs.length),
    region, REGION: region.toUpperCase(), TEAM: team.toUpperCase(), team, colour: b.team?.primary ?? 'purple', hero, rival,
  };
  // Side stories: tonight's news lines (D25's week log), else the Night Report (D3), else two quiet ones.
  const weekly = latestPaper(b);
  const tonight = (b.voices?.week ?? []).filter((e) => e.d === b.day);
  const fromWeek = tonight.length ? tonight : weekly && weekly.day === b.day ? weekly.items.filter((i) => i.k !== 'quiet').map((i) => ({ k: i.k as Exclude<typeof i.k, 'quiet'>, l: i.body[0]! })) : [];
  const side: PaperModel['side'] = fromWeek.slice(0, 2).map((e) => ({ head: fill(r.pick(P.side[e.k]), vars), body: e.l }));
  for (const l of b.report) {
    if (side.length >= 2) break;
    if (!side.some((s) => s.body === l)) side.push({ head: 'In brief', body: l });
  }
  for (let i = 0; side.length < 2 && i < P.sideQuiet.length; i++) side.push({ head: fill(P.sideQuiet[i]!, vars), body: P.sideQuietBody[i]! });
  // The news panel: this morning against yesterday's.
  const now = b.paper?.snap?.d === b.day ? b.paper.snap : snapOf(b);
  const was = b.paper?.snap?.d === b.day ? b.paper.prev : null;
  const R = P.rows, rows: PaperRow[] = [];
  rows.push({ label: R.notoriety, d: '', cls: 'y', stars: starsOf(now.notoriety) });
  const bounty = bountyOf(now.wanted, now.notoriety), bountyWas = was ? bountyOf(was.wanted, was.notoriety) : null;
  if (bountyWas !== null && bounty !== bountyWas) rows.push({ label: R.bounty, d: `${bounty > bountyWas ? '+' : '−'}${money(Math.abs(bounty - bountyWas))}`, cls: 'y' });
  if (was) {
    const at = lead?.at ?? DOMINION_DATA.field.hq, dn2 = districtName(at);
    const rg = (now.regard[at] ?? 0) - (was.regard[at] ?? 0), dr = (now.dread[at] ?? 0) - (was.dread[at] ?? 0);
    if (rg) rows.push({ label: fill(R.regard, { district: dn2 }), d: sign(rg).replace('-', '−'), cls: rg > 0 ? 'up' : 'dn' });
    if (dr) rows.push({ label: fill(R.dread, { district: dn2 }), d: sign(dr).replace('-', '−'), cls: dr > 0 ? 'up' : 'dn' });
    if (now.threat !== was.threat) rows.push({ label: R.threat, d: sign(now.threat - was.threat).replace('-', '−'), cls: now.threat > was.threat ? 'dn' : 'up' });
    if (now.tension !== was.tension) rows.push({ label: fill(R.tension, { rival }), d: sign(now.tension - was.tension).replace('-', '−'), cls: now.tension > was.tension ? 'dn' : 'up' });
  }
  const rotom = weekly && weekly.day === b.day ? rotomText(log, `news:w${weekly.w}`) : null;
  const who = lead?.who ? b.members.find((m) => m.id === lead.who) : null;
  const towns = DOMINION_DATA.field.districts.slice(0, 3).map((d) => d.name).join(' · ');
  return {
    masthead: fill(P.masthead, { region }),
    dateline: [fill(P.edition, { day: b.day }), towns, P.price],
    head: fill(r.pick(P.heads[kind]), vars),
    deck: fill(P.decks[kind], vars),
    column: fill(P.column[kind], vars),
    rotom,
    caption: fill(lead ? P.caption : P.captionQuiet, vars),
    photo: who ? { look: who.look } : null,
    side,
    wanted: { title: P.wanted, who: fill(P.who, { TEAM: team.toUpperCase() }), bounty: money(bounty), by: bountyWas === null ? fill(P.byNew, { region }) : bountyWas !== bounty ? fill(P.by, { was: bountyWas.toLocaleString('en-US'), region }) : fill(P.bySame, { region }) },
    news: P.news,
    rows: rows.slice(0, 6),
    noRows: P.noRows,
    fold: P.fold,
  };
}

/** Is there a paper this morning? From Day 2 on, on the Morning. */
export const paperDue = (b: DominionBlock): boolean => b.opened && b.phase === 'morning' && b.day > 1;

export type { Card };
