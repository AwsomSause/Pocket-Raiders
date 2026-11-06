// The Run Chronicle: one record per finished Story Run, written at run end and kept in `profile.story.chronicles`
// (newest last, 40 at most). It only reads the run; nothing in the game reads it back, so a Chronicle can never change an outcome.
// Every Chronicle opens with "In this telling," in the UI: it is one account, not canon.

import type { Profile, RunState } from '../state';
import { stageRank } from './relationships';
import { ChronicleRecordSchema, type ChronicleRecord, type StoryData } from './schema';

const HIGHLIGHTS = 12;
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');

/** "The Quiet Between Storms: Victory" style title from the theme and how the run ended. */
export function chronicleTitle(theme: string | undefined, victory: boolean): string {
  return `${theme ? cap(theme.replace(/^th_/, '')) : 'A Story'}: ${victory ? 'The Road Home' : 'An Unfinished Road'}`;
}

export function buildChronicle(run: RunState, endedAt: string): ChronicleRecord | null {
  const v2 = run.story.v2;
  if (!v2) return null;
  const relationships: Record<string, string> = {};
  for (const [id, rec] of Object.entries(v2.cast)) if (rec.flags.met) relationships[id] = rec.stage;
  const victory = run.victory === true;
  const losses = typeof v2.facts.story_losses === 'number' ? v2.facts.story_losses : 0;
  return ChronicleRecordSchema.parse({
    runId: run.runId, endedAt, victory, seed: run.seed,
    title: chronicleTitle(v2.blueprint?.theme, victory),
    ...(v2.protagonist?.backstory ? { backstory: v2.protagonist.backstory } : {}),
    ...(v2.blueprint?.theme ? { theme: v2.blueprint.theme } : {}),
    ...(v2.starter ? { starter: { line: v2.starter.lineId, temperament: v2.starter.temperament } } : {}),
    ...(v2.blueprint?.rivals.primary ? { rival: v2.blueprint.rivals.primary } : {}),
    ...(v2.blueprint?.antagonist ? { antagonist: v2.blueprint.antagonist } : {}),
    stops: { done: v2.stops.done.length, planned: v2.stops.planned },
    losses, relationships,
    highlights: v2.scenesDone.slice(0, HIGHLIGHTS),
    ...(v2.module?.ending ? { ending: v2.module.ending } : {}),
  });
}

/** Adds the run's Chronicle to the profile (once per run id; newest last, oldest dropped past 40). */
export function recordChronicle(profile: Profile, run: RunState, endedAt: string): void {
  const rec = buildChronicle(run, endedAt);
  if (!rec || profile.story.chronicles.some((c) => c.runId === rec.runId)) return;
  profile.story.chronicles = [...profile.story.chronicles, rec].slice(-40);
}

/** The character the run ended closest to (highest stage), for the Chronicle preview. */
export function closestBond(rec: ChronicleRecord): string | null {
  const best = Object.entries(rec.relationships).sort((a, b) => stageRank(b[1]) - stageRank(a[1]) || a[0].localeCompare(b[0]))[0];
  return best && stageRank(best[1]) > 0 ? best[0] : null;
}

// ---------- what the Chronicle page shows ----------


export interface ChronicleView { title: string; sub: string; lines: string[] }

/** The reader text for one Chronicle: always opens with "In this telling,". */
export function chronicleView(data: StoryData, rec: ChronicleRecord): ChronicleView {
  const name = (id: string): string => data.text[data.characters.find((c) => c.id === id)?.nameKey ?? ''] ?? cap(id.replace(/^ch_/, ''));
  const opener = data.text['chron.open'] ?? 'In this telling,';
  const bond = closestBond(rec);
  const lines = [
    `${opener} ${rec.victory ? 'the road led home.' : 'the road stopped short.'}`,
    `Seed ${rec.seed}`,
    `Stops: ${rec.stops.done} of ${rec.stops.planned}${rec.losses > 0 ? `  ·  ${rec.losses} setback${rec.losses === 1 ? '' : 's'}, and the road went on` : ''}`,
    ...(rec.backstory ? [`Backstory: ${cap(rec.backstory.replace(/^bs_/, ''))}`] : []),
    ...(rec.starter ? [`Partner: ${cap(rec.starter.line.replace(/^rm_/, ''))} (${cap(rec.starter.temperament)})`] : []),
    ...(rec.rival ? [`Rival: ${name(rec.rival)}`] : []),
    ...(rec.antagonist ? [`Opposed by: ${name(rec.antagonist)}`] : []),
    ...(rec.ending ? [`Ending: ${cap(rec.ending.replace(/^end_/, ''))}`] : []),
    ...(bond ? [`Closest bond: ${name(bond)}`] : []),
    ...(Object.keys(rec.relationships).length > 0 ? ['', 'Cast:', ...Object.entries(rec.relationships).map(([id, stage]) => `  ${name(id)}: ${cap(stage)}`)] : []),
  ];
  return { title: rec.title, sub: `${rec.victory ? 'Home' : 'Unfinished'}  ·  ${rec.stops.done}/${rec.stops.planned} stops  ·  ${rec.endedAt.slice(0, 10)}`, lines };
}
