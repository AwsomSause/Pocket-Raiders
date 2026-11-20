// DOMINION slice D13, the Debate, offline (Part 4 §3, Part 9 A2-A4 and A6; Part 0 §6.1 Q2: set lines with fixed scores
// first, the Rotom path is D20). Instead of crushing a rival team you can absorb it at the Leader's Table: three rounds
// (Values, Methods, The Future), two turns each. Each turn you pick a stance (Partnership, Merger, Recruit, Threaten) and
// one of its three set lines. The game scores the line on five marks (Values, Record, Substance, Respect, Honesty) from
// fixed numbers, the Boss's leanings and your real run (a claim the Ledger can't back scores 0 Record and 0 Honesty), and
// moves the Conviction bar: (sum − 10) × 2, then the stance's modifier, capped −15..+20 a turn. The final Conviction
// gives the result (A4): Convinced (Merger or loyal Branch), Persuaded (a Branch with one demand), Unmoved, Offended.
// Branches pay tribute and take a Branch Directive every Monday (A6). Pure: every roll is on `dominion-debate`.

import type { Content } from '../contentSchema';
import { hashSeed, Rng } from '../rng';
import { newMon } from '../run';
import type { RunState } from '../state';
import { DOMINION_DATA } from './data';
import { crewOf, freshCrew, withCrew } from './crew';
import { addActEffect, addActionGate, addHeat, masteryLevel, statusOf } from './field';
import { hqFx } from './hqFx';
import { addTension, ladder, rivalsOf, setCardHook, teamDef, teamsHere, tier, withRivals, type RivalOut } from './rivals';
import { CLAIMS } from './schema';
import type { Deal, DebateBoss, DebateState, DebateTurn, DominionBlock, LiveDebate, Member } from './schema';
import { addWorldStep, fill } from './worldTurn';

const D = () => DOMINION_DATA.debate;
const T = () => DOMINION_DATA.debate.text;
const WEEK = (): number => DOMINION_DATA.start.clock.weekLength;
const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, Math.round(n)));
const money = (n: number): string => `₽${n.toLocaleString('en-US')}`;
const rngOf = (seed: string, ...key: (string | number)[]): Rng => new Rng(hashSeed([seed, 'dominion-debate', ...key].join('::')));
const pick = <T>(r: Rng, xs: readonly T[]): T => xs[r.int(0, xs.length - 1)]!;

export const freshDebate = (): DebateState => ({ live: null, tries: {}, deals: {}, pages: 0, rolls: 0, past: [] });
export const debateOf = (b: DominionBlock): DebateState => b.debate ?? freshDebate();
export function withDebate<T extends DominionBlock>(b: T): T & { debate: DebateState } {
  if (!b.debate) b.debate = freshDebate();
  return b as T & { debate: DebateState };
}
export const weekOf = (b: DominionBlock): number => Math.floor((b.day - 1) / WEEK());
export const bossOf = (team: string): DebateBoss | undefined => D().bosses[team];
export const lineDef = (id: string) => D().lines.find((l) => l.id === id);
export const dealOf = (b: DominionBlock, team: string): Deal | null => b.debate?.deals[team] ?? null;

/** The rolls on `dominion-debate` (each one counted, so a reload replays them). */
function roll(b: DominionBlock & { debate: DebateState }, seed: string, why: string): Rng {
  const r = rngOf(seed, why, b.debate.rolls);
  b.debate.rolls += 1;
  return r;
}

// ---------- what the game knows about your run (the Ledger) ----------

/** Towns you Hold or Own. */
export const heldTowns = (b: DominionBlock): number => Object.values(b.field.districts).filter((d) => ['held', 'owned'].includes(statusOf(d))).length;
/** Your worst line on the Ledger (the first robbery on the sins list you've done), or null. */
export function sinOf(b: DominionBlock): string | null {
  return D().sins.find((s) => (b.field.mastery[s.action] ?? 0) > 0)?.text ?? null;
}
/** 'boss' when you beat their Boss (at your door or in a duel), 'admin' when you beat one of their Admins. */
export function beaten(b: DominionBlock, team: string): 'boss' | 'admin' | null {
  if (b.flags.includes(`beat:${team}:boss`)) return 'boss';
  return b.flags.includes(`beat:${team}:admin`) ? 'admin' : null;
}
export function claimHolds(b: DominionBlock, claim: Claim, team: string): boolean {
  const c = D().claims[claim]!;
  switch (claim) {
    case 'towns': return heldTowns(b) >= c.min;
    case 'rich': return b.funds >= c.min;
    case 'army': return b.members.length >= c.min;
    case 'clean': return !sinOf(b);
    case 'strong': return !!beaten(b, team);
  }
}
type Claim = (typeof CLAIMS)[number];

const dreadOf = (b: DominionBlock): number => Object.values(b.field.districts).reduce((a, d) => a + Math.max(0, d.dread), 0);
function their(b: DominionBlock, team: string): { admins: number; power: number } {
  const t = rivalsOf(b).teams[team];
  return { admins: t?.admins.length ?? 0, power: Math.max(0, t?.power ?? 0) };
}
/** Their Fear (the Threaten stance needs your Dread to be twice it). */
export function fearOf(b: DominionBlock, team: string): number {
  const S = D().strength, x = their(b, team);
  return S.fearBase + S.fearPerAdmin * x.admins + S.fearPerPower * x.power;
}
/** Strength for the Merger stance: yours (members + Held towns) against theirs (Admins + power). */
export function strengths(b: DominionBlock, team: string): { yours: number; theirs: number } {
  const S = D().strength, x = their(b, team);
  return { yours: b.members.length + S.perHeld * heldTowns(b), theirs: S.base + S.perAdmin * x.admins + S.perPower * x.power };
}

// ---------- who will talk ----------

const vars = (b: DominionBlock, team: string, who = 'boss'): Record<string, string> => {
  const def = teamDef(team);
  const admin = def?.admins.find((a) => a.id === who);
  return { boss: def?.boss.name ?? 'The Boss', team: def?.name ?? 'Their team', who: admin?.name ?? def?.boss.name ?? '', my: b.teamName ?? 'your crew', them: bossOf(team)?.them ?? 'them' };
};
const triesOf = (b: DominionBlock, key: string) => b.debate?.tries[key] ?? { fails: 0, week: -1, closed: false };

/** Why a Debate can't start now (null when it can). `via` 'action' is the Boss's own Debate action (Tension 40+ and a win
 * over one of theirs); an invitation (a summit, a street meeting, an Admin card) needs neither. */
export function whyNot(b: DominionBlock, team: string, via: 'action' | 'invite', who = 'boss'): string | null {
  const def = teamDef(team);
  if (!def) return T().noTeam!;
  const v = vars(b, team, who);
  if (b.debate?.live) return T().live!;
  if (dealOf(b, team)) return fill(T().yours!, v);
  const key = who === 'boss' ? team : `${team}:${who}`;
  const tr = triesOf(b, key);
  if (tr.closed) return fill(T().closed!, { ...v, boss: v.who! });
  if (tr.week === weekOf(b)) return fill(T().week!, { ...v, boss: v.who! });
  if (via === 'action') {
    const ten = rivalsOf(b).teams[team]?.tension ?? 0;
    if (ten < D().rules.minTension) return `Needs Tension ${D().rules.minTension}+ with ${def.name} (it's ${ten}).`;
    if (!beaten(b, team)) return fill(T().needBeat!, v);
  }
  return null;
}

/** Conviction at the start (A2): ±20 by Tension, a win over them, their Admins already gone, your manifesto, the
 * Debate action's mastery and the rooms that host it (Luxury Suite, Ballroom). */
export function startConviction(b: DominionBlock, team: string, who = 'boss'): number {
  const S = D().start;
  const t = rivalsOf(b).teams[team];
  const def = teamDef(team);
  let n = 0;
  const ten = t?.tension ?? 0;
  if (ten >= S.hot) n -= S.hotCut;
  else if (ten < S.cool) n += S.coolAdd;
  const won = beaten(b, team);
  if (won === 'boss') n += S.beatBoss;
  else if (won === 'admin') n += S.beatAdmin;
  if (who === 'boss' && def && t) n += S.perAdminGone * Math.max(0, def.admins.length - t.admins.length);
  n += S.perPage * Math.min(S.maxPages, b.debate?.pages ?? 0);
  n += S.perMastery * Math.max(0, masteryLevel(b.field.mastery['debate'] ?? 0) - 1);
  n += hqFx(b).debate;
  return clamp(n, -S.cap, S.cap);
}

const roundsFor = (who: string): string[] => (who === 'boss' ? D().rounds.map((r) => r.id) : [...D().adminRounds]);
const totalTurns = (l: LiveDebate): number => l.rounds.length * D().turnsPerRound;

/** Their opening line for a round (Values: their creed; Methods: your worst Ledger line, judged; The Future: their price). */
function opener(b: DominionBlock, team: string, who: string, round: string): string {
  const v = vars(b, team, who);
  const boss = bossOf(team);
  if (who !== 'boss' || !boss) return fill(round === 'future' ? D().admin.price : D().admin.creed, v);
  if (round === 'values') return fill(boss.creed, v);
  if (round === 'future') return fill(boss.price, v);
  const sin = sinOf(b);
  return sin ? fill(boss.judge, { ...v, sin }) : fill(boss.clean, v);
}

/** Sits the Boss (or an Admin) down at the table. Mutates `b`. */
export function openDebate(b: DominionBlock, team: string, who = 'boss'): void {
  const w = withDebate(b);
  const v = vars(b, team, who);
  const rounds = roundsFor(who);
  const key = who === 'boss' ? team : `${team}:${who}`;
  w.debate.tries[key] = { ...triesOf(b, key), week: weekOf(b) };
  const start = startConviction(b, team, who);
  w.debate.live = {
    team, who, name: who === 'boss' ? v.boss! : v.who!, rounds, start, conviction: start, turns: [], said: opener(b, team, who, rounds[0]!),
    sour: false, result: null, phase: 'argue', outcome: [], day: b.day,
  };
}

// ---------- a turn ----------

export interface Scored { marks: number[]; mod: number; move: number; claim: DebateTurn['claim']; held: boolean }

/** What a set line scores right now (the game, not the Boss, moves the bar). Pure: the Briefing Theater shows it. */
export function scoreLine(b: DominionBlock, l: LiveDebate, lineId: string): Scored | null {
  const line = lineDef(lineId);
  if (!line) return null;
  const M = D().move;
  const marks = [...line.marks];
  const boss = l.who === 'boss' ? bossOf(l.team) : undefined;
  if (boss) marks[0] = clamp(marks[0]! + boss.lean[line.stance], 0, 5);
  const claim = line.claim ?? null;
  const held = !claim || claimHolds(b, claim, l.team);
  if (claim && !held) marks[1] = marks[4] = 0;
  else if (claim) marks[1] = Math.min(5, marks[1]! + 1);
  let mod = 0;
  if (line.stance === 'threaten' && dreadOf(b) < 2 * fearOf(b, l.team)) mod -= M.threaten;
  if (line.stance === 'merger') {
    const s = strengths(b, l.team);
    if (s.yours <= s.theirs) mod -= M.merger;
  }
  if (l.sour) mod -= M.sour;
  const sum = marks.reduce((a, x) => a + x, 0);
  let move = clamp((sum - M.base) * M.k + mod, M.min, M.max);
  // The Debate Hall: the first argument always lands.
  if (!l.turns.length && hqFx(b).debateFloor) move = Math.max(move, Math.min(M.max, hqFx(b).debateFloor));
  return { marks, mod, move, claim, held };
}

export const resultOf = (conviction: number) => D().results.find((r) => conviction >= r.min)!;

export interface DebateOut { ok: boolean; run: RunState; notice: string | null }
const no = (run: RunState, notice: string | null): DebateOut => ({ ok: false, run, notice });
const withBlock = (run: RunState, b: DominionBlock): RunState => ({ ...run, expansion: { ...(run.expansion ?? {}), dominion: b } });

/** One turn: the line, its marks, the move, their reply (stored), then the next opener or the result. */
export function argue(content: Content, run: RunState, lineId: string): DebateOut {
  const block = run.expansion?.dominion;
  const l0 = block?.debate?.live;
  if (!block || !l0) return no(run, null);
  if (l0.phase !== 'argue') return no(run, null);
  if (l0.turns.some((t) => t.line === lineId)) return no(run, 'You already said that.');
  const out = structuredClone(run);
  const b = withDebate(out.expansion!.dominion!);
  const l = b.debate.live!;
  const s = scoreLine(b, l, lineId);
  if (!s) return no(run, null);
  const line = lineDef(lineId)!;
  const v = vars(b, l.team, l.who);
  const r = roll(b, run.seed, `turn-${l.day}-${l.turns.length}`);
  const pool = l.who === 'boss' ? bossOf(l.team)?.replies ?? D().admin.replies : D().admin.replies;
  let reply: string;
  if (!s.held) {
    const c = D().claims[s.claim!]!;
    reply = fill(c.callout, { ...v, boss: l.name, towns: heldTowns(b), s: heldTowns(b) === 1 ? '' : 's', funds: b.funds.toLocaleString('en-US'), members: b.members.length, sin: sinOf(b) ?? '' });
  } else if (s.marks[3] === 0) reply = fill(pick(r, pool.insult), v);
  else reply = fill(pick(r, s.move >= 10 ? pool.strong : s.move >= 0 ? pool.fair : pool.weak), v);
  l.turns.push({ line: lineId, stance: line.stance, marks: s.marks, mod: s.mod, move: s.move, claim: s.claim, held: s.held, reply });
  l.conviction = clamp(l.conviction + s.move, -100, 100);
  l.sour = s.marks[3] === 0;
  const n = l.turns.length;
  if (n < totalTurns(l)) {
    const per = D().turnsPerRound;
    l.said = n % per === 0 ? `${reply} ${opener(b, l.team, l.who, l.rounds[n / per]!)}` : reply;
    return { ok: true, run: withBlock(out, b), notice: null };
  }
  l.said = reply;
  const res = resultOf(l.conviction);
  l.result = res.id;
  if (l.who === 'boss' && res.id === 'convinced') {
    l.phase = 'choose';
    return { ok: true, run: withBlock(out, b), notice: null };
  }
  const done = l.who === 'boss' ? settleBoss(content, out, b, null) : settleAdmin(content, out, b);
  return { ok: true, run: done, notice: null };
}

/** Convinced: the player's pick, Merger or a loyal Branch. */
export function chooseDeal(content: Content, run: RunState, kind: 'merger' | 'branch'): DebateOut {
  const l = run.expansion?.dominion?.debate?.live;
  if (!l || l.phase !== 'choose') return no(run, null);
  const out = structuredClone(run);
  const b = withDebate(out.expansion!.dominion!);
  return { ok: true, run: settleBoss(content, out, b, kind), notice: null };
}

/** Walk out mid-Debate: it counts as a failed one, nothing else changes. */
export function walkOut(run: RunState): DebateOut {
  const l = run.expansion?.dominion?.debate?.live;
  if (!l || l.phase !== 'argue') return no(run, null);
  const out = structuredClone(run);
  const b = withDebate(out.expansion!.dominion!);
  fail(b, l.who === 'boss' ? l.team : `${l.team}:${l.who}`, false);
  b.debate.past.push({ day: b.day, team: l.team, name: l.name, result: 'unmoved', conviction: l.conviction });
  b.debate.live = null;
  return { ok: true, run: withBlock(out, b), notice: fill(T().walkOut!, { boss: l.name }) };
}

/** The result has been read: back to the HQ. */
export function closeDebate(run: RunState): DebateOut {
  const l = run.expansion?.dominion?.debate?.live;
  if (!l || l.phase !== 'done') return no(run, null);
  const out = structuredClone(run);
  const b = withDebate(out.expansion!.dominion!);
  b.debate.live = null;
  return { ok: true, run: withBlock(out, b), notice: l.outcome.join(' ') || null };
}

function fail(b: DominionBlock & { debate: DebateState }, key: string, forGood: boolean): void {
  const tr = { ...triesOf(b, key) };
  tr.fails += 1;
  tr.closed = forGood || tr.fails >= D().rules.maxFails;
  b.debate.tries[key] = tr;
}

function settleBoss(content: Content, run: RunState, b: DominionBlock & { debate: DebateState }, kind: 'merger' | 'branch' | null): RunState {
  const l = b.debate.live!;
  const R = D().rules;
  const lines: string[] = [];
  withRivals(b);
  if (l.result === 'unmoved') {
    addTension(b, l.team, R.unmoved);
    fail(b, l.team, false);
    lines.push(D().results[2]!.text);
  } else if (l.result === 'offended') {
    addTension(b, l.team, R.offended);
    fail(b, l.team, true);
    lines.push(D().results[3]!.text);
  } else {
    const deal: 'merger' | 'branch' = l.result === 'convinced' ? (kind ?? 'branch') : 'branch';
    lines.push(...makeDeal(content, run, b, l.team, deal, l.result === 'convinced'));
  }
  b.debate.past.push({ day: b.day, team: l.team, name: l.name, result: l.result!, conviction: l.conviction });
  l.outcome = lines;
  l.phase = 'done';
  return withBlock(run, b);
}

function settleAdmin(content: Content, run: RunState, b: DominionBlock & { debate: DebateState }): RunState {
  const l = b.debate.live!;
  const R = D().rules;
  const def = teamDef(l.team)!;
  const v = vars(b, l.team, l.who);
  const t = withRivals(b).rivals.teams[l.team]!;
  const key = `${l.team}:${l.who}`;
  const lines: string[] = [];
  if (l.result === 'convinced' || l.result === 'persuaded') {
    t.admins = t.admins.filter((a) => a !== l.who);
    addTension(b, l.team, R.adminWin);
    const a = def.admins.find((x) => x.id === l.who)!;
    const joined = join(content, run, b, [{ name: a.name, rank: 'admin', species: a.species }]);
    lines.push(fill(T().adminWon!, { ...v, joined: joined ? ` ${joined}` : '' }));
    b.debate.tries[key] = { ...triesOf(b, key), closed: true };
  } else if (l.result === 'offended') {
    const n = addTension(b, l.team, R.adminLose);
    fail(b, key, true);
    lines.push(fill(T().adminLost!, { ...v, n }));
  } else {
    fail(b, key, false);
    lines.push(fill(T().adminUnmoved!, v));
  }
  b.debate.past.push({ day: b.day, team: l.team, name: l.name, result: l.result!, conviction: l.conviction });
  l.outcome = lines;
  l.phase = 'done';
  return withBlock(run, b);
}

// ---------- Mergers and Branches ----------

interface Joiner { name: string; rank: string; species: string[] }

/** People who come over join as members while the HQ has room (rank Executive for a Boss, Admin for an Admin).
 * Returns the line, or ''. Mutates `b` and `run` (the new members' Pokémon). */
function join(content: Content, run: RunState, b: DominionBlock, who: Joiner[]): string {
  withCrew(b);
  const fit = who.slice(0, Math.max(0, b.rosterCap - b.members.length));
  const left = who.slice(fit.length);
  const C = DOMINION_DATA.crew;
  for (const j of fit) {
    const rank = C.ranks.find((r) => r.id === j.rank) ?? C.ranks[0]!;
    const green = C.greens[0]!;
    const id = `m${b.crew!.next++}`;
    const sp = j.species.find((s) => content.species.has(s));
    const team = sp ? [newMon(content, run, sp, Math.max(1, Math.min(b.levelCap, rank.level + 10)), 'p')] : [];
    const m: Member = {
      id, name: j.name, rank: rank.id, gender: 'm', look: DOMINION_DATA.start.members.grunt.look, level: Math.min(30, rank.level), stats: { brawn: 6, nerve: 7, wits: 7, charm: 7, stealth: 5 },
      loyalty: 50, morale: 50, traitPoints: 2, untrained: false, wage: rank.wage, team, joinedDay: b.day, unpaid: 0,
      crew: { ...freshCrew(green.id, green.temperaments[0]!, 'guard-hq', b.day), cls: j.rank === 'executive' ? 'Boss' : 'Admin', motive: 'power' },
    };
    crewOf(m);
    b.members.push(m);
  }
  const names = (xs: Joiner[]): string => xs.map((x) => x.name).join(', ');
  let line = fit.length ? fill(T().joined!, { names: names(fit), s: fit.length === 1 ? 's' : '' }) : '';
  if (left.length) line += fill(T().noRoom!, { names: names(left) }).trim() + ' ';
  return line.trim();
}

/** The Branch's weekly tribute (20% of what it makes: the money ladder × its size). */
export function tributeOf(b: DominionBlock, deal: Deal): number {
  const B = D().branch;
  return Math.round(ladder('M', tier(b)) * B.tributeK * (100 + B.perMember * deal.members) / 100);
}

function makeDeal(content: Content, run: RunState, b: DominionBlock & { debate: DebateState }, team: string, kind: 'merger' | 'branch', loyal: boolean): string[] {
  const def = teamDef(team)!;
  const boss = bossOf(team);
  const R = D().rules;
  const rv = withRivals(b).rivals;
  const t = rv.teams[team]!;
  const v = vars(b, team, 'boss');
  t.tension = 0;
  t.truce = null;
  t.raid = null;
  rv.cards = rv.cards.filter((c) => c.team !== team);
  const deal: Deal = {
    kind, since: b.day, loyal, risk: loyal ? Math.round(R.risk / 2) : R.risk, demand: null, towns: [], base: {}, members: 0,
    order: boss?.order ?? 'expand', hold: null, holdAt: 0, hero: 0,
  };
  const out: string[] = [];
  if (kind === 'merger') {
    for (const s of def.sites) {
      if (t.sites[s.id] === 'theirs') t.sites[s.id] = 'yours';
      const ds = b.field.districts[s.district];
      if (ds) {
        ds.control = clamp(ds.control + ds.rival / 2, 0, 100);
        ds.rival = 0;
      }
    }
    const standing = def.admins.filter((a) => t.admins.includes(a.id));
    t.admins = [];
    const joined = join(content, run, b, [{ name: def.boss.name, rank: 'executive', species: def.boss.species }, ...standing.map((a) => ({ name: a.name, rank: 'admin', species: a.species }))]);
    out.push(fill(T().merger!, { ...v, joined: joined ? `${joined} ` : '' }));
  } else {
    deal.members = D().branch.members + D().branch.perAdmin * t.admins.length;
    if (!loyal && boss) {
      const r = roll(b, run.seed, `demand-${b.day}`);
      deal.demand = pick(r, boss.demands);
      if (deal.demand === 'towns') {
        deal.towns = Object.entries(b.field.districts).filter(([, d]) => d.rival > 0).sort((x, y) => y[1].rival - x[1].rival || x[0].localeCompare(y[0])).slice(0, 2).map(([id]) => id);
      } else if (deal.demand === 'hq') {
        const hq = def.sites.find((s) => s.hq) ?? def.sites[0];
        deal.towns = hq ? [hq.district] : [];
      }
      for (const d of deal.towns) deal.base[d] = b.field.districts[d]?.control ?? 0;
    }
    out.push(fill(T().branch!, { ...v, tribute: money(tributeOf(b, deal)) }));
    if (deal.demand) out.push(fill(T().demand!, { demand: demandText(deal) }));
  }
  b.debate.deals[team] = deal;
  return out;
}

const townName = (id: string): string => DOMINION_DATA.field.districts.find((d) => d.id === id)?.name ?? id;
export function demandText(deal: Deal): string {
  const d = D().demands.find((x) => x.id === deal.demand);
  if (!d) return '';
  return fill(d.text, { towns: deal.towns.map(townName).join(' and '), town: deal.towns.map(townName).join(' and ') });
}

// ---------- the Branches, every night and every Monday (World Turn, after the rival step) ----------

function bestTown(b: DominionBlock): string | null {
  const xs = Object.entries(b.field.districts).filter(([, d]) => d.control > 0).sort((x, y) => y[1].control - x[1].control || x[0].localeCompare(y[0]));
  return xs[0]?.[0] ?? null;
}
function weakTown(b: DominionBlock): string | null {
  const xs = Object.entries(b.field.districts).filter(([, d]) => d.control > 0 && d.control < 100).sort((x, y) => x[1].control - y[1].control || x[0].localeCompare(y[0]));
  return xs[0]?.[0] ?? null;
}

export function branchStep(block: DominionBlock, seed: string): string[] {
  if (!block.debate || !Object.keys(block.debate.deals).length) return [];
  const b = withDebate(block);
  const out: string[] = [];
  const B = D().branch, R = D().rules;
  const monday = b.day > 1 && (b.day - 1) % WEEK() === 0;
  for (const [team, deal] of Object.entries(b.debate.deals)) {
    if (deal.kind !== 'branch') continue;
    const def = teamDef(team);
    if (!def) continue;
    const v = vars(b, team, 'boss');
    // The demand (A4): broken once, it's gone, and the Branch may walk.
    if (deal.demand === 'towns' || deal.demand === 'hq') {
      const bad = deal.towns.find((d) => {
        const c = b.field.districts[d]?.control ?? 0;
        return deal.demand === 'towns' ? c >= R.townsTaken && c > (deal.base[d] ?? 0) : c > (deal.base[d] ?? 0) + R.hqSlack;
      });
      if (bad) {
        const text = D().demands.find((x) => x.id === deal.demand)!.broken!;
        deal.risk = Math.min(100, deal.risk + R.breakRisk);
        deal.demand = null;
        out.push(fill(T().broken!, { ...v, line: fill(text, { town: townName(bad) }), n: R.breakRisk }));
        if (roll(b, seed, `walk-${b.day}-${team}`).int(1, 100) <= R.walk) {
          delete b.debate.deals[team];
          const t = withRivals(b).rivals.teams[team]!;
          t.tension = Math.max(t.tension, R.walkTension);
          t.peak = Math.max(t.peak, t.tension);
          out.push(fill(T().walked!, { ...v, tension: t.tension }));
          continue;
        }
      }
    }
    // Tonight's order (A6).
    if (deal.order === 'expand') {
      const d = weakTown(b);
      if (d) b.field.districts[d]!.control = clamp(b.field.districts[d]!.control + B.expand, 0, 100);
    } else if (deal.order === 'defend') addHeat(b, DOMINION_DATA.field.hq, -B.defend);
    else if (deal.order === 'hold' && deal.hold) {
      const ds = b.field.districts[deal.hold];
      if (ds && ds.control < deal.holdAt) ds.control = deal.holdAt;
    }
    if (!monday) continue;
    // Monday: last week's order pays off, the tribute comes in, and the Branch waits for this week's order.
    if (deal.order === 'recruit') deal.members += B.recruit;
    if (deal.order === 'hero') deal.hero += 1;
    const amount = tributeOf(b, deal);
    b.funds += amount;
    b.earned += amount;
    out.push(fill(T().tribute!, { ...v, amount: money(amount) }));
    deal.order = bossOf(team)?.order ?? 'expand';
    deal.hold = null;
    deal.holdAt = 0;
    setHold(b, deal);
    const rv = withRivals(b).rivals;
    rv.cards = rv.cards.filter((c) => !(c.team === team && c.kind === 'directive'));
    rv.cards.push({ kind: 'directive', team, ref: 'branch-directive', who: def.boss.name, amount: 0, district: null, ask: null, until: b.day + WEEK() - 1 });
  }
  return out;
}

function setHold(b: DominionBlock, deal: Deal): void {
  if (deal.order !== 'hold') return;
  deal.hold = bestTown(b);
  deal.holdAt = deal.hold ? b.field.districts[deal.hold]!.control : 0;
}

// ---------- hooks: the Boss's Debate action, Write a Manifesto, the Rival File's cards ----------

const firstTeam = (): string | null => teamsHere()[0]?.id ?? null;

addActionGate((b, def) => {
  if (def.id !== 'debate') return null;
  const team = firstTeam();
  return team ? whyNot(b, team, 'action') : T().noTeam!;
});
addActEffect('debate', (b) => {
  const team = firstTeam();
  if (!team || whyNot(b, team, 'action')) return [];
  openDebate(b, team);
  return [fill(T().meet!, vars(b, team))];
});
addActEffect('manifesto', (b) => {
  const w = withDebate(b);
  const max = D().start.maxPages;
  w.debate.pages = Math.min(max, w.debate.pages + 1);
  return [`Your manifesto: ${w.debate.pages} of ${max} pages. Each page is +${D().start.perPage} Conviction when a Debate starts.`];
});

/** A Debate card (a summit, a street meeting, an Admin who might be talked round): sit down now, or not. */
setCardHook('debate', (b, c, index, choice) => {
  const rv = b.rivals!;
  if (choice !== 0) {
    rv.cards.splice(index, 1);
    return { ok: true, block: b, notice: `You let ${c.who} go.` };
  }
  const def = teamDef(c.team);
  const who = def?.admins.find((a) => a.name === c.who)?.id ?? 'boss';
  const why = whyNot(b, c.team, 'invite', who);
  if (why) return { ok: false, block: b, notice: why };
  rv.cards.splice(index, 1);
  openDebate(b, c.team, who);
  return { ok: true, block: b, notice: null };
}, () => ['Sit down for a Debate', 'Not now']);
/** The Branch Directive (A6): this week's order. */
setCardHook('directive', (b, c, index, choice) => {
  const deal = b.debate?.deals[c.team];
  const dir = D().directives[choice];
  if (!deal || !dir) return { ok: false, block: b, notice: null };
  deal.order = dir.id;
  deal.hold = null;
  setHold(b, deal);
  b.rivals!.cards.splice(index, 1);
  const what = dir.id === 'hold' && deal.hold ? `${dir.name}: ${townName(deal.hold)}` : dir.name;
  return { ok: true, block: b, notice: fill(T().order!, { ...vars(b, c.team), order: what }) };
}, () => directiveLabels());

/** The Branch Directive's five orders, with their numbers. */
export const directiveLabels = (): string[] =>
  D().directives.map((d) => fill(`${d.name}: ${d.what}`, { n: d.id === 'recruit' ? D().branch.recruit : d.id === 'expand' ? D().branch.expand : D().branch.defend }));

/** After the rival step: the Branches' nights. */
addWorldStep('rivals', branchStep);

export type { RivalOut };
