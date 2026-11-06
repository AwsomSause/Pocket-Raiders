// Twelve rival voice archetypes (Story Overhaul W1, design 14.3). A voice colours dialogue and sets starting trait
// targets. It never changes battle rules: battle behaviour stays in the personalities and styles of rivalProfiles.json.

import { z } from 'zod';
import json from '../../data/rivalVoices.json';
import type { Rival } from '../story/schema';
import { RIVAL_PROFILES } from './schema';

const TraitKey = z.enum(['ambition', 'pride', 'empathy', 'adaptability', 'vindictiveness', 'resilience']);
export const VoicesSchema = z.object({
  note: z.string(),
  voices: z.array(z.object({ id: z.string(), traits: z.partialRecord(TraitKey, z.number().min(0).max(100)), personalities: z.array(z.string()).min(1), styles: z.array(z.string()).min(1) })).length(12),
});
export const VOICES = VoicesSchema.parse(json);
export const VOICE_IDS = VOICES.voices.map((v) => v.id);

/** The voice of a personality: the first voice that lists it (file order), or null. */
export const voiceForPersonality = (personality: string): string | null => VOICES.voices.find((v) => v.personalities.includes(personality))?.id ?? null;

/** A rival's voice: its stored voice, else the one for its personality, else the closest by trait targets. */
export function voiceOf(rival: Pick<Rival, 'voice' | 'archetype' | 'traits'>): string {
  if (rival.voice && VOICE_IDS.includes(rival.voice)) return rival.voice;
  const byPersonality = voiceForPersonality(rival.archetype);
  if (byPersonality) return byPersonality;
  const dist = (t: Record<string, number>) => Object.entries(t).reduce((sum, [k, v]) => sum + Math.abs((rival.traits as unknown as Record<string, number>)[k]! - v), 0);
  return [...VOICES.voices].sort((a, b) => dist(a.traits) - dist(b.traits) || a.id.localeCompare(b.id))[0]!.id;
}

/** Data check: every listed personality and style exists in rivalProfiles.json. Returns the bad ids. */
export function badVoiceRefs(): string[] {
  return VOICES.voices.flatMap((v) => [
    ...v.personalities.filter((p) => !RIVAL_PROFILES.personalities[p]).map((p) => `${v.id}:${p}`),
    ...v.styles.filter((s) => !RIVAL_PROFILES.styles[s]).map((s) => `${v.id}:${s}`),
  ]);
}
