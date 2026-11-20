// DOMINION slice D9, the rival team (Part 4 §1-2, Part 3 §4, Part 9 A1 and A7; lists/rival-team-actions.md and
// outside-interactions.md section F). Each region's canon team watches the player through Tension (0-100, six stages).
// On day 7 it picks three priorities for the week (A7) and gets Action Points; on the World Turn (third, after the crew
// and the police) it spends them on the 150 listed actions its stage allows, at the tier the Boss's best Pokémon sets.
// Spies, sabotage, raids on the HQ, the Boss's own raid (a battle at the door), truces and the player's answers live here.
// Pure: every roll is on a named stream (`dominion-rival-<team>`, `dominion-rival-card`), so no older roll moves.

import { hashSeed, Rng } from '../rng';
import type { RunState } from '../state';
import { DOMINION_DATA } from './data';
import type {
  DominionBlock, FieldFight, Member, RivalAction, RivalCard, RivalKind, RivalsState, RivalTeam, RivalTeamState, Room, StreetChoice,
} from './schema';
import { RIVAL_STAGES } from './schema';
import { addWorldStep, fill } from './worldTurn';
import { addActEffect, addActionGate, addFightSettler, addHeat, districtDef, setRivalFoe, statusOf, targetDef } from './field';
import { addLoyalty, addMorale, addTaskKind, crewOf, freshCrewState, leave, type TaskCtx } from './crew';
import { buildingDef, hqFx, hqOf, spend, working } from './hqFx';
import { defense, roomName, wear } from './hq';
import { makeLead } from './recruit';

const RV = () => DOMINION_DATA.rivals;
const RA = () => DOMINION_DATA.rivalActions;
const L = () => DOMINION_DATA.rivals.lines;
const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, Math.round(n)));
const rngOf = (seed: string, ...key: (string | number)[]): Rng => new Rng(hashSeed([seed, ...key].join('::')));
const WEEK = (): number => DOMINION_DATA.start.clock.weekLength;
const money = (n: number): string => n.toLocaleString('en-US');

// ---------- lookups ----------

/** The rival teams of the region being played (Kanto's Team Rocket until the region slices). */
export const teamsHere = (): RivalTeam[] => RV().teams.filter((t) => t.on && t.region === RV().region);
export const teamDef = (id: string): RivalTeam | undefined => RV().teams.find((t) => t.id === id);
export const rivalAction = (id: string): RivalAction | undefined => RA().actions.find((a) => a.id === id);
export const stageIndex = (tension: number): number => {
  let i = 0;
  RV().stages.forEach((s, k) => {
    if (tension >= s.min) i = k;
  });
  return i;
};
export const stageDef = (i: number) => RV().stages[Math.max(0, Math.min(5, i))]!;
const actionStage = (a: RivalAction): number => RIVAL_STAGES.indexOf(a.stage);

/** The tier (rival-team-actions.md): the Boss's best Pokémon level ÷ 12.5, rounded, at least 1. Past 8 it keeps growing. */
export const tierOf = (top: number): number => Math.max(1, Math.round(top / 12.5));
/** A ladder's number at a tier; past tier 8 each tier adds the T7-to-T8 gap again. */
export function ladder(key: keyof typeof DOMINION_DATA.rivalActions.ladders, tier: number): number {
  const v = RA().ladders[key];
  if (tier <= 8) return v[tier - 1]!;
  return Math.round(v[7]! + (tier - 8) * (v[7]! - v[6]!));
}

// ---------- the block's `rivals` ----------

function freshTeam(t: RivalTeam, b: DominionBlock): RivalTeamState {
  return {
    tension: RV().tension.start, peak: RV().tension.start, stage: 0, quiet: 0, plan: [], planDay: 0, ap: 0,
    admins: t.admins.map((a) => a.id), power: 0, research: 0, intel: 0, spies: 0, arm: 0, hide: 0, truce: null,
    sites: Object.fromEntries(t.sites.map((s) => [s.id, 'theirs' as const])), raid: null, log: [], seen: seenNow(b),
  };
}
const yourControl = (b: DominionBlock): number =>
  Object.entries(b.field.districts).reduce((a, [, d]) => a + (d.rival > 0 ? d.control : 0), 0);
const seenNow = (b: DominionBlock) => ({ control: yourControl(b), members: b.members.length, hq: b.hqLevel });

/** A save from before D9 (or a new run) has no `rivals`: every team starts Unaware. Read-only. */
export function rivalsOf(b: DominionBlock): RivalsState {
  if (b.rivals) return b.rivals;
  return {
    teams: Object.fromEntries(teamsHere().map((t) => [t.id, freshTeam(t, b)])), mySpies: [], rent: null, recruit: null, jam: 0,
    closed: [], turned: [], held: [], cards: [], street: [], rolls: 0, top: 5,
  };
}
/** Fills `rivals` in place (and any team of the region that's missing) and returns the block. */
export function withRivals<T extends DominionBlock>(b: T): T & { rivals: RivalsState } {
  b.rivals ??= rivalsOf(b);
  for (const t of teamsHere()) b.rivals.teams[t.id] ??= freshTeam(t, b);
  return b as T & { rivals: RivalsState };
}
/** The session tells the block the Boss's best level after each step (the tier is re-read every morning). */
export function noteTop(b: DominionBlock, run: Pick<RunState, 'party'>): void {
  const top = Math.max(1, ...run.party.map((m) => m.level));
  if (b.rivals) b.rivals.top = top;
}
const rv = (b: DominionBlock): RivalsState => withRivals(b).rivals;
const ts = (b: DominionBlock, team: string): RivalTeamState => rv(b).teams[team]!;
export const tier = (b: DominionBlock): number => tierOf(rivalsOf(b).top);

const log = (b: DominionBlock, team: string, text: string): void => {
  const t = ts(b, team);
  t.log.push({ day: b.day, text });
  t.log = t.log.filter((l) => l.day > b.day - WEEK()).slice(-8);
};

/** Tension up or down (a rise resets the quiet count). Returns the change. */
export function addTension(b: DominionBlock, team: string, n: number): number {
  const t = ts(b, team);
  const was = t.tension;
  t.tension = clamp(t.tension + n);
  t.peak = Math.max(t.peak, t.tension);
  if (t.tension > was) t.quiet = 0;
  return t.tension - was;
}
/** The team with a stake in a district (the most rival Control there), or the region's first team. */
export function teamAt(_b: DominionBlock, _district: string | null): string {
  return teamsHere()[0]!.id;
}

// ---------- the night alerts (mockup 2: "ROCKET 3:40 ...") ----------

const TIMES = ['2:20', '2:55', '3:40', '4:10', '4:35', '5:05', '5:30', '5:50'];
function say(b: DominionBlock, team: string, text: string, out: string[]): void {
  out.push(text);
  const crew = (b.crew ??= freshCrewState());
  const mine = crew.alerts.filter((a) => a.kind === 'rival').length;
  crew.alerts.push({ kind: 'rival', time: TIMES[Math.min(mine, TIMES.length - 1)]!, text });
  log(b, team, text);
}

// ---------- the World Turn step (Part 9 A1, third) ----------

/** Raid odds against the HQ tonight: the hold chance (Part 3 §4) from Defense, guards, spies and what they know. */
export function holdChance(b: DominionBlock, team: string, guards: number): number {
  const R = RV().raid, t = ts(b, team), r = rv(b);
  const mine = r.mySpies.filter((s) => s.team === team).length;
  let p = R.hold + defense(b) * R.perDefense + guards * R.perGuard + mine * R.mySpy - t.spies * R.theirSpy - t.intel - t.arm + hqFx(b).raidDef * R.perDefense;
  if (r.jam === b.day) p -= R.jam;
  return clamp(p, R.min, R.max);
}
/** Members on a guard task who did it last night (the crew step ran first). */
const guardsTonight = (b: DominionBlock): Member[] =>
  b.members.filter((m) => {
    const c = crewOf(m);
    const task = DOMINION_DATA.tasks.find((x) => x.id === c.lastTask);
    return !c.out && task?.effect?.kind === 'guard' && c.last === 'success';
  });

function growthTension(b: DominionBlock, team: string): void {
  const T = RV().tension, t = ts(b, team), now = seenNow(b);
  let n = 0;
  if (now.control > t.seen.control) n += Math.floor((now.control - t.seen.control) / T.perControl);
  if (now.members > t.seen.members) n += (now.members - t.seen.members) * T.perMember;
  if (now.hq > t.seen.hq) n += (now.hq - t.seen.hq) * T.perHqLevel;
  // Control only counts in whole steps: keep the remainder for next time.
  t.seen = { control: now.control > t.seen.control ? t.seen.control + Math.floor((now.control - t.seen.control) / T.perControl) * T.perControl : now.control, members: now.members, hq: now.hq };
  if (n > 0) addTension(b, team, n);
}

function pickPlan(b: DominionBlock, team: RivalTeam, r: Rng): string[] {
  const P = RV().plan, w = P.personalities[team.boss.personality] ?? {};
  const pool = P.priorities.map((p) => ({ id: p.id, w: Math.max(1, w[p.id] ?? 1) }));
  const out: string[] = [];
  while (out.length < P.count && pool.length) {
    const total = pool.reduce((a, x) => a + x.w, 0);
    let k = r.int(1, total);
    const i = pool.findIndex((x) => (k -= x.w) <= 0);
    out.push(pool[i]!.id);
    pool.splice(i, 1);
  }
  void b;
  return out;
}
const priorityName = (id: string): string => RV().plan.priorities.find((p) => p.id === id)?.name ?? id;
/** Whether the player can see this week's plan: one of their spies is inside, or an Operations Room at HQ Lv. 3+ (A7). */
export function planSeen(b: DominionBlock, team: string): boolean {
  const r = rivalsOf(b);
  if (r.mySpies.some((s) => s.team === team) || hqFx(b).intel > 0) return true;
  if (b.hqLevel >= RV().plan.seeHq && (b.hq?.rooms ?? []).some((x) => x.id === 'operations-room' && working(x))) return true;
  return b.flags.includes(planFlag(b, team));
}
/** A flag that the plan was learned this week (a deal, a tail, a wire). */
const planFlag = (b: DominionBlock, team: string): string => `plan:${team}:${b.day - ((b.day - 1) % WEEK())}`;
const learnPlan = (b: DominionBlock, team: string): void => {
  b.flags = [...b.flags.filter((f) => !f.startsWith(`plan:${team}:`)), planFlag(b, team)];
};

/** Can the action be done to this player right now (it needs something of theirs to hit)? */
function canDo(b: DominionBlock, team: string, a: RivalAction): boolean {
  const r = rv(b), t = ts(b, team), live = b.members.filter((m) => !crewOf(m).out);
  const rooms = (b.hq?.rooms ?? []).filter((x) => working(x));
  switch (a.kind) {
    case 'cond': case 'closed': case 'burn': case 'smash': return rooms.length > 0 || a.kind === 'smash';
    case 'racket': return b.field.rackets.length > 0;
    case 'stealMon': return (b.crew?.stores.length ?? 0) > 0;
    case 'kidnap': return live.length > 1;
    case 'poach': case 'loyalty1': return b.members.length > 1;
    case 'mood': case 'loyalty': return b.members.length > 0;
    case 'truce': return !t.truce && t.tension >= RV().truce.minTension && !r.cards.some((c) => c.kind === 'truce');
    case 'bossRaid': return t.raid === null;
    case 'fight': case 'demand': case 'deal': case 'defect': return r.cards.filter((c) => c.team === team).length < 3 && (a.kind !== 'defect' || t.admins.length > 1);
    case 'sweep': return r.mySpies.some((s) => s.team === team);
    case 'spy': return t.spies < RV().spy.max;
    // D13: an invitation to a Debate, while talks are still open with them (debate.ts).
    case 'debate': return !r.cards.some((c) => c.team === team && c.kind === 'debate') && !b.debate?.tries[team]?.closed && (a.id !== 'break-a-coalition' || t.admins.length > 0);
    default: return true;
  }
}

function chooseAction(b: DominionBlock, team: string, r: Rng): RivalAction | null {
  const t = ts(b, team), P = RV().plan, stage = stageIndex(t.tension);
  const plan = new Set(t.plan.flatMap((p) => P.priorities.find((x) => x.id === p)?.cats ?? []));
  const rooms = (b.hq?.rooms ?? []).length;
  const pool = RA().actions.filter((a) => a.kind && actionStage(a) <= stage && canDo(b, team, a)).map((a) => {
    let w = 1 + actionStage(a);
    if (plan.has(a.cat)) w += P.inPlan;
    if (a.cat === 'B' || a.cat === 'C') w += rooms * P.perRoom;
    if (a.cat === 'D') w += b.members.length * P.perMember;
    return { a, w };
  });
  if (!pool.length) return null;
  const total = pool.reduce((s, x) => s + x.w, 0);
  let k = r.int(1, total);
  return pool.find((x) => (k -= x.w) <= 0)!.a;
}

/** The rivals' World Turn step: each team in turn, on its own stream. */
export function rivalStep(block: DominionBlock, seed: string): string[] {
  const b = withRivals(block);
  const out: string[] = [];
  const r = b.rivals;
  // Things that end with the night: shut rooms open, turned Rackets come back, a held member is let go.
  for (const c of [...r.closed]) {
    if (c.until > b.day) continue;
    const room = b.hq?.rooms.find((x) => x.uid === c.uid);
    if (room) room.shut = false;
    r.closed = r.closed.filter((x) => x !== c);
  }
  for (const x of [...r.turned]) {
    if (x.until > b.day) continue;
    if (!b.field.rackets.some((k) => k.target === x.racket.target)) b.field.rackets.push(x.racket);
    r.turned = r.turned.filter((y) => y !== x);
  }
  for (const h of [...r.held]) {
    if (b.day - h.day < RV().held.days) continue;
    const m = b.members.find((x) => x.id === h.member);
    free(b, h.member);
    if (m) say(b, h.team, fill(L().freed!, { team: teamDef(h.team)!.name, member: m.name, days: RV().held.days }), out);
  }
  if (r.rent && r.rent.until <= b.day) r.rent = null;
  if (r.recruit && r.recruit.until <= b.day) r.recruit = null;
  r.cards = r.cards.filter((c) => {
    if (c.until > b.day) return true;
    if (c.kind !== 'street') out.push(fill(L().cardGone!, { who: c.who }));
    return false;
  });
  for (const team of teamsHere()) {
    // D13: a team that's your Branch or merged into you has stopped acting against you (debate.ts runs its Branch).
    if (b.debate?.deals[team.id]) continue;
    const t = r.teams[team.id]!;
    if (t.truce?.until && t.truce.until <= b.day) t.truce = null;
    out.push(...teamNight(b, team, seed));
  }
  return out;
}

function teamNight(b: DominionBlock & { rivals: RivalsState }, team: RivalTeam, seed: string): string[] {
  const out: string[] = [];
  const t = ts(b, team.id), T = RV().tension;
  const rng = rngOf(seed, `dominion-rival-${team.id}`, b.day);
  const v = { team: team.name, tag: team.tag, boss: team.boss.name };
  growthTension(b, team.id);
  // Time cools it (after a few quiet nights); a truce pays its tribute on bill day.
  t.quiet += 1;
  if (t.quiet > T.quietNights && !t.truce) t.tension = clamp(t.tension - T.decay);
  if (t.truce && t.truce.tribute > 0 && b.day % WEEK() === 0) {
    if (b.funds >= t.truce.tribute) {
      spend(b, t.truce.tribute);
      t.truce.paid = b.day;
      t.tension = clamp(t.tension - T.truceWeek);
      say(b, team.id, fill(L().trucePaid!, { ...v, tribute: money(t.truce.tribute), drop: T.truceWeek }), out);
    } else {
      t.truce = null;
      addTension(b, team.id, T.breakTruce);
      say(b, team.id, fill(L().truceGone!, v), out);
    }
  }
  // The stage, announced when it changes.
  const stage = stageIndex(t.tension);
  if (stage !== t.stage) {
    const s = stageDef(stage);
    say(b, team.id, fill(stage > t.stage ? L().stageUp! : L().stageDown!, { ...v, stage: s.name, does: s.does }), out);
    // A stage reached mid-week brings its Action Points now.
    if (stage > t.stage && t.planDay) t.ap += stage - t.stage;
    t.stage = stage;
  }
  // Day 7 (A7): the week's plan and Action Points.
  if (b.day % WEEK() === 0 || !t.planDay) {
    t.plan = pickPlan(b, team, rng);
    t.planDay = b.day;
    t.ap = stage === 0 ? 0 : RV().ap.base + stage + t.admins.length * RV().ap.perAdmin;
    const P = RV().plan;
    if (t.plan.includes('research')) t.research = clamp(t.research + P.research);
    if (t.plan.includes('law') && stage > 0 && !t.truce) {
      addHeat(b, DOMINION_DATA.field.hq, P.lawHeat);
      say(b, team.id, fill(L().law!, { ...v, pct: P.lawHeat }), out);
    }
    if (stage > 0) {
      const seen = planSeen(b, team.id);
      say(b, team.id, seen ? fill(L().plan!, { ...v, plan: t.plan.map(priorityName).join(' · ') }) : fill(L().planHidden!, { ...v, hq: P.seeHq }), out);
    }
  }
  // The Boss's own raid (Tension 80+): warned, then fought at the door in the morning.
  if (stage === 5 && t.raid === null && !t.truce) {
    t.raid = b.day + Math.max(1, RV().bossRaid.warn + Math.floor(hqFx(b).warn));
    say(b, team.id, fill(L().bossRaid!, { ...v, nights: `${t.raid - b.day} night${t.raid - b.day === 1 ? '' : 's'}` }), out);
  }
  if (t.raid !== null && t.raid <= b.day && !b.field.fight) {
    b.field.fight = { why: 'rival', foe: 'rival', begun: false, action: 'boss-raid', target: 'boss', district: DOMINION_DATA.field.hq, pass: false, big: false, wager: 0, racket: team.id };
    say(b, team.id, fill(L().bossAtDoor!, v), out);
  }
  // One action tonight, if the week's points allow (spread over the nights left). A truce stops the pressure.
  const left = WEEK() - (b.day % WEEK());
  if (t.truce || t.ap < 1 || rng.int(1, Math.max(1, left)) > t.ap) return out;
  const a = chooseAction(b, team.id, rng);
  if (!a) return out;
  t.ap -= 1;
  out.push(...doAction(b, team, a, rng));
  return out;
}

// ---------- carrying out an action ----------

type Ctx = { b: DominionBlock & { rivals: RivalsState }; team: RivalTeam; a: RivalAction; r: Rng; tier: number; out: string[]; v: Record<string, string | number> };
const num = (c: Ctx, key: Parameters<typeof ladder>[0]): number => ladder(key, c.tier);
const pickOf = <T>(r: Rng, xs: readonly T[]): T | undefined => (xs.length ? xs[r.int(0, xs.length - 1)] : undefined);
const workingRooms = (b: DominionBlock): Room[] => (b.hq?.rooms ?? []).filter((x) => working(x));
const line = (c: Ctx, key: string, extra: Record<string, string | number> = {}): void => say(c.b, c.team.id, fill(L()[key] ?? key, { ...c.v, ...extra }), c.out);
const card = (c: Ctx, k: RivalCard['kind'], who: string, amount: number, ask: RivalCard['ask'] = null, district: string | null = null): void => {
  c.b.rivals.cards.push({ kind: k, team: c.team.id, ref: c.a.id, who, amount, district, ask, until: c.b.day + RV().cards.days });
};
const adminName = (team: RivalTeam, t: RivalTeamState, r: Rng): string => {
  const id = pickOf(r, t.admins);
  return team.admins.find((a) => a.id === id)?.name ?? team.boss.name;
};

/** A raid-type hit: the HQ may hold (Defense, guards, spies). True when it got through. */
function raidGetsIn(c: Ctx): boolean {
  const guards = guardsTonight(c.b);
  const hold = holdChance(c.b, c.team.id, guards.length);
  const t = ts(c.b, c.team.id);
  t.arm = 0;
  if (c.r.int(1, 100) <= hold) {
    const g = guards[0]?.name ?? 'The HQ';
    t.power -= RV().raid.lossPower;
    addTension(c.b, c.team.id, RV().tension.raidHeld);
    line(c, 'held', { guard: g, n: num(c, 'S') });
    return false;
  }
  if (c.b.rivals.jam === c.b.day) line(c, 'jammed');
  c.b.flags = [...c.b.flags.filter((f) => !f.startsWith('raided:')), `raided:${c.b.day}`];
  return true;
}

function takeMember(c: Ctx, m: Member): void {
  const ransom = Math.round(ladder('M', c.tier) * RV().held.ransomK);
  hold(c.b, m, c.team.id, ransom);
  line(c, 'kidnap', { member: m.name, ransom: money(ransom) });
}
function hold(b: DominionBlock, m: Member, team: string, ransom: number): void {
  crewOf(m).out = { why: 'held', days: RV().held.days };
  m.crew = crewOf(m);
  rv(b).held.push({ member: m.id, team, day: b.day, ransom });
  rv(b).mySpies = rv(b).mySpies.filter((s) => s.member !== m.id);
}
function free(b: DominionBlock, memberId: string): void {
  rv(b).held = rv(b).held.filter((h) => h.member !== memberId);
  const m = b.members.find((x) => x.id === memberId);
  if (m && crewOf(m).out?.why === 'held') {
    m.crew = { ...crewOf(m), out: null };
  }
}

const KINDS: Record<RivalKind, (c: Ctx) => void> = {
  spy: (c) => {
    const t = ts(c.b, c.team.id);
    const n = Math.min(RV().spy.max - t.spies, num(c, 'N'));
    t.spies += Math.max(1, n);
    t.intel = clamp(t.intel + num(c, 'P'));
    // Counter-intelligence rooms catch some at the door.
    if (hqFx(c.b).spyCatch && c.r.int(1, 100) <= hqFx(c.b).spyCatch) {
      t.spies -= 1;
      line(c, 'spyCaught', { member: 'The Security Room' });
    } else line(c, 'spy', { n: t.spies });
  },
  intel: (c) => {
    const t = ts(c.b, c.team.id);
    t.intel = clamp(t.intel + num(c, 'P'));
    line(c, 'intel', { pct: num(c, 'P') });
  },
  heat: (c) => {
    const d = pickOf(c.r, Object.keys(c.b.field.districts).filter((id) => c.b.field.districts[id]!.control > 0)) ?? DOMINION_DATA.field.hq;
    addHeat(c.b, d, num(c, 'H'));
    line(c, 'heat', { district: districtDef(d)?.name ?? d, n: num(c, 'H') });
  },
  rent: (c) => {
    const r = c.b.rivals;
    r.rent = { pct: clamp((r.rent?.pct ?? 0) + num(c, 'P')), until: c.b.day + 4 * WEEK() };
    line(c, 'rent', { pct: r.rent.pct, weeks: 4 });
  },
  money: (c) => {
    const amount = Math.max(0, Math.min(num(c, 'M'), Math.max(0, c.b.funds)));
    spend(c.b, amount);
    line(c, 'money', { amount: money(amount) });
  },
  sweep: (c) => {
    const mine = c.b.rivals.mySpies.filter((s) => s.team === c.team.id);
    for (const s of mine) {
      const m = c.b.members.find((x) => x.id === s.member);
      if (!m) continue;
      if (c.r.int(1, 100) <= num(c, 'P') + RV().spy.sweepBase - (hqFx(c.b).cipher ?? 0)) {
        hold(c.b, m, c.team.id, Math.round(ladder('M', c.tier) * RV().held.ransomK));
        line(c, 'spyLost', { member: m.name });
      } else line(c, 'sweepMissed', { member: m.name });
    }
  },
  closed: (c) => {
    const room = pickOf(c.r, workingRooms(c.b));
    if (!room) return line(c, 'noRoom');
    const days = num(c, 'D');
    room.shut = true;
    c.b.rivals.closed.push({ uid: room.uid, until: c.b.day + days });
    if (c.a.n === 14) wear(c.b, room, cut(c, num(c, 'P')));
    line(c, 'closed', { room: roomName(room), days });
  },
  cond: (c) => {
    const room = pickOf(c.r, workingRooms(c.b));
    if (!room) return line(c, 'noRoom');
    const pct = cut(c, num(c, 'P'));
    const gone = wear(c.b, room, pct);
    line(c, 'cond', { room: roomName(room), pct });
    if (gone) c.out.push(gone);
    if (c.a.n === 12) regard(c, DOMINION_DATA.field.hq, -1);
  },
  mood: (c) => {
    for (const m of c.b.members) addMorale(m, -num(c, 'R'));
    line(c, 'mood', { n: num(c, 'R') });
  },
  jam: (c) => {
    c.b.rivals.jam = c.b.day + 1;
    line(c, 'jam');
  },
  racket: (c) => {
    const k = pickOf(c.r, c.b.field.rackets);
    if (!k) return line(c, 'noRacket');
    const weeks = Math.max(1, num(c, 'D'));
    c.b.field.rackets = c.b.field.rackets.filter((x) => x !== k);
    c.b.rivals.turned.push({ racket: k, team: c.team.id, until: c.b.day + weeks * WEEK() });
    line(c, 'racket', { target: targetDef(k.target)?.target.name ?? k.target, weeks });
  },
  smash: (c) => {
    if (!raidGetsIn(c)) return;
    const room = pickOf(c.r, workingRooms(c.b));
    const amount = Math.max(0, Math.min(num(c, 'M'), Math.max(0, c.b.funds - safeMoney(c.b))));
    spend(c.b, amount);
    line(c, 'smash', { n: num(c, 'S'), room: room ? roomName(room) : 'warehouse', amount: money(amount) });
    if (c.a.n === 26) for (const m of c.b.members) crewOf(m).fatigue = clamp(crewOf(m).fatigue + 20);
  },
  vault: (c) => {
    if (!raidGetsIn(c)) return;
    const amount = Math.max(0, Math.round((Math.max(0, c.b.funds - safeMoney(c.b)) * num(c, 'P')) / 100));
    spend(c.b, amount);
    line(c, 'vault', { amount: money(amount) });
  },
  stealMon: (c) => {
    const st = c.b.crew!;
    if (!st.stores.length) return line(c, 'noMon');
    if (!raidGetsIn(c)) return;
    const i = c.r.int(0, st.stores.length - 1);
    const [mon] = st.stores.splice(i, 1);
    line(c, 'stealMon', { mon: mon!.speciesId.replace(/-/g, ' ').replace(/\b\w/g, (x) => x.toUpperCase()) });
  },
  kidnap: (c) => {
    if (!raidGetsIn(c)) return;
    const m = pickOf(c.r, c.b.members.slice(1).filter((x) => !crewOf(x).out));
    if (m) takeMember(c, m);
  },
  burn: (c) => {
    const room = pickOf(c.r, workingRooms(c.b));
    if (!room) return line(c, 'noRoom');
    if (!raidGetsIn(c)) return;
    if (hqFx(c.b).fireCut >= 50 && c.r.int(1, 100) <= hqFx(c.b).fireCut) {
      wear(c.b, room, 50);
      return line(c, 'cond', { room: roomName(room), pct: 50 });
    }
    const gone = wear(c.b, room, 100);
    line(c, 'burn', { room: roomName(room) });
    if (gone) c.out.push(gone);
  },
  poach: (c) => {
    const weak = c.b.members.slice(1).filter((m) => m.loyalty < 50 && !crewOf(m).out);
    const m = pickOf(c.r, weak.length ? weak : c.b.members.slice(1));
    if (!m) return;
    if (m.loyalty < 50 && c.r.int(1, 100) <= 50 - m.loyalty + num(c, 'P') + ts(c.b, c.team.id).intel / 2) {
      leave(c.b, m, 'poached', null, '');
      c.b.rivals.mySpies = c.b.rivals.mySpies.filter((s) => s.member !== m.id);
      line(c, 'poach', { member: m.name });
    } else {
      addLoyalty(c.b, m, -num(c, 'R'));
      line(c, 'poachHeld', { member: m.name });
    }
  },
  loyalty: (c) => {
    for (const m of c.b.members) addLoyalty(c.b, m, -num(c, 'R'));
    line(c, 'loyalty', { n: num(c, 'R') });
  },
  loyalty1: (c) => {
    const m = c.a.n === 55 ? c.b.members[0] : pickOf(c.r, c.b.members);
    if (!m) return;
    addLoyalty(c.b, m, -num(c, c.a.n === 32 ? 'P' : 'R'));
    line(c, 'loyalty1', { member: m.name, n: num(c, c.a.n === 32 ? 'P' : 'R') });
  },
  recruitCut: (c) => {
    const r = c.b.rivals, weeks = Math.max(1, num(c, 'D'));
    r.recruit = { pct: clamp((r.recruit?.pct ?? 0) + (c.a.uses.includes('P') ? num(c, 'P') : 100)), until: c.b.day + weeks * WEEK() };
    line(c, 'recruitCut', { weeks, pct: r.recruit.pct });
  },
  skim: (c) => {
    const weekly = c.b.field.rackets.reduce((a, k) => a + k.weekly, 0) + hqFx(c.b).income * WEEK() + hqFx(c.b).weekly;
    const amount = Math.min(Math.max(0, c.b.funds), Math.max(10, Math.round((weekly * num(c, 'P')) / 100)));
    spend(c.b, amount);
    line(c, 'skim', { amount: money(amount) });
  },
  regard: (c) => {
    const ids = c.a.n === 147 ? Object.keys(c.b.field.districts) : [pickOf(c.r, Object.keys(c.b.field.districts).filter((d) => c.b.field.districts[d]!.control > 0)) ?? DOMINION_DATA.field.hq];
    for (const d of ids) regard(c, d, -num(c, 'R'));
    if (c.a.n === 77) c.b.field.districts[ids[0]!]!.dread -= num(c, 'R');
    if (c.a.n === 57) c.b.field.districts[ids[0]!]!.dread += num(c, 'R');
    line(c, 'regard', { district: ids.length > 1 ? 'every town' : districtDef(ids[0]!)?.name ?? ids[0]!, n: num(c, 'R') });
  },
  hero: (c) => {
    c.b.field.hero += num(c, 'R');
    line(c, 'hero', { n: num(c, 'R') });
  },
  control: (c) => {
    const yours = Object.keys(c.b.field.districts).filter((d) => c.b.field.districts[d]!.control > 0);
    const d = pickOf(c.r, yours.length ? yours : Object.keys(c.b.field.districts))!;
    const ds = c.b.field.districts[d]!;
    const n = c.a.uses.includes('P') ? num(c, 'P') : num(c, 'S');
    ds.control = clamp(ds.control - n);
    ds.rival = clamp(ds.rival + n);
    ts(c.b, c.team.id).seen.control = yourControl(c.b);
    line(c, 'control', { district: districtDef(d)?.name ?? d, n });
  },
  fight: (c) => {
    const t = ts(c.b, c.team.id);
    const boss = c.a.cat === 'J' || c.a.n === 146;
    const who = boss ? c.team.boss.name : c.a.n === 122 ? 'A wild horde' : adminName(c.team, t, c.r);
    card(c, 'fight', who, 0);
    line(c, 'fight', { who });
  },
  demand: (c) => {
    const who = c.a.cat === 'J' ? c.team.boss.name : adminName(c.team, ts(c.b, c.team.id), c.r);
    card(c, 'demand', who, num(c, 'M'));
    line(c, 'demand', { who, amount: money(num(c, 'M')) });
  },
  deal: (c) => {
    const who = c.a.cat === 'J' ? c.team.boss.name : adminName(c.team, ts(c.b, c.team.id), c.r);
    card(c, 'deal', who, num(c, 'M'));
    line(c, 'deal', { who, amount: money(num(c, 'M')) });
  },
  defect: (c) => {
    const who = adminName(c.team, ts(c.b, c.team.id), c.r);
    card(c, 'defect', who, num(c, 'M'));
    line(c, 'defect', { who, amount: money(num(c, 'M')) });
  },
  bossRaid: (c) => {
    const t = ts(c.b, c.team.id);
    if (t.raid !== null) return;
    t.raid = c.b.day + Math.max(1, RV().bossRaid.warn + Math.floor(hqFx(c.b).warn));
    line(c, 'bossRaid', { nights: t.raid - c.b.day });
  },
  debate: (c) => {
    const who = c.a.id === 'break-a-coalition' ? adminName(c.team, ts(c.b, c.team.id), c.r) : c.team.boss.name;
    card(c, 'debate', who, 0);
    line(c, c.a.id === 'break-a-coalition' ? 'debateAdmin' : 'debateSummit', { who });
  },
  truce: (c) => {
    const ask = c.r.int(1, 100) <= RV().truce.askChance ? (c.r.int(0, 1) ? 'member' : 'district') : 'money';
    card(c, 'truce', c.team.boss.name, tribute(c.b), ask as RivalCard['ask']);
    line(c, 'truceOffer');
  },
  tension: (c) => {
    const t = ts(c.b, c.team.id);
    const n = c.a.n === 100 ? RV().tension.breakTruce : num(c, 'R');
    if (c.a.n === 100) t.truce = null;
    addTension(c.b, c.team.id, n);
    line(c, 'tension', { n });
  },
  grow: (c) => {
    ts(c.b, c.team.id).power += c.a.uses.includes('R') ? num(c, 'R') : 1;
    const site = pickOf(c.r, c.team.sites.filter((s) => ts(c.b, c.team.id).sites[s.id] === 'theirs'));
    if (site) c.b.field.districts[site.district]!.rival = clamp(c.b.field.districts[site.district]!.rival + 2);
    line(c, 'grow');
  },
  research: (c) => {
    const t = ts(c.b, c.team.id);
    t.research = clamp(t.research + RV().plan.research);
    line(c, 'research', { goal: t.research });
  },
  arm: (c) => {
    ts(c.b, c.team.id).arm = clamp(ts(c.b, c.team.id).arm + num(c, 'P'));
    line(c, 'arm', { pct: num(c, 'P') });
  },
  hide: (c) => {
    ts(c.b, c.team.id).hide = clamp(ts(c.b, c.team.id).hide + num(c, 'P'));
    line(c, 'hide', { pct: num(c, 'P') });
  },
  hurt: (c) => {
    // The Boss's team takes the hit in the morning (the session lowers HP); here it's a member who was out at night.
    const m = pickOf(c.r, c.b.members.filter((x) => !crewOf(x).out));
    if (m) m.crew = { ...crewOf(m), out: { why: 'hurt', days: Math.max(1, num(c, 'D')) } };
    c.b.flags = [...c.b.flags.filter((f) => f !== 'ambushed'), 'ambushed'];
    line(c, 'hurt');
  },
};

/** Fire Suppression and the like take a share off building damage. */
const cut = (c: Ctx, pct: number): number => Math.max(1, Math.round((pct * (100 - Math.min(90, hqFx(c.b).fireCut))) / 100));
function regard(c: Ctx, d: string, n: number): void {
  const ds = c.b.field.districts[d];
  if (ds) ds.regard += n;
}
/** What a raid can't touch: the Treasury's safe money. */
const safeMoney = (b: DominionBlock): number => hqFx(b).treasury;
/** A truce's weekly tribute (₽ by tier). */
export const tribute = (b: DominionBlock): number => Math.round((ladder('M', tier(b)) * RV().truce.tributeK * (100 - hqFx(b).truceOff)) / 100);

function doAction(b: DominionBlock & { rivals: RivalsState }, team: RivalTeam, a: RivalAction, r: Rng): string[] {
  const c: Ctx = { b, team, a, r, tier: tier(b), out: [], v: { team: team.name, tag: team.tag, boss: team.boss.name, action: a.name } };
  KINDS[a.kind!](c);
  return c.out;
}

/** Runs one rival action now (tests, and the Rival File's "what they did" replay never uses it). */
export function forceAction(block: DominionBlock, teamId: string, actionId: string, seed: string): { block: DominionBlock; lines: string[] } {
  const b = withRivals(structuredClone(block));
  const team = teamDef(teamId)!, a = rivalAction(actionId)!;
  const lines = doAction(b, team, a, rngOf(seed, `dominion-rival-${teamId}`, b.day, 'force', a.n));
  return { block: b, lines };
}

// ---------- the Boss's raid and rival battles (the fight bridge) ----------

export interface RivalSide { name: string; classId: string; leaderId: string | null; species: string[]; level: number }
const bossIds = new Set(['giovanni', 'archer', 'ariana', 'proton', 'petrel', 'maxie', 'archie', 'cyrus', 'ghetsis', 'lysandre', 'guzma', 'lusamine', 'rose']);

/** Who the player fights: a Grunt squad, an Admin, or the Boss at the door (team size cut by the HQ's Defense and guards). */
export function rivalSide(b: DominionBlock, run: Pick<RunState, 'party'>, fight: Pick<FieldFight, 'action' | 'target' | 'racket'>): RivalSide {
  const team = teamDef(fight.racket ?? '') ?? teamsHere()[0]!;
  const t = rivalsOf(b).teams[team.id];
  const top = Math.max(1, ...run.party.map((m) => m.level));
  const capped = (n: number): number => clamp(n, DOMINION_DATA.field.levels.min, b.levelCap + DOMINION_DATA.field.levels.overCap);
  const power = Math.max(0, t?.power ?? 0);
  if (fight.target === 'boss' || fight.action === 'boss-duel-boss') {
    const B = RV().bossRaid;
    const size = Math.max(B.min, Math.min(B.size, B.size - Math.floor(defense(b) / B.perDefense) - Math.min(2, guardsTonight(b).length)));
    return { name: team.boss.name, classId: 'gym-leader', leaderId: bossIds.has(team.boss.id) ? team.boss.id : null, species: team.boss.species.slice(0, size), level: capped(top + B.level) };
  }
  if (fight.target?.startsWith('admin') || fight.action === 'boss-duel') {
    const id = fight.target?.split(':')[1];
    const a = team.admins.find((x) => x.id === id) ?? team.admins.find((x) => t?.admins.includes(x.id)) ?? team.admins[0];
    if (a) return { name: a.name, classId: 'gym-leader', leaderId: bossIds.has(a.id) ? a.id : null, species: a.species, level: capped(top + 1 + Math.min(3, Math.floor(power / 3))) };
  }
  const n = 2 + Math.min(2, Math.floor(power / 4));
  const sp = team.grunt.species;
  const start = (b.day + (fight.action?.length ?? 0)) % sp.length;
  return { name: team.grunt.name, classId: 'veteran', leaderId: null, species: Array.from({ length: n }, (_, i) => sp[(start + i) % sp.length]!), level: capped(top - 1 + Math.min(3, Math.floor(power / 4))) };
}
setRivalFoe((b, run) => {
  const s = rivalSide(b, run, { action: null, target: 'grunt', racket: null });
  return { name: s.name, species: s.species[0]!, level: s.level, wild: false };
});

/** A rival fight has ended (fightEnd.ts -> field.settle -> here): the Boss's raid, an answered challenge or a street fight. */
addFightSettler('rival', (_content, block, _run, fight, outcome) => {
  const b = withRivals(block);
  const team = teamDef(fight.racket ?? '') ?? teamsHere()[0]!;
  const t = ts(b, team.id);
  const won = outcome === 'win';
  const v = { team: team.name, boss: team.boss.name };
  const out: string[] = [];
  if (fight.action === 'boss-raid') {
    const B = RV().bossRaid;
    t.raid = null;
    if (won) {
      const site = team.sites.find((s) => t.sites[s.id] === 'theirs' && !s.hq);
      if (site) {
        t.sites[site.id] = 'yours';
        const ds = b.field.districts[site.district];
        if (ds) ds.rival = clamp(ds.rival - 20);
      }
      const hq = b.field.districts[DOMINION_DATA.field.hq];
      if (hq) hq.dread += B.dread;
      t.tension = clamp(t.tension - RV().tension.bossWin);
      t.power -= 2;
      out.push(fill(L().bossWon!, { ...v, site: site?.name ?? 'Nothing', dread: B.dread }));
    } else {
      const room = [...workingRooms(b)].sort((x, y) => y.spent - x.spent)[0];
      if (room) wear(b, room, 100);
      const amount = Math.max(0, Math.round((Math.max(0, b.funds - safeMoney(b)) * B.vaultPct) / 100));
      spend(b, amount);
      const m = [...b.members.slice(1)].filter((x) => !crewOf(x).out).sort((x, y) => x.loyalty - y.loyalty)[0];
      if (m) hold(b, m, team.id, Math.round(ladder('M', tier(b)) * RV().held.ransomK));
      t.tension = Math.min(t.tension, B.after);
      out.push(fill(L().bossLost!, { ...v, room: room ? roomName(room) : 'front door', amount: money(amount), member: m ? fill(L().bossTookMember!, { member: m.name }) : '' }));
    }
    t.stage = stageIndex(t.tension);
    log(b, team.id, out[0]!);
    return out;
  }
  // D13: a win over their Boss or an Admin opens the Boss's Debate action (Part 4 §3.1).
  if (won) {
    const beat = fight.target === 'boss-duel' || fight.target === 'boss' ? 'boss' : fight.target?.startsWith('admin:') ? 'admin' : null;
    if (beat && !b.flags.includes(`beat:${team.id}:${beat}`)) b.flags.push(`beat:${team.id}:${beat}`);
  }
  // An answered challenge or a street fight: winning pushes them back; losing costs nothing more (a loss never ends a run).
  if (won) {
    t.power -= 1;
    const d = fight.district;
    if (b.field.districts[d]) b.field.districts[d]!.dread += 2;
    out.push(fill(L().won!, v));
    if (fight.action?.startsWith('O')) out.push(...streetAfterWin(b, team, fight));
  } else out.push(fill(L().lost!, v));
  log(b, team.id, out[0]!);
  return out;
});

function streetAfterWin(b: DominionBlock & { rivals: RivalsState }, team: RivalTeam, fight: FieldFight): string[] {
  const choice = RV().street.rows[fight.action!]?.find((x) => x.label === fight.target?.split('|')[1]);
  const out: string[] = [];
  if (!choice) return out;
  if (choice.racket) {
    const d = districtDef(fight.district);
    const shop = d?.targets.find((x) => x.kind === 'shop');
    if (shop && !b.field.rackets.some((r) => r.target === shop.id)) {
      b.field.rackets.push({ target: shop.id, district: d!.id, weekly: 80, day: b.day, kind: 'racket' });
      out.push(`${shop.name} pays you now: ₽80 a week.`);
    }
  }
  if (choice.site) {
    const site = team.sites.find((s) => s.district === fight.district && ts(b, team.id).sites[s.id] === 'theirs' && !s.hq);
    if (site) {
      ts(b, team.id).sites[site.id] = 'gone';
      out.push(fill(L().siteTaken!, { site: site.name }));
    }
  }
  return out;
}

// ---------- the player's answers (the Rival File) ----------

export interface RivalOut { ok: boolean; block: DominionBlock; notice: string | null; fight?: boolean }
/** D13: a later slice answers its own card kinds (debate.ts: Debate invitations, the Branch Directive). */
type CardHook = (b: DominionBlock & { rivals: RivalsState }, c: RivalCard, index: number, choice: number, seed: string) => RivalOut;
const CARD_HOOKS: Partial<Record<RivalCard['kind'], { answer: CardHook; choices: (c: RivalCard) => string[] }>> = {};
export function setCardHook(kind: RivalCard['kind'], answer: CardHook, choices: (c: RivalCard) => string[]): void {
  CARD_HOOKS[kind] = { answer, choices };
}
const no = (block: DominionBlock, notice: string | null): RivalOut => ({ ok: false, block, notice });

/** Offers a truce yourself (Part 4 §1): pay tribute weekly, Tension falls 10 a week. */
export function startTruce(block: DominionBlock, teamId: string): RivalOut {
  const b = withRivals(structuredClone(block));
  const team = teamDef(teamId), t = b.rivals.teams[teamId];
  if (!team || !t) return no(block, null);
  if (t.truce) return no(block, fill(L().truceNow!, { team: team.name }));
  if (t.tension < RV().truce.minTension) return no(block, `${team.name} doesn't know you yet. Nothing to make peace about.`);
  const pay = tribute(b);
  if (b.funds < pay) return no(block, fill(L().noMoney!, { cost: money(pay) }));
  spend(b, pay);
  t.truce = { tribute: pay, since: b.day, paid: b.day, until: null };
  t.tension = clamp(t.tension - RV().tension.truceWeek);
  t.raid = null;
  const text = fill(L().truceOn!, { team: team.name, tribute: money(pay), drop: RV().tension.truceWeek });
  log(b, teamId, text);
  return { ok: true, block: b, notice: text };
}
/** Breaking a truce: Tension +30 at once. */
export function breakTruce(block: DominionBlock, teamId: string): RivalOut {
  const b = withRivals(structuredClone(block));
  const team = teamDef(teamId), t = b.rivals.teams[teamId];
  if (!team || !t?.truce) return no(block, 'There is no truce to break.');
  t.truce = null;
  addTension(b, teamId, RV().tension.breakTruce);
  const text = fill(L().truceBroke!, { team: team.name, n: RV().tension.breakTruce });
  log(b, teamId, text);
  return { ok: true, block: b, notice: text };
}
/** Pays a held member's ransom. */
export function ransom(block: DominionBlock, memberId: string): RivalOut {
  const b = withRivals(structuredClone(block));
  const h = b.rivals.held.find((x) => x.member === memberId);
  const m = b.members.find((x) => x.id === memberId);
  if (!h || !m) return no(block, null);
  if (b.funds < h.ransom) return no(block, fill(L().noMoney!, { cost: money(h.ransom) }));
  spend(b, h.ransom);
  free(b, memberId);
  return { ok: true, block: b, notice: fill(L().ransom!, { ransom: money(h.ransom), member: m.name }) };
}

/** The choices a card offers (the Rival File lists them). */
export function cardChoices(c: RivalCard): string[] {
  switch (c.kind) {
    case 'fight': return ['Fight', 'Refuse'];
    case 'demand': return [`Pay ₽${money(c.amount)}`, 'Refuse'];
    case 'deal': return [`Pay ₽${money(c.amount)}`, 'No deal'];
    case 'defect': return [`Pay ₽${money(c.amount)}`, 'Send them back'];
    case 'truce': return [c.ask === 'member' ? 'Accept: give the newest member' : c.ask === 'district' ? 'Accept: give up a district' : `Accept: ₽${money(c.amount)} a week`, 'Refuse'];
    case 'street': return (RV().street.rows[c.ref] ?? []).map((x) => x.label);
    default: return CARD_HOOKS[c.kind]?.choices(c) ?? [];
  }
}
/** The street row of a card (outside.json). */
export const streetRow = (id: string) => DOMINION_DATA.outside.find((r) => r.id === id);

/** Answers card `index` with `choice`. A fight leaves `field.fight` for the session to start. */
export function answerCard(block: DominionBlock, index: number, choice: number, seed: string): RivalOut {
  const b = withRivals(structuredClone(block));
  const c = b.rivals.cards[index];
  if (!c) return no(block, null);
  const hook = CARD_HOOKS[c.kind];
  if (hook) return hook.answer(b, c, index, choice, seed);
  const team = teamDef(c.team)!, t = b.rivals.teams[c.team]!;
  const r = rngOf(seed, 'dominion-rival-card', b.rivals.rolls);
  b.rivals.rolls += 1;
  const v = { team: team.name, boss: team.boss.name, who: c.who };
  const pay = (n: number): boolean => {
    if (b.funds < n) return false;
    spend(b, n);
    return true;
  };
  const fight = (target: string): RivalOut => {
    if (b.field.fight) return no(block, 'A fight is already waiting.');
    b.field.fight = { why: 'rival', foe: 'rival', begun: false, action: c.ref, target, district: c.district ?? DOMINION_DATA.field.hq, pass: false, big: false, wager: 0, racket: c.team };
    b.rivals.cards.splice(index, 1);
    return { ok: true, block: b, notice: `${c.who} is waiting. Fight!`, fight: true };
  };
  let notice: string;
  switch (c.kind) {
    case 'fight': {
      if (choice === 0) {
        const admin = team.admins.find((a) => a.name === c.who);
        return fight(c.who === team.boss.name ? 'boss-duel' : admin ? `admin:${admin.id}` : 'grunt');
      }
      const hq = b.field.districts[DOMINION_DATA.field.hq];
      if (hq) hq.regard -= 1;
      addTension(b, c.team, 2);
      notice = `You turned ${c.who} down. People noticed (Regard −1).`;
      break;
    }
    case 'demand': {
      if (choice === 0) {
        if (!pay(c.amount)) return no(block, fill(L().noMoney!, { cost: money(c.amount) }));
        t.tension = clamp(t.tension - 5);
        notice = `Paid ${c.who} ₽${money(c.amount)}. Tension −5.`;
      } else {
        addTension(b, c.team, 10);
        notice = `You refused ${c.who}. Tension +10.`;
      }
      break;
    }
    case 'deal': {
      if (choice === 0) {
        if (!pay(c.amount)) return no(block, fill(L().noMoney!, { cost: money(c.amount) }));
        t.intel = clamp(t.intel - 10);
        learnPlan(b, c.team);
        notice = `${c.who} talks: ${team.name}'s plan this week is ${t.plan.map(priorityName).join(' · ') || 'not set yet'}.`;
      } else notice = `No deal with ${c.who}.`;
      break;
    }
    case 'defect': {
      if (choice === 0) {
        if (!pay(c.amount)) return no(block, fill(L().noMoney!, { cost: money(c.amount) }));
        const admin = team.admins.find((a) => a.name === c.who);
        if (admin) t.admins = t.admins.filter((x) => x !== admin.id);
        const lead = leadFrom(b, seed, c.who);
        addTension(b, c.team, RV().tension.poach * 2);
        notice = lead ? `${c.who} walked out on ${team.name}. They're on your Leads list.` : `${c.who} walked out on ${team.name}, but your Leads list is full.`;
      } else notice = `${c.who} goes back to ${team.name}.`;
      break;
    }
    case 'truce': {
      if (choice === 0) {
        if (c.ask === 'member') {
          const m = b.members.length > 1 ? b.members[b.members.length - 1]! : null;
          if (!m) return no(block, 'You have nobody to give.');
          leave(b, m, 'given', null, '');
        } else if (c.ask === 'district') {
          const d = Object.keys(b.field.districts).filter((id) => id !== DOMINION_DATA.field.hq).sort((x, y) => b.field.districts[y]!.control - b.field.districts[x]!.control)[0];
          if (d) {
            const ds = b.field.districts[d]!;
            ds.rival = clamp(ds.rival + ds.control);
            ds.control = 0;
          }
        } else if (!pay(c.amount)) return no(block, fill(L().noMoney!, { cost: money(c.amount) }));
        t.truce = { tribute: c.ask === 'money' ? c.amount : 0, since: b.day, paid: b.day, until: c.ask === 'money' ? null : b.day + 4 * WEEK() };
        t.tension = clamp(t.tension - RV().tension.truceWeek);
        t.raid = null;
        notice = fill(L().truceOn!, { team: team.name, tribute: money(t.truce.tribute), drop: RV().tension.truceWeek });
      } else {
        addTension(b, c.team, 5);
        notice = `You turned down ${team.boss.name}'s truce.`;
      }
      break;
    }
    case 'street': {
      const ch = RV().street.rows[c.ref]?.[choice];
      if (!ch) return no(block, null);
      if (ch.money && ch.money < 0 && b.funds < ladder('M', tier(b)) * -ch.money / 2) return no(block, fill(L().noMoney!, { cost: money(Math.round(ladder('M', tier(b)) * -ch.money / 2)) }));
      if (ch.fight) {
        const fout = fight(ch.fight === 'admin' ? `admin:${t.admins[0] ?? ''}|${ch.label}` : `grunt|${ch.label}`);
        if (fout.ok) street(fout.block as DominionBlock & { rivals: RivalsState }, c, ch, r, true);
        return fout;
      }
      notice = street(b, c, ch, r, false);
      break;
    }
    default: return no(block, null);
  }
  b.rivals.cards = b.rivals.cards.filter((x) => x !== c);
  log(b, c.team, notice);
  void v;
  return { ok: true, block: b, notice };
}

/** A lead from the rival team (a defector), made by the recruit rules on a separate seed. */
function leadFrom(b: DominionBlock, seed: string, who: string): boolean {
  const finder = b.members[0];
  if (!finder) return false;
  const lead = makeLead(b, finder, `${seed}::rival::${b.rivals?.rolls ?? 0}`);
  if (!lead) return false;
  lead.id = `${lead.id}-r${b.rivals?.rolls ?? 0}`;
  lead.bonus += 15;
  void who;
  return true;
}

/** A street choice's effects (outside.json section F, rivals.json street.rows). Returns the line. */
function street(b: DominionBlock & { rivals: RivalsState }, c: RivalCard, ch: StreetChoice, r: Rng, fighting: boolean): string {
  const t = b.rivals.teams[c.team]!, d = c.district ?? DOMINION_DATA.field.hq, ds = b.field.districts[d];
  const step = ladder('M', tier(b)) / 2;
  const bits: string[] = [];
  if (ch.ten) bits.push(`Tension ${ch.ten > 0 ? '+' : '−'}${Math.abs(addTension(b, c.team, ch.ten) || ch.ten)}`);
  if (ds && ch.rg) (ds.regard += ch.rg, bits.push(`Regard ${ch.rg > 0 ? '+' : '−'}${Math.abs(ch.rg)}`));
  if (ds && ch.dr) (ds.dread += ch.dr, bits.push(`Dread ${ch.dr > 0 ? '+' : '−'}${Math.abs(ch.dr)}`));
  if (ch.h) (addHeat(b, d, ch.h), bits.push(`Heat ${ch.h > 0 ? '+' : '−'}${Math.abs(ch.h)}`));
  if (ds && ch.control) ds.control = clamp(ds.control + ch.control);
  if (ds && ch.theirControl) ds.rival = clamp(ds.rival + ch.theirControl);
  if (ch.theirPower) t.power += ch.theirPower;
  if (ch.theirIntel) t.intel = clamp(t.intel + ch.theirIntel);
  if (ch.spyGone || ch.foil) t.spies = Math.max(0, t.spies - 1), t.intel = clamp(t.intel - 5);
  if (ch.money) {
    const n = Math.round(step * Math.abs(ch.money));
    if (ch.money > 0) (b.funds += n, b.earned += n, bits.push(`+₽${money(n)}`));
    else (spend(b, n), bits.push(`−₽${money(n)}`));
  }
  if (ch.intel) {
    t.intel = clamp(t.intel - 5);
    learnPlan(b, c.team);
    bits.push(`their plan: ${t.plan.map(priorityName).join(' · ') || 'not set'}`);
  }
  if (ch.mySpy && b.members.length) {
    const m = b.members.find((x) => !crewOf(x).out && !b.rivals.mySpies.some((s) => s.member === x.id));
    if (m) (b.rivals.mySpies.push({ member: m.id, team: c.team, day: b.day }), bits.push(`${m.name} is inside now`));
  }
  if (ch.lead && leadFrom(b, `street::${c.ref}`, c.who)) bits.push('a new lead');
  if (ch.truceDays && !t.truce) {
    t.truce = { tribute: 0, since: b.day, paid: b.day, until: b.day + ch.truceDays };
    bits.push(`a truce for ${ch.truceDays} days`);
  }
  if (ch.gamble) {
    const good = r.int(1, 2) === 1;
    if (good) (b.funds += Math.round(step), bits.push(`a gift: +₽${money(Math.round(step))}`));
    else (addHeat(b, d, 4), bits.push('a trap: Heat +4'));
  }
  if (ch.item) bits.push('the goods are yours');
  if (ch.mon) bits.push('a Pokémon for your stores');
  if (ch.debate && !b.rivals.cards.some((x) => x.team === c.team && x.kind === 'debate') && !b.debate?.deals[c.team]) {
    b.rivals.cards.push({ kind: 'debate', team: c.team, ref: c.ref, who: teamDef(c.team)!.boss.name, amount: 0, district: null, ask: null, until: b.day + RV().cards.days });
    bits.push(`${teamDef(c.team)!.boss.name} will sit down for a Debate (Rival File)`);
  }
  if (fighting) return '';
  return `${ch.label}: ${bits.join(', ') || 'nothing more'}.`;
}

/** A street meeting may be met on a Boss action in a district the rival team has a stake in (once per row per run). */
export function maybeStreet(block: DominionBlock, district: string, seed: string, night: boolean): { block: DominionBlock; line: string | null } {
  const b = withRivals(structuredClone(block));
  const team = teamsHere()[0];
  if (!team) return { block, line: null };
  const t = b.rivals.teams[team.id]!, ds = b.field.districts[district];
  const S = RV().street;
  if (!ds || ds.rival <= 0 || t.tension < S.minTension || b.rivals.cards.some((c) => c.kind === 'street')) return { block, line: null };
  const r = rngOf(seed, 'dominion-rival-card', b.rivals.rolls);
  b.rivals.rolls += 1;
  if (r.int(1, 100) > (night ? S.night : S.chance)) return { block: b, line: null };
  const rows = DOMINION_DATA.outside.filter((x) => x.section === 'F' && x.status !== 'disabled' && !b.rivals.street.includes(x.id) && (!x.marks.includes('night') || night) && (!x.marks.includes('day') || !night));
  const row = pickOf(r, rows);
  if (!row) return { block: b, line: null };
  b.rivals.street.push(row.id);
  b.rivals.cards.push({ kind: 'street', team: team.id, ref: row.id, who: row.who, amount: 0, district, ask: null, until: b.day + RV().cards.days });
  const text = fill(L().street!, { what: row.what, team: team.name });
  log(b, team.id, text);
  return { block: b, line: text };
}

// ---------- crew tasks (tasks.json kinds rivalSpy .. truceTalk) ----------

const firstTeam = (): RivalTeam => teamsHere()[0]!;
function taskLine(ctx: TaskCtx, text: string): void {
  ctx.say('rival', text);
}
const failTask = (b: DominionBlock, m: Member, ctx: TaskCtx, capture: boolean): void => {
  const team = firstTeam();
  if (capture && ctx.task.effect?.risky !== false && ctx.r.int(1, 100) <= RV().spy.caught) {
    hold(b, m, team.id, Math.round(ladder('M', tier(b)) * RV().held.ransomK));
    taskLine(ctx, fill(L().mySpyCaught!, { member: m.name, team: team.name }));
  } else ctx.say('crew', `${m.name} tried to ${ctx.label.toLowerCase()} and came back with nothing.`);
};
addTaskKind('rivalSpy', (b, m, ok, ctx) => {
  const team = firstTeam();
  withRivals(b);
  if (!ok) return failTask(b, m, ctx, true);
  if (!b.rivals!.mySpies.some((s) => s.member === m.id)) b.rivals!.mySpies.push({ member: m.id, team: team.id, day: b.day });
  taskLine(ctx, fill(L().mySpy!, { member: m.name, team: team.name }));
});
addTaskKind('rivalIntel', (b, m, ok, ctx) => {
  const team = firstTeam();
  withRivals(b);
  const t = b.rivals!.teams[team.id]!;
  if (!ok || ctx.r.int(1, 100) <= t.hide) return failTask(b, m, ctx, false);
  t.intel = clamp(t.intel - 5);
  learnPlan(b, team.id);
  taskLine(ctx, `${m.name} learned ${team.name}'s plan: ${t.plan.map(priorityName).join(' · ') || 'nothing set yet'}.`);
});
addTaskKind('counterSpy', (b, m, ok, ctx) => {
  const team = firstTeam();
  withRivals(b);
  const t = b.rivals!.teams[team.id]!;
  if (!ok || !t.spies) return void ctx.say('crew', t.spies ? `${m.name} found no moles tonight.` : `${m.name} checked the crew: no moles.`);
  t.spies -= 1;
  t.intel = clamp(t.intel - 10);
  taskLine(ctx, fill(L().spyCaught!, { member: m.name, team: team.name }));
});
addTaskKind('poachRival', (b, m, ok, ctx) => {
  const team = firstTeam();
  withRivals(b);
  if (!ok) return failTask(b, m, ctx, false);
  addTension(b, team.id, RV().tension.poach);
  const lead = leadFrom(b, `poach::${m.id}`, team.grunt.name);
  taskLine(ctx, lead ? `${m.name} talked a ${team.grunt.name} round: a new lead. Tension +${RV().tension.poach}.` : `${m.name} talked to a ${team.grunt.name}, but your Leads list is full.`);
});
addTaskKind('rivalHit', (b, m, ok, ctx) => {
  const team = firstTeam();
  withRivals(b);
  const t = b.rivals!.teams[team.id]!;
  if (!ok) {
    if (ctx.task.effect?.risky && ctx.r.int(1, 100) <= RV().spy.caught) m.crew = { ...crewOf(m), out: { why: 'hurt', days: 2 } };
    return failTask(b, m, ctx, false);
  }
  const site = team.sites.filter((s) => t.sites[s.id] === 'theirs' && !s.hq)[ctx.r.int(0, Math.max(0, team.sites.filter((s) => t.sites[s.id] === 'theirs' && !s.hq).length - 1))];
  const n = addTension(b, team.id, RV().tension.hitSite);
  t.power -= 1;
  if (site) {
    const ds = b.field.districts[site.district];
    if (ds) ds.rival = clamp(ds.rival - 5);
  }
  if (ctx.task.effect?.funds) {
    const [lo, hi] = ctx.task.effect.funds;
    const pay = Math.round(lo + ((hi - lo) * (ctx.stat - 1)) / 9);
    b.funds += pay;
    b.earned += pay;
  }
  if (ctx.task.effect?.heat) addHeat(b, site?.district ?? DOMINION_DATA.field.hq, ctx.task.effect.heat);
  taskLine(ctx, fill(L().siteHit!, { member: m.name, team: team.name, site: site?.name ?? 'runners', n }));
});
addTaskKind('rescue', (b, m, ok, ctx) => {
  withRivals(b);
  const h = b.rivals!.held[0];
  if (!h) return void ctx.say('crew', `${m.name} looked for a captive to free. Nobody is being held.`);
  if (!ok) return failTask(b, m, ctx, true);
  const who = b.members.find((x) => x.id === h.member);
  free(b, h.member);
  addTension(b, h.team, 3);
  taskLine(ctx, fill(L().rescued!, { member: who?.name ?? 'Your member' }));
});
addTaskKind('rumours', (b, m, ok, ctx) => {
  const team = firstTeam();
  withRivals(b);
  if (!ok) return failTask(b, m, ctx, false);
  const t = b.rivals!.teams[team.id]!;
  t.intel = clamp(t.intel - 8);
  t.power -= 1;
  taskLine(ctx, `${m.name} spread rumours about ${team.name}: what they know of you is muddied (raid odds −8%).`);
});
addTaskKind('truceTalk', (b, m, ok, ctx) => {
  const team = firstTeam();
  withRivals(b);
  const t = b.rivals!.teams[team.id]!;
  if (!ok) {
    addTension(b, team.id, 3);
    return void ctx.say('rival', `${m.name} spoke for you to ${team.name} and said the wrong thing. Tension +3.`);
  }
  if (t.truce) {
    t.tension = clamp(t.tension - 5);
    return taskLine(ctx, `${m.name} kept the truce with ${team.name} warm. Tension −5.`);
  }
  if (t.tension >= RV().truce.minTension && !b.rivals!.cards.some((c) => c.kind === 'truce')) {
    b.rivals!.cards.push({ kind: 'truce', team: team.id, ref: 'negotiate-a-truce', who: team.boss.name, amount: Math.round(tribute(b) * 0.8), district: null, ask: 'money', until: b.day + RV().cards.days });
    return taskLine(ctx, `${m.name} came back with terms from ${team.boss.name} (Rival File, R).`);
  }
  t.tension = clamp(t.tension - 3);
  taskLine(ctx, `${m.name} had a quiet word with ${team.name}. Tension −3.`);
});

// ---------- field actions (field.json play effects rivalHit .. court) ----------

/** Tension, spies and raids gate some Boss actions (their list's unlock words). */
addActionGate((b, def) => {
  const t = rivalsOf(b).teams[firstTeam()?.id ?? ''];
  const m = /Tension ≥ (\d+)/.exec(def.unlock);
  if (m && (t?.tension ?? 0) < Number(m[1])) return `Needs Tension ${m[1]}+ with the rival team (it's ${t?.tension ?? 0}).`;
  if (def.unlock === 'Spy placed' && !rivalsOf(b).mySpies.length) return 'Needs one of your crew spying inside the rival team (crew task Spy).';
  if ((def.unlock === 'Spy found' || def.unlock === 'Spy event') && !(t?.spies) && !(t && t.peak >= RV().stages[1]!.min)) return 'Needs a rival spy to have come for you first.';
  if (def.unlock === 'Raid suffered' && !b.flags.some((f) => f.startsWith('raided:') && Number(f.slice(7)) >= b.day - 1)) return 'Needs a rival raid on you in the last day.';
  if (def.unlock === 'Racket owned' && !b.field.rackets.length) return 'Needs a Racket of yours to defend.';
  if (def.id === 'court-day' || def.id === 'bail-out' || def.id === 'prison-break') {
    if (!b.members.some((x) => crewOf(x).out?.why === 'jail' || (def.id === 'prison-break' && crewOf(x).out?.why === 'held'))) return 'Nobody of yours is locked up.';
  }
  return null;
});
addActEffect('rivalHit', (b, x) => {
  const team = firstTeam();
  withRivals(b);
  const t = b.rivals!.teams[team.id]!;
  const ds = b.field.districts[x.district];
  const n = addTension(b, team.id, RV().tension.hitSite);
  t.power -= x.big ? 2 : 1;
  if (ds) ds.rival = clamp(ds.rival - (x.big ? 10 : 5));
  const site = team.sites.find((s) => s.district === x.district && t.sites[s.id] === 'theirs' && !s.hq);
  const out = [`${team.name} feels it: Tension +${n}.`];
  if (site && (x.action === 'burn-a-front' || x.action === 'counterstrike') && x.big) {
    t.sites[site.id] = 'gone';
    out.push(fill(L().siteTaken!, { site: site.name }));
  }
  return out;
});
addActEffect('rivalSpy', (b, x) => {
  const team = firstTeam();
  withRivals(b);
  const t = b.rivals!.teams[team.id]!;
  t.intel = clamp(t.intel - 5);
  learnPlan(b, team.id);
  void x;
  return [`${team.boss.name}'s plan this week: ${t.plan.map(priorityName).join(' · ') || 'not set yet'}.`];
});
addActEffect('counterSpy', (b) => {
  const team = firstTeam();
  withRivals(b);
  const t = b.rivals!.teams[team.id]!;
  if (!t.spies) return ['No moles in the crew.'];
  t.spies -= 1;
  t.intel = clamp(t.intel - 10);
  return [`You found ${team.name}'s mole. Out they go.`];
});
addActEffect('truceTalk', (b) => {
  const team = firstTeam();
  withRivals(b);
  const t = b.rivals!.teams[team.id]!;
  if (t.truce) return [fill(L().truceNow!, { team: team.name })];
  b.rivals!.cards.push({ kind: 'truce', team: team.id, ref: 'peace-talks', who: team.boss.name, amount: Math.round(tribute(b) * 0.7), district: null, ask: 'money', until: b.day + RV().cards.days });
  return [`${team.boss.name} will hear terms (Rival File, R).`];
});
addActEffect('war', (b) => {
  const team = firstTeam();
  withRivals(b);
  const t = b.rivals!.teams[team.id]!;
  t.truce = null;
  const n = addTension(b, team.id, 20);
  return [`You declared war on ${team.name}. Tension +${n}.`];
});
addActEffect('poach', (b, x) => {
  const team = firstTeam();
  withRivals(b);
  addTension(b, team.id, RV().tension.poach);
  return [leadFrom(b, `act::${x.action}::${b.day}`, team.grunt.name) ? `A ${team.grunt.name} will hear you out: a new lead.` : 'Your Leads list is full.'];
});
addActEffect('court', (b, x) => {
  const m = b.members.find((y) => crewOf(y).out?.why === 'jail') ?? (x.action === 'prison-break' ? b.members.find((y) => crewOf(y).out?.why === 'held') : undefined);
  if (!m) return [];
  if (crewOf(m).out?.why === 'held') free(b, m.id);
  else m.crew = { ...crewOf(m), out: null };
  return [`${m.name} walks free.`];
});

// Every new night: the step runs third (Part 9 A1).
addWorldStep('rivals', rivalStep);

/** The member a team is holding (Crew File, Rival File). */
export const heldBy = (b: DominionBlock, memberId: string): string | null => rivalsOf(b).held.find((h) => h.member === memberId)?.team ?? null;
/** Districts where a rival holds the most Control (the map's red). */
export const rivalDistricts = (b: DominionBlock): string[] => Object.keys(b.field.districts).filter((d) => statusOf(b.field.districts[d]!) === 'rival');
/** The building named, for lines. */
export const buildingName = (id: string): string => buildingDef(id)?.name ?? id;
export { hqOf };
