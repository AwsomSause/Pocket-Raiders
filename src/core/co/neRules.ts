// Catalog Overhaul, new events (row 17): the small rules the hundred new events need. Pure functions on the run, no randomness.
// Conditions: stageTypes, runPlace, hasEgg, weather, anyFlag. Effects: quietWild, eggWarm, typeItem, tagPartner. Battle rule: foeNoFlag.
import type { Content, TypeName } from '../contentSchema';
import type { PokemonInstance, RunState } from '../state';
import { getCampaign } from '../regions';
import type { CO_MOVE_FLAGS } from './who';

type CoMoveFlag = (typeof CO_MOVE_FLAGS)[number];
import { stageFronts } from '../world';
import { eggBondKey, warmEggs } from '../eggs';

const counters = (run: RunState): Record<string, number> => run.itemCounters ?? {};
const setCounter = (run: RunState, key: string, value: number): void => {
  run.itemCounters = { ...counters(run), [key]: value };
};

/** 1-based stage of the current region and 1-based region of the run. */
function placeNow(content: Content, run: RunState): { stage: number; region: number; perRegion: number; regions: number } {
  return {
    stage: (run.stage?.index ?? 0) + 1,
    region: run.regionIndex + 1,
    perRegion: getCampaign(content, run.campaignId).stagesPerRegion,
    regions: run.regionOrder.length,
  };
}

/** The current stage is themed with one of these types (the placement tags "water", "cave"...). */
export function stageTypesMet(content: Content, run: RunState, types: readonly TypeName[]): boolean {
  if (!run.stage) return false;
  const theme = content.themes.get(run.stage.themeId);
  return !!theme && theme.types.some((t) => types.includes(t));
}

export interface RunPlaceCheck {
  stage?: [number, number] | undefined;
  region?: [number, number] | undefined;
  regionEnd?: boolean | undefined;
  lastRegion?: boolean | undefined;
}

/** Where the run stands: stage and region ranges (1-based, inclusive), the last stage of a region, the run's final region. */
export function runPlaceMet(content: Content, run: RunState, c: RunPlaceCheck): boolean {
  const p = placeNow(content, run);
  if (c.stage && (p.stage < c.stage[0] || p.stage > c.stage[1])) return false;
  if (c.region && (p.region < c.region[0] || p.region > c.region[1])) return false;
  if (c.regionEnd !== undefined && (p.stage >= p.perRegion) !== c.regionEnd) return false;
  if (c.lastRegion !== undefined && (p.region >= p.regions) !== c.lastRegion) return false;
  return true;
}

export const hasEgg = (run: RunState): boolean => run.eggs.length > 0;

/** Some stretch of the current stage has this weather (its fronts). */
export function stageWeatherMet(content: Content, run: RunState, weathers: readonly string[]): boolean {
  return !!run.stage && stageFronts(content, run).some((f) => weathers.includes(f.weather));
}

export const anyFlagSet = (run: RunState, keys: readonly string[]): boolean => keys.some((k) => Number(run.story.flags[`ev:${k}`] ?? 0) > 0);

// ---------- quiet wild ----------
const quietKey = (span: 'stage' | 'region', type: string) => `quiet-${span}:${type}`;
const stageMark = (content: Content, run: RunState) => run.regionIndex * placeNow(content, run).perRegion + (run.stage?.index ?? 0) + 1;

/** The wild Pokémon of these types keep away for the rest of this stage or region (an Alpha left, the river emptied). */
export function quietWild(content: Content, run: RunState, span: 'stage' | 'region', types: readonly TypeName[]): string {
  const mark = span === 'stage' ? stageMark(content, run) : run.regionIndex + 1;
  for (const t of types) setCounter(run, quietKey(span, t), mark);
  return span === 'stage' ? 'The wild Pokémon here keep their distance for the rest of this stage.' : 'The wild Pokémon keep their distance for the rest of this region.';
}

/** Weight for a wild species: low while its type is quiet. 1 when nothing is quiet, so no existing roll moves. */
export function quietWildWeight(content: Content, run: RunState, speciesId: string): number {
  const c = counters(run);
  const keys = Object.keys(c).filter((k) => k.startsWith('quiet-'));
  if (keys.length === 0) return 1;
  const types = content.species.get(speciesId)?.types ?? [];
  const here = stageMark(content, run);
  const quiet = types.some((t) => c[quietKey('stage', t)] === here || c[quietKey('region', t)] === run.regionIndex + 1);
  return quiet ? content.balance.co.quietWildWeight : 1;
}

// ---------- eggs ----------
/** Warm every carried Egg: it hatches `steps` sooner, and the Pokémon is born fonder of you (`friendship`, read by hatchEgg). */
export function eggWarm(run: RunState, steps: number, friendship: number): string {
  if (run.eggs.length === 0) return '';
  warmEggs(run, steps);
  if (friendship > 0) for (const egg of run.eggs) setCounter(run, eggBondKey(egg.uid), (counters(run)[eggBondKey(egg.uid)] ?? 0) + friendship);
  return run.eggs.length === 1 ? 'Your Egg is warm. It will hatch sooner.' : 'Your Eggs are warm. They will hatch sooner.';
}

// ---------- items by type ----------
/** The table's item for the first of the Pokémon's types that has one. */
export function itemForType(content: Content, mon: PokemonInstance | undefined, table: Partial<Record<TypeName, string>>): string | null {
  const types = mon ? content.species.get(mon.speciesId)?.types ?? [] : [];
  for (const t of types) if (table[t]) return table[t]!;
  return null;
}

// ---------- tag partner ----------
const TAG_KEY = 'tag-partner';
/** A copy of your lead fights beside you in the next `battles` ordinary trainer battles (a double battle). */
export function owePartner(run: RunState, battles: number): void {
  setCounter(run, TAG_KEY, (counters(run)[TAG_KEY] ?? 0) + battles);
}
export const partnerOwed = (run: RunState): number => counters(run)[TAG_KEY] ?? 0;
/** Spend one battle of the partner (call when it joins a fight). */
export function spendPartner(run: RunState): void {
  setCounter(run, TAG_KEY, Math.max(0, partnerOwed(run) - 1));
}

// ---------- battle rule ----------
/** foeNoFlag: the foe has lost every move with this flag (the Exploud's voice). It keeps at least one move. */
export function stripFoeMoves(content: Content, mon: PokemonInstance, flag: CoMoveFlag, fallback = 'tackle'): void {
  const kept = mon.moves.filter((m) => !content.moves.get(m.id)?.flags.includes(flag));
  if (kept.length === mon.moves.length) return;
  const move = content.moves.get(fallback);
  mon.moves = kept.length > 0 ? kept : move ? [{ id: move.id, pp: move.pp }] : mon.moves;
}
