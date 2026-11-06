// Story audio (Story Overhaul S17, Design v2 Part AD): every story music piece, stinger and sound
// effect has an id here and points at an existing catalog sound (source "reuse") until real audio is
// composed or licensed. Pure data and rules; the sound itself plays through ui/audio.ts.
// Data: src/data/audio/story_music.json (npm run data:story-audio).

import { z } from 'zod';
import storyMusicJson from '../data/audio/story_music.json';

const Reuse = z.object({ source: z.literal('reuse'), reuse: z.string().min(1) });
const Made = z.object({
  source: z.enum(['original', 'licensed']),
  /** Catalog id of the real file once it exists. */
  asset: z.string().min(1),
  /** Who made it and under what licence (Part AF provenance). */
  composer: z.string().min(1),
  licence: z.string().min(1),
  /** Reuse sound to fall back to if the file fails to load. */
  reuse: z.string().min(1),
  loopStartMs: z.number().int().min(0).nullable().default(null),
  loopEndMs: z.number().int().positive().nullable().default(null),
});
const TrackBase = z.object({
  id: z.string().regex(/^(mu|st|se)_[a-z0-9_]+$/),
  kind: z.enum(['loop', 'stem', 'oneShot', 'sfx']),
  group: z.string().min(1),
  lengthSec: z.number().positive().nullable(),
  stemOf: z.string().optional(),
  note: z.string().optional(),
});
export const StoryTrackSchema = z.union([TrackBase.merge(Reuse), TrackBase.merge(Made)]);
export type StoryTrack = z.infer<typeof StoryTrackSchema>;
export const StoryMusicFileSchema = z.object({
  status: z.enum(['supported', 'limited']),
  source: z.string(),
  /** Cross-fade length between arrangements of one motif (Part AD: 2 seconds at a bar line). */
  fadeMs: z.number().int().positive(),
  tracks: z.array(StoryTrackSchema).min(1),
});
export const STORY_MUSIC = StoryMusicFileSchema.parse(storyMusicJson);
const byId = new Map(STORY_MUSIC.tracks.map((t) => [t.id, t]));

/** Budget numbers from Part AD: about 100 music pieces and stems, 12 stingers, 34 listed story sound effects. */
export const AUDIO_BUDGET = { musicMax: 110, stingersMax: 14, sfxMax: 60 } as const;

export function storyTrack(id: string): StoryTrack | undefined {
  return byId.get(id);
}

/** The catalog sound to play for a story audio id: the real file when it is made, otherwise the reuse sound. Null for an unknown id. */
export function storyAssetId(id: string, hasAsset: (assetId: string) => boolean = () => true): string | null {
  const t = byId.get(id);
  if (!t) return null;
  if (t.source !== 'reuse' && hasAsset(t.asset)) return t.asset;
  return t.reuse;
}

/** When to start a cross-fade between two arrangements: the next bar line at or after `positionMs` (16-bar grid, shared tempo). */
export function nextBarLineMs(positionMs: number, barMs: number): number {
  if (barMs <= 0) return positionMs;
  return Math.ceil(positionMs / barMs) * barMs;
}

/** The arrangements of one motif share a tempo and grid, so any two can cross-fade. Returns the plan or null when they are not of the same motif. */
export function crossfadePlan(fromId: string, toId: string, positionMs: number, barMs: number): { startMs: number; fadeMs: number } | null {
  const a = byId.get(fromId);
  const b = byId.get(toId);
  if (!a || !b || a.kind === 'sfx' || b.kind === 'sfx') return null;
  if (!a.stemOf || a.stemOf !== b.stemOf) return null;
  return { startMs: nextBarLineMs(positionMs, barMs), fadeMs: STORY_MUSIC.fadeMs };
}

/** Audio budget gate: lines describing anything wrong; empty means the gate passes. `catalogAudio` is the set of catalog audio ids. */
export function audioBudgetProblems(catalogAudio: ReadonlySet<string>, file = STORY_MUSIC): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  let music = 0;
  let stingers = 0;
  let sfx = 0;
  for (const t of file.tracks) {
    if (seen.has(t.id)) out.push(`${t.id}: duplicate id`);
    seen.add(t.id);
    if (!catalogAudio.has(t.reuse)) out.push(`${t.id}: reuse sound "${t.reuse}" is not in the catalog`);
    if (t.source !== 'reuse') {
      if (!catalogAudio.has(t.asset)) out.push(`${t.id}: file "${t.asset}" is not in the catalog`);
      if ((t.kind === 'loop' || t.kind === 'stem') && (t.loopStartMs === null || t.loopEndMs === null || t.loopEndMs <= t.loopStartMs)) out.push(`${t.id}: a made loop needs loop points (loopStartMs < loopEndMs)`);
    }
    if (t.kind === 'sfx') sfx++;
    else if (t.id.startsWith('st_')) stingers++;
    else music++;
    if (t.kind === 'oneShot' && t.lengthSec !== null && t.id.startsWith('st_') && (t.lengthSec < 1 || t.lengthSec > 8)) out.push(`${t.id}: stingers are 1 to 8 seconds`);
    if (t.kind === 'stem' && !t.stemOf) out.push(`${t.id}: a stem needs stemOf`);
    if (t.kind === 'loop' && t.group === 'leitmotif' && !/_(calm|tense|final)$/.test(t.id)) out.push(`${t.id}: a leitmotif is calm, tense or final`);
  }
  if (music > AUDIO_BUDGET.musicMax) out.push(`${music} music pieces is over the budget of ${AUDIO_BUDGET.musicMax}`);
  if (stingers > AUDIO_BUDGET.stingersMax) out.push(`${stingers} stingers is over the budget of ${AUDIO_BUDGET.stingersMax}`);
  if (sfx > AUDIO_BUDGET.sfxMax) out.push(`${sfx} sound effects is over the budget of ${AUDIO_BUDGET.sfxMax}`);
  return out;
}
