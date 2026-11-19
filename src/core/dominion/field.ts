// DOMINION D2, the Boss's hands (design Part 1 §3, Part 3 §2, Part 4 §4, Part 9 A1 and A20; mockups 3 and 4).
// Districts with their own Heat and Control, the region's Wanted and the police ladder, the Boss's Edge stats and
// Infamy XP, action mastery, travel and vehicles, and the Card: the odds and what's at stake, shown before every action
// and used, number for number, when it's done. Pure: no Phaser, and this file never imports run.ts (the battle rules
// reach it through fightEnd.ts). Rolls: stream `dominion-act` (an action), `dominion-police` (the police's night).

import type { Content } from '../contentSchema';
import { addItem } from '../items';
import { gainXp } from '../pokemon';
import { hashSeed, Rng } from '../rng';
import type { RunState } from '../state';
import trainersRaw from '../../data/trainers.json';
import { DOMINION_DATA } from './data';
import type { ActionDef, District, DistrictState, DominionBlock, Field, FieldFight, Play, StatId, Target } from './schema';
import { book, empireOf } from './book';
import { addWorldStep, fill } from './worldTurn';

const F = () => DOMINION_DATA.field;
const L = () => DOMINION_DATA.field.lines;
const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));
const cap = (t: string): string => t[0]!.toUpperCase() + t.slice(1);
const round10 = (n: number): number => Math.round(n / 10) * 10;

// ---------- look-ups ----------

export const actionDef = (id: string): ActionDef | undefined => DOMINION_DATA.actions.actions.find((a) => a.id === id);
export const playOf = (id: string): Play | undefined => F().play[id];
export const districtDef = (id: string): District | undefined => F().districts.find((d) => d.id === id);
export function targetDef(id: string | null): { target: Target; district: District } | null {
  if (!id) return null;
  for (const d of F().districts) {
    const t = d.targets.find((x) => x.id === id);
    if (t) return { target: t, district: d };
  }
  return null;
}

/** The day an action opens (its list row says "Day N"), or 1. */
export function openDay(def: ActionDef): number {
  const m = /^Day (\d+)$/.exec(def.unlock);
  return m ? Number(m[1]) : 1;
}

/** Whether D2 plays an action, or which slice opens it (Rest is D1's, played from the HQ's Night panel). */
export function actionStatus(def: ActionDef): { play: boolean; slice: string | null } {
  if (F().play[def.id]) return { play: true, slice: null };
  const by = F().later.byAction[def.id];
  if (by) return { play: false, slice: by };
  const u = F().later.byUnlock.find(([k]) => def.unlock.includes(k));
  return { play: false, slice: u ? u[1] : null };
}

// ---------- districts, Heat and Wanted ----------

export type DistrictStatus = 'owned' | 'held' | 'contested' | 'foot' | 'out' | 'rival';

/** Part 3 §2: Control 0-19 Outsider, 20-39 Foothold, 40-59 Contested, 60-79 Held, 80+ Owned; a rival team past 40 and ahead of you holds it. */
export function statusOf(d: DistrictState): DistrictStatus {
  const c = F().control;
  if (d.rival >= c.rival && d.rival > d.control) return 'rival';
  return d.control >= c.owned ? 'owned' : d.control >= c.held ? 'held' : d.control >= c.contested ? 'contested' : d.control >= c.foothold ? 'foot' : 'out';
}

/**
 * The region's Wanted (Part 1 §3.4: the districts plus big events). The average is over the districts with any Heat,
 * the ones you've worked, so a hot town isn't watered down by nine quiet ones.
 */
export function wanted(f: Field): number {
  const hot = Object.values(f.districts).filter((d) => d.heat > 0);
  const avg = hot.length ? hot.reduce((a, d) => a + d.heat, 0) / hot.length : 0;
  return clamp(Math.round(avg) + f.wanted, 0, 100);
}

export const bandOf = (w: number) => [...F().police.bands].reverse().find((b) => w >= b.min)!;
const bandAt = (w: number, id: string): boolean => w >= (F().police.bands.find((b) => b.id === id)?.min ?? 101);

/** The top bar's Heat is the region's Wanted. */
export function syncHeat(b: DominionBlock): void {
  b.heat = wanted(b.field);
}

/** Heat into a district: halved where you own the police (Owned), never below 0 or above 100. */
export function addHeat(b: DominionBlock, district: string, n: number): void {
  const d = b.field.districts[district];
  if (!d) return;
  const k = n > 0 && statusOf(d) === 'owned' ? F().control.ownedHeat : 1;
  d.heat = clamp(d.heat + Math.round(n * k), 0, 100);
}

export const hottest = (f: Field): string | null => {
  let best: string | null = null;
  for (const d of F().districts) if ((f.districts[d.id]?.heat ?? 0) > 0 && (!best || f.districts[d.id]!.heat > f.districts[best]!.heat)) best = d.id;
  return best;
};

// ---------- the Edge and mastery ----------

export function masteryLevel(xp: number): number {
  return 1 + F().mastery.thresholds.filter((t) => xp >= t).length;
}

/** Infamy XP into one Edge stat: a point each `stat x xpPerPoint` XP, to the cap. Returns the line when a point is gained. */
export function edgeXp(f: Field, stat: StatId, xp: number): string | null {
  const E = F().edge;
  f.edge.xp[stat] += xp;
  let up = false;
  while (f.edge.stats[stat] < E.cap && f.edge.xp[stat] >= f.edge.stats[stat] * E.xpPerPoint) {
    f.edge.xp[stat] -= f.edge.stats[stat] * E.xpPerPoint;
    f.edge.stats[stat] += 1;
    up = true;
  }
  if (f.edge.stats[stat] >= E.cap) f.edge.xp[stat] = 0;
  return up ? fill(L().edge!, { stat: cap(stat), n: f.edge.stats[stat] }) : null;
}

function masteryXp(f: Field, def: ActionDef, xp: number): string | null {
  const was = masteryLevel(f.mastery[def.id] ?? 0);
  f.mastery[def.id] = (f.mastery[def.id] ?? 0) + xp;
  const now = masteryLevel(f.mastery[def.id]!);
  return now > was ? fill(L().mastery!, { action: def.name, level: F().mastery.names[now - 1]! }) : null;
}

// ---------- travel (Part 9 A20) ----------

function neighbours(f: Field, id: string): string[] {
  const out: string[] = [];
  for (const [a, b] of F().routes) if (a === id) out.push(b); else if (b === id) out.push(a);
  if (f.vehicles.includes('boat')) for (const [a, b] of F().water) if (a === id) out.push(b); else if (b === id) out.push(a);
  return out;
}

/** Steps from one district to another by road (and water with a Boat), or null when it can't be walked. */
export function hops(f: Field, from: string, to: string): number | null {
  if (from === to) return 0;
  const seen = new Set([from]);
  let front = [from];
  for (let n = 1; front.length; n++) {
    const next: string[] = [];
    for (const id of front) for (const nb of neighbours(f, id)) {
      if (nb === to) return n;
      if (!seen.has(nb)) {
        seen.add(nb);
        next.push(nb);
      }
    }
    front = next;
  }
  return null;
}

const canFly = (b: DominionBlock, run: Pick<RunState, 'party'>): boolean =>
  b.hqLevel >= F().travel.fly.hq && !b.field.flew && run.party.some((m) => m.moves.some((x) => x.id === F().travel.fly.move));

export interface Travel { ok: boolean; cost: number; line: string; how: 'here' | 'foot' | 'free' | 'fly' | 'air' | 'night' | 'none' }

/** What getting to `to` costs the Boss now (Day: on foot 1 action a step, Bike/Plan free steps, Fly, the Airship; Night: a short walk). */
export function travel(b: DominionBlock, run: Pick<RunState, 'party'>, to: string): Travel {
  const f = b.field, T = F().travel.lines;
  const name = districtDef(to)?.name ?? to;
  if (f.at === to) return { ok: true, cost: 0, line: T.here!, how: 'here' };
  if (b.phase === 'evening') return { ok: true, cost: 0, line: '', how: 'here' };
  if (b.phase === 'night') {
    const near = neighbours(f, f.at).includes(to);
    return near ? { ok: true, cost: 0, line: fill(T.night!, { district: districtDef(f.at)?.name ?? f.at }), how: 'night' } : { ok: false, cost: 0, line: T.far!, how: 'none' };
  }
  if (f.vehicles.includes('airship') && b.hqLevel >= (F().travel.vehicles.find((v) => v.id === 'airship')?.hq ?? 9)) return { ok: true, cost: 0, line: 'Airship', how: 'air' };
  const n = hops(f, f.at, to);
  if (canFly(b, run) && f.visited.includes(to) && (n === null || n - f.free > 0)) return { ok: true, cost: 0, line: `Fly to ${name}`, how: 'fly' };
  if (n === null) return { ok: false, cost: 0, line: T.water!, how: 'none' };
  const cost = Math.max(0, n - f.free);
  return cost ? { ok: true, cost, line: fill(T.foot!, { n: cost }) + (cost === 1 ? '' : 's'), how: 'foot' } : { ok: true, cost: 0, line: T.free!, how: 'free' };
}

function goTo(b: DominionBlock, run: Pick<RunState, 'party'>, to: string): void {
  const t = travel(b, run, to), f = b.field;
  if (t.how === 'fly') f.flew = true;
  else if (t.how === 'foot' || t.how === 'free') f.free = Math.max(0, f.free - ((hops(f, f.at, to) ?? 0) - t.cost));
  f.at = to;
  if (!f.visited.includes(to)) f.visited.push(to);
}

// ---------- the Card ----------

export interface Foe { name: string; species: string; level: number; wild: boolean }

export interface Card {
  def: ActionDef;
  play: Play | null;
  district: District;
  target: Target | null;
  /** Why it can't be done now, or null. */
  blocked: string | null;
  /** False when nothing is rolled (a sure thing). */
  roll: boolean;
  chance: number;
  parts: [string, number][];
  base: number;
  /** Scouted (or Expert mastery): the exact odds; else a range. */
  exact: boolean;
  range: [number, number];
  pay: [number, number] | null;
  weekly: number | null;
  crate: string | null;
  heat: number;
  failHeat: number;
  regard: number;
  dread: number;
  /** Day actions it takes, travel included. */
  cost: number;
  money: number;
  travel: Travel;
  battle: { chance: number; on: 'fail' | 'always'; foe: Foe } | null;
  /** Chance (on a failed roll with no fight of its own) that the police step in. */
  police: number;
  level: number;
}

/** Average level of the Boss's team. */
const teamLevel = (run: Pick<RunState, 'party'>): number => (run.party.length ? Math.round(run.party.reduce((a, m) => a + m.level, 0) / run.party.length) : 5);
const foeLevel = (b: DominionBlock, run: Pick<RunState, 'party'>, offset: number): number => clamp(teamLevel(run) + offset, F().levels.min, b.levelCap + F().levels.overCap);

export function foeOf(b: DominionBlock, run: Pick<RunState, 'party'>, kind: FieldFight['foe'], district: District, target: Target | null, card: string | null = null): Foe {
  const P = F().police;
  switch (kind) {
    case 'court': {
      // D12: a Chair visitor at the door (court.json card `card`).
      const f = DOMINION_DATA.court.find((c) => String(c.id) === card)?.foe ?? P.raid;
      return { name: f.name, species: f.species[0]!, level: foeLevel(b, run, f.offset), wild: false };
    }
    case 'police': return { name: P.jenny.name, species: P.jenny.species[0]!, level: foeLevel(b, run, P.jenny.offset), wild: false };
    case 'looker': return { name: P.looker.name, species: P.looker.species[0]!, level: foeLevel(b, run, P.looker.offset), wild: false };
    case 'raid': return { name: P.raid.name, species: P.raid.species[0]!, level: foeLevel(b, run, P.raid.offset), wild: false };
    case 'ghost': return { name: 'A wild Pokémon', species: F().foes.ghost[0]!, level: foeLevel(b, run, 1), wild: true };
    case 'wild': return { name: 'A wild Pokémon', species: '', level: foeLevel(b, run, 0), wild: true };
    case 'member': {
      const m = b.members[0];
      return { name: m?.name ?? 'Crew', species: m?.team[0]?.speciesId ?? '', level: m?.team[0]?.level ?? 5, wild: false };
    }
    case 'target': {
      const f = target?.foe ?? district.targets[0]!.foe;
      return { name: f.name, species: f.species[0]!, level: foeLevel(b, run, f.offset), wild: false };
    }
  }
}

const canBattle = (run: Pick<RunState, 'party'>): boolean => run.party.some((m) => m.hp > 0);
const crewStat = (b: DominionBlock, bring: readonly string[], stat: StatId): [string, number][] =>
  bring.map((id) => b.members.find((m) => m.id === id)).filter((m) => !!m).slice(0, F().odds.maxBrought).map((m) => [`${m!.name} brought along`, m!.stats[stat] * F().odds.crewPer]);

/** The Card (Part 1 §3, mockup 4): everything the action risks and pays, worked out from the block. Never rolls. */
export function card(b: DominionBlock, run: Pick<RunState, 'party'>, actionId: string, targetId: string | null, districtId: string, bring: readonly string[] = []): Card | null {
  const def = actionDef(actionId);
  const play = def ? playOf(def.id) ?? null : null;
  // Hide in the Warehouse is always at the HQ, wherever the map's cursor is.
  const district = districtDef(play?.where === 'hq' ? F().hq : districtId);
  if (!def || !district) return null;
  const f = b.field, O = F().odds, M = F().mastery, P = F().police;
  const td = targetDef(targetId);
  const target = td && td.district.id === district.id ? td.target : null;
  const ds = f.districts[district.id]!;
  const level = masteryLevel(f.mastery[def.id] ?? 0);
  const night = def.slot === 'night';
  const tr = def.slot === 'evening' ? { ok: true, cost: 0, line: '', how: 'here' as const } : play?.where === 'hq' ? { ok: true, cost: 0, line: '', how: 'here' as const } : travel(b, run, district.id);

  // the odds (Part 1 §3.3)
  const parts: [string, number][] = [];
  const stat = def.stat && def.stat !== 'all' ? def.stat : null;
  const roll = play?.chance !== undefined;
  const base = play?.chance ?? 100;
  if (roll) {
    if (stat) parts.push([`Boss ${cap(stat)} ${f.edge.stats[stat]}`, f.edge.stats[stat] * O.statPer]);
    if (stat) parts.push(...crewStat(b, bring, stat));
    const intel = target ? f.scouted[target.id] ?? 0 : 0;
    if (target && intel >= b.day) parts.push([intel - O.scoutDays >= b.day - 1 ? 'Scouted yesterday' : 'Scouted', O.scouted]);
    if (ds.heat >= O.heatPer) parts.push([`Heat in ${district.name}`, -Math.floor(ds.heat / O.heatPer)]);
    const st = statusOf(ds);
    if (st === 'out' || st === 'rival') parts.push([L().outsider!, O.outsider]);
    if (target?.trait) parts.push([`Owner is “${target.trait.word}”`, target.trait.odds]);
    if (M.odds[level - 1]) parts.push([`${M.names[level - 1]} (Lv ${level})`, M.odds[level - 1]!]);
  }
  const chance = roll ? clamp(base + parts.reduce((a, [, n]) => a + n, 0), O.min, O.max) : 100;
  const exact = !roll || (target ? (f.scouted[target.id] ?? 0) >= b.day : true) || level >= M.intelFrom;
  const range: [number, number] = exact ? [chance, chance] : [clamp(chance - O.rangeHalf, O.min, O.max), clamp(chance + O.rangeHalf, O.min, O.max)];

  // what's at stake
  const payK = (target?.pay ?? 1) * (1 + M.pay[level - 1]! / 100);
  let pay: [number, number] | null = play?.pay ? [round10(play.pay[0] * payK), round10(play.pay[1] * payK)] : play?.wager ? [play.wager[0], play.wager[1]] : null;
  // D6, Skim the Till: a cut of the Racket's weekly take there.
  const racket = play?.effect === 'skim' && target ? f.rackets.find((r) => r.target === target.id) : undefined;
  if (racket) {
    const p = Math.max(10, round10(racket.weekly * DOMINION_DATA.empire.control.skimShare * (1 + M.pay[level - 1]! / 100)));
    pay = [p, p];
  }
  const foeBits = play?.battle ? foeOf(b, run, play.battle.foe, district, target) : null;
  if (play?.prize && foeBits) {
    const per = CLASS_MONEY.get(target?.foe.cls ?? '') ?? 24;
    const p = per * foeBits.level * play.prize;
    pay = [round10(p * (1 + M.pay[level - 1]! / 100)), round10(p * (1 + M.pay[level - 1]! / 100))];
  }
  const weekly = play?.weekly ? round10(play.weekly * (target?.pay ?? 1)) : play?.toll ? round10(play.toll * (target?.pay ?? 1)) : null;
  const heatMods = (h: number): number => {
    if (h <= 0) return h;
    let n = Math.max(0, h + M.heat[level - 1]!);
    if (f.disguise && def.slot !== 'evening') n = Math.ceil(n / 2);
    return n;
  };
  const heat = heatMods(play?.heat ?? 0);
  const failHeat = heatMods(play?.failHeat ?? 0);
  let battle: Card['battle'] = null;
  if (play?.battle && foeBits) {
    const c = play.battle.on === 'fail' && target && f.counted.includes(target.id) ? Math.ceil(play.battle.chance / 2) : play.battle.chance;
    battle = { chance: c, on: play.battle.on, foe: foeBits };
  }
  const w = wanted(f);
  let police = 0;
  if (roll && bandAt(w, 'noticed')) police += P.failBattle;
  if (roll && f.patrol === district.id) police += P.patrolBattle;
  if (roll && district.police) police += P.stationBattle;
  if (night) police = Math.round(police * P.nightFactor);
  police = Math.min(100, police);

  const cost = def.slot === 'day' ? tr.cost + 1 : 0;
  const money = play?.cost ?? 0;
  const out: Card = {
    def, play, district, target, blocked: null, roll, chance, parts, base, exact, range, pay, weekly, crate: play?.crate ?? null,
    heat, failHeat, regard: play?.regard ?? 0, dread: play?.dread ?? 0, cost, money, travel: tr, battle, police, level,
  };
  out.blocked = blockedWhy(b, run, out, bring);
  return out;
}

/** Trainer classes' prize per level (the main game's own, trainers.json), for Attack's prize money. */
const CLASS_MONEY = new Map((trainersRaw as { id: string; moneyPerLevel: number }[]).map((c) => [c.id, c.moneyPerLevel]));

function blockedWhy(b: DominionBlock, run: Pick<RunState, 'party'>, c: Card, bring: readonly string[]): string | null {
  const { def, play } = c, f = b.field, Ln = L();
  const st = actionStatus(def);
  if (!st.play || !play) return fill(Ln.later!, { slice: st.slice ?? 'later' });
  if (b.day < openDay(def)) return fill(Ln.notYet!, { day: openDay(def) });
  if (f.fight) return 'A fight is waiting.';
  const phase = b.phase === 'morning' ? 'day' : b.phase;
  if (def.slot !== phase) return Ln.wrongPhase[def.slot];
  if (b.phase === 'morning') return 'Start the day first.';
  if (play.kinds && !play.kinds.includes('any') && (!c.target || !play.kinds.includes(c.target.kind))) return Ln.notHere!;
  if (def.slot === 'evening' && f.evening.includes(def.id)) return Ln.doneTonight!;
  if (def.slot === 'night' && (f.night || b.nightActions < 1)) return Ln.nightDone!;
  if (def.slot !== 'evening' && play.where !== 'hq') {
    if (!c.travel.ok) return c.travel.line;
    if (f.closed === c.district.id) return fill(F().police.lines.closed!, { district: c.district.name });
  }
  if (def.slot === 'day' && b.actions < c.cost) return Ln.noActions!;
  if (play.needs && !b.keyItems.includes(play.needs)) return fill(Ln.needs!, { item: play.needs });
  if (play.needsPolice && !(bandAt(wanted(f), 'noticed') || c.district.police || f.patrol === c.district.id)) return Ln.noPolice!;
  if (play.effect === 'fine' && !hottest(f)) return Ln.noFine!;
  if (play.effect === 'skim' && !c.pay) return Ln.noRacket!;
  for (const gate of GATES) {
    const why = gate(b, def);
    if (why) return why;
  }
  if (c.money && b.funds < c.money) return fill(Ln.noMoney!, { cost: c.money });
  if (play.effect === 'spar' && !b.members.some((m) => m.team.some((x) => x.hp > 0))) return Ln.noMember!;
  if (c.battle?.on === 'always' && !canBattle(run)) return Ln.noTeam!;
  if (bring.length > F().odds.maxBrought) return 'Bring two at most.';
  return null;
}

/** D6: later rules that can close an action (Notoriety, a press contact), checked after the Card's own reasons. */
type Gate = (b: DominionBlock, def: ActionDef) => string | null;
const GATES: Gate[] = [];
export function addActionGate(g: Gate): void {
  GATES.push(g);
}

// ---------- doing it ----------

export interface ActOut {
  ok: boolean;
  block: DominionBlock;
  notice: string | null;
  /** A battle is waiting (block.field.fight): the session starts it. */
  fight: boolean;
  /** Thieve's big success: a Pokémon in a lifted Ball (the session makes it; core/run.ts isn't reachable from here). */
  mon: { species: string; level: number } | null;
}

const rngFor = (seed: string, f: Field): Rng => {
  const r = new Rng(hashSeed(`${seed}::dominion-act::${f.rolls}`));
  f.rolls += 1;
  return r;
};

function lootName(content: Content | null, id: string, n: number): string {
  const name = content?.items.get(id)?.name ?? id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return n > 1 ? `${n} ${name}s` : `a ${name}`;
}

/** Opens a crate: `picks` items by weight and some cash. Mutates the inventory and the block. Returns what was in it. */
function openCrate(content: Content | null, b: DominionBlock, inv: Record<string, number>, id: string, rng: Rng, big: boolean): string {
  const c = F().crates[id];
  if (!c) return '';
  const got: Record<string, number> = {};
  const total = c.items.reduce((a, [, w]) => a + w, 0);
  for (let i = 0; i < c.picks + (big ? 1 : 0); i++) {
    let r = rng.int(1, total);
    for (const [item, w] of c.items) {
      r -= w;
      if (r <= 0) {
        got[item] = (got[item] ?? 0) + 1;
        break;
      }
    }
  }
  for (const [item, n] of Object.entries(got)) addItem(inv, item, n);
  const cash = round10(rng.int(c.cash[0], c.cash[1]));
  b.funds += cash;
  b.earned += cash;
  const bits = Object.entries(got).map(([i, n]) => lootName(content, i, n));
  if (cash) bits.push(`₽${cash}`);
  return bits.length > 1 ? `${bits.slice(0, -1).join(', ')} and ${bits.at(-1)}` : bits[0] ?? 'nothing much';
}

interface Ctx { def: ActionDef; play: Play; district: District; target: Target | null; card: Card; big: boolean; pass: boolean; wager: number }

function vars(b: DominionBlock, x: Ctx, extra: Record<string, string | number> = {}): Record<string, string | number> {
  return { owner: x.target?.owner.name ?? 'They', target: x.target?.name ?? x.district.name, district: x.district.name, member: b.members[0]?.name ?? 'Your member', ...extra };
}

/** The action worked. Mutates block, run (inventory, party) and returns the lines. */
function succeed(content: Content | null, b: DominionBlock, run: RunState, x: Ctx, rng: Rng): { lines: string[]; mon: ActOut['mon'] } {
  const { play, def, district, target, card: c } = x, f = b.field;
  const lines: string[] = [];
  const v: Record<string, string | number> = {};
  let mon: ActOut['mon'] = null;
  if (c.pay) {
    const p = x.wager || (c.pay[0] === c.pay[1] ? c.pay[0] : round10(rng.int(c.pay[0], c.pay[1])));
    const n = x.big && !play.prize ? c.pay[1] : p;
    b.funds += n;
    b.earned += n;
    v.pay = n;
  }
  if (c.crate) v.loot = openCrate(content, b, run.inventory, c.crate, rng, x.big);
  lines.push(fill(play.win, vars(b, x, v)));
  // Rackets (Extort) and tolls (Attack, when they're scared enough: the odds roll passed).
  if (c.weekly && target && (play.weekly || (play.toll && x.pass)) && !f.rackets.some((r) => r.target === target.id)) {
    f.rackets.push({ target: target.id, district: district.id, weekly: c.weekly, day: b.day, kind: play.weekly ? 'racket' : 'toll' });
    lines.push(play.toll && play.big ? fill(play.big, { weekly: c.weekly }) : fill(L().racket!, { weekly: c.weekly }));
  }
  if (play.bigMon && x.big && target) {
    mon = { species: target.foe.species[0]!, level: Math.max(2, c.battle?.foe.level ?? 5) };
  }
  const ds = f.districts[district.id]!;
  if (c.heat && play.effect !== 'fine') addHeat(b, district.id, c.heat);
  ds.regard += c.regard;
  ds.dread += c.dread;
  if (play.control) ds.control = clamp(ds.control + play.control, 0, 100);
  if (play.rival) ds.rival = clamp(ds.rival + play.rival, 0, 100);
  if (play.wanted) f.wanted = clamp(f.wanted + play.wanted, 0, 100);
  if (play.hero) f.hero += play.hero;
  const days = play.scoutDays ?? F().odds.scoutDays;
  switch (play.effect) {
    case 'scout':
      if (target) f.scouted[target.id] = b.day + days;
      break;
    case 'count':
      if (target) {
        f.scouted[target.id] = b.day + days;
        if (!f.counted.includes(target.id)) f.counted.push(target.id);
      }
      break;
    case 'scoutDistrict':
      for (const t of district.targets) f.scouted[t.id] = b.day + days;
      break;
    case 'paper': {
      const open = F().districts.flatMap((d) => d.targets.map((t) => ({ d, t }))).filter(({ t }) => (f.scouted[t.id] ?? 0) < b.day + 1);
      if (open.length) {
        const pick = open[rng.int(0, open.length - 1)]!;
        f.scouted[pick.t.id] = b.day + 1 + days;
        lines[lines.length - 1] = fill(play.win, { target: pick.t.name, district: pick.d.name });
      } else lines[lines.length - 1] = 'Nothing new in the paper.';
      break;
    }
    case 'hide':
      f.hidden = true;
      break;
    case 'disguise':
      f.disguise = true;
      break;
    case 'fine': {
      const h = hottest(f);
      if (h) {
        addHeat(b, h, play.heat ?? -15);
        lines[lines.length - 1] = fill(play.win, { district: districtDef(h)?.name ?? h });
      }
      f.wanted = clamp(f.wanted + (play.wanted ?? 0), 0, 100);
      break;
    }
    case 'exp':
      if (content) for (const m of run.party) gainXp(content, m, m.level * (play.exp ?? 8), b.levelCap);
      break;
    case 'pamper':
      for (const m of run.party) m.friendship = Math.min(255, m.friendship + (play.friendship ?? 10));
      break;
    case 'plan':
      f.planned = true;
      break;
    case 'spar': {
      const m = b.members[0];
      if (m) m.morale = Math.min(100, m.morale + 5);
      break;
    }
    default:
      break;
  }
  return { lines, mon };
}

function fail(b: DominionBlock, x: Ctx): string[] {
  const f = b.field;
  if (x.card.failHeat) addHeat(b, x.district.id, x.card.failHeat);
  if (x.play.regard && x.play.regard < 0) f.districts[x.district.id]!.regard += Math.min(0, Math.round(x.play.regard / 2));
  return x.play.lose ? [fill(x.play.lose, vars(b, x, { pay: x.wager }))] : [];
}

/** XP for the Edge and the action's mastery (fail 1, win 2, big 3), and the lines for any level gained. */
function grow(b: DominionBlock, def: ActionDef, play: Play, won: boolean, big: boolean): string[] {
  const f = b.field;
  const out: string[] = [];
  const stat = def.stat && def.stat !== 'all' ? def.stat : null;
  if (play.effect === 'train' || play.effect === 'plan') {
    const l = stat ? edgeXp(f, stat, play.xp ?? 0) : null;
    if (l) out.push(l);
    return out;
  }
  const E = F().edge.xp, M = F().mastery.xp;
  const k: 'big' | 'win' | 'fail' = big ? 'big' : won ? 'win' : 'fail';
  if (stat) {
    const l = edgeXp(f, stat, E[k]);
    if (l) out.push(l);
  }
  const m = masteryXp(f, def, M[k]);
  if (m) out.push(m);
  return out;
}

function ctxOf(b: DominionBlock, run: Pick<RunState, 'party'>, action: string, target: string | null, district: string, bring: readonly string[]): { c: Card; x: Omit<Ctx, 'big' | 'pass' | 'wager'> } | null {
  const c = card(b, run, action, target, district, bring);
  if (!c || !c.play) return null;
  return { c, x: { def: c.def, play: c.play, district: c.district, target: c.target, card: c } };
}

/**
 * Does a Boss action (the Card's numbers, rolled on `dominion-act`). Spends the slot and the travel, rolls the odds,
 * and either settles it now or leaves the battle it's waiting on in `field.fight`. Changes `run` (a private copy).
 */
export function act(content: Content | null, run: RunState, a: { action: string; target: string | null; district: string; bring: string[] }): ActOut {
  const block = run.expansion?.dominion;
  const no = (notice: string | null = null): ActOut => ({ ok: false, block: block!, notice, fight: false, mon: null });
  if (!block) return no();
  const got = ctxOf(block, run, a.action, a.target, a.district, a.bring);
  if (!got) return no();
  if (got.c.blocked) return no(got.c.blocked);
  const b = structuredClone(block);
  const { c } = got;
  const f = b.field;
  // spend the slot, the money and the trip
  if (c.def.slot === 'day') b.actions -= c.cost;
  if (c.def.slot === 'night') {
    f.night = c.def.id;
    b.nightActions = 0;
  }
  if (c.def.slot === 'evening') f.evening.push(c.def.id);
  b.funds -= c.money;
  if (c.def.slot !== 'evening') {
    if (c.play!.where === 'hq') f.at = F().hq;
    else goTo(b, run, c.district.id);
  }
  const used = f.disguise && c.def.slot !== 'evening' && (c.heat > 0 || c.failHeat > 0);
  // the roll
  const rng = rngFor(run.seed, f);
  const r = rng.int(1, 100);
  const pass = !c.roll || r <= c.chance;
  const big = c.roll && pass && r <= Math.floor(c.chance * F().odds.bigShare);
  const wager = c.play!.wager ? round10(rng.int(c.play!.wager[0], c.play!.wager[1])) : 0;
  const x: Ctx = { ...got.x, card: c, pass, big, wager };
  if (used) f.disguise = false;
  const wait = (why: FieldFight['why'], foe: FieldFight['foe']): ActOut => {
    f.fight = { why, foe, begun: false, action: c.def.id, target: c.target?.id ?? null, district: c.district.id, pass, big, wager, racket: null };
    syncHeat(b);
    return { ok: true, block: b, notice: null, fight: true, mon: null };
  };
  if (c.battle?.on === 'always') return wait('always', c.play!.battle!.foe);
  if (!pass) {
    if (c.battle && rng.int(1, 100) <= c.battle.chance && canBattle(run)) return wait('fail', c.play!.battle!.foe);
    if (c.police && rng.int(1, 100) <= c.police && canBattle(run)) return wait('police', 'police');
    const lines = [...fail(b, x), ...grow(b, c.def, c.play!, false, false)];
    syncHeat(b);
    return { ok: true, block: b, notice: lines.join(' '), fight: false, mon: null };
  }
  const s = succeed(content, b, run, x, rng);
  const lines = [...s.lines, ...grow(b, c.def, c.play!, true, big)];
  syncHeat(b);
  return { ok: true, block: b, notice: lines.join(' '), fight: false, mon: s.mon };
}

/**
 * The battle an action (or the police) waited on is over. `won` covers a catch; `fled` is a wild battle run from.
 * Mutates `b` and `run` (the battle rules' copy). Returns the lines to read out.
 */
export function settle(content: Content | null, b: DominionBlock, run: RunState, outcome: 'win' | 'lose' | 'fled', caught: string | null): string[] {
  const f = b.field, fight = f.fight;
  if (!fight) return [];
  f.fight = null;
  // D12: a Chair visitor's fight: its stakes are the Chair's (chair.ts courtFightEnd, called by fightEnd.ts).
  if (fight.why === 'court') return [];
  const P = F().police, PL = P.lines;
  const district = districtDef(fight.district) ?? districtDef(F().hq)!;
  const won = outcome === 'win';
  const lines: string[] = [];
  if (fight.why === 'looker') {
    const t = targetDef(fight.racket);
    if (won) {
      addHeat(b, district.id, P.lookerWin);
      lines.push(fill(PL.lookerWon!, { target: t?.target.name ?? 'the Racket' }));
    } else {
      f.rackets = f.rackets.filter((r) => r.target !== fight.racket);
      lines.push(fill(PL.lookerLost!, { target: t?.target.name ?? 'the Racket' }));
    }
    syncHeat(b);
    return lines;
  }
  if (fight.why === 'raid') {
    if (won) {
      for (const id of Object.keys(f.districts)) addHeat(b, id, P.raidWin);
      lines.push(PL.raidWon!);
    } else {
      const take = Math.max(0, Math.floor(Math.max(0, b.funds) * P.raidTake));
      b.funds -= take;
      lines.push(fill(PL.raidLost!, { take }));
    }
    syncHeat(b);
    return lines;
  }
  const got = fight.action ? ctxOf(b, run, fight.action, fight.target, fight.district, []) : null;
  if (!got) {
    syncHeat(b);
    return lines;
  }
  // The Card is read again for its numbers only (it's blocked now: the slot is spent).
  const x: Ctx = { ...got.x, card: got.c, pass: fight.pass, big: fight.big, wager: fight.wager };
  const rng = rngFor(run.seed, f);
  if (fight.why === 'police') {
    lines.push(...fail(b, x));
    if (won) lines.push(fill(PL.won!, { name: P.jenny.name }));
    else {
      const fine = Math.max(P.lost.fineMin, Math.round(Math.max(0, b.funds) * P.lost.fine));
      b.funds -= fine;
      addHeat(b, district.id, P.lost.heat);
      lines.push(fill(PL.lost!, { name: P.jenny.name, fine, heat: P.lost.heat, district: district.name }));
    }
    lines.push(...grow(b, x.def, x.play, false, false));
  } else if (outcome === 'fled') {
    lines.push(L().fled!);
  } else if (won) {
    // 'always': the fight was the action (its roll gave the bonus); 'fail': winning it turns the failure round.
    const s = succeed(content, b, run, { ...x, big: fight.why === 'always' ? fight.big : false }, rng);
    if (x.play.effect === 'catch') s.lines[0] = caught ? fill(x.play.win, { mon: caught }) : 'You won. Nothing was caught.';
    lines.push(...s.lines, ...grow(b, x.def, x.play, true, fight.why === 'always' && fight.big));
  } else {
    if (x.play.wager) {
      b.funds -= fight.wager;
    }
    lines.push(...fail(b, x), ...grow(b, x.def, x.play, false, false));
  }
  syncHeat(b);
  return lines;
}

/** Buys a vehicle (Part 9 A20). Not at Night. */
export function buy(block: DominionBlock, id: string): { ok: boolean; block: DominionBlock; notice: string | null } {
  const v = F().travel.vehicles.find((x) => x.id === id);
  const no = (notice: string | null) => ({ ok: false, block, notice });
  if (!v || block.phase === 'night') return no(null);
  if (block.field.vehicles.includes(id)) return no(L().owned!);
  if (block.hqLevel < v.hq) return no(`Needs HQ Lv. ${v.hq}.`);
  if (block.funds < v.price) return no(fill(L().noMoney!, { cost: v.price }));
  const b = structuredClone(block);
  b.funds -= v.price;
  b.field.vehicles.push(id);
  if (id === 'bike' && b.phase !== 'evening') b.field.free += 1;
  return { ok: true, block: b, notice: fill(L().bought!, { name: v.name }) };
}

// ---------- the World Turn (Part 9 A1): the police, then the world ----------

const weekOf = (day: number): number => Math.floor((day - 1) / DOMINION_DATA.start.clock.weekLength) + 1;

/** The police's night (Part 1 §3.4, Part 4 §4), by the region's Wanted. Stream `dominion-police`. */
export function policeStep(b: DominionBlock, seed: string): string[] {
  const f = b.field, P = F().police, PL = P.lines;
  f.closed = null;
  f.patrol = null;
  if (f.hidden) {
    f.hidden = false;
    return [PL.hidden!];
  }
  const w = wanted(f);
  if (!bandAt(w, 'noticed')) return [];
  const rng = new Rng(hashSeed(`${seed}::dominion-police::${b.day}`));
  const lines: string[] = [];
  const name = (id: string): string => districtDef(id)?.name ?? id;
  f.patrol = hottest(f);
  if (f.patrol) lines.push(fill(PL.patrol!, { district: name(f.patrol) }));
  if (bandAt(w, 'wanted')) {
    const hot = F().districts.filter((d) => d.id !== F().hq && (f.districts[d.id]?.heat ?? 0) > 0);
    if (hot.length) {
      f.closed = hot[rng.int(0, hot.length - 1)]!.id;
      lines.push(fill(PL.checkpoint!, { district: name(f.closed) }));
    }
  }
  if (bandAt(w, 'hunted') && !bandAt(w, 'most') && !f.fight && f.rackets.length && f.lookerWeek !== weekOf(b.day)) {
    const r = f.rackets[rng.int(0, f.rackets.length - 1)]!;
    f.lookerWeek = weekOf(b.day);
    f.fight = { why: 'looker', foe: 'looker', begun: false, action: null, target: null, district: r.district, pass: false, big: false, wager: 0, racket: r.target };
    lines.push(fill(PL.looker!, { target: targetDef(r.target)?.target.name ?? r.target, district: name(r.district) }));
  }
  if (bandAt(w, 'most') && !f.fight) {
    f.fight = { why: 'raid', foe: 'raid', begun: false, action: null, target: null, district: F().hq, pass: false, big: false, wager: 0, racket: null };
    lines.push(PL.raid!);
  }
  return lines;
}

/** The world's part: Heat cools in every district, big-event Wanted fades, Rackets pay on bill day, and it's a new day. */
export function worldStep(b: DominionBlock): string[] {
  const f = b.field, C = DOMINION_DATA.start.clock, R = DOMINION_DATA.start.report;
  const lines: string[] = [];
  const was = b.heat;
  for (const d of Object.values(f.districts)) d.heat = Math.max(0, d.heat - C.heatCoolPerDay);
  f.wanted = Math.max(0, f.wanted - F().police.wantedDecay);
  syncHeat(b);
  if (b.heat !== was) lines.push(fill(R.cool, { heat: b.heat }));
  if (b.day % C.weekLength === 0 && f.rackets.length) {
    const K = F().control.racketPay;
    // D6: a collector (crew task Collect) makes a district's Rackets pay their %, whatever its status.
    const collect = empireOf(b).collect;
    const k = (id: string): number => {
      const st = statusOf(f.districts[id]!);
      return Math.max(K[st === 'rival' ? 'out' : st], (collect[id] ?? 0) / 100);
    };
    const bonus = 1 + (collect['*'] ?? 0) / 100;
    const pay = f.rackets.reduce((a, r) => a + Math.round(r.weekly * k(r.district) * bonus), 0);
    if (pay) {
      b.funds += pay;
      b.earned += pay;
      book(b, 'rackets', pay);
      lines.push(fill(L().rackets!, { pay }));
    }
  }
  // A new day: the Boss is back at the HQ (A20); today's free trips are the Bike's and the plan's.
  f.at = F().hq;
  f.free = (f.vehicles.includes('bike') ? 1 : 0) + (f.planned ? 1 : 0);
  f.planned = false;
  f.flew = false;
  f.evening = [];
  f.night = null;
  return lines;
}

addWorldStep('police', policeStep);
addWorldStep('world', worldStep);

/** The HQ's district's targets are scouted (D1's "Scout the block" order, now the real thing). */
export function scoutHome(b: DominionBlock): void {
  for (const t of districtDef(F().hq)?.targets ?? []) b.field.scouted[t.id] = b.day + F().odds.scoutDays;
}
