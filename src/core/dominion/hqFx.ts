// DOMINION slice D5: what the HQ's rooms and buildings add up to (Part 3 §3, lists/buildings*.md). Small and import-free
// of the other systems, so the clock, the field, the crew and recruiting can all read it without a cycle.

import { DOMINION_DATA } from './data';
import { fill } from './worldTurn';
import type { Building, BuildingFx, DominionBlock, HqState, Room } from './schema';

const H = () => DOMINION_DATA.hq;
const BY_ID = new Map(DOMINION_DATA.buildings.map((b) => [b.id, b]));

export const buildingDef = (id: string): Building | undefined => BY_ID.get(id);
export const levelDef = (lv: number) => H().levels[Math.max(1, Math.min(6, lv)) - 1]!;

/** A save from before D5 has no `hq`: it starts empty, with no clean money (only a new run starts with clean money). */
export function hqOf(b: DominionBlock): HqState {
  return b.hq ?? { rooms: [], next: 1, upgrade: null, clean: 0, wash: [], loan: null, broke: false };
}
export function withHq<T extends DominionBlock>(b: T, clean = 0): T {
  if (!b.hq) b.hq = { ...hqOf(b), clean: Math.max(0, Math.min(clean, b.funds)) };
  return b;
}

/** A room works when it's built, standing and open (a room being raised a tier keeps working at its old tier). */
export const working = (r: Room): boolean => !r.building && !r.ruined && !r.shut && r.cond > 0;

/** The building's T1 number at tier `t` (lists §1: Effect x by tier; Vault/Treasury is tier x ₽10,000; fees drop 1% a tier). */
export function scaled(key: keyof BuildingFx, v: number, t: number): number {
  if (key === 'launder') return Math.max(0, v - (t - 1));
  if (key === 'treasury') return v * t;
  return Math.round(v * H().tiers[t - 1]!.effect);
}

export type HqFx = Required<Omit<BuildingFx, 'items' | 'weeklyItems' | 'unlock' | 'launder' | 'heatOnce'>> & {
  items: Record<string, number>;
  weeklyItems: Record<string, number>;
  /** The best laundering fee (%), or null with no Front. */
  launder: number | null;
};

const ZERO = (): HqFx => ({
  crewCap: 0, morale: 0, loyalty: 0, income: 0, clean: 0, weekly: 0, heatDay: 0, heatWeek: 0, control: 0, trainXp: 0, injury: 0,
  recruit: 0, hireOff: 0, treasury: 0, storage: 0, defense: 0, dayActions: 0, nightActions: 0, restBonus: 0, fatigue: 0, repair: 0,
  incomePct: 0, items: {}, weeklyItems: {}, launder: null,
  // D9 (rivals.ts)
  intel: 0, spyCatch: 0, cipher: 0, raidDef: 0, warn: 0, fireCut: 0, truceOff: 0,
});

/** Everything the working rooms and buildings add, in one place. Percentages are capped at 90. */
export function hqFx(b: DominionBlock): HqFx {
  const out = ZERO();
  for (const r of b.hq?.rooms ?? []) {
    if (!working(r)) continue;
    const def = BY_ID.get(r.id);
    if (!def) continue;
    for (const [k, v] of Object.entries(def.fx) as [keyof BuildingFx, unknown][]) {
      if (k === 'unlock' || k === 'heatOnce' || k === 'control') continue;
      if (k === 'items' || k === 'weeklyItems') {
        for (const [id, n] of Object.entries(v as Record<string, number>)) out[k][id] = (out[k][id] ?? 0) + scaled('income', n, r.tier);
      } else if (k === 'launder') {
        const fee = scaled(k, v as number, r.tier);
        out.launder = out.launder === null ? fee : Math.min(out.launder, fee);
      } else {
        const o = out as unknown as Record<string, number>;
        o[k] = (o[k] ?? 0) + scaled(k, v as number, r.tier);
      }
    }
    // A Front business launders at 10% (Part 3 §1).
    if (r.at && def.fx.clean) out.launder = out.launder === null ? 10 : Math.min(out.launder, 10);
  }
  out.injury = Math.min(90, out.injury);
  out.spyCatch = Math.min(90, out.spyCatch);
  out.fireCut = Math.min(90, out.fireCut);
  out.cipher = Math.min(90, out.cipher);
  out.truceOff = Math.min(90, out.truceOff);
  out.hireOff = Math.min(90, out.hireOff);
  return out;
}

/** The building an action's or task's unlock text names ("Front Office", "War Room"...), or null. */
export function roomFor(unlock: string): string | null {
  for (const [word, id] of Object.entries(H().rooms)) if (unlock.includes(word)) return id;
  return null;
}
/** Whether a working room of that building stands. */
export const hasRoom = (b: DominionBlock, id: string): boolean => (b.hq?.rooms ?? []).some((r) => r.id === id && working(r));

/** The clean part of the funds: spending takes dirty money first, so clean is never more than the funds. */
export const cleanOf = (b: DominionBlock): number => Math.max(0, Math.min(hqOf(b).clean, b.funds));
/** Money that isn't clean. */
export const dirtyOf = (b: DominionBlock): number => Math.max(0, b.funds - cleanOf(b));
/** Adds clean money (Fronts, odd jobs, selling a building, laundering). */
export function addClean(b: DominionBlock, n: number): void {
  const h = withHq(b).hq!;
  b.funds += n;
  h.clean = Math.max(0, h.clean + n);
  clampClean(b);
}
/** Money out (any spending): dirty money goes first, so the clean part only drops when the dirty part is gone. */
export function spend(b: DominionBlock, n: number): void {
  b.funds -= n;
  clampClean(b);
}
/** Clean money can't be more than the funds: spending takes dirty money first, then clean. */
export function clampClean(b: DominionBlock): void {
  if (b.hq) b.hq.clean = Math.max(0, Math.min(b.hq.clean, b.funds));
}

/** Hire Grunt's price with the Recruitment Center's discount. */
export const hirePrice = (b: DominionBlock, base: number): number => Math.round((base * (100 - hqFx(b).hireOff)) / 100);

/** The Launder action (lists/player-actions.md #11): up to ₽1,000 at 70% back, in two days, without a Front's fee. */
export function launderAction(b: DominionBlock): string {
  const a = H().rules.launderAction;
  const n = Math.min(a.max, dirtyOf(b));
  if (n < 1) return H().lines.noDirty!;
  withHq(b);
  const net = Math.max(1, Math.floor((n * (100 - a.fee)) / 100));
  b.funds -= n;
  clampClean(b);
  b.hq!.wash.push({ net, ready: b.day + a.days, front: 'the back room' });
  return fill(H().lines.launder!, { amount: n, front: 'the back room', fee: a.fee, net, when: `in ${a.days} days` });
}

