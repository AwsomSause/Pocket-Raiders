// Shareable run card (W12): the text on the card, built from a finished run. Pure; no RNG, no clock.

import type { Content } from './contentSchema';
import type { RunState } from './state';
import { buildRecap } from './recap';
import { getMode, getDifficulty } from './rules';

/** A picture on the card: a region of a loaded texture, set by the scene. */
export interface CardArt { source: CanvasImageSource; sx: number; sy: number; sw: number; sh: number }

export interface RunCard {
  title: string;
  subtitle: string;
  team: { speciesId: string; name: string; level: number; shiny: boolean; art?: CardArt }[];
  stats: string[];
  highlights: string[];
  footer: string;
}

export function buildRunCard(content: Content, run: RunState): RunCard {
  const recap = buildRecap(content, run);
  const mode = getMode(run.rules.modeId)?.name ?? run.rules.modeId;
  const diff = getDifficulty(run.rules.difficultyId)?.name ?? run.rules.difficultyId;
  const archetype = content.archetypes.get(run.archetypeId)?.name ?? run.archetypeId;
  return {
    title: run.victory ? 'Run cleared!' : 'Run over',
    subtitle: `${archetype} · ${mode} · ${diff}`,
    team: run.party.map((m) => ({ speciesId: m.speciesId, name: m.care?.nickname ?? content.species.get(m.speciesId)?.name ?? m.speciesId, level: m.level, shiny: !!m.shiny })),
    stats: [`Regions ${run.regionsCleared.length}/${run.regionOrder.length}`, `Badges ${run.badges.length}`, `Encounters ${run.encountersCompleted}`, `Day ${run.clock.day}`],
    highlights: [recap.ending, ...(recap.biggestMoment ? [recap.biggestMoment] : []), ...(recap.legend ? [`MVP: ${recap.legend}`] : []), ...(recap.stamps.length ? [`Stamps: ${recap.stamps.join(' · ')}`] : [])].slice(0, 4),
    footer: `Seed ${run.seed} · Pocket Raiders`,
  };
}
