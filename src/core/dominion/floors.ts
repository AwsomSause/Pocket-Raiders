// DOMINION HQ floors and plots (Kice 2026-11-21; plans/evil-mode-rework/hq-floors/DESIGN.md §1-2). Every HQ level opens
// one floor with its own free plots and a fixture that works at once; each floor sells a few more plots. Rooms stand on
// a floor. Older saves have no floors on their rooms: `layout` packs those from the Ground Floor up, in build order, so
// the counts never change for them. Pure; imports only the data and hqFx, so hq.ts can use it without a cycle.

import { DOMINION_DATA } from './data';
import { addFxHook, buildingDef, hqOf, spend, withHq } from './hqFx';
import type { BuildingFx, DominionBlock, HqState } from './schema';
import { fill } from './worldTurn';

const H = () => DOMINION_DATA.hq;
const Ln = () => DOMINION_DATA.hq.lines;
const s = (n: number): string => (n === 1 ? '' : 's');

export type FloorDef = ReturnType<typeof floorDef>;
export const floorDef = (f: number) => H().floors[Math.max(1, Math.min(6, f)) - 1]!;
/** Floors open now: one per HQ level (1 = Ground Floor). */
export const floorsOpen = (b: DominionBlock): number => Math.max(1, Math.min(6, b.hqLevel));
/** The floor's name inside a sentence ("the Upper Floor", "the Cellar"). */
export const floorName = (f: number): string => `the ${floorDef(f).name.replace(/^The /, '')}`;

export const boughtOn = (b: DominionBlock, f: number): number => hqOf(b).plots?.[f - 1] ?? 0;
/** Plots on a floor: its free ones plus the ones bought (0 while the floor is closed). */
export const plotsOn = (b: DominionBlock, f: number): number => (f > floorsOpen(b) ? 0 : floorDef(f).plots + boughtOn(b, f));
/** Every plot in the HQ (the old "room slots" plus bought land). */
export function totalPlots(b: DominionBlock): number {
  let n = 0;
  for (let f = 1; f <= floorsOpen(b); f++) n += plotsOn(b, f);
  return n;
}

/** The floor each inside room stands on (uid -> floor). Rooms without one are packed first-fit from the ground up. */
export function layout(b: DominionBlock): Map<string, number> {
  const open = floorsOpen(b);
  const used = new Array<number>(7).fill(0);
  const out = new Map<string, number>();
  const inside = hqOf(b).rooms.filter((r) => !r.at);
  for (const r of inside) {
    if (!r.floor) continue;
    out.set(r.uid, r.floor);
    used[r.floor]! += buildingDef(r.id)?.slots ?? 1;
  }
  for (const r of inside) {
    if (r.floor) continue;
    const n = buildingDef(r.id)?.slots ?? 1;
    let f = 0;
    for (let i = 1; i <= open && !f; i++) if (plotsOn(b, i) - used[i]! >= n) f = i;
    // Nothing fits (a two-plot room left with single gaps): the floor with the most room takes it.
    if (!f) {
      f = 1;
      for (let i = 2; i <= open; i++) if (plotsOn(b, i) - used[i]! > plotsOn(b, f) - used[f]!) f = i;
    }
    out.set(r.uid, f);
    used[f]! += n;
  }
  return out;
}

export function usedOn(b: DominionBlock, f: number): number {
  const at = layout(b);
  return hqOf(b).rooms.filter((r) => !r.at && at.get(r.uid) === f).reduce((a, r) => a + (buildingDef(r.id)?.slots ?? 1), 0);
}
export const freeOn = (b: DominionBlock, f: number): number => Math.max(0, plotsOn(b, f) - usedOn(b, f));
/** The lowest floor with `n` free plots side by side, or null. */
export function firstFit(b: DominionBlock, n: number): number | null {
  for (let f = 1; f <= floorsOpen(b); f++) if (freeOn(b, f) >= n) return f;
  return null;
}

/** The next plot's price on a floor (each costs plotStepPct% more than the last), or null when none are left. */
export function plotPrice(b: DominionBlock, f: number): number | null {
  const d = floorDef(f);
  const k = boughtOn(b, f);
  if (f > floorsOpen(b) || k >= d.forSale) return null;
  return Math.round((d.plotCost * (100 + H().plotStepPct * k)) / 100);
}

export interface FloorOut { ok: boolean; block: DominionBlock; notice: string | null }

/** Buys one plot on floor `f` (any money, dirty first). It is yours at once. */
export function buyPlot(block: DominionBlock, f: number): FloorOut {
  if (!Number.isInteger(f) || f < 1 || f > 6) return { ok: false, block, notice: null };
  if (f > floorsOpen(block)) return { ok: false, block, notice: fill(Ln().plotLocked!, { lv: f }) };
  const cost = plotPrice(block, f);
  if (cost === null) return { ok: false, block, notice: fill(Ln().plotNone!, { floor: floorName(f) }) };
  if (block.funds < cost) return { ok: false, block, notice: fill(Ln().noMoney!, { cost }) };
  const b = withHq(structuredClone(block)) as DominionBlock & { hq: HqState };
  const plots = [...(b.hq.plots ?? [])];
  while (plots.length < 6) plots.push(0);
  plots[f - 1]! += 1;
  b.hq.plots = plots;
  spend(b, cost);
  return { ok: true, block: b, notice: fill(Ln().plotBought!, { floor: floorName(f), free: freeOn(b, f), cost: cost.toLocaleString('en-US') }) };
}

/** The "New floor" page is due: the HQ reached a floor whose page wasn't seen. Old saves count as having seen theirs. */
export const floorDue = (b: DominionBlock): number | null => {
  const seen = hqOf(b).floorSeen ?? null;
  if (seen === null || floorsOpen(b) <= seen) return null;
  return floorsOpen(b);
};
export function seeFloor(block: DominionBlock): FloorOut {
  const b = withHq(structuredClone(block)) as DominionBlock & { hq: HqState };
  b.hq.floorSeen = floorsOpen(b);
  return { ok: true, block: b, notice: null };
}

/** The line the Night Report gets when an upgrade opens a floor. */
export function floorNewLine(f: number): string {
  const d = floorDef(f);
  return fill(Ln().floorNew!, { floor: floorName(f), tag: d.tag, plots: d.plots, fixture: d.fixture.name, does: d.fixture.does, s: s(d.plots) });
}

// Every open floor's fixture adds to the HQ's numbers (the Lookout Post's Defense, the Bolt Hole's Heat...).
addFxHook((b, out) => {
  const o = out as unknown as Record<string, number>;
  for (let f = 1; f <= floorsOpen(b); f++) {
    for (const [k, v] of Object.entries(floorDef(f).fixture.fx as BuildingFx)) if (typeof v === 'number') o[k] = (o[k] ?? 0) + v;
  }
});
