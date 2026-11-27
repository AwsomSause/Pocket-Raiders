// DOMINION redesign R3 (pass 50, The Day): simple real rules for the six pages that had none (director answer
// 2026-11-26). Data in theDay.json.
//
// - Weather (Rotom's forecast): each day has one sky, drawn from the run seed and the day on its own stream
//   (`dominion-weather`), so the week ahead can be shown and never changes. Day 1 is always Sunny. The World Turn
//   saves the new day's sky on the block (`field.sky`); it moves the odds of jobs that test one stat (the Boss's Card
//   and the crew's tasks) and a job's Heat. A storm stops the trains and floods the Underground Path.
// - Ways to travel: the Boss picks a standing way (`field.route`). Main road: a rival's toll for each district of theirs
//   the road passes through. Back streets: one more action, no toll. Magnet Line: from a station to a station for a
//   fare and no actions; a police check on board when the place you go to is hot. A storm cancels the trains (main road).
// - Flooded tunnel: on a storm day a walk through the Underground Path (Cerulean–Saffron–Vermilion) asks how
//   (`field.wet`, for that day): wade (−5% on the job), ride a Pokémon that knows Surf (Heat +2), or go round (one
//   more action, the default).
// - Scrapbook: each morning after a job, the paper's headline is clipped into `paper.book` (the last 30 stay).
// - Newsstand and Press interview: three papers spin yesterday's job (plain, fear, kind). Once a week the Boss can give
//   an interview for a day action: fear (Dread up, Regard down) or kind (Regard up, a little Heat) where the job was.
//
// Pure rules: the models never change the block; only `dayStep` (an action) and the World Turn do.

import { z } from 'zod';
import raw from '../../data/dominion/theDay.json';
import type { RunState } from '../state';
import { hashSeed, Rng } from '../rng';
import { DOMINION_DATA } from './data';
import { addOddsHook } from './crew';
import { addCardHook, addHeat, districtDef, statusOf, syncHeat, type Card } from './field';
import { paperModel, paperOf } from './moments';
import { teamDef, teamsHere } from './rivals';
import { STAT_IDS, type DominionAction, type DominionBlock, type StatId } from './schema';
import { addWorldEnd, fill } from './worldTurn';

const S = z.string().min(1);
const I = z.number().int();
const N0 = I.min(0);
const STAT = z.enum(STAT_IDS);
const Fx = z.tuple([z.enum(['up', 'dn']), S, S]);
export const SKIES = ['sunny', 'rain', 'storm', 'fog', 'hot'] as const;
export type Sky = (typeof SKIES)[number];
export const ROUTES = ['road', 'back', 'train'] as const;
export type Route = (typeof ROUTES)[number];
export const WETS = ['wade', 'ride', 'round'] as const;
export type Wet = (typeof WETS)[number];

const Way = z.object({ name: S, what: S, toll: N0.optional(), extra: N0.optional(), fare: N0.optional(), policeAt: N0.optional(), policeHeat: N0.optional() }).strict();
const WetWay = z.object({ name: S, what: S, cost: S, odds: I.optional(), heat: N0.optional(), move: S.optional(), extra: N0.optional() }).strict();
export const TheDayFileSchema = z.object({
  _source: S,
  weather: z.object({
    forecast: I.min(1).max(14),
    kinds: z.array(z.object({
      id: z.enum(SKIES), word: S, icon: S, weight: N0, odds: z.partialRecord(STAT, I), heat: I, trains: z.boolean(), flood: z.boolean(), fx: z.array(Fx),
    }).strict()).length(SKIES.length),
    words: z.object({ today: S, rotom: S, tipGood: S, tipBad: S, tipNone: S }).strict(),
  }).strict(),
  travel: z.object({
    ways: z.object({ road: Way, back: Way, train: Way }).strict(),
    stations: z.array(S).min(2),
    lines: z.array(z.object({ id: S, name: S, colour: z.string().regex(/^#[0-9a-f]{6}$/), stops: z.array(S).min(2) }).strict()).min(1),
    first: I.min(0).max(23), every: I.min(1).max(60),
    tunnel: z.array(z.tuple([S, S])),
    flood: z.object({ wade: WetWay, ride: WetWay, round: WetWay }).strict(),
    lines2: z.record(S, S),
  }).strict(),
  papers: z.object({
    city: S, gazette: S,
    heads: z.object({ fear: z.array(S).min(1), kind: z.array(S).min(1), quiet: z.array(S).min(1) }).strict(),
    decks: z.object({ fear: S, kind: S, quiet: S }).strict(),
    interview: z.object({
      every: I.min(1), fear: z.object({ dread: I, regard: I }).strict(), kind: z.object({ regard: I, heat: I }).strict(), said: S, wait: S,
    }).strict(),
    book: I.min(1),
    lines: z.record(S, S),
    ask: z.object({ line: S, kind: S, fear: S, walk: S }).strict(),
  }).strict(),
}).strict();
export type TheDayFile = z.infer<typeof TheDayFileSchema>;
export const THE_DAY: TheDayFile = TheDayFileSchema.parse(raw);
const W = () => THE_DAY.weather;
const T = () => THE_DAY.travel;
const P = () => THE_DAY.papers;
const L = () => THE_DAY.travel.lines2;
const F = () => DOMINION_DATA.field;
const O = () => DOMINION_DATA.field.odds;
const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));
const dname = (id: string): string => districtDef(id)?.name ?? id;

// ---------- weather ----------

export type SkyDef = TheDayFile['weather']['kinds'][number];
export const skyDef = (id: Sky): SkyDef => W().kinds.find((k) => k.id === id)!;

/** The sky on a day of this run (stream `dominion-weather`; Day 1 is always Sunny). Never changes. */
export function weatherOn(seed: string, day: number): Sky {
  if (day <= 1) return 'sunny';
  const r = new Rng(hashSeed([seed, 'dominion-weather', day].join('::')));
  const kinds = W().kinds, total = kinds.reduce((a, k) => a + k.weight, 0);
  let n = r.int(1, total);
  for (const k of kinds) if ((n -= k.weight) <= 0) return k.id;
  return 'sunny';
}

/** Today's sky (saved by the World Turn; a block from before R3's rules has none and is Sunny until the next morning). */
export const skyOf = (b: DominionBlock): Sky => b.field.sky ?? 'sunny';
const oddsOf = (sky: Sky, stat: StatId | null): number => (stat ? skyDef(sky).odds[stat] ?? 0 : 0);

// ---------- travel ----------

export const routeOf = (b: DominionBlock): Route => b.field.route ?? 'road';
export const wetOf = (b: DominionBlock): Wet => b.field.wet ?? 'round';

/** The road from one district to another, both ends included (the same steps `hops` counts), or null. */
export function pathOf(b: DominionBlock, from: string, to: string): string[] | null {
  if (from === to) return [from];
  const nb = (id: string): string[] => {
    const out: string[] = [];
    for (const [x, y] of F().routes) if (x === id) out.push(y); else if (y === id) out.push(x);
    if (b.field.vehicles.includes('boat')) for (const [x, y] of F().water) if (x === id) out.push(y); else if (y === id) out.push(x);
    return out;
  };
  const back = new Map<string, string>([[from, '']]);
  let front = [from];
  while (front.length) {
    const next: string[] = [];
    for (const id of front) for (const n of nb(id)) {
      if (back.has(n)) continue;
      back.set(n, id);
      if (n === to) {
        const out = [to];
        for (let p = id; p; p = back.get(p)!) out.unshift(p);
        return out;
      }
      next.push(n);
    }
    front = next;
  }
  return null;
}

/** Districts a rival holds that the road passes through (not where it starts or ends). */
export function tollsOn(b: DominionBlock, path: readonly string[]): string[] {
  return path.slice(1, -1).filter((id) => { const d = b.field.districts[id]; return !!d && statusOf(d) === 'rival'; });
}
const isStation = (id: string): boolean => T().stations.includes(id);
/** Is the Underground Path on this road (and is it flooded today)? */
export function floodedOn(b: DominionBlock, path: readonly string[]): boolean {
  if (!skyDef(skyOf(b)).flood) return false;
  for (let i = 1; i < path.length; i++) if (T().tunnel.some(([x, y]) => (x === path[i - 1] && y === path[i]) || (y === path[i - 1] && x === path[i]))) return true;
  return false;
}
export const knowsMove = (run: Pick<RunState, 'party'>, move: string): boolean => run.party.some((m) => m.moves.some((x) => x.id === move));

/** One way to get somewhere: what it costs in actions, money and Heat, and why it can't be used. */
export interface WayCost { id: Route; name: string; what: string; actions: number; money: number; heat: number; odds: number; why: string | null; notes: string[] }

/** Each way from where the Boss is to `to` today, with what the Card would charge. `walk`: the actions on foot now. */
export function waysTo(b: DominionBlock, run: Pick<RunState, 'party'>, to: string, walk: number): WayCost[] {
  const path = pathOf(b, b.field.at, to) ?? [b.field.at, to];
  const sky = skyDef(skyOf(b)), Wy = T().ways, rival = rivalName();
  const tolls = tollsOn(b, path);
  const wet = floodedOn(b, path) ? wetCost(b, run) : null;
  const road: WayCost = {
    id: 'road', name: Wy.road.name, what: fill(Wy.road.what, { n: walk }), actions: walk, money: tolls.length * (Wy.road.toll ?? 0), heat: 0, odds: 0, why: null,
    notes: tolls.length ? [fill(L().toll!, { rival, n: tolls.length * (Wy.road.toll ?? 0) })] : [L().noToll!],
  };
  const back: WayCost = { id: 'back', name: Wy.back.name, what: Wy.back.what, actions: walk + (Wy.back.extra ?? 0), money: 0, heat: 0, odds: 0, why: null, notes: [] };
  for (const w of [road, back]) if (wet) {
    w.actions += wet.extra;
    w.heat += wet.heat;
    w.odds += wet.odds;
    w.notes.push(L().floodNote!);
  }
  const hot = (b.field.districts[to]?.heat ?? 0) >= (Wy.train.policeAt ?? 101);
  const train: WayCost = {
    id: 'train', name: Wy.train.name, what: fill(Wy.train.what, { fare: Wy.train.fare ?? 0 }), actions: 0, money: Wy.train.fare ?? 0, heat: hot ? Wy.train.policeHeat ?? 0 : 0, odds: 0,
    why: !isStation(b.field.at) || !isStation(to) ? L().noStation! : !sky.trains ? L().cancelled! : null,
    notes: hot ? [fill(L().police!, { n: Wy.train.policeHeat ?? 0 })] : [],
  };
  return [road, back, train];
}

/** What the flooded tunnel costs today by the way picked (a ride without Surf goes round). */
function wetCost(b: DominionBlock, run: Pick<RunState, 'party'>): { extra: number; heat: number; odds: number } {
  const Fl = T().flood;
  let w = wetOf(b);
  if (w === 'ride' && !knowsMove(run, Fl.ride.move ?? 'surf')) w = 'round';
  return w === 'wade' ? { extra: 0, heat: 0, odds: Fl.wade.odds ?? 0 } : w === 'ride' ? { extra: 0, heat: Fl.ride.heat ?? 0, odds: 0 } : { extra: Fl.round.extra ?? 0, heat: 0, odds: 0 };
}

export const rivalName = (): string => { const rt = teamsHere()[0]; return rt ? teamDef(rt.id)?.name ?? rt.name : 'Team Rocket'; };

/** Puts the odds back together after a part was added (the same sum and range as the Card). */
function reOdds(c: Card): void {
  if (!c.roll) return;
  c.chance = clamp(c.base + c.parts.reduce((a, [, n]) => a + n, 0), O().min, O().max);
  c.range = c.exact ? [c.chance, c.chance] : [clamp(c.chance - O().rangeHalf, O().min, O().max), clamp(c.chance + O().rangeHalf, O().min, O().max)];
}
const addHeatTo = (c: Card, n: number, always: boolean): void => {
  if (!n) return;
  if (always || c.heat > 0) c.heat = Math.max(0, c.heat + n);
  if (always || c.failHeat > 0) c.failHeat = Math.max(0, c.failHeat + n);
};

// The Card: the weather on the odds and the Heat, and the way the Boss travels.
addCardHook((b, run, c) => {
  const sky = skyOf(b), def = skyDef(sky);
  const stat = c.def.stat && c.def.stat !== 'all' ? c.def.stat : null;
  const wx = oddsOf(sky, stat);
  if (c.roll && wx) c.parts.push([`${def.word} today`, wx]);
  addHeatTo(c, def.heat, false);
  if (c.def.slot === 'day' && (c.travel.how === 'foot' || c.travel.how === 'free')) {
    const ways = waysTo(b, run, c.district.id, c.travel.cost);
    let way = ways.find((w) => w.id === routeOf(b))!;
    if (way.why) way = ways[0]!;
    c.cost += way.actions - c.travel.cost;
    c.money += way.money;
    addHeatTo(c, way.heat, true);
    if (c.roll && way.odds) c.parts.push([L().soaked!, way.odds]);
    // The plain main road (no toll, dry) keeps the Card's own travel line.
    const plain = way.id === 'road' && !way.money && !way.heat && !way.odds && way.actions === c.travel.cost;
    if (!plain) c.travel = { ...c.travel, cost: way.actions, line: [way.actions ? `${way.name}: ${way.actions} action${way.actions === 1 ? '' : 's'}` : way.name, ...way.notes].join(' · ') };
  }
  reOdds(c);
});

// The crew's tasks: a task that tests a stat gets the day's weather.
addOddsHook((b, _m, task) => oddsOf(skyOf(b), task.stat ?? null));

// ---------- the papers ----------

export interface Clip { d: number; head: string; deck: string }

// World End (after the paper's own snapshot): the new day's sky, the flood choice resets, and the morning's clipping.
addWorldEnd((b, seed) => {
  b.field.sky = weatherOn(seed, b.day);
  delete b.field.wet;
  const p = paperOf(b);
  if (p.jobs.some((j) => j.d === b.day - 1)) {
    const m = paperModel(b, seed);
    p.book = [...(p.book ?? []), { d: b.day, head: m.head, deck: m.deck }].slice(-P().book);
  }
  return [];
});

/** The interview can be given again from this day on (null: now). */
export function interviewDue(b: DominionBlock): number | null {
  const said = b.paper?.said;
  return said === undefined || b.day - said >= P().interview.every ? null : said + P().interview.every;
}
/** Where the papers' story is: yesterday's busiest job, else the HQ. */
export function storyAt(b: DominionBlock): string {
  const jobs = (b.paper?.jobs ?? []).filter((j) => j.d === b.day - 1);
  return [...jobs].sort((x, y) => y.pay - x.pay)[0]?.at ?? F().hq;
}

// ---------- the actions ----------

export type DayOp = Extract<DominionAction, { t: 'day' }>;
export interface DayOut { ok: boolean; block: DominionBlock; notice: string | null }

/** The Boss's choices on these pages (session.ts sends them here, with the run for the party). */
export function dayStep(block: DominionBlock, run: Pick<RunState, 'party'>, a: DayOp): DayOut {
  const no = (notice: string | null): DayOut => ({ ok: false, block, notice });
  const b = structuredClone(block);
  if (a.op === 'route') {
    const how = a.how as Route;
    if (!ROUTES.includes(how)) return no(null);
    b.field.route = how;
    return { ok: true, block: b, notice: fill(L().set!, { way: T().ways[how].name }) };
  }
  if (a.op === 'flood') {
    const how = a.how as Wet;
    if (!WETS.includes(how)) return no(null);
    if (!skyDef(skyOf(b)).flood) return no(null);
    if (how === 'ride' && !knowsMove(run, T().flood.ride.move ?? 'surf')) return no(L().noSurf!);
    b.field.wet = how;
    return { ok: true, block: b, notice: fill(L().wet!, { how: T().flood[how].name.toLowerCase() }) };
  }
  if (a.op !== 'interview' || (a.how !== 'fear' && a.how !== 'kind')) return no(null);
  if (b.phase !== 'day' || b.actions < 1) return no(DOMINION_DATA.field.lines.noActions ?? null);
  const due = interviewDue(b);
  if (due !== null) return no(fill(P().interview.wait, { day: due }));
  const at = storyAt(b), d = b.field.districts[at];
  if (!d) return no(null);
  const I2 = P().interview;
  b.actions -= 1;
  if (a.how === 'fear') {
    d.dread += I2.fear.dread;
    d.regard += I2.fear.regard;
  } else {
    d.regard += I2.kind.regard;
    addHeat(b, at, I2.kind.heat);
    syncHeat(b);
  }
  paperOf(b).said = b.day;
  const how = a.how === 'fear' ? `Dread +${I2.fear.dread} in ${dname(at)}.` : `Regard +${I2.kind.regard} in ${dname(at)}.`;
  return { ok: true, block: b, notice: fill(I2.said, { how }) };
}
