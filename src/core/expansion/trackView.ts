// Beta 0.6 E2: the Notebook's world-state track page (Kice's pick "Ledger 1", Open Notebook). Pure view-model: it reads the
// run and the track data and returns words, never numbers. It only reveals what the player has reached (peak step), so
// a step not yet seen shows "???".

import { expansionData } from '../../data/expansion';
import type { Content } from '../contentSchema';
import { currentRegion } from '../regions';
import type { RunState } from '../state';
import { TRACK_MAX } from './track';
import { trackPageTextFor } from './trackRegions';
import { trackOf } from './trackRun';

/** Kanto's page text per step: where the player might notice it ("scale"), a sighting, and what a civilian says. */
const KANTO_PAGE: Record<number, { scale: string; scaleNote: string; sighting: string; civilian: string }> = {
  1: { scale: 'Street', scaleNote: 'One person', sighting: 'A shopkeeper adds "insurance" to your receipt.', civilian: '"Insurance? Against what, exactly?"' },
  2: { scale: 'City', scaleNote: 'A town', sighting: 'Game Corner prizes carry a black label, and a Pokémon Center locks up at night.', civilian: '"Mind the house rules. They changed again."' },
  3: { scale: 'Region', scaleNote: 'The map', sighting: 'A Snorlax sleeps across a road, and a sign points to a detour.', civilian: '"A Snorlax on Route 12? Since when does it stay put?"' },
  4: { scale: 'Border', scaleNote: 'What leaks out', sighting: 'Crates marked LIVE leave the harbor, and the wild Pokémon thin out.', civilian: '"I haven\'t seen a Pikachu in weeks. Not one."' },
  5: { scale: 'World', scaleNote: 'Part of something bigger', sighting: "Saffron's gates are shut and every screen runs a Rocket advert.", civilian: '"..."' },
};

export type StepState = 'seen' | 'now' | 'next' | 'locked';
export interface TrackPageStep { step: number; name: string; rule: string; state: StepState }
export interface TrackPageScale { scale: string; note: string; text: string; seen: boolean }
export interface TrackPage {
  region: string;
  kicker: string;
  title: string;
  steps: TrackPageStep[];
  /** How many of the five steps the player has reached this run (filled dots). */
  seenCount: number;
  scales: TrackPageScale[];
  civilian: string;
  /** What moves it next, in words. */
  nextLine: string;
}

/** The track page for the region the run is in, or null where that region has no track page (only Kanto's is built). */
export function trackPage(content: Content, run: RunState): TrackPage | null {
  if (!run.expansion?.tracks) return null;
  const region = currentRegion(content, run);
  const def = expansionData.tracks.find((t) => t.region === region.id);
  const PAGE = region.id === 'kanto' ? KANTO_PAGE : trackPageTextFor(region.id);
  if (!def || !PAGE) return null;
  const st = trackOf(run, region.id);
  const now = st?.step ?? 0;
  const peak = st?.peak ?? 0;
  const steps: TrackPageStep[] = def.steps.slice(0, TRACK_MAX).map((s) => {
    const n = Number(s.step);
    const state: StepState = n === now ? 'now' : n <= peak ? 'seen' : n === Math.max(now, peak) + 1 ? 'next' : 'locked';
    return { step: n, name: state === 'locked' ? '' : s.name, rule: state === 'locked' ? '???' : s.rule, state };
  });
  const scales = [1, 2, 3, 4, 5].map((n) => ({ scale: PAGE[n]!.scale, note: PAGE[n]!.scaleNote, text: n <= peak ? PAGE[n]!.sighting : '??? (not seen yet)', seen: n <= peak }));
  const nextStep = steps.find((s) => s.state === 'next');
  return {
    region: region.id,
    kicker: `${region.name.toUpperCase()} · WORLD STATE`,
    title: def.name,
    steps,
    seenCount: peak,
    scales,
    civilian: now > 0 ? PAGE[now]!.civilian : 'Nobody has noticed anything yet.',
    nextLine: nextStep ? `Next: ${nextStep.name || 'the next step'}, if a raid is failed or declined.` : now >= TRACK_MAX ? 'The ledger is full. A raid won turns it back.' : 'A raid won turns it back.',
  };
}
