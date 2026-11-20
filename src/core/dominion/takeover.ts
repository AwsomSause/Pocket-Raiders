// DOMINION slice D14: the four ways to take a region and the Goals (Part 5 §1-2, Kice's Parts 35a-35c), the takeover
// bonuses of every place (lists/takeover-bonuses.md), the League (list rows 451-465) and the endgame actions (586-600).
//
//   - Paths: Wipe Out, Shadow and Monarch are read from the block as it is (rival sites, Gyms, businesses, Regard,
//     Dread, Wanted, the League, the Citadel). The Goal path is the Goal Track: it grows each night by what the run
//     gained (Gyms, towns, Holdings, Legendaries...) and by the Boss's actions in the Goal's sections; five Turning
//     Points fire on the way; at 100 the Scheme's Moment is a battle with the Goal's Opposition. The Cost grows the same
//     way, and the region pushes back when it's high.
//   - The first path finished calls the Hero's final stand (hero.ts); beating the Hero leaves the region Taken.
//   - Holdings: each place in the region can be taken its own way (buy, infiltrate, seize, raid, annex a city; Gyms and
//     D10's businesses are held through D10) and pays its Bonus each week while held, with upkeep and Condition.
//   - The hijacked broadcast (mockup m13) is queued once per town taken (Owned, or Annexed) and once for the region.
// Every roll is on this file's own streams: dominion-holding (attacks, the seize holds) and nothing else. No existing
// roll moves. Pure: no Phaser, no UI.

import { hashSeed, Rng } from '../rng';
import type { RunState } from '../state';
import { addLoyalty, addMorale, addTaskKind, freshCrewState } from './crew';
import { DOMINION_DATA } from './data';
import { heldIds } from './empire';
import {
  addActAfter, addActEffect, addActedHook, addActionGate, addCardHook, addFightSettler, addHeat, foeLevel, setTakeoverFoe, statusOf, wanted, type ActFx,
} from './field';
import { addPart, growthOf, ownedGyms } from './growth';
import { callFinalStand } from './hero';
import { addClean } from './hqFx';
import { makeLead } from './recruit';
import { addTension, learnPlan, rivalsOf, teamsHere } from './rivals';
import type { DominionBlock, GoalDef, HoldingDef, HoldingFx, PathId, StatId, TakeoverState } from './schema';
import { addWorldEnd, fill } from './worldTurn';

const T = () => DOMINION_DATA.takeover;
const F = () => DOMINION_DATA.field;
const Ln = (k: string): string => T().lines[k] ?? k;
const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, n));
const money = (n: number): string => Math.round(n).toLocaleString('en-US');
const WEEK = (): number => DOMINION_DATA.start.clock.weekLength;
const weekly = (b: DominionBlock): boolean => b.day % WEEK() === 0;
const dname = (id: string): string => F().districts.find((d) => d.id === id)?.name ?? id;

export const freshTakeover = (): TakeoverState => ({
  goal: { track: 0, cost: 0, stage: 0, tp: null, done: false, lost: 0 }, last: {}, plan: 0,
  league: { elite: [], champion: false, studied: [], swayed: [], sway: 0 },
  hold: {}, scouts: {}, chain: null, won: null, paths: [], taken: null, bcast: { queue: [], seen: [] }, cracked: false,
});
export const takeoverOf = (b: DominionBlock): TakeoverState => (b.takeover ??= freshTakeover());
const peek = (b: DominionBlock): TakeoverState => b.takeover ?? freshTakeover();

export const goalOf = (b: DominionBlock): GoalDef | null => (b.team?.goal ? T().goals.find((g) => g.id === b.team!.goal) ?? null : null);
export const placesHere = (): HoldingDef[] => T().holdings.filter((h) => h.region === F().region);
export const placeDef = (id: string): HoldingDef | undefined => T().holdings.find((h) => h.id === id);

// ---------- the League (Q5: when the Hero is Blue, Lance is Champion and Karen sits in the Elite Four) ----------

export function leagueOf(b: DominionBlock): { elite: { id: string; name: string; species: string[]; offset: number }[]; champion: { id: string; name: string; species: string[]; offset: number } } {
  const L = T().league, s = L.standIn[b.hero?.id ?? ''];
  if (!s) return { elite: L.elite, champion: L.champion };
  return { elite: L.elite.map((e) => (e.id === s.champion.id ? s.elite : e)), champion: s.champion };
}
const nextElite = (b: DominionBlock) => leagueOf(b).elite.find((e) => !peek(b).league.elite.includes(e.id)) ?? null;
export const eliteDone = (b: DominionBlock): boolean => peek(b).league.elite.length >= 4;

/** A rival team loses Power (never below 0); the rival block is made on first need. */
function weaken(b: DominionBlock, id: string, n: number): void {
  const rt = (b.rivals ??= rivalsOf(b)).teams[id];
  if (rt) rt.power = Math.max(0, rt.power - n);
}

// ---------- measures (the paths read them; the Goal Track grows by them) ----------

const rivalTeams = () => teamsHere();
function sitesOf(b: DominionBlock): { mine: number; all: number; hqStormed: boolean; adminsGone: number; admins: number; boss: string; tag: string } {
  const team = rivalTeams()[0];
  if (!team) return { mine: 0, all: 0, hqStormed: false, adminsGone: 0, admins: 0, boss: 'their Boss', tag: 'rival' };
  const t = b.rivals?.teams[team.id];
  const mine = team.sites.filter((s) => (t?.sites[s.id] ?? 'theirs') !== 'theirs').length;
  const standing = t ? t.admins.length : team.admins.length;
  return { mine, all: team.sites.length, hqStormed: b.flags.includes(`beat:${team.id}:hq`), adminsGone: team.admins.length - standing, admins: team.admins.length, boss: team.boss.name, tag: team.name.replace(/^Team /, '') };
}
/** A region's Regard or Dread: the average over the towns you work in (Control above 0); 0 before any. */
function regionLean(b: DominionBlock, k: 'regard' | 'dread'): number {
  const towns = Object.values(b.field.districts).filter((d) => d.control > 0);
  return towns.length ? Math.round(towns.reduce((a, d) => a + d[k], 0) / towns.length) : 0;
}
export const heldPlaces = (b: DominionBlock): string[] => Object.entries(peek(b).hold).filter(([, h]) => h.until === null).map(([id]) => id);

export function measures(b: DominionBlock): Record<string, number> {
  const s = sitesOf(b), lg = peek(b).league;
  const sum = (k: 'regard' | 'dread'): number => Math.floor(Object.values(b.field.districts).reduce((a, d) => a + Math.max(0, d[k]), 0) / 10);
  return {
    gyms: ownedGyms(b).length + (s.hqStormed ? 1 : 0), biz: Object.keys(b.growth?.biz ?? {}).length, held: heldIds(b).length,
    holdings: heldPlaces(b).length, sites: s.mine, legends: Object.values(b.hero?.legends ?? {}).reduce((a, l) => a + l.beaten, 0),
    members: b.members.length, pens: b.reserve?.box.length ?? 0, elite: lg.elite.length + (lg.champion ? 1 : 0), hq: b.hqLevel,
    dread: sum('dread'), regard: sum('regard'),
  };
}

// ---------- the four paths (Part 5 §1, Kanto values) ----------

export interface PathRow { text: string; ok: boolean }
export interface PathState { id: PathId; dial: number; rows: PathRow[]; done: boolean; open: boolean }

const part = (have: number, need: number): number => (need <= 0 ? 1 : Math.max(0, Math.min(1, have / need)));
const dialOf = (parts: number[]): number => Math.floor((parts.reduce((a, x) => a + x, 0) / parts.length) * 100);

export function pathsOf(b: DominionBlock): PathState[] {
  const N = T().need, s = sitesOf(b), lg = peek(b).league, g = goalOf(b), st = peek(b).goal;
  const gyms = ownedGyms(b).length + (s.hqStormed ? 1 : 0);
  const pocket = Object.values(b.growth?.gyms ?? {}).filter((x) => x.way === 'buy' || x.way === 'blackmail' || x.way === 'convert').length;
  const biz = Object.keys(b.growth?.biz ?? {});
  const pillar = biz.some((id) => N.pillars.includes(id));
  const regard = regionLean(b, 'regard'), dread = regionLean(b, 'dread'), w = wanted(b.field);
  const champ = lg.sway >= T().league.sway;
  const towns = F().districts.length, held = heldIds(b).length, heldPct = Math.floor((held / towns) * 100);
  const wipe: PathState = {
    id: 'wipe', open: true,
    dial: dialOf([part(s.mine, s.all), s.hqStormed ? 1 : 0, part(s.adminsGone, s.admins)]),
    rows: [
      { text: fill(Ln('rowSites'), { n: s.mine, of: s.all, tag: s.tag }), ok: s.mine >= s.all },
      { text: fill(s.hqStormed ? Ln('rowBossBeaten') : Ln('rowBossNot'), { boss: s.boss }), ok: s.hqStormed },
      { text: fill(Ln('rowAdmins'), { n: s.adminsGone, of: s.admins }), ok: s.adminsGone >= s.admins },
    ],
    done: s.all > 0 && s.mine >= s.all && s.hqStormed && s.adminsGone >= s.admins,
  };
  const shadow: PathState = {
    id: 'shadow', open: true,
    dial: dialOf([part(regard, N.shadowRegard), part(biz.length, N.shadowBiz) * (pillar ? 1 : 0.8), w <= N.shadowWanted ? 1 : 0.5, part(pocket, N.shadowGyms), champ ? 1 : part(lg.sway, T().league.sway)]),
    rows: [
      { text: fill(Ln('rowRegard'), { n: regard, of: N.shadowRegard }), ok: regard >= N.shadowRegard },
      { text: fill(Ln(pillar ? 'rowBiz' : 'rowBizPillar'), { n: biz.length, of: N.shadowBiz }), ok: biz.length >= N.shadowBiz && pillar },
      { text: fill(Ln('rowWanted'), { n: w, max: N.shadowWanted }), ok: w <= N.shadowWanted },
      { text: fill(Ln('rowPocket'), { n: pocket, of: N.shadowGyms }), ok: pocket >= N.shadowGyms },
      { text: Ln(champ ? 'rowChampBought' : 'rowChampNot'), ok: champ },
    ],
    done: regard >= N.shadowRegard && biz.length >= N.shadowBiz && pillar && w <= N.shadowWanted && pocket >= N.shadowGyms && champ,
  };
  const ground = Math.max(part(gyms, N.monarchGyms), part(heldPct, N.monarchHeld));
  const monarch: PathState = {
    id: 'monarch', open: true,
    dial: dialOf([ground, part(lg.elite.length + (lg.champion ? 1 : 0), 5), b.hqLevel >= N.citadel ? 1 : part(b.hqLevel, N.citadel), part(dread, N.monarchDread)]),
    rows: [
      gyms >= heldPct * N.monarchGyms / 100 || gyms >= N.monarchGyms
        ? { text: fill(Ln('rowGyms'), { n: gyms, of: N.monarchGyms }), ok: gyms >= N.monarchGyms || heldPct >= N.monarchHeld }
        : { text: fill(Ln('rowHeldPct'), { n: heldPct, of: N.monarchHeld }), ok: heldPct >= N.monarchHeld },
      { text: lg.champion ? Ln('rowLeagueDone') : fill(Ln(lg.elite.length ? 'rowElite' : 'rowEliteNot'), { n: lg.elite.length }), ok: lg.champion },
      { text: Ln(b.hqLevel >= N.citadel ? 'rowCitadel' : 'rowNoCitadel'), ok: b.hqLevel >= N.citadel },
      { text: fill(Ln('rowDread'), { n: dread, of: N.monarchDread }), ok: dread >= N.monarchDread },
    ],
    done: (gyms >= N.monarchGyms || heldPct >= N.monarchHeld) && lg.champion && b.hqLevel >= N.citadel && dread >= N.monarchDread,
  };
  const goal: PathState = g
    ? {
      id: 'goal', open: true, dial: Math.floor(st.track),
      rows: [
        { text: fill(Ln('rowTrack'), { track: g.track, n: Math.floor(st.track) }), ok: st.track >= 100 },
        { text: fill(Ln('rowStage'), { n: stageAt(st.track) + 1, name: g.stages[stageAt(st.track)]!.name }), ok: st.stage >= 4 },
        { text: !g.finish ? Ln('rowNoFinish') : st.done ? Ln('rowMomentWon') : st.track >= 100 ? Ln('rowMoment') : fill(Ln('rowCost'), { cost: g.cost.name, n: Math.floor(st.cost) }), ok: st.done },
      ],
      done: st.done,
    }
    : { id: 'goal', open: false, dial: 0, rows: [{ text: Ln('rowRule'), ok: false }], done: false };
  return [wipe, shadow, monarch, goal];
}

/** The Goal's stage (0-4) for a Track value. */
export function stageAt(track: number): number {
  const s = T().goal.stages;
  let i = 0;
  while (i < s.length && track >= s[i]!) i += 1;
  return i;
}

// ---------- the Goal Track and its Cost ----------

function gainTrack(b: DominionBlock, n: number): void {
  const g = goalOf(b);
  if (!g || n <= 0) return;
  const st = takeoverOf(b).goal;
  st.track = clamp(Math.round((st.track + n) * 10) / 10, 0, g.finish ? 100 : 99);
}
function gainCost(b: DominionBlock, n: number): void {
  if (!goalOf(b) || n <= 0) return;
  const st = takeoverOf(b).goal;
  st.cost = clamp(Math.round((st.cost + n) * 10) / 10, 0, T().goal.max);
}

/** The night's measures against the last night's: what grew feeds the Track and the Cost (a first look sets the base). */
function feedGoal(b: DominionBlock): string[] {
  const t = takeoverOf(b), m = measures(b), g = goalOf(b), lines: string[] = [];
  const first = !Object.keys(t.last).length;
  if (g && !first) {
    let gain = 0, cost = 0;
    for (const [k, v] of Object.entries(m)) {
      const d = v - (t.last[k] ?? 0);
      if (d <= 0) continue;
      gain += (g.metrics[k] ?? 0) * d;
      cost += (g.costMetrics[k] ?? 0) * d;
    }
    gainTrack(b, Math.min(T().goal.metricCap, gain));
    gainCost(b, cost);
  }
  for (const [k, v] of Object.entries(m)) t.last[k] = Math.max(v, first ? v : t.last[k] ?? v);
  if (!g) return lines;
  const st = t.goal, G = T().goal;
  // Turning Points: each stage's scene once, in order.
  const now = stageAt(st.track);
  while (st.stage < now && st.stage < 4) {
    st.stage += 1;
    st.tp = st.stage;
    const s = g.stages[st.stage]!;
    lines.push(fill(Ln('turningPoint'), { track: g.track, stage: s.name, title: s.title }));
  }
  if (weekly(b)) {
    // The Cost: it falls a little each week; high, the region pushes back; full, the Opposition strikes.
    if (st.cost >= G.warn) {
      addHeat(b, F().hq, G.warnHeat);
      lines.push(fill(Ln('costWarn'), { cost: g.cost.name, n: Math.floor(st.cost), heat: G.warnHeat }));
    }
    if (st.cost >= G.max && !st.done) {
      st.track = clamp(st.track - G.strike);
      lines.push(fill(Ln('costStrike'), { who: g.opposition.name, track: g.track, n: G.strike }));
    }
    st.cost = clamp(st.cost - G.decay, 0, G.max);
  }
  if (g.finish && st.track >= 100 && !st.done && !b.flags.includes('goal-moment-said')) {
    b.flags.push('goal-moment-said');
    lines.push(fill(Ln('momentReady'), { goal: g.name, who: g.opposition.name }));
  }
  return lines;
}

// ---------- Holdings (takeover-bonuses.md) ----------

const H = () => T().holding;
export const priceOf = (h: HoldingDef): number => H().price[h.size]!;

/** Places held through D10/D9 state (Gyms, businesses, the rival HQ, the Champion). */
function viaHeld(b: DominionBlock, via: string): boolean {
  if (via.startsWith('gym:')) return ownedGyms(b).includes(via.slice(4));
  if (via.startsWith('biz:')) return !!b.growth?.biz[via.slice(4)];
  if (via === 'hq') return sitesOf(b).hqStormed;
  if (via === 'champion') return peek(b).league.champion;
  return false;
}
function needsMet(b: DominionBlock, needs: string | undefined): boolean {
  if (!needs) return true;
  if (needs === 'champion') return peek(b).league.champion;
  if (needs === 'hq') return sitesOf(b).hqStormed;
  if (needs.startsWith('gym:')) return ownedGyms(b).includes(needs.slice(4));
  return false;
}
const siteOpen = (b: DominionBlock, site: string | undefined): boolean => {
  if (!site) return true;
  const team = rivalTeams()[0];
  return !team || (b.rivals?.teams[team.id]?.sites[site] ?? 'theirs') !== 'theirs';
};

/** Why a place can't be taken from the Takeover screen right now, or null. Never rolls. */
export function takeProblem(b: DominionBlock, id: string): string | null {
  const h = placeDef(id);
  if (!h || h.region !== F().region) return Ln('noPlace');
  if (h.status === 'disabled') return fill(Ln('placeLater'), { slice: h.needs ?? 'D15' });
  const t = peek(b);
  if (t.hold[id]) return t.hold[id]!.until !== null ? fill(Ln('seizing'), { place: h.place, day: t.hold[id]!.until! }) : fill(Ln('alreadyHeld'), { place: h.place });
  if (h.via) return h.via === 'hq' ? Ln('viaHq') : h.via === 'champion' ? Ln('viaChampion') : h.via.startsWith('gym:') ? fill(Ln('viaGym'), { town: dname(h.district ?? '') }) : fill(Ln('viaBiz'), { town: dname(h.district ?? '') });
  if (!needsMet(b, h.needs)) return fill(Ln('needs'), { need: Ln(`need:${h.needs}`) });
  if (!siteOpen(b, h.site)) return fill(Ln('siteFirst'), { place: h.place });
  if (b.field.fight || t.chain) return Ln('fightWaits');
  if (b.phase !== 'day') return Ln('dayOnly');
  if (b.actions < 1) return Ln('noActions');
  const cost = takeCost(h);
  if (h.kind === 'annex') {
    const left = placesHere().filter((x) => x.district === h.district && x.kind !== 'annex' && x.status !== 'disabled' && !t.hold[x.id]?.until && !(t.hold[x.id] && t.hold[x.id]!.until === null));
    if (left.length) return fill(Ln('annexFirst'), { n: left.length, town: dname(h.district ?? '') });
  }
  if (h.kind === 'infiltrate' && (t.scouts[h.district ?? ''] ?? 0) < H().infiltrate) return fill(Ln('scoutFirst'), { n: H().infiltrate - (t.scouts[h.district ?? ''] ?? 0), town: dname(h.district ?? '') });
  if (cost && b.funds < cost) return fill(Ln('noMoney'), { cost: money(cost) });
  return null;
}
/** What taking it costs up front: a buy-out or a home its price, Infiltrate a share of it (the bribe), an Annex its price. */
export function takeCost(h: HoldingDef): number {
  if (h.kind === 'buyout' || h.kind === 'home' || h.kind === 'annex') return priceOf(h);
  if (h.kind === 'infiltrate') return Math.round((priceOf(h) * H().infiltratePct) / 100);
  return 0;
}
const defaultFoe = (h: HoldingDef) => h.foe ?? { name: h.kind === 'annex' ? Ln('mayor') : Ln('guards'), cls: h.kind === 'annex' ? 'gentleman' : 'veteran', species: ['growlithe', 'machop', 'pidgeotto'], offset: h.size === 'XL' ? 3 : h.size === 'L' ? 2 : 1 };

function startChain(b: DominionBlock, what: string, sides: TakeoverState['chain'] extends infer C ? C extends { sides: infer S } ? S : never : never, district: string): void {
  const t = takeoverOf(b);
  t.chain = { what, step: 0, sides };
  b.field.fight = { why: 'takeover', foe: 'takeover', begun: false, action: what, target: null, district, pass: true, big: false, wager: 0, racket: null };
}

/** Takes a place (the Takeover screen's Holdings page). A fight-based way leaves a battle waiting. */
export function take(block: DominionBlock, id: string): { ok: boolean; block: DominionBlock; notice: string | null; fight: boolean } {
  const why = takeProblem(block, id);
  if (why) return { ok: false, block, notice: why, fight: false };
  const b = structuredClone(block), h = placeDef(id)!, d = h.district ?? F().hq;
  b.actions -= 1;
  const cost = takeCost(h);
  if (cost) b.funds -= cost;
  if (h.kind === 'buyout' || h.kind === 'home' || h.kind === 'infiltrate') {
    const lines = hold(b, h, h.kind === 'infiltrate' ? 'infiltrate' : h.kind === 'home' ? 'home' : 'buy', null);
    return { ok: true, block: b, notice: [fill(Ln(h.kind === 'infiltrate' ? 'tookQuiet' : 'tookBuy'), { place: h.place, cost: money(cost) }), ...lines].join(' '), fight: false };
  }
  const foe = defaultFoe(h);
  const n = h.kind === 'raid' ? H().raid[h.size]! : 1;
  const sides = Array.from({ length: n }, (_, i) => ({ name: i === n - 1 && n > 1 ? `${foe.name} (the boss)` : foe.name, cls: foe.cls, leaderId: null, species: foe.species, offset: foe.offset + i }));
  startChain(b, `place:${id}`, sides, d);
  return { ok: true, block: b, notice: fill(Ln('chainNext'), { n: 1, of: n, name: sides[0]!.name }), fight: true };
}

/** A place becomes yours (or starts its hold, for Seize). Its once-only bonus lands now. */
function hold(b: DominionBlock, h: HoldingDef, way: TakeoverState['hold'][string]['way'], until: number | null): string[] {
  const t = takeoverOf(b), lines: string[] = [];
  t.hold[h.id] = { day: b.day, way, cond: 100, paid: true, until };
  if (until !== null) return [fill(Ln('seizeStart'), { place: h.place, days: until - b.day })];
  const ds = h.district ? b.field.districts[h.district] : undefined;
  if (ds && way !== 'via') ds.control = clamp(ds.control + H().control[h.size]!);
  if (way === 'raid' && ds) ds.dread += 3;
  lines.push(fill(Ln('holdingNew'), { place: h.place, bonus: h.bonus.name, text: h.bonus.text }));
  for (const f of h.fx) if (f.k === 'once') lines.push(...onceFx(b, f, h));
  if (h.kind === 'annex' && h.district) queueTown(b, h.district);
  return lines;
}
function onceFx(b: DominionBlock, f: HoldingFx, h: HoldingDef): string[] {
  const pend = (b.crew ??= freshCrewState()).pending;
  if (f.item) pend.push({ k: 'item', id: f.item, n: 1 });
  if (f.mon) pend.push({ k: 'mon', species: f.mon, level: Math.max(5, Math.min(b.levelCap, 15)), src: 'rescued' });
  if (f.funds) {
    b.funds += f.funds;
    b.earned += f.funds;
  }
  if (f.regard && h.district && b.field.districts[h.district]) b.field.districts[h.district]!.regard += f.regard;
  return [fill(Ln('onceGot'), { place: h.place })];
}

/** Keeps the D10/D9-held places in step with that state (a Gym lost to Defiance, a business sold). */
function syncVia(b: DominionBlock): string[] {
  const t = takeoverOf(b), lines: string[] = [];
  for (const h of placesHere()) {
    if (!h.via || h.status === 'disabled') continue;
    const on = viaHeld(b, h.via);
    if (on && !t.hold[h.id]) lines.push(...hold(b, h, 'via', null));
    else if (!on && t.hold[h.id]?.way === 'via') {
      delete t.hold[h.id];
      lines.push(fill(Ln('holdingGone'), { place: h.place, bonus: h.bonus.name }));
    }
  }
  return lines;
}

/** The week's Bonuses, upkeep and attacks; the seize holds each night. */
function holdingsNight(b: DominionBlock, seed: string): string[] {
  const t = takeoverOf(b), lines: string[] = [...syncVia(b)];
  const rng = new Rng(hashSeed(`${seed}::dominion-holding::${b.day}`));
  // Seize: hold it by force for some days; each night a counter-attack may wear it down.
  for (const [id, st] of Object.entries(t.hold)) {
    if (st.until === null) continue;
    const h = placeDef(id)!;
    if (rng.int(1, 100) <= H().seizeHit) {
      st.cond = clamp(st.cond - H().seizeLoss);
      lines.push(fill(Ln('seizeHit'), { place: h.place, n: st.cond }));
      if (st.cond <= 0) {
        delete t.hold[id];
        lines.push(fill(Ln('seizeLost'), { place: h.place }));
        continue;
      }
    }
    if (b.day >= st.until) {
      st.until = null;
      st.day = b.day;
      lines.push(...hold(b, h, 'seize', null).map((l) => l));
    }
  }
  if (!weekly(b)) return lines;
  const held = heldPlaces(b).map((id) => [id, placeDef(id)!] as const).filter(([, h]) => !!h);
  // Upkeep: 3% of the price a week (D10's places pay theirs through D10). Unpaid, the Bonus pauses and Condition drops.
  const cheap = held.reduce((a, [, h]) => a + h.fx.filter((f) => f.k === 'upkeep').reduce((x, f) => x + (f.n ?? 0), 0), 0);
  for (const [id, h] of held) {
    const st = t.hold[id]!;
    if (st.way === 'via') continue;
    const due = Math.round((priceOf(h) * H().upkeepPct * Math.max(0, 100 - cheap)) / 10000);
    if (b.funds >= due) {
      b.funds -= due;
      st.paid = true;
    } else {
      st.paid = false;
      st.cond = clamp(st.cond - H().unpaid);
      lines.push(fill(Ln('unpaid'), { place: h.place, cost: money(due) }));
    }
  }
  // Attacks: while a rival team is angry, one Holding a week is hit (Condition 0 loses it, Part 3 §4).
  const angry = Object.values(b.rivals?.teams ?? {}).some((x) => x.tension >= H().attackTension);
  const targets = held.filter(([id]) => t.hold[id]!.way !== 'via');
  if (angry && targets.length) {
    const [id, h] = targets[rng.int(0, targets.length - 1)]!;
    const st = t.hold[id]!;
    st.cond = clamp(st.cond - H().attack);
    lines.push(fill(Ln('attacked'), { place: h.place, n: st.cond }));
  }
  for (const [id, st] of Object.entries(t.hold)) {
    if (st.until === null && st.cond <= 0) {
      delete t.hold[id];
      lines.push(fill(Ln('holdingLost'), { place: placeDef(id)?.place ?? id }));
    }
  }
  // Bonuses (and set bonuses: three of one group).
  const live = heldPlaces(b).map((id) => placeDef(id)!).filter((h) => h && t.hold[h.id]!.paid);
  const groups: Record<string, number> = {};
  for (const h of live) groups[h.group] = (groups[h.group] ?? 0) + 1;
  const sets = T().sets.filter((s) => s.region === F().region && s.status !== 'disabled' && (groups[s.group] ?? 0) >= s.n);
  const all: [HoldingFx, HoldingDef | null][] = [...live.flatMap((h) => h.fx.map((f) => [f, h] as [HoldingFx, HoldingDef])), ...sets.flatMap((s) => s.fx.map((f) => [f, null] as [HoldingFx, null]))];
  const cut = all.reduce((a, [f]) => a + (f.k === 'cut' ? f.n ?? 0 : 0), 0);
  let income = 0;
  for (const [f, h] of all) income += weekFx(b, f, h, seed);
  if (income) {
    const pay = Math.round((income * (100 + cut)) / 100);
    b.funds += pay;
    b.earned += pay;
    lines.push(fill(Ln('holdingsWeek'), { n: money(pay), count: live.length }));
  }
  for (const s of sets) if (!b.flags.includes(`set:${s.name}`)) {
    b.flags.push(`set:${s.name}`);
    lines.push(fill(Ln('setBonus'), { name: s.name, text: s.text }));
  }
  return lines;
}

/** One Bonus for the week. Returns money it pays (summed, then the corporate cut). */
function weekFx(b: DominionBlock, f: HoldingFx, h: HoldingDef | null, seed: string): number {
  const district = h?.district ?? F().hq;
  const towns = f.where === 'region' ? Object.values(b.field.districts) : [b.field.districts[district]].filter((x) => !!x);
  if (f.every && Math.floor(b.day / WEEK()) % Math.round(f.every / WEEK()) !== 0) return 0;
  const pend = (b.crew ??= freshCrewState()).pending;
  switch (f.k) {
    case 'income': return f.n ?? 0;
    case 'regard': for (const d of towns) d!.regard += f.n ?? 0; return 0;
    case 'dread': for (const d of towns) d!.dread += f.n ?? 0; return 0;
    case 'heat': for (const id of f.where === 'region' ? Object.keys(b.field.districts) : [district]) addHeat(b, id, -(f.n ?? 0)); return 0;
    case 'loyalty': for (const m of b.members) addLoyalty(b, m, f.n ?? 0); return 0;
    case 'heal': for (const m of b.members) if (m.crew?.out?.why === 'hurt') m.crew.out = null; return 0; // the hurt are back on their feet
    case 'recruit': {
      const finder = b.members[0];
      if (finder) for (let i = 0; i < (f.n ?? 1); i++) makeLead(b, finder, `${seed}::holding::${h?.id ?? 'set'}::${b.day}::${i}`);
      return 0;
    }
    case 'catch': {
      const pool = f.species ?? [];
      const r = new Rng(hashSeed(`${seed}::dominion-holding-catch::${h?.id ?? 'set'}::${b.day}`));
      for (let i = 0; i < (f.n ?? 1) && pool.length; i++) pend.push({ k: 'mon', species: pool[r.int(0, pool.length - 1)]!, level: Math.max(5, Math.round(b.levelCap * 0.6)), src: 'caught' });
      return 0;
    }
    case 'item': if (f.id) pend.push({ k: 'item', id: f.id, n: f.n ?? 1 }); return 0;
    case 'train': {
      const stat = f.stat as StatId;
      const m = [...b.members].sort((x, y) => x.stats[stat] - y.stats[stat])[0];
      if (m && m.stats[stat] < 10) m.stats[stat] += 1;
      return 0;
    }
    case 'hero': b.field.hero = Math.max(0, b.field.hero - (f.n ?? 0)); return 0;
    case 'clean': {
      const n = Math.min(f.n ?? 0, Math.max(0, b.funds - (b.hq?.clean ?? 0)));
      if (n > 0) {
        b.funds -= n;
        addClean(b, n);
      }
      return 0;
    }
    case 'intel': for (const t of rivalTeams()) learnPlan(b, t.id); return 0;
    default: return 0; // odds (the Card), cut (summed), upkeep (paid above), once (on taking)
  }
}

// ---------- the hijacked broadcast (m13) ----------

function queueTown(b: DominionBlock, town: string): void {
  const bc = takeoverOf(b).bcast;
  if (bc.seen.includes(town) || bc.queue.includes(town)) return;
  bc.queue.push(town);
}
/** The next broadcast to play: the town (or the whole region), the team, and what changed. */
export function broadcastOf(b: DominionBlock): { town: string; region: boolean; team: string; head: string; small: string; say: string; ticker: string[] } | null {
  const raw = peek(b).bcast.queue[0];
  if (!raw) return null;
  const id = raw.startsWith('air:') ? raw.slice(4) : raw; // 'air:' a Pirate Radio hijack (row 87), any number of times
  const B = T().broadcast, team = b.teamName ?? 'Your crew', region = id === 'region';
  const town = region ? cap(F().region) : dname(id);
  const v = { team, town, region: town };
  const say = region ? fill(B.region, v) : fill(B.say[(peek(b).bcast.seen.length) % B.say.length]!, v);
  const ticker: string[] = [];
  if (!region) {
    const here = heldPlaces(b).map((x) => placeDef(x)).filter((h) => h?.district === id);
    for (const h of here.slice(0, 3)) ticker.push(fill(Ln('tickHolding'), { team, place: h!.place }));
    const rival = rivalTeams()[0];
    if (rival && (b.field.districts[id]?.rival ?? 0) < 20) ticker.push(fill(Ln('tickRival'), { rival: rival.name.replace(/^Team /, '') , town }));
    ticker.push(Ln('tickPolice'));
  } else ticker.push(fill(Ln('tickRegion'), { team, region: town }), Ln('tickPolice'));
  return { town, region, team, head: fill(region ? Ln('headRegion') : B.head, v), small: fill(B.small, { team: team.toUpperCase() }), say, ticker };
}
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- the night: paths, the Goal, Holdings, broadcasts ----------

addWorldEnd((b, seed) => {
  if (!b.opened) return [];
  const t = takeoverOf(b), lines: string[] = [];
  lines.push(...holdingsNight(b, seed));
  lines.push(...feedGoal(b));
  // A town that reaches Owned is announced once (the hijacked broadcast).
  for (const [id, d] of Object.entries(b.field.districts)) if (statusOf(d) === 'owned') queueTown(b, id);
  lines.push(...checkPaths(b));
  return lines;
});

/** A path finished: the first one calls the Hero's final stand (Part 5 §1); beating the Hero leaves the region Taken. */
export function checkPaths(b: DominionBlock): string[] {
  const t = takeoverOf(b), lines: string[] = [];
  const names = Object.fromEntries(T().paths.map((p) => [p.id, p.name]));
  for (const p of pathsOf(b)) {
    if (!p.done || t.paths.includes(p.id)) continue;
    t.paths.push(p.id);
    if (!t.won) {
      t.won = { path: p.id, day: b.day };
      callFinalStand(b);
      lines.push(fill(Ln('pathWon'), { path: names[p.id]!, region: cap(F().region) }));
    } else lines.push(fill(Ln('pathAlso'), { path: names[p.id]! }));
  }
  // The Shadow cracks if Wanted passes 60 after it won (go to Monarch, or lose three towns).
  const N = T().need;
  if (t.paths.includes('shadow') && !t.cracked && wanted(b.field) > N.crack && !t.paths.includes('monarch')) {
    t.cracked = true;
    const top = Object.entries(b.field.districts).filter(([id]) => id !== F().hq).sort((x, y) => y[1].control - x[1].control).slice(0, N.crackTowns);
    for (const [, d] of top) d.control = Math.min(d.control, F().control.contested - 1);
    lines.push(fill(Ln('cracked'), { n: top.length }));
  }
  if (t.won && !t.taken && b.hero?.stand?.state === 'done') {
    t.taken = { path: t.won.path, day: b.day };
    queueTown(b, 'region');
    lines.push(fill(Ln('taken'), { region: cap(F().region), path: names[t.won.path]! }));
  }
  return lines;
}

// ---------- the Takeover screen's own steps ----------

export function takeoverStep(block: DominionBlock, op: 'seen' | 'moment' | 'storm' | 'take' | 'bcast', id: string | undefined): { ok: boolean; block: DominionBlock; notice: string | null; fight: boolean } {
  const no = (notice: string): { ok: false; block: DominionBlock; notice: string; fight: false } => ({ ok: false, block, notice, fight: false });
  const b = structuredClone(block);
  const t = takeoverOf(b);
  switch (op) {
    case 'seen': t.goal.tp = null; return { ok: true, block: b, notice: null, fight: false };
    case 'bcast': {
      const id0 = t.bcast.queue.shift();
      if (id0) t.bcast.seen.push(id0);
      return { ok: true, block: b, notice: null, fight: false };
    }
    case 'take': return id ? take(block, id) : no(Ln('noPlace'));
    case 'moment': {
      const why = momentProblem(block);
      if (why) return no(why);
      const g = goalOf(b)!;
      startChain(b, 'moment', [{ name: g.opposition.foe.name, cls: g.opposition.foe.cls, leaderId: g.opposition.foe.leaderId, species: g.opposition.foe.species, offset: 4 }], F().hq);
      return { ok: true, block: b, notice: fill(Ln('momentStart'), { goal: g.name, who: g.opposition.name }), fight: true };
    }
    case 'storm': {
      const why = stormProblem(block);
      if (why) return no(why);
      const team = rivalTeams()[0]!, rt = b.rivals!.teams[team.id]!;
      const admins = team.admins.filter((a) => rt.admins.includes(a.id)).map((a) => ({ name: a.name, cls: 'gym-leader', leaderId: ['archer', 'ariana', 'proton', 'petrel'].includes(a.id) ? a.id : null, species: a.species, offset: 2 }));
      const boss = { name: team.boss.name, cls: 'gym-leader', leaderId: team.boss.id, species: team.boss.species, offset: 4 };
      const hq = team.sites.find((s) => s.hq);
      b.actions -= 1;
      startChain(b, `storm:${team.id}`, [...admins, boss], hq?.district ?? F().hq);
      return { ok: true, block: b, notice: fill(Ln('stormStart'), { n: admins.length + 1, boss: team.boss.name }), fight: true };
    }
  }
}
export function momentProblem(b: DominionBlock): string | null {
  const g = goalOf(b), st = peek(b).goal;
  if (!g) return Ln('rowRule');
  if (!g.finish) return Ln('rowNoFinish');
  if (st.done) return Ln('rowMomentWon');
  if (st.track < 100) return fill(Ln('momentNotYet'), { track: g.track, n: Math.floor(st.track) });
  if (b.field.fight || peek(b).chain) return Ln('fightWaits');
  return null;
}
export function stormProblem(b: DominionBlock): string | null {
  const s = sitesOf(b), team = rivalTeams()[0];
  if (!team) return Ln('noRival');
  if (s.hqStormed) return fill(Ln('stormDone'), { boss: s.boss });
  if (s.mine < s.all - 1) return fill(Ln('stormSites'), { n: s.all - 1 - s.mine, tag: s.tag });
  if (b.field.fight || peek(b).chain) return Ln('fightWaits');
  if (b.phase !== 'day') return Ln('dayOnly');
  if (b.actions < 1) return Ln('noActions');
  return null;
}

// ---------- the fights (fight.ts builds the battle from takeoverSide) ----------

export function takeoverSide(b: DominionBlock, run: Pick<RunState, 'party'>): { name: string; classId: string; leaderId: string | null; species: string[]; level: number } | null {
  const ch = b.takeover?.chain;
  const side = ch?.sides[ch.step];
  if (!ch || !side) return null;
  return { name: side.name, classId: side.cls, leaderId: side.leaderId, species: side.species, level: foeLevel(b, run, side.offset) };
}

setTakeoverFoe((b, run) => {
  const s = takeoverSide(b, run);
  return s ? { name: s.name, species: s.species[0]!, level: s.level, wild: false } : { name: 'A guard', species: 'rattata', level: 5, wild: false };
});

addFightSettler('takeover', (_content, b, _run, _fight, outcome) => {
  const t = takeoverOf(b), ch = t.chain;
  if (!ch) return [];
  const of = ch.sides.length;
  if (outcome !== 'win') {
    t.chain = null;
    return lostChain(b, ch.what);
  }
  if (ch.what.startsWith('storm:') && ch.step < of - 1) {
    // An Admin beaten in their own HQ is gone for good (recruited, jailed or fled: Part 5 §1).
    const team = rivalTeams().find((x) => x.id === ch.what.slice(6));
    const a = team?.admins.find((x) => x.name === ch.sides[ch.step]!.name);
    const rt = team ? b.rivals?.teams[team.id] : undefined;
    if (a && rt) rt.admins = rt.admins.filter((x) => x !== a.id);
  }
  if (ch.step + 1 < of) {
    t.chain = { ...ch, step: ch.step + 1 };
    b.field.fight = { why: 'takeover', foe: 'takeover', begun: false, action: ch.what, target: null, district: _fight.district, pass: true, big: false, wager: 0, racket: null };
    return [fill(Ln('chainNext'), { n: ch.step + 2, of, name: ch.sides[ch.step + 1]!.name })];
  }
  t.chain = null;
  return [...wonChain(b, ch.what), ...checkPaths(b)];
});

function wonChain(b: DominionBlock, what: string): string[] {
  const t = takeoverOf(b);
  if (what === 'moment') {
    const g = goalOf(b)!;
    t.goal.done = true;
    t.goal.tp = null;
    return [fill(Ln('momentWon'), { goal: g.name, who: g.opposition.name })];
  }
  if (what.startsWith('storm:')) {
    const team = rivalTeams().find((x) => x.id === what.slice(6))!;
    const rt = (b.rivals ??= rivalsOf(b)).teams[team.id]!;
    rt.admins = [];
    const hq = team.sites.find((s) => s.hq);
    if (hq) rt.sites[hq.id] = 'yours';
    if (!b.flags.includes(`beat:${team.id}:hq`)) b.flags.push(`beat:${team.id}:hq`);
    if (!b.flags.includes(`beat:${team.id}:boss`)) b.flags.push(`beat:${team.id}:boss`);
    rt.power -= 5;
    if (hq) {
      const ds = b.field.districts[hq.district];
      if (ds) {
        ds.rival = 0;
        ds.dread += 10;
      }
    }
    return [fill(Ln('stormWon'), { boss: team.boss.name, team: team.name })];
  }
  if (what.startsWith('elite:')) {
    const id = what.slice(6);
    if (!t.league.elite.includes(id)) t.league.elite.push(id);
    const who = leagueOf(b).elite.find((e) => e.id === id)!;
    return [fill(Ln(eliteDone(b) ? 'eliteAll' : 'eliteWon'), { name: who.name, n: t.league.elite.length, champion: leagueOf(b).champion.name })];
  }
  if (what === 'champion') {
    t.league.champion = true;
    for (const d of Object.values(b.field.districts)) d.dread += 5;
    return [fill(Ln('championWon'), { name: leagueOf(b).champion.name })];
  }
  if (what.startsWith('place:')) {
    const h = placeDef(what.slice(6))!;
    if (h.kind === 'seize') return hold(b, h, 'seize', b.day + H().hold[h.size]!);
    if (h.kind === 'raid') addHeat(b, h.district ?? F().hq, 5);
    return hold(b, h, h.kind === 'annex' ? 'annex' : h.kind === 'raid' ? 'raid' : 'seize', null);
  }
  return [];
}
function lostChain(b: DominionBlock, what: string): string[] {
  const t = takeoverOf(b), G = T().goal;
  if (what === 'moment') {
    const g = goalOf(b)!;
    t.goal.lost += 1;
    t.goal.track = clamp(t.goal.track - G.lose);
    gainCost(b, G.loseCost);
    b.flags = b.flags.filter((f) => f !== 'goal-moment-said');
    return [fill(Ln('momentLost'), { who: g.opposition.name, track: g.track, n: G.lose })];
  }
  if (what.startsWith('storm:')) return [Ln('stormLost')];
  if (what.startsWith('place:')) {
    const h = placeDef(what.slice(6));
    if (h?.district) addHeat(b, h.district, 4);
    return [fill(Ln('placeLost'), { place: h?.place ?? '' })];
  }
  return [Ln('leagueLost')];
}

// ---------- the D14 Boss actions (list rows 451-465, 586-600) ----------

/** Unlock words the generic rules don't read: "Takeover won", "Hero stage 5", "Final stage". */
addActionGate((b, def) => {
  if (!T().play[def.id]) return null;
  if (def.unlock === 'Takeover won' && !peek(b).won) return Ln('gateTaken');
  if (def.unlock === 'Hero stage 5' && !b.hero?.stand) return Ln('gateStand');
  if ((def.unlock === 'Final stage' || def.unlock === 'Champion stage') && !eliteDone(b)) return Ln('gateElite');
  if (def.id === 'elite-duel' && eliteDone(b)) return Ln('gateEliteDone');
  if (def.id === 'champion-duel' && peek(b).league.champion) return Ln('gateChampDone');
  if ((def.id === 'elite-duel' || def.id === 'champion-duel') && (b.field.fight || peek(b).chain)) return Ln('fightWaits');
  return null;
});

addActEffect('league', (b, x) => {
  const t = takeoverOf(b), L = T().league, lg = t.league;
  const next = nextElite(b);
  switch (x.action) {
    case 'study-the-elite-four': {
      const e = leagueOf(b).elite.find((y) => !lg.elite.includes(y.id) && !lg.studied.includes(y.id));
      if (!e) return [Ln('studyNone')];
      lg.studied.push(e.id);
      return [fill(Ln('studied'), { name: e.name, n: L.studied })];
    }
    case 'elite-debate': case 'elite-rumour': case 'elite-gift': {
      const e = leagueOf(b).elite.find((y) => !lg.elite.includes(y.id) && !lg.swayed.includes(y.id));
      if (!e) return [];
      lg.swayed.push(e.id);
      return [fill(Ln('swayed'), { name: e.name })];
    }
    case 'elite-bribe': case 'champion-s-aide': case 'champion-letter': case 'gate-guard-bribe': case 'elite-s-weak-spot': case 'meet-the-champion': {
      lg.sway += 1;
      return [lg.sway === L.sway ? fill(Ln('champBought'), { name: leagueOf(b).champion.name }) : fill(Ln('sway'), { n: lg.sway, of: L.sway })];
    }
    case 'elite-duel': {
      if (!next) return [];
      const swayed = lg.swayed.includes(next.id), studied = lg.studied.includes(next.id);
      const species = swayed ? next.species.slice(0, -1) : next.species;
      startChain(b, `elite:${next.id}`, [{ name: `Elite ${next.name}`, cls: 'gym-leader', leaderId: next.id, species, offset: next.offset - (studied ? L.studied : 0) }], x.district);
      return [fill(Ln('eliteFight'), { name: next.name })];
    }
    case 'champion-duel': {
      const c = leagueOf(b).champion;
      startChain(b, 'champion', [{ name: `Champion ${c.name}`, cls: 'gym-leader', leaderId: c.id, species: c.species, offset: c.offset }], x.district);
      return [fill(Ln('champFight'), { name: c.name })];
    }
  }
  return [];
});

/** Pirate Radio (row 87): the Boss's own clip cuts into the town's evening news (the m13 broadcast plays). */
addActEffect('broadcast', (b, x) => {
  const bc = takeoverOf(b).bcast, key = `air:${x.district}`;
  if (!bc.queue.includes(key)) bc.queue.push(key);
  return [];
});

/** The plans: a Plan point for the final stand, and each path's own push. */
addActEffect('plan', (b, x) => {
  const t = takeoverOf(b), L = T().league;
  const point = (): string[] => {
    if (t.plan >= L.plans) return [];
    t.plan += 1;
    return [fill(Ln('planPoint'), { n: t.plan, of: L.plans })];
  };
  switch (x.action) {
    case 'final-stand-prep': return point();
    case 'takeover-speech': return lead(b);
    case 'wipe-out-plan': {
      for (const team of rivalTeams()) weaken(b, team.id, 2);
      return [Ln('planWipe')];
    }
    case 'shadow-plan': for (const d of Object.values(b.field.districts)) d.regard += 2; return [Ln('planShadow')];
    case 'monarch-plan': for (const d of Object.values(b.field.districts)) d.dread += 2; return [Ln('planMonarch')];
    case 'goal-plan': {
      const g = goalOf(b);
      if (!g) return [];
      gainTrack(b, 3);
      return [fill(Ln('planGoal'), { track: g.track })];
    }
  }
  return [];
});
/** A push toward the path you're closest to (a speech, a crew plan with no Goal). */
function lead(b: DominionBlock): string[] {
  const best = pathsOf(b).filter((p) => p.open && !p.done && p.id !== 'goal').sort((x, y) => y.dial - x.dial)[0];
  if (!best) return [];
  if (best.id === 'wipe') for (const team of rivalTeams()) weaken(b, team.id, 1);
  else for (const d of Object.values(b.field.districts)) d[best.id === 'shadow' ? 'regard' : 'dread'] += 1;
  return [fill(Ln('planLead'), { path: T().paths.find((p) => p.id === best.id)!.name })];
}

// Peace Treaty's Tension and the endgame's Loyalty/Morale come from the generic Lv 1 numbers (D10's after-hook).

/** Goal sections: each worked action in one of the Goal's sections feeds the Track (and the Cost). Scouting counts for Infiltrate. */
addActedHook((b, def, district, won) => {
  if (!won) return;
  const g = goalOf(b);
  if (g) {
    gainTrack(b, g.sections[def.section] ?? 0);
    gainCost(b, g.costSections[def.section] ?? 0);
  }
});
addActAfter((b, x, play) => {
  if (play.effect === 'scout' || play.effect === 'count' || play.effect === 'scoutDistrict') {
    const t = takeoverOf(b);
    t.scouts[x.district] = (t.scouts[x.district] ?? 0) + 1;
  }
  return [];
});

/** Holdings that raise the odds of the Boss's jobs (a Gym's lessons, Silph's Card Key, the Gym Circuit set). */
addCardHook((b, _run, c) => {
  const t = b.takeover;
  if (!t) return;
  const sets = T().sets.filter((s) => s.region === F().region && s.status !== 'disabled');
  const groups: Record<string, number> = {};
  for (const id of heldPlaces(b)) {
    const h = placeDef(id);
    if (h && t.hold[id]!.paid) groups[h.group] = (groups[h.group] ?? 0) + 1;
  }
  for (const id of heldPlaces(b)) {
    const h = placeDef(id);
    if (!h || !t.hold[id]!.paid) continue;
    for (const f of h.fx) {
      if (f.k !== 'odds') continue;
      if (f.stat && c.def.stat !== f.stat) continue;
      if (f.where !== 'region' && c.district.id !== h.district) continue;
      addPart(c, h.bonus.name, f.n ?? 0);
    }
  }
  for (const s of sets) if ((groups[s.group] ?? 0) >= s.n) for (const f of s.fx) if (f.k === 'odds') addPart(c, s.name, f.n ?? 0);
});

// ---------- crew tasks of kind 'takeover' (AQ and section M) ----------

addTaskKind('takeover', (b, m, ok, ctx) => {
  if (!ok) return;
  const does = ctx.task.effect?.does;
  const t = takeoverOf(b), L = T().league;
  if (does === 'loyalty') {
    for (const x of b.members) addLoyalty(b, x, ctx.lv >= 3 ? 2 : 1);
    ctx.say('crew', fill(Ln('taskLoyalty'), { name: m.name }));
  } else if (does === 'coup') {
    for (const team of rivalTeams()) weaken(b, team.id, 1);
    const team = rivalTeams()[0];
    if (team) addTension(b, team.id, 2);
    ctx.say('rival', fill(Ln('taskCoup'), { name: m.name }));
  } else if (does === 'track' && goalOf(b)) {
    gainTrack(b, ctx.lv >= 3 ? 2 : 1);
    ctx.say('crew', fill(Ln('taskTrack'), { name: m.name, track: goalOf(b)!.track }));
  } else {
    // A plan (or a project with no Goal): one Plan point, and Goal Track +1 when there is a Goal.
    if (t.plan < L.plans) t.plan += 1;
    if (goalOf(b)) gainTrack(b, 1);
    ctx.say('crew', fill(Ln('taskPlan'), { name: m.name, n: t.plan, of: L.plans }));
  }
  addMorale(m, 1);
});
