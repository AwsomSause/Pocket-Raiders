// Kice (2026-11-16): when one of a story's two Pokémon joins you, the other one may join your rival.
// Pidgey's Resolve: you own the Pidgeot -> Fearow may join the rival. Poli-Pond: you own the Poliwag -> Burl the Poliwhirl may.
// The roll has its own seeded stream (never the gameplay stream), so it changes no other roll. A joined Pokémon goes onto the
// rival's permanent record (`rival.caught`), which every later rival team reads (stepIn.ts withCaughtMembers).

import type { Content } from '../contentSchema';
import { hashSeed, Rng } from '../rng';
import type { RunState } from '../state';
import type { Rival } from '../story/schema';
import { mainRival } from './questlines';

/** Onto the rival's permanent record (the same list stepIn.ts recordRivalCatch writes; not imported, to keep this file out of its import cycle). */
const recordRivalCatch = (rival: Rival, speciesId: string, level: number, at: string): void => {
  rival.caught = [...(rival.caught ?? []), { speciesId, level, at }];
};

/** The chance that the story's other Pokémon goes to the rival. */
export const RIVAL_EVENT_RECRUIT = { chance: 0.5 } as const;

const LINES: Record<string, (rival: string) => string> = {
  fearow: (r) => `Far off, the Fearow turns in the wind once more, and then follows a different road. Word reaches you later: ${r} has been seen with a Fearow that never stops watching the sky.`,
  poliwhirl: (r) => `Burl watches the Poliwag leave with you. He looks at the pond, then at the road. Word reaches you later: ${r} has been seen with a big Poliwhirl that holds the reeds back for nobody.`,
};

const STORIES: Record<string, string> = { sky: 'fearow', pond: 'poliwhirl' };
const flagOf = (key: string): string => `ev:rival-recruit-${key}`;
const partyLevel = (run: RunState): number => Math.max(1, Math.round(run.party.reduce((n, m) => n + m.level, 0) / Math.max(1, run.party.length)));

/**
 * Rolls once per story (`key`). On a hit the species joins the main rival's team for the rest of the run; if no rival has
 * been met yet it is owed (flag 2) and joins when the rival's next team is built (settleRivalRecruits). Returns the line to show, or ''.
 */
export function rivalMayRecruit(content: Content, run: RunState, speciesId: string, key: string): string {
  const flag = flagOf(key);
  if (run.story.flags[flag] !== undefined || !content.species.has(speciesId)) return '';
  const hit = new Rng(hashSeed(`${run.seed}::rival-recruit::${key}`)).float() < RIVAL_EVENT_RECRUIT.chance;
  run.story.flags[flag] = hit ? 2 : 0;
  if (!hit) return '';
  const rival = mainRival(run);
  if (!rival) return '';
  run.story.flags[flag] = 1;
  recordRivalCatch(rival, speciesId, partyLevel(run), `${run.regionIndex}.${run.stage?.index ?? 0}`);
  return (LINES[speciesId] ?? ((r: string) => `${r} has a new Pokémon.`))(rival.name);
}

/** A rival's team is being built: a Pokémon owed since before any rival was met joins the main rival now. */
export function settleRivalRecruits(content: Content, run: RunState): void {
  const rival = mainRival(run);
  if (!rival) return;
  for (const [key, speciesId] of Object.entries(STORIES)) {
    if (run.story.flags[flagOf(key)] !== 2 || !content.species.has(speciesId)) continue;
    run.story.flags[flagOf(key)] = 1;
    recordRivalCatch(rival, speciesId, partyLevel(run), `${run.regionIndex}.${run.stage?.index ?? 0}`);
  }
}
