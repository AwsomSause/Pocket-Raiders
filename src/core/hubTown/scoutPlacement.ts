// Where the five starter scouts wander in Pocket Town (core/story2/starterScouts.ts). A hash of the save's profile id, so it
// differs from save to save but is the same on every visit. Presentation only: no gameplay RNG, and nothing is saved.

import { STARTER_SCOUTS, type StarterScout } from '../story2/starterScouts';
import { OVERWORLD } from './schema';

export const POCKET_ZONES = ['training', 'culture', 'home', 'play', 'plaza'];

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

export interface ScoutFolk {
  id: string;
  name: string;
  sheet: string;
  zone: string;
  scout: StarterScout;
}

export function scoutPlacement(profileId: string): ScoutFolk[] {
  const sheets = OVERWORLD.trainers;
  if (sheets.length === 0) return [];
  return STARTER_SCOUTS.map((scout) => ({
    id: `scout_${scout.id}`,
    name: scout.name,
    sheet: sheets[hash(`scout-sheet:${scout.id}`) % sheets.length]!,
    zone: POCKET_ZONES[hash(`scout-zone:${profileId}:${scout.id}`) % POCKET_ZONES.length]!,
    scout,
  }));
}
