// Grand Arc start (slice E7): who holds which Data ROM, and the Stock track. A ROM is never lost: nothing here removes one.

import raw from '../../data/grandArc.json';
import { z } from 'zod';
import type { RunState } from '../state';
import { freshGrandArc, type GrandArcState } from './schema';

const DataSchema = z.object({
  romsPerStep: z.number().int().min(1), maxStock: z.number().int().min(1),
  roms: z.array(z.object({ id: z.string().length(1), region: z.string(), name: z.string(), liaison: z.string(), method: z.string(), proves: z.string() })).length(9),
  stockSteps: z.array(z.object({ step: z.number().int().min(1).max(5), id: z.string(), name: z.string(), gainedWhen: z.string(), atFinale: z.string() })).length(5),
});
export const grandArcData = DataSchema.parse(raw);

export const romById = (id: string) => grandArcData.roms.find((r) => r.id === id);
export const romOfRegion = (regionId: string) => grandArcData.roms.find((r) => r.region === regionId);

/** The run's Grand Arc state, or null when the arc is off for this run. */
export const grandArcOf = (run: Pick<RunState, 'expansion'>): GrandArcState | null => run.expansion?.grandArc ?? null;

/** Turns the arc on for a run (done once, when the run starts with the setting on). */
export function startGrandArc(run: RunState): void {
  run.expansion = { ...run.expansion, grandArc: freshGrandArc() };
}

/** Every ROM held, earned or late. */
export const romsHeld = (s: GrandArcState): string[] => [...s.roms, ...s.late];

/** Earns a ROM in its region (or, with `late`, takes it from the liaison at the finale). Returns false if the arc is off, the id is unknown, or it is already held. */
export function earnRom(run: Pick<RunState, 'expansion'>, id: string, late = false): boolean {
  const s = grandArcOf(run);
  if (!s || !romById(id) || romsHeld(s).includes(id)) return false;
  (late ? s.late : s.roms).push(id);
  return true;
}

/** Gains a Stock step (once each). */
export function gainStock(run: Pick<RunState, 'expansion'>, step: number): boolean {
  const s = grandArcOf(run);
  if (!s || s.stock.includes(step) || !grandArcData.stockSteps.some((x) => x.step === step)) return false;
  s.stock.push(step);
  s.stock.sort((a, b) => a - b);
  return true;
}

/** The Stock track now (0 to 5): the steps gained, less one for every three ROMs held. */
export function stockLevel(run: Pick<RunState, 'expansion'>): number {
  const s = grandArcOf(run);
  if (!s) return 0;
  return Math.max(0, Math.min(grandArcData.maxStock, s.stock.length - Math.floor(romsHeld(s).length / grandArcData.romsPerStep)));
}

/** The named step the Stock is at (null at 0): the highest gained step still standing after ROMs knock steps off the top. */
export function stockStep(run: Pick<RunState, 'expansion'>) {
  const s = grandArcOf(run);
  const level = stockLevel(run);
  if (!s || level === 0) return null;
  const standing = s.stock.slice(0, level);
  return grandArcData.stockSteps.find((x) => x.step === standing[standing.length - 1]) ?? null;
}

/** The finale is offered after the last regional climax to anyone holding three or more ROMs. */
export const finaleOffered = (run: Pick<RunState, 'expansion'>): boolean => {
  const s = grandArcOf(run);
  return !!s && romsHeld(s).length >= 3;
};

/** A region was left. If its liaison was never beaten, Cipher keeps a Sample (Stock step 1) and the liaison returns at the finale. */
export function leaveRegion(run: Pick<RunState, 'expansion'>, regionId: string): string | null {
  const s = grandArcOf(run);
  const rom = romOfRegion(regionId);
  if (!s || !rom || s.roms.includes(rom.id) || s.left.includes(regionId)) return null;
  s.left.push(regionId);
  gainStock(run, 1);
  return `${rom.liaison} slipped away with the notes. Cipher keeps a sample.`;
}
